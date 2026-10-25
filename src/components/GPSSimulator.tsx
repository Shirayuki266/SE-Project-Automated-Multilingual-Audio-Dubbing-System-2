import React from 'react';
import { POI, UserLocation, Language } from '../types';
import { Navigation, Footprints, ShieldAlert, X } from 'lucide-react';

interface GPSSimulatorProps {
  pois: POI[];
  userLocation: UserLocation;
  visitedPoiIds: Set<string>;
  language: Language;
  onSimulateLocation: (lat: number, lon: number) => void;
  onClearVisited: () => void;
  onClose: () => void;
}

export const GPSSimulator: React.FC<GPSSimulatorProps> = ({
  pois,
  userLocation,
  visitedPoiIds,
  language,
  onSimulateLocation,
  onClearVisited,
  onClose,
}) => {
  const isVi = language === 'vi';

  return (
    <div className="absolute top-16 left-3.5 z-30 w-72 rounded-2xl bg-stone-900/95 backdrop-blur-md p-3.5 text-white shadow-2xl border border-amber-400/40 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-amber-400 animate-pulse" />
          <h3 className="text-xs font-bold text-amber-300">
            {isVi ? 'Bảng Giả Lập Bước Đi GPS' : 'GPS Walking Simulator'}
          </h3>
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-[10px] text-stone-300 leading-relaxed">
        {isVi
          ? 'Nhấn vào một điểm di tích bên dưới để giả lập du khách đang bước vào vùng Geofence (10-30m):'
          : 'Tap any POI below to simulate walking into its Geofence radius:'}
      </p>

      {/* POI Simulation Buttons */}
      <div className="mt-2.5 max-h-48 overflow-y-auto space-y-1.5 pr-1">
        {pois.map((poi) => {
          const isVisited = visitedPoiIds.has(poi.poi_id);
          const trans = poi.translations[language] || poi.translations.vi;

          return (
            <button
              key={poi.poi_id}
              onClick={() => onSimulateLocation(poi.latitude, poi.longitude)}
              className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs text-left transition-all ${
                isVisited
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
                  : 'bg-white/5 border border-white/10 hover:bg-amber-500/20 hover:border-amber-400/40 text-stone-200'
              }`}
            >
              <div className="truncate pr-2">
                <span className="font-bold text-amber-300 mr-1">#{poi.order_index}</span>
                <span>{trans.title.split('–')[0].trim()}</span>
              </div>
              <span className="shrink-0 text-[10px] font-semibold opacity-80">
                {isVisited ? '✓ Đã thăm' : `${poi.geofence_radius}m`}
              </span>
            </button>
          );
        })}
      </div>

      {/* Special Hysteresis Buffer Reset Button */}
      <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
        <button
          onClick={() => onSimulateLocation(10.7705, 106.6705)} // ~80m away on 3/2 street
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition-all"
        >
          <Footprints className="h-3.5 w-3.5 text-amber-300" />
          <span>{isVi ? 'Bước ra xa khuôn viên (Reset)' : 'Walk far away (Reset Buffer)'}</span>
        </button>

        <button
          onClick={onClearVisited}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 py-1 text-[11px] font-medium text-rose-300 hover:bg-rose-500/30 transition-all"
        >
          <ShieldAlert className="h-3 w-3" />
          <span>{isVi ? 'Xóa lịch sử đã xem (Reset Visited)' : 'Reset Visited History'}</span>
        </button>
      </div>

      <div className="mt-2 text-[9px] text-stone-400 text-center font-mono">
        Tọa độ: {userLocation.latitude.toFixed(5)}, {userLocation.longitude.toFixed(5)}
      </div>
    </div>
  );
};
