import React, { useState, useMemo } from 'react';
import { RichPOI } from '../server/types.js';
import { UserLocationState } from '../hooks/useGPSTracker.js';
import { LanguageCode } from '../utils/audioSpeech.js';
import { translations } from '../translations/index.js';
import { calculateHaversineDistance } from '../utils/geo.js';
import { Compass, Navigation, Play } from 'lucide-react';

interface CampusMapProps {
  pois: RichPOI[];
  currentLang: LanguageCode;
  userLocation: UserLocationState;
  activePoiId: string | null;
  onSelectPOI: (poi: RichPOI, autoPlay?: boolean) => void;
  onToggleSimulation?: () => void;
  onMapClickCoordinates?: (lat: number, lng: number) => void;
  isCoordinatePickerActive?: boolean;
}

const BOUNDS = {
  minLat: 10.77020,
  maxLat: 10.77200,
  minLng: 106.67035,
  maxLng: 106.67235,
};

export const CampusMap: React.FC<CampusMapProps> = ({
  pois,
  currentLang,
  userLocation,
  activePoiId,
  onSelectPOI,
  onToggleSimulation,
  onMapClickCoordinates,
  isCoordinatePickerActive = false,
}) => {
  const [selectedPin, setSelectedPin] = useState<RichPOI | null>(null);
  const t = translations[currentLang];

  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
    const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
    return {
      x: Math.max(4, Math.min(96, x)),
      y: Math.max(4, Math.min(96, y)),
    };
  };

  const userPos = useMemo(() => {
    return projectCoords(userLocation.lat, userLocation.lng);
  }, [userLocation.lat, userLocation.lng]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isCoordinatePickerActive || !onMapClickCoordinates) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;

    const clickedLng = BOUNDS.minLng + (clickXPercent / 100) * (BOUNDS.maxLng - BOUNDS.minLng);
    const clickedLat = BOUNDS.maxLat - (clickYPercent / 100) * (BOUNDS.maxLat - BOUNDS.minLat);

    onMapClickCoordinates(
      Math.round(clickedLat * 100000) / 100000,
      Math.round(clickedLng * 100000) / 100000
    );
  };

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[580px] bg-stone-950 rounded-3xl overflow-hidden border border-amber-800/40 shadow-inner flex flex-col">
      {/* Header Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto bg-stone-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-amber-600/50 shadow-md flex items-center gap-2 text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
          <span className="font-semibold text-amber-200">Sơ Đồ Kiến Trúc Chùa</span>
          <span className="text-stone-400 text-[11px] hidden sm:inline">| Việt Nam Quốc Tự</span>
        </div>
      </div>

      <div className="relative flex-1 w-full h-full overflow-hidden select-none cursor-crosshair">
        <svg
          viewBox="0 0 1000 800"
          className="w-full h-full object-cover transition-transform duration-300"
          onClick={handleSvgClick}
        >
          <defs>
            <linearGradient id="groundGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1c1917" />
              <stop offset="50%" stopColor="#292524" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
            <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#78350f" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
            <linearGradient id="waterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#082f49" />
            </linearGradient>
            <linearGradient id="courtyardGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#44403c" />
              <stop offset="100%" stopColor="#57534e" />
            </linearGradient>
            <radialGradient id="userBeacon" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          <rect width="1000" height="800" fill="url(#groundGrad)" />

          {/* Exterior Street: Đường Ba Tháng Hai */}
          <rect x="0" y="730" width="1000" height="70" fill="#262626" />
          <line x1="0" y1="765" x2="1000" y2="765" stroke="#eab308" strokeWidth="2" strokeDasharray="16,12" />
          <text x="500" y="775" fill="#a3a3a3" fontSize="15" textAnchor="middle" fontFamily="sans-serif">
            ĐƯỜNG 3 THÁNG 2 (QUẬN 10, TP. HỒ CHÍ MINH)
          </text>

          {/* Pagoda Boundary Wall */}
          <rect x="40" y="40" width="920" height="680" fill="none" stroke="#78350f" strokeWidth="8" rx="16" />

          {/* Courtyard */}
          <path d="M 200,680 L 200,260 L 800,260 L 800,680 Z" fill="url(#courtyardGrad)" opacity="0.6" />

          {/* Vườn Bồ Đề & Hồ Sen */}
          <g transform="translate(70, 200)">
            <ellipse cx="60" cy="120" rx="45" ry="70" fill="url(#waterGrad)" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="50" cy="110" r="8" fill="#f43f5e" opacity="0.8" />
            <circle cx="70" cy="140" r="7" fill="#f43f5e" opacity="0.8" />
            <circle cx="55" cy="50" r="28" fill="#15803d" opacity="0.75" />
            <text x="60" y="210" fill="#86efac" fontSize="12" textAnchor="middle">Vườn Bồ Đề & Hồ Sen</text>
          </g>

          {/* Cổng Tam Quan */}
          <g transform="translate(380, 640)">
            <rect x="0" y="0" width="240" height="50" fill="url(#roofGrad)" rx="6" stroke="#f59e0b" strokeWidth="2" />
            <text x="120" y="32" fill="#fef08a" fontSize="12" fontWeight="bold" textAnchor="middle">CỔNG TAM QUAN</text>
          </g>

          {/* White Lotus Fountain */}
          <circle cx="500" cy="550" r="32" fill="#38bdf8" opacity="0.4" stroke="#e0e7ff" strokeWidth="2" />
          <text x="500" y="555" fill="#ffffff" fontSize="18" textAnchor="middle">🪷</text>

          {/* Đại Hùng Bửu Điện (Chính Điện) */}
          <g transform="translate(350, 160)">
            <rect x="0" y="20" width="300" height="110" fill="url(#roofGrad)" rx="10" stroke="#f59e0b" strokeWidth="3" />
            <polygon points="-15,20 150,-10 315,20 280,30 20,30" fill="#d97706" />
            <circle cx="150" cy="75" r="20" fill="#facc15" opacity="0.8" />
            <text x="150" y="82" fill="#78350f" fontSize="20" textAnchor="middle">☸</text>
            <text x="150" y="115" fill="#fef08a" fontSize="13" fontWeight="bold" textAnchor="middle">
              ĐẠI HÙNG BỬU ĐIỆN (CHÍNH ĐIỆN)
            </text>
          </g>

          {/* Bảo Tháp 13 Tầng (63m) */}
          <g transform="translate(740, 280)">
            <polygon points="60,0 100,20 120,60 100,100 60,120 20,100 0,60 20,20" fill="#44403c" stroke="#f59e0b" strokeWidth="3" />
            <circle cx="60" cy="60" r="35" fill="url(#roofGrad)" />
            <text x="60" y="145" fill="#fde047" fontSize="12" fontWeight="bold" textAnchor="middle">
              THÁP ĐA BẢO 13 TẦNG (63M)
            </text>
          </g>

          {/* Lầu Chuông */}
          <g transform="translate(760, 110)">
            <rect x="0" y="0" width="80" height="70" fill="url(#roofGrad)" rx="6" stroke="#f59e0b" strokeWidth="2" />
            <text x="40" y="42" fill="#451a03" fontSize="18" textAnchor="middle">🔔</text>
            <text x="40" y="85" fill="#fef08a" fontSize="11" textAnchor="middle">Đại Hồng Chung 3 Tấn</text>
          </g>

          {/* Nhà Lưu Niệm */}
          <g transform="translate(80, 80)">
            <rect x="0" y="0" width="160" height="70" fill="#292524" rx="6" stroke="#a8a29e" strokeWidth="2" />
            <text x="80" y="35" fill="#f5f5f4" fontSize="11" fontWeight="bold" textAnchor="middle">Nhà Lưu Niệm</text>
          </g>

          {/* Render RichPOIs */}
          {pois.map((poi, idx) => {
            const { x, y } = projectCoords(poi.latitude, poi.longitude);
            const cx = (x / 100) * 1000;
            const cy = (y / 100) * 800;
            const distance = calculateHaversineDistance(
              userLocation.lat,
              userLocation.lng,
              poi.latitude,
              poi.longitude
            );
            const isWithin = distance <= poi.geofence_radius;
            const isActive = activePoiId === poi.poi_id;
            const rSvg = Math.max(25, poi.geofence_radius * 3.2);
            const title = poi.translations[currentLang]?.title || poi.translations['vi']?.title || poi.code;

            return (
              <g
                key={poi.poi_id}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(poi);
                  onSelectPOI(poi, false);
                }}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={rSvg}
                  fill={isWithin ? 'rgba(34, 197, 94, 0.22)' : 'rgba(234, 179, 8, 0.12)'}
                  stroke={isWithin ? '#22c55e' : isActive ? '#f59e0b' : 'rgba(245, 158, 11, 0.4)'}
                  strokeWidth={isWithin ? '2.5' : '1.5'}
                  strokeDasharray={isWithin ? undefined : '5,5'}
                  className={isWithin ? 'animate-pulse' : ''}
                />

                <g transform={`translate(${cx}, ${cy})`}>
                  <ellipse cx="0" cy="18" rx="14" ry="5" fill="black" opacity="0.5" />
                  <path
                    d="M 0,-24 C -16,-24 -16,-6 0,16 C 16,-6 16,-24 0,-24 Z"
                    fill={isWithin ? '#16a34a' : isActive ? '#eab308' : '#b45309'}
                    stroke="#fef08a"
                    strokeWidth="2"
                  />
                  <circle cx="0" cy="-10" r="8" fill="#ffffff" />
                  <text
                    x="0"
                    y="-6"
                    fontSize="10"
                    fontWeight="bold"
                    fill={isWithin ? '#16a34a' : '#78350f'}
                    textAnchor="middle"
                  >
                    {idx + 1}
                  </text>
                </g>

                <text
                  x={cx}
                  y={cy + 34}
                  fill={isWithin ? '#86efac' : '#fef08a'}
                  fontSize="12"
                  fontWeight="600"
                  textAnchor="middle"
                  filter="drop-shadow(0px 1px 2px black)"
                >
                  {title}
                </text>

                <text
                  x={cx}
                  y={cy + 48}
                  fill={isWithin ? '#4ade80' : '#cbd5e1'}
                  fontSize="10"
                  textAnchor="middle"
                  filter="drop-shadow(0px 1px 2px black)"
                >
                  {Math.round(distance)}m {isWithin ? '• TRONG VÙNG' : ''}
                </text>
              </g>
            );
          })}

          {/* User Location Beacon */}
          {(() => {
            const cx = (userPos.x / 100) * 1000;
            const cy = (userPos.y / 100) * 800;
            return (
              <g transform={`translate(${cx}, ${cy})`}>
                <circle cx="0" cy="0" r="28" fill="url(#userBeacon)" stroke="#22c55e" strokeWidth="1.5" opacity="0.6" />
                <circle cx="0" cy="0" r="9" fill="#22c55e" stroke="#ffffff" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="4" fill="#ffffff" />
              </g>
            );
          })()}
        </svg>

        {/* Selected POI Bottom Card */}
        {selectedPin && (
          <div className="absolute bottom-3 right-3 z-30 bg-stone-900/95 backdrop-blur-lg p-3.5 rounded-2xl border border-amber-500/70 shadow-2xl max-w-xs animate-slide-up">
            <div className="flex items-start gap-2.5">
              <img
                src={selectedPin.media[0]?.image_url || 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=400&q=80'}
                alt={selectedPin.code}
                className="w-14 h-14 rounded-xl object-cover border border-amber-600/50 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-xs text-amber-200 line-clamp-1">
                  {selectedPin.translations[currentLang]?.title || selectedPin.translations['vi']?.title || selectedPin.code}
                </h4>
                <p className="text-[11px] text-stone-300 line-clamp-2 mt-0.5">
                  {selectedPin.translations[currentLang]?.description || selectedPin.translations['vi']?.description}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[10px]">
                  <span className="text-amber-400 font-medium">
                    Cách: {Math.round(calculateHaversineDistance(userLocation.lat, userLocation.lng, selectedPin.latitude, selectedPin.longitude))}m
                  </span>
                  <button
                    onClick={() => onSelectPOI(selectedPin, true)}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Nghe</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
