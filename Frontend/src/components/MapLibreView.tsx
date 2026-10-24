import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';
import { POI, UserLocation, Language } from '../types';
import { TEMPLE_ENTRANCE_COORDS } from '../hooks/useGeofencing';
import { Crosshair, Layers, ZoomIn, ZoomOut, Compass, Search, X, MapPin } from 'lucide-react';

// Register PMTiles protocol globally once
const protocol = new Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);

interface MapLibreViewProps {
  pois: POI[];
  userLocation: UserLocation;
  visitedPoiIds: Set<string>;
  activePoi: POI | null;
  isPlaying: boolean;
  language: Language;
  isAtEntrance?: boolean;
  onResetToEntrance?: () => void;
  onSelectPoi: (poi: POI) => void;
}

export const MapLibreView: React.FC<MapLibreViewProps> = ({
  pois,
  userLocation,
  visitedPoiIds,
  activePoi,
  isPlaying,
  language,
  isAtEntrance = true,
  onResetToEntrance,
  onSelectPoi,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: maplibregl.Marker }>({});
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const [mapStyle, setMapStyle] = useState<'spiritual' | 'satellite' | 'streets'>('spiritual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

  const isVi = language === 'vi';

  const filteredPois = searchQuery.trim()
    ? pois.filter((p) => {
        const q = searchQuery.toLowerCase().trim();
        const viTitle = p.translations.vi.title.toLowerCase();
        const enTitle = p.translations.en.title.toLowerCase();
        const viDesc = p.translations.vi.description.toLowerCase();
        const code = p.code.toLowerCase();
        return viTitle.includes(q) || enTitle.includes(q) || viDesc.includes(q) || code.includes(q);
      })
    : [];

  const handleSearchResultClick = (poi: POI) => {
    setSearchQuery('');
    setIsSearchFocused(false);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [poi.longitude, poi.latitude],
        zoom: 18.5,
        pitch: 35,
        duration: 1200,
      });
    }
    onSelectPoi(poi);
  };

  // Map styles definition (Low-cost, zero paid API keys)
  const getStyleUrl = (style: 'spiritual' | 'satellite' | 'streets') => {
    if (style === 'satellite') {
      return {
        version: 8,
        sources: {
          satellite: {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            ],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: 'satellite-layer',
            type: 'raster',
            source: 'satellite',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      };
    }
    // Spiritual & OpenStreetMap raster
    return {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: [
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '&copy; OpenStreetMap contributors • Việt Nam Quốc Tự',
        },
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19,
          paint: {
            'raster-saturation': style === 'spiritual' ? -0.2 : 0,
            'raster-contrast': style === 'spiritual' ? 0.05 : 0,
          },
        },
      ],
    };
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: getStyleUrl('spiritual') as any,
      center: [106.67135, 10.77185], // Center of Việt Nam Quốc Tự
      zoom: 17.6,
      pitch: 25,
      bearing: -15,
      maxZoom: 20,
      minZoom: 15,
    });

    mapRef.current = map;

    map.on('load', () => {
      // Add Geofence circle polygon layer
      map.addSource('geofence-circles', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: 'geofence-fill',
        type: 'fill',
        source: 'geofence-circles',
        paint: {
          'fill-color': '#d4af37',
          'fill-opacity': 0.15,
        },
      });

      map.addLayer({
        id: 'geofence-stroke',
        type: 'line',
        source: 'geofence-circles',
        paint: {
          'line-color': '#b8860b',
          'line-width': 1.5,
          'line-dasharray': [2, 2],
        },
      });

      updateGeofencePolygons(map, pois);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Map Style when toggled
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(getStyleUrl(mapStyle) as any);
  }, [mapStyle]);

  // Update Geofence Circles helper
  const updateGeofencePolygons = (map: maplibregl.Map, currentPois: POI[]) => {
    if (!map.getSource('geofence-circles')) return;

    const createGeoJSONCircle = (center: [number, number], radiusInMeters: number, points = 32) => {
      const coords = { latitude: center[1], longitude: center[0] };
      const km = radiusInMeters / 1000;
      const ret: [number, number][] = [];
      const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180));
      const distanceY = km / 110.574;

      for (let i = 0; i < points; i++) {
        const theta = (i / points) * (2 * Math.PI);
        const x = distanceX * Math.cos(theta);
        const y = distanceY * Math.sin(theta);
        ret.push([coords.longitude + x, coords.latitude + y]);
      }
      ret.push(ret[0]);
      return ret;
    };

    const features = currentPois.map((p) => ({
      type: 'Feature',
      properties: { poi_id: p.poi_id },
      geometry: {
        type: 'Polygon',
        coordinates: [createGeoJSONCircle([p.longitude, p.latitude], p.geofence_radius)],
      },
    }));

    (map.getSource('geofence-circles') as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: features as any,
    });
  };

  // Sync POI Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up removed markers
    Object.keys(markersRef.current).forEach((id) => {
      if (!pois.some((p) => p.poi_id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    pois.forEach((poi) => {
      const isVisited = visitedPoiIds.has(poi.poi_id);
      const isActive = activePoi?.poi_id === poi.poi_id;
      const title = poi.translations[language]?.title || poi.translations.vi.title;

      let marker = markersRef.current[poi.poi_id];

      // Custom DOM Element for 3 distinct states:
      // 1. Chưa xem (Gold/Tan marker)
      // 2. Đang xem/Đang phát (Active Pulsing Red/Amber ring + audio wave equalizer)
      // 3. Đã xem (Emerald Green with checkmark)
      const el = marker ? marker.getElement() : document.createElement('div');
      el.className = 'cursor-pointer transition-transform duration-300 hover:scale-110';

      let innerHTML = '';
      if (isActive) {
        innerHTML = `
          <div class="relative flex items-center justify-center">
            <div class="absolute -inset-2.5 rounded-full bg-amber-500/40 active-poi-pulse"></div>
            <div class="relative z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-xl border-2 border-white">
              ${
                isPlaying
                  ? `<div class="flex items-center gap-0.5 text-white">
                      <span class="audio-bar"></span>
                      <span class="audio-bar"></span>
                      <span class="audio-bar"></span>
                    </div>`
                  : `<span class="text-sm font-bold">▶</span>`
              }
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900/90 px-2 py-0.5 text-[10px] font-bold text-amber-200 shadow-md">
              ${title.split('–')[0].trim()}
            </div>
          </div>
        `;
      } else if (isVisited) {
        innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md border-2 border-white/90">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div class="mt-0.5 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.2 text-[9px] font-semibold text-stone-700 shadow">
              ${title.split('–')[0].trim()}
            </div>
          </div>
        `;
      } else {
        innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#5c2b16] text-amber-300 shadow-md border-2 border-amber-300">
              <span class="text-xs font-bold font-serif">${poi.order_index}</span>
            </div>
            <div class="mt-0.5 whitespace-nowrap rounded bg-stone-900/80 px-1.5 py-0.2 text-[9px] font-medium text-amber-100 shadow">
              ${title.split('–')[0].trim()}
            </div>
          </div>
        `;
      }

      el.innerHTML = innerHTML;

      if (!marker) {
        el.addEventListener('click', (e: Event) => {
          e.stopPropagation();
          onSelectPoi(poi);
        });

        marker = new maplibregl.Marker({ element: el })
          .setLngLat([poi.longitude, poi.latitude])
          .addTo(map);

        markersRef.current[poi.poi_id] = marker;
      }
    });

    updateGeofencePolygons(map, pois);
  }, [pois, visitedPoiIds, activePoi, isPlaying, language, onSelectPoi]);

  // Sync User GPS Marker with High-Visibility Blue Dot & Radar Waves
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const atEntrance = isAtEntrance ?? (
      Math.abs(userLocation.latitude - TEMPLE_ENTRANCE_COORDS.latitude) < 0.0003 &&
      Math.abs(userLocation.longitude - TEMPLE_ENTRANCE_COORDS.longitude) < 0.0003
    );

    const labelText = atEntrance
      ? (isVi ? '📍 Bạn đang ở đây (Trước Cổng Chùa)' : '📍 You are here (Front Entrance)')
      : (isVi ? '📍 Vị trí của bạn' : '📍 Your Location');

    const innerHTML = `
      <div class="relative flex flex-col items-center cursor-pointer group select-none">
        <!-- Floating label tag -->
        <div class="mb-1 whitespace-nowrap rounded-full bg-blue-700/95 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xl border border-blue-300/80 flex items-center gap-1.5 backdrop-blur-xs transition-transform group-hover:scale-105">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 animate-ping"></span>
          <span>${labelText}</span>
        </div>

        <div class="relative flex items-center justify-center">
          <!-- Outer Radar wave 1 -->
          <div class="absolute h-14 w-14 rounded-full bg-blue-500/25 user-radar-ping pointer-events-none"></div>
          <!-- Outer Radar wave 2 -->
          <div class="absolute h-9 w-9 rounded-full bg-cyan-400/35 user-gps-halo pointer-events-none"></div>
          <!-- Center High-Contrast Blue Core -->
          <div class="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-blue-700 to-cyan-500 border-2 border-white shadow-2xl ring-4 ring-blue-500/40">
            <div class="h-1.5 w-1.5 rounded-full bg-white shadow-xs"></div>
          </div>
        </div>
      </div>
    `;

    if (!userMarkerRef.current) {
      const userEl = document.createElement('div');
      userEl.innerHTML = innerHTML;

      userMarkerRef.current = new maplibregl.Marker({ element: userEl, anchor: 'center' })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    } else {
      userMarkerRef.current.getElement().innerHTML = innerHTML;
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    }
  }, [userLocation, isAtEntrance, isVi]);

  // Center on user position
  const handleLocateMe = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 18.5,
      pitch: 30,
      duration: 1000,
    });
  };

  // Center on temple entrance
  const handleGoToEntrance = () => {
    if (onResetToEntrance) {
      onResetToEntrance();
    }
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [TEMPLE_ENTRANCE_COORDS.longitude, TEMPLE_ENTRANCE_COORDS.latitude],
        zoom: 18.5,
        pitch: 35,
        bearing: -15,
        duration: 1200,
      });
    }
  };

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleResetNorth = () => mapRef.current?.resetNorth();


  return (
    <div className="relative h-full w-full">
      {/* Map Container */}
      <div ref={mapContainer} className="h-full w-full bg-[#e8e0d4]" />

      {/* Floating Local Search Bar */}
      <div className="absolute top-16 left-3.5 sm:left-1/2 sm:-translate-x-1/2 z-20 w-[calc(100%-80px)] sm:w-88">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-md px-3.5 py-2 shadow-lg border border-amber-300/80 transition-all focus-within:ring-2 focus-within:ring-amber-500">
            <Search className="h-4 w-4 text-amber-700 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder={isVi ? 'Tìm kiếm di tích, tượng Phật, bảo tháp...' : 'Search relics, Buddha, stupa...'}
              className="w-full bg-transparent text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-2xl bg-white/95 backdrop-blur-md p-2 shadow-2xl border border-amber-300 space-y-1 animate-in fade-in duration-150">
              {filteredPois.length > 0 ? (
                filteredPois.map((p) => {
                  const trans = p.translations[language] || p.translations.vi;
                  return (
                    <button
                      key={p.poi_id}
                      onClick={() => handleSearchResultClick(p)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-amber-50 active:bg-amber-100 transition-all"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#5c2b16] text-amber-300 font-bold text-xs shadow-xs">
                        #{p.order_index}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-[#5c2b16]">
                          {trans.title}
                        </p>
                        <p className="truncate text-[10px] text-stone-500">
                          {p.location_type === 'outdoor' ? (isVi ? 'Khuôn viên ngoài trời' : 'Outdoor') : (isVi ? 'Trong nhà / Chánh Điện' : 'Indoor')} • R={p.geofence_radius}m
                        </p>
                      </div>
                      <MapPin className="h-4 w-4 text-amber-600 shrink-0" />
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-stone-500">
                  {isVi ? 'Không tìm thấy di tích phù hợp' : 'No matching relics found'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Map Controls */}
      <div className="absolute right-3.5 top-18 z-20 flex flex-col gap-2">
        {/* Quick button: Đứng trước Cổng Chùa */}
        <button
          onClick={handleGoToEntrance}
          title={isVi ? 'Đứng trước Cổng Tam Quan (Đường 3/2)' : 'Stand at Temple Gate (3/2 St)'}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg border border-white/90 hover:bg-blue-700 active:scale-95 transition-all group"
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="absolute right-12 whitespace-nowrap rounded-lg bg-stone-900/90 px-2 py-1 text-[10px] font-bold text-white shadow opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
            {isVi ? 'Đứng trước Cổng Chùa' : 'At Temple Gate'}
          </span>
        </button>

        {/* Locate Me */}
        <button
          onClick={handleLocateMe}
          title={isVi ? 'Định vị tôi' : 'Locate Me'}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-stone-800 shadow-lg border border-amber-200/50 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <Crosshair className="h-5 w-5 text-blue-600" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-stone-800 shadow-lg border border-amber-200/50 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <ZoomIn className="h-5 w-5 text-stone-700" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-stone-800 shadow-lg border border-amber-200/50 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <ZoomOut className="h-5 w-5 text-stone-700" />
        </button>

        {/* Reset North */}
        <button
          onClick={handleResetNorth}
          title="Reset North"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-stone-800 shadow-lg border border-amber-200/50 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <Compass className="h-5 w-5 text-stone-700" />
        </button>

        {/* Style Switcher */}
        <button
          onClick={() => {
            const next =
              mapStyle === 'spiritual'
                ? 'satellite'
                : mapStyle === 'satellite'
                ? 'streets'
                : 'spiritual';
            setMapStyle(next);
          }}
          title={isVi ? 'Đổi kiểu bản đồ' : 'Change Map Layer'}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-stone-800 shadow-lg border border-amber-200/50 hover:bg-amber-50 active:scale-95 transition-all"
        >
          <Layers className="h-5 w-5 text-amber-700" />
        </button>
      </div>

      {/* Floating Active Position Indicator Pill */}
      <div className="absolute bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full bg-white/95 backdrop-blur-md px-3.5 py-1.5 shadow-xl border border-blue-200/90 text-stone-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
        </span>
        <span className="text-xs font-semibold">
          {isAtEntrance
            ? (isVi ? 'Đang đứng trước Cổng Tam Quan (Đường 3/2)' : 'At Tam Quan Gate (3/2 St)')
            : (isVi ? 'Đang định vị trong khuôn viên chùa' : 'Positioning in temple campus')}
        </span>
        <button
          onClick={handleGoToEntrance}
          className="ml-1 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white hover:bg-blue-700 active:scale-95 transition-all shadow-xs"
        >
          {isVi ? 'Về trước chùa' : 'To Gate'}
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute left-3 bottom-24 z-20 hidden sm:flex items-center gap-3 rounded-xl bg-white/90 backdrop-blur-sm px-3 py-1.5 shadow border border-amber-200/60 text-[10px] font-semibold text-stone-700">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5c2b16]"></span>
          <span>{isVi ? 'Chưa xem' : 'Unvisited'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping"></span>
          <span>{isVi ? 'Đang phát' : 'Playing'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
          <span>{isVi ? 'Đã xem' : 'Visited'}</span>
        </div>
      </div>
    </div>
  );
};
