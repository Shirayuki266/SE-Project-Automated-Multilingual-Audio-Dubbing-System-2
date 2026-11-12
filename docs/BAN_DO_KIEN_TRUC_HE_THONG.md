# BẢN ĐỒ KIẾN TRÚC VÀ BỘ MÃ NGUỒN TOÀN HỆ THỐNG
## HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ VIỆT NAM QUỐC TỰ

Tài liệu này đóng vai trò như **Kim Chỉ Nam / Bản Đồ Kỹ Thuật (Architecture & Code Blueprint)** cho toàn bộ dự án. Giúp lập trình viên và người quản trị nắm rõ sự liên kết logic, đường đi của dữ liệu, nhiệm vụ của từng tầng và nội dung mã nguồn của từng file cụ thể trong dự án.

---

## PHẦN 1: BẢN ĐỒ LIÊN KẾT LOGIC TOÀN HỆ THỐNG

### 1.1 Sơ Đồ Khối Tương Tác Giữa Các Bộ Phận

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             TẦNG GIAO DIỆN (FRONTEND SPA)                         │
│                                                                                  │
│   [index.html] ──► [src/main.tsx] ──► [src/App.tsx (Bộ điều phối trung tâm)]      │
│                                              │                                   │
│        ┌───────────────────┬─────────────────┼──────────────────┬──────────────┐ │
│        ▼                   ▼                 ▼                  ▼              ▼ │
│  [Header.tsx]      [RealCampusMap]   [AudioPlayerBar]   [POIDetailDrawer]  [Admin]│
│  (Ngôn ngữ, QR)    (Bản đồ Leaflet)  (Phát âm thanh)    (Nội dung chi tiết) Portal│
│        │                   ▲                 │                                 │ │
│        └─────────┬─────────┴─────────────────┼─────────────────────────────────┘ │
│                  ▼                           ▼                                   │
│        [hooks/useGPSTracker]     [utils/audioSpeech.ts]                          │
│        (Theo dõi GPS & Kalman)   (Xử lý âm thanh & TTS)                          │
└──────────────────┬───────────────────────────┬───────────────────────────────────┘
                   │ HTTP Fetch                │ HTTP Fetch (Dịch thuật AI, Stats)
                   ▼                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          TẦNG MÁY CHỦ HTTP (BACKEND API)                          │
│                                                                                  │
│   [server.ts] (Express Server Port 3000 + Tích hợp Vite Middlewares)              │
│       │                                                                          │
│       ▼ Gắn router `/api`                                                        │
│   [src/server/routes/api.ts] (Bộ định tuyến trung tâm)                           │
│       │                                                                          │
│       ├──► [controllers/poiController.ts]                                        │
│       ├──► [controllers/realDeviceController.ts]                                 │
│       ├──► [controllers/analyticsController.ts]                                  │
│       └──► [controllers/authController.ts]                                       │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ Gọi thực thi nghiệp vụ
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            TẦNG DỊCH VỤ (SERVICE LAYER)                           │
│                                                                                  │
│   ├── [services/poiService.ts]          ── Quản lý nghiệp vụ điểm chiêm bái      │
│   ├── [services/aiTranslationService.ts]── Gọi Google GenAI (Gemini 3.8 Flash)   │
│   ├── [services/gpsFilterService.ts]    ── Thuật toán Kalman Filter 2D           │
│   ├── [services/analyticsService.ts]    ── Phân tích lưu lượng & Deduplication   │
│   └── [services/authService.ts]         ── Xác thực mật khẩu & Token JWT         │
└──────────────────────────────────────┬───────────────────────────────────────────┘
                                       │ Gọi truy xuất dữ liệu
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                        TẦNG TRUY XUẤT DỮ LIỆU (DATA LAYER)                       │
│                                                                                  │
│   [repositories/poiRepository.ts] & [analyticsRepository.ts]                     │
│       │                                                                          │
│       ▼                                                                          │
│   [repositories/db.ts] (Bộ máy CSDL nhúng MongoDatabaseEngine)                   │
│       ├── Dữ liệu Seed: [repositories/seedPOIs.ts] (8 POI khởi tạo)              │
│       └── Kết nối từ xa: [repositories/mongoClient.ts] ──► [ MongoDB Atlas Cloud]│
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Luồng Dữ Liệu Hoạt Động Cốt Lõi (Lifecycle Flows)

