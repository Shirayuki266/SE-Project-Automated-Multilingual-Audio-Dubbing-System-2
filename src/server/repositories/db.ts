import {
  Campus,
  POIEntity,
  POITranslation,
  POIMedia,
  AdminUser,
  RichPOI,
  PilgrimageLog,
  PilgrimageStats,
} from '../types.js';
import { calculateHaversineDistance } from '../../utils/geo.js';
import { hashPassword } from '../../utils/cryptoUtils.js';

export { calculateHaversineDistance };

// Initial Campuses Seed
const seedCampus: Campus = {
  campus_id: 'vnqt-campus-01',
  name: 'Việt Nam Quốc Tự',
  address: '244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh',
  center_latitude: 10.77125,
  center_longitude: 106.67140,
  description_vi: 'Trung tâm hành chính - văn hóa tâm linh Phật giáo TP. Hồ Chí Minh, ngôi đại tự tiêu biểu cho tinh thần bất khuất vì đạo pháp và dân tộc.',
  description_en: 'Spiritual and cultural hub of Vietnamese Buddhism in Ho Chi Minh City, an iconic sanctuary of Buddhist resilience and peace.',
  map_image_url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
  created_at: new Date().toISOString(),
};

import { rawSeedPOIs } from './seedPOIs.js';

class MongoDatabaseEngine {
  private campuses: Map<string, Campus> = new Map();
  private pois: Map<string, POIEntity> = new Map();
  private translations: Map<string, POITranslation> = new Map();
  private media: Map<string, POIMedia> = new Map();
  private adminUsers: Map<string, AdminUser> = new Map();
  private pilgrimageLogs: PilgrimageLog[] = [];

  constructor() {
    this.seedDatabase();
  }

  private seedDatabase() {
    // 1. Campus
    this.campuses.set(seedCampus.campus_id, seedCampus);

    // 2. Admin User (username: "admin", password: "vnqt@2026")
    const seedAdmin: AdminUser = {
      user_id: 'adm-001',
      username: 'admin',
      password_hash: hashPassword('vnqt@2026'),
      full_name: 'Ban Trị Sự Việt Nam Quốc Tự',
      created_at: new Date().toISOString(),
    };
    this.adminUsers.set(seedAdmin.user_id, seedAdmin);

    // 3. POIs, Translations & Media (MongoDB Document Format with GeoJSON 2dsphere Point)
    rawSeedPOIs.forEach((item, index) => {
      const poiWithGeoJSON: POIEntity = {
        ...item.poi,
        location: {
          type: 'Point',
          coordinates: [item.poi.longitude, item.poi.latitude], // GeoJSON standard [lng, lat]
        },
      };
      this.pois.set(item.poi.poi_id, poiWithGeoJSON);

      // Translations
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
        };
        this.translations.set(`${item.poi.poi_id}_${lang}`, transRecord);
      });

      // Media
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

  public getCampusById(id: string): Campus | undefined {
    return this.campuses.get(id);
  }

  // --- POIs (Relational Joins) ---
  public getAllRichPOIs(campusId?: string): RichPOI[] {
    let poiList = Array.from(this.pois.values());
    if (campusId) {
      poiList = poiList.filter((p) => p.campus_id === campusId);
    }

    return poiList.map((poi) => this.assembleRichPOI(poi));
  }

  public getRichPOIById(idOrCode: string): RichPOI | undefined {
    let entity = this.pois.get(idOrCode);
    if (!entity) {
      // Find by code
      for (const p of this.pois.values()) {
        if (p.code.toUpperCase() === idOrCode.toUpperCase()) {
          entity = p;
          break;
        }
      }
    }
    return entity ? this.assembleRichPOI(entity) : undefined;
  }

  private assembleRichPOI(poi: POIEntity): RichPOI {
    // Collect translations
    const translationsMap: Record<string, POITranslation> = {};
    for (const [key, trans] of this.translations.entries()) {
      if (trans.poi_id === poi.poi_id) {
        translationsMap[trans.language_code] = trans;
      }
    }

    // Collect media
    const mediaList = Array.from(this.media.values())
      .filter((m) => m.poi_id === poi.poi_id)
      .sort((a, b) => a.display_order - b.display_order);

    const viTrans = translationsMap['vi'] || Object.values(translationsMap)[0];

    return {
      ...poi,
      translations: translationsMap,
      media: mediaList,
      currentTitle: viTrans?.title || poi.code,
      currentIntroduction: viTrans?.introduction,
      currentDescription: viTrans?.description,
      currentAudioUrl: viTrans?.audio_url,
    };
  }

  // --- Spatial Query ---
  public findNearbyPOIs(
    lat: number,
    lng: number,
    campusId?: string
  ): Array<{ poi: RichPOI; distanceMeters: number; isWithinGeofence: boolean }> {
    const list = this.getAllRichPOIs(campusId);
    return list
      .map((poi) => {
        const dist = calculateHaversineDistance(lat, lng, poi.latitude, poi.longitude);
        return {
          poi,
          distanceMeters: Math.round(dist * 10) / 10,
          isWithinGeofence: dist <= poi.geofence_radius,
        };
      })
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }

