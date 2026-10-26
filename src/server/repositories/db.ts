import {
  Campus,
  POIEntity,
  POITranslation,
  POIMedia,
  AdminUser,
  RichPOI,
  PilgrimageStats,
  DeviceAccessRecord,
  DeviceCheckinResult,
  VisitorAnalyticsFilter,
  VisitorAnalyticsResponse,
  RealDeviceEntity,
  RealDeviceFilter,
  RealDeviceResponse,
  RealDeviceSummary,
} from '../types.js';
import { calculateHaversineDistance } from '../../utils/geo.js';
import { hashPassword } from '../../utils/cryptoUtils.js';
import { mongoManager } from './mongoClient.js';

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

function parseDeviceType(ua?: string): string {
  if (!ua) return 'Thiết bị di động';
  if (/iPhone/i.test(ua)) return 'iPhone (iOS)';
  if (/iPad/i.test(ua)) return 'iPad (WebKit)';
  if (/Android.*Mobile/i.test(ua)) return 'Android Smartphone';
  if (/Android/i.test(ua)) return 'Android Tablet';
  if (/Macintosh/i.test(ua)) return 'MacBook / macOS';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Linux/i.test(ua)) return 'Linux Desktop';
  return 'Trình duyệt web';
}

function parseBrowser(ua?: string): string {
  if (!ua) return 'Trình duyệt Web';
  if (/Edg/i.test(ua)) return 'Microsoft Edge';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Google Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Apple Safari';
  if (/Firefox/i.test(ua)) return 'Mozilla Firefox';
  if (/Opera|OPR/i.test(ua)) return 'Opera';
  return 'Web Browser';
}

function parseOS(ua?: string): string {
  if (!ua) return 'Không xác định';
  if (/iPhone/i.test(ua)) return 'iOS (iPhone)';
  if (/iPad/i.test(ua)) return 'iPadOS';
  if (/Android/i.test(ua)) return 'Android OS';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Windows NT 10.0/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows OS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Khác';
}

import { rawSeedPOIs } from './seedPOIs.js';

class MongoDatabaseEngine {
  private campuses: Map<string, Campus> = new Map();
  private pois: Map<string, POIEntity> = new Map();
  private translations: Map<string, POITranslation> = new Map();
  private media: Map<string, POIMedia> = new Map();
  private adminUsers: Map<string, AdminUser> = new Map();
  private dailyDeviceAccess: Map<string, DeviceAccessRecord> = new Map();
  private activeVisitorHashes: Set<string> = new Set();
  // Bảng MongoDB: Quản lý các thiết bị đăng nhập/truy cập thực (TUYỆT ĐỐI KHÔNG TẠO ẢO)
  private realDevices: Map<string, RealDeviceEntity> = new Map();
  private totalStarts: number = 0;

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
          audio_url: data.audioUrl || `/audio/${item.poi.poi_id}-${lang}.mp3`,
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
    initialTranslation?: { title: string; desc: string; lang: string; intro?: string },
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
        introduction: initialTranslation.intro || (initialTranslation.desc.length > 120 ? initialTranslation.desc.slice(0, 120) : initialTranslation.desc),
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

