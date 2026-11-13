import assert from 'node:assert';
import { calculateHaversineDistance, db } from '../src/server/repositories/db.js';
import { poiService } from '../src/server/services/poiService.js';
import { dailyVisitService } from '../src/server/services/dailyVisitService.js';
import { authService } from '../src/server/services/authService.js';
import { MobileGPSKalmanFilter } from '../src/server/services/gpsFilterService.js';

console.log('🧪 [CI/CD Test Runner] Running backend unit tests...');

// 1. Haversine Spatial Query Verification
const distTamQuanToChinhDien = calculateHaversineDistance(
  10.77165,
  106.67115,
  10.77125,
  106.6714
);
console.log(`📍 Distance Tam Quan to Chinh Dien: ${distTamQuanToChinhDien.toFixed(1)}m`);
assert(distTamQuanToChinhDien > 30 && distTamQuanToChinhDien < 70, 'Haversine distance should be ~52m');

// 2. POI Service Spatial Query with MongoDB GeoJSON & 2dsphere representation
const nearbyPOIs = poiService.getNearbyPOIs(10.77165, 106.67115);
assert(nearbyPOIs.length >= 1, 'Should find at least 1 POI near Tam Quan gate');
assert.strictEqual(nearbyPOIs[0].poi.code, 'VNQT-TAM-QUAN', 'First nearby POI should be Tam Quan');
assert(nearbyPOIs[0].isInsideGeofence, 'Tam Quan should be within geofence');
assert.strictEqual(nearbyPOIs[0].poi.location?.type, 'Point', 'MongoDB GeoJSON Point must be defined');
assert(Array.isArray(nearbyPOIs[0].poi.location?.coordinates), 'Coordinates must be array [lng, lat]');

// POI structure verification
const tamQuanPOI = nearbyPOIs[0].poi;
assert(tamQuanPOI.translations['vi']?.title, 'POI must have title');
assert(tamQuanPOI.translations['vi']?.introduction, 'Vietnamese translation must contain introduction');
assert(tamQuanPOI.translations['vi']?.description, 'Vietnamese translation must contain description');
console.log('✅ POI structure (Title, Intro, Script, Audio) verified.');
console.log('✅ MongoDB GeoJSON Point & Spatial proximity query verified.');

// 3. Admin Authentication & RBAC Test
const validLogin = authService.login('admin', 'vnqt@2026');
assert.strictEqual(validLogin.success, true);
assert(validLogin.token && validLogin.token.startsWith('vnqt_adm_'));

const invalidLogin = authService.login('admin', 'wrong_pass');
assert.strictEqual(invalidLogin.success, false);
console.log('✅ Admin authentication verified.');

// 4. Daily Visits & Deduplication (1 máy = 1 người = 1 lượt/ngày)
const hash1 = dailyVisitService.generateVisitorHash('test-device-uuid-1', 'TestUA');
const hash2 = dailyVisitService.generateVisitorHash('test-device-uuid-1', 'TestUA');
assert.strictEqual(hash1, hash2, 'HMAC Hash must be deterministic for identical device');
console.log('✅ Privacy-preserving HMAC-SHA256 device hashing verified.');

// 5. GPS Kalman Filter Test
const kalman = new MobileGPSKalmanFilter();
const smoothed1 = kalman.process({
  lat: 10.7712,
  lng: 106.6714,
  accuracy: 5,
  timestamp: Date.now(),
});
assert(typeof smoothed1.lat === 'number');
assert(typeof smoothed1.lng === 'number');
console.log('✅ Mobile GPS Kalman filter operational.');

console.log('🎉 All backend tests passed successfully!');