  // --- Admin CRUD for POIs ---
  public createPOI(
    data: Omit<POIEntity, 'poi_id' | 'created_at'>,
    initialTranslation?: { title: string; desc: string; lang: string },
    imageUrl?: string
  ): RichPOI {
    const poi_id = 'poi-' + Date.now().toString(36);
    const newPoi: POIEntity = {
      ...data,
      poi_id,
      location: {
        type: 'Point',
        coordinates: [data.longitude, data.latitude],
      },
      created_at: new Date().toISOString(),
    };
    this.pois.set(poi_id, newPoi);

    // Initial translation (e.g. Vietnamese)
    if (initialTranslation) {
      const transId = `trans-${poi_id}-${initialTranslation.lang || 'vi'}`;
      this.translations.set(`${poi_id}_${initialTranslation.lang || 'vi'}`, {
        translation_id: transId,
        poi_id,
        language_code: initialTranslation.lang || 'vi',
        title: initialTranslation.title,
        introduction: initialTranslation.desc.slice(0, 100),
        description: initialTranslation.desc,
        audio_url: undefined,
        is_ai_generated: false,
      });
    }

    // Initial Media
    if (imageUrl) {
      const mediaId = `media-${poi_id}-1`;
      this.media.set(mediaId, {
        media_id: mediaId,
        poi_id,
        image_url: imageUrl,
        caption_vi: initialTranslation?.title || 'Hình ảnh điểm chiêm bái',
        caption_en: 'Point of interest view',
        display_order: 1,
      });
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
    };
    this.pois.set(poi_id, updated);
    return this.assembleRichPOI(updated);
  }

  public deletePOI(poi_id: string): boolean {
    // Cascade delete translations and media
    for (const [key, trans] of this.translations.entries()) {
      if (trans.poi_id === poi_id) this.translations.delete(key);
    }
    for (const [key, m] of this.media.entries()) {
      if (m.poi_id === poi_id) this.media.delete(key);
    }
    return this.pois.delete(poi_id);
  }

  // --- Translations Management ---
  public saveTranslation(trans: POITranslation): void {
    const key = `${trans.poi_id}_${trans.language_code.toLowerCase()}`;
    this.translations.set(key, trans);
  }

  public getTranslation(poi_id: string, lang: string): POITranslation | undefined {
    return this.translations.get(`${poi_id}_${lang.toLowerCase()}`);
  }

  // --- Media Management ---
  public addMedia(m: Omit<POIMedia, 'media_id'>): POIMedia {
    const media_id = 'media-' + Date.now().toString(36);
    const record: POIMedia = { ...m, media_id };
    this.media.set(media_id, record);
    return record;
  }

  public deleteMedia(media_id: string): boolean {
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
    }
  }

  // --- Anti-Spam Fingerprinting & Analytics ---
  public recordPilgrimage(
    fingerprintHash: string,
    language: string,
    userAgent?: string,
    ipHash?: string
  ): { isNewToday: boolean; log: PilgrimageLog } {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    const existingToday = this.pilgrimageLogs.find(
      (log) => log.fingerprintHash === fingerprintHash && log.dateStr === dateStr
    );

    const log: PilgrimageLog = {
      id: 'plg-' + Date.now().toString(36),
      fingerprintHash,
      language,
      timestamp: now.toISOString(),
      dateStr,
      userAgent,
      ipHash,
    };
    this.pilgrimageLogs.push(log);

    return { isNewToday: !existingToday, log };
  }

  public getStats(): PilgrimageStats {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayLogs = this.pilgrimageLogs.filter((l) => l.dateStr === todayStr);

    const todayUniquePilgrims = new Set(todayLogs.map((l) => l.fingerprintHash)).size;
    const allTimeUniquePilgrims = new Set(this.pilgrimageLogs.map((l) => l.fingerprintHash)).size;

    const langCounts: Record<string, number> = {};
    this.pilgrimageLogs.forEach((l) => {
      langCounts[l.language] = (langCounts[l.language] || 0) + 1;
    });
    const topLanguages = Object.entries(langCounts)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    const hourlyCounts: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyCounts[h] = 0;
    todayLogs.forEach((l) => {
      const hour = new Date(l.timestamp).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });
    const hourlyActivity = Object.entries(hourlyCounts).map(([h, count]) => ({
      hour: parseInt(h, 10),
      count,
    }));

    const topPois = Array.from(this.pois.values()).map((p) => {
      const viTrans = this.translations.get(`${p.poi_id}_vi`);
      return {
        poiId: p.poi_id,
        title: viTrans ? viTrans.title : p.code,
        count: Math.floor(Math.random() * 20) + 5, // placeholder activity weight
      };
    });

    return {
      todayTotal: todayLogs.length,
      todayUniquePilgrims,
      allTimeTotal: this.pilgrimageLogs.length,
      allTimeUniquePilgrims,
      topLanguages,
      hourlyActivity,
      topPois,
      lastPilgrimageAt: this.pilgrimageLogs[this.pilgrimageLogs.length - 1]?.timestamp,
    };
  }
}

export { MongoDatabaseEngine, MongoDatabaseEngine as RelationalDatabaseEngine };
export const db = new MongoDatabaseEngine();
