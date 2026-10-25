-- ==============================================================
-- SUPABASE POSTGIS & RELATIONAL MIGRATION: VIỆT NAM QUỐC TỰ
-- Hệ Thống Thuyết Minh Tự Động & Truy Vấn Không Gian
-- ==============================================================

-- 1. Enable PostGIS Extension for Spatial Geodesic Queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. POIs Table with Original Text & Audio
CREATE TABLE IF NOT EXISTS public.pois (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    original_title TEXT NOT NULL,
    original_desc TEXT NOT NULL,
    original_narration TEXT NOT NULL,
    original_audio_url TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326),
    radius_meters INTEGER NOT NULL DEFAULT 20,
    category TEXT NOT NULL DEFAULT 'sanctuary',
    image_url TEXT,
    order_index INTEGER DEFAULT 1,
    featured BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Spatial GIST Index for high-performance radius lookups
CREATE INDEX IF NOT EXISTS pois_geom_idx ON public.pois USING GIST (geom);
CREATE INDEX IF NOT EXISTS pois_slug_idx ON public.pois (slug);

-- 3. Trigger to automatically compute PostGIS Point from (lat, lng)
CREATE OR REPLACE FUNCTION public.sync_poi_geom()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    NEW.updated_at := TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_poi_geom ON public.pois;
CREATE TRIGGER trg_sync_poi_geom
BEFORE INSERT OR UPDATE ON public.pois
FOR EACH ROW EXECUTE FUNCTION public.sync_poi_geom();

-- 4. POI Translations Table (Original vs. AI Generated on Demand)
CREATE TABLE IF NOT EXISTS public.poi_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poi_id TEXT NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    translated_title TEXT NOT NULL,
    translated_desc TEXT,
    translated_narration TEXT NOT NULL,
    audio_url TEXT,
    audio_duration_seconds INTEGER DEFAULT 45,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    ai_model_name TEXT DEFAULT 'gemini-3.8-flash',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_poi_language UNIQUE (poi_id, language_code)
);

CREATE INDEX IF NOT EXISTS poi_trans_lang_idx ON public.poi_translations (poi_id, language_code);

-- 5. Pilgrimage Logs & Unique Visitor Fingerprinting (Anti-Spam)
CREATE TABLE IF NOT EXISTS public.pilgrimage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fingerprint_hash TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'vi',
    client_ip TEXT,
    user_agent TEXT,
    date_str TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS plg_fp_date_idx ON public.pilgrimage_logs (fingerprint_hash, date_str);
CREATE INDEX IF NOT EXISTS plg_date_idx ON public.pilgrimage_logs (date_str);

-- 6. POI Spatial Query Stored Procedure (PostGIS Geodesic ST_DWithin)
CREATE OR REPLACE FUNCTION public.get_nearby_pois(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    max_radius_meters DOUBLE PRECISION DEFAULT 50.0
)
RETURNS TABLE (
    id TEXT,
    slug TEXT,
    original_title TEXT,
    original_desc TEXT,
    original_narration TEXT,
    original_audio_url TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER,
    category TEXT,
    image_url TEXT,
    order_index INTEGER,
    distance_meters DOUBLE PRECISION,
    is_within_geofence BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.slug,
        p.original_title,
        p.original_desc,
        p.original_narration,
        p.original_audio_url,
        p.lat,
        p.lng,
        p.radius_meters,
        p.category,
        p.image_url,
        p.order_index,
        ST_Distance(
            p.geom::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) AS distance_meters,
        ST_DWithin(
            p.geom::geography,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            p.radius_meters::DOUBLE PRECISION
        ) AS is_within_geofence
    FROM public.pois p
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 7. Seed Data for Việt Nam Quốc Tự (244 Ba Tháng Hai, P.12, Q.10, TP.HCM)
INSERT INTO public.pois (
    id, slug, original_title, original_desc, original_narration, original_audio_url, lat, lng, radius_meters, category, image_url, order_index
) VALUES
(
    'vnqt-tam-quan',
    'cong-tam-quan',
    'Cổng Tam Quan & Quảng Trường Đài Sen',
    'Lối vào uy nghiêm mở ra không gian thanh tịnh giữa lòng Sài Gòn náo nhiệt.',
    'Kính chào quý Phật tử và du khách thập phương. Quý vị đang đứng trước Cổng Tam Quan của Việt Nam Quốc Tự - ngôi đại tự mang tính biểu tượng lịch sử và văn hóa Phật giáo Việt Nam tại TP. Hồ Chí Minh. Cổng Tam Quan ba lối đi tượng trưng cho "Tam giải thoát môn": Không môn, Vô tướng môn và Vô tác môn, dẫn dắt tâm hồn buông bỏ phiền não thế tục để hướng về cội nguồn giác ngộ và an lạc.',
    '/audio/vnqt-tam-quan-vi.mp3',
    10.77165, 106.67115, 20, 'gate',
    'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1200&q=80',
    1
),
(
    'vnqt-chinh-dien',
    'dai-hung-buu-dien',
    'Đại Hùng Bửu Điện (Chính Điện)',
    'Điện thờ chính tôn nghiêm với tôn tượng Phật Thích Ca bằng đồng mạ vàng 35 tấn.',
    'Đại Hùng Bửu Điện là trái tim tâm linh của Việt Nam Quốc Tự. Tại vị trí trung tâm trang nghiêm là pho đại tượng Đức Bổn Sư Thích Ca Mâu Ni Phật bằng đồng mạ vàng cao 7,5 mét, nặng tới 35 tấn. Đây là một trong những tôn tượng đồng lớn nhất trong các tự viện Việt Nam, tỏa ra ánh hào quang từ bi che chở muôn loài.',
    '/audio/vnqt-chinh-dien-vi.mp3',
    10.77125, 106.67140, 25, 'sanctuary',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    2
),
(
    'vnqt-bao-thap-13-tang',
    'bao-thap-da-13-tang',
    'Bảo Tháp Đa Bảo 13 Tầng (63m)',
    'Bảo tháp đá cao nhất Việt Nam, nơi phụng thờ Xá Lợi Trái Tim Bồ Tát Thích Quảng Đức.',
    'Quý khách đang chiêm ngưỡng Bảo Tháp Đa Bảo cao 13 tầng với chiều cao 63 mét - công trình kỷ lục biểu trưng cho tinh thần đoàn kết của 13 tổ chức giáo phái trong phong trào Phật giáo năm 1963. Đây là nơi tôn kính lưu giữ Bảo vật Quốc gia vô giá: Xá lợi Quả tim Bất diệt của Bồ Tát Thích Quảng Đức.',
    '/audio/vnqt-bao-thap-vi.mp3',
    10.77095, 106.67180, 22, 'stupa',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
    3
)
ON CONFLICT (id) DO UPDATE SET
    original_title = EXCLUDED.original_title,
    original_narration = EXCLUDED.original_narration,
    lat = EXCLUDED.lat,
    lng = EXCLUDED.lng;