#### Luồng 1: Người dùng bước vào khuôn viên chùa và kích hoạt Thuyết minh tự động
1. `useGPSTracker.ts` nhận sự kiện tọa độ từ GPS trình duyệt.
2. Dữ liệu thô `{lat, lng, accuracy}` được đưa qua `MobileGPSKalmanFilter` trong `gpsFilterService.ts` để loại bỏ nhiễu và làm mượt.
3. Tọa độ mượt được gửi về `App.tsx`. `App.tsx` gọi thuật toán Haversine (`src/utils/geo.ts`) đo khoảng cách tới 8 POI.
4. Khi khoảng cách tới POI gần nhất $\le$ bán kính geofence (ví dụ: Cổng Tam Quan 20m), hệ thống kích hoạt chuông thông báo và hiển thị Toast.
5. Nếu người dùng bật chế độ "Tự động phát", `audioSpeech.ts` (`speechEngine.speak`) được gọi với nội dung thuyết minh tương ứng.
6. `audioSpeech.ts` chia nhỏ văn bản thành các đoạn $\le 88$ ký tự, chọn giọng đọc tối ưu (ưu tiên giọng Apple trên iPhone hoặc Google trên Android) và phát qua loa.

#### Luồng 2: Khách yêu cầu thuyết minh bằng ngôn ngữ mới (Dịch thuật AI on-demand)
1. Trên giao diện `POIDetailDrawer.tsx`, khách chọn ngôn ngữ (ví dụ: tiếng Đức `de` hoặc tiếng Nhật `ja`).
2. Client gửi request `GET /api/pois/:id?lang=de` đến `poiController.ts`.
3. `poiController.ts` chuyển tiếp sang `poiService.ts` $\rightarrow$ `aiTranslationService.ts`.
4. `aiTranslationService.ts` kiểm tra nếu CSDL đã có bản dịch thì trả về ngay. Nếu chưa có, nó khởi tạo `@google/genai` gọi model `gemini-3.8-flash` với prompt chuyên sâu Phật học.
5. Gemini trả về JSON gồm Tiêu đề, Giới thiệu và Bài thuyết minh đã dịch.
6. Bản dịch mới được tự động lưu vào CSDL (`db.saveTranslation`) để tái sử dụng cho các khách tiếp theo mà không cần gọi lại AI.

#### Luồng 3: Giám sát Thiết Bị Thật (Chống dữ liệu ảo)
1. Khi `App.tsx` khởi tạo, nó gọi hàm `getBrowserFingerprint()` trong `fingerprint.ts` để tạo chuỗi băm phần cứng SHA-256 từ Canvas, Screen, Múi giờ, CPU.
2. Trình duyệt gửi thông số lên `POST /api/real-devices/access`.
3. `realDeviceController.ts` nhận diện User-Agent để phân loại dòng máy thực (iPhone 16, MacBook, Android, Windows) và lưu vào bảng `real_devices` trong `db.ts` (hoặc đồng bộ lên MongoDB Atlas).
4. Không tạo dữ liệu ảo; số đếm lượt truy cập trong ngày được cộng dồn theo thiết bị thực tế.

---

## PHẦN 2: BẢN ĐỒ CHI TIẾT TỪNG TẬP TIN TRONG BỘ MÃ NGUỒN

Dưới đây là chi tiết toàn bộ các file trong dự án, nhiệm vụ và nội dung code của từng file:

---

### I. CÁC TẬP TIN CẤU HÌNH VÀ KHỞI TẠO MÁY CHỦ (ROOT FILES)

