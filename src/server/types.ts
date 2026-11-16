/**
 * Vietnam Quoc Tu Audio Guide Data Types
 */

export interface Campus {
  campus_id: string;
  name: string;
  address: string;
  center_latitude: number;
  center_longitude: number;
  description_vi: string;
  description_en: string;
  map_image_url?: string;
  created_at: string;
}

export interface POIEntity {
  poi_id: string;
  campus_id: string;
  code: string;
  category?: 'gate' | 'tower' | 'hall' | 'monument' | 'garden' | 'bell';
  location_type?: string;
  latitude: number;
  longitude: number;
  geofence_radius: number; // in meters
  display_order?: number;
  priority?: number; // Độ ưu tiên phát tự động (mặc định 0, số càng lớn càng ưu tiên)
  image?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface POITranslation {
  translation_id: string;
  poi_id: string;
  language_code: string;
  title: string;
  introduction: string;
  description: string;
  audio_url?: string;
  is_ai_generated: boolean;
  is_manually_edited?: boolean;
  updated_at?: string;
  audio_updated_at?: string;
}

export interface POIMedia {
  media_id: string;
  poi_id: string;
  image_url: string;
  caption_vi?: string;
  caption_en?: string;
  display_order: number;
}

export interface AdminUser {
  user_id: string;
  username: string;
  password_hash: string;
  full_name: string;
  last_login?: string;
  created_at: string;
}

// Composite POI with its active translations and media gallery for client usage
export interface RichPOI extends POIEntity {
  translations: Record<string, POITranslation>;
  media: POIMedia[];
  // Convenience getters for direct display in active language
  currentTitle?: string;
  currentIntroduction?: string;
  currentDescription?: string;
  currentAudioUrl?: string;
}

export type POI = RichPOI;

// Collection daily_visits schema: 1 thiết bị = 1 người = tối đa 1 lượt tính trong 1 ngày
export interface DailyVisitDocument {
  visitorHash: string; // HMAC-SHA256(salt, deviceId + userAgent)
  day: string;         // 'YYYY-MM-DD' (Asia/Ho_Chi_Minh)
  createdAt: Date;     // TTL 24h
}

export interface DailyVisitCheckinResult {
  day: string;
  isNewToday: boolean;
  todayUniqueVisitors: number;
  message: string;
}

// =========================================================================
// THỐNG KÊ LƯU LƯỢNG & PHÂN TÍCH TỔNG HỢP (PRIVACY-PRESERVING AGGREGATES)
// =========================================================================

export type DeviceType = 'iphone' | 'android' | 'pc' | 'other';

/**
 * Phân loại thiết bị từ User-Agent và Client Hints / maxTouchPoints
 * TUYỆT ĐỐI KHÔNG LƯU chuỗi User-Agent thô vào database.
 * Đặc biệt: iPadOS 13+ gửi UA là Macintosh, nhận diện bằng maxTouchPoints > 1.
 */
export function classifyDevice(userAgent: string = '', maxTouchPoints: number = 0): DeviceType {
  const ua = (userAgent || '').toLowerCase();

  // iPadOS masquerading as macOS (User-Agent chứa Macintosh nhưng màn hình cảm ứng đa điểm)
  if (ua.includes('macintosh') && maxTouchPoints > 1) {
    return 'iphone'; // Thuộc nhóm thiết bị iOS theo đặc tả
  }

  // Thiết bị iOS (iPhone, iPad, iPod)
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'iphone';
  }

  // Thiết bị Android
  if (ua.includes('android')) {
    return 'android';
  }

  // Máy tính PC (Windows, macOS thực thụ, Linux, ChromeOS)
  if (
    ua.includes('windows') ||
    ua.includes('win64') ||
    ua.includes('win32') ||
    (ua.includes('macintosh') && maxTouchPoints <= 1) ||
    ua.includes('mac os x') ||
    ua.includes('linux') ||
    ua.includes('cros')
  ) {
    return 'pc';
  }

  return 'other';
}

// Bảng thống kê tổng hợp số lượng thiết bị theo ngày (không lưu định danh)
export interface DailyStatsDocument {
  date: string; // 'YYYY-MM-DD'
  uniqueDevices: number;
  device: {
    iphone: number;
    android: number;
    pc: number;
    other: number;
  };
}

// Bảng thống kê lượt nghe POI theo ngày và ngôn ngữ (không lưu định danh)
export interface POIListenStatsDocument {
  date: string; // 'YYYY-MM-DD'
  poiId: string;
  lang: string;
  listens: number;
  uniqueDevices: number;
  totalDurationSeconds?: number;
}

// Bảng tạm 24h để tính uniqueDevices cho từng POI trong ngày (tự hủy sau 24h bằng TTL index)
export interface POIDailyListenDocument {
  day: string; // 'YYYY-MM-DD'
  poiId: string;
  visitorHash: string; // HMAC-SHA256
  createdAt: Date; // TTL 86400s
}
