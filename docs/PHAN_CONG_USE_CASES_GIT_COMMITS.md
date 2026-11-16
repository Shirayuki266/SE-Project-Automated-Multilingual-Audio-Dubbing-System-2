# BẢNG PHÂN CÔNG THỰC HIỆN 13 USE CASES & BẰNG CHỨNG COMMIT GITHUB
**Dự án:** Hệ thống thuyết minh tự động đa ngôn ngữ tại khuôn viên di tích Việt Nam Quốc Tự  
**Kho mã nguồn:** `SE-Project-Automated-Multilingual-Audio-Dubbing-System-2`  
**Nhánh chính:** `main`

---

## 👥 THÔNG TIN 3 THÀNH VIÊN TRÊN GITHUB

1. **Thành viên 1:** `Shirayuki266`  
   - **Tên hiển thị trong Git:** `Shirayuki`, `Shirayuki_Chan`  
   - **Email:** `vodonggiabao02.06.06@gmail.com`  
2. **Thành viên 2:** `duyhuynh4869-byte`  
   - **Tên hiển thị trong Git:** `duyhuynh4869-byte`  
   - **Email:** `duyhuynh4869@gmail.com`  
3. **Thành viên 3:** `Bao-dev06`  
   - **Tên hiển thị trong Git:** `Bao-dev06`, `nt.Bảo`  
   - **Email:** `baonguyenthe13@gmail.com`  

---

## 📊 BẢNG TỔNG HỢP PHÂN CÔNG THEO 13 USE CASES

| STT | Mã Use Case | Tên Use Case | Thành viên thực hiện chính | Thành viên phối hợp tham gia | Mã Commit GitHub chứng minh |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 1 | **UC01** | Khởi tạo ứng dụng và cấp quyền | **Shirayuki266** | `Bao-dev06` | `8a3f740`, `c3274ee` |
| 2 | **UC02** | Chọn ngôn ngữ | **Shirayuki266** | `duyhuynh4869-byte`, `Bao-dev06` | `8a3f740`, `24d43ac`, `c3274ee` |
| 3 | **UC03** | Tương tác bản đồ số khuôn viên | **Bao-dev06** | `Shirayuki266`, `duyhuynh4869-byte` | `c789b73`, `bd263f4`, `e4eca42`, `692fed5`, `24d43ac`, `a4c278e`, `9f377df`, `8a3f740` |
| 4 | **UC04** | Thuyết minh tự động bằng Geofencing GPS (Lọc Kalman 2D) | **Shirayuki266** | `duyhuynh4869-byte`, `Bao-dev06` | `8a3f740`, `a4c278e`, `ea890ac`, `1d5f008` |
| 5 | **UC05** | Xem và nghe thuyết minh thủ công | **Bao-dev06** | `Shirayuki266`, `duyhuynh4869-byte` | `53bbae3`, `f67f9e5`, `848c8b9`, `9f377df`, `66e027d`, `24d43ac`, `a3b263c`, `ea890ac`, `8a3f740` |
| 6 | **UC06** | Quét mã QR dự phòng (Camera QR Scanner) | **Bao-dev06** | `Shirayuki266` | `5082b26`, `c3274ee`, `8a3f740` |
| 7 | **UC07** | Đăng nhập và xác thực Admin CMS | **Shirayuki266** | `Bao-dev06` | `8a3f740`, `175e97c`, `090af39` |
| 8 | **UC08** | Quản lý thông tin khuôn viên di tích | **Bao-dev06** | `duyhuynh4869-byte`, `Shirayuki266` | `175e97c`, `990f272`, `8a3f740` |
| 9 | **UC09** | Quản lý điểm thuyết minh (POI) & Tọa độ Geofence | **Bao-dev06** | `duyhuynh4869-byte`, `Shirayuki266` | `090af39`, `175e97c`, `66e027d`, `8a3f740` |
| 10 | **UC10** | Quản lý nội dung đa ngôn ngữ & Media | **Bao-dev06** | `duyhuynh4869-byte`, `Shirayuki266` | `090af39`, `66e027d`, `692fed5`, `24d43ac`, `c3274ee` |
| 11 | **UC11** | Tạo và xuất mã QR cho POI | **Bao-dev06** | `Shirayuki266` | `090af39`, `5082b26`, `8a3f740` |
| 12 | **UC12** | Lưu trữ và sử dụng dữ liệu ngoại tuyến | **duyhuynh4869-byte** | `Bao-dev06`, `Shirayuki266` | `990f272`, `8a3f740`, `a3b263c`, `53bbae3` |
| 13 | **UC13** | Giám sát thiết bị thật & Thống kê lưu lượng truy cập | **Bao-dev06** | `Shirayuki266` | `090af39`, `be2cb22` |