#### 1. `/server.ts` (67 dòng)
- **Nhiệm vụ chính**: Điểm vào (entry point) của toàn bộ ứng dụng Full-Stack phía máy chủ.
- **Nội dung code**:
  - Khởi tạo Express app, nạp biến môi trường từ `.env` bằng `dotenv/config`.
  - Cấu hình body parser JSON (giới hạn 10MB) và urlencoded.
  - Gắn router API vào đường dẫn `/api` (`app.use('/api', apiRouter)`).
  - Phục vụ các file âm thanh MP3 tĩnh qua `/audio` (`public/audio`).
  - **Middleware xử lý lỗi CSDL (Database Offline Fallback)**: Bắt các lỗi `MongoNetworkError`, `MongooseError`, trả về JSON rỗng hoặc mã lỗi 503 một cách an toàn mà không làm sập tiến trình máy chủ.
  - Tích hợp Vite middleware ở chế độ phát triển (`createViteServer({ server: { middlewareMode: true } })`) hoặc phục vụ thư mục `dist/` khi ở production.
  - Lắng nghe tại cổng `3000` trên host `0.0.0.0`.
- **Phụ thuộc**: `express`, `vite`, `./src/server/routes/api.js`.

#### 2. `/package.json` (45 dòng)
- **Nhiệm vụ**: Khai báo phụ thuộc (dependencies), phiên bản thư viện và các kịch bản chạy lệnh (scripts).
- **Nội dung quan trọng**:
  - Script `"dev": "tsx server.ts"`: Chạy server Full-Stack qua `tsx` với TypeScript trực tiếp.
  - Script `"build": "vite build"`: Đóng gói giao diện React vào `dist/`.
  - Script `"test": "tsx test/backend.test.ts"`: Chạy bộ kiểm thử backend.
  - Dependencies chính: `@google/genai`, `express`, `leaflet`, `lucide-react`, `mongodb`, `motion`, `qrcode`, `react`, `react-dom`, `tsx`, `vite`.

#### 3. `/vite.config.ts` (26 dòng)
- **Nhiệm vụ**: Cấu hình build tool Vite và plugin Tailwind CSS.
- **Nội dung**: Tích hợp `@vitejs/plugin-react` và `@tailwindcss/vite`, tạo đường dẫn alias `@` trỏ về thư mục gốc, cấu hình port `3000` và kiểm soát HMR.

#### 4. `/tsconfig.json` (26 dòng)
- **Nhiệm vụ**: Cấu hình trình biên dịch TypeScript Compiler (Target ES2022, module ESNext, moduleResolution Bundler, JSX react-jsx).

#### 5. `/index.html` (24 dòng)
- **Nhiệm vụ**: Trang HTML đơn (Single Page HTML) gốc của ứng dụng.
- **Nội dung**: Khai báo thẻ meta SEO, OpenGraph tiếng Việt cho Việt Nam Quốc Tự, nạp Google Fonts ('Be Vietnam Pro' và 'Playfair Display') và file CSS Leaflet.

#### 6. `/.env.example` (4 dòng)
- **Nhiệm vụ**: File mẫu khai báo các biến môi trường cần thiết: `AUTH_SECRET`, `MONGODB_DB_NAME`, `MONGODB_URI`, `GEMINI_API_KEY`.

---

### II. GIAO DIỆN NGƯỜI DÙNG (SRC - FRONTEND)

#### 7. `/src/main.tsx` (8 dòng)
- **Nhiệm vụ**: Khởi động React DOM, gắn component `<App />` vào phần tử `<div id="root">`. Nạp `index.css` và `leaflet/dist/leaflet.css`.

#### 8. `/src/index.css` (38 dòng)
- **Nhiệm vụ**: Định dạng giao diện toàn cầu với `@import "tailwindcss";`.
- **Nội dung**: Thiết lập font chữ chủ đạo `Be Vietnam Pro`, font tiêu đề `Playfair Display`, các lớp ẩn thanh cuộn `no-scrollbar`, và style tùy biến cho Marker bản đồ Leaflet.

