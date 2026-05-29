import fs from 'fs';
import path from 'path';
import { db } from '../index';

export async function runMigrations(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) UNIQUE NOT NULL,
      run_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const sqlDir = path.join(__dirname, 'sql');
  const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await db.query('SELECT 1 FROM migrations WHERE filename = $1', [file]);
    if (rows.length > 0) continue;

    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
    await db.query(sql);
    await db.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
    console.log(`Migration applied: ${file}`);
  }
}
