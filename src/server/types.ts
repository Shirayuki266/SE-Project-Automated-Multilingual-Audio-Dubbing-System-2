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

export interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude] per GeoJSON standard
}

export interface POIEntity {
  poi_id: string;
  campus_id: string;
  code: string; // e.g. "VNQT-01" or "TAM-QUAN"
  latitude: number;
  longitude: number;
  location?: GeoJSONPoint; // MongoDB 2dsphere GeoJSON Point
  geofence_radius: number; // 10 - 30m
  location_type: 'gate' | 'sanctuary' | 'stupa' | 'bell' | 'garden' | 'memorial' | 'statue' | 'ancestral';
  qr_code_url?: string;
  created_at: string;
}

export interface POITranslation {
  translation_id: string;
  poi_id: string;
  language_code: string; // 'vi', 'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'th', 'id', 'it'
  title: string;
  introduction?: string; // Giới thiệu tóm tắt điểm di tích
  description: string;   // Nội dung bài thuyết minh chi tiết
  audio_url?: string;
  is_ai_generated?: boolean;
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

export interface PilgrimageLog {
  id: string;
  fingerprintHash: string;
  language: string;
  timestamp: string;
  dateStr: string;
  userAgent?: string;
  ipHash?: string;
}

export interface PilgrimageStats {
  todayTotal: number;
  todayUniquePilgrims: number;
  allTimeTotal: number;
  allTimeUniquePilgrims: number;
  topLanguages: { language: string; count: number }[];
  hourlyActivity: { hour: number; count: number }[];
  topPois: { poiId: string; title: string; count: number }[];
  lastPilgrimageAt?: string;
}
