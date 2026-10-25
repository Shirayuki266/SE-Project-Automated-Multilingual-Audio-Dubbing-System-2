-- ====================================================================
-- POSTGRESQL RELATIONAL SCHEMA: 5 CORE ENTITIES WITH POSTGIS SUPPORT
-- System: Thuyết Minh Tự Động Đa Ngôn Ngữ Việt Nam Quốc Tự
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. campuses (Campus)
CREATE TABLE IF NOT EXISTS public.campuses (
    campus_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    center_latitude DOUBLE PRECISION NOT NULL,
    center_longitude DOUBLE PRECISION NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    map_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 2. pois (POI)
CREATE TABLE IF NOT EXISTS public.pois (
    poi_id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES public.campuses(campus_id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geofence_radius INTEGER NOT NULL DEFAULT 20,
    location_type TEXT NOT NULL DEFAULT 'sanctuary',
    qr_code_url TEXT,
    geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_pois_campus_id ON public.pois(campus_id);
CREATE INDEX IF NOT EXISTS idx_pois_geom ON public.pois USING GIST (geom);

-- Trigger to auto-update PostGIS geom
CREATE OR REPLACE FUNCTION public.sync_poi_geometry()
RETURNS TRIGGER AS $$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_poi_geometry ON public.pois;
CREATE TRIGGER trg_sync_poi_geometry
BEFORE INSERT OR UPDATE ON public.pois
FOR EACH ROW EXECUTE FUNCTION public.sync_poi_geometry();

-- 3. poi_translations (POI_Translation)
CREATE TABLE IF NOT EXISTS public.poi_translations (
    translation_id TEXT PRIMARY KEY,
    poi_id TEXT NOT NULL REFERENCES public.pois(poi_id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    audio_url TEXT,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_poi_translation UNIQUE (poi_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_poi_trans_poi_id ON public.poi_translations(poi_id);
CREATE INDEX IF NOT EXISTS idx_poi_trans_lang ON public.poi_translations(language_code);

-- 4. poi_media (POI_Media)
CREATE TABLE IF NOT EXISTS public.poi_media (
    media_id TEXT PRIMARY KEY,
    poi_id TEXT NOT NULL REFERENCES public.pois(poi_id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption_vi TEXT,
    caption_en TEXT,
    display_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_poi_media_poi_id ON public.poi_media(poi_id);

-- 5. admin_users (Admin_User)
CREATE TABLE IF NOT EXISTS public.admin_users (
    user_id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Spatial Query Function
CREATE OR REPLACE FUNCTION public.get_nearby_pois(
    p_user_lat DOUBLE PRECISION,
    p_user_lng DOUBLE PRECISION,
    p_campus_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    poi_id TEXT,
    campus_id TEXT,
    code TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    geofence_radius INTEGER,
    location_type TEXT,
    qr_code_url TEXT,
    distance_meters DOUBLE PRECISION,
    is_within_geofence BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.poi_id,
        p.campus_id,
        p.code,
        p.latitude,
        p.longitude,
        p.geofence_radius,
        p.location_type,
        p.qr_code_url,
        ST_Distance(
            p.geom::geography,
            ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography
        ) AS distance_meters,
        ST_DWithin(
            p.geom::geography,
            ST_SetSRID(ST_MakePoint(p_user_lng, p_user_lat), 4326)::geography,
            p.geofence_radius::DOUBLE PRECISION
        ) AS is_within_geofence
    FROM public.pois p
    WHERE (p_campus_id IS NULL OR p.campus_id = p_campus_id)
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql STABLE;
