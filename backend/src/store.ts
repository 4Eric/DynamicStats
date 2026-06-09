import fs from 'fs/promises';
import path from 'path';
import { Game, Player, BattingLine, PitchingLine } from './types';

const DATA_DIR = path.join(__dirname, '../../data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const BATTING_FILE = path.join(DATA_DIR, 'batting.json');
const PITCHING_FILE = path.join(DATA_DIR, 'pitching.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

async function readJson<T>(filePath: string, defaultVal: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return defaultVal;
  }
}

async function writeJson(filePath: string, data: any) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getGames(): Promise<Game[]> {
  return readJson<Game[]>(GAMES_FILE, []);
}

export async function getPlayers(): Promise<Player[]> {
  return readJson<Player[]>(PLAYERS_FILE, []);
}

export async function savePlayer(player: Player) {
  const players = await getPlayers();
  const index = players.findIndex(p => p.id === player.id);
  if (index >= 0) players[index] = player;
  else players.push(player);
  await writeJson(PLAYERS_FILE, players);
}

export async function getBattingLines(): Promise<BattingLine[]> {
  return readJson<BattingLine[]>(BATTING_FILE, []);
}

export async function getPitchingLines(): Promise<PitchingLine[]> {
  return readJson<PitchingLine[]>(PITCHING_FILE, []);
}

export async function saveGame(game: Game) {
  const games = await getGames();
  const index = games.findIndex(g => g.id === game.id);
  if (index >= 0) games[index] = game;
  else games.push(game);
  await writeJson(GAMES_FILE, games);
}

export async function saveBattingLines(lines: BattingLine[]) {
  let allLines = await readJson<BattingLine[]>(BATTING_FILE, []);
  if (lines.length === 0) return;
  const gameId = lines[0].gameId;
  allLines = allLines.filter(l => l.gameId !== gameId); // remove old lines for this game
  allLines.push(...lines);
  await writeJson(BATTING_FILE, allLines);
}

export async function savePitchingLines(lines: PitchingLine[]) {
  let allLines = await readJson<PitchingLine[]>(PITCHING_FILE, []);
  if (lines.length === 0) return;
  const gameId = lines[0].gameId;
  allLines = allLines.filter(l => l.gameId !== gameId); // remove old lines for this game
  allLines.push(...lines);
  await writeJson(PITCHING_FILE, allLines);
}
