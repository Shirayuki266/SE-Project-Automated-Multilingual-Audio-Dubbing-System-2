# 🛕 Hệ Thống Thuyết Minh Tự Động Đa Ngôn Ngữ Cho Việt Nam Quốc Tự

> Tài liệu tổng hợp từ `PRD_ThuyetMinhTuDong_VietNamQuocTu_DeTai2.docx` (PRD v2.0) **đã cập nhật theo** `Bao_Cao_Phan_Tich_Phan_Bien_Va_Khac_Phuc_PRD_VietNamQuocTu_DeTai2.docx` (phiên bản hoàn thiện **v2.1**), trình bày theo đúng khung chương của `system-presentation-standalone.html`.
> Mục đích: mô tả yêu cầu, công nghệ, kiến trúc, chức năng và cách vận hành của hệ thống. **Trọng tâm Đề tài 2: Backend Developer theo kiến trúc 3 lớp và quy trình CI/CD.**

**Mobile Web App (Zero-Install)** giúp du khách và Phật tử tham quan **Việt Nam Quốc Tự** (244 Ba Tháng Hai, Phường 12, Quận 10, TP.HCM): bản đồ số tương tác, thuyết minh song ngữ Việt - Anh tự động theo vị trí (Geofencing GPS), quét QR dự phòng ở khu vực trong nhà nơi GPS yếu, kèm CMS cho Ban Quản trị chùa.

`Backend 3 lớp (3-Tier)` · `Node.js + TypeScript` · `PostgreSQL + ORM` · `Mobile Web (Zero-Install)` · `Geofencing GPS + QR Indoor Fallback` · `Audio Range Streaming (HTTP 206)` · `ETag / Data Versioning` · `JWT Rotation + bcrypt` · `GitHub Actions CI/CD + Docker`

**Bài toán cần giải:** khuôn viên rộng gần 4 ha nên khách mới dễ lạc; thiếu thông tin lịch sử, ý nghĩa văn hóa; nhà chùa không thể bố trí thuyết minh viên túc trực liên tục; rào cản ngôn ngữ với khách quốc tế (bảng biển chủ yếu chữ Hán và tiếng Việt); GPS yếu hoặc mất tín hiệu trong Chánh Điện và Phòng trưng bày.

---

## Mục lục

