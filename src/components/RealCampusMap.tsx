import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
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
  Maximize2,
  Layers,
  Footprints,
  Info,
  Clock,
  Navigation,
  Eye,
  EyeOff,
  Building,
} from 'lucide-react';

interface RealCampusMapProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  userLocation: UserLocationState;
  activePoiId: string | null;
  onSelectPOI: (poi: RichPOI, autoPlay?: boolean) => void;
}

// Rich detailed tile layers - unblocked and high performance
const TILE_LAYERS = {
  street: {
    name: 'Đường phố',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, DeLorme, NAVTEQ',
    maxZoom: 19,
    subdomains: [],
  },
  satellite: {
    name: 'Vệ tinh Thực tế',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
    subdomains: [],
  },
};

// Detailed Campus Amenities & Zones for enhanced map details
interface CampusAmenity {
  id: string;
  name: string;
  category: 'gate' | 'amenity' | 'garden' | 'hall';
  lat: number;
  lng: number;
  icon: string;
  description: string;
}

const CAMPUS_DETAILS: CampusAmenity[] = [
  {
    id: 'gate-main',
    name: 'Cổng Tam Quan Chính (Đường 3/2)',
    category: 'gate',
    lat: 10.77195,
    lng: 106.67115,
    icon: '⛩️',
    description: 'Cổng chính vào chùa mặt tiền đường Ba Tháng Hai, Quận 10.',
  },
  {
    id: 'gate-parking',
    name: 'Bãi Giữ Xe & Cổng Phụ',
    category: 'amenity',
    lat: 10.77205,
    lng: 106.6708,
    icon: '🅿️',
    description: 'Bãi gửi xe máy & xe hơi có mái che dành cho khách thập phương.',
  },
  {
    id: 'plaza',
    name: 'Sân Đại Lễ & Cột Cờ Phật Giáo',
    category: 'garden',
    lat: 10.7715,
    lng: 106.67125,
    icon: '🚩',
    description: 'Quảng trường lễ hội Phật giáo rộng lớn, sức chứa hơn 10.000 người.',
  },
  {
    id: 'reception',
    name: 'Khu Tiếp Tân & Thỉnh Kinh Sách',
    category: 'amenity',
    lat: 10.7717,
    lng: 106.6715,
    icon: '📖',
    description: 'Bàn hướng dẫn Phật tử thỉnh kinh sách, chuỗi hạt và đăng ký cầu an.',
  },
  {
    id: 'bodhi-pond',
    name: 'Vườn Bồ Đề Lâm Tỳ Ni & Hồ Sen',
    category: 'garden',
    lat: 10.7715,
    lng: 106.67085,
    icon: '🪷',
    description: 'Cây Bồ Đề chiết từ cội Bồ Đề Ấn Độ và hồ sen thanh tịnh.',
  },
  {
    id: 'restrooms',
    name: 'Khu Vệ Sinh & Nước Uống Miễn Phí',
    category: 'amenity',
    lat: 10.7709,
    lng: 106.67095,
    icon: '🚻',
    description: 'Khu vệ sinh sạch sẽ, trang nghiêm và vòi nước tinh khiết miễn phí.',
  },
  {
    id: 'headquarters',
    name: 'Văn Phòng Ban Trị Sự GHPGVN TP.HCM',
    category: 'hall',
    lat: 10.77085,
    lng: 106.6713,
    icon: '🏛️',
    description: 'Trụ sở điều hành Phật sự của Giáo hội Phật giáo Việt Nam TP.HCM.',
  },
];

// Spiritual pilgrimage walking trail coordinates
const PILGRIMAGE_ROUTE_COORDS: [number, number][] = [
  [10.77195, 106.67115], // Cổng Tam Quan
  [10.7715, 106.67125], // Sân Đại Lễ
  [10.77125, 106.6714], // Chánh Điện
  [10.77095, 106.6718], // Bảo Tháp 13 Tầng
  [10.77145, 106.67185], // Đại Hồng Chung
  [10.7715, 106.67085], // Vườn Bồ Đề
  [10.77075, 106.6712], // Nhà Tổ & Văn Phòng
];

