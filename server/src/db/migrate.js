import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run all SQL migration files in order.
 */
async function migrate() {
  const sqlDir = path.join(__dirname, '..', '..', 'sql');
  const files = fs.readdirSync(sqlDir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf-8');
    await query(sql);
    console.log(`  ✓ ${file} applied`);
  }

  console.log('All migrations complete.');
}

// Run if called directly
migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
