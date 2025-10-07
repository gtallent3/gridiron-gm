// lib/excel.ts
import * as XLSX from "xlsx";

/** Component stats returned to the UI */
export type StatBreakdown = {
  passYds: number; passTD: number; ints: number;
  rushYds: number; rushTD: number; fumbles: number;
  rec: number; recYds: number; recTD: number;
};

/** Shape returned to the UI */
export type PlayerOut = {
  id: string;
  name: string;
  initials: string;
  team: string;
  pos: "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
  opp: string;                  // e.g. "@BUF"
  risk: "low" | "med" | "high"; // simple tiering from projected
  projected: number;            // total PPR for the week
  startable: boolean;           // projected >= threshold
  spark: number[];              // last few weeks incl. this one
  stats: StatBreakdown;         // component stats for the week
};

/** ---- PPR scoring ---- */
const SCORING = {
  passYds: 0.04,  // 1 / 25
  passTD: 4,
  passInt: -2,
  rushYds: 0.1,   // 1 / 10
  rushTD: 6,
  rec: 1,         // full PPR
  recYds: 0.1,
  recTD: 6,
  fumLost: -2,
};

/* ----------------- small helpers ----------------- */
const num = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

const firstNum = (obj: any, keys: string[], d = 0) => {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== "") return num(obj[k], d);
  }
  return d;
};

const initialsOf = (name: string) =>
  name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();

function asPos(p?: string): PlayerOut["pos"] {
  const s = String(p || "").toUpperCase();
  if (s.startsWith("QB")) return "QB";
  if (s.startsWith("RB")) return "RB";
  if (s.startsWith("WR")) return "WR";
  if (s.startsWith("TE")) return "TE";
  if (s.includes("K")) return "K";
  if (s.includes("DEF")) return "DEF";
  return "WR";
}

function riskFromPts(p: number): PlayerOut["risk"] {
  if (p >= 16) return "low";
  if (p >= 9)  return "med";
  return "high";
}

/**
 * Read a sheet in matrix mode, auto-detect the first real header row,
 * normalize the blank home/away column to '@', and return row objects.
 * Also de-duplicates headers by appending .1, .2, ... so we don't overwrite
 * (e.g., Sports-Ref "Yds" then "Yds.1" for sack yards).
 */
function readRows(workbook: XLSX.WorkBook, sheetName?: string): any[] {
  if (!sheetName || !workbook.Sheets[sheetName]) return [];

  const mat: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    header: 1,
    raw: true,
  });
  if (!mat.length) return [];

  const isHeaderLike = (row: any[]) => {
    const cells = row.map(c => (c == null ? "" : String(c).trim()));
    const nonEmpty = cells.filter(Boolean).length;
    return nonEmpty >= 5 && cells.some(c => c.toLowerCase() === "player") && cells.some(c => c.toLowerCase() === "team");
  };

  let headerIdx = 0;
  for (let i = 0; i < Math.min(mat.length, 5); i++) {
    if (isHeaderLike(mat[i])) { headerIdx = i; break; }
  }

  const rawHeaders = (mat[headerIdx] || []).map(h => String(h ?? "").trim());
  // de-duplicate headers
  const counts: Record<string, number> = {};
  const headers = rawHeaders.map(h => {
    const base = h === "" ? "@" : h;
    const n = counts[base] ?? 0;
    counts[base] = n + 1;
    return n === 0 ? base : `${base}.${n}`;
  });

  const out: any[] = [];
  for (let r = headerIdx + 1; r < mat.length; r++) {
    const row = mat[r] || [];
    const obj: any = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c] ?? `col_${c}`;
      obj[key] = row[c];
    }
    const hasData = Object.values(obj).some(v => v != null && String(v).trim() !== "");
    if (hasData) out.push(obj);
  }
  return out;
}

/** Normalize common identity fields after readRows */
function who(r: any) {
  const name = r.Player ?? r.Name ?? "";
  const team = r.Team ?? r.Tm ?? "";
  const at   = String(r["@"] ?? "").trim();
  const opp  = r.Opp ?? r.Opponent ?? r.Def ?? "";
  const oppStr = opp ? `${at === "@" || at === "at" ? "@" : ""}${opp}` : "";
  const pos  = r["Pos."] ?? r.Pos ?? r.Position ?? "";
  return { name, team, opp: oppStr, pos };
}

/** Return (points, parts) for passing rows; includes QB rushing + fumbles if present */
function ptsPassingWithParts(r: any) {
  // Prefer the FIRST 'Yds' (true pass yards). 'Yds.1' is sack yards on Sports-Ref.
  const passYds = firstNum(r, ["Yds", "PassYds", "Pass Yds"]);
  const passTD  = firstNum(r, ["TD", "PassTD", "Pass TD"]);
  const ints    = firstNum(r, ["Int", "INT", "Interceptions", "Int."]);

  // some passing sheets include these for QBs
  const rushYds = firstNum(r, ["RushYds", "RushingYds", "Rushing Yds", "Yds.2"]);
  const rushTD  = firstNum(r, ["RushTD", "RushingTD", "Rushing TD"]);
  const fumbles = firstNum(r, ["FmbLost", "FL", "Fumbles Lost", "Fumbles"]);

  const pts = passYds*SCORING.passYds + passTD*SCORING.passTD + ints*SCORING.passInt
            + rushYds*SCORING.rushYds + rushTD*SCORING.rushTD + fumbles*SCORING.fumLost;

  return { pts, parts: { passYds, passTD, ints, rushYds, rushTD, fumbles, rec:0, recYds:0, recTD:0 } as StatBreakdown };
}

