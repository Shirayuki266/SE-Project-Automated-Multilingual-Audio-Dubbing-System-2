import { useState, useEffect, useRef, useCallback } from 'react';
import { POI, UserLocation } from '../types';

const EARTH_RADIUS_METERS = 6371000;
const HYSTERESIS_BUFFER_METERS = 15; // BR03-2: Reset buffer threshold

// Tọa độ vỉa hè đường 3/2 ngay trước Cổng Tam Quan Việt Nam Quốc Tự (Bước 2 kịch bản chiêm bái)
export const TEMPLE_ENTRANCE_COORDS = {
  latitude: 10.77118,
  longitude: 106.67112,
};

// Haversine Distance Formula (BR01-1)
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (angle: number) => (angle * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

interface UseGeofencingOptions {
  pois: POI[];
  onEnterGeofence: (poi: POI, distance: number) => void;
  enableSimulation?: boolean;
}

export function useGeofencing({ pois, onEnterGeofence, enableSimulation = false }: UseGeofencingOptions) {
  // Mặc định định vị ngay trước Cổng Tam Quan trên đường Ba Tháng Hai
  const [userLocation, setUserLocation] = useState<UserLocation>({
    latitude: TEMPLE_ENTRANCE_COORDS.latitude,
    longitude: TEMPLE_ENTRANCE_COORDS.longitude,
    accuracy: 5,
    heading: 0,
    speed: 0,
    timestamp: Date.now(),
  });

  const [visitedPoiIds, setVisitedPoiIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('vnqt_visited_pois');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [nearestPoi, setNearestPoi] = useState<{ poi: POI; distance: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isAtEntrance, setIsAtEntrance] = useState<boolean>(true);

  // Keep a ref to latest state to avoid stale closures in watchPosition
  const visitedRef = useRef(visitedPoiIds);
  visitedRef.current = visitedPoiIds;

  // Persist visited POIs
  const markPoiVisited = useCallback((poiId: string) => {
    setVisitedPoiIds((prev) => {
      const next = new Set(prev);
      next.add(poiId);
      try {
        localStorage.setItem('vnqt_visited_pois', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const clearVisitedPois = useCallback(() => {
    setVisitedPoiIds(new Set());
    localStorage.removeItem('vnqt_visited_pois');
  }, []);

  // Evaluate Geofences with Hysteresis
  const processLocation = useCallback((lat: number, lon: number) => {
    if (!pois || pois.length === 0) return;

    let closest: { poi: POI; distance: number } | null = null;
    const currentVisited = visitedRef.current;
    const toRemoveFromVisited: string[] = [];

    // Kiểm tra xem có đang đứng trước Cổng Tam Quan không (khoảng cách <= 25m từ cổng)
    const distToEntrance = calculateHaversineDistance(
      lat,
      lon,
      TEMPLE_ENTRANCE_COORDS.latitude,
      TEMPLE_ENTRANCE_COORDS.longitude
    );
    setIsAtEntrance(distToEntrance <= 25);

    pois.forEach((poi) => {
      const distance = calculateHaversineDistance(lat, lon, poi.latitude, poi.longitude);

      if (!closest || distance < closest.distance) {
        closest = { poi, distance };
      }

      // 1. Condition to trigger new audio: d <= R AND not visited
      if (distance <= poi.geofence_radius && !currentVisited.has(poi.poi_id)) {
        // Haptic feedback
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 100]);
          } catch {}
        }
        markPoiVisited(poi.poi_id);
        onEnterGeofence(poi, distance);
      }

      // 2. Hysteresis Reset Condition: d > R + 15 meters
      if (currentVisited.has(poi.poi_id) && distance > poi.geofence_radius + HYSTERESIS_BUFFER_METERS) {
        toRemoveFromVisited.push(poi.poi_id);
      }
    });

    setNearestPoi(closest);

    // Release reset POIs
    if (toRemoveFromVisited.length > 0) {
      setVisitedPoiIds((prev) => {
        const next = new Set(prev);
        toRemoveFromVisited.forEach((id) => next.delete(id));
        try {
          localStorage.setItem('vnqt_visited_pois', JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });
    }
  }, [pois, markPoiVisited, onEnterGeofence]);

  // Real GPS Geolocation Watcher
  useEffect(() => {
    if (enableSimulation) return;

    if (!('geolocation' in navigator)) {
      setGpsError('Thiết bị không hỗ trợ định vị GPS.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;

        // Tính khoảng cách từ GPS thực tế của thiết bị tới Việt Nam Quốc Tự
        const distToTemple = calculateHaversineDistance(
          latitude,
          longitude,
          TEMPLE_ENTRANCE_COORDS.latitude,
          TEMPLE_ENTRANCE_COORDS.longitude
        );

        // Nếu thiết bị đang ở xa hơn 1.2km (đang test ở nhà / văn phòng / tỉnh khác),
        // tự động giữ chấm xanh ở trước Cổng Tam Quan theo đúng kịch bản tài liệu
        if (distToTemple > 1200) {
          console.log(`GPS thực tế ở xa chùa (${(distToTemple / 1000).toFixed(1)}km). Giữ chấm xanh đứng trước cổng chùa.`);
          setUserLocation({
            latitude: TEMPLE_ENTRANCE_COORDS.latitude,
            longitude: TEMPLE_ENTRANCE_COORDS.longitude,
            accuracy: 6,
            heading,
            speed,
            timestamp: pos.timestamp,
          });
          processLocation(TEMPLE_ENTRANCE_COORDS.latitude, TEMPLE_ENTRANCE_COORDS.longitude);
        } else {
          // Người dùng đang thực sự ở gần khuôn viên chùa
          const newLoc: UserLocation = {
            latitude,
            longitude,
            accuracy: accuracy || 8,
            heading,
            speed,
            timestamp: pos.timestamp,
          };
          setUserLocation(newLoc);
          processLocation(latitude, longitude);
        }

        setGpsError(null);
      },
      (err) => {
        console.warn('GPS Error (fallback to entrance):', err.message);
        setGpsError(err.message);
        // Fallback default: đứng trước chùa
        setUserLocation({
          latitude: TEMPLE_ENTRANCE_COORDS.latitude,
          longitude: TEMPLE_ENTRANCE_COORDS.longitude,
          accuracy: 5,
          timestamp: Date.now(),
        });
        processLocation(TEMPLE_ENTRANCE_COORDS.latitude, TEMPLE_ENTRANCE_COORDS.longitude);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enableSimulation, processLocation]);

  // Initial geofencing run on mount
  useEffect(() => {
    if (pois && pois.length > 0) {
      processLocation(TEMPLE_ENTRANCE_COORDS.latitude, TEMPLE_ENTRANCE_COORDS.longitude);
    }
  }, [pois, processLocation]);

  // Đặt vị trí về đứng trước Cổng Chùa
  const setLocationToEntrance = useCallback(() => {
    const loc: UserLocation = {
      latitude: TEMPLE_ENTRANCE_COORDS.latitude,
      longitude: TEMPLE_ENTRANCE_COORDS.longitude,
      accuracy: 5,
      timestamp: Date.now(),
    };
    setUserLocation(loc);
    processLocation(TEMPLE_ENTRANCE_COORDS.latitude, TEMPLE_ENTRANCE_COORDS.longitude);
  }, [processLocation]);

  // Update when simulation manually moves
  const setSimulatedLocation = useCallback((lat: number, lon: number) => {
    const newLoc: UserLocation = {
      latitude: lat,
      longitude: lon,
      accuracy: 5,
      timestamp: Date.now(),
    };
    setUserLocation(newLoc);
    processLocation(lat, lon);
  }, [processLocation]);

  return {
    userLocation,
    visitedPoiIds,
    nearestPoi,
    gpsError,
    isAtEntrance,
    markPoiVisited,
    clearVisitedPois,
    setLocationToEntrance,
    setSimulatedLocation,
  };
}
