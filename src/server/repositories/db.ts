import {
  Campus,
  POIEntity,
  POITranslation,
  POIMedia,
  AdminUser,
  RichPOI,
} from '../types.js';
import { calculateHaversineDistance } from '../../utils/geo.js';
import { hashPassword } from '../../utils/cryptoUtils.js';
import { mongoManager } from './mongoClient.js';
import { rawSeedPOIs } from './seedPOIs.js';

export { calculateHaversineDistance };

const seedCampus: Campus = {
  campus_id: 'vnqt-campus-01',
  name: 'Việt Nam Quốc Tự',
  address: '244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh',
  center_latitude: 10.77125,
  center_longitude: 106.6714,
  description_vi: 'Trung tâm hành chính - văn hóa tâm linh Phật giáo TP. Hồ Chí Minh, ngôi đại tự tiêu biểu cho tinh thần bất khuất vì đạo pháp và dân tộc.',
  description_en: 'Spiritual and cultural hub of Vietnamese Buddhism in Ho Chi Minh City, an iconic sanctuary of Buddhist resilience and peace.',
  map_image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  created_at: new Date().toISOString(),
};

class MongoDatabaseEngine {
  private campuses: Map<string, Campus> = new Map();
  private pois: Map<string, POIEntity> = new Map();
  private translations: Map<string, POITranslation> = new Map();
  private media: Map<string, POIMedia> = new Map();
  private adminUsers: Map<string, AdminUser> = new Map();

  constructor() {
    this.seedDatabase();
  }

  public async syncWithMongoDB(): Promise<void> {
    if (!mongoManager.isConnectedToRemote) {
      await mongoManager.initClient();
    }
    if (!mongoManager.isConnectedToRemote) {
      return;
    }

    try {
      const colCampuses = mongoManager.getCollection<Campus>('campuses');
      const colPois = mongoManager.getCollection<POIEntity>('pois');
      const colTrans = mongoManager.getCollection<POITranslation>('poi_translations');
      const colMedia = mongoManager.getCollection<POIMedia>('poi_media');
      const colAdmins = mongoManager.getCollection<AdminUser>('admin_users');

      if (!colPois) return;

      const remotePoiCount = await colPois.countDocuments();
      if (remotePoiCount === 0) {
        console.log('[MongoDB] Remote database is empty. Auto-seeding initial collections to MongoDB Atlas...');
        if (colCampuses) {
          await colCampuses.deleteMany({});
          await colCampuses.insertOne(seedCampus);
        }
        if (colAdmins) {
          const seedAdmin: AdminUser = {
            user_id: 'adm-001',
            username: 'admin',
            password_hash: hashPassword('vnqt@2026'),
            full_name: 'Ban Trị Sự Việt Nam Quốc Tự',
            created_at: new Date().toISOString(),
          };
          await colAdmins.deleteMany({});
          await colAdmins.insertOne(seedAdmin);
        }
        const poiDocs: POIEntity[] = [];
        const transDocs: POITranslation[] = [];
        const mediaDocs: POIMedia[] = [];

        rawSeedPOIs.forEach((item) => {
          poiDocs.push({
            ...item.poi,
            location: {
              type: 'Point',
              coordinates: [item.poi.longitude, item.poi.latitude],
            },
          });
          Object.entries(item.translations).forEach(([lang, data]) => {
            transDocs.push({
              translation_id: `trans-${item.poi.poi_id}-${lang}`,
              poi_id: item.poi.poi_id,
              language_code: lang,
              title: data.title,
              introduction: data.intro || (data.desc.length > 100 ? data.desc.slice(0, data.desc.indexOf('.') > 0 ? data.desc.indexOf('.') + 1 : 100) : data.desc),
              description: data.desc,
              audio_url: data.audioUrl || undefined,
              is_ai_generated: false,
            });
          });
          item.media.forEach((m, mIdx) => {
            mediaDocs.push({
              media_id: `media-${item.poi.poi_id}-${mIdx + 1}`,
              poi_id: item.poi.poi_id,
              image_url: m.url,
              caption_vi: m.caption_vi,
              caption_en: m.caption_en,
              display_order: mIdx + 1,
            });
          });
        });

        if (poiDocs.length > 0) await colPois.insertMany(poiDocs);
        if (transDocs.length > 0 && colTrans) await colTrans.insertMany(transDocs);
        if (mediaDocs.length > 0 && colMedia) await colMedia.insertMany(mediaDocs);
        console.log(`[MongoDB] Initial dataset (${poiDocs.length} POIs) successfully seeded to MongoDB Atlas.`);
      }

      // Sync data from remote MongoDB into cache
      if (colCampuses) {
        const remoteCampuses = await colCampuses.find({}).toArray();
        if (remoteCampuses.length > 0) {
          this.campuses.clear();
          remoteCampuses.forEach((c) => this.campuses.set(c.campus_id, c));
        }
      }
      const remotePois = await colPois.find({}).toArray();
      if (remotePois.length > 0) {
        this.pois.clear();
        remotePois.forEach((p) => this.pois.set(p.poi_id, p));
      }
      if (colTrans) {
        const remoteTrans = await colTrans.find({}).toArray();
        if (remoteTrans.length > 0) {
          this.translations.clear();
          remoteTrans.forEach((t) => this.translations.set(`${t.poi_id}_${t.language_code.toLowerCase()}`, t));
        }
      }
      if (colMedia) {
        const remoteMedia = await colMedia.find({}).toArray();
        if (remoteMedia.length > 0) {
          this.media.clear();
          remoteMedia.forEach((m) => this.media.set(m.media_id, m));
        }
      }
      if (colAdmins) {
        const remoteAdmins = await colAdmins.find({}).toArray();
        if (remoteAdmins.length > 0) {
          this.adminUsers.clear();
          remoteAdmins.forEach((a) => this.adminUsers.set(a.user_id, a));
        }
      }
      console.log(`[MongoDB] Operational sync complete (${this.pois.size} POIs, ${this.translations.size} translations active from MongoDB).`);
    } catch (err: any) {
      console.warn('[MongoDB] Sync notice:', err.message);
    }
  }

