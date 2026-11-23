import { useState, useEffect, useRef, useCallback } from 'react';
import { RichPOI } from '../server/types.js';
import { MobileGPSKalmanFilter, RawGPSPoint } from '../server/services/gpsFilterService.js';
import { calculateHaversineDistance, selectBestCandidatePOI } from '../utils/geo.js';

export interface UserLocationState {
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number;
  confidenceScore: number;
  isInsidePagoda: boolean;
  status: 'initializing' | 'active' | 'weak' | 'denied';
}

export function useGPSTracker(
  pois: RichPOI[],
  onGeofenceEnter?: (poi: RichPOI, distance: number) => void,
  activePoiId?: string | null
) {
  // Default centered at Cổng Tam Quan, Việt Nam Quốc Tự
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    lat: 10.77165,
    lng: 106.67115,
    latitude: 10.77165,
    longitude: 106.67115,
    accuracy: 8,
    heading: 0,
    confidenceScore: 92,
    isInsidePagoda: true,
    status: 'initializing',
  });

  const kalmanRef = useRef<MobileGPSKalmanFilter>(new MobileGPSKalmanFilter());
  const currentBestPoiIdRef = useRef<string | null>(null);
  const onGeofenceEnterRef = useRef(onGeofenceEnter);
  onGeofenceEnterRef.current = onGeofenceEnter;
  const activePoiIdRef = useRef(activePoiId);
  activePoiIdRef.current = activePoiId;

  // Select the nearest eligible POI, using priority and display order as tie-breakers.
  const evaluateGeofences = useCallback(
    (currentLat: number, currentLng: number) => {
      const best = selectBestCandidatePOI(pois, currentLat, currentLng, {
        currentPoiId: activePoiIdRef.current || currentBestPoiIdRef.current,
        hysteresisBufferMeters: 8,
      });

      if (best) {
        if (currentBestPoiIdRef.current !== best.poi.poi_id) {
          currentBestPoiIdRef.current = best.poi.poi_id;
          if (onGeofenceEnterRef.current) {
            onGeofenceEnterRef.current(best.poi, Math.round(best.distance));
          }
        }
      } else {
        // Exited all geofences
        currentBestPoiIdRef.current = null;
      }
    },
    [pois]
  );

  // Real device Geolocation watcher with Kalman smoothing
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setUserLocation((prev) => ({ ...prev, status: 'weak' }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const raw: RawGPSPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };

        const filtered = kalmanRef.current.process(raw);
        const distToCenter = calculateHaversineDistance(
          filtered.lat,
          filtered.lng,
          10.77125,
          106.6714
        );
        const isInsidePagoda = distToCenter < 250;

        setUserLocation({
          lat: filtered.lat,
          lng: filtered.lng,
          latitude: filtered.lat,
          longitude: filtered.lng,
          accuracy: filtered.accuracy,
          heading: filtered.smoothedHeading,
          confidenceScore: filtered.confidenceScore,
          isInsidePagoda,
          status: filtered.confidenceScore >= 60 ? 'active' : 'weak',
        });

        evaluateGeofences(filtered.lat, filtered.lng);
      },
      (err) => {
        console.warn('Geolocation access warning:', err.message);
        setUserLocation((prev) => ({
          ...prev,
          status: err.code === 1 ? 'denied' : 'weak',
        }));
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
  }, [evaluateGeofences]);

  return {
    userLocation,
  };
}
