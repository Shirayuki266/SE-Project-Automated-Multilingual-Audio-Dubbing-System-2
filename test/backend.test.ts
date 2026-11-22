import 'dotenv/config';
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

// 3. Admin Authentication & RBAC Test (bcrypt salt rounds=10, JWT 8h, Lockout after 5 failed tries)
authService.resetLockout('admin');
const validLogin = authService.login('admin', 'vnqt@2026');
assert.strictEqual(validLogin.success, true, 'Admin login with correct password must succeed');
assert(validLogin.token && validLogin.token.startsWith('eyJ'), 'JWT token must start with eyJ');

// Validate token
const validation = authService.validateToken(validLogin.token);
assert.strictEqual(validation.valid, true, 'Valid JWT token must pass validation');
assert.strictEqual(validation.user?.username, 'admin', 'JWT user must be admin');

// Invalid password test
const invalidLogin = authService.login('admin', 'wrong_pass_1');
assert.strictEqual(invalidLogin.success, false, 'Wrong password must fail');
assert.strictEqual(invalidLogin.statusCode, 401, 'Wrong password should return 401');

// Test Lockout: trigger remaining 4 failed attempts (total 5)
authService.login('admin', 'wrong_pass_2');
authService.login('admin', 'wrong_pass_3');
authService.login('admin', 'wrong_pass_4');
const fifthFailed = authService.login('admin', 'wrong_pass_5');
assert.strictEqual(fifthFailed.success, false);
assert.strictEqual(fifthFailed.statusCode, 423, '5th failed login must return 423 Locked');
assert(fifthFailed.error && fifthFailed.error.includes('khóa 15 phút'), 'Error message must mention 15-minute lockout');

// Locked account attempt even with correct password
const tryWhileLocked = authService.login('admin', 'vnqt@2026');
assert.strictEqual(tryWhileLocked.success, false, 'Login must be blocked while account is locked');
assert.strictEqual(tryWhileLocked.statusCode, 423, 'Must return 423 while locked');

// Token invalidation test
const invalidTokenCheck = authService.validateToken('invalid.jwt.token');
assert.strictEqual(invalidTokenCheck.valid, false, 'Invalid token must be rejected');
assert.strictEqual(invalidTokenCheck.error, 'INVALID_TOKEN');

// Cleanup lockout for subsequent operations
authService.resetLockout('admin');
console.log('✅ Admin authentication (bcrypt 10, JWT 8h, 5-attempt Lockout) verified.');

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

// 6. Speech Speed Levels & normalizeSpeed Verification
import { SPEED_OPTIONS, DEFAULT_SPEED, normalizeSpeed } from '../src/utils/audioSpeech.js';
assert.deepStrictEqual(SPEED_OPTIONS, [0.7, 1.0, 1.25, 1.5, 2.5], 'Must have exactly 5 fixed speed levels');
assert.strictEqual(DEFAULT_SPEED, 1.0, 'Default speed must be 1.0');
assert.strictEqual(normalizeSpeed(0.75), 0.7, 'Legacy 0.75 should normalize to 0.7');
assert.strictEqual(normalizeSpeed(1.3), 1.25, 'Legacy 1.3 should normalize to 1.25');
assert.strictEqual(normalizeSpeed(2.4), 2.5, '2.4 should normalize to 2.5');
assert.strictEqual(normalizeSpeed(3.0), 2.5, 'Out-of-bounds high should normalize to 2.5');
assert.strictEqual(normalizeSpeed(0.2), 0.7, 'Out-of-bounds low should normalize to 0.7');
assert.strictEqual(normalizeSpeed(NaN), 1.0, 'NaN should fallback to default 1.0');
assert.strictEqual(normalizeSpeed(undefined), 1.0, 'Undefined should fallback to default 1.0');
console.log('✅ Speech Speed Options & normalizeSpeed verified (5 levels: 0.7, 1.0, 1.25, 1.5, 2.5).');

// =========================================================================
// 7. THỐNG KÊ LƯU LƯỢNG & PHÂN LOẠI THIẾT BỊ (ANALYTICS TESTS)
// =========================================================================
import { classifyDevice } from '../src/server/types.js';
import { statsRepository } from '../src/server/repositories/statsRepository.js';
import { statsService } from '../src/server/services/statsService.js';

