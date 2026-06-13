import pool from '../db/index';

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, name, number FROM players ORDER BY name');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
