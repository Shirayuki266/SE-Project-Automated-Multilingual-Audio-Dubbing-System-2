# ☸️ Hệ Thống Thuyết Minh Tự Động & Hướng Dẫn Chiêm Bái Việt Nam Quốc Tự
### *Automated Multilingual Audio Guide & Smart Pilgrimage System*

[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre_GL-3D_WebGL-3969EC?logo=maplibre&logoColor=white)](https://maplibre.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_%26_Embedded-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-2.5%2F3.8_Flash-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-Non--Profit%20Public%20Use-amber.svg)](#-bản-quyền--ý-nghĩa-cộng-đồng)

> **DỰ ÁN VĂN HÓA PHẬT GIÁO PHI LỢI NHUẬN (NON-PROFIT PUBLIC PILGRIMAGE GUIDE)**  
> Ứng dụng phục vụ hoàn toàn **miễn phí 100%** cho chư tôn đức Tăng Ni, đồng bào Phật tử và du khách thập phương trong & ngoài nước khi đến chiêm bái **Việt Nam Quốc Tự** (244 Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh). Ứng dụng chạy trực tiếp trên trình duyệt web điện thoại (PWA/SPA), không cần cài đặt app từ cửa hàng, không yêu cầu đăng ký tài khoản và không có quảng cáo.

---

## 📖 Mục Lục
1. [Giới Thiệu Tổng Quan](#-giới-thiệu-tổng-quan)
2. [Các Tính Năng Cốt Lõi](#-các-tính-năng-cốt-lõi)
3. [Kiến Trúc Hệ Thống (3-Tier Architecture)](#-kiến-trúc-hệ-thống-3-tier-architecture)
4. [Công Nghệ & Thư Viện Sử Dụng](#-công-nghệ--thư-viện-sử-dụng)
5. [Cổng Quản Trị Hệ Thống (Admin CMS)](#-cổng-quản-trị-hệ-thống-admin-cms)
6. [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
7. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
8. [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
9. [Kiểm Thử & Quy Trình CI/CD](#-kiểm-thử--quy-trình-cicd)
10. [Bản Quyền & Ý Nghĩa Cộng Đồng](#-bản-quyền--ý-nghĩa-cộng-đồng)

---

## 🌸 Giới Thiệu Tổng Quan

**Việt Nam Quốc Tự** là trung tâm hành chính, văn hóa và tâm linh tiêu biểu của Phật giáo TP. Hồ Chí Minh. Nhằm tạo điều kiện thuận duyên cho khách hành hương tiếp cận nguồn tư liệu lịch sử, kiến trúc và giá trị tâm linh một cách chuẩn xác, hệ thống **Thuyết Minh Tự Động Đa Ngôn Ngữ** được xây dựng tích hợp:
- **Định vị không gian địa lý (GPS Geofencing)**: Tự động nhận diện du khách đang tiến vào phạm vi của công trình tâm linh để phát bài thuyết minh.
- **Bộ lọc Kalman 2D**: Triệt tiêu hiện tượng nhảy cóc tọa độ và nhiễu sóng phản xạ từ các công trình cao tầng xung quanh.
- **Bản đồ 3D Vector WebGL & 4D Day/Night**: Trình diễn mô hình 3D thực tế của các khối công trình kiến trúc chùa (Bảo Tháp 13 Tầng cao 63m, Chính Điện cao 30m, Cổng Tam Quan...).
- **Hệ thống AI kép (Trí tuệ nhân tạo)**:
  1. *AI Dịch thuật đa ngữ (Google Gemini)*: Dịch thuật ngữ cảnh lịch sử, tâm linh trang nghiêm sang 12 thứ tiếng.
  2. *AI Giọng nói (Google TTS Engine)*: Tổng hợp tệp âm thanh thuyết minh MP3 chất lượng cao, lưu đệm trên máy chủ phục vụ tức thì.
- **Quét mã QR dự phòng**: Cho phép quét nhanh mã QR tại từng điện thờ để mở thẳng bài thuyết minh ngay cả khi thiết bị yếu GPS.

---

## ✨ Các Tính Năng Cốt Lõi

### 1. Thuyết Minh Tự Động Bằng GPS Geofencing (Lọc Kalman 2D)
- **Tự động nhận diện công trình**: Bán kính cảm biến được tinh chỉnh từ **15m – 30m** cho 8 điểm di tích trọng điểm.
- **Bộ lọc Kalman 2D**: Ổn định và làm mượt dòng dữ liệu GPS thời gian thực, cơ chế Outlier Gating từ chối các bước nhảy vận tốc đi bộ $> 7\text{ m/s}$.
- **Chế độ tự động thông minh**: Khi du khách bước vào vùng Geofence, hệ thống rung/chuông nhẹ và tự động phát thuyết minh nếu du khách bật chế độ Autoplay.

### 2. Bản Đồ Số 3D WebGL & Chế Độ Ngày/Đêm (4D Day/Night)
- **Engine MapLibre GL JS**: Hiển thị mượt mà trên nền WebGL với hiệu năng cao trên cả điện thoại cấu hình khiêm tốn.
- **Mô hình kiến trúc 3D (3D Extrusion)**:
  - *Bảo Tháp 13 Tầng* (cao 63m - tháp Phật giáo cao nhất Việt Nam).
  - *Đại Hùng Bửu Điện / Chính Điện* (cao 30m, mái ngói cong truyền thống).
  - *Cổng Tam Quan* (cao 14m), *Gác Chuông Đại Hồng Chung* (cao 18m), *Tôn Tượng Quán Thế Âm* (cao 12m).
- **Chế độ Ngày/Đêm 4D**: Tự động chuyển giao diện theo đồng hồ sinh học địa phương (18:00 - 06:00 chuyển Dark Canvas huyền ảo).
- **Bản đồ 2D & Sơ đồ ngoại tuyến**: Cung cấp chế độ Leaflet 2D và sơ đồ vector SVG làm phương án dự phòng khi mất kết nối.

### 3. Đa Ngôn Ngữ Toàn Diện (12 Quốc Gia)
- Hỗ trợ chuẩn hóa **12 ngôn ngữ quốc tế**:
  - 🇻🇳 Tiếng Việt *(Ngôn ngữ gốc)*
  - 🇬🇧 English
  - 🇨🇳 中文 (Chinese)
  - 🇯🇵 日本語 (Japanese)
  - 🇰🇷 한국어 (Korean)
  - 🇫🇷 Français (French)
  - 🇩🇪 Deutsch (German)
  - 🇪🇸 Español (Spanish)
  - 🇷🇺 Русский (Russian)
  - 🇹🇭 ภาษาไทย (Thai)
  - 🇮🇩 Bahasa Indonesia
  - 🇮🇹 Italiano (Italian)
- **Bảo tồn danh xưng thiêng liêng**: Tên các danh xưng thiêng liêng (*Việt Nam Quốc Tự*, *Đại Hùng Bửu Điện*, *Bồ Tát Thích Quảng Đức*, *Đại Hồng Chung*...) luôn được giữ nguyên tính trang nghiêm trong mọi bản dịch.

### 4. Động Cơ Âm Thanh Kép (Dual Audio Architecture)
- **Vòng 1 (Server MP3 Audio Cache)**: Sử dụng Google TTS Engine tổng hợp sẵn file âm thanh `.mp3` chất lượng cao, lưu đệm trên máy chủ tại `/public/audio/poi-{code}-{lang}.mp3` giúp phát ngay lập tức với độ trễ 0s.
- **Vòng 2 (Client Web Speech API Fallback)**: Tận dụng trực tiếp bộ tổng hợp giọng nói trên hệ điều hành của thiết bị du khách khi ngoại tuyến.
- **Tùy biến âm thanh**: Điều chỉnh tốc độ đọc (0.7x – 2.5x), cao độ giọng (pitch), tua tiến/lùi 10s và nút tắt âm thanh khẩn cấp khi vào nơi tôn nghiêm.

### 5. Quét Mã QR & Tem Chiêm Bái
- Quét mã QR dán tại từng điểm di tích để lập tức mở đúng bài thuyết minh của công trình đó mà không cần bật GPS.
- Admin có thể kết xuất mã QR kèm khung viền trang nhã ra file PNG/JPG để in ấn thực địa.

### 6. Giám Sát Thiết Bị Thật & Bảo Vệ Quyền Riêng Tư
- Sử dụng thuật toán băm **SHA-256 HMAC** kết hợp muối bí mật xoay vòng theo ngày (`VISITOR_HASH_SALT`) để tạo chuỗi `visitorHash`.
- Thống kê trung thực **1 thiết bị thật = tối đa 1 lượt khách duy nhất trong 24 giờ**, hoàn toàn không lưu thông tin cá nhân (PII), không dùng tracking cookie.

---

## 🏛️ Kiến Trúc Hệ Thống (3-Tier Architecture)

Dự án được xây dựng chuẩn mực theo mô hình **Kiến trúc 3 lớp (3-Tier Architecture)**:

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
│   ┌───┴───────────────────┬───────────────────┐                                                        │
│   ▼ (Lớp Controller)      ▼ (Lớp Controller)  ▼ (Lớp Controller)                                       │
│   [poiController.ts]      [authController.ts] [statsController.ts]                                     │
│   (CRUD POI, Media, AI)   (Đăng nhập, JWT)    (Thống kê lưu lượng, Phân loại thiết bị, Top POIs)       │
│       │                       │                   │                                                    │
│       └───────────────────────┼───────────────────┘                                                    │
│                               ▼ Gọi thực thi nghiệp vụ (Lớp Service)                                   │
│   ┌────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ [services/poiService.ts]          ── Quản lý nghiệp vụ điểm chiêm bái & tính Geofence          │   │
│   │ [services/aiTranslationService.ts]── [AI 1] Gọi Google GenAI SDK (Gemini AI Dịch thuật tôn kính)│   │
│   │ [services/ttsService.ts]          ── [AI 2] Tổng hợp giọng đọc MP3 Google TTS Engine & Cache   │   │
│   │ [services/localizationService.ts] ── Tự động hóa 1-Click dịch 12 thứ tiếng & Tạo file MP3      │   │
│   │ [services/dailyVisitService.ts]   ── Giám sát thiết bị thật qua mã băm SHA-256 HMAC bí mật     │   │
│   │ [services/statsService.ts]        ── Tổng hợp chỉ số ngày/tháng, phân loại thiết bị, Top POIs  │   │
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
│   [repositories/poiRepository.ts] & [repositories/statsRepository.ts]                                  │
│       │                                                                                                │
│       ▼                                                                                                │
│   [repositories/db.ts] (Bộ máy CSDL nhúng MongoDatabaseEngine hỗ trợ lưu trữ kép In-Memory & MongoDB)  │
│       ├── Bộ sưu tập: `campuses`, `pois`, `daily_visits`, `daily_stats`, `poi_listen_stats`            │
│       ├── Dữ liệu Seed: [repositories/seedPOIs.ts] (8 POI khởi tạo chuẩn hóa tọa độ)                   │
│       └── Đồng bộ đám mây: [repositories/mongoClient.ts] ──► [ Cụm MongoDB Atlas Cloud (2dsphere) ]    │
│                                                                                                        │
│   Kho tệp tĩnh máy chủ (Local Disk Storage):                                                           │
│       ├── `public/audio/` (Bộ nhớ đệm các tệp âm thanh thuyết minh MP3 do Google TTS tạo ra)           │
│       └── `public/uploads/` (Bộ nhớ lưu trữ hình ảnh các điểm POI do Quản trị viên tải lên)            │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Công Nghệ & Thư Viện Sử Dụng

| Phân hệ / Tầng | Công nghệ / Thư viện | Phiên bản | Mục đích & Vai trò |
| :--- | :--- | :--- | :--- |
| **Giao diện người dùng** | React | `^19.0.1` | Xây dựng giao diện Single Page Application hiện đại |
| **Ngôn ngữ phát triển** | TypeScript | `^5.x / 7.x` | Đảm bảo an toàn kiểu dữ liệu toàn diện Client - Server |
| **Công cụ đóng gói** | Vite | `^8.3.8` | Máy chủ phát triển HMR siêu tốc và tối ưu đóng gói bundle |
| **Định kiểu giao diện** | Tailwind CSS v4 | `^4.3.3` | Tạo giao diện phong cách Thiền trà Á Đông trang nhã |
| **Bản đồ 3D WebGL** | MapLibre GL JS | `^5.1.0` | Dựng bản đồ vector 3D, tòa nhà 3D và 4D Day/Night |
| **Bản đồ 2D dự phòng** | Leaflet | `^1.9.4` | Bản đồ 2D cho thiết bị yếu và bộ chọn tọa độ Admin |
| **Hệ thống biểu tượng** | Lucide React | `^0.546.0` | Bộ icon vector sắc nét cho la bàn, audio, POI |
| **Mã vạch tương tác** | QRCode | `^1.5.4` | Tạo tem mã QR chiêm bái tải về file PNG/JPG |
| **Máy chủ HTTP** | Express | `^4.21.2` | Cung cấp RESTful API, phục vụ audio tĩnh và uploads |
| **Thực thi TypeScript** | tsx | `^4.21.0` | Chạy TypeScript trực tiếp trên Node.js không cần build |
| **AI Dịch thuật** | Google GenAI SDK | `^2.4.0` | Gọi Gemini 2.5/3.8 Flash dịch tự động ngữ cảnh Phật học |
| **AI Giọng nói (TTS)** | Google TTS Engine | `google-tts-api` | Phân đoạn và tạo file âm thanh MP3 lưu đệm máy chủ |
| **Cơ sở dữ liệu** | MongoDB Driver | `^7.7.0` | Thao tác CSDL NoSQL và chỉ mục địa lý không gian 2dsphere |
| **Quản lý Uploads** | Multer | `^1.4.5` | Tiếp nhận và kiểm tra bảo mật tệp ảnh tải lên (max 5MB) |
| **Định vị & Lọc sóng** | Kalman Filter 2D | Thuật toán nội tại | Khử nhiễu GPS và triệt tiêu sai số trôi tọa độ |
| **Tổng hợp sóng âm** | PCM WAV Synthesizer | Thuật toán nội tại | Tạo âm chuông chùa 16-bit trực tiếp trên máy chủ |

---

## 🏛️ Cổng Quản Trị Hệ Thống (Admin CMS)

Cổng quản trị được tích hợp ngay trong ứng dụng, bảo vệ bằng mã hóa JWT:
- **Cách truy cập**: Nhấp vào biểu tượng **Khóa bảo mật (🔒)** ở góc phải thanh Header hoặc truy cập qua đường dẫn `?admin=login`.
- **Tài khoản mặc định**:
  - Tên đăng nhập: `admin`
  - Mật khẩu: `vnqt@2026`

### Các phân hệ quản trị chính:
1. **Quản lý POI (CMS)**: Xem danh sách, tìm kiếm, thêm mới, sửa đổi thông tin và tọa độ trên bản đồ vệ tinh thu nhỏ (`AdminPOIMapPicker`), xóa điểm POI.
2. **Quản lý Media & Upload**: Tải ảnh chụp thực tế cho các điểm chiêm bái (tự động xóa ảnh cũ khi cập nhật, chống rác đĩa cứng).
3. **1-Click AI Localization**: Nhập bài viết tiếng Việt gốc và bấm **"Dịch 12 Ngôn Ngữ & Tạo Voice"**: Hệ thống tự động dịch và sinh toàn bộ các tệp MP3 lưu vào đĩa cứng.
4. **Tạo & Xuất mã QR**: Tạo mã QR định danh cho từng POI, tải về ảnh PNG/JPG để in tem dán thực địa.
5. **Thống kê lưu lượng truy cập thực tế**: Biểu đồ phân tích lượng khách theo ngày/tháng dựa trên mã định danh phần cứng ẩn danh (`daily_visits`).
6. **Cấu hình giọng đọc mặc định**: Cài đặt giọng đọc mẫu (Google, AI Neural, Hoài My, Apple) và tốc độ đọc cho toàn hệ thống.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu Cầu Môi Trường
- **Node.js**: Phiên bản **20.x trở lên** (khuyên dùng **Node.js 22 LTS**).
- **Package Manager**: `npm` (hoặc `pnpm`, `bun`).
- **Trình duyệt**: Bất kỳ trình duyệt hiện đại nào (Chrome, Safari, Edge, Firefox) có hỗ trợ WebGL và Geolocation.
- *(Tùy chọn)* Cụm **MongoDB Atlas** hoặc MongoDB Server chạy cục bộ.

---

### Các Bước Cài Đặt Chi Tiết

#### Bước 1: Sao chép mã nguồn về máy tính
```bash
git clone https://github.com/your-username/SE-Project-Automated-Multilingual-Audio-Dubbing-System-2.git
cd SE-Project-Automated-Multilingual-Audio-Dubbing-System-2
```

#### Bước 2: Cài đặt các gói thư viện phụ thuộc
```bash
npm install
```

#### Bước 3: Cấu hình biến môi trường
Tạo file `.env` từ file mẫu `.env.example`:
- **Trên Windows (PowerShell)**:
  ```powershell
  Copy-Item .env.example .env
  ```
- **Trên Linux / macOS**:
  ```bash
  cp .env.example .env
  ```

Mở file `.env` và điền các thông tin:
```env
# Khóa bí mật ký JWT Token Admin
AUTH_SECRET=vnqt_secret_jwt_auth_key_2026

# Tên cơ sở dữ liệu MongoDB
MONGODB_DB_NAME=vietnam_quoc_tu

# Chuỗi kết nối MongoDB Atlas (Nếu để trống, hệ thống sẽ tự động dùng Embedded In-Memory Engine)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority

# API Key Google Gemini (Dùng cho tính năng tự động dịch thuật 12 thứ tiếng)
GEMINI_API_KEY=your_gemini_api_key_here

# Khóa bí mật băm thiết bị thật theo ngày (SHA-256 HMAC)
VISITOR_HASH_SALT=vnqt_daily_salt_secret_key_2026

# Tùy chọn: Khóa MapTiler (Nếu muốn dùng thêm nguồn map ngoài Esri mặc định)
MAPTILER_API_KEY=
VITE_MAPTILER_KEY=
```
> 💡 **Ghi chú**: Nếu bạn chưa có cụm MongoDB Atlas hoặc Gemini API Key, **hệ thống vẫn khởi chạy và hoạt động 100% trơn tru** nhờ bộ máy cơ sở dữ liệu nhúng sẵn (Embedded Engine) và từ điển 12 ngôn ngữ nội tại.

#### Bước 4: Khởi chạy máy chủ phát triển (Development)
```bash
npm run dev
```
Sau khi chạy, ứng dụng Full-Stack sẽ mở tại địa chỉ:
```
http://localhost:3000
```
- Truy cập giao diện du khách: `http://localhost:3000`
- Truy cập trang quản trị Admin: `http://localhost:3000/?admin=login`

#### Bước 5 (Tùy chọn): Đẩy dữ liệu khởi tạo lên MongoDB Atlas
Nếu đã cấu hình `MONGODB_URI` trong file `.env`, bạn có thể chạy script để đẩy toàn bộ 8 điểm chiêm bái và dữ liệu bản dịch mẫu lên MongoDB Atlas:
```bash
npx tsx scripts/seed-mongo.ts
```

#### Bước 6: Chạy kiểm thử hệ thống (Automated Tests)
Chạy bộ kiểm thử tự động kiểm tra công thức Haversine, bộ lọc Kalman, băm thiết bị bảo mật và truy vấn không gian:
```bash
npm test
```

#### Bước 7: Đóng gói và chạy môi trường Sản phẩm (Production)
```bash
# 1. Đóng gói giao diện tĩnh vào thư mục dist/
npm run build

# 2. Khởi chạy máy chủ Production
NODE_ENV=production npm run dev
```

---

### Khởi Chạy Bằng Docker (Tùy chọn)

Dự án cung cấp sẵn `Dockerfile` và `docker-compose.yml` để khởi chạy nhanh trong môi trường cô lập:

```bash
# Xây dựng và khởi chạy container
docker compose up -d --build

# Xem nhật ký log máy chủ
docker compose logs -f

# Dừng hệ thống
docker compose down
```

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
SE-Project-Automated-Multilingual-Audio-Dubbing-System-2/
├── .github/workflows/ci-cd.yml      # Quy trình CI/CD GitHub Actions tự động
├── dist/                            # Kết quả đóng gói build production của Vite
├── docs/                            # Tài liệu phân tích thiết kế & kiến trúc hệ thống
│   ├── BAN_DO_KIEN_TRUC_HE_THONG.md # Bản đồ kỹ thuật chi tiết toàn bộ các file
│   └── DFD_MUC_1_AND_2.xml          # Sơ đồ DFD mức 1 và mức 2 định dạng Draw.io
├── public/                          # Tài nguyên tĩnh
│   ├── audio/                       # Kho lưu đệm tệp âm thanh thuyết minh MP3 (Google TTS)
│   ├── uploads/                     # Kho lưu ảnh các điểm POI do Admin tải lên
│   └── maplibre-gl-worker.mjs       # Web Worker riêng biệt phục vụ MapLibre 3D
├── python/                          # Micro-service Python tính toán trắc địa nâng cao
│   └── spatial_ai_service.py        # Haversine, Vincenty math & tổng hợp sóng âm
├── scripts/                         # Các script bảo trì hệ thống
│   ├── deploy.sh                    # Kịch bản triển khai Zero-Downtime trên Linux
│   ├── generate-mp3-audio.py        # Tạo âm chuông mẫu
│   └── seed-mongo.ts                # Đẩy 8 POI hạt giống lên MongoDB Atlas
├── src/                             # Toàn bộ mã nguồn ứng dụng
│   ├── components/                  # Các UI component của giao diện
│   │   ├── AdminPOIMapPicker.tsx    # Bản đồ vệ tinh chọn tọa độ trong trang Admin
│   │   ├── AdminPortal.tsx          # Trung tâm điều hành Quản trị viên (CMS)
│   │   ├── AudioPlayerBar.tsx       # Thanh phát âm thanh nổi chân trang
│   │   ├── CampusMap.tsx            # Bản đồ sơ đồ minh họa SVG ngoại tuyến
│   │   ├── Header.tsx               # Thanh điều hướng trên cùng (Ngôn ngữ, QR)
│   │   ├── MapLibre3DCampusMap.tsx  # Bản đồ 3D Vector WebGL & 4D Day/Night chính
│   │   ├── POIArticlePopup.tsx      # Cửa sổ xem và hiệu đính bài viết chuyên sâu
│   │   ├── POIDetailDrawer.tsx      # Bảng trượt chi tiết thông tin POI
│   │   ├── QRScannerModal.tsx       # Cửa sổ quét mã QR qua camera điện thoại
│   │   ├── RealCampusMap.tsx        # Bản đồ 2D Leaflet truyền thống
│   │   ├── VoiceSelectorModal.tsx   # Hộp thoại cấu hình 5 engine giọng đọc & tốc độ
│   │   └── WelcomeModal.tsx         # Màn hình chào mừng và kích hoạt quyền
│   ├── config/                      # Cấu hình tĩnh
│   │   └── languages.ts             # Danh mục 13 ngôn ngữ chuẩn hóa
│   ├── hooks/                       # React Custom Hooks
│   │   └── useGPSTracker.ts         # Hook theo dõi vị trí GPS và chế độ giả lập
│   ├── server/                      # Mã nguồn tầng Backend (Node.js Express)
│   │   ├── controllers/             # Tầng Điều phối (Controllers)
│   │   │   ├── authController.ts    # Đăng nhập & Xác thực JWT Admin
│   │   │   └── poiController.ts     # Điều phối CRUD POI và Dịch thuật AI
│   │   ├── repositories/            # Tầng Truy xuất dữ liệu (Repositories)
│   │   │   ├── db.ts                # Bộ máy CSDL nhúng MongoDatabaseEngine
│   │   │   ├── mongoClient.ts       # Quản trị kết nối MongoDB Atlas & chỉ mục 2dsphere
│   │   │   ├── poiRepository.ts     # Thao tác CSDL POI
│   │   │   └── seedPOIs.ts          # Dữ liệu hạt giống chuẩn hóa 8 điểm chiêm bái
│   │   ├── routes/                  # Định tuyến HTTP REST API
│   │   │   └── api.ts               # Router trung tâm, Rate Limit, Upload Multer
│   │   ├── services/                # Tầng Xử lý nghiệp vụ (Services)
│   │   │   ├── aiTranslationService.ts # Gọi Gemini 2.5 Flash dịch thuật ngữ cảnh
│   │   │   ├── authService.ts       # Băm mật khẩu HMAC-SHA256 & Cấp token JWT
│   │   │   ├── dailyVisitService.ts # Băm SHA-256 HMAC ghi nhận khách thật theo ngày
│   │   │   ├── fileStorageService.ts# Quản lý lưu trữ và dọn dẹp ảnh upload
│   │   │   ├── gpsFilterService.ts  # Bộ lọc Kalman 2D khử nhiễu tọa độ GPS
│   │   │   ├── localizationService.ts # Dịch thuật 12 thứ tiếng & tạo audio trọn gói
│   │   │   ├── poiService.ts        # Nghiệp vụ kết hợp bản dịch, media và Geofence
│   │   │   └── ttsService.ts        # Tổng hợp giọng nói MP3 qua Google TTS Engine
│   │   └── types.ts                 # Định nghĩa kiểu dữ liệu TypeScript dùng chung
│   ├── translations/                # Bộ từ điển tĩnh
│   │   └── index.ts                 # Bản dịch chuỗi giao diện cho 12 ngôn ngữ
│   ├── utils/                       # Các hàm tiện ích dùng chung
│   │   ├── audioSpeech.ts           # Speech Synthesis engine, chia đoạn < 88 ký tự
│   │   ├── audioSynth.ts            # Tổng hợp sóng âm chuông chùa 16-bit PCM WAV
│   │   ├── cryptoUtils.ts           # Tiện ích mã hóa bảo mật
│   │   ├── fingerprint.ts           # Thuật toán tạo vân tay phần cứng ẩn danh
│   │   └── geo.ts                   # Công thức tính cự ly Haversine & góc la bàn
│   ├── AdminApp.tsx                 # Entry point độc lập cho trang quản trị
│   ├── App.tsx                      # Component chính điều phối ứng dụng du khách
│   ├── index.css                    # Định dạng CSS toàn cầu với Tailwind CSS v4
│   └── main.tsx                     # Điểm khởi đầu ứng dụng React
├── test/                            # Bộ kịch bản kiểm thử
│   └── backend.test.ts              # Kiểm thử Haversine, Kalman, Auth, GeoJSON
├── .env.example                     # Mẫu biến môi trường
├── docker-compose.yml               # Cấu hình chạy cụm container
├── Dockerfile                       # Cấu hình build image Docker đa tầng
├── package.json                     # Quản lý thư viện và scripts dự án
├── tsconfig.json                    # Cấu hình TypeScript compiler
└── vite.config.ts                   # Cấu hình công cụ đóng gói Vite
```

---

## ⚙️ Cấu Hình Biến Môi Trường (.env)

| Tên biến | Bắt buộc | Giá trị mẫu | Mục đích & Ý nghĩa |
| :--- | :---: | :--- | :--- |
| `PORT` | Không | `3000` | Cổng mạng máy chủ Express lắng nghe |
| `NODE_ENV` | Không | `development` / `production` | Chế độ chạy máy chủ |
| `AUTH_SECRET` | Có | `vnqt_secret_jwt_auth_key_2026` | Khóa bí mật ký và xác thực JWT token của Admin |
| `MONGODB_URI` | Không | `mongodb+srv://user:pass@cluster.mongodb.net` | Chuỗi kết nối MongoDB Atlas (để trống sẽ dùng In-Memory) |
| `MONGODB_DB_NAME` | Có | `vietnam_quoc_tu` | Tên Database trong cụm MongoDB |
| `GEMINI_API_KEY` | Tùy chọn | `AIzaSy...` | Khóa API Google Gemini phục vụ dịch tự động 12 ngôn ngữ |
| `VISITOR_HASH_SALT` | Có | `vnqt_daily_salt_secret_key_2026` | Khóa bí mật băm định danh thiết bị thật theo ngày (HMAC) |
| `MAPTILER_API_KEY` | Không | `key_maptiler...` | Khóa bản đồ bổ trợ MapTiler (nếu không dùng Esri) |
| `VITE_MAPTILER_KEY` | Không | `key_maptiler...` | Khóa MapTiler đưa vào bundle client-side |

---

## 🧪 Kiểm Thử & Quy Trình CI/CD

Dự án tích hợp bộ kiểm thử tự động toàn diện được kích hoạt mỗi khi có commit hoặc Pull Request thông qua GitHub Actions (`.github/workflows/ci-cd.yml`):

```bash
# Chạy bộ kiểm thử tự động
npm test
```

### Các hạng mục được kiểm tra:
1. **Kiểm tra công thức trắc địa Haversine**: Độ sai lệch cự ly giữa Cổng Tam Quan và Chính Điện nằm trong ngưỡng an toàn ($52.2\text{ m} \pm 1\text{m}$).
2. **Kiểm tra cấu trúc POI**: Đảm bảo đủ các trường bắt buộc (Tiêu đề, Giới thiệu, Kịch bản, Tọa độ).
3. **Kiểm tra tính toàn vẹn của chỉ mục không gian GeoJSON**: Truy vấn `$nearSphere` theo chuẩn không gian 2dsphere.
4. **Kiểm tra cơ chế xác thực Admin**: Mã hóa mật khẩu, kiểm tra sai mật khẩu và cấp phát JWT token.
5. **Kiểm tra thuật toán băm thiết bị ẩn danh**: Đảm bảo băm HMAC-SHA256 nhất quán và không trùng lặp.
6. **Kiểm tra Bộ lọc Kalman 2D**: Đảm bảo tọa độ sau lọc mượt mà và loại bỏ hiệu quả các điểm ngoại lai (outliers).

---

## 📜 Bản Quyền & Ý Nghĩa Cộng Đồng

Dự án được xây dựng với tâm nguyện phụng sự chánh pháp, hoằng dương văn hóa và lưu giữ giá trị lịch sử - kiến trúc - tâm linh của Phật giáo Việt Nam:
- **Tôn chỉ**: Phục vụ cộng đồng phi thương mại, không thu phí, không quảng cáo.
- **Địa điểm phục vụ**: **Việt Nam Quốc Tự** – Trụ sở Ban Trị Sự Giáo Hội Phật Giáo Việt Nam TP. Hồ Chí Minh.
- **Quyền sử dụng**: Tự do sử dụng, phát triển và nghiên cứu cho các mục đích văn hóa, giáo dục và tôn giáo tốt đời đẹp đạo.