  // --- Device Fingerprint Checking & Daily Deduplication (Chỉ ghi nhận 1 thiết bị truy cập/ngày) ---
  public recordDeviceCheckin(
    fingerprintHash: string,
    language: string = 'vi',
    userAgent?: string,
    ipHash?: string
  ): DeviceCheckinResult {
    const now = new Date();
    // Use Vietnam GMT+7 Date String "YYYY-MM-DD"
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const key = `${fingerprintHash}_${dateStr}`;
    const isoNow = now.toISOString();

    const existing = this.dailyDeviceAccess.get(key);
    let isNewToday = false;
    let accessCountToday = 1;
    let firstAccessAt = isoNow;
    let lastAccessAt = isoNow;

    if (existing) {
      existing.accessCountToday += 1;
      existing.lastAccessAt = isoNow;
      if (language) existing.language = language;
      accessCountToday = existing.accessCountToday;
      firstAccessAt = existing.firstAccessAt;
      lastAccessAt = existing.lastAccessAt;
      isNewToday = false;
    } else {
      isNewToday = true;
      const id = `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const shortId = 'DEV-' + fingerprintHash.replace(/^fp_/, '').slice(0, 6).toUpperCase();
      const deviceType = parseDeviceType(userAgent);

      const newRecord: DeviceAccessRecord = {
        id,
        fingerprintHash,
        shortId,
        dateStr,
        firstAccessAt: isoNow,
        lastAccessAt: isoNow,
        accessCountToday: 1,
        language,
        deviceType,
        userAgent,
        ipHash,
      };
      this.dailyDeviceAccess.set(key, newRecord);
      this.activeVisitorHashes.add(fingerprintHash);
      this.totalStarts += 1;
    }

    // Count distinct unique devices for today
    let todayUniqueDevices = 0;
    for (const record of this.dailyDeviceAccess.values()) {
      if (record.dateStr === dateStr) {
        todayUniqueDevices++;
      }
    }

    const message = isNewToday
      ? `Ghi nhận thiết bị mới thành công cho ngày ${dateStr}.`
      : `Thiết bị này đã được ghi nhận trong ngày ${dateStr} (Lần truy cập thứ ${accessCountToday}). Hệ thống giữ nguyên chỉ tính 1 thiết bị duy nhất.`;

    return {
      fingerprintHash,
      dateStr,
      isNewToday,
      accessCountToday,
      firstAccessAt,
      lastAccessAt,
      todayUniqueDevices: Math.max(todayUniqueDevices, 1),
      message,
    };
  }

  public getDeviceStatusToday(fingerprintHash: string): {
    hasCheckedInToday: boolean;
    record?: DeviceAccessRecord;
  } {
    const dateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const key = `${fingerprintHash}_${dateStr}`;
    const record = this.dailyDeviceAccess.get(key);
    return {
      hasCheckedInToday: !!record,
      record,
    };
  }

  // --- Visitor Device Analytics & Search (Từ - Đến, Ngày này, Tháng này, Năm này) ---
  public getVisitorAnalytics(filter: VisitorAnalyticsFilter): VisitorAnalyticsResponse {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const currentMonth = todayStr.slice(0, 7); // "2026-10"
    const currentYear = todayStr.slice(0, 4);  // "2026"

    let filtered = Array.from(this.dailyDeviceAccess.values());
    let filterLabel = 'Tất cả thời gian';

    const preset = filter.preset || (filter.startDate ? 'custom' : 'today');

    if (preset === 'today') {
      filtered = filtered.filter((r) => r.dateStr === todayStr);
      filterLabel = `Hôm nay (${todayStr.split('-').reverse().join('/')})`;
    } else if (preset === 'this_month') {
      filtered = filtered.filter((r) => r.dateStr.startsWith(currentMonth));
      filterLabel = `Tháng này (${currentMonth.split('-').reverse().join('/')})`;
    } else if (preset === 'this_year') {
      filtered = filtered.filter((r) => r.dateStr.startsWith(currentYear));
      filterLabel = `Năm này (${currentYear})`;
    } else if (preset === 'custom' || (filter.startDate && filter.endDate)) {
      const start = filter.startDate || '2026-01-01';
      const end = filter.endDate || todayStr;
      filtered = filtered.filter((r) => r.dateStr >= start && r.dateStr <= end);
      filterLabel = `Từ ${start.split('-').reverse().join('/')} đến ${end.split('-').reverse().join('/')}`;
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.fingerprintHash.toLowerCase().includes(q) ||
          r.shortId.toLowerCase().includes(q) ||
          r.deviceType.toLowerCase().includes(q) ||
          r.language.toLowerCase().includes(q) ||
          (r.ipHash && r.ipHash.toLowerCase().includes(q))
      );
    }

    // Sort descending by last access
    filtered.sort((a, b) => new Date(b.lastAccessAt).getTime() - new Date(a.lastAccessAt).getTime());

    // Group for chart data
    const dateMap = new Map<string, { devices: number; accesses: number }>();
    filtered.forEach((r) => {
      const entry = dateMap.get(r.dateStr) || { devices: 0, accesses: 0 };
      entry.devices += 1;
      entry.accesses += r.accessCountToday;
      dateMap.set(r.dateStr, entry);
    });

    const chartData = Array.from(dateMap.entries())
      .map(([date, d]) => ({ date, devices: d.devices, accesses: d.accesses }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Summary
    const totalDevices = filtered.length;
    const totalAccesses = filtered.reduce((sum, r) => sum + r.accessCountToday, 0);
    const avgAccessPerDevice = totalDevices > 0 ? parseFloat((totalAccesses / totalDevices).toFixed(1)) : 0;

    const todayRecords = Array.from(this.dailyDeviceAccess.values()).filter((r) => r.dateStr === todayStr);
    const todayDevices = todayRecords.length;
    const todayAccesses = todayRecords.reduce((sum, r) => sum + r.accessCountToday, 0);

    return {
      summary: {
        totalDevices,
        totalAccesses,
        avgAccessPerDevice,
        todayDevices,
        todayAccesses,
        filterLabel,
      },
      chartData,
      records: filtered,
    };
  }

  // --- In-Memory Throttling & Session Counting (Used by pilgrimage start) ---
  public recordPilgrimage(
    fingerprintHash: string,
    language: string = 'vi',
    userAgent?: string,
    ipHash?: string
  ): { isNewToday: boolean; checkinResult: DeviceCheckinResult } {
    const checkin = this.recordDeviceCheckin(fingerprintHash, language, userAgent, ipHash);
    return {
      isNewToday: checkin.isNewToday,
      checkinResult: checkin,
    };
  }

  public getStats(): PilgrimageStats {
    const langMap = new Map<string, number>();
    for (const rec of this.dailyDeviceAccess.values()) {
      const l = rec.language || 'vi';
      langMap.set(l, (langMap.get(l) || 0) + 1);
    }
    const topLanguages = Array.from(langMap.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count);

    if (topLanguages.length === 0) {
      topLanguages.push({ language: 'vi', count: 1 });
    }

    const hourlyActivity = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      count: 0,
    }));

    const topPois = Array.from(this.pois.values()).map((p) => {
      const viTrans = this.translations.get(p.poi_id + "_vi");
      return {
        poiId: p.poi_id,
        title: viTrans ? viTrans.title : p.code,
        count: 0,
      };
    });

    const realCount = this.dailyDeviceAccess.size;
    const realUnique = this.activeVisitorHashes.size;

    return {
      todayTotal: this.totalStarts || realCount,
      todayUniquePilgrims: realUnique,
      allTimeTotal: realCount,
      allTimeUniquePilgrims: realUnique,
      topLanguages,
      hourlyActivity,
      topPois,
      lastPilgrimageAt: new Date().toISOString(),
    };
  }

  // =========================================================================
  // BẢNG MONGODB: QUẢN LÝ CÁC THIẾT BỊ ĐĂNG NHẬP / TRUY CẬP THỰC (KHÔNG TẠO ẢO)
  // =========================================================================

  /**
   * Ghi nhận hoặc cập nhật thiết bị THẬT khi truy cập vào hệ thống.
   * Dữ liệu được lưu trữ trực tiếp vào Collection "real_devices" trên MongoDB.
   */
  public async recordRealDeviceAccess(payload: {
    deviceId: string;
    ipAddress?: string;
    userAgent?: string;
    screenResolution?: string;
    language?: string;
    timezone?: string;
  }): Promise<RealDeviceEntity> {
    const rawId = (payload.deviceId || '').trim();
    const deviceId = rawId || `dev_${Math.random().toString(36).slice(2, 10)}`;
    const shortId = `DEV-${deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'CLIENT'}`;
    const now = new Date().toISOString();
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const ip = payload.ipAddress || '127.0.0.1';
    const ua = payload.userAgent || 'Unknown Device Client';

    // If already in memory or remote MongoDB
    let existing = this.realDevices.get(deviceId);
    if (!existing && mongoManager.isConnectedToRemote) {
      try {
        const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
        if (col) {
          const doc = await col.findOne({ device_id: deviceId });
          if (doc) {
            existing = doc;
            this.realDevices.set(deviceId, doc);
          }
        }
      } catch (err: any) {
        console.warn('[MongoDB real_devices] find notice:', err.message);
      }
    }

    if (existing) {
      const isNewDay = !existing.last_seen_at || existing.last_seen_at.slice(0, 10) !== todayStr;
      existing.last_seen_at = now;
      if (ip !== '127.0.0.1') existing.ip_address = ip;
      existing.total_visits = (existing.total_visits || 0) + 1;
      existing.today_visits = isNewDay ? 1 : (existing.today_visits || 0) + 1;
      if (payload.screenResolution) existing.screen_resolution = payload.screenResolution;
      if (payload.language) existing.language = payload.language;
      if (payload.timezone) existing.timezone = payload.timezone;
      existing.updated_at = now;

      this.realDevices.set(deviceId, existing);

      // Async sync to MongoDB Atlas
      if (mongoManager.isConnectedToRemote) {
        const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
        if (col) {
          col.updateOne({ device_id: deviceId }, { $set: existing }, { upsert: true }).catch(() => {});
        }
      }

      return existing;
    }

    // New real device
    const newDevice: RealDeviceEntity = {
      device_id: deviceId,
      short_id: shortId,
      ip_address: ip,
      device_type: parseDeviceType(ua),
      browser: parseBrowser(ua),
      os: parseOS(ua),
      screen_resolution: payload.screenResolution || 'Chưa xác định',
      language: payload.language || 'vi',
      timezone: payload.timezone || 'Asia/Ho_Chi_Minh',
      user_agent: ua,
      first_seen_at: now,
      last_seen_at: now,
      total_visits: 1,
      today_visits: 1,
      role: 'visitor',
      status: 'active',
      created_at: now,
      updated_at: now,
    };

    this.realDevices.set(deviceId, newDevice);

    // Save to remote MongoDB Atlas
    if (mongoManager.isConnectedToRemote) {
      try {
        const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
        if (col) {
          await col.updateOne({ device_id: deviceId }, { $set: newDevice }, { upsert: true });
        }
      } catch (err: any) {
        console.warn('[MongoDB real_devices] insert notice:', err.message);
      }
    }

    return newDevice;
  }

  /**
   * Ghi nhận sự kiện đăng nhập tài khoản thực tế từ thiết bị.
   */
  public async recordRealDeviceLogin(payload: {
    deviceId?: string;
    username: string;
    role?: 'visitor' | 'admin';
    ipAddress?: string;
    userAgent?: string;
    screenResolution?: string;
  }): Promise<RealDeviceEntity> {
    const rawId = (payload.deviceId || '').trim();
    const deviceId = rawId || `dev_${Math.random().toString(36).slice(2, 10)}`;
    const baseDevice = await this.recordRealDeviceAccess({
      deviceId,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      screenResolution: payload.screenResolution,
    });

    const now = new Date().toISOString();
    baseDevice.last_login_at = now;
    baseDevice.logged_username = payload.username;
    baseDevice.role = payload.role || 'admin';
    baseDevice.updated_at = now;

    this.realDevices.set(deviceId, baseDevice);

    if (mongoManager.isConnectedToRemote) {
      const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
      if (col) {
        col.updateOne({ device_id: deviceId }, { $set: baseDevice }, { upsert: true }).catch(() => {});
      }
    }

    return baseDevice;
  }

  /**
   * Truy vấn danh sách và thống kê thiết bị thực từ bảng "real_devices" của MongoDB.
   */
  public async getRealDevices(filter?: RealDeviceFilter): Promise<RealDeviceResponse> {
    // Sync from MongoDB Atlas if remote is connected
    if (mongoManager.isConnectedToRemote) {
      try {
        const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
        if (col) {
          const remoteDocs = await col.find({}).toArray();
          remoteDocs.forEach((doc) => {
            this.realDevices.set(doc.device_id, doc);
          });
        }
      } catch (err: any) {
        console.warn('[MongoDB real_devices] sync notice:', err.message);
      }
    }

    const allDevices = Array.from(this.realDevices.values());
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

    let filtered = allDevices;

    // Filter by role
    if (filter?.role && filter.role !== 'all') {
      filtered = filtered.filter((d) => d.role === filter.role);
    }

    // Filter by status
    if (filter?.status && filter.status !== 'all') {
      filtered = filtered.filter((d) => d.status === filter.status);
    }

    // Filter by deviceType
    if (filter?.deviceType && filter.deviceType !== 'all') {
      filtered = filtered.filter((d) => d.device_type.toLowerCase().includes(filter.deviceType!.toLowerCase()));
    }

    // Search query
    if (filter?.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      filtered = filtered.filter((d) => {
        return (
          d.short_id.toLowerCase().includes(q) ||
          d.device_id.toLowerCase().includes(q) ||
          d.ip_address.toLowerCase().includes(q) ||
          d.device_type.toLowerCase().includes(q) ||
          d.browser.toLowerCase().includes(q) ||
          d.os.toLowerCase().includes(q) ||
          (d.logged_username && d.logged_username.toLowerCase().includes(q)) ||
          d.user_agent.toLowerCase().includes(q) ||
          (d.notes && d.notes.toLowerCase().includes(q))
        );
      });
    }

    // Sort by last_seen_at desc
    filtered.sort((a, b) => new Date(b.last_seen_at).getTime() - new Date(a.last_seen_at).getTime());

    // Summary calculation
    const totalRealDevices = allDevices.length;
    const activeToday = allDevices.filter(
      (d) => d.last_seen_at && d.last_seen_at.slice(0, 10) === todayStr
    ).length;
    const adminLogins = allDevices.filter(
      (d) => d.role === 'admin' || Boolean(d.logged_username)
    ).length;
    const blockedCount = allDevices.filter((d) => d.status === 'blocked').length;

    const summary: RealDeviceSummary = {
      totalRealDevices,
      activeToday,
      adminLogins,
      blockedCount,
      mongoCollection: 'real_devices',
      isRemoteConnected: mongoManager.isConnectedToRemote,
    };

    return {
      summary,
      devices: filtered,
    };
  }

  /**
   * Khóa hoặc mở khóa một thiết bị thực trong MongoDB.
   */
  public async toggleBlockRealDevice(
    deviceId: string,
    isBlocked: boolean,
    notes?: string
  ): Promise<RealDeviceEntity | null> {
    const device = this.realDevices.get(deviceId);
    if (!device) return null;

    device.status = isBlocked ? 'blocked' : 'active';
    if (notes !== undefined) device.notes = notes;
    device.updated_at = new Date().toISOString();

    this.realDevices.set(deviceId, device);

    if (mongoManager.isConnectedToRemote) {
      const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
      if (col) {
        await col.updateOne({ device_id: deviceId }, { $set: device }).catch(() => {});
      }
    }

    return device;
  }

  /**
   * Xóa một thiết bị thực khỏi bảng MongoDB.
   */
  public async deleteRealDevice(deviceId: string): Promise<boolean> {
    const existed = this.realDevices.delete(deviceId);

    if (mongoManager.isConnectedToRemote) {
      const col = mongoManager.getCollection<RealDeviceEntity>('real_devices');
      if (col) {
        await col.deleteOne({ device_id: deviceId }).catch(() => {});
      }
    }

    return existed;
  }
}

export { MongoDatabaseEngine, MongoDatabaseEngine as RelationalDatabaseEngine };
export const db = new MongoDatabaseEngine();
