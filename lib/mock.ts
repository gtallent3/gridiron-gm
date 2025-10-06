import { Player, Ranking } from './types'
export const players: Player[] = [
  { id: 'p1', name: 'Nico Collins', pos: 'WR', team: 'HOU', opp: 'CIN', conf: 78 },
  { id: 'p2', name: "De'Von Achane", pos: 'RB', team: 'MIA', opp: 'NYJ', conf: 70 },
  { id: 'p3', name: 'Calvin Ridley', pos: 'WR', team: 'TEN', opp: 'IND', conf: 58 },
];
export const roster: Player[] = [
  { id: 'r1', name: 'Puka Nacua', pos: 'WR', team: 'LAR', val: 88 },
  { id: 'r2', name: 'Josh Jacobs', pos: 'RB', team: 'GB', val: 82 },
  { id: 'r3', name: "De'Von Achane", pos: 'RB', team: 'MIA', val: 86 },
  { id: 'r4', name: 'George Pickens', pos: 'WR', team: 'DAL', val: 80 },
];
export const league: Player[] = [
  { id: 'o1', name: 'A.J. Brown', pos: 'WR', team: 'PHI', val: 92 },
  { id: 'o2', name: 'Saquon Barkley', pos: 'RB', team: 'PHI', val: 91 },
  { id: 'o3', name: 'Deebo Samuel', pos: 'WR', team: 'SF', val: 87 },
  { id: 'o4', name: 'James Cook', pos: 'RB', team: 'BUF', val: 79 },
];
export const weekly: Record<string, Ranking[]> = {
  QB: [
    { rank: 1, name: 'Josh Allen', team: 'BUF', opp: '@NYJ', tier: 'S' },
    { rank: 2, name: 'Patrick Mahomes', team: 'KC', opp: 'vs LAC', tier: 'S' },
    { rank: 3, name: 'Jalen Hurts', team: 'PHI', opp: '@DAL', tier: 'A' },
    { rank: 4, name: 'C.J. Stroud', team: 'HOU', opp: 'vs CIN', tier: 'A' },
  ],
  RB: [
    { rank: 1, name: 'Christian McCaffrey', team: 'SF', opp: 'vs ARI', tier: 'S' },
    { rank: 2, name: 'Bijan Robinson', team: 'ATL', opp: '@TB', tier: 'S' },
    { rank: 3, name: 'Saquon Barkley', team: 'PHI', opp: '@WAS', tier: 'A' },
    { rank: 4, name: "De'Von Achane", team: 'MIA', opp: 'vs NYJ', tier: 'A' },
  ],
  WR: [
    { rank: 1, name: 'Justin Jefferson', team: 'MIN', opp: 'vs GB', tier: 'S' },
    { rank: 2, name: 'CeeDee Lamb', team: 'DAL', opp: 'vs PHI', tier: 'S' },
    { rank: 3, name: 'Tyreek Hill', team: 'MIA', opp: '@NYJ', tier: 'S' },
    { rank: 4, name: 'Puka Nacua', team: 'LAR', opp: '@SEA', tier: 'A' },
  ],
  TE: [
    { rank: 1, name: 'Travis Kelce', team: 'KC', opp: 'vs LAC', tier: 'S' },
    { rank: 2, name: 'Sam LaPorta', team: 'DET', opp: '@CHI', tier: 'A' },
    { rank: 3, name: 'Mark Andrews', team: 'BAL', opp: 'vs PIT', tier: 'A' },
    { rank: 4, name: 'Dalton Kincaid', team: 'BUF', opp: '@NYJ', tier: 'B' },
  ],
};
