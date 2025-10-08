// app/api/players/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { loadWorkbookFromHttp } from "@/lib/loadWorkbook";
import { projectPoints, type PlayerSlice } from "@/lib/projection";

/* ---------------- small utils ---------------- */
const num = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const firstNum = (obj: any, keys: string[], d = 0) => {
  for (const k of keys) if (obj && obj[k] != null && obj[k] !== "") return num(obj[k], d);
  return d;
};
const initialsOf = (name: string) =>
  String(name || "").trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const riskFromPts = (p: number) => (p >= 16 ? "low" : p >= 9 ? "med" : "high") as "low" | "med" | "high";
const isStartable = (p: number) => p >= 10;

/* --------------- workbook readers --------------- */
const pickSheet = (wb: XLSX.WorkBook, candidates: string[]) =>
  candidates.find((n) => wb.SheetNames.includes(n));

function readRows(wb: XLSX.WorkBook, sheetName?: string): any[] {
  if (!sheetName || !wb.Sheets[sheetName]) return [];
  const mat: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true });
  if (!mat.length) return [];

  const isHeaderLike = (row: any[]) => {
    const cells = row.map((c) => (c == null ? "" : String(c).trim()));
    const nonEmpty = cells.filter(Boolean).length;
    return nonEmpty >= 3 && (cells.some((c) => c.toLowerCase() === "player") || cells.some((c) => c.toLowerCase() === "team"));
  };

  let headerIdx = 0;
  for (let i = 0; i < Math.min(mat.length, 6); i++) {
    if (isHeaderLike(mat[i])) { headerIdx = i; break; }
  }

  // de-dup headers (Yds, Yds.1, …) & map blank header to "@"
  const rawHeaders = (mat[headerIdx] || []).map((h) => String(h ?? "").trim());
  const counts: Record<string, number> = {};
  const headers = rawHeaders.map((h) => {
    const base = h === "" ? "@" : h;
    const n = counts[base] ?? 0;
    counts[base] = n + 1;
    return n === 0 ? base : `${base}.${n}`;
  });

  const out: any[] = [];
  for (let r = headerIdx + 1; r < mat.length; r++) {
    const row = mat[r] || [];
    const obj: any = {};
    for (let c = 0; c < headers.length; c++) obj[headers[c] ?? `col_${c}`] = row[c];
    const hasData = Object.values(obj).some((v) => v != null && String(v).trim() !== "");
    if (hasData) out.push(obj);
  }
  return out;
}

// case-insensitive field getter
const getCI = (row: any, ...candidates: string[]) => {
  if (!row) return undefined;
  const keys = Object.keys(row);
  for (const want of candidates) {
    const k = keys.find((kk) => kk.toLowerCase() === want.toLowerCase());
    if (k) return row[k];
  }
  return undefined;
};

function who(r: any) {
  const name = getCI(r, "Player", "Name") ?? "";
  const team = getCI(r, "Team", "Tm") ?? "";
  const at = String(getCI(r, "@", "HomeAway", "Venue") ?? "").trim();
  const oppCode = getCI(r, "Opp", "Opponent", "Def") ?? "";
  const opp = oppCode ? `${at === "@" || at === "at" ? "@" : ""}${oppCode}` : "";
  const pos = getCI(r, "Pos.", "Pos", "Position") ?? "";
  return { name, team, opp, pos };
}

/* ---------------- position handling ---------------- */
type Pos = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
const normalizePos = (p?: string): Pos | undefined => {
  const s = String(p || "").trim().toUpperCase();
  if (!s) return undefined;
  if (s.startsWith("QB")) return "QB";
  if (s.startsWith("RB")) return "RB";
  if (s.startsWith("WR")) return "WR";
  if (s.startsWith("TE")) return "TE";
  if (s === "K") return "K";
  if (s === "DEF" || s === "DST" || s === "D/ST") return "DEF";
  if (s === "FB" || s === "HB") return "RB";
  if (s === "WR/TE" || s === "TE/WR") return "WR";
  return undefined;
};
const rowPos = (r: any) => getCI(r, "Pos.", "Pos", "Position");

