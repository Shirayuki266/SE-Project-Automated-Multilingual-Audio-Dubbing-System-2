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
