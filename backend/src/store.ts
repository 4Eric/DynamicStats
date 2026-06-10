import pool from './db/index';
import { Game, Player, BattingLine, PitchingLine } from './types';

export async function getGames(): Promise<Game[]> {
  const result = await pool.query('SELECT * FROM games ORDER BY "gameNumber" DESC');
  return result.rows;
}

export async function getPlayers(): Promise<Player[]> {
  const result = await pool.query('SELECT * FROM players');
  return result.rows;
}

export async function savePlayer(player: Player) {
  await pool.query(
    `INSERT INTO players (id, name, number, positions)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
     name = EXCLUDED.name,
     number = EXCLUDED.number,
     positions = EXCLUDED.positions`,
    [player.id, player.name, player.number, player.positions]
  );
}

export async function getBattingLines(): Promise<BattingLine[]> {
  const result = await pool.query('SELECT * FROM batting_lines');
  return result.rows;
}

export async function getPitchingLines(): Promise<PitchingLine[]> {
  const result = await pool.query('SELECT * FROM pitching_lines');
  return result.rows.map(row => ({
    ...row,
    IP: parseFloat(row.IP)
  }));
}

export async function saveGame(game: Game) {
  await pool.query(
    `INSERT INTO games (id, date, opponent, "ourScore", "opponentScore", result, "gameNumber")
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
     date = EXCLUDED.date,
     opponent = EXCLUDED.opponent,
     "ourScore" = EXCLUDED."ourScore",
     "opponentScore" = EXCLUDED."opponentScore",
     result = EXCLUDED.result,
     "gameNumber" = EXCLUDED."gameNumber"`,
    [game.id, game.date, game.opponent, game.ourScore, game.opponentScore, game.result, game.gameNumber]
  );
}

export async function saveBattingLines(lines: BattingLine[]) {
  if (lines.length === 0) return;
  const gameId = lines[0].gameId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Remove old lines for this game
    await client.query('DELETE FROM batting_lines WHERE "gameId" = $1', [gameId]);
    
    // Insert new lines
    for (const line of lines) {
      await client.query(
        `INSERT INTO batting_lines (
          "gameId", "playerId", "AB", "R", "H", "RBI", "BB", "SO", "doubles", "triples", "HR", "TB", "SB", "CS", "HBP"
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          line.gameId, line.playerId, 
          line.AB || 0, line.R || 0, line.H || 0, line.RBI || 0, line.BB || 0, line.SO || 0,
          line.doubles || 0, line.triples || 0, line.HR || 0, line.TB || 0, line.SB || 0, line.CS || 0, line.HBP || 0
        ]
      );
    }
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function savePitchingLines(lines: PitchingLine[]) {
  if (lines.length === 0) return;
  const gameId = lines[0].gameId;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Remove old lines for this game
    await client.query('DELETE FROM pitching_lines WHERE "gameId" = $1', [gameId]);
    
    // Insert new lines
    for (const line of lines) {
      await client.query(
        `INSERT INTO pitching_lines (
          "gameId", "playerId", "IP", "H", "R", "ER", "BB", "SO", "HBP", "pitches", "strikes", "BF", "WP"
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          line.gameId, line.playerId, 
          line.IP || 0, line.H || 0, line.R || 0, line.ER || 0, line.BB || 0, line.SO || 0,
          line.HBP || 0, line.pitches || 0, line.strikes || 0, line.BF || 0, line.WP || 0
        ]
      );
    }
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}