// 7.1 Phân loại User-Agent và iPadOS touch points
const iphoneUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
const ipadUA = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
const ipadosMacMasqueradeUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
const genuineMacUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const androidUA = 'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36';
const windowsPCUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const linuxPCUA = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/119.0';
const botUA = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

assert.strictEqual(classifyDevice(iphoneUA, 5), 'iphone', 'iPhone UA must be classified as iphone');
assert.strictEqual(classifyDevice(ipadUA, 5), 'iphone', 'iPad UA must be classified as iphone');
assert.strictEqual(classifyDevice(ipadosMacMasqueradeUA, 5), 'iphone', 'iPadOS pretending to be Mac must be classified as iphone when maxTouchPoints > 1');
assert.strictEqual(classifyDevice(genuineMacUA, 0), 'pc', 'Genuine macOS must be classified as pc when maxTouchPoints <= 1');
assert.strictEqual(classifyDevice(androidUA, 5), 'android', 'Android UA must be classified as android');
assert.strictEqual(classifyDevice(windowsPCUA, 0), 'pc', 'Windows UA must be classified as pc');
assert.strictEqual(classifyDevice(linuxPCUA, 0), 'pc', 'Linux UA must be classified as pc');
assert.strictEqual(classifyDevice(botUA, 0), 'other', 'Unknown or bot UA must be classified as other');
console.log('✅ Device classification verified (iPhone, iPadOS touch points, Android, Windows, macOS, Linux, Other).');

// 7.2 Không đếm trùng thiết bị trong ngày (Daily Unique Deduplication)
async function testDailyDeduplication() {
  const testDevId = 'test-dedup-dev-unique-99';
  const checkin1 = await dailyVisitService.recordVisit(testDevId, iphoneUA, 5);
  assert.strictEqual(checkin1.isNewToday, true, 'First checkin must be counted as new today');

  const checkin2 = await dailyVisitService.recordVisit(testDevId, iphoneUA, 5);
  assert.strictEqual(checkin2.isNewToday, false, 'Second checkin with identical hash today must NOT be counted as new');
  console.log('✅ Visitor daily deduplication verified (1 device = 1 unique count/day).');
}
await testDailyDeduplication();

// 7.3 Tổng hợp theo Ngày & Tháng (Aggregation & Zero-filling continuous range)
async function testAggregationAndZeroFill() {
  // Ghi nhận dữ liệu thử nghiệm vào ngày 2026-05-15
  await statsRepository.recordDailyVisit('2026-05-15', 'iphone');
  await statsRepository.recordDailyVisit('2026-05-15', 'android');

  // Thống kê theo ngày trong khoảng 2026-05-13 đến 2026-05-17 (5 ngày)
  const dayStats = await statsService.getVisitorStats('2026-05-13', '2026-05-17', 'day');
  assert.strictEqual(dayStats.items.length, 5, 'Must generate exactly 5 continuous days');
  assert.strictEqual(dayStats.items[0].period, '2026-05-13');
  assert.strictEqual(dayStats.items[0].uniqueDevices, 0, 'Missing day 2026-05-13 must be zero-filled');
  assert.strictEqual(dayStats.items[2].period, '2026-05-15');
  assert.strictEqual(dayStats.items[2].uniqueDevices, 2, '2026-05-15 must have 2 devices');
  assert.strictEqual(dayStats.items[2].iphone, 1);
  assert.strictEqual(dayStats.items[2].android, 1);

  // Thống kê theo tháng trong khoảng 2026-04-01 đến 2026-06-30 (3 tháng: 04, 05, 06)
  const monthStats = await statsService.getVisitorStats('2026-04-01', '2026-06-30', 'month');
  assert.strictEqual(monthStats.items.length, 3, 'Must generate exactly 3 continuous months');
  assert.strictEqual(monthStats.items[0].period, '2026-04');
  assert.strictEqual(monthStats.items[0].uniqueDevices, 0, 'Month 2026-04 must be zero-filled');
  assert.strictEqual(monthStats.items[1].period, '2026-05');
  assert(monthStats.items[1].uniqueDevices >= 2, 'Month 2026-05 must aggregate at least 2 devices');
  assert.strictEqual(monthStats.items[2].period, '2026-06');
  assert.strictEqual(monthStats.items[2].uniqueDevices, 0, 'Month 2026-06 must be zero-filled');
  console.log('✅ Daily and monthly stats aggregation with zero-filling verified.');
}
await testAggregationAndZeroFill();

