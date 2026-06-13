import pool from './db/index';
import { PoolClient } from 'pg';
import { Game, Player, BattingLine, PitchingLine } from './types';

export async function getGames(): Promise<Game[]> {
  const result = await pool.query('SELECT * FROM games ORDER BY "gameNumber" DESC');
  return result.rows;
}

export async function getPlayers(): Promise<Player[]> {
  const result = await pool.query('SELECT * FROM players');
  return result.rows;
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

// --- Transactional helpers (operate on a shared client) ---

async function savePlayerTx(client: PoolClient, player: Player) {
  await client.query(
    `INSERT INTO players (id, name, number, positions)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
     name = EXCLUDED.name,
     number = EXCLUDED.number`,
    [player.id, player.name, player.number, []]
  );
}

async function saveGameTx(client: PoolClient, game: Game) {
  await client.query(
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

async function saveBattingLinesTx(client: PoolClient, lines: BattingLine[]) {
  if (lines.length === 0) return;
  const gameId = lines[0].gameId;

  await client.query('DELETE FROM batting_lines WHERE "gameId" = $1', [gameId]);

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
}

async function savePitchingLinesTx(client: PoolClient, lines: PitchingLine[]) {
  if (lines.length === 0) return;
  const gameId = lines[0].gameId;

  await client.query('DELETE FROM pitching_lines WHERE "gameId" = $1', [gameId]);

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
}

// --- Public API: single-transaction save for the confirm endpoint ---

interface SaveGameDataParams {
  game: Game;
  battingLines?: any[];
  pitchingLines?: any[];
  existingPlayers: Player[];
  resolvePlayer: (client: PoolClient, line: any, players: Player[]) => Promise<void>;
}

export async function saveGameData(params: SaveGameDataParams) {
  const { game, battingLines, pitchingLines, existingPlayers, resolvePlayer } = params;
  const players = [...existingPlayers]; // mutable copy

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolve players inside the transaction
    if (battingLines?.length) {
      for (const line of battingLines) {
        line.gameId = game.id;
        await resolvePlayer(client, line, players);
      }
    }
    if (pitchingLines?.length) {
      for (const line of pitchingLines) {
        line.gameId = game.id;
        await resolvePlayer(client, line, players);
      }
    }

    // Save game
    await saveGameTx(client, game);

    // Save stat lines
    if (battingLines?.length) {
      await saveBattingLinesTx(client, battingLines);
    }
    if (pitchingLines?.length) {
      await savePitchingLinesTx(client, pitchingLines);
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Keep savePlayerTx accessible for the route's resolvePlayer callback
export { savePlayerTx };

export async function deleteGame(id: string) {
  await pool.query('DELETE FROM games WHERE id = $1', [id]);
}