  private seedDatabase() {
    this.campuses.set(seedCampus.campus_id, seedCampus);

    const seedAdmin: AdminUser = {
      user_id: 'adm-001',
      username: 'admin',
      password_hash: hashPassword('vnqt@2026'),
      full_name: 'Ban Trị Sự Việt Nam Quốc Tự',
      created_at: new Date().toISOString(),
    };
    this.adminUsers.set(seedAdmin.user_id, seedAdmin);

    rawSeedPOIs.forEach((item) => {
      const poiWithGeoJSON: POIEntity = {
        ...item.poi,
        location: {
          type: 'Point',
          coordinates: [item.poi.longitude, item.poi.latitude],
        },
      };
      this.pois.set(item.poi.poi_id, poiWithGeoJSON);

      Object.entries(item.translations).forEach(([lang, data]) => {
        const transId = `trans-${item.poi.poi_id}-${lang}`;
        const transRecord: POITranslation = {
          translation_id: transId,
          poi_id: item.poi.poi_id,
          language_code: lang,
          title: data.title,
          introduction: data.intro || (data.desc.length > 100 ? data.desc.slice(0, data.desc.indexOf('.') > 0 ? data.desc.indexOf('.') + 1 : 100) : data.desc),
          description: data.desc,
          audio_url: data.audioUrl || undefined,
          is_ai_generated: false,
          is_manually_edited: false,
        };
        this.translations.set(`${item.poi.poi_id}_${lang.toLowerCase()}`, transRecord);
      });

      item.media.forEach((m, mIdx) => {
        const mediaId = `media-${item.poi.poi_id}-${mIdx + 1}`;
        this.media.set(mediaId, {
          media_id: mediaId,
          poi_id: item.poi.poi_id,
          image_url: m.url,
          caption_vi: m.caption_vi,
          caption_en: m.caption_en,
          display_order: mIdx + 1,
        });
      });
    });
  }

  // --- Campuses ---
  public getAllCampuses(): Campus[] {
    return Array.from(this.campuses.values());
  }

  public getCampusById(campus_id: string): Campus | undefined {
    return this.campuses.get(campus_id);
  }