#### 9. `/src/App.tsx` (1,150 dòng)
- **Nhiệm vụ**: Component mẹ (Master Orchestrator) quản lý toàn bộ trạng thái và hiển thị của ứng dụng phía Client.
- **Nội dung code**:
  - Quản lý 3 Tab giao diện chính:
    1. Tab **Khám Phá (`explore`)**: Danh sách 8 điểm chiêm bái với hình ảnh đẹp, trạng thái đã xem/chưa xem, bộ lọc danh mục và thanh tìm kiếm.
    2. Tab **Hành Trình (`itinerary`)**: Lộ trình tham quan tối ưu theo thứ tự từ Cổng Tam Quan qua Chính Điện đến Nhà Hậu Tổ.
    3. Tab **Bản Đồ (`map`)**: Bản đồ định vị tương tác thời gian thực và thẻ hành hương điện tử (Pilgrim Boarding Pass).
  - Quản lý trạng thái Audio: đang phát, tạm dừng, thời gian chạy, thời lượng.
  - Tích hợp hook GPS `useGPSTracker` và tính toán Geofence cảnh báo khi đến gần một điểm chiêm bái.
  - Điều khiển các Modal: Welcome Modal, QR Scanner Modal, Voice Selector Modal, POI Detail Drawer, Admin Portal.
  - Đồng bộ trạng thái URL (`?view=admin` hoặc `?poi=VNQT-TAM-QUAN`).

---

### III. CÁC COMPONENT GIAO DIỆN (SRC/COMPONENTS)

#### 10. `/src/components/Header.tsx` (160 dòng)
- **Nhiệm vụ**: Thanh tiêu đề phía trên cùng của ứng dụng di động.
- **Nội dung**: Logo Việt Nam Quốc Tự mạ vàng, nút chuyển đổi nhanh 12 ngôn ngữ (dropdown cờ quốc gia), nút mở trình quét QR, nút cài đặt giọng đọc, và nút ẩn để vào trang quản trị Admin.

#### 11. `/src/components/RealCampusMap.tsx` (240 dòng)
- **Nhiệm vụ**: Bản đồ tương tác khuôn viên chùa xây dựng trên thư viện Leaflet.
- **Nội dung**:
  - Tự động cố định vùng hiển thị (Max Bounds) trong phạm vi khuôn viên Việt Nam Quốc Tự (Quận 10).
  - Vẽ ranh giới địa lý khuôn viên chùa (Polygon đường nét đứt màu xanh ngọc).
  - Hiển thị 8 Marker điểm chiêm bái bằng Icon SVG chuyên biệt kèm bán kính Geofence.
  - Hiển thị Marker vị trí thực tế của khách hành hương (chấm tròn xanh có sóng xung kích và hướng la bàn la bàn xoay theo góc đi).
  - Popup xem nhanh thông tin POI và nút kích hoạt nghe thuyết minh trực tiếp từ bản đồ.

#### 12. `/src/components/CampusMap.tsx` (180 dòng)
- **Nhiệm vụ**: Component bản đồ sơ đồ đồ họa minh họa thay thế dạng SVG dành cho các thiết bị không hỗ trợ WebGL hoặc khi mất kết nối mạng.

#### 13. `/src/components/AudioPlayerBar.tsx` (210 dòng)
- **Nhiệm vụ**: Thanh trình phát âm thanh cố định ở đáy màn hình điện thoại (Sticky Audio Bar).
- **Nội dung**:
  - Hiển thị tiêu đề điểm đang phát thuyết minh và trạng thái giọng đọc.
  - Nút Play/Pause, nút tua lùi 10s, tua tới 10s.
  - Thanh trượt tiến trình (Seek bar slider) cho phép người dùng kéo thả thời gian phát.
  - Nút bấm mở nhanh hộp thoại chọn giọng đọc (`VoiceSelectorModal`).