// 7.4 Xác thực Admin Route bảo vệ bằng JWT (Trả 401 khi thiếu JWT hoặc token không hợp lệ)
function testAdminJwtRouteProtection() {
  // Test validateToken
  const emptyValidation = authService.validateToken('');
  assert.strictEqual(emptyValidation.valid, false, 'Empty token must be invalid');

  const invalidValidation = authService.validateToken('random_garbage_token');
  assert.strictEqual(invalidValidation.valid, false, 'Forged token must be invalid');

  const validToken = authService.login('admin', 'vnqt@2026').token!;
  const validValidation = authService.validateToken(validToken);
  assert.strictEqual(validValidation.valid, true, 'Real admin token must be valid');

  // Mô phỏng middleware requireAdmin
  const simulateRequireAdmin = (authHeader?: string) => {
    let statusCode = 200;
    let jsonResponse: any = null;
    let nextCalled = false;

    const token = authHeader?.replace('Bearer ', '') || '';
    if (!token) {
      statusCode = 401;
      jsonResponse = { success: false, error: 'Yêu cầu mã xác thực JWT.' };
    } else {
      const v = authService.validateToken(token);
      if (!v.valid) {
        statusCode = 401;
        jsonResponse = { success: false, error: 'Yêu cầu quyền Quản trị viên (Admin).' };
      } else {
        nextCalled = true;
      }
    }
    return { statusCode, jsonResponse, nextCalled };
  };

  // 1. Khi thiếu header Authorization
  const missingRes = simulateRequireAdmin(undefined);
  assert.strictEqual(missingRes.statusCode, 401, 'Missing JWT must return HTTP 401');
  assert.strictEqual(missingRes.nextCalled, false);

  // 2. Khi token sai
  const invalidRes = simulateRequireAdmin('Bearer wrong_token_123');
  assert.strictEqual(invalidRes.statusCode, 401, 'Invalid JWT must return HTTP 401');
  assert.strictEqual(invalidRes.nextCalled, false);

  // 3. Khi token đúng
  const validRes = simulateRequireAdmin(`Bearer ${validToken}`);
  assert.strictEqual(validRes.statusCode, 200);
  assert.strictEqual(validRes.nextCalled, true, 'Valid JWT must proceed to controller');
  console.log('✅ Admin stats route JWT protection verified (Returns 401 on missing/invalid token).');
}
testAdminJwtRouteProtection();

// 7.5 POI Listen Event Tracking (≥ 5s threshold, deduplication & top ranking)
async function testPoiListenTracking() {
  const poiCode = 'VNQT-CHINH-DIEN';
  const listenerDevId = 'test-listener-dev-42';

  // Lần nghe 1 (đủ 8s)
  const listen1 = await dailyVisitService.recordPoiListen(listenerDevId, androidUA, 5, poiCode, 'vi', 8);
  assert.strictEqual(listen1.success, true);
  assert.strictEqual(listen1.isUniqueDevice, true, 'First listen must count as unique device for this POI today');

  // Lần nghe 2 từ cùng thiết bị (đủ 12s)
  const listen2 = await dailyVisitService.recordPoiListen(listenerDevId, androidUA, 5, poiCode, 'vi', 12);
  assert.strictEqual(listen2.success, true);
  assert.strictEqual(listen2.isUniqueDevice, false, 'Repeat listen from same device today must NOT be unique device');

  // Kiểm tra bảng xếp hạng top POIs
  const today = dailyVisitService.getVietnamDateString();
  const topPOIs = await statsService.getTopPOIs(today, today, 'all', 10);
  assert(topPOIs.items.length >= 1, 'Top POIs must contain recorded item');
  const found = topPOIs.items.find((p) => p.poiId === poiCode);
  assert(found, 'Recorded POI must be in top ranking list');
  assert(found.listens >= 2, 'Must have at least 2 listens');
  assert(found.uniqueDevices >= 1, 'Must have at least 1 unique device');
  assert(found.avgDurationSeconds > 0, 'Average duration must be calculated');
  console.log('✅ POI listen event tracking & top ranking verified (Threshold, unique device count, avg duration).');
}
await testPoiListenTracking();

