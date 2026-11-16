# BẢN ĐỒ KIẾN TRÚC VÀ BỘ MÃ NGUỒN TOÀN HỆ THỐNG
## HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ VIỆT NAM QUỐC TỰ

Tài liệu này đóng vai trò như **Kim Chỉ Nam / Bản Đồ Kỹ Thuật (Architecture & Code Blueprint)** cho toàn bộ dự án. Giúp lập trình viên, giảng viên và người quản trị nắm rõ cấu trúc **Kiến trúc 3 lớp (3-Tier Architecture)**, sự liên kết logic, đường đi của dữ liệu, nhiệm vụ của từng tầng và nội dung mã nguồn của từng file cụ thể trong dự án.

---

## PHẦN 1: BẢN ĐỒ LIÊN KẾT LOGIC TOÀN HỆ THỐNG (KIẾN TRÚC 3 LỚP)

Hệ thống được thiết kế chuẩn mực theo mô hình **Kiến trúc 3 lớp (3-Tier Architecture)** trong Công nghệ phần mềm:
1. **Tầng 1: Tầng Trình Diễn (Presentation Tier - Frontend Client)**: Chạy trên trình duyệt của người dùng (Mobile & Desktop).
2. **Tầng 2: Tầng Ứng Dụng & Nghiệp Vụ (Application & Business Logic Tier - Backend Server)**: Máy chủ Express Node.js điều phối API, xử lý nghiệp vụ, tích hợp AI Dịch thuật (Gemini) và AI Giọng nói (Google TTS).
3. **Tầng 3: Tầng Dữ Liệu (Data Tier - Database & Storage)**: Cơ sở dữ liệu MongoDB Atlas lưu trữ cấu trúc di tích và thư viện file âm thanh tĩnh MP3.

