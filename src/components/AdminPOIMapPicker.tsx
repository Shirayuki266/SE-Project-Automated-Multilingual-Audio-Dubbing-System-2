import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RichPOI } from '../server/types.js';
import { MapPin, Navigation, Maximize2, Info } from 'lucide-react';

interface AdminPOIMapPickerProps {
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  existingPOIs: RichPOI[];
  currentPoiId?: string;
  onCoordinatesChange: (lat: number, lng: number) => void;
}

export const AdminPOIMapPicker: React.FC<AdminPOIMapPickerProps> = ({
  latitude,
  longitude,
  geofenceRadius,
  existingPOIs,
  currentPoiId,
  onCoordinatesChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);
  const activeCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const initialLat = latitude && !isNaN(latitude) ? latitude : 10.77135;
    const initialLng = longitude && !isNaN(longitude) ? longitude : 106.67135;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 18,
      minZoom: 15,
      maxZoom: 20,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Street map layer (fast, high detail, unblocked)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri',
      maxZoom: 19,
    }).addTo(map);

    // Campus boundary outline
    const campusBoundary = [
      [10.77215, 106.67065],
      [10.7721, 106.67205],
      [10.77055, 106.6720],
      [10.7706, 106.67065],
    ];

    L.polygon(campusBoundary as any, {
      color: '#2d5a37',
      weight: 2,
      dashArray: '5, 5',
      fillColor: '#3e724a',
      fillOpacity: 0.08,
    }).addTo(map);

    // Render existing POIs as reference landmarks
    existingPOIs
      .filter((p) => p.poi_id !== currentPoiId)
      .forEach((p) => {
        const markerIcon = L.divIcon({
          className: 'custom-existing-poi-marker',
          html: `
            <div style="background-color: #ffffff; color: #2d5a37; border: 1.5px solid #2d5a37; font-size: 10px; font-weight: bold; border-radius: 99px; padding: 2px 6px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); white-space: nowrap; transform: translate(-50%, -50%);">
              ${p.code}
            </div>
          `,
          iconSize: [0, 0],
        });

        const m = L.marker([p.latitude, p.longitude], {
          icon: markerIcon,
          interactive: true,
        }).addTo(map);

        const title = p.translations['vi']?.title || p.code;
        m.bindTooltip(`<b>${title}</b><br/>${p.code}`, { direction: 'top' });
      });

    // Active POI Marker Icon (Prominent Amber / Red Target Pin)
    const activeIcon = L.divIcon({
      className: 'custom-active-pick-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
          <div style="background: #b45309; color: #ffffff; padding: 3px 8px; border-radius: 99px; font-size: 10px; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid #ffffff; white-space: nowrap;">
            📍 Điểm Được Chọn
          </div>
          <div style="width: 14px; height: 14px; background: #dc2626; border: 3px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.4); margin-top: 2px;"></div>
        </div>
      `,
      iconSize: [0, 0],
    });

    // Create Active Target Marker
    const targetMarker = L.marker([initialLat, initialLng], {
      icon: activeIcon,
      draggable: true,
      zIndexOffset: 2000,
    }).addTo(map);

    // Create Geofence Radius Circle Preview
    const targetCircle = L.circle([initialLat, initialLng], {
      radius: geofenceRadius || 20,
      color: '#b45309',
      weight: 2,
      dashArray: '4, 4',
      fillColor: '#d97706',
      fillOpacity: 0.15,
    }).addTo(map);

    activeMarkerRef.current = targetMarker;
    activeCircleRef.current = targetCircle;

    // Handle Drag
    targetMarker.on('dragend', () => {
      const pos = targetMarker.getLatLng();
      const roundedLat = Math.round(pos.lat * 100000) / 100000;
      const roundedLng = Math.round(pos.lng * 100000) / 100000;
      targetCircle.setLatLng(pos);
      onCoordinatesChange(roundedLat, roundedLng);
    });

    // Handle Map Click to Reposition Pin
    map.on('click', (e) => {
      const lat = Math.round(e.latlng.lat * 100000) / 100000;
      const lng = Math.round(e.latlng.lng * 100000) / 100000;
      targetMarker.setLatLng([lat, lng]);
      targetCircle.setLatLng([lat, lng]);
      onCoordinatesChange(lat, lng);
    });

    mapRef.current = map;

    // Timers to handle modal layout transitions & invalidateSize
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker & circle when latitude / longitude changes from external inputs
  useEffect(() => {
    if (!mapRef.current || !activeMarkerRef.current || !activeCircleRef.current) return;
    if (isNaN(latitude) || isNaN(longitude)) return;

    const currentPos = activeMarkerRef.current.getLatLng();
    if (Math.abs(currentPos.lat - latitude) > 0.000001 || Math.abs(currentPos.lng - longitude) > 0.000001) {
      activeMarkerRef.current.setLatLng([latitude, longitude]);
      activeCircleRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  // Update circle radius when geofenceRadius changes
  useEffect(() => {
    if (activeCircleRef.current && geofenceRadius) {
      activeCircleRef.current.setRadius(geofenceRadius);
    }
  }, [geofenceRadius]);

  // Recenter to Temple Center
  const handleRecenterTemple = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([10.77135, 106.67135], 18, { duration: 0.8 });
    }
  };

  // Get User Current GPS
  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Math.round(pos.coords.latitude * 100000) / 100000;
          const lng = Math.round(pos.coords.longitude * 100000) / 100000;
          if (mapRef.current && activeMarkerRef.current && activeCircleRef.current) {
            activeMarkerRef.current.setLatLng([lat, lng]);
            activeCircleRef.current.setLatLng([lat, lng]);
            mapRef.current.flyTo([lat, lng], 19, { duration: 0.8 });
          }
          onCoordinatesChange(lat, lng);
        },
        (err) => {
          alert('Không thể lấy vị trí GPS: ' + err.message);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      alert('Trình duyệt không hỗ trợ Geolocation.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden border-2 border-[#2d5a37]/30 shadow-inner bg-[#f7f9f6]">
        {/* Leaflet Map Div */}
        <div ref={containerRef} className="w-full h-full z-0 select-none cursor-crosshair" />

        {/* Top Floating Helper Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] pointer-events-none flex items-center justify-between gap-2">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-[#e2eae4] shadow-xs text-[11px] text-[#1e3d25] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
            <span>Nhấp lên bản đồ để chọn tọa độ</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#e2eae4] hover:bg-[#eef5f0] text-[#2d5a37] shadow-xs transition-colors"
              title="Lấy tọa độ GPS hiện tại của tôi"
            >
              <Navigation className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRecenterTemple}
              className="p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#e2eae4] hover:bg-[#eef5f0] text-[#2d5a37] shadow-xs transition-colors"
              title="Toàn cảnh khuôn viên chùa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Floating Coordinate Badge */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 z-[1000] pointer-events-none flex items-center justify-between">
          <div className="pointer-events-auto bg-[#1e3d25]/90 backdrop-blur-md text-white px-3 py-1 rounded-xl text-[11px] font-mono shadow-md flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-300" />
            <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
            <span className="text-stone-300">| Bán kính: {geofenceRadius}m</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-[#5c7362] flex items-center gap-1.5">
        <Info className="w-3.5 h-3.5 text-[#2d5a37] flex-shrink-0" />
        <span>
          Nhấp chuột trực tiếp lên bản đồ hoặc kéo ghim để định vị chính xác vị trí cảm biến geofence cho điểm này.
        </span>
      </p>
    </div>
  );
};
