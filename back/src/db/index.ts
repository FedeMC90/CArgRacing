import { Pool } from 'pg';
import { config } from '../config';

export const db = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
});

export async function connectDb(): Promise<void> {
  const client = await db.connect();
  client.release();
  console.log(`DB connected: ${config.db.host}:${config.db.port}/${config.db.name}`);
}
