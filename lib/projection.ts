// lib/projection.ts
export type Pos = "QB" | "RB" | "WR" | "TE" | "K" | "DEF";
export type Risk = "low" | "med" | "high";

export type GameLine = {
  week: number;
  // core stats (per your excel parser)
  passYds?: number; passTD?: number; ints?: number;
  rushYds?: number; rushTD?: number; fumbles?: number;
  rec?: number; recYds?: number; recTD?: number;
  // context (optional; safe defaults used if missing)
  opp?: string;                 // e.g. "@BUF"
  home?: boolean;               // true if home
  oppRushRank?: number;         // 1 = best defense, 32 = worst
  oppPassRank?: number;
  oppRecRank?: number;
};

export type PlayerSlice = {
  pos: Pos;
  risk: Risk;
  recent: GameLine[];  // newest last; include last 3–5 weeks if you have them
  // optional current-week context:
  thisWeek: {
    oppRushRank?: number;
    oppPassRank?: number;
    oppRecRank?: number;
    home?: boolean;
    injury?: "none" | "questionable" | "doubtful";
    vegasTeamTotal?: number;     // 17–30 typical
  };
};

// --- helpers ---
const nz = (v?: number, d = 0) => (Number.isFinite(v as number) ? (v as number) : d);
const mean = (arr: number[]) => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
const ema = (arr: number[], alpha = 0.6) => {
  if (!arr.length) return 0;
  let m = arr[0];
  for (let i = 1; i < arr.length; i++) m = alpha * arr[i] + (1 - alpha) * m;
  return m;
};
const stdev = (arr: number[]) => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s,x)=>s+(x-m)*(x-m),0)/(arr.length-1));
};

// Your PPR scoring (same as excel.ts)
const PPR = {
  passYds: 0.04, passTD: 4, passInt: -2,
  rushYds: 0.1, rushTD: 6,
  rec: 1, recYds: 0.1, recTD: 6,
  fumLost: -2,
};

export function fantasyFromLine(g: GameLine): number {
  return nz(g.passYds)*PPR.passYds + nz(g.passTD)*PPR.passTD + nz(g.ints)*PPR.passInt
       + nz(g.rushYds)*PPR.rushYds + nz(g.rushTD)*PPR.rushTD + nz(g.fumbles)*PPR.fumLost
       + nz(g.rec)*PPR.rec + nz(g.recYds)*PPR.recYds + nz(g.recTD)*PPR.recTD;
}

// ---- feature builder ----
function features(slice: PlayerSlice) {
  const last = slice.recent.slice(-5);            // up to last 5
  const points = last.map(fantasyFromLine);

  const avg3   = mean(last.slice(-3).map(fantasyFromLine));
  const ema5   = ema(points, 0.55);               // trend-weighted form
  const vol3   = stdev(last.slice(-3).map(fantasyFromLine));
  const last1  = points.length ? points[points.length-1] : 0;
  const trend  = points.length >= 2 ? last1 - points[points.length-2] : 0;

  // crude usage proxies by position
  const recPerG   = mean(last.map(g => nz(g.rec)));
  const rushYdsG  = mean(last.map(g => nz(g.rushYds)));
  const passYdsG  = mean(last.map(g => nz(g.passYds)));

  // matchup factors (lower rank = tougher)
  const { oppRushRank = 16, oppPassRank = 16, oppRecRank = 16, home, injury, vegasTeamTotal } = slice.thisWeek ?? {};
  const rushMatch = (oppRushRank - 16) / 16;  // ~ -1..+1
  const passMatch = (oppPassRank - 16) / 16;
  const recMatch  = (oppRecRank  - 16) / 16;

  return {
    avg3, ema5, vol3, trend, last1,
    recPerG, rushYdsG, passYdsG,
    rushMatch, passMatch, recMatch,
    home: home ? 1 : 0,
    injuryQ: injury === "questionable" ? 1 : 0,
    injuryD: injury === "doubtful" ? 1 : 0,
    vegas: nz(vegasTeamTotal, 22),
  };
}

// ---- position-specific linear model (tunable coefficients) ----
// Start with these, tweak weekly after you compare to actuals.
const COEFFS: Record<Pos, Record<string, number>> = {
  QB: {
    bias: 2.0, ema5: 0.55, avg3: 0.25, trend: 0.20, vol3: -0.10,
    passYdsG: 0.03,                       // yards matter
    rushYdsG: 0.02,                      // Konami code
    passMatch: 1.8,                      // good pass matchup bump
    home: 0.6, vegas: 0.10,
    injuryQ: -1.0, injuryD: -3.0,
  },
  RB: {
    bias: 1.5, ema5: 0.50, avg3: 0.25, trend: 0.20, vol3: -0.08,
    rushYdsG: 0.05, recPerG: 0.35,
    rushMatch: 1.6, recMatch: 0.6,
    home: 0.4, vegas: 0.07,
    injuryQ: -1.2, injuryD: -3.0,
  },
  WR: {
    bias: 1.2, ema5: 0.55, avg3: 0.20, trend: 0.22, vol3: -0.06,
    recPerG: 0.55,                        // targets/rec volume
    recMatch: 1.4, passMatch: 0.6,
    home: 0.3, vegas: 0.06,
    injuryQ: -1.0, injuryD: -2.5,
  },
  TE: {
    bias: 0.8, ema5: 0.50, avg3: 0.20, trend: 0.18, vol3: -0.05,
    recPerG: 0.50, recMatch: 1.2, passMatch: 0.5,
    home: 0.3, vegas: 0.05,
    injuryQ: -0.8, injuryD: -2.0,
  },
  K:  { bias: 6 },      // keep simple unless you add drive/FG features
  DEF:{ bias: 6 },
};

export function projectPoints(slice: PlayerSlice): number {
  const f = features(slice);
  const w = COEFFS[slice.pos] ?? COEFFS.WR;

  // dot product of known features that have a weight
  let y =
    (w.bias ?? 0) +
    (w.ema5 ?? 0) * f.ema5 +
    (w.avg3 ?? 0) * f.avg3 +
    (w.trend ?? 0) * f.trend +
    (w.vol3 ?? 0) * f.vol3 +
    (w.recPerG ?? 0) * f.recPerG +
    (w.rushYdsG ?? 0) * f.rushYdsG +
    (w.passYdsG ?? 0) * f.passYdsG +
    (w.rushMatch ?? 0) * f.rushMatch +
    (w.passMatch ?? 0) * f.passMatch +
    (w.recMatch ?? 0) * f.recMatch +
    (w.home ?? 0) * f.home +
    (w.vegas ?? 0) * f.vegas +
    (w.injuryQ ?? 0) * f.injuryQ +
    (w.injuryD ?? 0) * f.injuryD;

  // gentle regression to player’s 8-week mean if you have longer history
  // (skip if you don’t — this is safe as 0)
  const longMean = mean(slice.recent.map(fantasyFromLine));
  y = 0.85 * y + 0.15 * longMean;

  // floor to 0, round to 0.1 for display
  return Math.max(0, Math.round(y * 10) / 10);
}