### 1.1 Sơ Đồ Khối Tương Tác 3 Lớp

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              TẦNG 1: TẦNG TRÌNH DIỄN (PRESENTATION TIER - CLIENT)                      │
│                                                                                                        │
│   [index.html] ──► [src/main.tsx] ──► [src/App.tsx (Khách tham quan)] & [src/AdminApp.tsx (Quản trị)] │
│                                              │                                                         │
│   ┌───────────────────┬──────────────────────┼────────────────────┬─────────────────┬────────────────┐ │
│   ▼                   ▼                      ▼                    ▼                 ▼                ▼ │
│ [Header.tsx]   [MapLibre3DCampusMap]  [AudioPlayerBar]    [POIDetailDrawer]  [POIArticlePopup] [AdminPortal│
│ (12 Ngôn ngữ,  (Bản đồ 3D Vector &    (Thanh phát âm      (Nội dung chi tiết (Hiệu đính bản &  & [MapPicker]│
│  Quét mã QR)    Chế độ Ngày/Đêm 4D)    thanh đa nguồn)     bài thuyết minh)   dịch đa ngữ)     (Quản trị) │
│   │                   │                      │                    │                                  │ │
│   └─────────┬─────────┴──────────────────────┼────────────────────┴──────────────────────────────────┘ │
│             ▼                                ▼                                                         │
│   [hooks/useGPSTracker.ts]        [utils/audioSpeech.ts]           [config/languages.ts]               │
│   (GPS Geolocation & Giả lập)     (Speech Engine & Web Audio)      (13 Ngôn ngữ chuẩn hóa)             │
└───────────────────────┬──────────────────────────────────┬─────────────────────────────────────────────┘
                        │ HTTP REST API                    │ Tải âm thanh MP3 / Upload ảnh
                        ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         TẦNG 2: TẦNG ỨNG DỤNG & NGHIỆP VỤ (APPLICATION TIER - SERVER)                  │
│                                                                                                        │
│   [server.ts] (Express Server Port 3000 + Tích hợp Vite HMR & Static Worker Routing)                   │
│       │                                                                                                │
│       ▼ Gắn router `/api`                                                                              │
│   [src/server/routes/api.ts] (Bộ định tuyến trung tâm, Middleware Rate Limit, Upload Multer, JWT Auth) │
│       │                                                                                                │
│   ┌───┴───────────────────────────────────────┐                                                        │
│   ▼ (Lớp Controller)                          ▼ (Lớp Controller)                                       │
│   [controllers/poiController.ts]              [controllers/authController.ts]                          │
│   (Điều phối CRUD POI, Media, Dịch thuật AI)  (Điều phối Đăng nhập, Xác thực JWT Admin)                │
│       │                                           │                                                    │
│       └───────────────────────┬───────────────────┘                                                    │
│                               ▼ Gọi thực thi nghiệp vụ (Lớp Service)                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ [services/poiService.ts]          ── Quản lý nghiệp vụ điểm chiêm bái & tính Geofence          │   │
│   │ [services/aiTranslationService.ts]── [AI 1] Gọi Google GenAI SDK (Gemini AI Dịch thuật tôn kính)│   │
│   │ [services/ttsService.ts]          ── [AI 2] Tổng hợp giọng đọc MP3 Google TTS Engine & Cache   │   │
│   │ [services/localizationService.ts] ── Tự động hóa 1-Click dịch 12 thứ tiếng & Tạo file MP3      │   │
│   │ [services/dailyVisitService.ts]   ── Giám sát thiết bị thật qua mã băm SHA-256 HMAC bí mật     │   │
│   │ [services/gpsFilterService.ts]    ── Thuật toán Bộ lọc Kalman 2D làm mượt GPS                  │   │
│   │ [services/fileStorageService.ts]  ── Quản lý lưu trữ và dọn dẹp tệp ảnh upload an toàn         │   │
│   │ [services/authService.ts]         ── Xác thực mật khẩu băm HMAC-SHA256 & Cấp phát JWT Session  │   │
│   └────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────┬─────────────────────────────────────────────────────────────────┘
                                       │ Gọi truy xuất dữ liệu (Lớp Repository)
                                       ▼
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 TẦNG 3: TẦNG DỮ LIỆU & LƯU TRỮ (DATA TIER - STORAGE)                   │
│                                                                                                        │
│   [repositories/poiRepository.ts] (Lớp trừu tượng truy vấn CSDL POI)                                   │
│       │                                                                                                │
│       ▼                                                                                                │
│   [repositories/db.ts] (Bộ máy CSDL nhúng MongoDatabaseEngine hỗ trợ lưu trữ kép In-Memory & MongoDB)  │
│       ├── Bộ sưu tập: `campuses`, `pois`, `poi_translations`, `poi_media`, `daily_visits`, `admin_users`│
│       ├── Dữ liệu Seed: [repositories/seedPOIs.ts] (8 POI khởi tạo chuẩn hóa tọa độ)                   │
│       └── Đồng bộ đám mây: [repositories/mongoClient.ts] ──► [ Cụm MongoDB Atlas Cloud (2dsphere) ]    │
│                                                                                                        │
│   Kho tệp tĩnh máy chủ (Local Disk Storage):                                                           │
│       ├── `public/audio/` (Bộ nhớ đệm các tệp âm thanh thuyết minh MP3 do Google TTS tạo ra)           │
│       └── `public/uploads/` (Bộ nhớ lưu trữ hình ảnh các điểm POI do Quản trị viên tải lên)            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Luồng Dữ Liệu Hoạt Động Cốt Lõi (Lifecycle Flows)

#### Luồng 1: Người dùng bước vào khuôn viên chùa và kích hoạt Thuyết minh tự động (Geofencing GPS)
1. `useGPSTracker.ts` thu nhận tọa độ GPS từ trình duyệt (`navigator.geolocation.watchPosition`).
2. Dữ liệu tọa độ thô `{lat, lng, accuracy}` được đưa qua thuật toán **Lọc Kalman 2D** (`gpsFilterService.ts`) để loại bỏ hiện tượng nhảy cóc tọa độ (Outlier Gating Rejection: từ chối các bước nhảy vận tốc đi bộ $> 7$ m/s với sai số accuracy $> 20$m).
3. Tọa độ mượt được gửi về `App.tsx`. Hệ thống áp dụng công thức Haversine (`src/utils/geo.ts`) tính khoảng cách thực tế giữa người dùng và 8 điểm chiêm bái (POI).
4. Khi khoảng cách $\le$ bán kính Geofence của điểm (khoảng $20$m), hệ thống kích hoạt chuông báo và hiển thị thẻ thông báo nổi.
5. Nếu bật chế độ "Tự động phát", `AudioPlayerBar` được kích hoạt: hệ thống kiểm tra file âm thanh MP3 lưu đệm tại `/audio/poi-{code}-{lang}.mp3` (do `ttsService` sinh ra). Nếu có, phát trực tiếp MP3 chất lượng cao; nếu chưa có, kích hoạt Web Speech API (`audioSpeech.ts`) với bộ lọc giọng đọc tối ưu (giọng Apple trên iOS, Google trên Android) để phát thuyết minh tức thì.

#### Luồng 2: Khách yêu cầu thuyết minh bằng ngôn ngữ mới & Cơ chế 1-Click AI Localization
1. Khách chọn ngôn ngữ trên giao diện (ví dụ: tiếng Nhật `ja` hoặc tiếng Pháp `fr`).
2. Client gửi yêu cầu `GET /api/pois/:id?lang=ja` đến `poiController.ts`.
3. `poiController.ts` kiểm tra trong CSDL (`db.ts` / MongoDB Atlas). Nếu bản dịch đã có sẵn, trả về ngay lập tức với độ trễ 0s.
4. Nếu chưa có, hệ thống kích hoạt `aiTranslationService.ts`, gọi mô hình **Gemini AI** (`@google/genai`) với System Prompt chuyên sâu về Phật học để biên soạn bản dịch chuẩn xác.
5. Tại trang Quản trị, Admin có thể nhấn **"Dịch & Tạo Voice Tự Động (1-Click)"**: `localizationService.ts` sẽ dịch toàn bộ sang 12 thứ tiếng và đồng thời gọi `ttsService.ts` tạo sẵn toàn bộ các file `.mp3` lưu vào đĩa cứng máy chủ.

#### Luồng 3: Giám sát Thiết Bị Thật & Thống kê lưu lượng truy cập (Bảo vệ quyền riêng tư)
1. Khi khách mở ứng dụng, `fingerprint.ts` thu thập các thông số kỹ thuật ẩn danh: Canvas render, độ phân giải màn hình, múi giờ, ngôn ngữ trình duyệt.
2. Thiết bị gửi yêu cầu `POST /api/visit/checkin`.
3. `dailyVisitService.ts` kết hợp IP và thông số thiết bị với khóa bí mật xoay vòng theo ngày (`VISITOR_HASH_SALT`), băm qua giải thuật `SHA-256 HMAC` để tạo chuỗi `visitorHash` duy nhất.
4. Ghi nhận lượt viếng thăm vào bộ sưu tập `daily_visits`. Cơ chế chống dữ liệu ảo đảm bảo **1 thiết bị thật = tối đa 1 lượt tính trong 24 giờ**, hoàn toàn không lưu thông tin cá nhân.
5. Quản trị viên theo dõi biểu đồ thống kê lưu lượng khách thực tế theo ngày/tháng trên `AdminPortal.tsx`.

#### Luồng 4: Tương tác Bản đồ số 3D WebGL & Chế độ Ngày/Đêm 4D
1. Khi mở tab Bản đồ, `App.tsx` nạp `MapLibre3DCampusMap.tsx` với WebGL engine mã nguồn mở.
2. Bản đồ tích hợp 3 lớp dữ liệu đồng thời:
   - **Bản đồ nền (Basemap Tiles)**: Tải trực tiếp từ dịch vụ Esri ArcGIS (`World_Street_Map`, `World_Imagery` vệ tinh, hoặc `Canvas/World_Dark_Gray_Base`).
   - **Mô hình kiến trúc 3D (3D Extrusion Buildings)**: Dựng các khối nhà từ dữ liệu GeoJSON nội bộ (Bảo Tháp 13 tầng cao 63m, Chính Điện cao 30m, Cổng Tam Quan 14m, Gác Chuông 18m).
   - **Lớp POI & Geofence**: Hiển thị vị trí các điện thờ, bán kính vòng tròn kích hoạt và lộ trình hành hương chiêm bái.
3. Bản đồ tự động phát hiện giờ địa phương của thiết bị: từ 18:00 đến 06:00 sáng tự động chuyển sang chế độ Ban đêm (Dark Canvas, ánh sáng khối nhà màu vàng kim huyền ảo).

#### Luồng 5: Tạo và xuất mã QR dự phòng cho các điểm chiêm bái
1. Trong `AdminPortal.tsx`, quản trị viên chọn một POI và nhấn nút "Xuất mã QR".
2. Hệ thống sử dụng thư viện `qrcode` kết hợp mã định danh của POI tạo đường link tiêu chuẩn `https://domain/?poi={poi_code}`.
3. Mã QR được vẽ lên Canvas kèm khung viền trang nghiêm, tên di tích tiếng Việt và logo chùa.
4. Quản trị viên có thể tải về dưới dạng tệp ảnh PNG/JPG để in ấn và dán trực tiếp tại các biển bảng chỉ dẫn trước các điện thờ. Khi khách dùng camera quét mã, ứng dụng tự động mở đúng bài thuyết minh của điểm đó.

---

## PHẦN 2: BẢN ĐỒ CHI TIẾT TỪNG TẬP TIN TRONG BỘ MÃ NGUỒN

Dưới đây là thống kê và thuyết minh chi tiết toàn bộ các tập tin cấu thành hệ thống:

---

### I. CÁC TẬP TIN CẤU HÌNH VÀ KHỞI TẠO MÁY CHỦ (ROOT FILES)

#### 1. `/server.ts` (88 dòng)
- **Nhiệm vụ chính**: Điểm vào (entry point) của toàn bộ ứng dụng Full-Stack phía máy chủ.
- **Nội dung code**:
  - Khởi tạo Express app, nạp biến môi trường từ `.env` bằng `dotenv/config`.
  - Khởi tạo kết nối MongoDB Atlas qua `mongoManager.initClient()` và đồng bộ dữ liệu ban đầu `db.syncWithMongoDB()`.
  - Cấu hình body parser JSON (giới hạn 10MB) và urlencoded.
  - Gắn router API vào đường dẫn `/api` (`app.use('/api', apiRouter)`).
  - Phục vụ tệp tĩnh: thư mục `public/`, thư mục âm thanh `/audio` (`public/audio`), và thư mục ảnh tải lên `/uploads` (`public/uploads`).
  - Định tuyến chuyên biệt cho Web Worker của MapLibre GL (`/maplibre-gl-worker.mjs`) với đúng MIME type `application/javascript` để tránh lỗi đóng gói của Vite.
  - **Middleware xử lý lỗi CSDL (Database Offline Fallback)**: Bắt các lỗi kết nối Mongo, tự động trả về dữ liệu an toàn mà không làm sập máy chủ.
  - Tích hợp Vite middleware ở chế độ phát triển (`createViteServer`) hoặc phục vụ thư mục `dist/` khi chạy production.

#### 2. `/package.json` (45 dòng)
- **Nhiệm vụ**: Khai báo phụ thuộc (dependencies), phiên bản thư viện và các kịch bản thực thi (scripts).
- **Dependencies chính**: `@google/genai`, `express`, `leaflet`, `maplibre-gl`, `lucide-react`, `mongodb`, `multer`, `google-tts-api`, `qrcode`, `react`, `react-dom`, `tsx`, `vite`, `tailwindcss`.

#### 3. `/vite.config.ts` (26 dòng)
- **Nhiệm vụ**: Cấu hình công cụ đóng gói Vite và Tailwind CSS v4. Tích hợp `@vitejs/plugin-react`, `@tailwindcss/vite`, thiết lập alias `@` trỏ về thư mục `src`.

#### 4. `/tsconfig.json` (26 dòng)
- **Nhiệm vụ**: Cấu hình trình biên dịch TypeScript (Target ES2022, module ESNext, moduleResolution Bundler, JSX react-jsx).

#### 5. `/index.html` (24 dòng)
- **Nhiệm vụ**: Trang HTML Single Page Application gốc của ứng dụng. Khai báo SEO meta tags, Google Fonts ('Be Vietnam Pro', 'Playfair Display') và file CSS thư viện bản đồ.

#### 6. `/.env.example` (15 dòng)
- **Nhiệm vụ**: File mẫu khai báo các biến môi trường: `AUTH_SECRET`, `MONGODB_DB_NAME`, `MONGODB_URI`, `GEMINI_API_KEY`, `VISITOR_HASH_SALT`, `MAPTILER_API_KEY`, `VITE_VIETMAP_API_KEY`.

---

### II. GIAO DIỆN NGƯỜI DÙNG CHÍNH (SRC ROOT)

#### 7. `/src/main.tsx` (21 dòng)
- **Nhiệm vụ**: Khởi động React DOM, gắn component `<App />` vào `<div id="root">`. Nạp CSS toàn cục `index.css` và CSS bản đồ `leaflet.css`.

#### 8. `/src/index.css` (39 dòng)
- **Nhiệm vụ**: Định dạng giao diện toàn cầu với Tailwind CSS, khai báo font chữ chủ đạo, tùy biến thanh cuộn `no-scrollbar`, và style cho Marker bản đồ.

#### 9. `/src/App.tsx` (1,126 dòng)
- **Nhiệm vụ**: Component điều phối trung tâm (Master Orchestrator) quản lý toàn bộ trạng thái của ứng dụng dành cho khách tham quan.
- **Nội dung code**:
  - Quản lý 3 màn hình chuyển đổi nhanh:
    1. **Khám Phá (`explore`)**: Danh mục điểm chiêm bái, bộ lọc, thẻ hình ảnh, tìm kiếm.
    2. **Hành Trình (`itinerary`)**: Lộ trình tham quan tối ưu theo thứ tự truyền thống.
    3. **Bản Đồ (`map`)**: Bản đồ số tương tác thời gian thực và thẻ hành hương điện tử.
  - Quản lý định vị GPS qua `useGPSTracker`, tính toán cảnh báo Geofence tự động.
  - Quản lý trạng thái âm thanh đang phát, đồng bộ URL parameters (`?poi=...`, `?view=admin`).
  - Điều khiển các cửa sổ Modal: quét QR, cấu hình giọng đọc, thông báo chào mừng.

#### 10. `/src/AdminApp.tsx` (34 dòng)
- **Nhiệm vụ**: Entry point độc lập cho trang quản trị, tải danh sách POI từ API `/api/pois` và bao bọc component `AdminPortal`.

---

### III. CÁC COMPONENT GIAO DIỆN (SRC/COMPONENTS)

#### 11. `/src/components/MapLibre3DCampusMap.tsx` (943 dòng)
- **Nhiệm vụ**: Bản đồ số 3D WebGL chính của hệ thống.
- **Nội dung code**:
  - Render bản đồ vector/raster dựa trên thư viện MapLibre GL JS, tích hợp Web Worker riêng.
  - Hỗ trợ nguồn tile nền từ Esri ArcGIS (Street, Satellite, Dark Canvas) hoặc MapTiler.
  - Mô hình hóa các khối nhà 3D (`VNQT_3D_BUILDINGS_GEOJSON`) với chiều cao thực tế: Bảo Tháp 13 Tầng (63m), Chính Điện (30m), Cổng Tam Quan (14m), Gác Chuông (18m).
  - Tự động đồng bộ giao diện Ngày/Đêm (4D Day/Night) theo thời gian thực của thiết bị.
  - Hiển thị la bàn số, vòng tròn bán kính Geofence động và tuyến đường hành hương.

#### 12. `/src/components/RealCampusMap.tsx` (587 dòng)
- **Nhiệm vụ**: Bản đồ 2D tương tác xây dựng trên Leaflet làm giải pháp bản đồ truyền thống và dự phòng cho các thiết bị không hỗ trợ WebGL.

#### 13. `/src/components/CampusMap.tsx` (311 dòng)
- **Nhiệm vụ**: Bản đồ sơ đồ đồ họa minh họa dạng vector SVG thuần túy, hoạt động hoàn hảo khi thiết bị hoàn toàn ngoại tuyến hoặc mất kết nối mạng.

#### 14. `/src/components/Header.tsx` (212 dòng)
- **Nhiệm vụ**: Thanh tiêu đề phía trên cùng của ứng dụng di động: Logo chùa, bộ chọn 12 ngôn ngữ kèm cờ quốc gia, nút quét QR, nút cài đặt giọng đọc, và nút mở trang quản trị.

#### 15. `/src/components/AudioPlayerBar.tsx` (437 dòng)
- **Nhiệm vụ**: Thanh trình phát âm thanh cố định ở đáy màn hình (Sticky Audio Player): Nút Play/Pause, tua tiến/lùi 10s, thanh trượt thời gian phát, chọn giọng đọc, hiển thị tên bài thuyết minh đang phát.

#### 16. `/src/components/POIDetailDrawer.tsx` (445 dòng)
- **Nhiệm vụ**: Bảng chi tiết điểm chiêm bái dạng trượt từ dưới lên (Bottom Sheet Drawer): Carousel hình ảnh, tiêu đề tôn kính, đoạn giới thiệu, bài thuyết minh lịch sử - kiến trúc, và nút kích hoạt dịch AI.

#### 17. `/src/components/POIArticlePopup.tsx` (509 dòng)
- **Nhiệm vụ**: Cửa sổ pop-up toàn màn hình phục vụ việc đọc bài thuyết minh chuyên sâu, đồng thời cho phép quản trị viên xem trước và hiệu đính bản dịch đa ngôn ngữ trực tiếp.

#### 18. `/src/components/VoiceSelectorModal.tsx` (320 dòng)
- **Nhiệm vụ**: Hộp thoại tùy chỉnh giọng đọc: Chọn giữa các engine giọng đọc (Google, AI Neural, Hoài My, Apple Linh/Mai), thanh trượt tốc độ (Speed Rate: 0.8x - 1.3x), và nút đọc thử câu kinh Phật.

#### 19. `/src/components/QRScannerModal.tsx` (296 dòng)
- **Nhiệm vụ**: Hộp thoại quét mã QR bằng camera điện thoại hoặc tải ảnh QR từ máy để mở thẳng bài thuyết minh tương ứng.

#### 20. `/src/components/WelcomeModal.tsx` (157 dòng)
- **Nhiệm vụ**: Màn hình chào mừng khi khách lần đầu truy cập: Giới thiệu chùa, chọn ngôn ngữ khởi tạo, xin cấp quyền định vị GPS và kích hoạt âm thanh vượt rào cản chặn Autoplay của trình duyệt.

#### 21. `/src/components/AdminPortal.tsx` (1,289 dòng)
- **Nhiệm vụ**: Trung tâm điều hành quản trị toàn diện:
  - Đăng nhập xác thực tài khoản quản trị bằng JWT.
  - Quản lý POI (CRUD): Thêm mới, chỉnh sửa tọa độ, upload ảnh, xóa điểm chiêm bái.
  - Tạo và xuất mã QR (PNG/JPG) có khung nhãn trang nghiêm.
  - Công cụ 1-Click AI Localization: Tự động dịch sang 12 thứ tiếng và tạo audio MP3 hàng loạt.
  - Biểu đồ phân tích lưu lượng truy cập thiết bị thật theo ngày (`daily_visits`).
  - Thiết lập cấu hình giọng đọc mặc định toàn hệ thống.

#### 22. `/src/components/AdminPOIMapPicker.tsx` (268 dòng)
- **Nhiệm vụ**: Bản đồ chọn tọa độ tích hợp trong form Admin: Cho phép quản trị viên click chuột trên bản đồ để lấy chính xác kinh độ - vĩ độ thực tế và xem trước bán kính Geofence.

---

### IV. CẤU HÌNH, HOOKS VÀ TIỆN ÍCH (SRC/CONFIG, SRC/HOOKS, SRC/UTILS)

#### 23. `/src/config/languages.ts` (27 dòng)
- **Nhiệm vụ**: Định nghĩa danh mục chuẩn hóa 13 ngôn ngữ hỗ trợ: mã ISO, mã Google GenAI, mã TTS, tên bản địa và cờ biểu tượng.

#### 24. `/src/hooks/useGPSTracker.ts` (130 dòng)
- **Nhiệm vụ**: React hook quản lý vòng đời theo dõi vị trí GPS của thiết bị, tích hợp chế độ giả lập bước đi (Simulation Mode) để kiểm thử Geofence tại bàn làm việc.

#### 25. `/src/utils/audioSpeech.ts` (1,446 dòng)
- **Nhiệm vụ**: Trọng tâm của hệ thống phát âm thanh phía client:
  - Tích hợp danh mục các engine giọng đọc (Gemini AI TTS, Google Cloud, Microsoft Edge, Apple Native).
  - Hàm `splitTextIntoSentences(text, maxLen = 88)`: Chia nhỏ văn bản chống lỗi ngắt tiếng trên iOS WebKit.
  - Kiểm soát âm lượng, tốc độ đọc, cao độ và cơ chế chống méo tiếng.

#### 26. `/src/utils/geo.ts` (29 dòng)
- **Nhiệm vụ**: Thư viện tính toán không gian địa lý: Công thức Haversine đo khoảng cách mặt cầu theo mét và hàm tính góc la bàn (bearing).

#### 27. `/src/utils/fingerprint.ts` (80 dòng)
- **Nhiệm vụ**: Thu thập thông số phần cứng thiết bị (Canvas, Screen, Múi giờ) và băm SHA-256 tạo mã định danh ẩn danh phục vụ thống kê lưu lượng khách thật.

#### 28. `/src/utils/audioSynth.ts` (61 dòng)
- **Nhiệm vụ**: Bộ tổng hợp âm thanh sóng chuông chùa: Tạo mảng Buffer nhị phân WAV 16-bit PCM với 4 họa âm đặc trưng của chuông đồng cổ truyền.

#### 29. `/src/utils/cryptoUtils.ts` (118 dòng)
- **Nhiệm vụ**: Tiện ích mã hóa: Băm mật khẩu quản trị viên với muối (Salt), tạo token phiên làm việc JWT và kiểm tra tính hợp lệ của chữ ký điện tử.

#### 30. `/src/translations/index.ts` (1,282 dòng)
- **Nhiệm vụ**: Từ điển tĩnh chứa toàn bộ chuỗi văn bản giao diện (UI Strings) được bản địa hóa cho 12 ngôn ngữ.

---

### V. TẦNG MÁY CHỦ, ĐIỀU PHỐI VÀ DỊCH VỤ (SRC/SERVER)

#### 31. `/src/server/types.ts` (94 dòng)
- **Nhiệm vụ**: Định nghĩa các Interface TypeScript cốt lõi: `Campus`, `POIEntity`, `POITranslation`, `POIMedia`, `RichPOI`, `DailyVisitEntity`, `UserLocationState`.

#### 32. `/src/server/routes/api.ts` (384 dòng)
- **Nhiệm vụ**: Router trung tâm khai báo toàn bộ các điểm cuối REST API:
  - `/api/health`: Kiểm tra sức khỏe hệ thống, kết nối MongoDB Atlas và Gemini AI.
  - `/api/visit/checkin`, `/api/visit/today-count`: Ghi nhận và thống kê lượt viếng thăm theo ngày.
  - `/api/auth/login`, `/api/auth/me`: Đăng nhập và xác thực phiên làm việc Admin.
  - `/api/pois`: Nhóm API CRUD thông tin điểm chiêm bái, truy vấn không gian lân cận (`/pois/spatial/nearby`).
  - `/api/admin/upload-image`: Tải ảnh lên với Multer (giới hạn 5MB, lọc MIME type, tự xóa ảnh cũ).
  - `/api/tts/synthesize`, `/api/tts/poi/:poiId/:lang`: Tổng hợp và lấy tệp âm thanh thuyết minh MP3.
  - `/api/admin/localize-all`: Kích hoạt dịch thuật và tạo âm thanh 12 ngôn ngữ tự động.

#### 33. `/src/server/controllers/poiController.ts` (182 dòng)
- **Nhiệm vụ**: Tiếp nhận yêu cầu HTTP về POI, gọi các service tương ứng và trả về phản hồi JSON chuẩn hóa.

#### 34. `/src/server/controllers/authController.ts` (64 dòng)
- **Nhiệm vụ**: Tiếp nhận đăng nhập quản trị viên, kiểm tra mật khẩu băm và cấp phát token JWT.

#### 35. `/src/server/services/poiService.ts` (195 dòng)
- **Nhiệm vụ**: Xử lý nghiệp vụ POI: Kết hợp thông tin cơ bản với bản dịch theo ngôn ngữ, gán danh sách hình ảnh, và tính khoảng cách không gian tới vị trí du khách.

#### 36. `/src/server/services/aiTranslationService.ts` (142 dòng)
- **Nhiệm vụ**: [AI Dịch Thuật] Gọi Google GenAI SDK (`@google/genai`) với model `gemini-2.5-flash` để tự động dịch tiêu đề, đoạn giới thiệu và nội dung thuyết minh sang ngôn ngữ yêu cầu.

#### 37. `/src/server/services/ttsService.ts` (227 dòng)
- **Nhiệm vụ**: [AI Giọng Nói] Dịch vụ tổng hợp âm thanh Google TTS Engine: Phân đoạn văn bản dài, gọi dịch vụ sinh âm thanh tiếng nói, lưu tệp MP3 vào đĩa cứng `public/audio` làm bộ nhớ đệm (Cache) tốc độ cao.

#### 38. `/src/server/services/localizationService.ts` (432 dòng)
- **Nhiệm vụ**: Dịch vụ tự động hóa địa phương hóa hàng loạt: Nhận bài viết gốc tiếng Việt, dịch song song sang 12 ngôn ngữ qua Gemini AI và gọi `ttsService` sinh toàn bộ các file MP3 tương ứng.

#### 39. `/src/server/services/dailyVisitService.ts` (86 dòng)
- **Nhiệm vụ**: Dịch vụ quản lý lượt khách thật: Thực hiện băm HMAC-SHA256 với Salt bí mật theo ngày, ghi nhận vào bộ sưu tập `daily_visits` và đếm tổng số khách duy nhất trong ngày.

#### 40. `/src/server/services/gpsFilterService.ts` (147 dòng)
- **Nhiệm vụ**: Cài đặt giải thuật **Bộ lọc Kalman 2D (MobileGPSKalmanFilter)**: Dự đoán trạng thái, cập nhật ma trận hiệp phương sai sai số, loại bỏ nhiễu và làm mịn góc quay la bàn.

#### 41. `/src/server/services/fileStorageService.ts` (38 dòng)
- **Nhiệm vụ**: Quản lý tệp tin tải lên: Xóa an toàn các tệp ảnh cũ trên đĩa cứng khi quản trị viên cập nhật hoặc xóa hình ảnh POI.

#### 42. `/src/server/services/authService.ts` (64 dòng)
- **Nhiệm vụ**: Nghiệp vụ xác thực quản trị: Kiểm tra mật khẩu băm HMAC-SHA256, sinh token JWT có thời hạn và kiểm tra tính hợp lệ của token trong các request bảo mật.

#### 43. `/src/server/repositories/poiRepository.ts` (67 dòng)
- **Nhiệm vụ**: Repository chuyên trách thao tác dữ liệu POI, cung cấp giao diện truy vấn đồng nhất cho `poiService`.

#### 44. `/src/server/repositories/db.ts` (451 dòng)
- **Nhiệm vụ**: Bộ máy cơ sở dữ liệu nhúng `MongoDatabaseEngine`: Quản lý các bộ nhớ BSON In-Memory (`campuses`, `pois`, `translations`, `media`, `dailyVisits`, `adminUsers`), nạp dữ liệu khởi tạo từ `seedPOIs.ts` và đồng bộ 2 chiều với cụm MongoDB Atlas từ xa.

#### 45. `/src/server/repositories/mongoClient.ts` (139 dòng)
- **Nhiệm vụ**: Quản lý kết nối thực tế tới cụm MongoDB Atlas: Kiểm tra độ trễ (ping latency), khởi tạo kết nối an toàn và tạo chỉ mục không gian `2dsphere` cho tọa độ địa lý.

#### 46. `/src/server/repositories/seedPOIs.ts` (681 dòng)
- **Nhiệm vụ**: Dữ liệu hạt giống chuẩn xác của 8 điểm chiêm bái trọng điểm tại Việt Nam Quốc Tự:
  1. Cổng Tam Quan & Quảng Trường Đài Sen
  2. Đại Hùng Bửu Điện (Chính Điện)
  3. Bảo Tháp 13 Tầng (Nơi tôn thờ Xá lợi Trái tim Bồ Tát Thích Quảng Đức)
  4. Quả Đại Hồng Chung 3 Tấn
  5. Tôn Tượng Bồ Tát Quán Thế Âm Lộ Thiên
  6. Vườn Bồ Đề Lâm Tỳ Ni & Hồ Sen An Lạc
  7. Nhà Hậu Tổ & Điện Thờ Chư Tôn Đức Tiền Bối
  8. Nhà Lưu Niệm & Trưng Bày Lịch Sử Giáo Hội

---

### VI. SCRIPTS, KIỂM THỬ VÀ TẬP TIN BỔ TRỢ

#### 47. `/test/backend.test.ts` (151 dòng)
- **Nhiệm vụ**: Kịch bản kiểm thử tích hợp tự động (Integration Test Suite): Kiểm tra công thức khoảng cách Haversine, thuật toán lọc Kalman 2D, xác thực đăng nhập JWT Admin, và truy vấn POI trong cơ sở dữ liệu.

#### 48. `/scripts/seed-mongo.ts` (85 dòng)
- **Nhiệm vụ**: Script dòng lệnh độc lập giúp đẩy toàn bộ 8 điểm chiêm bái và các bản dịch khởi tạo trực tiếp lên cụm MongoDB Atlas qua chuỗi kết nối `MONGODB_URI`.

#### 49. `/scripts/generate-mp3-audio.py` (129 dòng)
- **Nhiệm vụ**: Script Python bổ trợ tạo các file âm thanh tiếng chuông mẫu trong thư mục `public/audio/`.

#### 50. `/python/spatial_ai_service.py` (150 dòng)
- **Nhiệm vụ**: Script Python tính toán tọa độ không gian và tổng hợp âm thanh chuông phục vụ đối sánh giải thuật.

---

## TỔNG KẾT BẢN ĐỒ KIẾN TRÚC 3 LỚP

| Tầng kiến trúc (Tier) | Các thành phần đại diện | Nhiệm vụ chính trong hệ thống |
| :--- | :--- | :--- |
| **1. Tầng Trình Diễn (Presentation Tier)** | `App.tsx`, `MapLibre3DCampusMap.tsx`, `POIDetailDrawer.tsx`, `AudioPlayerBar.tsx`, `AdminPortal.tsx` | Trình diễn bản đồ 3D WebGL, la bàn số, phát âm thanh thuyết minh, tiếp nhận tương tác người dùng, bảng điều khiển quản trị CMS |
| **2. Tầng Ứng Dụng & Nghiệp Vụ (Application Tier)** | `server.ts`, `api.ts`, `poiController.ts`, `authController.ts`, `aiTranslationService.ts`, `ttsService.ts`, `gpsFilterService.ts` | Định tuyến REST API, xác thực JWT, [AI Dịch Thuật] Gemini AI, [AI Giọng Nói] Google TTS Engine, lọc nhiễu GPS Kalman 2D, giám sát khách thật |
| **3. Tầng Dữ Liệu & Lưu Trữ (Data Tier)** | `db.ts`, `poiRepository.ts`, `mongoClient.ts`, `seedPOIs.ts`, thư mục `/public/audio/` | Lưu trữ dữ liệu cấu trúc (MongoDB Atlas + In-Memory Fallback), chỉ mục không gian `2dsphere`, lưu đệm tệp âm thanh thuyết minh tĩnh MP3 |
