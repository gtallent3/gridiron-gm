// lib/excel.ts
import * as XLSX from "xlsx";

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
  const headers = rawHeaders.map(h => (h === "" ? "@" : h)); // blank column = home/away

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

/** Scoring using normalized headers */
function ptsPassing(r: any) {
  const yds  = num(r.Yds);
  const td   = num(r.TD);
  const ints = num(r.Int ?? r.INT ?? r.Interceptions);
  return yds * SCORING.passYds + td * SCORING.passTD + ints * SCORING.passInt;
}
function ptsRushing(r: any) {
  const yds = num(r.Yds);
  const td  = num(r.TD);
  const fml = num(r.FmbLost ?? r.FL ?? r["Fumbles Lost"]);
  return yds * SCORING.rushYds + td * SCORING.rushTD + fml * SCORING.fumLost;
}
function ptsReceiving(r: any) {
  const rec = num(r.Rec ?? r.Receptions);
  const yds = num(r.Yds);
  const td  = num(r.TD);
  const fml = num(r.FmbLost ?? r.FL ?? r["Fumbles Lost"]);
  return rec * SCORING.rec + yds * SCORING.recYds + td * SCORING.recTD + fml * SCORING.fumLost;
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
  const byKey = new Map<string, { name: string; team: string; opp?: string; pos?: string; total: number }>();

  const add = (rows: any[], kind: "pass" | "rush" | "recv") => {
    for (const r of rows) {
      const { name, team, opp, pos } = who(r);
      if (!name || !team) continue;
      const key = `${name}|${team}`;
      const cur = byKey.get(key) || { name, team, opp, pos, total: 0 };

      if (kind === "pass") cur.total += ptsPassing(r);
      if (kind === "rush") cur.total += ptsRushing(r);
      if (kind === "recv") cur.total += ptsReceiving(r);

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
      const pts = (p ? ptsPassing(p) : 0) + (r ? ptsRushing(r) : 0) + (c ? ptsReceiving(c) : 0);
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
    });
  }

  out.sort((a, b) => b.projected - a.projected);
  return out;
}
