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

export interface DeviceAccessRecord {
  id: string;
  fingerprintHash: string;
  shortId: string;
  dateStr: string;
  firstAccessAt: string;
  lastAccessAt: string;
  accessCountToday: number;
  language: string;
  deviceType: string;
  userAgent?: string;
  ipHash?: string;
}

export interface DeviceCheckinResult {
  fingerprintHash: string;
  dateStr: string;
  isNewToday: boolean;
  accessCountToday: number;
  firstAccessAt: string;
  lastAccessAt: string;
  todayUniqueDevices: number;
  message: string;
}

export interface VisitorAnalyticsFilter {
  preset?: 'today' | 'this_month' | 'this_year' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface VisitorAnalyticsResponse {
  summary: {
    totalDevices: number;
    totalAccesses: number;
    avgAccessPerDevice: number;
    todayDevices: number;
    todayAccesses: number;
    filterLabel: string;
  };
  chartData: { date: string; devices: number; accesses: number }[];
  records: DeviceAccessRecord[];
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

// Bảng MongoDB: Quản lý các thiết bị đăng nhập/truy cập thực (Không tạo ảo)
export interface RealDeviceEntity {
  device_id: string; // Hash định danh phần cứng/canvas/webgl thực tế
  short_id: string; // Mã định danh DEV-XXXXXX
  ip_address: string; // Địa chỉ IP thực từ kết nối mạng
  device_type: string; // iPhone, Android, MacBook, Windows PC, iPad...
  browser: string; // Chrome, Safari, Firefox, Edge...
  os: string; // iOS, Android, macOS, Windows, Linux...
  screen_resolution?: string; // Ví dụ: 1920x1080, 390x844
  language?: string; // vi-VN, en-US...
  timezone?: string; // Asia/Ho_Chi_Minh...
  user_agent: string; // User-Agent gốc từ HTTP header
  first_seen_at: string; // Thời điểm thiết bị thực lần đầu xuất hiện
  last_seen_at: string; // Thời điểm thiết bị thực truy cập gần nhất
  total_visits: number; // Tổng số lần thiết bị thực truy cập
  today_visits: number; // Số lần truy cập trong ngày hôm nay
  last_login_at?: string; // Thời điểm đăng nhập gần nhất (nếu có đăng nhập tài khoản)
  logged_username?: string; // Tên tài khoản quản trị/người dùng đã đăng nhập (e.g. 'admin')
  role: 'visitor' | 'admin'; // Vai trò thiết bị
  status: 'active' | 'blocked'; // Trạng thái: đang hoạt động hoặc bị chặn
  notes?: string; // Ghi chú của quản trị viên
  created_at: string;
  updated_at: string;
}

export interface RealDeviceFilter {
  search?: string;
  role?: 'all' | 'visitor' | 'admin';
  status?: 'all' | 'active' | 'blocked';
  deviceType?: string;
}

export interface RealDeviceSummary {
  totalRealDevices: number;
  activeToday: number;
  adminLogins: number;
  blockedCount: number;
  mongoCollection: string;
  isRemoteConnected: boolean;
}

export interface RealDeviceResponse {
  summary: RealDeviceSummary;
  devices: RealDeviceEntity[];
}