---

## 🔍 CHI TIẾT BẰNG CHỨNG MÃ NGUỒN THEO TỪNG USE CASE

### UC01: Khởi tạo ứng dụng và cấp quyền
- **Người chủ trì:** `Shirayuki266`
- **Người phối hợp:** `Bao-dev06`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Xây dựng component `src/components/WelcomeModal.tsx` hiển thị quy định viếng chùa, hướng dẫn bật GPS và quyền mở âm thanh phần cứng trên di động.
  - `c3274ee` (`Bao-dev06`): `sửa lỗi`
    - Hoàn thiện xử lý luồng xác nhận cấp quyền và tự động lưu trạng thái checklist của du khách.

---

### UC02: Chọn ngôn ngữ
- **Người chủ trì:** `Shirayuki266`
- **Người phối hợp:** `duyhuynh4869-byte`, `Bao-dev06`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Khởi tạo kho từ điển giao diện `src/translations/index.ts` và nút chuyển ngôn ngữ cờ quốc gia trên thanh `Header.tsx`.
  - `24d43ac` (`duyhuynh4869-byte`): `build: update Node to 22 and add MapLibre workers`
    - Bổ sung tiếng Hindi (`hi-IN`) vào hệ thống từ điển và danh mục ngôn ngữ hỗ trợ.
  - `c3274ee` (`Bao-dev06`): `sửa lỗi`
    - Cập nhật chuẩn hóa danh mục 12 mã ngôn ngữ BCP-47 (`src/config/languages.ts`).

---

### UC03: Tương tác bản đồ số khuôn viên
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `Shirayuki266`, `duyhuynh4869-byte`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Dựng bản đồ Leaflet 2D ban đầu (`CampusMap.tsx`, `RealCampusMap.tsx`).
  - `692fed5` (`Shirayuki`): `feat: add 3D map, chatbot, and enhanced TTS support`
    - Khởi tạo component `src/components/MapLibre3DCampusMap.tsx` chuyển nền tảng sang MapLibre GL JS 3D góc nghiêng pitch 55°.
  - `a4c278e` & `24d43ac` (`duyhuynh4869-byte`): `build: update Node to 22 and add MapLibre workers`
    - Cung cấp file worker `public/maplibre-gl-worker.mjs` với MIME type chuẩn, tối ưu render WebGL không đơ giao diện.
  - `e4eca42` (`Bao-dev06`): `fix(map): remove 3d building extrusion... and fix street map tiles with CartoDB Voyager CORS provider`
    - Dọn dẹp các khối extrusion 3D thừa che tầm nhìn, sửa lỗi tải tile đường phố.
  - `bd263f4` (`Bao-dev06`): `feat(map): integrate VietMap Maps API support and replace Carto with clean Esri World Street tiles (no watermark)`
    - Tích hợp VietMap Maps API và loại bỏ vĩnh viễn watermark `API KEY REQUIRED` của CartoDB bằng nguồn Esri sạch.
  - `c789b73` (`Bao-dev06`): `fix(map): fix 'Map data not yet available' error by calibrating true maxzoom per raster basemap and consolidating BASEMAPS`
    - Đo đạc thực nghiệm và hiệu chuẩn chính xác `maxzoom` cho từng raster basemap (Dark Gray = 16, Street = 19, Satellite = 19), khắc phục triệt để lỗi ô xám *"Map data not yet available"*.

---

### UC04: Thuyết minh tự động bằng Geofencing GPS (Lọc Kalman 2D)
- **Người chủ trì:** `Shirayuki266`
- **Người phối hợp:** `duyhuynh4869-byte`, `Bao-dev06`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Cài đặt hook `src/hooks/useGPSTracker.ts` và thuật toán lọc nhiễu tọa độ `src/server/services/gpsFilterService.ts` (bộ lọc Kalman 2D).
  - `a4c278e` (`duyhuynh4869-byte`): `chore: refactor dependencies and update location types`
    - Chuẩn hóa các trường trạng thái định vị (location state fields) trong `useGPSTracker.ts`.
  - `ea890ac` & `1d5f008` (`Bao-dev06`): `feat(audio): implement mobile audio hardware priming`
    - Cài đặt cơ chế mở khóa phần cứng âm thanh di động khi du khách vừa chạm ranh giới Geofence để trình duyệt tự phát thuyết minh không bị chặn autoplay.

