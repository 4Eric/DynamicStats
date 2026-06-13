import pool from '../db/index';

async function main() {
  const client = await pool.connect();
  try {
    // Test: simulate what saveGameData does
    await client.query('BEGIN');

    // 1. Insert a test player
    await client.query(
      `INSERT INTO players (id, name, number)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, number = EXCLUDED.number`,
      ['test-player-1', 'Test Player', 99]
    );
    console.log('✓ Player insert OK');

    // 2. Insert a test game
    await client.query(
      `INSERT INTO games (id, date, opponent, "ourScore", "opponentScore", result, "gameNumber")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET date = EXCLUDED.date`,
      ['test-game-1', '2025-06-13', 'Test Team', 5, 3, 'W', 99]
    );
    console.log('✓ Game insert OK');

    // 3. Insert a test batting line
    await client.query(
      `INSERT INTO batting_lines (
        "gameId", "playerId", "AB", "R", "H", "RBI", "BB", "SO", "doubles", "triples", "HR", "TB", "SB", "CS", "HBP"
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      ['test-game-1', 'test-player-1', 3, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
    );
    console.log('✓ Batting line insert OK');

    // Rollback so we don't pollute the DB
    await client.query('ROLLBACK');
    console.log('\n✓ All operations succeeded (rolled back test data)');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n✗ ERROR:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