#### 14. `/src/components/POIDetailDrawer.tsx` (320 dòng)
- **Nhiệm vụ**: Bảng chi tiết điểm chiêm bái trượt từ dưới lên (Bottom Sheet Drawer).
- **Nội dung**:
  - Carousel hình ảnh sắc nét của di tích.
  - Cấu trúc 4 phần chuẩn: Tiêu đề tôn kính, Đoạn giới thiệu tóm tắt (Lead), Bài thuyết minh lịch sử - kiến trúc - tâm linh chi tiết, và Trình phát âm thanh.
  - Nút kích hoạt Dịch thuật AI tức thì nếu khách chọn xem ngôn ngữ mới.
  - Thông số kỹ thuật của POI: Tọa độ GPS, bán kính kích hoạt tự động, loại công trình.

#### 15. `/src/components/VoiceSelectorModal.tsx` (220 dòng)
- **Nhiệm vụ**: Hộp thoại cấu hình và cá nhân hóa giọng đọc thuyết minh.
- **Nội dung**:
  - Cho phép chọn giữa 5 phong cách giọng: Chị Google, AI Neural Cloud, Microsoft Hoài My, Giọng Truyền Cảm, Giọng Bản Địa.
  - Thanh trượt điều chỉnh Tốc độ đọc (Speed Rate: 0.8x - 1.3x) và Độ cao giọng (Pitch).
  - Nút "Nghe thử" (`testVoice`) đọc thử một câu kinh Phật để người dùng kiểm tra chất lượng giọng trước khi áp dụng.

#### 16. `/src/components/QRScannerModal.tsx` (140 dòng)
- **Nhiệm vụ**: Hộp thoại quét mã QR tại các bảng đồng gắn trước các điện thờ.
- **Nội dung**: Khung quét mô phỏng camera điện thoại và ô nhập mã nhanh (như `VNQT-TAM-QUAN`, `VNQT-CHINH-DIEN`) để mở thẳng bài thuyết minh tương ứng.

#### 17. `/src/components/WelcomeModal.tsx` (110 dòng)
- **Nhiệm vụ**: Hộp thoại chào đón khách khi lần đầu truy cập hệ thống.
- **Nội dung**: Giới thiệu chùa Việt Nam Quốc Tự, yêu cầu người dùng chọn ngôn ngữ mong muốn, cấp quyền truy cập vị trí GPS, và kích hoạt âm thanh (Unmute Audio) để vượt qua rào cản chặn Autoplay của trình duyệt.

#### 18. `/src/components/AdminPortal.tsx` (650 dòng)
- **Nhiệm vụ**: Trung tâm điều hành quản trị dành cho Ban Trị Sự chùa.
- **Nội dung**:
  - Xác thực đăng nhập tài khoản quản trị (`admin` / `vnqt@2026`).
  - **Quản lý POI (CMS)**: Xem danh sách, tìm kiếm, thêm mới POI, sửa tọa độ, upload URL hình ảnh, xóa điểm chiêm bái.
  - **Quản lý Thiết Bị Thật (`real_devices`)**: Bảng thống kê chi tiết từng thiết bị thực tế đang truy cập (IP, hệ điều hành, trình duyệt, độ phân giải, số lần ghé thăm), chức năng Khóa/Mở khóa thiết bị, Xóa thiết bị khỏi MongoDB.
  - **Biểu đồ Thống kê**: Biểu đồ phân tích lượng khách theo ngày, tháng, năm; tỷ lệ các ngôn ngữ được sử dụng nhiều nhất.

#### 19. `/src/components/AdminPOIMapPicker.tsx` (130 dòng)
- **Nhiệm vụ**: Bản đồ vệ tinh thu nhỏ tích hợp bên trong Form chỉnh sửa POI của Admin, cho phép quản trị viên click chuột hoặc kéo thả Marker để lấy chính xác kinh độ - vĩ độ thực tế.

---

### IV. HOOKS VÀ TIỆN ÍCH (SRC/HOOKS & SRC/UTILS)