  // --- Rich POIs Assembly ---
  private assembleRichPOI(poi: POIEntity): RichPOI {
    const transMap: Record<string, POITranslation> = {};
    for (const [key, trans] of this.translations.entries()) {
      if (trans.poi_id === poi.poi_id) {
        transMap[trans.language_code.toLowerCase()] = trans;
      }
    }

    const mediaList = Array.from(this.media.values())
      .filter((m) => m.poi_id === poi.poi_id)
      .sort((a, b) => a.display_order - b.display_order);

    return {
      ...poi,
      translations: transMap,
      media: mediaList,
    };
  }

  // --- POI Queries & CRUD ---
  public getAllPOIs(): RichPOI[] {
    return Array.from(this.pois.values())
      .map((p) => this.assembleRichPOI(p))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  }

  public getRichPOIById(poi_id: string): RichPOI | null {
    const poi = this.pois.get(poi_id);
    if (!poi) return null;
    return this.assembleRichPOI(poi);
  }

  public createPOI(payload: {
    campus_id?: string;
    code: string;
    category?: POIEntity['category'];
    location_type?: string;
    latitude: number;
    longitude: number;
    geofence_radius?: number;
    display_order?: number;
    image?: string;
    qr_code_url?: string;
    initialTranslation?: {
      title: string;
      intro?: string;
      desc: string;
      lang?: string;
    };
    imageUrl?: string;
  }): RichPOI {
    const poi_id = 'poi-' + Date.now().toString(36);
    const now = new Date().toISOString();

    const newPoi: POIEntity = {
      poi_id,
      campus_id: payload.campus_id || 'vnqt-campus-01',
      code: payload.code,
      category: payload.category || 'hall',
      latitude: Number(payload.latitude),
      longitude: Number(payload.longitude),
      geofence_radius: payload.geofence_radius || 20,
      display_order: payload.display_order || this.pois.size + 1,
      image: payload.image || payload.imageUrl,
      created_at: now,
      updated_at: now,
      location: {
        type: 'Point',
        coordinates: [Number(payload.longitude), Number(payload.latitude)],
      },
    };

    this.pois.set(poi_id, newPoi);

    if (mongoManager.isConnectedToRemote) {
      mongoManager.getCollection<POIEntity>('pois')?.insertOne(newPoi).catch((e) => {
        console.warn('[MongoDB] createPOI insert notice:', e.message);
      });
    }

    if (payload.initialTranslation) {
      const transId = `trans-${poi_id}-${payload.initialTranslation.lang || 'vi'}`;
      const transObj: POITranslation = {
        translation_id: transId,
        poi_id,
        language_code: payload.initialTranslation.lang || 'vi',
        title: payload.initialTranslation.title,
        introduction: payload.initialTranslation.intro || (payload.initialTranslation.desc.length > 120 ? payload.initialTranslation.desc.slice(0, 120) : payload.initialTranslation.desc),
        description: payload.initialTranslation.desc,
        audio_url: undefined,
        is_ai_generated: false,
        is_manually_edited: true,
        updated_at: now,
      };
      this.translations.set(`${poi_id}_${payload.initialTranslation.lang || 'vi'}`, transObj);
      if (mongoManager.isConnectedToRemote) {
        mongoManager.getCollection<POITranslation>('poi_translations')?.insertOne(transObj).catch(() => {});
      }
    }

    if (payload.imageUrl || payload.image) {
      const mediaId = `media-${poi_id}-1`;
      const mediaObj: POIMedia = {
        media_id: mediaId,
        poi_id,
        image_url: payload.imageUrl || payload.image || '',
        caption_vi: payload.initialTranslation?.title || 'Hình ảnh điểm chiêm bái',
        caption_en: 'Point of interest view',
        display_order: 1,
      };
      this.media.set(mediaId, mediaObj);
      if (mongoManager.isConnectedToRemote) {
        mongoManager.getCollection<POIMedia>('poi_media')?.insertOne(mediaObj).catch(() => {});
      }
    }

    return this.assembleRichPOI(newPoi);
  }