function ptsRushingWithParts(r: any) {
  const rushYds = firstNum(r, ["Yds", "RushYds", "RushingYds"]);
  const rushTD  = firstNum(r, ["TD", "RushTD", "RushingTD"]);
  const fumbles = firstNum(r, ["FmbLost", "FL", "Fumbles Lost"]);

  const pts = rushYds*SCORING.rushYds + rushTD*SCORING.rushTD + fumbles*SCORING.fumLost;
  return { pts, parts: { passYds:0, passTD:0, ints:0, rushYds, rushTD, fumbles, rec:0, recYds:0, recTD:0 } as StatBreakdown };
}

function ptsReceivingWithParts(r: any) {
  const rec    = firstNum(r, ["Rec", "Receptions"]);
  const recYds = firstNum(r, ["Yds", "RecYds"]);
  const recTD  = firstNum(r, ["TD", "RecTD"]);

  const pts = rec*SCORING.rec + recYds*SCORING.recYds + recTD*SCORING.recTD;
  return { pts, parts: { passYds:0, passTD:0, ints:0, rushYds:0, rushTD:0, fumbles:0, rec, recYds, recTD } as StatBreakdown };
}

/** Pick an existing sheet name from a set of candidates */
function pickSheet(wb: XLSX.WorkBook, candidates: string[]) {
  return candidates.find(n => wb.SheetNames.includes(n));
}

/**
 * Build players for a given week from a pre-loaded workbook.
 * (Your route loads the workbook via HTTP and passes it here.)
 */
export function getPlayersForWeekFromWorkbook(week: number, wb: XLSX.WorkBook): PlayerOut[] {
  const passName = pickSheet(wb, [`Passing W${week}`, `Passing Week ${week}`, `QB W${week}`, `QB Week ${week}`]);
  const rushName = pickSheet(wb, [`Rushing W${week}`, `Rushing Week ${week}`, `RB W${week}`, `RB Week ${week}`]);
  const recvName = pickSheet(wb, [`Receiving W${week}`, `Receiving Week ${week}`, `WR W${week}`, `WR Week ${week}`]);

  const passing   = readRows(wb, passName);
  const rushing   = readRows(wb, rushName);
  const receiving = readRows(wb, recvName);

  // Merge by player|team
  const zeroStats = (): StatBreakdown => ({ passYds:0, passTD:0, ints:0, rushYds:0, rushTD:0, fumbles:0, rec:0, recYds:0, recTD:0 });
  const byKey = new Map<string, { name: string; team: string; opp?: string; pos?: string; total: number; stats: StatBreakdown }>();

  const add = (rows: any[], kind: "pass" | "rush" | "recv") => {
    for (const r of rows) {
      const { name, team, opp, pos } = who(r);
      if (!name || !team) continue;
      const key = `${name}|${team}`;
      const cur = byKey.get(key) || { name, team, opp, pos, total: 0, stats: zeroStats() };

      if (kind === "pass") {
        const { pts, parts } = ptsPassingWithParts(r);
        cur.total += pts;
        for (const k in parts) (cur.stats as any)[k] += (parts as any)[k];
        if (!cur.pos) cur.pos = pos && String(pos).trim() ? pos : "QB"; // QB fallback when Pos missing
      }
      if (kind === "rush") {
        const { pts, parts } = ptsRushingWithParts(r);
        cur.total += pts;
        for (const k in parts) (cur.stats as any)[k] += (parts as any)[k];
      }
      if (kind === "recv") {
        const { pts, parts } = ptsReceivingWithParts(r);
        cur.total += pts;
        for (const k in parts) (cur.stats as any)[k] += (parts as any)[k];
      }

      if (!cur.opp && opp) cur.opp = opp;
      if (!cur.pos && pos) cur.pos = pos;

      byKey.set(key, cur);
    }
  };

  add(passing, "pass");
  add(rushing, "rush");
  add(receiving, "recv");

  // Spark helper: compute points for earlier weeks from the same workbook
  const weekRows = (w: number) => ({
    pass: readRows(wb, pickSheet(wb, [`Passing W${w}`, `Passing Week ${w}`])),
    rush: readRows(wb, pickSheet(wb, [`Rushing W${w}`, `Rushing Week ${w}`])),
    recv: readRows(wb, pickSheet(wb, [`Receiving W${w}`, `Receiving Week ${w}`])),
  });

  const out: PlayerOut[] = [];
  for (const [key, v] of byKey) {
    const [name, team] = key.split("|");

    const sparkWeeks = [week - 3, week - 2, week - 1, week].filter(w => w >= 1);
    const spark = sparkWeeks.map((w) => {
      const wr = weekRows(w);
      const match = (rows: any[]) => rows.find(r => (r.Player ?? r.Name) === name && (r.Team ?? r.Tm) === team);
      const p = match(wr.pass);
      const r = match(wr.rush);
      const c = match(wr.recv);
      const pts = (p ? ptsPassingWithParts(p).pts : 0)
                + (r ? ptsRushingWithParts(r).pts : 0)
                + (c ? ptsReceivingWithParts(c).pts : 0);
      return Number(pts.toFixed(1));
    });

    const projected = Number(v.total.toFixed(1));
    out.push({
      id: key,
      name,
      initials: initialsOf(name),
      team,
      pos: asPos(v.pos),
      opp: v.opp || "",
      risk: riskFromPts(projected),
      projected,
      startable: projected >= 10, // tweak threshold to taste
      spark: spark.length ? spark : [projected],
      stats: v.stats,
    });
  }

  out.sort((a, b) => b.projected - a.projected);
  return out;
}