export const RealCampusMap: React.FC<RealCampusMapProps> = ({
  pois,
  currentLang,
  userLocation,
  activePoiId,
  onSelectPOI,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  const [activeTileKey, setActiveTileKey] = useState<keyof typeof TILE_LAYERS>('street');
  const [selectedPoi, setSelectedPoi] = useState<RichPOI | null>(null);
  const [showPilgrimagePath, setShowPilgrimagePath] = useState<boolean>(true);
  const [showGeofences, setShowGeofences] = useState<boolean>(true);
  const [showAmenities, setShowAmenities] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'sanctuary' | 'relic' | 'amenity'>('all');

  const poiMarkersRef = useRef<Map<string, { marker: L.Marker; circle?: L.Circle }>>(new Map());
  const amenityMarkersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  const t = translations[currentLang];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [10.77135, 106.67135],
      zoom: 18,
      minZoom: 15,
      maxZoom: 20,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial tile layer (Esri World Street Map - unblocked, crisp, high-detail)
    const tileConf = TILE_LAYERS.street;
    const tileLayer = L.tileLayer(tileConf.url, {
      attribution: tileConf.attribution,
      maxZoom: tileConf.maxZoom,
      subdomains: tileConf.subdomains || ['a', 'b', 'c', 'd'],
    }).addTo(map);

    currentTileLayerRef.current = tileLayer;

    // Campus boundary outline polygon
    const campusBoundary = [
      [10.77215, 106.67065],
      [10.7721, 106.67205],
      [10.77055, 106.6720],
      [10.7706, 106.67065],
    ];

    L.polygon(campusBoundary as any, {
      color: '#2d5a37',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#3e724a',
      fillOpacity: 0.05,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix gray tiles / blank map by triggering invalidateSize after layout
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);
    const t3 = setTimeout(() => map.invalidateSize(), 800);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    const conf = TILE_LAYERS[activeTileKey];
    const newLayer = L.tileLayer(conf.url, {
      attribution: conf.attribution,
      maxZoom: conf.maxZoom,
      subdomains: conf.subdomains || ['a', 'b', 'c', 'd'],
    }).addTo(map);

    currentTileLayerRef.current = newLayer;
    setTimeout(() => map.invalidateSize(), 150);
  }, [activeTileKey]);

  // Sync Pilgrimage Walking Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }

    if (showPilgrimagePath) {
      const polyline = L.polyline(PILGRIMAGE_ROUTE_COORDS, {
        color: '#2d5a37',
        weight: 3.5,
        opacity: 0.8,
        dashArray: '8, 8',
      }).addTo(map);

      routePolylineRef.current = polyline;
    }
  }, [showPilgrimagePath]);

  // Sync Campus Amenities / Zones
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    amenityMarkersRef.current.forEach((m) => map.removeLayer(m));
    amenityMarkersRef.current = [];

    if (showAmenities) {
      CAMPUS_DETAILS.forEach((item) => {
        const icon = L.divIcon({
          className: 'custom-amenity-marker',
          html: `
            <div class="flex items-center gap-1 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-full shadow-md border border-[#e2eae4] text-[10px] text-[#2d5a37] font-semibold whitespace-nowrap cursor-pointer hover:scale-105 transition-transform" style="transform: translate(-50%, -50%);">
              <span>${item.icon}</span>
              <span class="hidden sm:inline">${item.name}</span>
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([item.lat, item.lng], { icon, zIndexOffset: 200 }).addTo(map);
        marker.bindPopup(`
          <div class="p-1 text-xs">
            <div class="font-bold text-[#1e3d25] flex items-center gap-1.5">
              <span>${item.icon}</span> ${item.name}
            </div>
            <p class="text-[#5c7362] mt-1 text-[11px] leading-snug">${item.description}</p>
          </div>
        `);
        amenityMarkersRef.current.push(marker);
      });
    }
  }, [showAmenities]);

  // Sync POI Markers and Geofence Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    poiMarkersRef.current.forEach(({ marker, circle }) => {
      map.removeLayer(marker);
      if (circle) map.removeLayer(circle);
    });
    poiMarkersRef.current.clear();

    pois.forEach((poi, index) => {
      const distance = calculateHaversineDistance(
        userLocation.lat,
        userLocation.lng,
        poi.latitude,
        poi.longitude
      );
      const isWithin = distance <= poi.geofence_radius;
      const isActive = activePoiId === poi.poi_id;
      const title =
        poi.translations[currentLang]?.title ||
        poi.translations['vi']?.title ||
        poi.code;

      // Geofence Circle
      let circle: L.Circle | undefined;
      if (showGeofences) {
        circle = L.circle([poi.latitude, poi.longitude], {
          radius: poi.geofence_radius,
          color: isWithin ? '#2d5a37' : isActive ? '#d97706' : '#8fa895',
          fillColor: isWithin ? '#3e724a' : '#d4e5d8',
          fillOpacity: isWithin ? 0.35 : 0.16,
          weight: isWithin ? 3 : 1.5,
          dashArray: isWithin ? undefined : '4, 4',
        }).addTo(map);
      }

      // Custom POI Pin Icon matching the sage green aesthetic
      const customIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div class="relative flex flex-col items-center cursor-pointer group" style="transform: translate(-50%, -100%);">
            <div class="w-8 h-8 rounded-full ${
              isWithin
                ? 'bg-[#2d5a37] ring-4 ring-[#2d5a37]/30 scale-110'
                : isActive
                ? 'bg-[#3e724a] ring-4 ring-[#3e724a]/30'
                : 'bg-white ring-2 ring-[#2d5a37]'
            } shadow-md flex items-center justify-center font-bold text-xs ${
              isWithin || isActive ? 'text-white' : 'text-[#2d5a37]'
            } transition-all duration-300">
              <span>${index + 1}</span>
            </div>
            <div class="w-2 h-2 ${
              isWithin || isActive ? 'bg-[#2d5a37]' : 'bg-white'
            } rotate-45 -mt-1 border-r border-b ${
              isWithin || isActive ? 'border-[#2d5a37]' : 'border-[#2d5a37]'
            }"></div>
            <div class="mt-1 px-2.5 py-0.5 rounded-full bg-white/95 text-[#19231b] font-semibold text-[10px] whitespace-nowrap shadow-md border border-[#e2eae4] pointer-events-none group-hover:bg-[#2d5a37] group-hover:text-white transition-colors">
              ${title}
            </div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([poi.latitude, poi.longitude], {
        icon: customIcon,
        zIndexOffset: isActive ? 600 : 300,
      }).addTo(map);

      marker.on('click', () => {
        setSelectedPoi(poi);
        onSelectPOI(poi, false);
      });

      poiMarkersRef.current.set(poi.poi_id, { marker, circle });
    });
  }, [
    pois,
    activePoiId,
    userLocation.lat,
    userLocation.lng,
    currentLang,
    onSelectPOI,
    showGeofences,
  ]);

  // Sync User Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const latLng: [number, number] = [userLocation.lat, userLocation.lng];

    if (!userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current = L.circle(latLng, {
        radius: Math.max(5, userLocation.accuracy),
        color: '#2d5a37',
        fillColor: '#3e724a',
        fillOpacity: 0.18,
        weight: 1.5,
      }).addTo(map);
    } else {
      userAccuracyCircleRef.current.setLatLng(latLng);
      userAccuracyCircleRef.current.setRadius(Math.max(5, userLocation.accuracy));
    }

    const headingDeg = userLocation.heading || 0;
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative w-8 h-8 flex items-center justify-center" style="transform: translate(-50%, -50%);">
          <div class="absolute inset-0 bg-[#2d5a37] rounded-full animate-ping opacity-60"></div>
          <div class="relative w-5 h-5 bg-[#2d5a37] rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <div class="absolute -top-3 w-0 h-0 border-x-4 border-x-transparent border-b-6 border-b-[#2d5a37]" style="transform: rotate(${headingDeg}deg);"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latLng, {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latLng);
      userMarkerRef.current.setIcon(userIcon);
    }
  }, [userLocation]);

  const recenterOnUser = () => {
    const map = mapInstanceRef.current;
    if (map) map.flyTo([userLocation.lat, userLocation.lng], 19, { duration: 1.0 });
  };

  const recenterOnPagoda = () => {
    const map = mapInstanceRef.current;
    if (map) map.flyTo([10.77135, 106.67135], 18, { duration: 1.0 });
  };

  return (
    <div className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden border border-[#e2eae4] shadow-md bg-[#f7f9f6] flex flex-col">
      {/* Map Header Floating Overlay */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between pointer-events-none gap-2">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#e2eae4] shadow-xs flex items-center gap-2 text-xs self-start">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2d5a37] animate-ping inline-block" />
          <span className="font-serif font-bold text-[#19231b]">Sơ Đồ Chi Tiết Khuôn Viên</span>
          <span className="text-[#5c7362] text-[11px] hidden md:inline">
            | 242-244 Đường 3/2, Q.10
          </span>
        </div>

        {/* Map Layers & Detail Switches */}
        <div className="pointer-events-auto flex items-center gap-1.5 self-end sm:self-auto overflow-x-auto max-w-full">
          {/* Tile Layer Selector */}
          <div className="flex bg-white/95 backdrop-blur-md rounded-full p-0.5 border border-[#e2eae4] shadow-xs text-xs">
            <button
              onClick={() => setActiveTileKey('street')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeTileKey === 'street'
                  ? 'bg-[#2d5a37] text-white font-bold'
                  : 'text-[#4a5f50] hover:text-[#19231b]'
              }`}
            >
              Đường phố
            </button>
            <button
              onClick={() => setActiveTileKey('satellite')}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeTileKey === 'satellite'
                  ? 'bg-[#2d5a37] text-white font-bold'
                  : 'text-[#4a5f50] hover:text-[#19231b]'
              }`}
            >
              🛰️ Vệ tinh
            </button>
          </div>

          {/* Toggle Pilgrimage Path */}
          <button
            onClick={() => setShowPilgrimagePath(!showPilgrimagePath)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs transition-all flex items-center gap-1 ${
              showPilgrimagePath
                ? 'bg-[#eef5f0] border-[#2d5a37] text-[#1e3d25]'
                : 'bg-white border-[#e2eae4] text-[#7a8e80]'
            }`}
            title="Bật/Tắt đường dẫn lối đi hành hương"
          >
            <Footprints className="w-3.5 h-3.5 text-[#2d5a37]" />
            <span className="hidden sm:inline">Lối đi</span>
          </button>

          {/* Toggle Amenities */}
          <button
            onClick={() => setShowAmenities(!showAmenities)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs transition-all flex items-center gap-1 ${
              showAmenities
                ? 'bg-[#eef5f0] border-[#2d5a37] text-[#1e3d25]'
                : 'bg-white border-[#e2eae4] text-[#7a8e80]'
            }`}
            title="Bật/Tắt hiển thị cổng và tiện ích (bãi xe, tiếp tân, vệ sinh)"
          >
            <Building className="w-3.5 h-3.5 text-[#2d5a37]" />
            <span className="hidden sm:inline">Tiện ích</span>
          </button>
        </div>
      </div>

      <div ref={mapContainerRef} className="w-full flex-1 min-h-[460px] z-0 select-none" />

      {/* Floating Bottom Left Navigation Controls */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={recenterOnUser}
          className="p-2.5 rounded-2xl bg-white hover:bg-[#f0f5f1] text-[#2d5a37] border border-[#e2eae4] shadow-md transition-transform active:scale-95"
          title="Định vị vị trí GPS của tôi"
        >
          <Compass className="w-5 h-5" />
        </button>
        <button
          onClick={recenterOnPagoda}
          className="p-2.5 rounded-2xl bg-white hover:bg-[#f0f5f1] text-[#2d5a37] border border-[#e2eae4] shadow-md transition-transform active:scale-95"
          title="Toàn cảnh khuôn viên Chùa"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Selected POI Floating Preview Box */}
      {selectedPoi && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-3xl border border-[#e2eae4] shadow-xl max-w-xs animate-slide-up">
          <div className="flex items-start gap-3">
            <img
              src={
                selectedPoi.media[0]?.image_url ||
                'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80'
              }
              alt={selectedPoi.code}
              className="w-16 h-16 rounded-2xl object-cover border border-[#e0ebe2] flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#2d5a37] bg-[#eef5f0] px-2 py-0.5 rounded-full border border-[#d6e7da]">
                {selectedPoi.code} • Bán kính {selectedPoi.geofence_radius}m
              </span>
              <h4 className="font-serif font-bold text-sm text-[#19231b] line-clamp-1 mt-1">
                {selectedPoi.translations[currentLang]?.title ||
                  selectedPoi.translations['vi']?.title ||
                  selectedPoi.code}
              </h4>
              <p className="text-[11px] text-[#5c7362] line-clamp-2 mt-0.5">
                {selectedPoi.translations[currentLang]?.description ||
                  selectedPoi.translations['vi']?.description}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-[#2d5a37] font-semibold">
                  Cách bạn: {Math.round(
                    calculateHaversineDistance(
                      userLocation.lat,
                      userLocation.lng,
                      selectedPoi.latitude,
                      selectedPoi.longitude
                    )
                  )}m
                </span>
                <button
                  onClick={() => onSelectPOI(selectedPoi, true)}
                  className="px-3 py-1 rounded-full bg-[#2d5a37] hover:bg-[#23462b] text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Nghe</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