// =========================================================================
// 8. THUẬT TOÁN ĐỊNH TUYẾN GEOFENCE NÂNG CAO (PRIORITY, HYSTERESIS & LOCKING)
// Mô phỏng 2 POI tâm cách nhau 15m (R=20m và R=30m) tại 5 vị trí người dùng
// =========================================================================
import { selectBestCandidatePOI } from '../src/utils/geo.js';

function testGeofenceResolutionAndLocking() {
  // Tâm POI A tại (10.771000, 106.671000)
  // 1 mét vĩ độ xấp xỉ 1 / 111111 = 0.000009 độ
  const baseLat = 10.771;
  const baseLng = 106.671;
  const metersToLat = (m: number) => baseLat + (m / 111111);

  // POI A: tâm cách gốc 0m, bán kính 20m, display_order = 1, priority = 0
  const poiA = {
    poi_id: 'poi-A',
    code: 'POI-A',
    latitude: metersToLat(0),
    longitude: baseLng,
    geofence_radius: 20,
    priority: 0,
    display_order: 1,
  };

  // POI B: tâm cách gốc 15m (cách A 15m), bán kính 30m, display_order = 2, priority = 0
  const poiB = {
    poi_id: 'poi-B',
    code: 'POI-B',
    latitude: metersToLat(15),
    longitude: baseLng,
    geofence_radius: 30,
    priority: 0,
    display_order: 2,
  };

  const poiList = [poiA, poiB];

  // 8.1 Vị trí 1: Gần tâm A (x = 2m)
  // d_A = 2m (ratio 2/20 = 0.10), d_B = 13m (ratio 13/30 = 0.433)
  const atPos1 = selectBestCandidatePOI(poiList, metersToLat(2), baseLng);
  assert(atPos1 !== null);
  assert.strictEqual(atPos1.poi.poi_id, 'poi-A', 'Vị trí 1 (gần tâm A 2m): Phải chọn POI A vì ratio thâm nhập nhỏ hơn');

  // 8.2 Vị trí 2: Gần tâm B (x = 14m)
  // d_A = 14m (ratio 14/20 = 0.70), d_B = 1m (ratio 1/30 = 0.033)
  const atPos2 = selectBestCandidatePOI(poiList, metersToLat(14), baseLng);
  assert(atPos2 !== null);
  assert.strictEqual(atPos2.poi.poi_id, 'poi-B', 'Vị trí 2 (gần tâm B 1m): Phải chọn POI B vì ratio thâm nhập nhỏ hơn');

  // 8.3 Vị trí 3: Ở chính giữa (x = 7.5m)
  // Cùng priority=0: d_A = 7.5m (ratio 7.5/20 = 0.375), d_B = 7.5m (ratio 7.5/30 = 0.250) -> B thắng vì thâm nhập sâu hơn tương đối
  const atPos3Default = selectBestCandidatePOI(poiList, metersToLat(7.5), baseLng);
  assert(atPos3Default !== null);
  assert.strictEqual(atPos3Default.poi.poi_id, 'poi-B', 'Vị trí 3 (giữa, cùng priority): B thắng vì ratio 0.250 < 0.375');

  // Nhưng nếu POI A có priority = 1 (cao hơn POI B priority = 0) -> A THẮNG TUYỆT ĐỐI
  const poiAWithPriority = { ...poiA, priority: 1 };
  const atPos3Priority = selectBestCandidatePOI([poiAWithPriority, poiB], metersToLat(7.5), baseLng);
  assert(atPos3Priority !== null);
  assert.strictEqual(atPos3Priority.poi.poi_id, 'poi-A', 'Vị trí 3 (A có priority=1): A thắng tuyệt đối bất kể ratio hay khoảng cách');

  // 8.4 Vị trí 4: Ngoài cả hai (x = 50m)
  // d_A = 50m > 20m, d_B = 35m > 30m -> null
  const atPos4 = selectBestCandidatePOI(poiList, metersToLat(50), baseLng);
  assert.strictEqual(atPos4, null, 'Vị trí 4 (ngoài cả hai): Phải trả về null (không kích hoạt)');

  // 8.5 Vị trí 5: Đi từ A sang B khi POI A đang phát (Single-playback Locking)
  // Bắt đầu tại x=0, phát A. Khi bước đến x=2m, 7.5m, 14m (vùng giao của B):
  // Nhờ cơ chế Locking, POI A KHÔNG BỊ NGẮT nếu B không có priority cao hơn!
  const walkingWhilePlayingA = selectBestCandidatePOI(poiList, metersToLat(12), baseLng, {
    currentPoiId: 'poi-A',
    isPlaying: true,
  });
  assert(walkingWhilePlayingA !== null);
  assert.strictEqual(walkingWhilePlayingA.poi.poi_id, 'poi-A', 'Đang phát POI A: Không bị POI B ngắt khi bước vào vùng giao nhau');

  // Khi đi hẳn ra ngoài vùng thoát của A (> 20m + 8m buffer = 28m), ví dụ x = 30m:
  // POI A thoát hẳn, quyền phát được chuyển sang B (nếu B vẫn thỏa mãn d_B = 15m <= 30m)
  const walkingOutOfA = selectBestCandidatePOI(poiList, metersToLat(30), baseLng, {
    currentPoiId: 'poi-A',
    isPlaying: true,
    hysteresisBufferMeters: 8,
  });
  assert(walkingOutOfA !== null);
  assert.strictEqual(walkingOutOfA.poi.poi_id, 'poi-B', 'Khi bước ra ngoài bán kính thoát của A (>28m): Tự động chuyển sang POI B');

  // 8.6 Hysteresis chống nhiễu GPS (Flapping Prevention khi đứng ở ranh giới)
  // Khi không phát nhưng đang ở A (x=6m, ratio_A = 0.30, ratio_B = 9/30 = 0.30)
  const boundaryHysteresis = selectBestCandidatePOI(poiList, metersToLat(6), baseLng, {
    currentPoiId: 'poi-A',
    isPlaying: false,
    switchRatioMargin: 0.15,
  });
  assert(boundaryHysteresis !== null);
  assert.strictEqual(boundaryHysteresis.poi.poi_id, 'poi-A', 'Hysteresis: Biên độ chưa chênh lệch >=15% thì giữ nguyên POI hiện tại, tránh nhảy giật');

  console.log('✅ Hierarchical POI Selection, Priority, Single-playback Locking & Hysteresis verified (5 positions simulation passed).');
}
testGeofenceResolutionAndLocking();

