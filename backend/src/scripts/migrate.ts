import fs from 'fs/promises';
import path from 'path';
import pool from '../db/index';
import { Game, Player, BattingLine, PitchingLine } from '../types';

const DATA_DIR = path.join(__dirname, '../../../data');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const PLAYERS_FILE = path.join(DATA_DIR, 'players.json');
const BATTING_FILE = path.join(DATA_DIR, 'batting.json');
const PITCHING_FILE = path.join(DATA_DIR, 'pitching.json');

async function readJson<T>(filePath: string, defaultVal: T): Promise<T> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return defaultVal;
  }
}

async function migrate() {
  console.log('Starting migration from JSON to PostgreSQL...');

  const players = await readJson<Player[]>(PLAYERS_FILE, []);
  const games = await readJson<Game[]>(GAMES_FILE, []);
  const batting = await readJson<BattingLine[]>(BATTING_FILE, []);
  const pitching = await readJson<PitchingLine[]>(PITCHING_FILE, []);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log(`Migrating ${players.length} players...`);
    for (const p of players) {
      await client.query(
        `INSERT INTO players (id, name, number, positions) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
        [p.id, p.name, p.number, p.positions]
      );
    }

    console.log(`Migrating ${games.length} games...`);
    for (const g of games) {
      await client.query(
        `INSERT INTO games (id, date, opponent, "ourScore", "opponentScore", result, "gameNumber") VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [g.id, g.date, g.opponent, g.ourScore, g.opponentScore, g.result, g.gameNumber]
      );
    }

    console.log(`Migrating ${batting.length} batting lines...`);
    for (const b of batting) {
      await client.query(
        `INSERT INTO batting_lines ("gameId", "playerId", "AB", "R", "H", "RBI", "BB", "SO", "doubles", "triples", "HR", "TB", "SB", "CS", "HBP")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) ON CONFLICT DO NOTHING`,
        [b.gameId, b.playerId, b.AB, b.R, b.H, b.RBI, b.BB, b.SO, b.doubles, b.triples, b.HR, b.TB, b.SB, b.CS, b.HBP]
      );
    }

    console.log(`Migrating ${pitching.length} pitching lines...`);
    for (const p of pitching) {
      await client.query(
        `INSERT INTO pitching_lines ("gameId", "playerId", "IP", "H", "R", "ER", "BB", "SO", "HBP", "pitches", "strikes", "BF", "WP")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
        [p.gameId, p.playerId, p.IP, p.H, p.R, p.ER, p.BB, p.SO, p.HBP, p.pitches, p.strikes, p.BF, p.WP]
      );
    }

    await client.query('COMMIT');
    console.log('Migration complete!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch(() => process.exit(1));
}
