import pool from './index';

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        number INTEGER NOT NULL,
        positions VARCHAR[] NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id VARCHAR(255) PRIMARY KEY,
        date VARCHAR(255) NOT NULL,
        opponent VARCHAR(255) NOT NULL,
        "ourScore" INTEGER NOT NULL,
        "opponentScore" INTEGER NOT NULL,
        result VARCHAR(10) NOT NULL,
        "gameNumber" INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS batting_lines (
        "gameId" VARCHAR(255) REFERENCES games(id) ON DELETE CASCADE,
        "playerId" VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
        "AB" INTEGER NOT NULL,
        "R" INTEGER NOT NULL,
        "H" INTEGER NOT NULL,
        "RBI" INTEGER NOT NULL,
        "BB" INTEGER NOT NULL,
        "SO" INTEGER NOT NULL,
        "doubles" INTEGER NOT NULL,
        "triples" INTEGER NOT NULL,
        "HR" INTEGER NOT NULL,
        "TB" INTEGER NOT NULL,
        "SB" INTEGER NOT NULL,
        "CS" INTEGER NOT NULL,
        "HBP" INTEGER NOT NULL,
        PRIMARY KEY ("gameId", "playerId")
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS pitching_lines (
        "gameId" VARCHAR(255) REFERENCES games(id) ON DELETE CASCADE,
        "playerId" VARCHAR(255) REFERENCES players(id) ON DELETE CASCADE,
        "IP" DECIMAL NOT NULL,
        "H" INTEGER NOT NULL,
        "R" INTEGER NOT NULL,
        "ER" INTEGER NOT NULL,
        "BB" INTEGER NOT NULL,
        "SO" INTEGER NOT NULL,
        "HBP" INTEGER NOT NULL,
        "pitches" INTEGER NOT NULL,
        "strikes" INTEGER NOT NULL,
        "BF" INTEGER NOT NULL,
        "WP" INTEGER NOT NULL,
        PRIMARY KEY ("gameId", "playerId")
      );
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Failed to initialize database:', e);
    throw e;
  } finally {
    client.release();
  }
}

// If run directly
if (require.main === module) {
  initDb().then(() => process.exit(0)).catch(() => process.exit(1));
}
