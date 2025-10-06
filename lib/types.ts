export type Player = { id: string; name: string; pos: 'QB'|'RB'|'WR'|'TE'; team: string; opp?: string; val?: number; conf?: number }
export type Ranking = { rank: number; name: string; team: string; opp: string; tier: 'S'|'A'|'B' }