#### 20. `/src/hooks/useGPSTracker.ts` (190 dòng)
- **Nhiệm vụ**: Hook tùy biến của React quản lý toàn bộ vòng đời định vị của thiết bị.
- **Nội dung**:
  - Gọi `navigator.geolocation.watchPosition` với các tùy chọn `enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 0`.
  - Đưa dữ liệu qua `MobileGPSKalmanFilter` để tính toán tọa độ mịn.
  - Cung cấp chế độ giả lập bước đi (Simulation Mode) giúp lập trình viên kiểm thử tính năng Geofence ngay trên máy tính bàn mà không cần phải ra thực địa tại chùa.

#### 21. `/src/utils/audioSpeech.ts` (1,007 dòng)
- **Nhiệm vụ**: Trái tim của hệ thống âm thanh thuyết minh di động.
- **Nội dung cốt lõi**:
  - `splitTextIntoSentences(text, maxLen = 88)`: Cắt văn bản dài thành các mệnh đề ngắn dưới 88 ký tự theo dấu câu tự nhiên, triệt tiêu lỗi đánh vần chữ và lỗi 15s của iOS WebKit.
  - `isApplePlatform()`: Kiểm tra chính xác xem khách có đang dùng iPhone, iPad hay Mac không.
  - `AudioSpeechEngine.pickVoiceForEngine()`: Bộ lọc chọn giọng nói thông minh; trên thiết bị Apple tự động ưu tiên giọng `Linh`, `Mai` (Enhanced/Premium).
  - Bộ bảo vệ chống méo tiếng Apple (Distortion Shield): Ép cứng `pitch = 1.0` và `rate` trong khoảng an toàn `[0.95 - 1.05]`.
  - Hỗ trợ đầy đủ các hàm điều khiển: `playNarration`, `pause`, `resume`, `stop`, `seekTo`, `rewind`, `forward`.

#### 22. `/src/utils/geo.ts` (85 dòng)
- **Nhiệm vụ**: Thư viện tính toán không gian địa lý WGS84.
- **Nội dung**:
  - `calculateHaversineDistance(lat1, lon1, lat2, lon2)`: Tính khoảng cách chính xác theo mét giữa 2 điểm trên mặt cầu Trái Đất.
  - `calculateBearing(lat1, lon1, lat2, lon2)`: Tính góc la bàn hướng di chuyển (0 - 360 độ).

#### 23. `/src/utils/fingerprint.ts` (60 dòng)
- **Nhiệm vụ**: Tạo mã định danh phần cứng ẩn danh (Hardware Fingerprint) cho thiết bị duyệt web.
- **Nội dung**: Thu thập thông số Canvas render, độ phân giải màn hình, timezone, ngôn ngữ hệ điều hành, băm thành chuỗi định danh SHA-256 (`fp_...`) để chống gian lận lượt view.

#### 24. `/src/utils/audioSynth.ts` (62 dòng)
- **Nhiệm vụ**: Trình tổng hợp sóng âm chuông chùa viết bằng TypeScript thuần.
- **Nội dung**: Tạo Buffer nhị phân file WAV 16-bit PCM với 4 họa âm vật lý của chuông đồng (Fundamental 1.0, Strike Tone 2.76, High Shimmer 5.40, Metallic Overtone 8.90).

#### 25. `/src/utils/cryptoUtils.ts` (45 dòng)
- **Nhiệm vụ**: Tiện ích băm mật khẩu quản trị viên và sinh token xác thực an toàn.

#### 26. `/src/translations/index.ts` (480 dòng)
- **Nhiệm vụ**: Từ điển giao diện đa ngôn ngữ (UI Localization) cho 12 ngôn ngữ: Tiếng Việt, Anh, Trung, Nhật, Hàn, Pháp, Đức, Tây Ban Nha, Nga, Thái, Indonesia, Ý.

---

### V. TẦNG MÁY CHỦ VÀ DỊCH VỤ (SRC/SERVER)

#### 27. `/src/server/types.ts` (210 dòng)
- **Nhiệm vụ**: Định nghĩa cấu trúc kiểu dữ liệu toàn bộ hệ thống (`Campus`, `POIEntity`, `POITranslation`, `POIMedia`, `RichPOI`, `RealDeviceEntity`, `PilgrimageStats`,...).