| # | Chương | Nội dung |
|---|---|---|
| 00 | [Kiến Trúc Tổng Quan](#chapter-00--kiến-trúc-tổng-quan) | Actors, 3 lớp backend, cấu trúc thư mục, bảng CSDL, bản đồ Use Case |
| 01–02 | [Luồng Khởi Động (Backend + Frontend)](#chapter-0102--luồng-khởi-động-backend--frontend) | CI/CD → Docker → deploy, khởi động Web App, kiểm tra phiên bản |
| 04 | [GPS + Geofence + Audio Narration](#chapter-04--gps--geofence--audio-narration) | Haversine, Visited buffer, 3 chế độ phát audio |
| 05 | [Module Content — POI Lifecycle](#chapter-05--module-content--poi-lifecycle) | API POI, ETag, Soft Delete, fallback nội dung |
| 06 | [Module Audio / Media & QR Code](#chapter-06--module-audio--media--qr-code) | Upload, Range Streaming 206, sinh mã QR |
| 07 | [Authentication & RBAC](#chapter-07--authentication--rbac) | Access/Refresh Token, khóa tài khoản |
| 08 | [Localization — Đa Ngôn Ngữ 2 Làn](#chapter-08--localization--đa-ngôn-ngữ-2-làn) | Nội dung và giao diện, đổi ngôn ngữ |
| 09 | [Offline-First — 4 Lớp Dự Phòng](#chapter-09--offline-first--4-lớp-dự-phòng) | Tải một lần, cache invalidation |
| 10 | [Bản Đồ Số & API Service](#chapter-10--bản-đồ-số--api-service) | Trạng thái POI, danh sách 12 endpoint |
| 11 | [Admin Dashboard (CMS)](#chapter-11--admin-dashboard-cms) | UC07–UC11, luồng quản trị |
| — | [Design Patterns & Key Constants](#summary--design-patterns--key-constants) | Pattern và hằng số quan trọng |
| 12 | [End-to-End Flow](#chapter-12--end-to-end-flow--từ-mở-app-đến-nghe-audio) | Từ quét QR cổng chùa đến nghe audio |
| — | [Technology Stack & Cost Analysis](#appendix--technology-stack--cost-analysis) | Công nghệ, phản biện v2.0 → v2.1, lộ trình |

## Số liệu hệ thống

| Chỉ số | Giá trị |
|---|---|
| Tác nhân (Actor) ngoài hệ thống | **3** (Khách tham quan, Quản trị viên, CI/CD Runner) |
| Lớp Backend | **3** (Controller → Service → Repository) |
| Use Case | **15** (UC01–UC11 + UC-BE-01 đến UC-BE-04) |
| RESTful API endpoints | **12** (+ Telemetry API, đường dẫn chưa định nghĩa) |
| Bảng CSDL | **5** (`campuses`, `pois`, `poi_media`, `admin_users`, `listening_analytics`) |
| Bán kính Geofence | **5 – 100 m** |
| Ngôn ngữ hỗ trợ | **2** (VI, EN), sẵn sàng mở rộng |
| Code coverage tối thiểu (Service Layer) | **≥ 80%** |

---

## Chapter 00 — Kiến Trúc Tổng Quan

Backend tổ chức theo **3 lớp (3-Tier)**: `Presentation / Controller` → `Business Logic / Service` → `Data Access / Repository`. Các tầng phụ thuộc **một chiều** (Controller chỉ gọi Service, Service chỉ gọi Repository, Repository mới chạm CSDL); **cấm Controller truy vấn trực tiếp Database**. Tầng nghiệp vụ không phụ thuộc công nghệ CSDL bên dưới, nhờ đó dễ unit test và dễ bảo trì, mở rộng.

```mermaid
flowchart TB
    subgraph Client["Client: Mobile Web App (Zero-Install)"]
        WEB["End-User Web App<br/>Bản đồ, Geofence, Audio, Quét QR"]
        CMS["Admin CMS<br/>POI, Media, Xuất QR"]
    end

    subgraph T1["Tầng 1: Presentation / Controller"]
        CTRL["Auth, Campus, POI, Media, Analytics Controller"]
        MW["DTO Validators, JWT Auth, Rate Limit, Global Exception Handler"]
    end

    subgraph T2["Tầng 2: Business Logic / Service"]
        SVC["AuthService, CampusService, POIService,<br/>MediaStorageService, AudioStreamService,<br/>QRCodeService, GeofenceHelper"]
    end

    subgraph T3["Tầng 3: Data Access / Repository"]
        REPO["User, Campus, POI, Media, Analytics Repository<br/>Entities ORM + Connection Pool"]
    end

    DB[("PostgreSQL")]
    STORE[("Storage: Local / Cloudinary / S3")]
    CACHE[("Redis / Memory Cache<br/>ETag, version")]
    CICD["GitHub Actions Runner<br/>(Actor hệ thống)"]

    WEB -->|"REST JSON, HTTP 206"| CTRL
    CMS -->|"REST + JWT"| CTRL
    CTRL --> SVC
    SVC --> REPO
    SVC --> CACHE
    REPO --> DB
    REPO --> STORE
    CICD -.->|"test, build, deploy"| T1
```

### Tác nhân (Actors) — theo chuẩn UML

Actor phải là thực thể **nằm ngoài** biên giới hệ thống. Vì vậy "Hệ thống Backend 3 lớp" (có trong PRD v2.0) **không còn là Actor**, thay bằng:

| Tác nhân | Phân loại | Vai trò và hành vi |
|---|---|---|
| **Khách tham quan / Phật tử** (Mobile Web App) | Human Actor | Gửi HTTP Request lấy dữ liệu bản đồ, tải POI qua mã QR, stream audio thuyết minh, gửi log tương tác |
| **Quản trị viên** (Admin CMS) | Human Actor | Đăng nhập CMS, gọi API bảo mật (JWT) để CRUD di tích, tải media, cấu hình tọa độ và bán kính Geofence, xuất mã QR |
| **Hệ thống CI/CD** (GitHub Actions Runner) | System Actor | Môi trường tự động kích hoạt khi có commit/PR: linter, unit test, integration test, build Docker, ra lệnh deploy |

### Ba tầng và thành phần

| Tầng | Thành phần cốt lõi | Nhiệm vụ chính |
|---|---|---|
| **1. Presentation / API Controller** | Auth, Campus, POI, Media, Analytics Controller; DTO Validators; JWT Auth, Rate Limit, Error Middleware | Nhận HTTP request, validate DTO, gọi Service, đóng gói response với status code chuẩn RESTful (200, 201, 206, 304, 400, 401, 404, 500) |
| **2. Business Logic (Service)** | AuthService, CampusService, POIService, MediaStorageService, AudioStreamService, QRCodeService, GeofenceHelper | Toàn bộ quy tắc nghiệp vụ: băm mật khẩu, xoay vòng JWT, khóa tài khoản, ETag/versioning, kiểm tra Geofence, thẩm định bitrate MP3, chunk Range Request, sinh QR, điều phối transaction |
| **3. Data Access (Repository)** | User, Campus, POI, Media, Analytics Repository; Entities (ORM); Database Connection Pool | CRUD trực tiếp lên CSDL (SQL / ORM), quản lý connection pool và transaction |

### Cấu trúc thư mục 3 lớp

```text
vietnamquoctu-backend/
├── .github/workflows/
│   └── backend-ci-cd.yml            # Pipeline CI/CD hoàn chỉnh
├── src/
│   ├── presentation/                # TẦNG 1: Controllers
│   │   ├── controllers/             # auth, campus, poi, media, analytics
│   │   ├── middlewares/             # jwt-auth, rate-limit, error (Global Exception Handler)
│   │   └── dtos/                    # DTOs và Validation Schemas
│   ├── business-logic/              # TẦNG 2: Services
│   │   ├── services/                # auth, campus, poi, qr-code, audio-stream, media-storage
│   │   └── helpers/geofence.helper.ts   # Haversine và tính toán không gian
│   ├── data-access/                 # TẦNG 3: Repositories
│   │   ├── repositories/            # user, campus, poi, media, analytics
│   │   ├── entities/                # ORM Models (Prisma / TypeORM)
│   │   └── database.connection.ts   # Connection Pool
│   ├── tests/
│   │   ├── unit/                    # Unit Test tầng Service (Jest)
│   │   └── integration/             # Integration Test API (Supertest)
│   ├── app.ts
│   └── server.ts
├── Dockerfile                       # Multi-stage
├── docker-compose.yml               # Cấu hình Production Server
└── package.json
```

### Bản đồ Use Case

| UC | Tên | Actor | Chương |
|---|---|---|---|
| UC01 | Khởi tạo ứng dụng và cấp quyền | Khách tham quan | 01–02 |
| UC02 | Tương tác bản đồ | Khách tham quan | 10 |
| UC03 | Nghe thuyết minh tự động (Geofencing GPS) | Khách tham quan | 04 |
| UC04 | Xem và nghe thủ công | Khách tham quan | 04, 05 |
| UC05 | Quét mã QR dự phòng trong nhà (Cache-First + Deep Link) | Khách tham quan | 04, 05 |
| UC06 | Chuyển đổi ngôn ngữ | Khách tham quan | 08 |
| UC07 | Đăng nhập và xác thực Admin | Quản trị viên | 07 |
| UC08 | Quản lý quần thể (Campus) | Quản trị viên | 11 |
| UC09 | Quản lý điểm tham quan (POI) | Quản trị viên | 05, 11 |
| UC10 | Quản lý nội dung đa ngôn ngữ và media | Quản trị viên | 06 |
| UC11 | Tự động sinh và xuất mã QR | Quản trị viên | 06 |
| **UC-BE-01** | Truyền phát âm thanh (Audio Range Streaming) | Khách tham quan | 06 |
| **UC-BE-02** | Đồng bộ dữ liệu và kiểm tra phiên bản (Cache Invalidation) | Khách tham quan | 01–02, 05, 09 |
| **UC-BE-03** | Cấp phát, làm mới, thu hồi token (Token Lifecycle) | Quản trị viên | 07 |
| **UC-BE-04** | Tự động hóa kiểm thử và triển khai (CI/CD) | CI/CD Runner | 01–02 |

> Từ UC01 đến UC06 là hành vi phía Client. Để cân đối với Đề tài 2 (Backend), v2.1 viết lại các UC này theo **luồng xử lý 3 lớp** (xem ví dụ ở Chapter 05) và bổ sung 4 UC-BE ở trên.

### Database Tables

CSDL quan hệ **PostgreSQL**, truy cập qua ORM (Prisma / TypeORM) hoặc Query Builder.

| Bảng | Module | Cột chính / Mục đích |
|---|---|---|
| `campuses` | campus | `id, name, address, latitude, longitude, boundary_polygon, status, created_at,` **`data_version`**. Quần thể, Bounding Box, trạng thái (Hoạt động / Sắp ra mắt), chuỗi phiên bản dữ liệu |
| `pois` | poi | `id, campus_id, title_vi, title_en, description_vi, description_en, latitude, longitude, geofence_radius, qr_code_url, is_active, display_order, created_at,` **`location_type, is_deleted, deleted_at`**. Điểm tham quan; `location_type` là `OUTDOOR` (GPS) hoặc `INDOOR` (QR); xóa mềm |
| `poi_media` | media | `id, poi_id, media_type ['IMAGE','AUDIO_VI','AUDIO_EN'], file_url, file_size, duration_seconds, display_order`. Ảnh và audio thuyết minh |
| `admin_users` | auth | `id, username, email, password_hash, full_name, role ['SUPER_ADMIN','EDITOR'], is_active, last_login,` **`failed_login_attempts, locked_until, refresh_token_hash`**. Tài khoản quản trị, chống brute-force, refresh token |
| `listening_analytics` | analytics | `id, poi_id, language_code, trigger_source ['GPS_GEOFENCE','QR_CODE','MANUAL_CLICK'], duration_listened_seconds, completed, created_at`. Thống kê lượt nghe (POI nào được nghe nhiều, ngôn ngữ phổ biến, thời lượng trung bình) |

**Migration cập nhật schema (v2.1):**

```sql
-- 1. Chống brute-force và Refresh Token cho admin_users
ALTER TABLE admin_users ADD COLUMN failed_login_attempts INT DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN locked_until TIMESTAMP NULL;
ALTER TABLE admin_users ADD COLUMN refresh_token_hash VARCHAR(255) NULL;

-- 2. Xóa mềm và phân loại không gian cho pois
ALTER TABLE pois ADD COLUMN location_type VARCHAR(20) DEFAULT 'OUTDOOR'; -- 'OUTDOOR' (GPS) hoặc 'INDOOR' (QR)
ALTER TABLE pois ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE pois ADD COLUMN deleted_at TIMESTAMP NULL;

-- 3. Phiên bản dữ liệu cho campuses
ALTER TABLE campuses ADD COLUMN data_version VARCHAR(50) DEFAULT 'v1.0.0';

-- 4. Thống kê lượt nghe thuyết minh
CREATE TABLE listening_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poi_id UUID REFERENCES pois(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL,          -- 'vi' hoặc 'en'
    trigger_source VARCHAR(20) NOT NULL,         -- 'GPS_GEOFENCE' | 'QR_CODE' | 'MANUAL_CLICK'
    duration_listened_seconds INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Chapter 01–02 — Luồng Khởi Động (Backend + Frontend)

### Backend Startup & Deployment Sequence (CI/CD)

Toàn bộ quy trình được khai báo bằng YAML: `.github/workflows/backend-ci-cd.yml` (UC-BE-04, Actor: GitHub Actions Runner). Mọi commit phải vượt **100% test tự động** trước khi merge vào nhánh production.

```mermaid
flowchart LR
    A["Push / Pull Request"] --> B["CI 1: Linter + Format"]
    B --> C["CI 2: Unit Test<br/>coverage >= 80%"]
    C --> D["CI 3: Integration Test<br/>Supertest + PostgreSQL service"]
    D -->|"fail: chặn merge"| X["Báo lỗi"]
    D -->|"merge vào main"| E["CI 4: Build Docker Image<br/>multi-stage"]
    E --> F["CD 1: Push Docker Hub<br/>GitHub Secrets"]
    F --> G["CD 2: SSH Deploy VPS<br/>Docker Compose"]
    G --> H["Container mới chạy"]
```

| Giai đoạn | Công cụ / Bước thực thi | Mục tiêu và tiêu chí nghiệm thu |
|---|---|---|
| **Cục bộ** | Nhánh tính năng, Unit Test tầng Service, Integration Test cho API | Dev tự kiểm thử trước khi push |
| **CI Step 1** | Static Code Analysis (ESLint / Prettier) | Kiểm tra coding style, lỗi cú pháp, biến không dùng |
| **CI Step 2** | Unit Testing (Jest) | Test độc lập logic BLL: Haversine, validate bán kính Geofence, chữ ký JWT. **Coverage ≥ 80%** |
| **CI Step 3** | Integration Testing (Supertest) | Test luồng gọi API tới Controllers với **PostgreSQL thật** chạy bằng Service Container |
| **CI Step 4** | Build & Docker Containerization | Image tối ưu (multi-stage) |
| **CD Step 1** | Push to Docker Hub / Registry | Đẩy image đã kiểm định, thông tin đăng nhập lấy từ GitHub Secrets |
| **CD Step 2** | Automated Deploy to Server | SSH vào VPS, pull image mới, khởi động lại container bằng Docker Compose |

**Workflow mẫu** (`.github/workflows/backend-ci-cd.yml`):

```yaml
name: Backend 3-Tier CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  continuous-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 18.x
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Step 1 - Static Code Analysis (Linter)
        run: npm run lint

      - name: Step 2 - Unit Tests (Service Layer - Jest)
        run: npm run test:unit -- --coverage
        env:
          CI: true

      - name: Step 3 - Integration Tests (Supertest with Postgres Service)
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost:5432/test_db
          JWT_SECRET: test_jwt_secret_key_12345

      - name: Step 4 - Build Docker Image (Multi-stage)
        run: docker build -t vietnamquoctu-backend:latest .

  continuous-deployment:
    needs: continuous-integration
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/vietnamquoctu-backend:latest

      - name: Deploy to VPS Server via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /app/vietnamquoctu-backend
            docker pull ${{ secrets.DOCKER_HUB_USERNAME }}/vietnamquoctu-backend:latest
            docker compose down
            docker compose up -d --remove-orphans
            docker system prune -f
```

> ⚠️ **Hai điểm cần lưu ý (nhận xét của tài liệu này, không có trong báo cáo):** (1) script deploy dùng `docker compose down` rồi `up` nên dịch vụ **bị ngắt trong lúc khởi động lại**, mâu thuẫn với mục tiêu Zero-Downtime / rolling update của PRD. Muốn đạt đúng mục tiêu cần reverse proxy kèm blue-green hoặc chạy `up -d` thay cho `down`. (2) Chỉ gắn tag `latest` khiến khó rollback; nên gắn thêm tag theo commit SHA.

**Khởi tạo runtime backend** *(thứ tự cụ thể là đề xuất; tài liệu gốc không mô tả chi tiết)*: kết nối PostgreSQL qua connection pool → gắn JWT Auth, Rate Limit, DTO Validators và Global Exception Handler → mount các route dưới `/api/v1/*`.

### Frontend Startup Flow

```
Quét QR / mở link → Welcome Screen → "Bắt đầu chuyến chiêm bái" → Xin quyền GPS → Kiểm tra version → (cần thì) GET /pois → LocalStorage → Render bản đồ
```

| Bước | Mô tả |
|---|---|
| 🔊 **Mở khóa Autoplay** | Nút "Bắt đầu chuyến chiêm bái" khởi tạo `AudioContext` và phát buffer im lặng dài **0.1 giây**, đánh dấu trình duyệt ở trạng thái *User Activated* để các bài thuyết minh Geofencing tự phát suốt phiên tham quan (Safari iOS, Chrome Android) |
| 🧭 **Cấp quyền GPS** | Chọn *Cho phép* → hiện bản đồ. Chọn *Từ chối* → hướng dẫn bật lại quyền, vẫn cho khám phá thủ công hoặc quét QR |
| 🔄 **Kiểm tra phiên bản (UC-BE-02)** | Gửi request nhẹ (payload < 100 byte) `GET /api/v1/campuses/viet-nam-quoc-tu/version`. Trùng version trong LocalStorage thì giữ cache; server có bản mới thì tự tải lại danh sách POI |
| 💾 **Tải dữ liệu** | `GET /api/v1/campuses/viet-nam-quoc-tu/pois` (kèm `If-None-Match`), rồi lưu POI vào RAM / LocalStorage để dùng cả phiên |
| 📴 **Mất mạng khi tải** | Có cache LocalStorage thì dùng tạm; không có thì báo lỗi mạng kèm nút **Thử lại** |
| 🗺️ **Render bản đồ** | Hiển thị chấm xanh vị trí kèm vòng sai số GPS và các Marker POI |

> **Business rule:** nút "Bắt đầu" bắt buộc kích hoạt một thao tác âm thanh rỗng để vượt chính sách Autoplay (BR01-1); dữ liệu POI lưu LocalStorage để tái sử dụng xuyên suốt phiên (BR01-2).

---

## Chapter 04 — GPS + Geofence + Audio Narration

Luồng Geofence xử lý đồng thời nhiễu GPS, tiết kiệm pin và chống phát lặp. Ba con số cần nhớ: cập nhật vị trí **1–3 giây**, bán kính kích hoạt **5–100 m** (cấu hình theo từng POI), vùng đệm reset **15 m**. Toàn bộ phép so khớp Haversine chạy **100% phía client** (BR03-3).

### 6 Giai Đoạn Xử Lý

1. **Khởi tạo và mở khóa audio**: Welcome Screen → bấm "Bắt đầu chuyến chiêm bái" → `AudioContext` rỗng.
2. **Lấy GPS và nạp dữ liệu**: xin quyền vị trí → kiểm tra version → gọi API POI → lưu LocalStorage.
3. **Giám sát vị trí**: `watchPosition` chu kỳ 1–3 giây; mỗi tọa độ mới `(lat, lng)` tính khoảng cách `d` tới từng POI bằng **Haversine**; vẽ vòng sai số (accuracy radius).
4. **Kiểm tra Geofence**: kích hoạt khi `d ≤ R` **và** POI chưa nằm trong `Visited_POIs`. Nhiều POI cùng thỏa điều kiện thì phát POI **gần nhất**, các POI còn lại vào hàng đợi.
5. **Kích hoạt thuyết minh**: đọc ngôn ngữ hiện tại (VI/EN) → rung thiết bị (haptic) → popup POI → tự phát audio → thêm POI vào `Visited_POIs` → icon chuyển sang *Đang xem*.
6. **Hoàn tất và reset**: audio phát hết → icon *Đã xem*. Khi du khách ra xa `d > R + 15 m` thì gỡ POI khỏi `Visited_POIs` để có thể kích hoạt lại.

```
a = sin²(Δlat / 2) + cos(lat1) · cos(lat2) · sin²(Δlon / 2)
c = 2 · atan2(√a, √(1 − a))
d = R_earth · c          (R_earth ≈ 6.371.000 m)
```

Với 15–20 POI, thời gian tính toán dưới **0.5 ms**.

### 3 Chế Độ Phát Audio

| Ưu tiên | Chế độ | Kích hoạt | Hành vi |
|---|---|---|---|
| 1 (cao nhất) | **QR Indoor** (UC05) | Du khách bấm "Quét mã QR", camera đọc `POI_ID` | **Cache-First:** có POI trong LocalStorage thì mở ngay. **Cold-start (chưa có cache, quét thẳng từ camera điện thoại):** gọi `GET /api/v1/pois/:id`, backend trả POI đó **kèm toàn bộ danh sách POI** để client nạp bổ sung vào LocalStorage. Sau đó bỏ qua GPS, ngắt audio khác, phát audio, ghi `POI_ID` vào `Visited_POIs` để GPS không phát lặp khi bước ra ngoài |
| 2 | **Geofencing GPS** (UC03) | `d ≤ R` ngoài trời | Rung, popup, tự phát audio theo ngôn ngữ hiện tại |
| 3 | **Thủ công** (UC04) | Chạm Marker POI → Bottom Drawer → "Nghe thuyết minh" | Trình phát đủ Play / Pause / Tua 10s / Seekbar; đóng Drawer thì dừng audio |
| Fallback | **Chỉ văn bản** | Audio lỗi hoặc trình duyệt chặn phát | Audio lỗi: hiện bài viết kèm "Không thể tải audio". Bị chặn Autoplay: hiện nút lớn "Bấm để nghe thuyết minh" |

> **Quy tắc đơn âm:** tại mỗi thời điểm toàn hệ thống chỉ có **một** audio được phát (BR04-1). Chọn POI khác khi đang phát thì audio cũ dừng và chuyển sang audio mới.

> **Chống nhấp nháy (Hysteresis Reset):** sai số GPS tự nhiên ±3 đến ±8 m có thể làm khoảng cách nhảy giữa 14.8 m và 15.2 m khi `R = 15 m`, gây audio tắt rồi phát lại liên hồi. Vì vậy POI chỉ được gỡ khỏi `Visited_POIs` khi `d_current > R + 15 m`.

> **Phân loại không gian:** cột `pois.location_type` (`OUTDOOR` / `INDOOR`) cho biết POI dùng GPS hay QR. Ví dụ quảng trường lớn trước Chánh Điện cần `R` khoảng 50 m, còn các gian thờ nhỏ trong Nhà Tổ cách nhau chỉ 5 m.

---

## Chapter 05 — Module Content — POI Lifecycle

| Endpoint | Chức năng |
|---|---|
| `GET /api/v1/campuses/viet-nam-quoc-tu/pois` | API công khai nặng nhất: trả toàn bộ POI (chỉ `is_active = true` và `is_deleted = false`), tọa độ, media. Hỗ trợ `If-None-Match` / **ETag**, dữ liệu chưa đổi thì trả `304 Not Modified` |
| `GET /api/v1/campuses/viet-nam-quoc-tu/version` | Trả `{ "version": "...", "last_updated": "..." }` để client biết cần tải lại cache hay không (UC-BE-02) |
| `GET /api/v1/pois/:id` | Chi tiết một POI **kèm toàn bộ danh sách POI**, phục vụ quét QR lần đầu khi LocalStorage rỗng (Deep Link) |
| `POST /api/v1/admin/pois` · `PUT /api/v1/admin/pois/:id` | *(JWT)* Thêm, sửa POI: tọa độ, bán kính Geofence, nội dung song ngữ. Mỗi lần đổi dữ liệu, `campuses.data_version` được cập nhật |
| `DELETE /api/v1/admin/pois/:id` | *(JWT)* **Xóa mềm**: chỉ đặt `is_deleted = true, deleted_at = NOW()` trong một SQL Transaction. Không xóa file media ngay |

### Ví dụ luồng 3 lớp: lấy dữ liệu POI khuôn viên

1. **Presentation:** client gọi `GET /api/v1/campuses/viet-nam-quoc-tu/pois` kèm `If-None-Match`. `CampusController` gọi `CampusService.getCampusPOIs(campusSlug, clientETag)`.
2. **Business Logic:** `CampusService` kiểm tra ETag trong Redis / Memory Cache. Chưa đổi → trả `304 Not Modified`, kết thúc sớm. Đã đổi → gọi `POIRepository.findActiveByCampusId(campusId)`.
3. **Data Access:** `POIRepository` truy vấn (ORM Prisma / TypeORM), tương đương:

```sql
SELECT * FROM pois
JOIN poi_media ON pois.id = poi_media.poi_id
WHERE campus_id = ? AND is_deleted = false AND is_active = true;
```

4. **Response:** DTO đóng gói JSON gồm thông tin song ngữ (VI/EN), tọa độ, danh sách URL media và ETag mới; Controller trả `200 OK`.

### Xóa mềm giải quyết lỗi giao dịch media

Database Transaction chỉ rollback được bản ghi SQL, **không rollback được thao tác xóa file** trên Cloudinary / S3. Xóa file trước mà DB lỗi thì mất file vĩnh viễn; commit DB trước mà xóa cloud timeout thì sinh rác (Orphaned Media). Cách xử lý: Soft Delete trong một transaction, rồi **Background Worker quét định kỳ 30 ngày** để dọn file vật lý của các bản ghi đã xóa mềm.

**Validate ở Service Layer (DTO + nghiệp vụ):**

- Kinh độ `[-180, 180]`, vĩ độ `[-90, 90]`, tọa độ lưu **≥ 6 chữ số thập phân** (sai số < 0.1 m).
- Bán kính Geofence trong khoảng `5 ≤ R ≤ 100` (m).
- Tọa độ phải nằm trong ranh giới khuôn viên, ngoài ranh giới trả lỗi `Tọa độ ngoài ranh giới Việt Nam Quốc Tự`.
- Độ dài bài viết mô tả được kiểm tra; mô tả tiếng Việt bắt buộc, tiếng Anh khuyến khích.

### 3-Tier Content Fallback

| Tầng | Nội dung | Mô tả |
|---|---|---|
| **Tier 1** | Đúng ngôn ngữ đã chọn | Trả bài viết và audio theo ngôn ngữ du khách chọn (`*_vi` hoặc `*_en`) |
| **Tier 2** | Tiếng Việt mặc định | POI chưa có bản dịch tiếng Anh: hiện nội dung tiếng Việt kèm ghi chú nhỏ `Chưa có bản dịch tiếng Anh` |
| **Tier 3** | Chỉ văn bản | Audio không tải được: vẫn hiển thị ảnh và bài viết mô tả |

---

## Chapter 06 — Module Audio / Media & QR Code

Hệ thống dùng **tệp MP3 do Admin tải lên** cho từng ngôn ngữ (không sinh giọng đọc tự động), phục vụ qua **Range Streaming**, cùng `QRCodeService` để sinh mã in dán thực địa.

### MediaStorageService — Xử lý tệp

| Hạng mục | Quy tắc |
|---|---|
| Ảnh minh họa | JPG, PNG, WebP; **≤ 5 MB** mỗi ảnh; có nén ảnh |
| Audio thuyết minh | **MP3**, bitrate **128 – 320 kbps**, **≤ 20 MB** mỗi tệp. Bitrate được thẩm định bằng thư viện đọc metadata (`music-metadata` trên Node.js, `taglib-sharp` trên .NET) |
| Đặt tên chuẩn | `audio_vi.mp3`, `audio_en.mp3` |
| Lưu trữ | Local Storage hoặc Cloudinary / S3, metadata ở bảng `poi_media` |
| API | `POST /api/v1/admin/pois/:id/media` *(JWT, Multipart Form-Data)* |
| Lỗi | Sai định dạng, sai bitrate hoặc vượt dung lượng → `400 Bad Request` kèm thông báo chi tiết |
| Dọn rác | Background Worker quét bản ghi xóa mềm mỗi 30 ngày rồi xóa file vật lý |

**Upload Pipeline:**

```
Admin chọn file → Controller nhận Multipart → MediaStorageService (kiểm tra định dạng, dung lượng, bitrate, chuẩn hóa tên) → Repository (lưu file + ghi poi_media) → Trả URL / thông báo thành công
```

### AudioStreamService — Audio Range Streaming (UC-BE-01)

Safari iOS gửi **Range Request** khi người dùng tua Seekbar. Nếu server chỉ trả nguyên file, trình duyệt phải tải lại từ đầu, gây lag và không tua được. Vì vậy backend hỗ trợ **HTTP 206 Partial Content**.

1. Client gửi `GET /api/v1/media/audio/:fileId` kèm header `Range: bytes=start-end`.
2. `MediaController` chuyển tham số cho `AudioStreamService`.
3. Service phân tích header `Range`, tính chunk size, mở stream đọc dữ liệu nhị phân từ Repository / Storage Driver.
4. Controller trả `206 Partial Content` kèm `Content-Range`, `Accept-Ranges: bytes`, `Content-Length` và stream audio.

### QRCodeService — Sinh và xuất mã QR

| Hạng mục | Quy tắc |
|---|---|
| Nội dung mã | URL `https://.../poi/{poi_id}` hoặc chuỗi `POI_ID` chuẩn hóa. Mỗi POI có **một** mã duy nhất |
| Định dạng xuất | **PNG** 1000×1000 px hoặc **SVG** vector; chọn nhiều POI thì nén thành `.zip` |
| Mức sửa lỗi | Error Correction Level **Q hoặc H** (25% – 30%), vẫn đọc tốt khi bảng bị trầy nhẹ |
| Trình bày | Gắn nhãn tên di tích và logo trang nghiêm |
| API | `GET /api/v1/admin/pois/:id/qrcode` *(JWT)* |

> Vì mã QR chỉ chứa ID hoặc URL cố định, nội dung trên server thay đổi thì **mã đã in vẫn dùng được, không cần in lại** (A1 của UC11).

---

## Chapter 07 — Authentication & RBAC

| 🔐 Token Lifecycle (UC-BE-03) | 🔑 Phân quyền |
|---|---|
| **Access Token** hạn **15 phút** | `admin_users.role` gồm `SUPER_ADMIN` và `EDITOR` |
| **Refresh Token** hạn tối đa **7 ngày**, lưu **hash** trong `admin_users.refresh_token_hash`, gửi qua **HttpOnly Cookie** (chống XSS) | `JWT Auth Middleware` ở Tầng 1 chặn mọi route `/api/v1/admin/*` khi thiếu hoặc sai token |
| `POST /api/v1/auth/refresh`: đổi cặp token mới (**Token Rotation**), Admin không cần nhập lại mật khẩu | Du khách (End-User) **không cần đăng nhập** |
| `POST /api/v1/auth/logout`: xóa Refresh Token trong CSDL, vô hiệu hóa phiên ngay | |

**Luồng đăng nhập (UC07):**

```
Admin nhập tài khoản → Controller (POST /auth/login) → AuthService (kiểm tra user, khóa tài khoản, so khớp bcrypt) → ký Access + Refresh Token → trả token → CMS vào Dashboard
```

| Tình huống | Xử lý |
|---|---|
| Sai tài khoản hoặc mật khẩu | `401`, thông báo `Tài khoản hoặc mật khẩu không chính xác`; tăng `failed_login_attempts` |
| Sai quá **5 lần** | Đặt `locked_until` = hiện tại + **15 phút** (chống brute-force); `rate-limit.middleware` hỗ trợ ở Tầng 1 |
| Access Token hết hạn | Gọi `/auth/refresh`; Refresh Token hết hạn hoặc bị thu hồi thì `401` → về trang đăng nhập |
| Mật khẩu | bcrypt, salt round ≥ 10 |

> **Lưu ý:** báo cáo v2.1 chưa đặc tả ma trận quyền chi tiết cho `SUPER_ADMIN` và `EDITOR`, cần bổ sung khi triển khai. Vì mỗi Admin chỉ có một cột `refresh_token_hash`, thiết kế hiện tại ngầm hiểu **một phiên đăng nhập hoạt động cho mỗi tài khoản**.

---

## Chapter 08 — Localization — Đa Ngôn Ngữ 2 Làn

MVP hỗ trợ **Tiếng Việt (VI)** và **Tiếng Anh (EN)**, thiết kế để mở rộng sang Trung (Phồn thể / Giản thể), Nhật, Hàn, Pháp.

| Làn | Phạm vi | Cách hoạt động |
|---|---|---|
| **Làn 1 — Content Locale** | Bài viết, tên di tích, audio | Mỗi POI lưu `title_vi / title_en`, `description_vi / description_en`, `audio_vi.mp3 / audio_en.mp3`. Tiếng Việt bắt buộc, tiếng Anh khuyến khích (thiếu thì cảnh báo `Thiếu nội dung tiếng Anh`) |
| **Làn 2 — UI Labels** | Nhãn giao diện | Biến trạng thái ngôn ngữ toàn cục (i18n state), lưu vào LocalStorage |

**Luồng đổi ngôn ngữ (UC06):** bấm biểu tượng lá cờ → chọn Tiếng Việt 🇻🇳 hoặc English 🇬🇧 → lưu LocalStorage → cập nhật nhãn giao diện và bài viết → đổi đường dẫn audio sang `audio_en.mp3` hoặc `audio_vi.mp3`.

> **Điểm mấu chốt:** đang phát audio mà đổi ngôn ngữ thì hệ thống **dừng audio cũ, nạp audio ngôn ngữ mới và đặt ở đầu bài sẵn sàng phát**. Ngôn ngữ mới áp dụng cho mọi lần kích hoạt Geofence hoặc quét QR tiếp theo. Dữ liệu thống kê lượt nghe ghi nhận kèm `language_code`.

---

## Chapter 09 — Offline-First — 4 Lớp Dự Phòng

Mục tiêu: giảm chi phí tính toán cho server và giữ trải nghiệm mượt trên mạng 4G/5G chập chờn.

| Lớp | Tên | Mô tả |
|---|---|---|
| **Lớp 1** | Tải một lần + Đồng bộ phiên bản | Tọa độ và metadata POI tải **một lần** lúc mở Web App, lưu RAM / LocalStorage. Khi Ban Quản trị đổi nội dung hoặc vị trí, `data_version` trên server đổi theo; client kiểm tra bằng `GET .../version` và ETag rồi **tự tải lại** (Cache Invalidation, UC-BE-02) |
| **Lớp 2** | Tính toán Client-side | Haversine chạy trên trình duyệt: giảm 100% chi phí tính toán server, phản hồi tức thì, tiết kiệm pin và băng thông, backend không quá tải ở ngày đại lễ |
| **Lớp 3** | Dự phòng mạng và bản đồ | Mất mạng: dùng cache LocalStorage (không có thì báo lỗi + nút **Thử lại**). Lỗi tải Map Tile: hiển thị nền sơ đồ vector tối giản lưu sẵn trong máy. Quét QR khi LocalStorage rỗng (**cold-start**) được xử lý bằng `GET /pois/:id` |
| **Lớp 4** | Dự phòng định vị | GPS mất hoặc sai số **> 50 m**: cảnh báo `Tín hiệu GPS không ổn định`, ẩn chấm xanh, chuyển sang **quét QR** hoặc chọn POI thủ công |

> **Ghi chú phạm vi:** tài liệu nguồn nêu lưu dữ liệu POI vào LocalStorage, nhưng **chưa quy định** Service Worker / PWA, cache tệp ảnh và MP3 offline hay gói bản đồ offline. Nếu cần các tính năng này, bổ sung vào PRD trước khi triển khai.

---

## Chapter 10 — Bản Đồ Số & API Service

### 3 trạng thái POI

| Trạng thái | Màu icon | Ý nghĩa |
|---|---|---|
| **Chưa xem** | Xám / Vàng nhạt | Du khách chưa nghe thuyết minh |
| **Đang xem / Đang phát** | Đỏ cam nhấp nháy | Audio đang phát |
| **Đã xem** | Xanh lá | Audio đã phát hết |

**Tính năng bản đồ phía du khách (UC02):** sơ đồ mặt bằng khuôn viên tông màu trang nhã; chấm xanh vị trí kèm vòng sai số GPS tự cập nhật; phóng to, thu nhỏ, xoay, kéo; **Bounding Box** giới hạn vùng xem quanh khuôn viên; chạm POI để mở Card tóm tắt và Drawer chi tiết.

**Bản đồ phía Admin (UC09):** bản đồ vệ tinh / sơ đồ, nhấp hoặc kéo thả Marker để lấy kinh độ, vĩ độ chính xác 6 chữ số thập phân; chọn `location_type` (`OUTDOOR` / `INDOOR`); cấu hình bán kính và hiển thị vòng tròn Geofence trực quan.

**POI trong MVP (8 – 10 điểm):** Cổng Tam Quan, Bảo Tháp 13 Tầng, Đại Chánh Điện, Tháp Đại Hồng Chung, Nhà Tổ, Phòng Trưng Bày Văn Hóa Phật Giáo, Thư Viện Phật Học, Vườn Cảnh Quan. Khu vực **trong nhà** cần mã QR dự phòng: Đại Chánh Điện, Phòng Trưng Bày, Thư Viện.

### Backend API Service

| Endpoint | Mô tả | Quyền |
|---|---|---|
| `POST /api/v1/auth/login` | Đăng nhập quản trị, cấp Access + Refresh Token | Công khai |
| `POST /api/v1/auth/refresh` | Làm mới token (Token Rotation) | Refresh Token (Cookie) |
| `POST /api/v1/auth/logout` | Thu hồi Refresh Token | Đã đăng nhập |
| `GET /api/v1/campuses/viet-nam-quoc-tu/version` | Kiểm tra phiên bản dữ liệu (payload < 100 byte) | Công khai |
| `GET /api/v1/campuses/viet-nam-quoc-tu/pois` | Tải toàn bộ POI + media (ETag / 304) | Công khai |
| `GET /api/v1/pois/:id` | Chi tiết POI kèm toàn bộ danh sách POI (quét QR cold-start) | Công khai |
| `GET /api/v1/media/audio/:fileId` | Stream audio, `206 Partial Content` | Công khai |
| `POST /api/v1/admin/pois` | Thêm POI kèm tọa độ và bán kính Geofence | JWT |
| `PUT /api/v1/admin/pois/:id` | Sửa thông tin, tọa độ, nội dung song ngữ | JWT |
| `DELETE /api/v1/admin/pois/:id` | Xóa mềm POI trong một Transaction | JWT |
| `POST /api/v1/admin/pois/:id/media` | Tải lên MP3 hoặc ảnh minh họa | JWT |
| `GET /api/v1/admin/pois/:id/qrcode` | Xuất mã QR (SVG / PNG) | JWT |

> Ngoài ra có **Telemetry API** (`analytics.controller`) nhận log lượt nghe vào `listening_analytics`; đường dẫn cụ thể chưa được định nghĩa trong báo cáo. Cột *Quyền* của các endpoint mới do tài liệu này suy ra từ vai trò Actor. Mục tiêu độ trễ phản hồi API: **< 200 ms**.

---

## Chapter 11 — Admin Dashboard (CMS)

Platform có hai cổng: **End-User Web App** và **Admin CMS** do Ban Quản trị chùa vận hành, cùng chạy trên Backend 3 lớp. *(Trợ lý AI / Chatbot RAG nằm ngoài phạm vi MVP.)*

| Use Case | Chức năng | Điểm chính |
|---|---|---|
| **UC07 / UC-BE-03** Xác thực | Đăng nhập CMS, làm mới, đăng xuất | Access 15 phút, Refresh 7 ngày (HttpOnly), khóa 15 phút sau 5 lần sai |
| **UC08** Campus | Quản lý quần thể | Tên, địa chỉ, tọa độ tâm, Bounding Box, trạng thái *Hoạt động / Sắp ra mắt* (hiện banner phía người dùng) |
| **UC09** POI | Thêm, sửa, xóa POI | Chấm tọa độ trên bản đồ vệ tinh, bán kính 5–100 m, phân loại `INDOOR/OUTDOOR`, **xóa mềm** |
| **UC10** Nội dung | Bài viết song ngữ và media | Form 2 tab (Tiếng Việt / English), ảnh ≤ 5 MB, MP3 ≤ 20 MB (kiểm tra bitrate), nghe thử audio trước khi lưu |
| **UC11** QR | Xuất mã QR | PNG 1000×1000 hoặc SVG, xuất lẻ hoặc ZIP, ECC Q/H |

### Admin Management Flow

```
Đăng nhập CMS → Quản lý POI → Chấm tọa độ trên bản đồ → Nhập bán kính (5–100m) + location_type → Nhập nội dung song ngữ → Tải ảnh + MP3 → Lưu → Backend 3 lớp xử lý → Cập nhật data_version → Tự sinh QR PNG/SVG
```

**Xử lý phía Backend 3 lớp:** Controller nhận Multipart Form-Data → BLL kiểm tra dung lượng (ảnh < 5 MB, audio < 20 MB), bitrate MP3 và chuẩn hóa tên file → DAL lưu file vào Storage (hoặc Cloudinary / S3) và ghi bản ghi vào CSDL → trả phản hồi thành công và tự động sinh mã QR cho POI.

---

## Summary — Design Patterns & Key Constants

### Architecture Patterns

| Pattern | Mô tả | Tham chiếu |
|---|---|---|
| **3-Tier Architecture** | Controller → Service → Repository, phân tách trách nhiệm (SoC) | PRD §5.3, §10.1 |
| **Single-Direction Dependency** | Mỗi tầng chỉ gọi tầng ngay dưới; cấm Controller chạm DB | PRD §7.4 |
| **DTO Validation & Sanitization** | Validate chặt kiểu dữ liệu, khoảng tọa độ, bán kính, độ dài bài viết | PRD §7.4 |
| **Repository Pattern** | Đóng gói truy vấn qua ORM / SQL, giao diện sạch cho Service | PRD §5.3 |
| **Soft Delete + Background Worker** | Đánh dấu `is_deleted` trong một transaction, dọn file vật lý sau 30 ngày | Báo cáo B3.2 |
| **ETag / Data Versioning** | `If-None-Match` → `304`, endpoint `/version` để cache invalidation | Báo cáo B2, UC-BE-02 |
| **Cache-First + Deep Link** | Quét QR ưu tiên LocalStorage, thiếu thì gọi `GET /pois/:id` | Báo cáo B3.1 |
| **HTTP Range Streaming** | `206 Partial Content` cho audio, tua mượt trên Safari iOS | Báo cáo UC-BE-01 |
| **Token Rotation** | Access 15 phút + Refresh 7 ngày (hash trong DB, HttpOnly Cookie) | Báo cáo UC-BE-03 |
| **Account Lockout / Rate Limit** | `failed_login_attempts`, `locked_until`, rate-limit middleware | Báo cáo B5 |
| **Client-side Geofencing** | Tải POI một lần, Haversine chạy trên trình duyệt | PRD §7.1 |
| **Hysteresis / Visited Buffer** | Chống phát lặp tại biên bán kính, reset khi `d > R + 15 m` | PRD §7.2 |
| **Autoplay Unlock** | `AudioContext` + buffer im lặng 0.1s sau thao tác chạm đầu tiên | PRD §7.3 |
| **Single-Audio Rule** | Chỉ một audio phát tại một thời điểm, QR có ưu tiên cao nhất | UC04, UC05 |
| **CI/CD as Code** | GitHub Actions YAML, merge chỉ khi 100% test pass | PRD §10.4 |
| **Containerization** | Docker multi-stage, deploy bằng Docker Compose | PRD §5.3, §6.6 |

### Key Constants

| Hằng số | Giá trị | Tham chiếu |
|---|---|---|
| Bán kính Geofence `R` | **5 – 100 m** (theo từng POI) | BR09-1 (v2.1) |
| Vùng đệm reset (Hysteresis) | 15 m (`d > R + 15`) | PRD §7.2 |
| Chu kỳ cập nhật GPS | 1 – 3 giây | PRD §5.1 |
| Ngưỡng cảnh báo GPS kém | sai số > 50 m | UC02 A1 |
| Bán kính Trái Đất (Haversine) | ≈ 6.371.000 m | PRD §7.1 |
| Thời gian tính Haversine | < 0.5 ms cho 15–20 POI | PRD §7.1 |
| Buffer âm thanh im lặng | 0.1 giây | PRD §7.3 |
| Độ chính xác tọa độ lưu | ≥ 6 chữ số thập phân (< 0.1 m) | BR09-2 |
| Ảnh minh họa | JPG / PNG / WebP, ≤ 5 MB | UC10 |
| Audio thuyết minh | MP3 128–320 kbps, ≤ 20 MB (đọc bằng `music-metadata`) | UC10, BR10-2 (v2.1) |
| Mã QR xuất | PNG 1000×1000 px / SVG, ECC Q hoặc H | UC11, BR11-2 |
| bcrypt salt rounds | ≥ 10 | BR07-1 |
| Access Token | **15 phút** | BR07-2 (v2.1) |
| Refresh Token | **tối đa 7 ngày**, HttpOnly Cookie | BR07-2 (v2.1) |
| Khóa đăng nhập | sai > 5 lần → khóa 15 phút | UC07 E2 |
| Payload kiểm tra version | < 100 byte | UC-BE-02 |
| Chu kỳ dọn file xóa mềm | 30 ngày | Báo cáo B3.2 |
| Độ trễ API mục tiêu | < 200 ms | PRD §4.1 |
| Code coverage (Service Layer) | ≥ 80% | PRD §10.4 |
| POI tối thiểu trong MVP | 8 – 10 | PRD §4.2 |

---

## Chapter 12 — End-to-End Flow — Từ Mở App đến Nghe Audio

```mermaid
sequenceDiagram
    participant U as Du khách
    participant FE as Web App (Mobile Web)
    participant GE as Geofence (Client-side)
    participant BE as Backend 3 lớp
    participant DB as PostgreSQL

    U->>FE: Quét QR tổng ở Cổng Tam Quan, mở Web App
    FE->>U: Welcome Screen
    U->>FE: Bấm "Bắt đầu chuyến chiêm bái"
    FE->>FE: Mở khóa AudioContext (buffer im lặng 0.1s)
    FE->>U: Xin quyền GPS
    U->>FE: Cho phép
    FE->>BE: GET /campuses/viet-nam-quoc-tu/version
    BE-->>FE: version, last_updated

    alt Version khác LocalStorage hoặc chưa có cache
        FE->>BE: GET /campuses/viet-nam-quoc-tu/pois (If-None-Match)
        BE->>DB: Controller → Service → Repository
        DB-->>BE: POI + media (is_deleted = false)
        BE-->>FE: 200 OK + JSON + ETag mới
        FE->>FE: Lưu LocalStorage
    else Version trùng
        FE->>FE: Dùng cache LocalStorage
    end

    FE->>FE: Render bản đồ
    FE->>GE: watchPosition (1-3 giây)

    loop Mỗi lần có tọa độ mới
        GE->>GE: Haversine d tới từng POI
        GE->>GE: d ≤ R và chưa có trong Visited_POIs?
    end

    alt Ngoài trời: vào vùng Geofence
        GE->>FE: Kích hoạt POI gần nhất
        FE->>U: Rung, popup, tự phát audio
        FE->>BE: GET /media/audio/:fileId (Range)
        BE-->>FE: 206 Partial Content
        FE->>FE: Thêm Visited_POIs, icon "Đang xem"
    else Trong nhà: quét QR
        U->>FE: Bấm "Quét mã QR"
        FE->>FE: Đọc POI_ID, tìm trong LocalStorage

        opt LocalStorage rỗng (cold-start)
            FE->>BE: GET /pois/:id
            BE-->>FE: POI đó + toàn bộ danh sách POI
            FE->>FE: Nạp bổ sung LocalStorage
        end

        FE->>U: Bỏ qua GPS, ngắt audio khác, phát audio ngay
        FE->>FE: Thêm Visited_POIs (tránh GPS phát lặp)
    end

    U->>FE: Đổi ngôn ngữ VI ↔ EN (tùy chọn)
    FE->>U: Dừng audio cũ, nạp audio ngôn ngữ mới
    FE->>FE: Audio kết thúc → icon "Đã xem"
    FE->>BE: Telemetry: POI, ngôn ngữ, nguồn kích hoạt, thời lượng nghe
    BE->>DB: Ghi listening_analytics
```

---

## Appendix — Technology Stack & Cost Analysis

### Backend

- **Kiến trúc 3 lớp:** Controller / Service / Repository (thư mục `presentation` / `business-logic` / `data-access`)
- **Runtime:** Node.js 18 + TypeScript (theo cấu trúc thư mục và pipeline CI của báo cáo)
- **CSDL quan hệ:** PostgreSQL 15
- **Truy cập dữ liệu:** ORM Prisma hoặc TypeORM
- **Cache ETag / version:** Redis hoặc Memory Cache
- **Bảo mật:** bcrypt, JWT (Access + Refresh, Token Rotation), rate-limit middleware
- **Media:** `music-metadata` (đọc bitrate MP3), nén ảnh, lưu Local / Cloudinary / S3
- **Chất lượng:** ESLint / Prettier, Jest, Supertest, PostgreSQL Service Container
- **Đóng gói và triển khai:** Docker (multi-stage), Docker Compose, GitHub Actions

> Báo cáo v2.1 cũng nêu phương án `taglib-sharp` cho .NET; phiên bản này ghi theo hướng Node.js vì toàn bộ cấu hình mẫu (Jest, Supertest, `npm ci`, `.ts`) đều là Node.js.

### Frontend

- **Mobile Web App** responsive, truy cập qua QR / link, không cần cài app
- **HTML5 Geolocation API** (`watchPosition`) cho định vị và Geofence client-side
- **Web Audio API** (`AudioContext`) để mở khóa Autoplay
- **LocalStorage** lưu danh sách POI, version dữ liệu và ngôn ngữ đã chọn
- **Thư viện quét QR bằng camera** trên trình duyệt và **thư viện bản đồ** (tài liệu nguồn chưa chỉ định cụ thể)

### Hạ tầng & dịch vụ ngoài

- 📦 Lưu media: Local Storage, hoặc Cloudinary / S3
- 🐳 Registry: Docker Hub
- ☁️ Deploy: VPS, kích hoạt bằng SSH (`appleboy/ssh-action`)
- 🔑 Bí mật (registry, SSH, JWT): quản lý bằng **GitHub Secrets**
- ⚠️ Tài liệu nguồn **không có phân tích chi phí** chi tiết; chi phí máy chủ, CSDL và lưu trữ phát sinh khi deploy

### Phản biện v2.0 → khắc phục v2.1

| # | Phản biện về PRD v2.0 | Khắc phục trong v2.1 |
|---|---|---|
| 1 | Backend bị coi là Actor (sai chuẩn UML) | Actor gồm Khách tham quan, Quản trị viên, **CI/CD Runner** (Chapter 00) |
| 2 | UC01–UC06 thiên về giao diện Client, ít thể hiện Backend | Viết lại theo luồng 3 lớp; thêm **UC-BE-01 đến UC-BE-04** |
| 3a | Quét QR: UC05 lấy từ LocalStorage nhưng có API `GET /pois/:id`; lỗi khi LocalStorage rỗng | **Cache-First + Deep Link**: thiếu cache thì gọi API, nhận POI kèm toàn bộ danh sách |
| 3b | Transaction không rollback được file trên Cloud khi xóa POI | **Soft Delete** + Background Worker dọn sau 30 ngày |
| 4 | Thiếu: Range Streaming, Cache Invalidation, Token Refresh/Revoke, Analytics | Thêm `/media/audio` (206), `/version` + ETag, `/auth/refresh` + `/auth/logout`, bảng `listening_analytics` |
| 5 | Khóa đăng nhập không có cột lưu; bitrate không có công cụ; bán kính 10–30 m quá cứng | Thêm `failed_login_attempts`, `locked_until`; dùng `music-metadata`; bán kính **5–100 m** |

### Phạm vi MVP & định hướng tương lai

**Ngoài phạm vi MVP:** Chatbot AI / RAG, dẫn đường Turn-by-turn 3D phức tạp.

**Định hướng mở rộng:** (1) Trợ lý ảo AI Phật giáo; (2) Bản đồ 3D và định vị trong nhà qua BLE iBeacon; (3) Gợi ý tuyến chiêm bái theo chủ đề; (4) Thêm tiếng Trung, Nhật, Hàn, Pháp; (5) Dashboard Heatmap mật độ du khách theo thời gian thực.

### Lộ trình đồ án

| Giai đoạn | Nội dung |
|---|---|
| **Tuần 1–3** | Khảo sát thực địa, lấy tọa độ GPS các POI, thiết kế PRD, kiến trúc 3 lớp và CSDL |
| **Tuần 4–6** | Xây dựng Backend (DAL → BLL → API), thiết lập pipeline GitHub Actions |
| **Tuần 7** | **Midterm Review:** demo API, Database hoàn chỉnh, pipeline CI/CD xanh |
| **Tuần 8–10** | Tích hợp Frontend, kiểm thử Geofencing và quét QR tại khuôn viên chùa |
| **Tuần 11–12** | **Final Defense:** nghiệm thu, đóng gói Docker, nộp báo cáo |

---

**Hệ Thống Thuyết Minh Tự Động Đa Ngôn Ngữ Cho Việt Nam Quốc Tự**
Mobile Web App + Backend 3 lớp + CI/CD · Đồ án chuyên ngành CNTT, Đề tài 2: BE Dev 3 Lớp & CI/CD
*Tổng hợp từ PRD v2.0 và Báo cáo phản biện v2.1. Các mục ghi "đề xuất", "suy ra" hoặc "chưa chỉ định" là phần cần xác nhận thêm với nhóm.*
