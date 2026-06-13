export interface Player {
  id: string;
  name: string;
  number: number;
}

export interface Game {
  id: string;
  date: string;
  opponent: string;
  ourScore: number;
  opponentScore: number;
  result: 'W' | 'L' | 'T';
  gameNumber: number;
}

export interface BattingLine {
  gameId: string;
  playerId: string;
  AB: number;
  R: number;
  H: number;
  RBI: number;
  BB: number;
  SO: number;
  doubles: number;
  triples: number;
  HR: number;
  TB: number;
  SB: number;
  CS: number;
  HBP: number;
}

export interface PitchingLine {
  gameId: string;
  playerId: string;
  IP: number; // Stored as decimal (e.g. 1.2 = 1 2/3)
  H: number;
  R: number;
  ER: number;
  BB: number;
  SO: number;
  HBP: number;
  pitches: number;
  strikes: number;
  BF: number;
  WP: number;
}
