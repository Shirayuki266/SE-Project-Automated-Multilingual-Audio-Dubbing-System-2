import { useState, useEffect, useRef, useCallback } from 'react';
import { RichPOI } from '../server/types.js';
import { MobileGPSKalmanFilter, RawGPSPoint } from '../server/services/gpsFilterService.js';
import { calculateHaversineDistance } from '../utils/geo.js';

export interface UserLocationState {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
  confidenceScore: number;
  isInsidePagoda: boolean;
  status: 'initializing' | 'active' | 'weak' | 'denied';
}

export function useGPSTracker(
  pois: RichPOI[],
  onGeofenceEnter?: (poi: RichPOI, distance: number) => void
) {
  // Default centered at Cổng Tam Quan, Việt Nam Quốc Tự
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    lat: 10.77165,
    lng: 106.67115,
    accuracy: 8,
    heading: 0,
    confidenceScore: 92,
    isInsidePagoda: true,
    status: 'initializing',
  });

  const kalmanRef = useRef<MobileGPSKalmanFilter>(new MobileGPSKalmanFilter());
  const activeGeofencesRef = useRef<Set<string>>(new Set());
  const onGeofenceEnterRef = useRef(onGeofenceEnter);
  onGeofenceEnterRef.current = onGeofenceEnter;

  // Check geofence entry and trigger auto-narration
  const evaluateGeofences = useCallback(
    (currentLat: number, currentLng: number) => {
      pois.forEach((poi) => {
        const distance = calculateHaversineDistance(
          currentLat,
          currentLng,
          poi.latitude,
          poi.longitude
        );
        const radius = poi.geofence_radius || 20;

        if (distance <= radius) {
          if (!activeGeofencesRef.current.has(poi.poi_id)) {
            activeGeofencesRef.current.add(poi.poi_id);
            if (onGeofenceEnterRef.current) {
              onGeofenceEnterRef.current(poi, Math.round(distance));
            }
          }
        } else if (distance > radius + 8) {
          activeGeofencesRef.current.delete(poi.poi_id);
        }
      });
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