function inferPosition(wb: XLSX.WorkBook, name: string, team: string, week: number, lookback = 4): Pos {
  const sheetFor = (w: number) => ({
    pass: readRows(wb, pickSheet(wb, [`Passing W${w}`, `Passing Week ${w}`])),
    rush: readRows(wb, pickSheet(wb, [`Rushing W${w}`, `Rushing Week ${w}`])),
    recv: readRows(wb, pickSheet(wb, [`Receiving W${w}`, `Receiving Week ${w}`])),
  });

  const cur = sheetFor(week);
  const pr = cur.pass.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
  const rr = cur.rush.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
  const cr = cur.recv.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));

  let pos =
    normalizePos(rowPos(pr)) ??
    normalizePos(rowPos(rr)) ??
    normalizePos(rowPos(cr));
  if (pos) return pos;

  for (let w = Math.max(1, week - lookback); w < week && !pos; w++) {
    const past = sheetFor(w);
    const ppr = past.pass.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
    const prr = past.rush.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
    const pcr = past.recv.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
    pos =
      normalizePos(rowPos(ppr)) ??
      normalizePos(rowPos(prr)) ??
      normalizePos(rowPos(pcr));
    if (pos) return pos;
  }

  if (pr) return "QB";
  if (rr && !cr) return "RB";
  if (cr) return normalizePos(rowPos(cr)) === "TE" ? "TE" : "WR";
  return "WR";
}

/* ---------------- scoring (PPR) ---------------- */
const PPR = { passYds: 0.04, passTD: 4, passInt: -2, rushYds: 0.1, rushTD: 6, rec: 1, recYds: 0.1, recTD: 6, fumLost: -2 };
const pointsFromParts = (p: any) =>
  num(p.passYds) * PPR.passYds + num(p.passTD) * PPR.passTD + num(p.ints) * PPR.passInt +
  num(p.rushYds) * PPR.rushYds + num(p.rushTD) * PPR.rushTD + num(p.fumbles) * PPR.fumLost +
  num(p.rec) * PPR.rec + num(p.recYds) * PPR.recYds + num(p.recTD) * PPR.recTD;

/* --------------- actual week points --------------- */
function actualForWeek(
  wb: XLSX.WorkBook,
  name: string,
  team: string,
  week: number
): null | { points: number; stats: any } {
  const passName = pickSheet(wb, [`Passing W${week}`, `Passing Week ${week}`]);
  const rushName = pickSheet(wb, [`Rushing W${week}`, `Rushing Week ${week}`]);
  const recvName = pickSheet(wb, [`Receiving W${week}`, `Receiving Week ${week}`]);

  const passing = readRows(wb, passName);
  const rushing = readRows(wb, rushName);
  const receiving = readRows(wb, recvName);

  const pr = passing.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
  const rr = rushing.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
  const cr = receiving.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
  if (!pr && !rr && !cr) return null;

  const parts = {
    passYds: pr ? firstNum(pr, ["Yds", "PassYds", "Pass Yds"], 0) : 0,
    passTD:  pr ? firstNum(pr, ["TD", "PassTD", "Pass TD"], 0) : 0,
    ints:    pr ? firstNum(pr, ["Int", "INT", "Interceptions", "Int."], 0) : 0,
    rushYds: (pr ? firstNum(pr, ["RushYds", "RushingYds", "Rushing Yds", "Yds.2"], 0) : 0) +
             (rr ? firstNum(rr, ["Yds", "RushYds", "RushingYds"], 0) : 0),
    rushTD:  (pr ? firstNum(pr, ["RushTD", "RushingTD", "Rushing TD"], 0) : 0) +
             (rr ? firstNum(rr, ["TD", "RushTD", "RushingTD"], 0) : 0),
    fumbles: (pr ? firstNum(pr, ["FmbLost", "FL", "Fumbles Lost", "Fumbles"], 0) : 0) +
             (rr ? firstNum(rr, ["FmbLost", "FL", "Fumbles Lost"], 0) : 0),
    rec:     cr ? firstNum(cr, ["Rec", "Receptions"], 0) : 0,
    recYds:  cr ? firstNum(cr, ["Yds", "RecYds"], 0) : 0,
    recTD:   cr ? firstNum(cr, ["TD", "RecTD"], 0) : 0,
  };

  return { points: Number(pointsFromParts(parts).toFixed(1)), stats: parts };
}

