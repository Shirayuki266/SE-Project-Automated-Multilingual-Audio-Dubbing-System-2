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

```
┌────────────────────────────────────────────────────────┐
│                   GIAO DIỆN CLIENT                     │
│  React 19 + TypeScript + Tailwind CSS v4 + Leaflet.js  │
│  (Trang Chiêm Bái Du Khách  |  Cổng Quản Trị Admin)    │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs / Audio Web Speech
┌───────────────────────────▼────────────────────────────┐
│                    NODE.JS EXPRESS                     │
│   Controllers (Auth, POIs, Translations, Analytics)    │
│   Services (POI Domain, GPS Kalman, AI Gemini Bridge)  │
└─────────────┬──────────────────────────────┬───────────┘
              │                              │
┌─────────────▼──────────────┐ ┌──────────────────────────┐
│     PYTHON SPATIAL AI      │ │   CƠ SỞ DỮ LIỆU MONGODB  │
│  Tính Haversine & Âm thanh │ │   6 Collections BSON     │
│   Chuông Chùa Phòng Thu    │ │   2dsphere GeoJSON Point │
└────────────────────────────┘ └──────────────────────────┘
```

- **Frontend**: React 19, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), Leaflet Map, Lucide React, Motion.
- **Backend**: Node.js, Express, tsx engine.
- **Spatial Computing**: Python 3 (`python/spatial_ai_service.py`) hỗ trợ thuật toán hình học tọa độ và xử lý âm thanh chuông tần số thấp.
- **Trí Tuệ Nhân Tạo**: Google Gemini API (`@google/genai`) hỗ trợ dịch thuật tự động đa ngôn ngữ chuyên sâu về Phật học.

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
