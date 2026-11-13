import { MongoClient, Db, Collection } from 'mongodb';

export class MongoDatabaseManager {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  public isConnectedToRemote: boolean = false;
  private initPromise: Promise<boolean> | null = null;

  public async initClient(): Promise<boolean> {
    if (this.initPromise) return this.initPromise;

    const mongoUri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME || 'vietnam_quoc_tu';

    if (!mongoUri || mongoUri.includes('username:password') || mongoUri.trim() === '') {
      console.warn('[MongoDB] MONGODB_URI is not configured in .env');
      this.isConnectedToRemote = false;
      this.initPromise = Promise.resolve(false);
      return false;
    }

    this.initPromise = (async () => {
      try {
        this.client = new MongoClient(mongoUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 7000,
        });

        await this.client.connect();
        this.db = this.client.db(dbName);
        this.isConnectedToRemote = true;

        // Ensure Core Indexes
        await this.db.collection('pois').createIndex({ location: '2dsphere' }, { background: true });
        await this.db.collection('pois').createIndex({ code: 1 }, { unique: true });
        await this.db.collection('poi_translations').createIndex({ poi_id: 1, language_code: 1 }, { unique: true });
        
        // Ensure daily_visits collection with compound unique index & TTL index
        await this.db.collection('daily_visits').createIndex({ day: 1, visitorHash: 1 }, { unique: true });
        // TTL index: MongoDB automatically drops documents after 86400 seconds (24h)
        await this.db.collection('daily_visits').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

        console.log(`[MongoDB] Connected successfully to "${dbName}". Indexes verified (2dsphere, unique compound, TTL 24h).`);
        return true;
      } catch (err: any) {
        console.error(`[MongoDB] Connection failed: ${err.message}`);
        this.isConnectedToRemote = false;
        return false;
      }
    })();

    return this.initPromise;
  }

  public getDb(): Db | null {
    return this.db;
  }

  public getCollection<T extends Record<string, any>>(name: string): Collection<T> | null {
    return this.db ? this.db.collection<T>(name) : null;
  }

  public async pingLatency(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
    if (!this.db) {
      return { connected: false, latencyMs: -1, error: 'Database not initialized' };
    }
    const start = Date.now();
    try {
      await this.db.command({ ping: 1 });
      const latencyMs = Date.now() - start;
      return { connected: true, latencyMs };
    } catch (err: any) {
      return { connected: false, latencyMs: -1, error: err.message };
    }
  }

  public async checkHealth(): Promise<{
    connected: boolean;
    provider: string;
    database: string;
    latencyMs: number;
    url: string | null;
    geoIndexActive: boolean;
    collections: string[];
  }> {
    const dbName = process.env.MONGODB_DB_NAME || 'vietnam_quoc_tu';
    const mongoUri = process.env.MONGODB_URI;
    const standardCollections = ['campuses', 'pois', 'poi_translations', 'poi_media', 'admin_users', 'daily_visits'];

    if (!this.client || !this.db) {
      return {
        connected: false,
        provider: 'MongoDB Atlas',
        database: dbName,
        latencyMs: -1,
        url: null,
        geoIndexActive: false,
        collections: standardCollections,
      };
    }

    try {
      const ping = await this.pingLatency();
      const collections = await this.db.listCollections().toArray();
      const collectionNames = collections.map((c) => c.name);

      return {
        connected: ping.connected,
        provider: 'Remote MongoDB Atlas',
        database: dbName,
        latencyMs: ping.latencyMs,
        url: mongoUri ? mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : null,
        geoIndexActive: true,
        collections: collectionNames.length > 0 ? collectionNames : standardCollections,
      };
    } catch (err: any) {
      return {
        connected: false,
        provider: 'Remote MongoDB Atlas',
        database: dbName,
        latencyMs: -1,
        url: null,
        geoIndexActive: false,
        collections: standardCollections,
      };
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnectedToRemote = false;
    }
  }
}

export const mongoManager = new MongoDatabaseManager();