#### 28. `/src/server/routes/api.ts` (140 dòng)
- **Nhiệm vụ**: Định tuyến toàn bộ các yêu cầu HTTP API phía máy chủ:
  - `GET /api/pois`, `GET /api/pois/:id`, `GET /api/pois/nearby`, `POST/PUT/DELETE /api/pois`
  - `POST /api/real-devices/access`, `POST /api/real-devices/login`, `GET /api/real-devices`
  - `POST /api/auth/login`, `GET /api/auth/verify`
  - `GET /api/analytics/stats`, `POST /api/analytics/checkin`

#### 29. `/src/server/controllers/poiController.ts` (120 dòng)
- **Nhiệm vụ**: Tiếp nhận request HTTP về POI, gọi service xử lý và trả về JSON chuẩn. Tích hợp tự động kích hoạt dịch thuật AI nếu có yêu cầu ngôn ngữ lạ.

#### 30. `/src/server/controllers/realDeviceController.ts` (95 dòng)
- **Nhiệm vụ**: Xử lý ghi nhận thiết bị thực, truy vấn danh sách thiết bị có phân trang và bộ lọc, khóa/mở khóa thiết bị trong MongoDB.

#### 31. `/src/server/controllers/analyticsController.ts` (80 dòng)
- **Nhiệm vụ**: Xử lý check-in thiết bị theo ngày, tổng hợp số liệu thống kê khách hành hương.

#### 32. `/src/server/controllers/authController.ts` (60 dòng)
- **Nhiệm vụ**: Xử lý đăng nhập tài khoản quản trị, kiểm tra mật khẩu băm và cấp token.

#### 33. `/src/server/services/poiService.ts` (75 dòng)
- **Nhiệm vụ**: Tầng nghiệp vụ POI, thực hiện kết hợp bản dịch, media và tính khoảng cách gần nhất.

#### 34. `/src/server/services/aiTranslationService.ts` (145 dòng)
- **Nhiệm vụ**: Tích hợp SDK `@google/genai` gọi mô hình `gemini-3.8-flash` để dịch bài thuyết minh sang 12 thứ tiếng với phong cách tôn kính Phật giáo, xuất định dạng JSON.

#### 35. `/src/server/services/gpsFilterService.ts` (148 dòng)
- **Nhiệm vụ**: Cài đặt giải thuật **Bộ lọc Kalman 2D (MobileGPSKalmanFilter)**:
  - Ước lượng ma trận sai số tọa độ.
  - Cơ chế cổng loại bỏ điểm nhảy cóc (Outlier Gating Rejection: từ chối các bước nhảy vận tốc pedestrian $> 7$ m/s với sai số accuracy $> 20$m).
  - Làm mịn góc xoay la bàn (`smoothAngle`).

#### 36. `/src/server/services/analyticsService.ts` (65 dòng)
- **Nhiệm vụ**: Nghiệp vụ kiểm tra trùng lặp thiết bị trong ngày (chỉ tính 1 thiết bị duy nhất trong 24 giờ).

#### 37. `/src/server/services/authService.ts` (55 dòng)
- **Nhiệm vụ**: Nghiệp vụ kiểm tra thông tin đăng nhập admin và sinh chữ ký phiên làm việc.

#### 38. `/src/server/repositories/db.ts` (841 dòng)
- **Nhiệm vụ**: Trọng tâm của tầng dữ liệu - Lớp `MongoDatabaseEngine`:
  - Quản lý các bộ nhớ BSON nhúng (`campuses`, `pois`, `translations`, `media`, `realDevices`).
  - Nạp dữ liệu khởi tạo từ `seedPOIs.ts`.
  - Tự động đồng bộ 2 chiều với cụm MongoDB Atlas từ xa thông qua `mongoManager`.
  - Đảm bảo hệ thống hoạt động 100% trơn tru ngay cả khi không có kết nối Internet đến MongoDB ngoài.