---

### UC05: Xem và nghe thuyết minh thủ công
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `Shirayuki266`, `duyhuynh4869-byte`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Khởi tạo thanh nghe `AudioPlayerBar.tsx` và ngăn kéo bài thuyết minh `POIDetailDrawer.tsx`.
  - `66e027d` (`duyhuynh4869-byte`): `feat: add introduction field to POI model and audio`
    - Đưa lời dẫn nhập (`intro_vi`) kết nối trực tiếp vào kịch bản âm thanh `audioSpeech.ts`.
  - `848c8b9` (`Shirayuki_Chan`): `nang cap ket noi voi mongodb, sua loi chuc nang phat toc do audio, chinh sua thanh trang thai phat audio .`
    - Sửa lỗi thanh trạng thái và tính năng đổi tốc độ đọc.
  - `a3b263c` (`Bao-dev06`): `refactor: optimize audio playback and speech synthesis`
    - Cải tiến kiến trúc phát 3 tầng (Lớp 1 File MP3 -> Lớp 2 Cloud TTS -> Lớp 3 Web Speech chip).
  - `f67f9e5` (`Bao-dev06`): `feat(audio): extend maximum speech rate up to 2.5x in audio engine and voice modal slider`
    - Mở rộng giới hạn tốc độ đọc lên mức tối đa 2.5x.
  - `53bbae3` (`Bao-dev06`): `feat(audio): standardize 5 fixed speech speed options (0.7x, 1x, 1.25x, 1.5x, 2.5x) with segmented UI control, pitch preservation, and device clamping`
    - Chuẩn hóa cố định đúng 5 mức tốc độ (`0.7x, 1.0x, 1.25x, 1.5x, 2.5x`), giữ cao độ tự nhiên `preservesPitch = true`, giới hạn rate trên iOS Safari tránh méo giọng.

---

### UC06: Quét mã QR dự phòng (Camera QR Scanner)
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `Shirayuki266`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Dựng modal quét QR sơ khai `src/components/QRScannerModal.tsx`.
  - `5082b26` (`Bao-dev06`): `làm lại qr`
    - Viết lại toàn bộ module Camera Scanner với thư viện `jsQR`, tự động bắt nét mã QR của từng điểm POI qua luồng video camera điện thoại.
  - `c3274ee` (`Bao-dev06`): `sửa lỗi`
    - Tối ưu hóa việc đóng camera giải phóng tài nguyên sau khi quét thành công và mở đúng điểm POI trên bản đồ.

---

### UC07: Đăng nhập và xác thực Admin CMS
- **Người chủ trì:** `Shirayuki266`
- **Người phối hợp:** `Bao-dev06`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Xây dựng form đăng nhập trong `AdminPortal.tsx`, cấp JWT Token qua `authService.ts` và `authController.ts`.
  - `175e97c` (`Bao-dev06`): `feat: enhance admin portal and database tooling`
    - Tăng cường bảo mật middleware `requireAdmin` bảo vệ các route nhạy cảm.

---

### UC08: Quản lý thông tin khuôn viên di tích
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `duyhuynh4869-byte`, `Shirayuki266`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Cấu hình thực thể `Campus` trong cơ sở dữ liệu.
  - `990f272` (`duyhuynh4869-byte`): `build: remove Supabase and clean up migrations`
    - Chuyển dữ liệu khuôn viên sang lưu trữ trong MongoDB Atlas.
  - `175e97c` (`Bao-dev06`): `feat: enhance admin portal and database tooling`
    - Nâng cấp màn hình xem và cập nhật thông tin giới thiệu khuôn viên di tích Việt Nam Quốc Tự.

---

### UC09: Quản lý điểm thuyết minh (POI) & Tọa độ Geofence
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `duyhuynh4869-byte`, `Shirayuki266`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): `feat: initialize project structure and base app`
    - Tạo các điểm POI ban đầu trong `seedPOIs.ts` và bộ chọn tọa độ `AdminPOIMapPicker.tsx`.
  - `66e027d` (`duyhuynh4869-byte`): `feat: add introduction field to POI model and audio`
    - Bổ sung trường `intro_vi` vào POI Entity và form nhập dữ liệu Admin.
  - `175e97c` (`Bao-dev06`): `feat: enhance admin portal and database tooling`
    - Cải tiến danh sách CRUD POI và chấm tọa độ Geofence trực quan trên bản đồ.
  - `090af39` (`Bao-dev06`): `feat: upgrade admin popup, mongo daily visits, image upload and fix map`
    - Tách riêng toàn bộ trình biên tập bài viết POI thành modal chuyên dụng `src/components/POIArticlePopup.tsx`.

