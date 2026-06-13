import pool from '../db/index';

async function main() {
  try {
    await pool.query('DELETE FROM games WHERE "gameNumber" = 25');
    console.log('Successfully deleted game 25');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
