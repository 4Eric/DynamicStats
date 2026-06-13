import pool from '../db/index';

async function main() {
  const client = await pool.connect();
  
  // Mapping of primary player ID to a list of duplicate IDs that should be merged into it
  const merges: Record<string, string[]> = {
    // E Swantee (37)
    'd7843658-e25b-491f-9b93-7361677a387b': [
      'f1cb2852-6e73-4395-86fc-5fe2dd2b5fa2', // E Swant
      '81f451e2-08e9-4e8f-8f88-e464961bccac'  // E Swant...
    ],
    // J Olafson (33)
    '5b8e4a68-5103-41b2-b9bd-5f2a62a5dee8': [
      'e5c169c1-22f8-420f-b4a9-0c011f12c281', // J Olafso
      '820eabbf-08ee-4f7b-bb2a-df5537a86980'  // J Olafso...
    ],
    // M Saunders (30)
    'd053126e-793b-42c9-aad5-109d53daeeea': [
      'cdeefa43-a2d0-41b2-8b72-108db0bd0ade', // M Saun
      '5c6e47f2-2eca-4090-a590-ae70a317c917'  // M Saun...
    ]
  };

  try {
    await client.query('BEGIN');
    
    for (const [primaryId, duplicateIds] of Object.entries(merges)) {
      for (const dupId of duplicateIds) {
        console.log(`Merging ${dupId} into ${primaryId}`);
        // Update batting lines
        await client.query(`UPDATE batting_lines SET "playerId" = $1 WHERE "playerId" = $2`, [primaryId, dupId]);
        // Update pitching lines
        await client.query(`UPDATE pitching_lines SET "playerId" = $1 WHERE "playerId" = $2`, [primaryId, dupId]);
        // Delete the duplicate player
        await client.query(`DELETE FROM players WHERE id = $1`, [dupId]);
      }
    }

    await client.query('COMMIT');
    console.log('Merge successful!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error merging players:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