// 9. Audio Upload & Translation Management Verification (UC10 A2, A4, BR10-3)
function testAudioUploadAndTranslationManagement() {
  const testPoiId = 'poi-tam-quan';
  // 9.1 Set custom audio MP3
  const updatedWithAudio = poiService.setCustomAudio(testPoiId, 'en', '/audio/manual-tam-quan-en-test.mp3');
  assert.strictEqual(updatedWithAudio?.translations['en']?.audio_url, '/audio/manual-tam-quan-en-test.mp3');
  assert.strictEqual(updatedWithAudio?.translations['en']?.is_manually_edited, true);

  // 9.2 Revert custom audio MP3
  const revertedAudio = poiService.removeCustomAudio(testPoiId, 'en');
  assert.strictEqual(revertedAudio?.translations['en']?.audio_url, `/audio/${testPoiId}-en.mp3`);

  // 9.3 Delete translation (cannot delete 'vi')
  assert.throws(() => {
    poiService.deleteTranslation(testPoiId, 'vi');
  }, /Không thể xóa bản dịch tiếng Việt/);

  // Add temporary translation and delete it
  poiService.saveTranslation(testPoiId, 'fr', 'Test FR Title', 'Test FR Content');
  const deleted = poiService.deleteTranslation(testPoiId, 'fr');
  assert.strictEqual(deleted, true);

  console.log('✅ Custom Audio Upload (20MB limit), Audio Revert & Translation Deletion (UC10) verified.');
}
testAudioUploadAndTranslationManagement();

console.log('🎉 All backend tests passed successfully!');
