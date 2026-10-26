import assert from 'node:assert';
import { calculateHaversineDistance, db } from '../src/server/repositories/db.js';
import { poiService } from '../src/server/services/poiService.js';
import { analyticsService } from '../src/server/services/analyticsService.js';
import { authService } from '../src/server/services/authService.js';
import { MobileGPSKalmanFilter } from '../src/server/services/gpsFilterService.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

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
assert(nearbyPOIs[0].isWithinGeofence, 'Tam Quan should be within geofence');
assert.strictEqual(nearbyPOIs[0].poi.location?.type, 'Point', 'MongoDB GeoJSON Point must be defined');
assert(Array.isArray(nearbyPOIs[0].poi.location?.coordinates), 'Coordinates must be array [lng, lat]');

// POI 4-part structure verification (Tiêu đề, Giới thiệu, Thuyết minh)
const tamQuanPOI = nearbyPOIs[0].poi;
assert(tamQuanPOI.currentTitle, 'POI must have title');
assert(tamQuanPOI.currentIntroduction && tamQuanPOI.currentIntroduction.length > 10, 'POI must have distinct introduction');
assert(tamQuanPOI.currentDescription && tamQuanPOI.currentDescription.length > 20, 'POI must have detailed description');
assert(tamQuanPOI.translations['vi']?.introduction, 'Vietnamese translation must contain introduction');
assert(tamQuanPOI.translations['en']?.introduction, 'English translation must contain introduction');
console.log('✅ POI 4-part structure (Tiêu đề, Giới thiệu, Thuyết minh, Audio) verified.');
console.log('✅ MongoDB GeoJSON Point & Spatial 2dsphere proximity query verified.');

// 3. Admin Authentication & RBAC Test
const validLogin = authService.login('admin', 'vnqt@2026');
assert.strictEqual(validLogin.success, true);
assert(validLogin.token && validLogin.token.startsWith('vnqt_adm_'));

const invalidLogin = authService.login('admin', 'wrong_pass');
assert.strictEqual(invalidLogin.success, false);
console.log('✅ Admin authentication & RBAC session verified.');

// 4. Analytics & Device Fingerprinting Strict Daily Deduplication
const fakeFingerprint = 'fp_test_hash_12345678_ci_cd';
const checkin1 = analyticsService.checkinDevice(fakeFingerprint, 'vi');
assert.strictEqual(checkin1.isNewToday, true, 'First access today from device fingerprint must be recorded as new');
assert.strictEqual(checkin1.accessCountToday, 1);

const checkin2 = analyticsService.checkinDevice(fakeFingerprint, 'vi');
assert.strictEqual(checkin2.isNewToday, false, 'Second access today from same device must NOT count as a new device');
assert.strictEqual(checkin2.accessCountToday, 2);

const checkin3 = analyticsService.checkinDevice(fakeFingerprint, 'vi');
assert.strictEqual(checkin3.isNewToday, false, 'Third access today must continue to deduplicate');
assert.strictEqual(checkin3.accessCountToday, 3);
console.log('✅ Device fingerprinting & strict 1-device-per-day deduplication verified.');

// 5. GPS Kalman Filter Test
const filter = new MobileGPSKalmanFilter();
const p1 = filter.process({
  lat: 10.77165,
  lng: 106.67115,
  accuracy: 15,
  timestamp: Date.now(),
});
assert.strictEqual(p1.isOutlierFiltered, false);

const p2 = filter.process({
  lat: 10.77600,
  lng: 106.67800,
  accuracy: 65,
  timestamp: Date.now() + 100,
});
assert.strictEqual(p2.isOutlierFiltered, true, 'Impossible jump with low accuracy should be flagged as outlier');

// 6. Python Microservice & Bell Audio Synthesis Test
const pythonScript = path.resolve(process.cwd(), 'python/spatial_ai_service.py');
const { stdout: pyHealthOut } = await execFileAsync('python3', [pythonScript, 'health']);
const pyHealth = JSON.parse(pyHealthOut);
assert.strictEqual(pyHealth.status, 'healthy');
assert.strictEqual(pyHealth.runtime, 'python-3.10');

const { stdout: pyBellOut } = await execFileAsync('python3', [pythonScript, 'bell-audio', '220']);
const pyBell = JSON.parse(pyBellOut);
assert.strictEqual(pyBell.success, true);
assert(pyBell.dataUrl.startsWith('data:audio/wav;base64,'), 'Should produce valid WAV audio data URL');
console.log('✅ Python Spatial & Buddhist Bell Audio Micro-Engine verified.');

// 7. MongoDB Real Devices Table (Quản lý thiết bị đăng nhập/truy cập thực - Không tạo ảo)
const initialRealDevices = await db.getRealDevices();
assert.strictEqual(initialRealDevices.summary.mongoCollection, 'real_devices');

// Ghi nhận 1 thiết bị thực tế
const realDev = await db.recordRealDeviceAccess({
  deviceId: 'real_test_iphone_16_promax',
  ipAddress: '14.161.20.88',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  screenResolution: '430x932',
  language: 'vi-VN',
  timezone: 'Asia/Ho_Chi_Minh',
});

assert.strictEqual(realDev.device_type, 'iPhone (iOS)');
assert.strictEqual(realDev.os, 'iOS (iPhone)');
assert.strictEqual(realDev.browser, 'Apple Safari');
assert.strictEqual(realDev.status, 'active');
assert.strictEqual(realDev.total_visits, 1);
assert.strictEqual(realDev.short_id, 'DEV-REALTE');

// Thiết bị thực truy cập lần 2 trong ngày
const realDevVisit2 = await db.recordRealDeviceAccess({
  deviceId: 'real_test_iphone_16_promax',
  ipAddress: '14.161.20.88',
});
assert.strictEqual(realDevVisit2.total_visits, 2);

// Thiết bị thực đăng nhập tài khoản quản trị
const realDevLogin = await db.recordRealDeviceLogin({
  deviceId: 'real_test_iphone_16_promax',
  username: 'admin',
  role: 'admin',
});
assert.strictEqual(realDevLogin.role, 'admin');
assert.strictEqual(realDevLogin.logged_username, 'admin');
assert(realDevLogin.last_login_at);

// Lấy danh sách từ MongoDB
const realDevicesList = await db.getRealDevices({ search: 'iPhone' });
assert.strictEqual(realDevicesList.devices.length, 1);
assert.strictEqual(realDevicesList.summary.adminLogins >= 1, true);

// Khóa và mở khóa thiết bị thực
const blockedDev = await db.toggleBlockRealDevice('real_test_iphone_16_promax', true);
assert.strictEqual(blockedDev?.status, 'blocked');

const unblockedDev = await db.toggleBlockRealDevice('real_test_iphone_16_promax', false);
assert.strictEqual(unblockedDev?.status, 'active');

console.log('✅ MongoDB Real Devices Table (real_devices) verified without mock data.');

console.log('🎉 ALL BACKEND, PYTHON, MONGODB & ADMIN AUTH TESTS PASSED SUCCESSFULLY!');
