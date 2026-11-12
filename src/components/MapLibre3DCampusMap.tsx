import React, { useEffect, useRef, useState } from 'react';
import { Map as MapLibreMap, Marker, NavigationControl, ScaleControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RichPOI } from '../server/types.js';
import { UserLocationState } from '../hooks/useGPSTracker.js';
import { LanguageCode } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import { calculateHaversineDistance } from '../utils/geo.js';
import {
  Compass,
  Play,
  Sparkles,
  MapPin,
  Layers,
  Footprints,
  Info,
  Navigation,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Box,
  RotateCcw,
  Volume2,
} from 'lucide-react';

interface MapLibre3DCampusMapProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  userLocation: UserLocationState;
  activePoiId: string | null;
  onSelectPOI: (poi: RichPOI, autoPlay?: boolean) => void;
}

// Vietnam Quoc Tu center coordinates [lng, lat]
const VNQT_CENTER: [number, number] = [106.6714, 10.77125];

// 3D Extruded Buildings GeoJSON for Vietnam Quoc Tu Pagoda
const VNQT_3D_BUILDINGS_GEOJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    // 1. Bảo Tháp 13 Tầng (Thirteen-Story Stupa) - Cao 63m (Highest Pagoda Stupa in Vietnam)
    {
      type: 'Feature',
      properties: {
        id: 'stupa-13',
        name: 'Bảo Tháp 13 Tầng (Cao 63m)',
        height: 63,
        base_height: 0,
        color: '#eab308',
        night_color: '#fbbf24',
        type: 'stupa',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67168, 10.77085],
            [106.67192, 10.77085],
            [106.67192, 10.77105],
            [106.67168, 10.77105],
            [106.67168, 10.77085],
          ],
        ],
      },
    },
    // 2. Đại Hùng Bửu Điện (Chính Điện) - Cao 30m, mái ngói cong truyền thống
    {
      type: 'Feature',
      properties: {
        id: 'main-sanctuary',
        name: 'Đại Hùng Bửu Điện (Cao 30m)',
        height: 30,
        base_height: 0,
        color: '#c2410c',
        night_color: '#ea580c',
        type: 'sanctuary',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67122, 10.77112],
            [106.67158, 10.77112],
            [106.67158, 10.77138],
            [106.67122, 10.77138],
            [106.67122, 10.77112],
          ],
        ],
      },
    },
    // 3. Cổng Tam Quan - Cao 14m
    {
      type: 'Feature',
      properties: {
        id: 'tam-quan-gate',
        name: 'Cổng Tam Quan (Cao 14m)',
        height: 14,
        base_height: 0,
        color: '#b45309',
        night_color: '#d97706',
        type: 'gate',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67102, 10.77188],
            [106.67128, 10.77188],
            [106.67128, 10.77202],
            [106.67102, 10.77202],
            [106.67102, 10.77188],
          ],
        ],
      },
    },
    // 4. Gác Chuông Đại Hồng Chung - Cao 18m
    {
      type: 'Feature',
      properties: {
        id: 'bell-tower',
        name: 'Gác Chuông Đại Hồng Chung (Cao 18m)',
        height: 18,
        base_height: 0,
        color: '#d97706',
        night_color: '#f59e0b',
        type: 'bell',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67175, 10.77138],
            [106.67195, 10.77138],
            [106.67195, 10.77152],
            [106.67175, 10.77152],
            [106.67175, 10.77138],
          ],
        ],
      },
    },
    // 5. Tượng Bồ Tát Quán Thế Âm & Vườn Lâm Tỳ Ni - Cao 12m
    {
      type: 'Feature',
      properties: {
        id: 'quan-am-statue',
        name: 'Tôn Tượng Bồ Tát Quán Thế Âm (Cao 12m)',
        height: 12,
        base_height: 0,
        color: '#059669',
        night_color: '#10b981',
        type: 'statue',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67075, 10.77142],
            [106.67095, 10.77142],
            [106.67095, 10.77158],
            [106.67075, 10.77158],
            [106.67075, 10.77142],
          ],
        ],
      },
    },
    // 6. Nhà Hậu Tổ & Trụ Sở Ban Trị Sự - Cao 22m
    {
      type: 'Feature',
      properties: {
        id: 'ancestral-hall',
        name: 'Nhà Hậu Tổ & Ban Trị Sự (Cao 22m)',
        height: 22,
        base_height: 0,
        color: '#78350f',
        night_color: '#92400e',
        type: 'ancestral',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67108, 10.77065],
            [106.67138, 10.77065],
            [106.67138, 10.77085],
            [106.67108, 10.77085],
            [106.67108, 10.77065],
          ],
        ],
      },
    },
    // 7. Quảng Trường Sân Đại Lễ - Cao 0.5m
    {
      type: 'Feature',
      properties: {
        id: 'ceremonial-plaza',
        name: 'Quảng Trường Sân Đại Lễ',
        height: 0.8,
        base_height: 0,
        color: '#f8fafc',
        night_color: '#334155',
        type: 'plaza',
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [106.67112, 10.77142],
            [106.67165, 10.77142],
            [106.67165, 10.77182],
            [106.67112, 10.77182],
            [106.67112, 10.77142],
          ],
        ],
      },
    },
  ],
};

