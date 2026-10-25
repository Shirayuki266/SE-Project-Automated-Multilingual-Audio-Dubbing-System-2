# ☸️ Hệ Thống Thuyết Minh Tự Động & Hướng Dẫn Chiêm Bái Việt Nam Quốc Tự
### *Vietnam Quoc Tu Pagoda - Smart Multilingual Audio Guide System*

> **DỰ ÁN VĂN HÓA PHẬT GIÁO PHI LỢI NHUẬN (NON-PROFIT PUBLIC PILGRIMAGE GUIDE)**  
> Ứng dụng phục vụ hoàn toàn **miễn phí 100%** cho chư tôn đức Tăng Ni, đồng bào Phật tử và du khách thập phương trong & ngoài nước khi đến chiêm bái **Việt Nam Quốc Tự** (244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh). Ứng dụng không thu phí, không thương mại hóa và không hiển thị quảng cáo.

---

## 📖 Mục Lục
1. [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [Các Tính Năng Nổi Bật](#-các-tính-năng-nổi-bật)
3. [Công Nghệ & Kiến Trúc Hệ Thống](#-công-nghệ--kiến-trúc-hệ-thống)
4. [Cổng Quản Trị Hệ Thống (Admin Portal)](#-cổng-quản-trị-hệ-thống-admin-portal)
5. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
6. [Quy Trình CI/CD & Triển Khai](#-quy-trình-cicd--triển-khai)
7. [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
8. [Tích Hợp Cơ Sở Dữ Liệu MongoDB & Atlas](#-tích-hợp-cơ-sở-dữ-liệu-mongodb--atlas)
9. [Bản Quyền & Giấy Phép](#-bản-quyền--giấy-phép)

---

## 🌸 Giới Thiệu Tổng Quan

**Việt Nam Quốc Tự** là trung tâm hành chính, văn hóa và tâm linh tiêu biểu của Phật giáo TP. Hồ Chí Minh. Nhằm tạo điều kiện thuận duyên cho khách hành hương tiếp cận nguồn tư liệu lịch sử, kiến trúc và giá trị tâm linh một cách chuẩn xác, hệ thống **Thuyết Minh Tự Động Đa Ngôn Ngữ** được xây dựng kết hợp công nghệ định vị không gian địa lý (GPS Geofencing), tổng hợp giọng đọc AI và bản đồ số tương tác.

Du khách chỉ cần sử dụng điện thoại thông minh kết nối mạng để tự do chiêm bái; khi tiến lại gần các công trình thiêng liêng, hệ thống sẽ tự động kích hoạt bài thuyết minh tương ứng bằng ngôn ngữ mẹ đẻ của du khách.

---

## ✨ Các Tính Năng Nổi Bật

### 1. Định Vị GPS & Cảm Biến Vùng Không Gian (Geofencing)
- **Tự động nhận diện công trình**: Bán kính cảm biến được tinh chỉnh từ **15m – 30m** cho từng điểm di tích (Cổng Tam Quan, Đại Hùng Bửu Điện, Bảo Tháp 13 Tầng, Đại Hồng Chung, Tôn Tượng Quán Thế Âm, Vườn Bồ Đề, Nhà Hậu Tổ, Nhà Lưu Niệm).
- **Bộ lọc GPS Kalman**: Giảm nhiễu sóng phản xạ từ các công trình cao tầng, định vị mượt mà khi di chuyển trong khuôn viên chùa.
- **Tùy chọn tự động thông minh**: Người dùng chủ động bật/tắt chế độ tự động đọc khi bước vào vùng cảm biến.

### 2. Bản Đồ Khuôn Viên Tương Tác Đa Chế Độ
- **2 chế độ xem thực tế**:
  - **Bản đồ Đường phố (Street Map)**: Hiển thị giao thông, tên đường Ba Tháng Hai và ngõ ngách xung quanh Quận 10.
  - **Bản đồ Vệ tinh (Satellite Map)**: Ảnh chụp vệ tinh quang học độ nét cao toàn cảnh kiến trúc mái chùa, sân Đại Lễ và Bảo Tháp.
- **Chỉ dẫn lối đi hành hương & tiện ích**: Hiển thị đường dạo tâm linh kết nối 8 điểm di tích cùng các tiện ích thiết thực (khu gửi xe, nhà tiếp tân, khu vệ sinh & nước uống miễn phí).

### 3. Đa Ngôn Ngữ Toàn Diện (12 Quốc Gia)
- Hỗ trợ đầy đủ **12 ngôn ngữ quốc tế**:
  - 🇻🇳 Tiếng Việt *(Gốc)*
  - 🇬🇧 English
  - 🇨🇳 中文 (Chinese)
  - 🇯🇵 日本語 (Japanese)
  - 🇰🇷 한국어 (Korean)
  - 🇫🇷 Français (French)
  - 🇩🇪 Deutsch (German)
  - 🇪🇸 Español (Spanish)
  - 🇷🇺 Русский (Russian)
  - 🇹🇭 ไทย (Thai)
  - 🇮🇩 Bahasa Indonesia
  - 🇮🇹 Italiano (Italian)
- **Bảo tồn danh từ thiêng liêng**: Tên các danh xưng thiêng liêng của Việt Nam (*Việt Nam Quốc Tự*, *Đại Hùng Bửu Điện*, *Bồ Tát Thích Quảng Đức*, *Đại Hồng Chung*...) luôn được gìn giữ trang nghiêm khi chuyển ngữ.

### 4. Động Cơ Giọng Đọc Đa Dạng (5 Voice Engines)
- Du khách và Quản trị viên có thể lựa chọn phong thái đọc phù hợp:
  1. **Chị Google**: Giọng đọc tự nhiên, quen thuộc, phát âm chuẩn tiếng Việt.
  2. **Google Cloud TTS**: Ngữ điệu thông minh chuẩn AI Neural, trầm ấm trang nghiêm.
  3. **Bing (Microsoft Edge)**: Giọng đọc mượt mà phong cách Hoài My / Nam Minh.
  4. **Giọng đọc TikTok**: Nhịp điệu thuyết minh hiện đại, lôi cuốn.
  5. **Giọng trình duyệt**: Tận dụng bộ tổng hợp giọng nói tích hợp sẵn của thiết bị.
- Tùy chỉnh thanh trượt **Tốc độ đọc (0.75x – 1.30x)** và **Độ cao giọng (Pitch 0.8 – 1.3)** có nghe thử trực tiếp.

### 5. Quét Mã QR & Tem Chiêm Bái
- Quét mã QR dán tại từng điểm di tích để lập tức mở đúng bài thuyết minh của công trình đó.
- Tính năng in tem QR trực tiếp từ giao diện Admin theo khuôn mẫu trang nghiêm.

---

## 🏛️ Cổng Quản Trị Hệ Thống (Admin Portal)

Giao diện Quản trị được thiết kế đồng bộ với phong cách thiền trà, thanh tịnh của ứng dụng du khách (`#f7f9f6`, viền bo tròn mềm mại, thẻ trắng trang nhã, điểm nhấn xanh lá `#2d5a37`), bao gồm **4 phân hệ cốt lõi**:

1. **📊 Dashboard (Tổng Quan Hoạt Động)**:
   - Thống kê thời gian thực: Lượt khách chiêm bái hôm nay, số thiết bị thực tế, 8 điểm POIs, 12 ngôn ngữ.
   - Giám sát sức khỏe hạ tầng: Web Speech API, Gemini AI Dịch thuật, Hệ thống Geofencing GPS.
2. **📍 Quản Lý POIs (POIs Management)**:
   - Danh sách thẻ công trình hiển thị ảnh thực tế, mã POI, tọa độ GPS, bán kính cảm biến.
   - **Thêm điểm chiêm bái mới với 2 chế độ linh hoạt**:
     - *Chế độ 1: Chọn trực quan trên bản đồ* (Nhấp chuột hoặc kéo thả ghim đỏ trên bản đồ chùa, xem trước vòng tròn Geofence, có nút lấy tọa độ GPS thực tế).
     - *Chế độ 2: Nhập số liệu thủ công* (Kinh độ, Vĩ độ, Bán kính).
3. **🎙️ Quản Lý Audio & Cấu Hình Mặc Định**:
   - Cài đặt giọng đọc mặc định toàn ứng dụng cho khách tham quan mới.
   - Trình nghe thử audio 8 điểm POI theo 12 thứ tiếng.
   - **Thanh trạng thái và nút tắt âm thanh nổi bật**: Luôn hiển thị tên bài đang đọc trên Header và thanh nổi chân trang kèm nút bấm màu đỏ **"Tắt Audio"** tức thì.
4. **📝 Quản Lý Bài Viết Ở POIs (Articles & Multilingual Editor)**:
   - Trình soạn thảo văn bản thuyết minh chi tiết cho từng công trình.
   - Chuyển đổi nhanh 12 thứ tiếng, đếm số từ và ước tính thời gian nghe.
   - Nút **"✨ Dịch Bằng Gemini AI"** tự động chuyển ngữ bài viết chuẩn ngữ cảnh Phật giáo.

> **Thông tin đăng nhập Admin**:
> - Đường dẫn: Bấm vào biểu tượng **🔒** ở góc phải Header, hoặc qua URL `?admin=login`
> - Tài khoản: `admin`
> - Mật khẩu: `vnqt@2026`

---

## 🛠️ Công Nghệ & Kiến Trúc Hệ Thống

Dự án được xây dựng theo chuẩn Full-Stack hiện đại với kiến trúc phân tầng (Clean 3-Tier Layered Architecture), tối ưu hóa cho thiết bị di động, đảm bảo tốc độ phản hồi dưới 50ms, khả năng hoạt động ngoại tuyến linh hoạt và bảo mật cao.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      GIAO DIỆN NGƯỜI DÙNG (FRONTEND)                   │
│    React 19 • TypeScript • Tailwind CSS v4 • Leaflet GIS • Motion     │
│    ├── Trang Chiêm Bái Du Khách (Khám phá, Lộ trình, Bản đồ GPS)       │
│    └── Cổng Quản Trị Hệ Thống (Quản lý POIs, Soạn thảo bài, Thống kê) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST APIs & Web Speech Audio
┌───────────────────────────────────▼────────────────────────────────────┐
│                    MÁY CHỦ ỨNG DỤNG (NODE.JS EXPRESS)                  │
│    Runtime: Node.js 22 LTS • TypeScript Engine: tsx • Express 4.21     │
│    ├── Controllers: AuthController • POIController • AnalyticsCtrl     │
│    ├── Services: POIService • AI Translation • GPS Kalman Filter       │
│    └── Audio Engine: Native 16-bit PCM WAV Synthesizer                 │
└─────────────┬──────────────────────────────┬───────────────────────────┘
              │                              │
┌─────────────▼──────────────┐ ┌─────────────▼──────────────────────────┐
│   TRÍ TUỆ NHÂN TẠO (AI)    │ │        CƠ SỞ DỮ LIỆU & LƯU TRỮ         │
│ Google Gen AI SDK v2.4.0   │ │ MongoDB v7.7 Driver • 2dsphere GeoJSON │
│ Gemini 2.5/3.8 Flash       │ │ In-Memory Fallback Engine              │
│ Dịch ngữ cảnh Phật giáo    │ │ 6 BSON Collections • LocalStorage Sync │
└────────────────────────────┘ └────────────────────────────────────────┘
              │                              │
┌─────────────▼──────────────┐ ┌─────────────▼──────────────────────────┐
│  SPATIAL COMPUTING PYTHON  │ │           DEVOPS & TRIỂN KHAI          │
│ Python 3.9+ Microservice   │ │ Docker & Docker Compose • CI/CD Actions│
│ Vincenty & Haversine Math  │ │ Zero-Downtime Shell • Node Test Runner │
└────────────────────────────┘ └────────────────────────────────────────┘
```

---

### 1. Công Nghệ Giao Diện (Frontend & Client-Side)
- **Framework & Ngôn ngữ**:
  - **React 19** (`react`, `react-dom`): Phiên bản React mới nhất với hiệu năng vượt trội, tối ưu hóa quá trình hydrate và render component.
  - **TypeScript 7.x**: Hệ thống định kiểu tĩnh nghiêm ngặt (`strict: true`), bảo đảm an toàn dữ liệu từ backend đến giao diện.
  - **Vite 8** (`vite`, `@vitejs/plugin-react`): Trình bundler thế hệ mới với tốc độ khởi động cực nhanh và cơ chế Hot Module Replacement (HMR).
- **Thiết kế & Giao diện (UI/UX)**:
  - **Tailwind CSS v4** (`@tailwindcss/vite`): Phiên bản engine mới nhất với cấu hình `@import "tailwindcss";`, áp dụng triết lý thiết kế Thiền trà & Phật giáo Á Đông (*Zen Buddhist Aesthetics*), phối màu trang nhã (Xanh ngọc thiền `#2d5a37`, nền giấy lụa `#f7f9f6`, vàng đồng hoàng kim, nâu gỗ cổ tự).
  - **Lucide React** (`lucide-react`): Bộ biểu tượng vector sắc nét, đồng bộ cho mọi thao tác bản đồ, âm thanh, la bàn và quản trị.
  - **Framer Motion** (`motion`): Thư viện diễn hoạt mượt mà cho các hiệu ứng trượt mở Bottom Drawer, thông báo Geofence Toast và chuyển đổi tab.
- **Bản đồ số & Không gian địa lý (GIS Interactive Map)**:
  - **Leaflet 1.9** (`leaflet`, `@types/leaflet`): Thư viện bản đồ tương tác mã nguồn mở tối ưu cho di động.
  - **Đa tầng bản đồ (Multi-Layer Map Tiles)**:
    - *Bản đồ đường phố*: Tích hợp OpenStreetMap Standard Tiles hiển thị chi tiết tên đường Ba Tháng Hai, ngõ vào và cảnh quan Quận 10.
    - *Bản đồ vệ tinh*: Tích hợp Esri World Imagery Satellite Tiles độ phân giải cao, hiển thị rõ mái chùa, sân Đại Lễ và Bảo Tháp 13 Tầng.
  - **Phần tử đồ họa bản đồ**: Ghim SVG tùy biến theo trạng thái (Đang xem, Đã xem, Chưa xem), vòng tròn bán kính cảm biến Geofence động (15m – 30m), vệt đường dẫn lộ trình hành hương Polyline.
- **Mã vạch QR & Tiện ích hỗ trợ**:
  - **QRCode Generator** (`qrcode`): Tạo mã QR SVG/Canvas trực tiếp trên trình duyệt phục vụ in tem chiêm bái tại Cổng Quản Trị.
  - **QR Code Scanner**: Trình đọc mã QR thời gian thực thông qua camera thiết bị của du khách, tự động nhận diện mã công trình và chuyển hướng bài thuyết minh.
  - **Browser Fingerprinting** (`src/utils/fingerprint.ts`): Thuật toán băm vô danh (Canvas Hash, WebGL Vendor, User Agent, Múi giờ) thống kê lượng khách viếng thăm trung thực mà không xâm phạm quyền riêng tư hoặc lưu cookie.

---

### 2. Động Cơ Âm Thanh & Giọng Đọc Đa Ngôn Ngữ (Audio & Speech Engine)
- **Web Speech Synthesis API**:
  - Phát âm thanh thuyết minh trực tiếp trên phần cứng thiết bị của người dùng, không phụ thuộc vào kết nối mạng khi đọc, độ trễ bằng **0ms** và không tốn chi phí băng thông máy chủ.
- **5 Hệ Thống Giọng Đọc (Voice Engines)**:
  - *Chị Google*: Giọng đọc phổ thông, tự nhiên, gần gũi với người Việt.
  - *Google Cloud TTS*: Âm hưởng thông minh chuẩn Neural AI, trầm ấm, thanh tịnh.
  - *Microsoft Edge / Bing*: Giọng điệu mượt mà, phong thái Hoài My / Nam Minh.
  - *TikTok Voice*: Phong cách hiện đại, giàu năng lượng truyền cảm.
  - *Giọng hệ thống / Trình duyệt*: Tự động thích ứng với giọng đọc bản địa của từng hệ điều hành (iOS Safari, Android Chrome, Windows, macOS).
- **Bộ điều khiển âm thanh toàn diện (`speechEngine`)**:
  - Tự động đồng bộ cấu trúc bài thuyết minh: **Tiêu đề → Giới thiệu → Thuyết minh chi tiết**.
  - Thanh phát âm thanh chân trang: Nút Phát / Tạm dừng, tua lùi 10s (`-10s`), tua tiến 10s (`+10s`), thanh kéo tiến trình (Seekbar), đếm ngược thời lượng.
  - Tùy chỉnh tốc độ đọc (`0.75x` đến `1.30x`) và cao độ giọng (`0.8` đến `1.3`).
  - **Nút tắt âm thanh khẩn cấp (Emergency Audio Mute)**: Bố trí nổi bật trên thanh tiêu đề và thanh điều khiển để lập tức ngắt âm thanh khi bước vào chốn trang nghiêm.
- **Bộ tổng hợp âm thanh chuông chùa thuần Node.js (`src/utils/audioSynth.ts`)**:
  - Tự động tạo luồng sóng âm 16-bit PCM Stereo WAV tần số thấp (chuông đại hồng chung, tiếng khánh chùa) phục vụ các endpoint `/api/audio/bell` và `/api/audio/stream/:poiId` mà không cần file media tĩnh nặng hay phần mềm bên thứ ba như FFmpeg.

---

### 3. Công Nghệ Định Vị GPS & Cảm Biến Vùng (GPS & Geofencing)
- **HTML5 Geolocation API**:
  - Chế độ định vị chính xác cao (`enableHighAccuracy: true`, `timeout: 10000`, `maximumAge: 2000`).
- **Bộ Lọc Kalman Đa Chiều (Mobile 2D Extended Kalman Filter)**:
  - Cài đặt tại `src/hooks/useGPSTracker.ts` và `src/server/services/gpsFilterService.ts`.
  - Triệt tiêu hiện tượng nhiễu sóng GPS, trôi tọa độ và tín hiệu phản xạ do các công trình bê tông cao tầng và mái chùa che khuất.
- **Thuật toán tính khoảng cách Haversine & Geodesic**:
  - Tính toán khoảng cách chính xác theo độ cong hình cầu của Trái Đất giữa tọa độ khách hành hương và tâm vùng Geofence của từng điểm POI.
- **Dịch vụ không gian địa lý Python (`python/spatial_ai_service.py`)**:
  - Xây dựng bằng Python 3, cung cấp công thức trắc địa Vincenty Geodesic và thuật toán kiểm tra điểm nằm trong đa giác (Point-in-Polygon).

---

### 4. Công Nghệ Máy Chủ & Backend (Backend Architecture)
- **Môi trường thực thi**: **Node.js 22 LTS** kết hợp trình thực thi siêu tốc **`tsx`** (TypeScript Execute), biên dịch và chạy trực tiếp TypeScript mà không cần bước build trung gian ở chế độ phát triển.
- **Framework Web**: **Express.js 4.21** (`express`, `@types/express`) xử lý định tuyến RESTful, middleware bảo mật và xử lý lỗi tập trung.
- **Kiến trúc phân tầng 3 lớp (Clean 3-Tier Layered Architecture)**:
  - **Controllers**: `authController.ts`, `poiController.ts`, `analyticsController.ts` — Tiếp nhận và chuẩn hóa dữ liệu yêu cầu HTTP.
  - **Services**: `authService.ts`, `poiService.ts`, `aiTranslationService.ts`, `analyticsService.ts`, `gpsFilterService.ts` — Đảm nhiệm toàn bộ nghiệp vụ logic của hệ thống.
  - **Repositories**: `poiRepository.ts`, `analyticsRepository.ts`, `mongoClient.ts`, `db.ts` — Trừu tượng hóa việc truy vấn và lưu trữ dữ liệu.
- **Tích hợp Vite Middleware nguyên khối**:
  - Khởi chạy thống nhất trên một cổng mạng duy nhất (`PORT 3000`), vừa cung cấp REST API vừa phục vụ tài nguyên Vite SPA mà không gặp lỗi phân tán cổng hay cấu hình CORS phức tạp.

---

### 5. Trí Tuệ Nhân Tạo & Chuyển Ngữ Tự Động (AI & Multilingual Translation)
- **Google Gen AI SDK v2.4.0** (`@google/genai`):
  - Tích hợp mô hình ngôn ngữ lớn **Gemini 2.5 Flash** / **Gemini 3.8 Flash** thông qua cổng API bảo mật phía máy chủ (`/api/translate`).
- **Bảo tồn danh xưng và thuật ngữ Phật giáo (Sacred Terminology Preservation)**:
  - Prompt thiết kế chuyên biệt để giữ nguyên trang nghiêm các danh xưng thiêng liêng: *Việt Nam Quốc Tự*, *Đại Hùng Bửu Điện*, *Bồ Tát Thích Quảng Đức*, *Đại Hồng Chung*, *Bảo Tháp 13 Tầng*...
- **Từ điển dự phòng ngoại tuyến (Offline Multilingual Dictionary)**:
  - Module `src/translations/index.ts` cung cấp đầy đủ bản dịch sẵn có cho 12 ngôn ngữ quốc tế (Việt, Anh, Trung, Nhật, Hàn, Pháp, Đức, Tây Ban Nha, Nga, Thái, Indonesia, Ý) ngay cả khi không có kết nối internet hay không có API key.

---

### 6. Cơ Sở Dữ Liệu & Lưu Trữ Dữ Liệu (Databases & Storage)
- **Hệ cơ sở dữ liệu chính: MongoDB** (`mongodb` v7.7.0):
  - Tương thích hoàn toàn với MongoDB Server cục bộ hoặc MongoDB Atlas trên đám mây.
  - **Chỉ mục không gian địa lý 2dsphere (`2dsphere index`)**: Hỗ trợ tìm kiếm các điểm di tích gần nhất bằng truy vấn không gian `$nearSphere` và `$geoWithin` với tọa độ chuẩn GeoJSON Point `[kinh độ, vĩ độ]`.
  - **6 BSON Collections**:
    1. `pois`: Danh mục điểm chiêm bái, tọa độ, bán kính, hình ảnh và bài viết đa ngôn ngữ.
    2. `audio_tracks`: Metadata về giọng đọc, thời lượng và đường dẫn âm thanh.
    3. `visitor_sessions`: Thông tin phiên viếng thăm (vô danh, bảo mật).
    4. `geofence_events`: Nhật ký kích hoạt vùng cảm biến theo thời gian thực.
    5. `system_logs`: Ghi nhận sự cố và hoạt động hệ thống.
    6. `admin_users`: Tài khoản quản trị phân quyền.
- **Cơ chế lưu trữ dự phòng tự động (Embedded In-Memory Fallback)**:
  - Lớp `MongoDatabaseEngine` tự động chuyển đổi sang kho dữ liệu bộ nhớ trong khi chạy cục bộ mà chưa kết nối MongoDB Atlas, giúp ứng dụng hoạt động trơn tru 100% ngay từ lần chạy đầu tiên.

---

### 7. Bảo Mật & Xác Thực (Security & Authentication)
- **Mã hóa mật khẩu an toàn**:
  - Thuật toán băm mật khẩu chuẩn **SHA-256 kèm chuỗi Salt ngẫu nhiên** (`src/utils/cryptoUtils.ts`) bảo vệ tuyệt đối thông tin quản trị viên.
- **Kiểm soát truy cập theo vai trò (RBAC - Role-Based Access Control)**:
  - Quản trị viên đăng nhập nhận Bearer Token để thực hiện các thao tác nhạy cảm (thêm/sửa/xóa POIs, chỉnh sửa bài thuyết minh, đổi giọng đọc mặc định).
- **Phân tách giao diện tuyệt đối**:
  - Người dùng phổ thông hoàn toàn không thấy nút đăng nhập quản trị trong luồng chiêm bái thông thường; cổng quản trị chỉ mở khi có tham số đặc biệt `?admin=login` hoặc phím tắt bảo mật.

---

### 8. DevOps, Tự Động Hóa & Kiểm Thử (DevOps, CI/CD & Testing)
- **Container hóa (Containerization)**:
  - `Dockerfile` tối ưu hóa đa tầng (Multi-stage build) và `docker-compose.yml` khởi chạy đồng bộ Node.js và MongoDB chỉ với một câu lệnh.
- **Tự động hóa CI/CD**:
  - Tích hợp GitHub Actions (`.github/workflows/ci-cd.yml`) tự động kiểm tra cú pháp (Linting), kiểm tra kiểu (Typecheck), chạy kiểm thử đơn vị và đóng gói ứng dụng.
- **Kiểm thử tự động (Automated Testing)**:
  - Bộ kiểm thử `test/backend.test.ts` chạy trên nền tảng **Node.js Test Runner** (`node --test`), kiểm tra tính đúng đắn của hàm tính khoảng cách địa lý, bộ lọc GPS, dịch vụ xác thực tài khoản và các endpoint API.
- **Kịch bản triển khai không gián đoạn**:
  - Tập lệnh `scripts/deploy.sh` hỗ trợ triển khai mã nguồn lên máy chủ Linux với cơ chế Zero-Downtime.

---

### 📊 Bảng Tổng Hợp Công Nghệ & Thư Viện

| Lĩnh Vực / Phân Hệ | Công Nghệ / Thư Viện | Phiên Bản | Mục Đích Sử Dụng |
| :--- | :--- | :--- | :--- |
| **Giao diện người dùng** | React | `^19.0.1` | Xây dựng UI linh hoạt, tối ưu hiệu năng render |
| **Ngôn ngữ lập trình** | TypeScript | `^7.0.2` | Đảm bảo tính nhất quán và an toàn kiểu dữ liệu |
| **Công cụ đóng gói** | Vite | `^8.3.0` | Khởi động máy chủ phát triển và đóng gói mã nguồn |
| **Định kiểu CSS** | Tailwind CSS v4 | `^4.3.3` | Tạo giao diện phong cách Thiền viện Á Đông |
| **Bản đồ tương tác** | Leaflet | `^1.9.4` | Hiển thị bản đồ khuôn viên, vệ tinh và Geofence |
| **Biểu tượng vector** | Lucide React | `^0.546.0` | Icon trực quan cho các chức năng bản đồ & audio |
| **Hiệu ứng diễn hoạt** | Motion (Framer) | `^12.23.24` | Animation mượt mà cho drawer và thông báo |
| **Mã vạch QR** | QRCode | `^1.5.4` | Tạo tem QR chiêm bái cho 8 điểm di tích |
| **Máy chủ Backend** | Express | `^4.21.2` | Cung cấp RESTful API và điều phối dịch vụ |
| **Trình thực thi TS** | tsx | `^4.21.0` | Chạy TypeScript trên Node.js không cần tiền biên dịch |
| **Trí tuệ nhân tạo** | @google/genai | `^2.4.0` | Tích hợp Gemini 2.5/3.8 Flash dịch thuật tự động |
| **Cơ sở dữ liệu** | MongoDB Driver | `^7.7.0` | Thao tác dữ liệu BSON và chỉ mục không gian 2dsphere |
| **Định vị & Lọc sóng** | Kalman Filter 2D | Thuật toán nội tại | Khử nhiễu GPS và ổn định vị trí khách hành hương |
| **Xử lý âm thanh** | Web Speech API | Trình duyệt | Phát giọng đọc đa ngôn ngữ với độ trễ 0ms |
| **Tổng hợp sóng âm** | PCM WAV Synthesizer | Thuật toán nội tại | Tạo âm chuông chùa 16-bit trực tiếp trên máy chủ |
| **Tính toán không gian** | Python 3 | `3.9+` | Hỗ trợ tính toán trắc địa nâng cao (Haversine/Vincenty) |
| **Đóng gói & Triển khai** | Docker / Compose | Multi-stage | Đóng gói môi trường đồng nhất và triển khai máy chủ |
| **Kiểm thử tự động** | Node.js Test Runner | `node:test` | Kiểm thử tính toàn vẹn của API và thuật toán |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 20.x trở lên
- **npm** hoặc **bun**
- **Python**: Phiên bản 3.9+ (phục vụ spatial engine)

### Các Bước Cài Đặt

1. **Clone mã nguồn về máy**:
   ```bash
   git clone <URL_KHO_LƯU_TRỮ>
   cd vietnam-quoc-tu-audio-guide
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   Sao chép file mẫu `.env.example` thành `.env`:
   ```bash
   cp .env.example .env
   ```
   *(Tùy chọn: Nhập API key Gemini vào `GEMINI_API_KEY` nếu muốn sử dụng dịch tự động)*.

4. **Khởi chạy máy chủ phát triển (Development Server)**:
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

5. **Chạy kiểm thử hệ thống (Unit & Spatial Tests)**:
   ```bash
   npm test
   ```

6. **Kiểm tra cú pháp & biên dịch (Lint & Build)**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🔄 Quy Trình CI/CD & Triển Khai

Quy trình Tích hợp và Triển khai liên tục (CI/CD) được cấu hình tại `.github/workflows/ci-cd.yml` theo tôn chỉ dịch vụ phi lợi nhuận:

```
[Mã nguồn mới] ──► [1. Kiểm tra Lint & TypeScript]
                ──► [2. Chạy Bộ Test Backend & Spatial Geofence]
                ──► [3. Build Gói Production Tĩnh dist/]
                ──► [4. Đóng gói Docker Container Image]
                ──► [5. Kiểm tra Tự Động Triển Khai Không Gián Đoạn]
```

- Kịch bản triển khai không gián đoạn (Zero-downtime rolling update) nằm tại `scripts/deploy.sh` hỗ trợ kiểm tra sức khỏe hệ thống tự động qua endpoint `/api/health`.

---

## 📁 Cấu Trúc Thư Mục

```
.
├── .github/workflows/ci-cd.yml       # Quy trình kiểm thử và build tự động
├── python/
│   └── spatial_ai_service.py         # Micro-service Python tính toán tọa độ & âm thanh
├── scripts/
│   └── deploy.sh                     # Kịch bản triển khai sản phẩm
├── src/
│   ├── components/
│   │   ├── AdminPortal.tsx           # Giao diện Cổng Quản Trị Hệ Thống (4 tabs)
│   │   ├── AdminPOIMapPicker.tsx     # Bộ chọn tọa độ trực quan trên bản đồ
│   │   ├── RealCampusMap.tsx         # Bản đồ tương tác Leaflet (Đường phố & Vệ tinh)
│   │   ├── VoiceSelectorModal.tsx    # Cửa sổ tùy biến 5 giọng đọc & tốc độ
│   │   ├── WelcomeModal.tsx          # Màn hình chọn ngôn ngữ dạng cuộn
│   │   ├── AudioPlayerBar.tsx        # Thanh phát âm thanh nổi
│   │   ├── Header.tsx                # Thanh điều hướng trên cùng
│   │   └── QRScannerModal.tsx        # Trình quét mã QR chiêm bái
│   ├── hooks/
│   │   └── useGPSTracker.ts          # Hook quản lý vị trí GPS & lọc Kalman
│   ├── server/
│   │   ├── controllers/              # Các bộ điều khiển API (POI, Auth, Analytics)
│   │   ├── repositories/             # Lớp truy xuất dữ liệu & seed 8 POIs 12 thứ tiếng
│   │   ├── routes/api.ts             # Định tuyến API máy chủ
│   │   ├── services/                 # Logic nghiệp vụ (AI translation, GPS filter, POI)
│   │   └── types.ts                  # Khai báo kiểu TypeScript chuẩn hóa
│   ├── translations/                 # Bộ từ điển giao diện 12 ngôn ngữ
│   ├── utils/
│   │   ├── audioSpeech.ts            # Động cơ phát thuyết minh Web Speech & 5 Voice Engines
│   │   ├── geo.ts                    # Thuật toán tính cự ly Haversine
│   │   └── cryptoUtils.ts            # Băm mật khẩu quản trị viên
│   ├── App.tsx                       # Component chính điều phối ứng dụng
│   ├── index.css                     # Cấu hình Tailwind CSS
│   └── main.tsx                      # Điểm khởi đầu ứng dụng React
├── test/
│   └── backend.test.ts               # Bộ unit test không gian & bảo mật
├── Dockerfile                        # Đóng gói ứng dụng chạy container
├── package.json                      # Cấu hình gói và kịch bản npm
└── README.md                         # Tài liệu hướng dẫn dự án
```

---

## 🗄️ Tích Hợp Cơ Sở Dữ Liệu MongoDB & Atlas

Hệ thống lưu trữ và quản trị dữ liệu theo mô hình NoSQL Document Store với **6 Collections BSON** chuẩn hóa cùng chỉ mục không gian địa lý **2dsphere**:
1. `campuses`: Thông tin chung về khuôn viên Việt Nam Quốc Tự và tọa độ tâm.
2. `pois`: Danh mục 8 điểm di tích kèm tọa độ chuẩn GeoJSON Point (`location: { type: "Point", coordinates: [lng, lat] }`), bán kính cảm ứng `geofence_radius`, mã QR và thứ tự chiêm bái.
3. `poi_translations`: Toàn bộ nội dung bài viết thuyết minh lịch sử, ý nghĩa tâm linh và đường dẫn file audio chuẩn theo 12 ngôn ngữ quốc tế.
4. `poi_media`: Bộ sưu tập hình ảnh thực tế chất lượng cao của từng công trình kiến trúc.
5. `admin_users`: Tài khoản quản trị viên với mật khẩu băm bảo mật SHA-256 kèm salt.
6. `pilgrimage_logs`: Nhật ký hành hương ẩn danh ghi nhận lượt chiêm bái, ngôn ngữ du khách lựa chọn phục vụ thống kê tổng quan.

### Chỉ Mục Không Gian Địa Lý (2dsphere Geospatial Index)
- Trường `location` trong collection `pois` được cấu hình chỉ mục `2dsphere` theo chuẩn quốc tế GeoJSON: `[longitude, latitude]`.
- Cho phép thực hiện các truy vấn không gian `$near`, `$geoWithin`, `$geoIntersects` với độ chính xác cao trên tọa độ thực tế của khuôn viên chùa.

### Cấu Hình Kết Nối MongoDB Atlas / Local MongoDB:
Trong file `.env`:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/vietnam_quoc_tu?retryWrites=true&w=majority
MONGODB_DB_NAME=vietnam_quoc_tu
```
- Khi chạy độc lập hoặc trong môi trường preview/CI, hệ thống tự động kích hoạt **Embedded MongoDB BSON Engine** có sẵn với 8 POIs đã được định vị tọa độ và 12 bản dịch ngôn ngữ, giúp ứng dụng luôn vận hành mượt mà 100% mà không bị gián đoạn.
- Trạng thái kết nối và chỉ mục không gian có thể kiểm tra trực tiếp qua API: `GET /api/mongodb/status`.

---

## 📜 Bản Quyền & Giấy Phép

Dự án được xây dựng với tâm nguyện cống hiến cho công tác Phật sự, hoằng pháp và bảo tồn văn hóa lịch sử Phật giáo Việt Nam:
- **Tôn chỉ**: Phục vụ cộng đồng phi lợi nhuận.
- **Địa điểm phục vụ**: Việt Nam Quốc Tự – Trụ sở Ban Trị Sự Giáo Hội Phật Giáo Việt Nam TP. Hồ Chí Minh.
- **Quyền sử dụng**: Tự do sử dụng cho mục đích hoằng dương Phật pháp và tham quan văn hóa tâm linh.
