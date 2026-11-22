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

        // Dọn dẹp triệt để bất kỳ collection dư thừa nào - Hệ thống chỉ giữ đúng 6 collections chuẩn:
        // 1. campuses, 2. pois, 3. poi_translations, 4. poi_media, 5. admin_users, 6. daily_visits
        await this.cleanupExtraneousCollections();

        // Ensure Core Indexes for exactly 6 collections
        await this.db.collection('pois').createIndex({ location: '2dsphere' }, { background: true });
        await this.db.collection('pois').createIndex({ code: 1 }, { unique: true });
        await this.db.collection('poi_translations').createIndex({ poi_id: 1, language_code: 1 }, { unique: true });
        
        // Ensure daily_visits collection with compound unique index & TTL index 24h
        await this.db.collection('daily_visits').createIndex({ day: 1, visitorHash: 1 }, { unique: true });
        await this.db.collection('daily_visits').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });

        // Indexes for campuses, admin_users, poi_media
        await this.db.collection('admin_users').createIndex({ username: 1 }, { unique: true });
        await this.db.collection('campuses').createIndex({ campus_id: 1 }, { unique: true });
        await this.db.collection('poi_media').createIndex({ poi_id: 1, display_order: 1 });

        console.log(`[MongoDB] Connected successfully to "${dbName}". Verified 6 standard collections & indexes (2dsphere, unique compound, TTL 24h).`);
        return true;
      } catch (err: any) {
        console.error(`[MongoDB] Connection failed: ${err.message}`);
        this.isConnectedToRemote = false;
        this.initPromise = null;
        return false;
      }
    })();

    return this.initPromise;
  }

  public static readonly STANDARD_COLLECTIONS = [
    'campuses',
    'pois',
    'poi_translations',
    'poi_media',
    'admin_users',
    'daily_visits',
  ] as const;

  /**
   * Dọn dẹp tất cả các collection dư thừa khỏi MongoDB database vietnam_quoc_tu.
   * Chỉ giữ duy nhất đúng 6 collections chuẩn.
   */
  public async cleanupExtraneousCollections(): Promise<{ dropped: string[]; kept: string[] }> {
    if (!this.db) return { dropped: [], kept: [] };
    const allowed = new Set<string>(MongoDatabaseManager.STANDARD_COLLECTIONS);
    const existing = await this.db.listCollections().toArray();
    const dropped: string[] = [];
    const kept: string[] = [];

    for (const col of existing) {
      if (col.name.startsWith('system.')) continue;
      if (!allowed.has(col.name)) {
        try {
          await this.db.collection(col.name).drop();
          console.log(`[MongoDB Cleanup] Dropped extraneous collection: "${col.name}"`);
          dropped.push(col.name);
        } catch (dropErr: any) {
          console.warn(`[MongoDB Cleanup] Failed to drop "${col.name}":`, dropErr.message);
        }
      } else {
        kept.push(col.name);
      }
    }
    return { dropped, kept };
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