  public updatePOI(poi_id: string, updates: Partial<POIEntity>): RichPOI | null {
    const existing = this.pois.get(poi_id);
    if (!existing) return null;

    const lat = updates.latitude !== undefined ? Number(updates.latitude) : existing.latitude;
    const lng = updates.longitude !== undefined ? Number(updates.longitude) : existing.longitude;

    const updated: POIEntity = {
      ...existing,
      ...updates,
      latitude: lat,
      longitude: lng,
      location: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      updated_at: new Date().toISOString(),
    };
    this.pois.set(poi_id, updated);

    if (mongoManager.isConnectedToRemote) {
      mongoManager.getCollection<POIEntity>('pois')?.updateOne({ poi_id }, { $set: updated }).catch((e) => {
        console.warn('[MongoDB] updatePOI update notice:', e.message);
      });
    }

    return this.assembleRichPOI(updated);
  }

  public deletePOI(poi_id: string): boolean {
    for (const [key, trans] of this.translations.entries()) {
      if (trans.poi_id === poi_id) this.translations.delete(key);
    }
    for (const [key, m] of this.media.entries()) {
      if (m.poi_id === poi_id) this.media.delete(key);
    }

    if (mongoManager.isConnectedToRemote) {
      mongoManager.getCollection<POIEntity>('pois')?.deleteOne({ poi_id }).catch(() => {});
      mongoManager.getCollection<POITranslation>('poi_translations')?.deleteMany({ poi_id }).catch(() => {});
      mongoManager.getCollection<POIMedia>('poi_media')?.deleteMany({ poi_id }).catch(() => {});
    }

    return this.pois.delete(poi_id);
  }

  // --- Translations Management (Stored in MongoDB poi_translations) ---
  public saveTranslation(trans: POITranslation): void {
    const key = `${trans.poi_id}_${trans.language_code.toLowerCase()}`;
    const cleanTrans: POITranslation = {
      ...trans,
      updated_at: trans.updated_at || new Date().toISOString(),
    };
    this.translations.set(key, cleanTrans);

    if (mongoManager.isConnectedToRemote) {
      mongoManager.getCollection<POITranslation>('poi_translations')?.updateOne(
        { poi_id: trans.poi_id, language_code: trans.language_code.toLowerCase() },
        { $set: cleanTrans },
        { upsert: true }
      ).catch((e) => {
        console.warn('[MongoDB] saveTranslation notice:', e.message);
      });
    }
  }

  public getTranslation(poi_id: string, lang: string): POITranslation | undefined {
    return this.translations.get(`${poi_id}_${lang.toLowerCase()}`);
  }

  // --- Media Management ---
  public addMedia(m: Omit<POIMedia, 'media_id'>): POIMedia {
    const media_id = 'media-' + Date.now().toString(36);
    const record: POIMedia = { ...m, media_id };
    this.media.set(media_id, record);

    if (mongoManager.isConnectedToRemote) {
      mongoManager.getCollection<POIMedia>('poi_media')?.insertOne(record).catch(() => {});
    }

    return record;
  }

  public deleteMedia(media_id: string): boolean {
    if (mongoManager.isConnectedToRemote) {
      mongoManager.getCollection<POIMedia>('poi_media')?.deleteOne({ media_id }).catch(() => {});
    }
    return this.media.delete(media_id);
  }

  // --- Admin User Auth ---
  public getAdminByUsername(username: string): AdminUser | undefined {
    for (const u of this.adminUsers.values()) {
      if (u.username.toLowerCase() === username.toLowerCase()) return u;
    }
    return undefined;
  }

  public updateAdminLastLogin(user_id: string): void {
    const user = this.adminUsers.get(user_id);
    if (user) {
      user.last_login = new Date().toISOString();
      this.adminUsers.set(user_id, user);
      if (mongoManager.isConnectedToRemote) {
        mongoManager.getCollection<AdminUser>('admin_users')?.updateOne(
          { user_id },
          { $set: { last_login: user.last_login } }
        ).catch(() => {});
      }
    }
  }
}

export { MongoDatabaseEngine, MongoDatabaseEngine as RelationalDatabaseEngine };
export const db = new MongoDatabaseEngine();
