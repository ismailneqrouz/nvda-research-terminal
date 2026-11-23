import { readFileSync } from 'node:fs';
import path from 'node:path';
import { closePool, getPool } from '../lib/db/postgres';

export async function migrate(connectionString = process.env.DATABASE_URL) {
  const db = await getPool(connectionString);
  const sql = readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await db.query(sql);
}

if (require.main === module) {
  migrate()
    .then(() => console.log('✓ schema applied'))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(closePool);
}