#### 39. `/src/server/repositories/mongoClient.ts` (115 dòng)
- **Nhiệm vụ**: Quản trị kết nối thực tế tới cụm MongoDB Atlas qua thư viện chính thức `mongodb`. Khởi tạo chỉ mục không gian `2dsphere` cho tọa độ địa lý của POI.

#### 40. `/src/server/repositories/seedPOIs.ts` (320 dòng)
- **Nhiệm vụ**: Bộ dữ liệu hạt giống (Seed Data) chuẩn xác của 8 điểm chiêm bái tại Việt Nam Quốc Tự:
  1. Cổng Tam Quan & Quảng Trường Đài Sen
  2. Đại Hùng Bửu Điện (Chính Điện)
  3. Bảo Tháp Đa Bảo 13 Tầng (Nơi tôn thờ Xá lợi Trái tim Bồ Tát Thích Quảng Đức)
  4. Quả Đại Hồng Chung 3 Tấn
  5. Tôn Tượng Bồ Tát Quán Thế Âm Lộ Thiên
  6. Vườn Bồ Đề Lâm Tỳ Ni & Hồ Sen An Lạc
  7. Nhà Hậu Tổ & Điện Thờ Chư Tôn Đức Tiền Bối
  8. Nhà Lưu Niệm & Trưng Bày Lịch Sử Giáo Hội

---

### VI. SCRIPTS, KIỂM THỬ VÀ TẬP TIN BỔ TRỢ

#### 41. `/test/backend.test.ts` (151 dòng)
- **Nhiệm vụ**: Kịch bản kiểm thử tích hợp tự động (CI/CD test runner). Kiểm tra công thức Haversine, truy vấn POI không gian GeoJSON, xác thực đăng nhập Admin, bộ lọc Kalman, và bảng MongoDB `real_devices`.

#### 42. `/scripts/seed-mongo.ts` (85 dòng)
- **Nhiệm vụ**: Script độc lập để đẩy toàn bộ 8 POI và bản dịch vào cụm MongoDB Atlas thực tế qua biến `MONGODB_URI`.

#### 43. `/scripts/generate-mp3-audio.py` (129 dòng)
- **Nhiệm vụ**: Script Python đã sử dụng để tạo 96 file âm thanh chuông `.mp3` trong thư mục `public/audio/`.

#### 44. `/python/spatial_ai_service.py` (150 dòng)
- **Nhiệm vụ**: Micro-engine Python độc lập (tính Haversine & tổng hợp sóng chuông WAV) - thành phần cũ được giữ lại phục vụ chạy test.

---

## TỔNG KẾT BẢN ĐỒ KIẾN TRÚC

| Tầng kiến trúc | Thành phần đại diện | Nhiệm vụ chính |
| :--- | :--- | :--- |
| **Giao diện (Frontend)** | `App.tsx`, `RealCampusMap.tsx`, `POIDetailDrawer.tsx` | Trình diễn bản đồ, phát âm thanh, hiển thị bài học lịch sử, tiếp nhận tương tác người dùng |
| **Âm thanh & Định vị** | `audioSpeech.ts`, `useGPSTracker.ts`, `gpsFilterService.ts` | Thu nhận GPS, lọc Kalman, ngắt mệnh đề, phát giọng đọc tiếng Việt mượt mà |
| **Điều phối (Server & API)**| `server.ts`, `api.ts`, `poiController.ts`, `realDeviceController.ts` | Định tuyến HTTP, kiểm soát phiên làm việc, tích hợp Vite server |
| **Trí tuệ nhân tạo (AI)** | `aiTranslationService.ts` (Gemini 3.8 Flash) | Tự động dịch thuật nội dung bài thuyết minh sang 12 thứ tiếng chuẩn Phật học |
| **Dữ liệu (Data Layer)** | `db.ts`, `mongoClient.ts`, `seedPOIs.ts` | Lưu trữ kép (Embedded In-memory + MongoDB Atlas Cloud), chỉ mục không gian `2dsphere` |