/* ---------------- schedule loader & index ---------------- */
async function loadScheduleWorkbook(baseUrl: string): Promise<XLSX.WorkBook> {
  const url = new URL("/data/team-schedules.xlsx", baseUrl).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch team-schedules.xlsx: ${res.status} ${res.statusText}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  return XLSX.read(buf, { type: "array" });
}

// Normalize any schedule cell to "@BUF" or "BUF" (or "BYE")
function normalizeOppCell(val: any): string | undefined {
  if (val == null || String(val).trim() === "") return undefined;
  const s = String(val).trim();
  if (/bye/i.test(s)) return "BYE"; // accept any "bye" text
  const away = /^@/.test(s) || (/\bat\b/i.test(s) && !/\bvs\b/i.test(s));
  const m = s.toUpperCase().match(/([A-Z]{2,4})\b(?!.*[A-Z])/);
  const code = m ? m[1] : s.toUpperCase().replace(/^@/, "").trim();
  if (!code) return undefined;
  return away || s.startsWith("@") ? `@${code.replace(/^@/, "")}` : code;
}

/**
 * Build (team, week) => opp map.
 * Works with wide sheets like: TEAM, W1, W2, … W18; or long format (Team, Week, Opp[, @]).
 */
function buildScheduleIndex(wb: XLSX.WorkBook) {
  const idx = new Map<string, Map<number, string>>();
  const toKey = (s: string) => String(s || "").trim().toUpperCase();

  const weekHeaderToNumber = (h: string): number | undefined => {
    const s = String(h || "").trim();
    // W1 / WK1 / Week1 / W 1 / Week 1
    const m = s.match(/^(?:wk|w|week)\s*\.?\s*(\d{1,2})$/i);
    if (m) return Number(m[1]);
    const m2 = s.match(/^w(\d{1,2})$/i) || s.match(/^wk(\d{1,2})$/i) || s.match(/^week(\d{1,2})$/i);
    if (m2) return Number(m2[1]);
    return undefined;
  };

  for (const sheetName of wb.SheetNames) {
    const rows = readRows(wb, sheetName);
    if (!rows.length) continue;

    const headers = Object.keys(rows[0] || {});
    const hasTeam = headers.some((k) => k.toLowerCase() === "team" || k.toLowerCase() === "tm" || k.toLowerCase() === "team.");
    if (!hasTeam) continue;

    // WIDE FORMAT
    const wideCols: Array<{ header: string; week: number }> = [];
    for (const h of headers) {
      const w = weekHeaderToNumber(h);
      if (Number.isFinite(w as number)) wideCols.push({ header: h, week: Number(w) });
    }

    if (wideCols.length) {
      for (const r of rows) {
        // >>> FIX: read TEAM in any casing <<<
        const team = toKey(getCI(r, "TEAM", "Team", "Tm"));
        if (!team) continue;
        if (!idx.has(team)) idx.set(team, new Map());
        const weeks = idx.get(team)!;

        for (const { header, week } of wideCols) {
          const oppRaw = r[header];
          const opp = normalizeOppCell(oppRaw);
          if (!opp) continue;
          weeks.set(week, opp);
        }
      }
      continue;
    }

    // LONG FORMAT
    const hasWeek = headers.some((h) => h.toLowerCase() === "week");
    const hasOpp = headers.some((h) => ["opp", "opponent", "opp."].includes(h.toLowerCase()));
    if (hasWeek && hasOpp) {
      for (const r of rows) {
        const team = toKey(getCI(r, "TEAM", "Team", "Tm"));
        const w = Number(getCI(r, "Week"));
        if (!team || !Number.isFinite(w)) continue;

        let opp = normalizeOppCell(getCI(r, "Opp", "Opponent", "Opp."));
        if (!opp) {
          const ha = String(getCI(r, "@", "HomeAway", "Venue") ?? "").trim();
          const code = String(getCI(r, "Opp", "Opponent", "Opp.") ?? "").trim();
          if (code) opp = normalizeOppCell(`${ha || ""} ${code}`.trim());
        }

        if (!opp) continue;
        if (!idx.has(team)) idx.set(team, new Map());
        idx.get(team)!.set(w, opp);
      }
      continue;
    }
  }

  const oppFor = (team: string, week: number): string | undefined => {
    const key = toKey(team);
    return idx.get(key)?.get(week);
  };

  return { oppFor };
}

