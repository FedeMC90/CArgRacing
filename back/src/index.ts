import app from './app';
import { connectDb } from './db';
import { runMigrations } from './db/migrations/runner';
import { config } from './config';

async function main() {
  await connectDb();
  await runMigrations();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
