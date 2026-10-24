export type Language = 'vi' | 'en';

export type POILocationType = 'outdoor' | 'indoor';

export type POIStatus = 'unvisited' | 'active' | 'visited';

export interface POITranslation {
  language_code: Language;
  title: string;
  description: string;
  audio_url?: string;
  audio_duration?: number;
}

export interface POIMedia {
  image_url: string;
  caption_vi?: string;
  caption_en?: string;
  display_order: number;
}

export interface POI {
  poi_id: string;
  code: string;
  campus_id: string;
  latitude: number;
  longitude: number;
  geofence_radius: number;
  location_type: POILocationType;
  order_index: number;
  is_active: boolean;
  qr_code_url?: string;
  translations: {
    vi: POITranslation;
    en: POITranslation;
  };
  media: POIMedia[];
}

export interface Campus {
  campus_id: string;
  name: string;
  address: string;
  center_latitude: number;
  center_longitude: number;
  default_zoom: number;
  description_vi: string;
  description_en: string;
  map_image_url?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UserProfile {
  user_id: string;
  username: string;
  full_name: string;
  dharma_name: string;
  phone?: string;
  role: string;
  visited_pois: string[];
  wishes: string[];
}