/* --------------- recent lines for projection --------------- */
export type GameLine = {
  week: number;
  passYds?: number; passTD?: number; ints?: number;
  rushYds?: number; rushTD?: number; fumbles?: number;
  rec?: number; recYds?: number; recTD?: number;
  opp?: string; home?: boolean;
};

function recentGameLinesFor(
  wb: XLSX.WorkBook,
  name: string,
  team: string,
  targetWeek: number,
  scheduleOppFor?: (t: string, w: number) => string | undefined,
  lookback = 5
): GameLine[] {
  const startWeek = Math.max(1, targetWeek - lookback);
  const lines: GameLine[] = [];

  for (let w = startWeek; w < targetWeek; w++) {
    const passName = pickSheet(wb, [`Passing W${w}`, `Passing Week ${w}`]);
    const rushName = pickSheet(wb, [`Rushing W${w}`, `Rushing Week ${w}`]);
    const recvName = pickSheet(wb, [`Receiving W${w}`, `Receiving Week ${w}`]);

    const passing = readRows(wb, passName);
    const rushing = readRows(wb, rushName);
    const receiving = readRows(wb, recvName);

    const pr = passing.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
    const rr = rushing.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
    const cr = receiving.find((r) => (getCI(r, "Player", "Name") === name) && (getCI(r, "Team", "Tm") === team));
    if (!pr && !rr && !cr) continue;

    let opp = scheduleOppFor?.(team, w) ?? who(pr ?? rr ?? cr).opp ?? undefined;
    const line: GameLine = { week: w, opp, home: opp ? !String(opp).startsWith("@") : undefined };

    if (pr) {
      line.passYds = firstNum(pr, ["Yds", "PassYds", "Pass Yds"], 0);
      line.passTD = firstNum(pr, ["TD", "PassTD", "Pass TD"], 0);
      line.ints = firstNum(pr, ["Int", "INT", "Interceptions", "Int."], 0);
      line.rushYds = num(line.rushYds, 0) + firstNum(pr, ["RushYds", "RushingYds", "Rushing Yds", "Yds.2"], 0);
      line.rushTD = num(line.rushTD, 0) + firstNum(pr, ["RushTD", "RushingTD", "Rushing TD"], 0);
      line.fumbles = num(line.fumbles, 0) + firstNum(pr, ["FmbLost", "FL", "Fumbles Lost", "Fumbles"], 0);
    }
    if (rr) {
      line.rushYds = num(line.rushYds, 0) + firstNum(rr, ["Yds", "RushYds", "RushingYds"], 0);
      line.rushTD = num(line.rushTD, 0) + firstNum(rr, ["TD", "RushTD", "RushingTD"], 0);
      line.fumbles = num(line.fumbles, 0) + firstNum(rr, ["FmbLost", "FL", "Fumbles Lost"], 0);
    }
    if (cr) {
      line.rec = num(line.rec, 0) + firstNum(cr, ["Rec", "Receptions"], 0);
      line.recYds = num(line.recYds, 0) + firstNum(cr, ["Yds", "RecYds"], 0);
      line.recTD = num(line.recTD, 0) + firstNum(cr, ["TD", "RecTD"], 0);
    }

    lines.push(line);
  }

  return lines;
}

/* --------------- collect relevant players --------------- */
function collectPlayers(
  wb: XLSX.WorkBook,
  week: number,
  lookback = 5
): Array<{ name: string; team: string; pos?: string }> {
  const seen = new Map<string, { name: string; team: string; pos?: string }>();

  const gatherWeek = (w: number) => {
    const pass = readRows(wb, pickSheet(wb, [`Passing W${w}`, `Passing Week ${w}`]));
    const rush = readRows(wb, pickSheet(wb, [`Rushing W${w}`, `Rushing Week ${w}`]));
    const recv = readRows(wb, pickSheet(wb, [`Receiving W${w}`, `Receiving Week ${w}`]));
    [pass, rush, recv].forEach((rows) => {
      rows.forEach((r) => {
        const { name, team, pos } = who(r);
        if (!name || !team) return;
        const key = `${name}|${team}`;
        const cur = seen.get(key) || { name, team };
        if (!cur.pos && pos) cur.pos = pos;
        seen.set(key, cur);
      });
    });
  };

  gatherWeek(week);
  for (let w = Math.max(1, week - lookback); w < week; w++) gatherWeek(w);

  return Array.from(seen.values());
}