// Pilgrimage trail GeoJSON
const PILGRIMAGE_TRAIL_GEOJSON: GeoJSON.Feature = {
  type: 'Feature',
  properties: { name: 'Đường Chiêm Bái Tự Động' },
  geometry: {
    type: 'LineString',
    coordinates: [
      [106.67115, 10.77195], // Cổng Tam Quan
      [106.67125, 10.7715], // Sân Đại Lễ
      [106.6714, 10.77125], // Chính Điện
      [106.6718, 10.77095], // Bảo Tháp 13 Tầng
      [106.67185, 10.77145], // Đại Hồng Chung
      [106.67085, 10.7715], // Vườn Bồ Đề
      [106.6712, 10.77075], // Nhà Hậu Tổ
    ],
  },
};

export const MapLibre3DCampusMap: React.FC<MapLibre3DCampusMapProps> = ({
  pois,
  currentLang,
  userLocation,
  activePoiId,
  onSelectPOI,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const userMarkerRef = useRef<Marker | null>(null);

  // Map Controls State
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [isNightMode, setIsNightMode] = useState<boolean>(() => {
    const hour = new Date().getHours();
    return hour >= 18 || hour < 6;
  });
  const [showPilgrimageRoute, setShowPilgrimageRoute] = useState<boolean>(true);
  const [isMapReady, setIsMapReady] = useState<boolean>(false);

  const t = translations[currentLang];

  // Helper to construct MapLibre Style Specification (allows zoom up to 22 without blank screens)
  const getMapStyleConfig = (type: 'street' | 'satellite', isNight: boolean): StyleSpecification => {
    const rasterUrl =
      type === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : isNight
        ? 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
        : 'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';

    return {
      version: 8,
      sources: {
        'base-tiles': {
          type: 'raster',
          tiles: [rasterUrl],
          tileSize: 256,
          maxzoom: 19, // Tiles cap at 19, but MapLibre overzooms to 22+ smoothly
          attribution: '&copy; Việt Nam Quốc Tự · OpenStreetMap · CARTO · Esri',
        },
        'buildings-3d-source': {
          type: 'geojson',
          data: VNQT_3D_BUILDINGS_GEOJSON,
        },
        'pilgrimage-trail-source': {
          type: 'geojson',
          data: PILGRIMAGE_TRAIL_GEOJSON,
        },
      },
      layers: [
        {
          id: 'base-tiles-layer',
          type: 'raster',
          source: 'base-tiles',
          minzoom: 0,
          maxzoom: 22,
        },
        // Pilgrimage Walking Trail Path
        {
          id: 'pilgrimage-trail-casing',
          type: 'line',
          source: 'pilgrimage-trail-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': isNight ? '#38bdf8' : '#ffffff',
            'line-width': 6,
            'line-opacity': 0.8,
          },
        },
        {
          id: 'pilgrimage-trail-line',
          type: 'line',
          source: 'pilgrimage-trail-source',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': isNight ? '#0284c7' : '#16a34a',
            'line-width': 3.5,
            'line-dasharray': [2, 1.5],
            'line-opacity': 0.95,
          },
        },
        // 3D Extruded Buildings Layer
        {
          id: '3d-buildings-extrusion',
          type: 'fill-extrusion',
          source: 'buildings-3d-source',
          minzoom: 14,
          maxzoom: 22,
          paint: {
            'fill-extrusion-color': [
              'case',
              ['boolean', isNight, false],
              ['get', 'night_color'],
              ['get', 'color'],
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'base_height'],
            'fill-extrusion-opacity': 0.92,
          },
        },
      ],
    };
  };

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialStyle = getMapStyleConfig(mapStyle, isNightMode);

    const map = new MapLibreMap({
      container: mapContainerRef.current,
      style: initialStyle,
      center: VNQT_CENTER,
      zoom: 17.5,
      minZoom: 14,
      maxZoom: 22, // Fixes overzoom blank screen: supports zoom up to 22
      pitch: is3DMode ? 55 : 0, // Default 55° pitch for full 3D extruded view
      bearing: -15, // Oriented slightly to frame Tam Quan and Main Hall
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      setIsMapReady(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync style switch (Street vs Satellite & Day vs Night)
  useEffect(() => {
    if (!mapRef.current) return;
    const style = getMapStyleConfig(mapStyle, isNightMode);
    mapRef.current.setStyle(style);
  }, [mapStyle, isNightMode]);

  // Sync 3D pitch mode
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.easeTo({
      pitch: is3DMode ? 55 : 0,
      duration: 800,
    });
  }, [is3DMode]);

  // Sync Trail visibility
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    const vis = showPilgrimageRoute ? 'visible' : 'none';
    if (mapRef.current.getLayer('pilgrimage-trail-line')) {
      mapRef.current.setLayoutProperty('pilgrimage-trail-line', 'visibility', vis);
    }
    if (mapRef.current.getLayer('pilgrimage-trail-casing')) {
      mapRef.current.setLayoutProperty('pilgrimage-trail-casing', 'visibility', vis);
    }
  }, [showPilgrimageRoute, mapStyle, isNightMode]);

  // Render POI 3D Markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    pois.forEach((poi) => {
      const trans = poi.translations[currentLang] || poi.translations['vi'] || Object.values(poi.translations)[0];
      const title = trans?.title || poi.code;
      const isActive = poi.poi_id === activePoiId;

      // Custom 3D Marker Element
      const el = document.createElement('div');
      el.className = 'group cursor-pointer select-none';

      // Marker inner HTML with 3D pin & label badge
      el.innerHTML = `
        <div class="relative flex flex-col items-center transform transition-all duration-300 ${
          isActive ? 'scale-110 -translate-y-2' : 'hover:scale-105 hover:-translate-y-1'
        }">
          <!-- Floating Label Badge -->
          <div class="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg border whitespace-nowrap mb-1 transition-all ${
            isActive
              ? 'bg-[#1e3d25] text-white border-amber-400 ring-2 ring-amber-400'
              : 'bg-white/95 text-[#19231b] border-[#d8e6db] group-hover:border-[#2d5a37]'
          }">
            <span>${title}</span>
            ${isActive ? '<span class="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>' : ''}
          </div>

          <!-- 3D Marker Pin -->
          <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-xl border-2 transition-all ${
            isActive
              ? 'bg-amber-500 border-white text-white shadow-amber-500/50'
              : 'bg-[#2d5a37] border-white text-white group-hover:bg-[#1e3d25]'
          }">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectPOI(poi, true);
        mapRef.current?.flyTo({
          center: [poi.longitude, poi.latitude],
          zoom: 18.5,
          pitch: is3DMode ? 60 : 0,
          duration: 1200,
        });
      });

      const marker = new Marker({ element: el, anchor: 'bottom' })
        .setLngLat([poi.longitude, poi.latitude])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [pois, activePoiId, currentLang, is3DMode]);

  // Render User Location GPS Marker
  useEffect(() => {
    if (!mapRef.current) return;

    if (userLocation.latitude && userLocation.longitude) {
      if (!userMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'relative flex items-center justify-center';
        el.innerHTML = `
          <div class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center relative">
            <span class="w-2.5 h-2.5 bg-white rounded-full"></span>
            <span class="absolute w-12 h-12 rounded-full bg-blue-400/40 animate-ping"></span>
          </div>
        `;

        userMarkerRef.current = new Marker({ element: el, anchor: 'center' })
          .setLngLat([userLocation.longitude, userLocation.latitude])
          .addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  const handleCenterOnUser = () => {
    if (userLocation.latitude && userLocation.longitude && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 18.5,
        pitch: is3DMode ? 55 : 0,
        duration: 1000,
      });
    } else if (mapRef.current) {
      mapRef.current.flyTo({
        center: VNQT_CENTER,
        zoom: 17.5,
        pitch: is3DMode ? 55 : 0,
        duration: 1000,
      });
    }
  };

  const handleResetNorth = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        bearing: 0,
        pitch: is3DMode ? 55 : 0,
        duration: 600,
      });
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden shadow-sm border border-[#e2eae4] bg-[#f8fafc]">
      {/* MapLibre WebGL Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />

      {/* Top Left Floating 3D / 4D Campus Info Banner */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-[#d8e6db] shadow-md flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-[#eef5f0] text-[#2d5a37] flex items-center justify-center font-bold text-xs">
            3D
          </div>
          <div>
            <div className="text-xs font-bold text-[#19231b] flex items-center gap-1.5">
              <span>Bản Đồ 3D/4D Vector Khuôn Viên</span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                MaxZoom 22
              </span>
            </div>
            <div className="text-[10px] text-[#5c7362]">
              {isNightMode ? 'Chế độ Ánh Sáng Ban Đêm (4D)' : 'Chế độ Ánh Sáng Ban Ngày (4D)'} · Pitch 55°
            </div>
          </div>
        </div>
      </div>

      {/* Top Right Floating Toolbar: 3D Toggle, Day/Night, Street/Satellite, Reset North */}
      <div className="absolute top-3 right-12 z-10 flex items-center gap-1.5 pointer-events-auto">
        {/* 3D Pitch Switcher */}
        <button
          onClick={() => setIs3DMode(!is3DMode)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1 border ${
            is3DMode
              ? 'bg-[#2d5a37] text-white border-[#2d5a37]'
              : 'bg-white text-[#19231b] border-[#d8e6db] hover:bg-[#f7f9f6]'
          }`}
          title="Bật/Tắt Góc Nghiêng 3D (55°)"
        >
          <Box className="w-3.5 h-3.5" />
          <span>{is3DMode ? '3D' : '2D'}</span>
        </button>

        {/* 4D Day / Night Mode Switcher */}
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1 border ${
            isNightMode
              ? 'bg-slate-900 text-amber-300 border-slate-700'
              : 'bg-white text-amber-600 border-[#d8e6db] hover:bg-[#f7f9f6]'
          }`}
          title="Chuyển Chế Độ Ngày / Đêm Thực Tế (4D)"
        >
          {isNightMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isNightMode ? 'Đêm' : 'Ngày'}</span>
        </button>

        {/* Street vs Satellite */}
        <button
          onClick={() => setMapStyle(mapStyle === 'street' ? 'satellite' : 'street')}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1 border ${
            mapStyle === 'satellite'
              ? 'bg-indigo-900 text-white border-indigo-700'
              : 'bg-white text-[#19231b] border-[#d8e6db] hover:bg-[#f7f9f6]'
          }`}
          title="Chuyển lớp Bản đồ Đường Phố / Vệ Tinh"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{mapStyle === 'satellite' ? 'Vệ Tinh' : 'Đường Phố'}</span>
        </button>

        {/* Reset North */}
        <button
          onClick={handleResetNorth}
          className="p-1.5 rounded-xl bg-white text-[#5c7362] hover:text-[#19231b] border border-[#d8e6db] shadow-md transition-all"
          title="Khôi phục hướng Bắc"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Toggle Spiritual Trail */}
          <button
            onClick={() => setShowPilgrimageRoute(!showPilgrimageRoute)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all flex items-center gap-1.5 border ${
              showPilgrimageRoute
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-[#5c7362] border-[#d8e6db]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Lộ Trình Chiêm Bái</span>
          </button>
        </div>

        {/* GPS Center on User Button */}
        <div className="pointer-events-auto">
          <button
            onClick={handleCenterOnUser}
            className="px-3.5 py-2 rounded-full bg-white text-[#2d5a37] hover:bg-[#eef5f0] border border-[#d8e6db] shadow-lg flex items-center gap-1.5 text-xs font-bold transition-all"
          >
            <Navigation className="w-4 h-4 text-blue-600" />
            <span>{userLocation.latitude ? 'Vị Trí Của Tôi' : 'Tâm Chùa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
