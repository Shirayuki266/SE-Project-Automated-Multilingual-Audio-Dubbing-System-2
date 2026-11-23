import 'dotenv/config';
import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'vietnam_quoc_tu';

if (!mongoUri || mongoUri.trim() === '') {
  console.error('[MongoDB test] MONGODB_URI is not configured.');
  process.exit(1);
}

let client: MongoClient | undefined;

try {
  const connectionUrl = new URL(mongoUri);
  const username = decodeURIComponent(connectionUrl.username) || '(not specified)';
  console.log(
    `[MongoDB test] Connecting with username="${username}" host="${connectionUrl.host}" database="${dbName}"`,
  );

  client = new MongoClient(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 7000,
  });
  await client.connect();
  await client.db(dbName).command({ ping: 1 });
  console.log('OK');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[MongoDB test] Connection failed: ${message}`);
  process.exitCode = 1;
} finally {
  if (client) {
    await client.close();
  }
}