/* --------------------------- API handler --------------------------- */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const week = Number(url.searchParams.get("week") || "1");

  try {
    const statsWb = await loadWorkbookFromHttp(url.origin);

    // SCHEDULE (now robust to TEAM/Team/Tm)
    const scheduleWb = await loadScheduleWorkbook(url.origin);
    const { oppFor } = buildScheduleIndex(scheduleWb);

    const universe = collectPlayers(statsWb, week, 5);
    const defenseRank = { rush: 16, pass: 16 };

    const players = universe.map((base) => {
      const actual = actualForWeek(statsWb, base.name, base.team, week);

      const pos: Pos =
        normalizePos(base.pos) ??
        inferPosition(statsWb, base.name, base.team, week, 4) ??
        "WR";

      // Opponent strictly from schedule (fixed TEAM case)
      const oppRaw = oppFor(base.team, week);
      const opp = oppRaw ?? "";

      // BYE short-circuit (force 0 projection)
      if (opp && opp.toUpperCase() === "BYE") {
        const initials = initialsOf(base.name);
        const w3 = Math.max(1, week - 3);
        const sparkPrev = [w3, w3 + 1, w3 + 2].filter((w) => w < week).map((w) => {
          const a = actualForWeek(statsWb, base.name, base.team, w);
          return a ? a.points : 0;
        });

        return {
          id: `${base.name}|${base.team}`,
          name: base.name,
          initials,
          team: base.team,
          pos,
          opp: "BYE",
          risk: "med",
          projected: 0,
          startable: false,
          spark: [...sparkPrev, 0],
          stats: {
            passYds: 0, passTD: 0, ints: 0,
            rushYds: 0, rushTD: 0, fumbles: 0,
            rec: 0, recYds: 0, recTD: 0,
          },
          source: "bye" as const,
        };
      }

      const initials = initialsOf(base.name);
      let projected = 0;
      let source: "actual" | "projected" = "projected";
      let stats: any = {
        passYds: 0, passTD: 0, ints: 0,
        rushYds: 0, rushTD: 0, fumbles: 0,
        rec: 0, recYds: 0, recTD: 0,
      };

      if (actual) {
        projected = actual.points;
        stats = { ...stats, ...actual.stats };
        source = "actual";
      } else {
        const recent = recentGameLinesFor(statsWb, base.name, base.team, week, oppFor);
        const slice: PlayerSlice = {
          pos,
          risk: "med",
          recent,
          thisWeek: {
            oppRushRank: defenseRank.rush,
            oppPassRank: defenseRank.pass,
            oppRecRank: defenseRank.pass,
            home: opp ? !opp.startsWith("@") : undefined,
            injury: "none",
            vegasTeamTotal: 22,
          },
        };
        projected = projectPoints(slice);
      }

      const risk = riskFromPts(projected);
      const startable = isStartable(projected);

      // spark = last up-to-3 actual weeks + current (actual/projected)
      const w3 = Math.max(1, week - 3);
      const sparkWeeks = [w3, w3 + 1, w3 + 2].filter((w) => w < week);
      const sparkVals: number[] = [];
      for (const w of sparkWeeks) {
        const a = actualForWeek(statsWb, base.name, base.team, w);
        sparkVals.push(a ? a.points : 0);
      }
      sparkVals.push(Number(projected.toFixed(1)));

      return {
        id: `${base.name}|${base.team}`,
        name: base.name,
        initials,
        team: base.team,
        pos,
        opp, // from schedule (or "")
        risk,
        projected: Number(projected.toFixed(1)),
        startable,
        spark: sparkVals,
        stats,
        source,
      };
    });

    players.sort((a, b) => b.projected - a.projected);
    return NextResponse.json({ ok: true, week, players }, { status: 200 });
  } catch (err: any) {
    console.error("players API error:", err);
    return NextResponse.json({ ok: false, message: err?.message || "Unknown error" }, { status: 500 });
  }
}