---

### UC10: Quản lý nội dung đa ngôn ngữ & Media
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `duyhuynh4869-byte`, `Shirayuki266`
- **Các Commit trên GitHub:**
  - `692fed5` (`Shirayuki`): `feat: add 3D map, chatbot, and enhanced TTS support`
    - Cài đặt dịch vụ TTS đám mây `ttsService.ts` và lưu trữ file audio vào thư mục `public/audio/`.
  - `66e027d` (`duyhuynh4869-byte`): `feat: add introduction field to POI model and audio`
    - Tích hợp lời giới thiệu vào prompt dịch AI tự động đa ngôn ngữ (`aiTranslationService.ts`).
  - `090af39` (`Bao-dev06`): `feat: upgrade admin popup, mongo daily visits, image upload and fix map`
    - Xây dựng dịch vụ tải ảnh `fileStorageService.ts` lên thư mục an toàn `/uploads/` có kiểm tra MIME type thật.
    - Cài đặt tính năng biên tập bài viết 12 ngôn ngữ và tạo lại file âm thanh đơn lẻ (`regenerateSingleAudio`) trong `POIArticlePopup.tsx`.

---

### UC11: Tạo và xuất mã QR cho POI
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `Shirayuki266`
- **Các Commit trên GitHub:**
  - `8a3f740` (`Shirayuki`): Khởi tạo tính năng tạo QR cơ bản bằng thư viện `qrcode`.
  - `5082b26` & `090af39` (`Bao-dev06`):
    - Tích hợp modal xem và tải ảnh mã QR của từng điểm POI trực tiếp trong trang quản trị Admin theo định dạng liên kết `https://<domain>/?poi=CODE`.

---

### UC12: Lưu trữ và sử dụng dữ liệu ngoại tuyến
- **Người chủ trì:** `duyhuynh4869-byte`
- **Người phối hợp:** `Bao-dev06`, `Shirayuki266`
- **Các Commit trên GitHub:**
  - `990f272` (`duyhuynh4869-byte`): `build: remove Supabase and clean up migrations`
    - Tinh gọn CSDL, cài đặt cơ chế đệm dữ liệu ngoại tuyến (`InMemoryRepository` trong `src/server/repositories/db.ts`) phòng trường hợp máy chủ mất kết nối Internet.
  - `a3b263c` & `53bbae3` (`Bao-dev06`):
    - Tối ưu hóa **Lớp 3 Web Speech API** trên chip thiết bị, chia câu nhỏ $\le 88$ ký tự giúp du khách vẫn nghe thuyết minh được bình thường khi mất hoàn toàn mạng 4G/WiFi.

---

### UC13: Giám sát thiết bị thật & Thống kê lưu lượng truy cập
- **Người chủ trì:** `Bao-dev06`
- **Người phối hợp:** `Shirayuki266`
- **Các Commit trên GitHub:**
  - `be2cb22` (`Shirayuki`): `Modify real_devices collection initialization logic`
    - Thiết lập bảng `real_devices` thu thập thông tin thiết bị thô ban đầu.
  - `090af39` (`Bao-dev06`): `feat: upgrade admin popup, mongo daily visits, image upload and fix map`
    - Xóa bỏ bảng `real_devices` và các logic lưu IP thô để bảo vệ quyền riêng tư người dùng.
    - Xây dựng `dailyVisitService.ts` và bảng `daily_visits` sử dụng mã băm bảo mật **HMAC-SHA256**.
    - Cài đặt quy tắc chống spam **1 thiết bị = 1 người = tối đa 1 lượt/ngày** bằng Unique Compound Index `{ day: 1, visitorHash: 1 }` và chỉ mục tự hủy TTL 86400s (24h) trên MongoDB.
    - Hiển thị trực tiếp số lượng khách hành hương thực tế trong ngày tại Khối 1 trang Dashboard Admin.

---

## 🚀 ĐÓNG GÓI PHIÊN BẢN VÀ DEVOPS
- `9d053a5` (`Bao-dev06`): `ci/cd` - Hoàn thiện pipeline GitHub Actions và Dockerfile.
- `52827f0` (`Bao-dev06`): `version3` - Commit đóng gói phát hành toàn diện toàn bộ 13 Use Cases trên nhánh `main`.
