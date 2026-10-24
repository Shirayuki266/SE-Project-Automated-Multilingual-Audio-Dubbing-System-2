# BUILD_GUIDE — Hệ thống Thuyết minh tự động Việt Nam Quốc Tự

> Hướng dẫn xây dựng để dùng trong VS Code (Copilot / Claude Code / tự gõ tay).
> **Nguồn chính:** PRD Google Doc (UC01–UC11, ERD 5 bảng, ngày 2026-10-18).
> **Nguồn phụ:** PRD `.docx` v2.0 (cũ hơn). **README cũ:** chỉ giữ ý hay, bỏ cấu trúc (xem §1).
> Soạn ngày 2026-10-19. Chỗ nào ghi **TODO** là việc con người phải làm (đo tọa độ, viết nội dung), AI không được tự bịa.

## Mục lục

0. [Cách dùng file này](#0-cách-dùng-file-này)
1. [Vì sao README cũ "cảm giác sai"](#1-vì-sao-readme-cũ-cảm-giác-sai)
2. [Xung đột & quyết định](#2-xung-đột--quyết-định)
3. [Stack chốt](#3-stack-chốt)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Database (DDL đầy đủ)](#5-database)
6. [API contract](#6-api-contract)
7. [Backend 3 lớp: luật + khung code](#7-backend-3-lớp)
8. [Frontend: cấu trúc + 3 "engine" khó](#8-frontend)
9. [Docker & CI/CD](#9-docker--cicd)
10. [Lộ trình theo phase (prompt mẫu + DoD)](#10-lộ-trình-theo-phase)
11. [Kế hoạch test](#11-kế-hoạch-test)
12. [Quy tắc cho AI (copy vào repo)](#12-quy-tắc-cho-ai)
13. [Rủi ro thực địa](#13-rủi-ro-thực-địa)
14. [Phụ lục: README.md mới](#14-phụ-lục-readmemd-mới)

---

## 0. Cách dùng file này

1. Đặt file này vào repo: `docs/BUILD_GUIDE.md`. Để cả 2 file PRD trong `docs/PRD/`.
2. Copy khối ở **§12** vào `.github/copilot-instructions.md` (GitHub Copilot) hoặc `CLAUDE.md` (Claude Code). Từ đó mọi prompt đều bị ràng buộc bởi kiến trúc.
3. Làm **tuần tự Phase 0 → 7** (§10). Mỗi phase có: việc cần làm, prompt mẫu, Definition of Done (DoD). Xong DoD mới sang phase sau; commit + CI xanh trước khi chuyển.
4. Khi nhờ AI: dán **đúng 1 phase** + phần liên quan (schema §5, API §6) và nói rõ "chỉ tạo/sửa các file sau: …". Đừng bảo "làm cả dự án".
5. Backend (Đề tài 2) = Phase 1–4. Frontend = Phase 5–6. **§6 (API contract) là hợp đồng giữa BE và FE**: xuất `openapi.json` ngay cuối Phase 3 để FE làm song song.

---

## 1. Vì sao README cũ "cảm giác sai"

README cũ là **bản tóm tắt tài liệu theo khung "Chapter 00–12"** của một bài thuyết trình khác, không phải bản đặc tả để build. Cụ thể:

| Vấn đề | Hậu quả |
|---|---|
| Chỉ có cấu trúc **backend**; không có frontend (Web App + CMS) | Phải tự đoán nửa dự án còn lại |
| Frontend nhét vào `presentation/static` + `ui_i18n` trong backend | Trộn FE với tầng Presentation, khó CI/CD và khó cache |
| Trộn 2 stack: code Python/FastAPI nhưng vẫn ghi Prisma/TypeORM, `music-metadata`, `taglib-sharp`, YAML Node/Jest | AI sinh code lẫn lộn |
| CSDL: `create_all` khi khởi động + SQLite khi dev + Postgres khi CI | Test xanh ở máy nhưng khác môi trường thật; không dùng được PostGIS |
| Schema theo `title_vi/title_en` + bảng `listening_analytics` | Lệch ERD trong PRD (`poi_translations`, `poi_media`…) |
| Không có `alembic/`, `core/config`, `storage driver`, QR service dù mô tả có | Thiếu file quan trọng |
| Thêm nhiều thứ ngoài PRD (refresh token, soft delete + worker 30 ngày, 15 UC, `/version`) mà không đánh dấu "tùy chọn" | Phạm vi phình, mâu thuẫn với PRD |

**Giữ lại từ README cũ:** ETag/304, hysteresis, ý tưởng cache-first cho QR, khóa tài khoản sau 5 lần sai, kiểm tra bitrate MP3, QR mức sửa lỗi Q/H, Postgres service container trong CI, tag image theo commit SHA.
**Bỏ:** SQLite, `create_all`, mọi thứ Node/Prisma, `/version`, bán kính 5–100 m, token 15 phút + refresh (dời sang Phase 7 tùy chọn), soft delete + worker.

---

## 2. Xung đột & quyết định

Cột cuối cho biết **sửa PRD ở đâu** để báo cáo khớp code (giảng viên đối chiếu PRD với repo).

| # | Xung đột / lỗ hổng | Quyết định trong guide | Sửa PRD ở |
|---|---|---|---|
| 1 | PRD Google §9.1 coi "Hệ thống Backend 3 lớp" là **Actor**. Actor phải nằm ngoài hệ thống (UML) | Bỏ. Còn 2 actor (Khách, Admin); nếu muốn actor thứ 3 thì dùng **GitHub Actions (CI/CD Runner)** | §9.1 + sơ đồ Use Case |
| 2 | Bán kính Geofence: 10–30 m (cả 2 PRD) vs 5–100 m (README) | **10–30 m**, đặt trong config (`GEOFENCE_MIN_M/MAX_M`). DB chỉ CHECK rộng 5–100 để đổi config không cần migration. POI `INDOOR` không dùng bán kính (`NULL`) | Thêm BR: "INDOOR: radius = NULL" |
| 3 | Token: 8 giờ (PRD) vs 15 phút + refresh 7 ngày (README) | MVP: **1 JWT 8 giờ** (PRD). Refresh token = Phase 7 tùy chọn | Không đổi |
| 4 | Lưu đa ngữ: docx dùng cột `title_vi/title_en` (4 bảng); README 5 bảng khác; ERD Google có `poi_translations` | Theo **ERD Google** (`poi_translations`, unique `(poi_id, language_code)`). Thêm ngôn ngữ thứ 3 không đổi schema | docx §10.2 lỗi thời |
| 5 | ERD thiếu cột mà UC cần: `campuses.slug` (endpoint dùng slug), ranh giới (UC08/UC09), `data_version`, `status`, giờ mở cửa/liên hệ (UC08); `admin_users.role` (UC08 "chỉ admin cấp cao"), `failed_login_attempts` + `locked_until` (UC07 E3); `pois.is_active`, `display_order`, `updated_at` | **Thêm các cột này** (xem §5) | §11.2 + hình ERD |
| 6 | UC09 nhắc PostGIS nhưng ERD chỉ có lat/lng; README lại dùng SQLite | **Postgres + PostGIS ở mọi môi trường** (dev, CI, prod). lat/lng là nguồn sự thật; PostGIS dùng cho `boundary` + `ST_Covers`. Không dùng SQLite | §2.6, UC09 |
| 7 | QR chứa gì: `pois.qr_code_url` lưu sẵn; UC05-A1 cần deep link; README dùng id | QR = URL `https://{domain}/poi/{code}`. **Sinh khi cần, không lưu** (`qr_code_url` bỏ vì đổi domain là hỏng). Dùng `code` (vd `BAO_THAP_13`) chứ không dùng UUID | §11.2, UC11 |
| 8 | **Autoplay iOS:** PRD §7.3 chỉ mở khóa `AudioContext` + buffer im lặng. Trên iOS Safari, phát `<audio>` sau này vẫn có thể bị chặn. Ngoài ra khách quét bằng **camera gốc** (UC05-A1) mở thẳng deep link, không có thao tác chạm nào | Dùng **1 phần tử `<audio>` duy nhất**, gọi `play()` với âm im lặng **ngay trong handler click** của nút "Bắt đầu" (+ resume `AudioContext`). Mọi deep link `/poi/:code` **phải đi qua Welcome gate** rồi mới tự phát | §7.3, UC05 |
| 9 | `Visited_POIs` bị dùng **2 nghĩa**: (a) bộ đệm chống lặp, bị xóa khi `d > R+15`; (b) trạng thái icon "Đã xem" (xanh). Xóa khỏi (a) làm icon xanh quay về xám | Tách 2 cấu trúc: `triggerBuffer` (reset theo hysteresis) và `viewedSet` (giữ suốt phiên, quyết định màu icon) | §7.2, BR UC02 |
| 10 | Đóng Bottom Drawer: docx = dừng audio; Google UC04-A1 = mini-player ghim đáy, tiếp tục phát | Theo Google (mới hơn): **mini-player tiếp tục**, có nút dừng | §6.2 docx |
| 11 | Tiếng Anh: UC06 BR "mọi POI bắt buộc đủ VI+EN" mâu thuẫn UC06-E1 (thiếu EN thì phát VI) và docx "EN khuyến khích" | **VI bắt buộc, EN khuyến khích**; thiếu EN → phát VI + ghi chú; CMS cảnh báo "Thiếu nội dung tiếng Anh" | UC06 BR |
| 12 | Ngưỡng GPS kém: 50 m (docx, README) vs 30 m (Google UC03-E1) | 2 mức: `accuracy > 30` → cảnh báo nhẹ và **không auto-trigger**; `> 50` → ẩn chấm xanh, gợi ý QR | UC02, UC03 |
| 13 | Xóa POI: Google "xóa vĩnh viễn", docx "xóa cả media trong 1 transaction", README soft delete + worker 30 ngày. Transaction **không rollback được file** | **Xóa cứng** (đúng PRD): trong 1 transaction xóa DB (CASCADE) → **sau commit** mới xóa file (best-effort, log lỗi). Muốn ẩn tạm dùng `is_active=false` | UC09 A1 |
| 14 | Quy ước tên `audio_vi.mp3` vs cache CDN/trình duyệt: ghi đè file cùng tên thì khách vẫn nghe bản cũ | Tên logic giữ `audio_vi.mp3`; **tên lưu vật lý có hash**: `pois/{code}/audio_vi.ab12cd34.mp3` | UC10 |
| 15 | PRD ghi "cập nhật vị trí mỗi 1–3 giây" nhưng `watchPosition` **không có tham số chu kỳ** | Dùng `watchPosition` + throttle xử lý ≤ 1 lần/giây | §5.1 |
| 16 | Endpoint lệch nhau: UC09 docx `/api/v1/pois` vs §10.3 `/api/v1/admin/pois`; README thêm `/version` và bắt `GET /pois/:id` trả cả danh sách | Dùng `/admin/pois`. **Bỏ `/version`** (ETag + 304 đã đủ). `GET /pois/{code}` chỉ trả 1 POI; FE tự gọi song song danh sách khi cold-start | §10.3, UC09 |
| 17 | CI: PRD ghi ESLint/Jest/Supertest nhưng backend Python; tên workflow `backend-ci-cd.yml` (PRD) vs `python-app.yml` (README); coverage ≥ 80% (PRD) nhưng README "chưa là gate" | **Ruff / pytest / httpx**; file `backend-ci-cd.yml`; **coverage ≥ 80% là gate** trên `business_logic` | §10.4 |
| 18 | PRD hứa **Zero-Downtime**; script `docker compose down → up` gây gián đoạn | Phase 4: pull → migrate → `up -d --no-deps` → healthcheck → **tự rollback**. Gián đoạn vài giây. Nếu không làm blue-green thì sửa PRD thành "downtime tối thiểu + tự rollback" | §5.3, §6.6 |
| 19 | Định dạng ảnh: UC10 Google ghi JPG/PNG, §5.2 ghi JPG/PNG/WebP | Cả 3 | UC10 |
| 20 | Khi GPS đang auto-trigger mà khách **đang nghe** audio khác: PRD không nói | `QR` và `Manual` **cắt** audio đang phát; `GPS` **không cắt**, xếp hàng đợi + toast "Bạn đang gần X" | UC03 |
| 21 | Admin lưu JWT ở "Session/Cookie" (mơ hồ) | MVP: `Authorization: Bearer` + `sessionStorage`. HttpOnly cookie = hardening Phase 7 | UC07 |
| 22 | README thêm UC-BE-01..04, `listening_analytics`, Range streaming tự viết: **ngoài PRD** | Đưa vào **Phase 7 (tùy chọn)**. Mặc định để nginx phục vụ `/media/` (Range có sẵn) | Không đổi |

---

## 3. Stack chốt

> Nếu nhóm đã chọn stack khác (Node/NestJS, .NET), cấu trúc 3 lớp ở §7 giữ nguyên, chỉ đổi tên file và thư viện. Hãy nói trước khi bắt đầu Phase 1.

| Phần | Công nghệ | Ghi chú |
|---|---|---|
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, `psycopg[binary]` 3 | Endpoint viết **sync** (`def`) cho đơn giản; đủ cho < 200 ms |
| Bảo mật | `PyJWT`, `bcrypt` (dùng trực tiếp) | Không dùng `passlib` (lỗi tương thích với bcrypt bản mới). bcrypt chỉ nhận ≤ 72 byte → validate độ dài mật khẩu |
| Media | `mutagen` (bitrate/độ dài MP3), `Pillow` (nén ảnh), `segno` (QR PNG/SVG, ECC Q/H), `python-multipart` | |
| CSDL | PostgreSQL 16 + PostGIS (`postgis/postgis:16-3.4`) | Không cần GeoAlchemy2: viết SQL thô cho `boundary` trong repository |
| Test/Lint | `pytest`, `pytest-cov`, `httpx`, `ruff` | Ghim phiên bản trong `requirements*.txt` sau khi cài |
| Frontend | Vite + React 18 + TypeScript, `react-router`, `zustand`, `leaflet` + `react-leaflet`, `qr-scanner` | Visitor và Admin chung 1 project, Admin `lazy()` để bundle khách nhẹ |
| FE test | Vitest | `src/core/**` không import React → test thuần |
| Hạ tầng | Docker, Docker Compose, Caddy (HTTPS tự động), GHCR, GitHub Actions | GHCR dùng `GITHUB_TOKEN`, không cần Docker Hub |

Bản đồ: nền OpenStreetMap (người dùng) + ảnh vệ tinh (Admin, vd Esri World Imagery; xem điều khoản trước khi chạy production). Nếu nhóm đã có Google Maps/Mapbox key (PRD UC09 "Assumptions") thì thay lớp tile, phần còn lại không đổi.

---

## 4. Cấu trúc thư mục

```text
vnqt-audio-guide/
├── README.md                      # ngắn: giới thiệu + cách chạy (mẫu §14)
├── .env.example
├── docker-compose.yml             # dev: db + backend
├── docker-compose.prod.yml        # prod: db + backend + caddy + frontend
├── .github/
│   ├── copilot-instructions.md    # copy từ §12 (hoặc CLAUDE.md ở gốc repo)
│   └── workflows/
│       ├── backend-ci-cd.yml
│       └── frontend-ci.yml
├── docs/
│   ├── BUILD_GUIDE.md
│   └── PRD/                       # 2 file PRD
├── shared/
│   └── test-vectors/haversine.json  # BE và FE cùng test với bộ số này
├── infra/
│   ├── Caddyfile
│   └── deploy.sh                  # chạy trên VPS
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt           # runtime
│   ├── requirements-dev.txt       # pytest, ruff, httpx...
│   ├── pyproject.toml             # cấu hình ruff + pytest
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/0001_init.py
│   ├── scripts/
│   │   ├── seed.py                # campus + 8 POI (tọa độ TODO)
│   │   └── create_admin.py        # tạo admin đầu tiên, không có tài khoản mặc định
│   ├── app/
│   │   ├── main.py                # tạo FastAPI app, gắn router + error handler
│   │   ├── composition.py         # COMPOSITION ROOT: nối uow → service (nơi duy nhất biết cả 3 lớp)
│   │   ├── core/
│   │   │   ├── config.py          # Settings đọc từ .env (pydantic-settings)
│   │   │   └── logging.py
│   │   ├── presentation/          # ── TẦNG 1 ──
│   │   │   ├── controllers/
│   │   │   │   ├── auth_controller.py
│   │   │   │   ├── campus_controller.py
│   │   │   │   ├── poi_controller.py        # public + admin POI
│   │   │   │   ├── media_controller.py      # upload ảnh/audio
│   │   │   │   └── qr_controller.py
│   │   │   ├── dtos/              # Pydantic request/response (auth, campus, poi, media)
│   │   │   ├── dependencies.py    # require_admin (đọc JWT → AuthService.verify_token)
│   │   │   └── error_handlers.py  # exception nghiệp vụ → HTTP status
│   │   ├── business_logic/        # ── TẦNG 2 (Python thuần) ──
│   │   │   ├── interfaces.py      # Protocol: UnitOfWork, *Repository, FileStorage
│   │   │   ├── exceptions.py
│   │   │   ├── models.py          # dataclass: command + record (không phụ thuộc ORM)
│   │   │   ├── helpers/geofence.py
│   │   │   └── services/
│   │   │       ├── auth_service.py
│   │   │       ├── campus_service.py
│   │   │       ├── poi_service.py
│   │   │       ├── media_service.py
│   │   │       └── qr_service.py
│   │   └── data_access/           # ── TẦNG 3 ──
│   │       ├── database.py        # engine, SessionLocal
│   │       ├── unit_of_work.py    # SqlAlchemyUnitOfWork
│   │       ├── entities/          # SQLAlchemy models, khớp §5
│   │       ├── repositories/      # campus_repo.py, poi_repo.py, user_repo.py
│   │       └── storage/local_storage.py   # FileStorage: ghi/xóa file trong MEDIA_ROOT
│   └── tests/
│       ├── conftest.py
│       ├── fixtures/              # ok_128.mp3, low_64.mp3, big.jpg ... (tạo bằng ffmpeg, §11)
│       ├── unit/                  # fake repository, KHÔNG chạm DB
│       │   ├── test_architecture.py
│       │   ├── test_geofence.py
│       │   ├── test_poi_service.py
│       │   ├── test_auth_service.py
│       │   └── test_media_service.py
│       └── integration/           # httpx + Postgres thật
│           ├── test_auth_api.py
│           ├── test_poi_api.py
│           └── test_media_api.py
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts             # proxy /api và /media → :8000
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx                # route: "/", "/poi/:code", "/admin/*" (lazy)
        ├── core/                  # KHÔNG import React
        │   ├── geo/haversine.ts
        │   ├── geofence/engine.ts           # triggerBuffer + hysteresis + chọn POI gần nhất
        │   ├── audio/audioManager.ts        # <audio> duy nhất + unlock
        │   ├── api/{client.ts,publicApi.ts,adminApi.ts}
        │   ├── cache/poiCache.ts            # LocalStorage + ETag
        │   ├── i18n/{index.ts,vi.json,en.json,pickTranslation.ts}
        │   └── qr/parsePoiCode.ts
        ├── store/session.ts       # zustand: lang, viewedSet, nowPlaying, queue, gpsStatus
        ├── features/
        │   ├── visitor/
        │   │   ├── WelcomePage.tsx
        │   │   ├── MapPage.tsx            # MapView, UserMarker, PoiMarker, GeofenceCircle
        │   │   ├── PoiDrawer.tsx
        │   │   ├── MiniPlayer.tsx
        │   │   ├── QrScannerModal.tsx
        │   │   ├── LanguageSwitch.tsx
        │   │   └── hooks/{useGeolocation.ts,useGeofence.ts,useWakeLock.ts}
        │   └── admin/
        │       ├── LoginPage.tsx          # UC07
        │       ├── CampusPage.tsx         # UC08
        │       ├── PoiListPage.tsx        # UC09
        │       ├── PoiEditPage.tsx        # UC09 + UC10 (MapPicker, TranslationTabs, MediaUploader, AudioPreview)
        │       └── QrExportPage.tsx       # UC11
        └── dev/mockGeolocation.ts # phát lại tuyến đường giả để test/demo (chỉ dev)
```

---

## 5. Database

Chạy qua **Alembic** (`op.execute` cho phần PostGIS), không dùng `create_all`. Tên khóa chính theo ERD PRD.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE campuses (
  campus_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(80)  NOT NULL UNIQUE,              -- 'viet-nam-quoc-tu'
  name             VARCHAR(200) NOT NULL,
  address          VARCHAR(300),
  center_latitude  DOUBLE PRECISION NOT NULL,
  center_longitude DOUBLE PRECISION NOT NULL,
  boundary         geography(Polygon, 4326),                  -- UC08/UC09: ranh giới khuôn viên
  description_vi   TEXT,
  description_en   TEXT,
  map_image_url    TEXT,                                      -- sơ đồ mặt bằng (fallback khi tile lỗi)
  map_image_bounds JSONB,                                     -- {"sw":[lat,lng],"ne":[lat,lng]}
  opening_hours    VARCHAR(200),
  contact_info     VARCHAR(300),
  status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE','COMING_SOON')),
  data_version     INTEGER NOT NULL DEFAULT 1,                -- tăng mỗi khi dữ liệu khách thấy thay đổi → ETag
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pois (
  poi_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campus_id       UUID NOT NULL REFERENCES campuses(campus_id) ON DELETE CASCADE,
  code            VARCHAR(50) NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]+$'),  -- BAO_THAP_13; không đổi sau khi tạo
  latitude        DOUBLE PRECISION NOT NULL CHECK (latitude  BETWEEN -90  AND 90),
  longitude       DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  location_type   VARCHAR(10) NOT NULL DEFAULT 'OUTDOOR' CHECK (location_type IN ('OUTDOOR','INDOOR')),
  geofence_radius INTEGER CHECK (geofence_radius BETWEEN 5 AND 100),   -- app giới hạn 10–30 qua config
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  display_order   INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (location_type = 'INDOOR' OR geofence_radius IS NOT NULL)
);
CREATE INDEX ix_pois_campus_order ON pois (campus_id, display_order);

CREATE TABLE poi_translations (
  translation_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id                  UUID NOT NULL REFERENCES pois(poi_id) ON DELETE CASCADE,
  language_code           VARCHAR(5) NOT NULL,                -- 'vi','en'; danh sách hợp lệ nằm ở config SUPPORTED_LANGUAGES
  title                   VARCHAR(200) NOT NULL,
  description             TEXT,
  audio_url               TEXT,
  audio_duration_seconds  INTEGER,
  audio_size_bytes        INTEGER,
  UNIQUE (poi_id, language_code)
);

CREATE TABLE poi_media (
  media_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id          UUID NOT NULL REFERENCES pois(poi_id) ON DELETE CASCADE,
  image_url       TEXT NOT NULL,
  caption_vi      VARCHAR(300),
  caption_en      VARCHAR(300),                               -- ghi chú: thêm ngôn ngữ 3 sẽ phải đổi chỗ này (nợ kỹ thuật chấp nhận được)
  display_order   INTEGER NOT NULL DEFAULT 0,
  file_size_bytes INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_poi_media_poi_order ON poi_media (poi_id, display_order);

CREATE TABLE admin_users (
  user_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username              VARCHAR(80) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  full_name             VARCHAR(150),
  role                  VARCHAR(20) NOT NULL DEFAULT 'EDITOR' CHECK (role IN ('SUPER_ADMIN','EDITOR')),
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,           -- UC07-E3
  locked_until          TIMESTAMPTZ,
  last_login            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Phân quyền tối thiểu (UC08 BR):** `SUPER_ADMIN` sửa được Campus và quản lý user; `EDITOR` chỉ thao tác POI/nội dung/QR.

**SQL PostGIS viết thô trong `campus_repo.py`:**

```sql
-- UC09: tọa độ có nằm trong khuôn viên không (điểm nằm trên biên vẫn tính là nằm trong)
SELECT ST_Covers(boundary, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)
FROM campuses WHERE campus_id = :id;

-- Ghi ranh giới từ GeoJSON do Admin dán vào
UPDATE campuses SET boundary = ST_GeomFromGeoJSON(:geojson)::geography WHERE campus_id = :id;

-- Trả ranh giới cho API
SELECT ST_AsGeoJSON(boundary)::json FROM campuses WHERE slug = :slug;
```

**`data_version` — quy tắc sống còn:** mọi thao tác ghi làm thay đổi thứ khách thấy (POI, translation, media, campus) phải chạy `UPDATE campuses SET data_version = data_version + 1, updated_at = now()` **trong cùng transaction**. Quên bước này thì khách sẽ nhận 304 và dùng cache cũ.

**Seed (`scripts/seed.py`)** — tọa độ để `TODO`, **không dùng số bịa**:

| code | Tên (VI) | location_type | Bán kính gợi ý | Ghi chú |
|---|---|---|---|---|
| `TAM_QUAN` | Cổng Tam Quan | OUTDOOR | 20 | |
| `BAO_THAP_13` | Bảo Tháp 13 Tầng | OUTDOOR | 18 | PRD §3 dùng 18 m (docx dùng 15 m: thống nhất 18) |
| `CHANH_DIEN` | Đại Chánh Điện | INDOOR | NULL | QR bắt buộc |
| `THAP_CHUONG` | Tháp Đại Hồng Chung | OUTDOOR | 15 | |
| `NHA_TO` | Nhà Tổ | OUTDOOR | 15 | Ra thực địa kiểm tra; nếu GPS kém chuyển INDOOR |
| `PHONG_TRUNG_BAY` | Phòng Trưng Bày Văn Hóa Phật Giáo | INDOOR | NULL | QR bắt buộc |
| `THU_VIEN` | Thư Viện Phật Học | INDOOR | NULL | QR bắt buộc |
| `VUON_CANH_QUAN` | Vườn Cảnh Quan | OUTDOOR | 25 | |

---

## 6. API contract

Base: `/api/v1`. Lỗi luôn có dạng `{"error": {"code": "VALIDATION_ERROR", "message": "..."}}`. Mục tiêu độ trễ **< 200 ms** (đo p95 cho `GET /campuses/{slug}/pois`).

### Công khai

| Method | Path | Mô tả |
|---|---|---|
| GET | `/campuses/{slug}` | Thông tin campus: trạng thái, tâm, `boundary` (GeoJSON), `map_image_url`, `map_image_bounds`, giờ mở cửa |
| GET | `/campuses/{slug}/pois` | Toàn bộ POI `is_active` kèm translations + ảnh. Trả header `ETag: "v{data_version}"` và `Cache-Control: no-cache`. Có `If-None-Match` trùng → **304** |
| GET | `/pois/{code}` | Đúng **1** POI (cùng shape). Dùng cho deep link / quét QR lần đầu |
| GET | `/media/...` | File tĩnh (ảnh, mp3). Phải hỗ trợ `Range` (xem §9) |
| GET | `/health` | `{"status":"ok"}` cho healthcheck/CI |

### Admin (header `Authorization: Bearer <JWT>`)

| Method | Path | Mô tả | UC |
|---|---|---|---|
| POST | `/auth/login` | `{username,password}` → `{access_token, token_type, expires_in}`. Sai → 401. Sai ≥ 5 lần → khóa 15 phút → **429** | UC07 |
| GET | `/auth/me` | Thông tin admin hiện tại | UC07 |
| PUT | `/admin/campuses/{slug}` | Sửa campus (chỉ `SUPER_ADMIN`; ảnh mặt bằng ≤ 5 MB) | UC08 |
| GET | `/admin/pois` | Danh sách gồm cả POI không active | UC09 |
| POST | `/admin/pois` | Tạo POI (code, lat, lng, location_type, radius). Ngoài ranh giới → 400 | UC09 |
| GET/PUT/DELETE | `/admin/pois/{code}` | Xem / sửa (không đổi `code`) / xóa cứng | UC09 |
| PUT | `/admin/pois/{code}/translations/{lang}` | JSON `{title, description}` | UC10 |
| POST | `/admin/pois/{code}/translations/{lang}/audio` | multipart MP3 | UC10 |
| POST | `/admin/pois/{code}/media` | multipart ảnh (+ caption) | UC10 |
| DELETE | `/admin/pois/{code}/media/{media_id}` | Xóa ảnh | UC10 |
| GET | `/admin/pois/{code}/qrcode?format=png\|svg` | Tải 1 mã QR | UC11 |
| GET | `/admin/qrcodes.zip?format=png\|svg` | Tải tất cả (A1 của UC11) | UC11 |

**Shape trả về của POI** (translations là map theo ngôn ngữ để mở rộng):

```json
{
  "code": "BAO_THAP_13",
  "latitude": 0.0, "longitude": 0.0,
  "location_type": "OUTDOOR",
  "geofence_radius": 18,
  "display_order": 2,
  "translations": {
    "vi": {"title": "...", "description": "...", "audio_url": "/media/pois/BAO_THAP_13/audio_vi.ab12cd34.mp3", "audio_duration_seconds": 95},
    "en": {"title": "...", "description": "...", "audio_url": null, "audio_duration_seconds": null}
  },
  "images": [{"url": "/media/pois/BAO_THAP_13/img_01.9f8e7d6c.webp", "caption": {"vi": "...", "en": "..."}}]
}
```

**Quy tắc xử lý upload (MediaService):**

1. Đọc `UploadFile` **theo chunk**, dừng ngay khi vượt giới hạn (ảnh ≤ 5 MB, audio ≤ 20 MB). Không đọc cả file vào RAM rồi mới kiểm tra.
2. Ảnh: chấp nhận JPG/PNG/WebP; mở bằng Pillow (xác thực thật sự là ảnh, không tin đuôi file), xoay theo EXIF, thu nhỏ cạnh dài ≤ 2000 px, lưu WebP/JPEG.
3. Audio: `mutagen.mp3.MP3(path)` → `info.bitrate` phải trong 128–320 kbps (file VBR dùng bitrate trung bình), lấy `info.length` làm `audio_duration_seconds`.
4. Lưu file bằng `FileStorage` với tên có hash nội dung (§2 mục 14) **trước**; rồi mở transaction ghi DB + bump `data_version`; commit.
5. Nếu bước DB lỗi → xóa file vừa lưu (bù trừ). Nếu thay file cũ / xóa POI → **sau khi commit** mới xóa file cũ (lỗi xóa chỉ ghi log).
6. Lỗi định dạng/dung lượng/bitrate → 400 kèm thông báo cụ thể.

**QRService:** nội dung `{PUBLIC_BASE_URL}/poi/{code}`; `segno.make(url, error='q')`; SVG lưu thẳng; PNG tính `scale` nguyên rồi dùng Pillow đặt vào canvas 1000×1000 + nhãn tên di tích + logo. Nhiều mã → `zipfile` trong bộ nhớ.

---

## 7. Backend 3 lớp

### 7.1 Luật phụ thuộc

```text
presentation ──► business_logic ──► (interfaces) ◄── data_access
        └──────────── composition.py nối tất cả ───────────┘
```

| Lớp | Được phép | Cấm |
|---|---|---|
| `presentation/controllers` | FastAPI, DTO, gọi service | import `sqlalchemy`, `app.data_access` |
| `business_logic` | Python thuần, `Protocol` trong `interfaces.py`, `core.config` | import `fastapi`, `sqlalchemy`, `app.presentation`, `app.data_access` |
| `data_access` | SQLAlchemy, SQL thô, implement `Protocol` | import `app.presentation`, `app.business_logic.services`; chứa quy tắc nghiệp vụ |

Lý do: service test được bằng repository giả (không DB) → unit test nhanh, chứng minh "tầng nghiệp vụ không phụ thuộc CSDL" như PRD §5.3. **Repository không `commit()`**; chỉ `UnitOfWork.commit()` do service gọi khi nghiệp vụ hoàn tất.

### 7.2 Khung code

**`business_logic/exceptions.py`**

```python
class AppError(Exception):
    code = "APP_ERROR"

class ValidationError(AppError):    code = "VALIDATION_ERROR"
class UnauthorizedError(AppError):  code = "UNAUTHORIZED"
class NotFoundError(AppError):      code = "NOT_FOUND"
class ConflictError(AppError):      code = "CONFLICT"
class AccountLockedError(AppError): code = "ACCOUNT_LOCKED"
```

**`business_logic/interfaces.py`** (rút gọn)

```python
from typing import Protocol

class CampusRepository(Protocol):
    def get_by_slug(self, slug: str): ...
    def contains_point(self, campus_id, lat: float, lng: float) -> bool: ...
    def bump_version(self, campus_id) -> None: ...

class PoiRepository(Protocol):
    def get_by_code(self, code: str): ...
    def add(self, campus_id, cmd): ...
    def list_active(self, campus_id): ...

class FileStorage(Protocol):
    def save(self, rel_path: str, data: bytes) -> str: ...   # trả URL
    def delete(self, url: str) -> None: ...

class UnitOfWork(Protocol):
    campuses: CampusRepository
    pois: PoiRepository
    def commit(self) -> None: ...
    def rollback(self) -> None: ...
```

**`business_logic/helpers/geofence.py`**

```python
import math
from app.business_logic.exceptions import ValidationError

EARTH_RADIUS_M = 6_371_000

def haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi, dlmb = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def validate_coordinates(lat: float, lng: float) -> tuple[float, float]:
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise ValidationError("Tọa độ không hợp lệ")
    return round(lat, 6), round(lng, 6)          # ≥ 6 chữ số thập phân (PRD BR09-2)

def validate_radius(radius_m: int | None, min_m: int, max_m: int) -> int:
    if radius_m is None or not (min_m <= radius_m <= max_m):
        raise ValidationError(f"Bán kính Geofence phải trong khoảng {min_m}–{max_m} m")
    return radius_m
```

**`business_logic/services/poi_service.py`** (hàm mẫu; các hàm update/delete làm tương tự)

```python
class PoiService:
    def __init__(self, uow: UnitOfWork, cfg) -> None:
        self.uow, self.cfg = uow, cfg

    def create_poi(self, campus_slug: str, cmd: CreatePoiCommand):
        campus = self.uow.campuses.get_by_slug(campus_slug)
        if campus is None:
            raise NotFoundError("Không tìm thấy khuôn viên")
        lat, lng = validate_coordinates(cmd.latitude, cmd.longitude)
        if not self.uow.campuses.contains_point(campus.campus_id, lat, lng):
            raise ValidationError("Tọa độ ngoài ranh giới Việt Nam Quốc Tự")
        radius = None
        if cmd.location_type == "OUTDOOR":
            radius = validate_radius(cmd.geofence_radius, self.cfg.min_m, self.cfg.max_m)
        if self.uow.pois.get_by_code(cmd.code):
            raise ConflictError(f"Mã POI '{cmd.code}' đã tồn tại")
        poi = self.uow.pois.add(campus.campus_id, cmd, lat, lng, radius)
        self.uow.campuses.bump_version(campus.campus_id)     # bắt buộc, cùng transaction
        self.uow.commit()
        return poi
```

**`presentation/controllers/poi_controller.py`** (mỏng: chỉ DTO ↔ command)

```python
router = APIRouter(prefix="/api/v1/admin/pois", tags=["admin-pois"])

@router.post("", status_code=201, response_model=PoiResponse)
def create_poi(body: PoiCreateRequest,
               service: PoiService = Depends(get_poi_service),      # từ app.composition
               _admin=Depends(require_admin)):
    poi = service.create_poi(settings.default_campus_slug, body.to_command())
    return PoiResponse.from_record(poi)
```

**`presentation/error_handlers.py`**

```python
STATUS = {ValidationError: 400, UnauthorizedError: 401, NotFoundError: 404,
          ConflictError: 409, AccountLockedError: 429}

def register(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle(_: Request, exc: AppError):
        return JSONResponse(status_code=STATUS.get(type(exc), 500),
                            content={"error": {"code": exc.code, "message": str(exc)}})
```

**`composition.py`** (nơi duy nhất nối 3 lớp)

```python
def get_uow() -> Iterator[UnitOfWork]:
    uow = SqlAlchemyUnitOfWork(SessionLocal)
    try:
        yield uow
    finally:
        uow.close()

def get_poi_service(uow: UnitOfWork = Depends(get_uow)) -> PoiService:
    return PoiService(uow, settings.geofence)
```

**`tests/unit/test_architecture.py`** — ép luật 3 lớp bằng test (rất đáng để demo với giảng viên)

```python
import ast, pathlib, pytest

APP = pathlib.Path(__file__).resolve().parents[2] / "app"
RULES = {
    "presentation/controllers": ["app.data_access", "sqlalchemy"],
    "business_logic": ["app.data_access", "app.presentation", "sqlalchemy", "fastapi"],
    "data_access": ["app.presentation", "app.business_logic.services"],
}

def _imports(py: pathlib.Path) -> set[str]:
    mods: set[str] = set()
    for node in ast.walk(ast.parse(py.read_text(encoding="utf-8"))):
        if isinstance(node, ast.Import):
            mods.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            mods.add(node.module)
    return mods

@pytest.mark.parametrize("folder, banned", RULES.items())
def test_layer_boundaries(folder, banned):
    for f in (APP / folder).rglob("*.py"):
        for m in _imports(f):
            assert not any(m == b or m.startswith(b + ".") for b in banned), f"{f} import {m}"
```

> Dùng **import tuyệt đối** (`from app...`) trong toàn bộ `app/` để test này bắt được vi phạm.

### 7.3 AuthService (UC07)

- Đăng nhập: tìm user → nếu `locked_until > now` → `AccountLockedError`.
- Sai mật khẩu: `failed_login_attempts += 1`; đạt 5 → `locked_until = now + 15 phút`, reset bộ đếm. Báo lỗi chung "Tài khoản hoặc mật khẩu không chính xác" (không lộ user có tồn tại hay không).
- Đúng: reset bộ đếm, cập nhật `last_login`, ký JWT `HS256` với claim `sub`, `role`, `exp = now + 8h`.
- `verify_token(token)` do AuthService đảm nhiệm; `presentation/dependencies.require_admin` chỉ gọi nó.
- Bcrypt: `bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12))` (PRD yêu cầu ≥ 10).
- Admin đầu tiên tạo bằng `scripts/create_admin.py`; **không** có tài khoản mặc định, không tự đăng ký.

---

## 8. Frontend

### 8.1 Luồng visitor (đã sửa theo §2)

```text
/ hoặc /poi/:code
  └─ WelcomePage ──[tap "Bắt đầu chuyến chiêm bái"]──►
        1. audioManager.unlock()          ← gọi ĐỒNG BỘ trong onClick
        2. xin quyền GPS (từ chối vẫn dùng được: bản đồ thủ công + QR)
        3. loadPois() (ETag) → LocalStorage
        4. nếu vào bằng /poi/:code → mở POI đó, phát với source = 'QR'
  └─ MapPage: marker 3 trạng thái, chấm xanh + vòng sai số
        ├─ useGeolocation → useGeofence → engine.evaluate() → requestPlay(code,'GPS')
        ├─ chạm marker → PoiDrawer → requestPlay(code,'MANUAL')
        ├─ nút "Quét QR" → QrScannerModal → parsePoiCode() → requestPlay(code,'QR')
        └─ LanguageSwitch → đổi lang, dừng audio, nạp audio ngôn ngữ mới (đặt ở đầu bài)
```

**Ưu tiên phát (Single-Audio Rule):** `QR` và `MANUAL` cắt audio đang phát; `GPS` không cắt mà vào hàng đợi + toast. Chỉ có 1 `<audio>` nên không thể phát 2 bài.

**Trạng thái icon:** xám (chưa) → đỏ cam nhấp nháy (đang phát) → xanh (đã xem, theo `viewedSet`). Marker dùng `L.divIcon` (tránh lỗi icon mặc định của Leaflet khi bundle bằng Vite).

**Bản đồ:** `L.imageOverlay` với `map_image_url` + `map_image_bounds` là lớp dự phòng khi tile lỗi (UC02-E1); `maxBounds` = ranh giới campus + đệm nhỏ (BR02-2).

**Ngưỡng GPS:** `accuracy > 30` → banner "Tín hiệu GPS yếu", không auto-trigger; `> 50` → ẩn chấm xanh, gợi ý Quét QR / chọn thủ công.

### 8.2 `core/geofence/engine.ts` (logic lõi, test thuần)

```ts
import { haversineM } from '../geo/haversine';

export interface GeoPoi {
  code: string; latitude: number; longitude: number;
  locationType: 'OUTDOOR' | 'INDOOR'; geofenceRadius: number | null;
}
export const RESET_BUFFER_M = 15;        // PRD §7.2
export const MAX_TRIGGER_ACCURACY_M = 30;

export class GeofenceEngine {
  /** Chống phát lặp. KHÁC với viewedSet (trạng thái icon). */
  private triggerBuffer = new Set<string>();

  /** Trả danh sách code cần kích hoạt, gần nhất trước. */
  evaluate(pos: { lat: number; lng: number; accuracy: number }, pois: GeoPoi[]): string[] {
    const entered: { code: string; d: number }[] = [];
    for (const p of pois) {
      if (p.locationType !== 'OUTDOOR' || p.geofenceRadius == null) continue;   // INDOOR chỉ dùng QR
      const d = haversineM(pos.lat, pos.lng, p.latitude, p.longitude);
      if (this.triggerBuffer.has(p.code)) {
        if (d > p.geofenceRadius + RESET_BUFFER_M) this.triggerBuffer.delete(p.code);
        continue;
      }
      if (d <= p.geofenceRadius && pos.accuracy <= MAX_TRIGGER_ACCURACY_M) entered.push({ code: p.code, d });
    }
    entered.sort((a, b) => a.d - b.d);
    entered.forEach(e => this.triggerBuffer.add(e.code));
    return entered.map(e => e.code);
  }

  /** QR / thủ công cũng ghi vào buffer để GPS không phát lại khi bước ra ngoài (UC05). */
  markTriggered(code: string) { this.triggerBuffer.add(code); }
}
```

**Test engine (Vitest) — tối thiểu 6 ca:** (1) ngoài vùng → không kích hoạt; (2) vào vùng → kích hoạt đúng 1 lần; (3) dao động quanh biên (d = 14.8 ↔ 15.2) → không kích hoạt lại; (4) đi ra `R+15` rồi quay lại → kích hoạt lại; (5) 2 POI cùng thỏa → POI gần nhất đứng đầu; (6) `accuracy = 40` → không kích hoạt.

### 8.3 `core/audio/audioManager.ts` (mở khóa Autoplay đúng cách)

```ts
function makeSilentWav(ms = 100, rate = 8000): string {
  const n = Math.floor((rate * ms) / 1000);
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  new Uint8Array(buf, 44).fill(128);                      // 8-bit PCM: 128 = im lặng
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

class AudioManager {
  private el = new Audio();            // DUY NHẤT một phần tử cho cả phiên
  unlocked = false;

  /** PHẢI gọi trực tiếp trong onClick, không đặt sau await. */
  unlock(): Promise<void> {
    this.el.src = makeSilentWav();
    const p = this.el.play();                              // gọi đồng bộ trong cử chỉ người dùng
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      new Ctx().resume();                                  // đúng như PRD §7.3
    } catch { /* bỏ qua */ }
    return p.then(() => { this.el.pause(); this.unlocked = true; }).catch(() => {});
  }

  async play(url: string) { this.el.src = url; this.el.currentTime = 0; await this.el.play(); }
  pause() { this.el.pause(); }
  seekBy(sec: number) { this.el.currentTime = Math.max(0, this.el.currentTime + sec); }   // nút tua 10 giây
  on(ev: 'ended' | 'timeupdate' | 'error', fn: () => void) { this.el.addEventListener(ev, fn); }
}
export const audioManager = new AudioManager();
```

`play()` bị từ chối (`NotAllowedError`) → hiện nút lớn "Bấm để nghe thuyết minh" (UC03-E1). Audio lỗi → hiện bài viết + "Không thể tải audio, thử lại" (UC04-E1).

### 8.4 `core/cache/poiCache.ts` (UC-ETag, offline tối thiểu)

```ts
const KEY = 'vnqt.pois.v1';

export async function loadPois(slug: string) {
  const cached = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { etag: string; data: unknown } | null;
  try {
    const res = await fetch(`/api/v1/campuses/${slug}/pois`, {
      headers: cached?.etag ? { 'If-None-Match': cached.etag } : {},
    });
    if (res.status === 304 && cached) return cached.data;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    localStorage.setItem(KEY, JSON.stringify({ etag: res.headers.get('ETag'), data }));
    return data;
  } catch (e) {
    if (cached) return cached.data;       // mất mạng → dùng cache (UC01-E1)
    throw e;                              // không có cache → UI hiện "Thử lại"
  }
}
```

Deep link khi chưa có cache (cold-start): gọi **song song** `GET /pois/{code}` (để hiện nội dung ngay) và `loadPois()` (để dựng bản đồ). Không cần endpoint trả gộp.

### 8.5 Việc nhỏ nhưng quyết định trải nghiệm

- **`parsePoiCode(text)`**: nhận URL `https://…/poi/BAO_THAP_13` **hoặc** chuỗi `BAO_THAP_13`; không khớp → "Mã QR không thuộc Việt Nam Quốc Tự" (UC05-E1); `404`/POI inactive → "Điểm di tích hiện không khả dụng" (UC05-E2).
- **Rung:** `navigator.vibrate?.(200)`. iOS Safari **không hỗ trợ** → bỏ qua êm (UC03-E2).
- **Giữ màn hình sáng:** `navigator.wakeLock?.request('screen')` trong `useWakeLock` (xem §13).
- **`watchPosition`**: `{ enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 }`; trong callback chỉ xử lý nếu đã ≥ 1 giây từ lần trước.
- **`pickTranslation(poi, lang)`** trả `{ data, isFallback }`; thiếu EN → dùng VI + hiện "Chưa có bản dịch tiếng Anh".
- **`dev/mockGeolocation.ts`**: phát lại danh sách tọa độ theo thời gian (bật bằng `?mock=1`) để test geofence và demo khi ngồi ở nhà. Thêm ca có nhiễu ±5 m để kiểm tra hysteresis.
- **Vite:** `server.proxy` cho `/api` và `/media` → `http://localhost:8000`. Dùng tunnel HTTPS để test điện thoại thật (§13); nếu Vite báo "host is not allowed" thì thêm `server.allowedHosts`.

### 8.6 Admin CMS

| Trang | UC | Điểm chính |
|---|---|---|
| `LoginPage` | UC07 | Lưu token ở `sessionStorage`; 401 → về trang đăng nhập; 429 → hiện "Tạm khóa 15 phút" |
| `CampusPage` | UC08 | Form + dán GeoJSON ranh giới (vẽ ở geojson.io) + upload sơ đồ mặt bằng; chỉ hiện với `SUPER_ADMIN` |
| `PoiListPage` | UC09 | Bảng POI, cảnh báo "Thiếu tiếng Anh", nút xóa có hộp thoại xác nhận |
| `PoiEditPage` | UC09+UC10 | `MapPicker` (nhấp/kéo marker → tự điền lat/lng 6 chữ số, vẽ vòng Geofence); 2 tab VI/EN; upload ảnh/MP3; nghe thử MP3 trước khi lưu |
| `QrExportPage` | UC11 | Preview, chọn PNG/SVG, tải lẻ hoặc ZIP |

---

## 9. Docker & CI/CD

### 9.1 `docker-compose.yml` (dev)

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: vnqt
      POSTGRES_USER: vnqt
      POSTGRES_PASSWORD: vnqt_dev
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vnqt -d vnqt"]
      interval: 5s
      retries: 10
  backend:
    build: ./backend
    env_file: .env
    depends_on:
      db: { condition: service_healthy }
    ports: ["8000:8000"]
    volumes: ["./backend/app:/code/app", "media:/code/media"]
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
volumes: { pgdata: {}, media: {} }
```

### 9.2 `backend/Dockerfile` (multi-stage)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim
RUN useradd -m app
WORKDIR /code
COPY --from=builder /install /usr/local
COPY . .
RUN mkdir -p /code/media && chown -R app /code/media
USER app
HEALTHCHECK --interval=30s CMD python -c "import urllib.request;urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 9.3 `.env.example`

```ini
APP_ENV=dev
DATABASE_URL=postgresql+psycopg://vnqt:vnqt_dev@db:5432/vnqt
JWT_SECRET=doi-thanh-chuoi-ngau-nhien-dai-64-ky-tu
JWT_EXPIRE_MINUTES=480
DEFAULT_CAMPUS_SLUG=viet-nam-quoc-tu
SUPPORTED_LANGUAGES=vi,en
GEOFENCE_MIN_M=10
GEOFENCE_MAX_M=30
MEDIA_ROOT=/code/media
MEDIA_BASE_URL=/media
MAX_IMAGE_MB=5
MAX_AUDIO_MB=20
AUDIO_MIN_KBPS=128
AUDIO_MAX_KBPS=320
LOGIN_MAX_FAILS=5
LOGIN_LOCK_MINUTES=15
PUBLIC_BASE_URL=https://localhost:5173
```

### 9.4 Phục vụ audio (Range)

Safari iOS gửi `Range` khi tua. **Cách mặc định:** production để Caddy/nginx phục vụ `/media/` trực tiếp từ volume (Range có sẵn). Dev với uvicorn: kiểm tra bằng

```bash
curl -s -o /dev/null -D - -H "Range: bytes=0-99" http://localhost:8000/media/<đường-dẫn-mp3>
# phải thấy: HTTP/1.1 206 Partial Content + Content-Range + Accept-Ranges: bytes
```

Nếu dev trả `200` thì hoặc test seek bằng bản chạy sau Caddy, hoặc viết `AudioStreamService` (Phase 7).

### 9.5 `.github/workflows/backend-ci-cd.yml`

```yaml
name: backend-ci-cd

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgis/postgis:16-3.4
        env:
          POSTGRES_DB: vnqt_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U test -d vnqt_test"
          --health-interval 10s --health-timeout 5s --health-retries 5
    defaults:
      run:
        working-directory: backend
    env:
      DATABASE_URL: postgresql+psycopg://test:test@localhost:5432/vnqt_test
      JWT_SECRET: ci-only-secret-at-least-32-characters-long
      MEDIA_ROOT: /tmp/media
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: pip
          cache-dependency-path: backend/requirements*.txt
      - run: pip install -r requirements.txt -r requirements-dev.txt
      - name: Lint + format
        run: ruff check . && ruff format --check .
      - name: Migration chạy được trên DB trống
        run: alembic upgrade head
      - name: Unit + Integration test (coverage gate 80% cho tầng nghiệp vụ)
        run: pytest --cov=app/business_logic --cov-report=term-missing --cov-fail-under=80
      - name: Build Docker image
        run: docker build -t vnqt-backend:ci .

  cd:
    needs: ci
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v6
        with:
          context: backend
          push: true
          # tên image GHCR bắt buộc chữ thường: đặt tên repo/org chữ thường hoặc hard-code ở đây
          tags: |
            ghcr.io/<owner-chu-thuong>/vnqt-backend:${{ github.sha }}
            ghcr.io/<owner-chu-thuong>/vnqt-backend:latest
      - uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: IMAGE_TAG=${{ github.sha }} /opt/vnqt/infra/deploy.sh
```

Bật **branch protection** cho `main`: bắt buộc job `ci` xanh mới được merge (đúng "điểm đánh giá Đề tài 2" của PRD §10.4).

### 9.6 `infra/deploy.sh` (trên VPS; tự rollback)

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/vnqt
NEW="${IMAGE_TAG:?thiếu IMAGE_TAG}"
OLD="$(cat .last_good_tag 2>/dev/null || true)"
DC="docker compose -f docker-compose.prod.yml"

IMAGE_TAG="$NEW" $DC pull backend
IMAGE_TAG="$NEW" $DC run --rm backend alembic upgrade head     # migration phải tương thích ngược (thêm cột trước, bỏ cột sau)
IMAGE_TAG="$NEW" $DC up -d --no-deps backend

for _ in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null; then echo "$NEW" > .last_good_tag; exit 0; fi
  sleep 3
done
echo "Healthcheck FAIL → rollback về ${OLD:-<không có>}"
[ -n "$OLD" ] && IMAGE_TAG="$OLD" $DC up -d --no-deps backend
exit 1
```

Trong `docker-compose.prod.yml`, publish backend ở `127.0.0.1:8000:8000` để script kiểm tra được; Caddy (`infra/Caddyfile`) reverse-proxy `/api/*` về backend, phục vụ `/media/*` từ volume và static của frontend, **cùng một origin** nên không cần CORS.

### 9.7 `frontend-ci.yml` (tóm tắt)

`checkout` → `setup-node` (cache npm) → `npm ci` → `npm run lint` → `npm run test` (Vitest) → `npm run build`.

---

## 10. Lộ trình theo phase

Khớp mốc của PRD: **Tuần 7 = Midterm** (API + DB + CI xanh) nên Phase 1–4 phải xong trước đó.

### Phase 0 — Chuẩn bị (Tuần 1–3)
- [ ] Tạo repo, nhánh `main` + `develop`, bật branch protection sau khi có CI.
- [ ] Tạo cây thư mục §4 (thư mục rỗng thêm `.gitkeep`); đặt §12 vào `.github/copilot-instructions.md`.
- [ ] **Khảo sát thực địa (không giao cho AI):** mỗi POI đo GPS 3 lần vào 3 thời điểm, ghi `lat, lng, accuracy`, lấy trung bình; vẽ ranh giới khuôn viên ở geojson.io (xuất GeoJSON); chụp/vẽ sơ đồ mặt bằng + ghi tọa độ 2 góc (SW/NE).
- [ ] Vá PRD theo cột cuối bảng §2; chốt 3 quyết định cần xác nhận: stack (§3), token (mục 3), bán kính (mục 2).
- **DoD:** repo có cấu trúc; file tọa độ + GeoJSON ranh giới nằm trong `docs/survey/`.

### Phase 1 — Data Access (Tuần 4)
- [ ] `docker compose up db` chạy; `alembic` + migration `0001_init` khớp §5 (phần PostGIS dùng `op.execute`).
- [ ] Entities SQLAlchemy, `SqlAlchemyUnitOfWork`, 3 repository, `local_storage.py`.
- [ ] `scripts/seed.py` (campus + 8 POI, tọa độ lấy từ file khảo sát) và `scripts/create_admin.py`.

> **Prompt mẫu:** "Đọc `docs/BUILD_GUIDE.md` §5 và §7.1. Tạo SQLAlchemy 2.0 entities trong `backend/app/data_access/entities/` khớp ĐÚNG DDL §5; Alembic migration 0001 (cột `geography` tạo bằng `op.execute`); repository theo Protocol trong `business_logic/interfaces.py`; SQL PostGIS viết thô ở `campus_repo.py`. KHÔNG tạo service hay controller. Repository không được commit."

- **DoD:** `alembic upgrade head` rồi `downgrade base` chạy sạch; `seed.py` chạy lại nhiều lần không lỗi; `ST_Covers` trả đúng cho 1 điểm trong và 1 điểm ngoài.

### Phase 2 — Business Logic + unit test (Tuần 5)
- [ ] `exceptions.py`, `models.py` (dataclass command/record), `geofence.py`, 5 service (`auth`, `campus`, `poi`, `media`, `qr`).
- [ ] Unit test dùng **repository giả** trong bộ nhớ; `test_architecture.py`.
- [ ] `shared/test-vectors/haversine.json`.

> **Prompt mẫu:** "Theo §7, viết `poi_service.py` và `test_poi_service.py` dùng FakeUnitOfWork. Test: tọa độ ngoài ranh giới → ValidationError; bán kính 9 và 31 → lỗi, 10 và 30 → ok; INDOOR không cần bán kính; trùng code → ConflictError; mỗi thao tác ghi gọi `bump_version` đúng 1 lần. Không import sqlalchemy/fastapi."

- **DoD:** `pytest tests/unit --cov=app/business_logic` ≥ 80%; `test_architecture` xanh.

Ví dụ `haversine.json` (1° kinh độ tại xích đạo với R = 6.371.000 m ≈ 111.194,9 m; thêm 2–3 cặp đo thật ở chùa):

```json
[
  {"from": [0, 0],     "to": [0, 1],     "expected_m": 111194.9, "tolerance_m": 1},
  {"from": [10.5, 106], "to": [10.5, 106], "expected_m": 0,        "tolerance_m": 0.001}
]
```

### Phase 3 — Presentation + integration test (Tuần 6)
- [ ] DTO, controllers, `dependencies.require_admin`, `error_handlers`, `composition.py`, `main.py`.
- [ ] ETag/304 cho `GET /campuses/{slug}/pois`; upload ảnh/MP3; QR PNG/SVG/ZIP.
- [ ] Integration test (httpx + Postgres thật); xuất `openapi.json` giao cho FE.

> **Prompt mẫu:** "Theo §6, tạo `poi_controller.py` và DTO tương ứng. Controller chỉ map DTO ↔ command và gọi service lấy qua `Depends(get_poi_service)`; không import sqlalchemy hay data_access. Thêm `test_poi_api.py` kiểm: 401 khi thiếu token, 201 khi tạo hợp lệ, 400 khi ngoài ranh giới, và sau khi tạo thì `ETag` của `/pois` đổi."

- **DoD:** OpenAPI ở `/docs` khớp §6; mọi ca lỗi trả đúng định dạng `{"error":{…}}`; đo p95 < 200 ms (`hey -n 300 -c 10 http://localhost:8000/api/v1/campuses/viet-nam-quoc-tu/pois`).

### Phase 4 — CI/CD (Tuần 6–7)
- [ ] `Dockerfile`, `docker-compose*.yml`, `backend-ci-cd.yml`, `deploy.sh`, `Caddyfile`; VPS có domain + HTTPS.
- [ ] Branch protection: `ci` bắt buộc xanh.
- **DoD (demo Midterm, Tuần 7):**
  - `docker compose up` rồi mở `/docs`.
  - Mở PR cố ý làm hỏng 1 test → CI đỏ, nút merge bị chặn; sửa → xanh.
  - Merge vào `main` → image xuất hiện trên GHCR với tag SHA → deploy tự chạy → `/health` ok.
  - Demo khóa tài khoản (đăng nhập sai 5 lần → 429), tạo POI ngoài ranh giới → 400, upload MP3 64 kbps → 400, `curl -i -H 'If-None-Match: "v1"' …/pois` → 304.
  - Chạy `pytest tests/unit/test_architecture.py` để chứng minh 3 lớp tách bạch.

### Phase 5 — Frontend visitor (Tuần 8–9)
Làm theo thứ tự, mỗi bước chạy được trên điện thoại thật qua HTTPS:
1. Scaffold Vite, proxy, `core/geo`, `core/geofence` + test Vitest (6 ca §8.2).
2. `poiCache` + API client; `WelcomePage` + `audioManager.unlock()`.
3. `MapPage` (Leaflet, marker 3 trạng thái, chấm xanh + vòng sai số, `imageOverlay` dự phòng).
4. `useGeolocation` + `useGeofence` + `mockGeolocation`.
5. `PoiDrawer` + `MiniPlayer` (Play/Pause, tua 10 giây, Seekbar) + hàng đợi GPS.
6. `QrScannerModal` + route `/poi/:code` (qua Welcome gate).
7. i18n + `LanguageSwitch` (đổi giữa lúc phát → dừng, nạp audio mới ở đầu bài).
8. `useWakeLock`, banner GPS yếu, trạng thái lỗi.

> **Prompt mẫu (bước 4):** "Theo §8.1–8.2, viết `useGeolocation.ts` (watchPosition, throttle 1 giây, trả `{lat,lng,accuracy}` + status) và `useGeofence.ts` dùng `GeofenceEngine`. Khi engine trả code thì gọi `requestPlay(code,'GPS')` từ store. Không viết lại logic engine."

- **DoD:** chạy được trọn luồng 5 bước của PRD §3 bằng `?mock=1`; sau đó thử trên 1 iPhone (Safari) và 1 Android (Chrome) thật.

### Phase 6 — Admin CMS (Tuần 9–10)
Làm theo bảng §8.6: Login → PoiList → PoiEdit (MapPicker + tab + upload) → QrExport → Campus.
- **DoD:** thêm 1 POI mới từ CMS → khách đang mở app được cập nhật sau khi tải lại (ETag đổi); QR in ra quét bằng camera gốc mở đúng POI.

### Phase 7 — Thực địa & hoàn thiện (Tuần 10–12)
- [ ] Đi bộ thật quanh chùa (§13), ghi lại POI nào kích hoạt sai/trễ → chỉnh bán kính trong CMS (không sửa code).
- [ ] In thử bảng QR, kiểm tra quét trong Chánh Điện (thiếu sáng, bảng bóng loáng).
- [ ] Nội dung VI + EN: **nhờ người am hiểu Phật học duyệt thuật ngữ** (PRD UC06 Assumptions).
- [ ] Đóng gói Docker, báo cáo cuối kỳ (đối chiếu PRD đã vá).
- **Tùy chọn nếu còn thời gian:** refresh token + HttpOnly cookie; `listening_analytics`; `AudioStreamService` tự viết (206); blue-green; PWA/Service Worker cache audio.

---

## 11. Kế hoạch test

| Tầng | Công cụ | Ca bắt buộc |
|---|---|---|
| Unit BE | pytest + repository giả | Haversine (dùng `shared/test-vectors`); radius 9/10/30/31; tọa độ ngoài ranh giới; khóa sau 5 lần sai (và hết khóa sau 15 phút bằng cách giả lập đồng hồ); bitrate 64/128/320/400; QR giải mã ngược ra đúng URL |
| Kiến trúc | `test_architecture.py` | Luật import §7.2 |
| Integration BE | httpx + Postgres | 401/403/400/404/409/429; ETag đổi sau mỗi lần ghi; xóa POI → file bị xóa **sau** commit; upload hỏng không để lại file mồ côi |
| Unit FE | Vitest | Engine (6 ca), `parsePoiCode`, `pickTranslation`, Haversine với cùng test vector |
| Thủ công | Điện thoại thật | Ma trận §13 |

Tạo file MP3 mẫu cho test (cần `ffmpeg`):

```bash
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 2 -b:a 128k backend/tests/fixtures/ok_128.mp3
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 2 -b:a 64k  backend/tests/fixtures/low_64.mp3
```

---

## 12. Quy tắc cho AI

Copy nguyên khối dưới đây vào `.github/copilot-instructions.md` hoặc `CLAUDE.md`.

```text
# Quy tắc dự án: Việt Nam Quốc Tự Audio Guide
Nguồn sự thật: docs/BUILD_GUIDE.md (§2 quyết định, §5 schema, §6 API) và docs/PRD/.
Nếu yêu cầu của tôi mâu thuẫn với các tài liệu này: DỪNG và hỏi, không tự chọn.
Mỗi lần chỉ làm đúng phạm vi tôi nêu; không tự tạo thêm file/tính năng ngoài danh sách.

BACKEND (backend/app) — 3 lớp, phụ thuộc một chiều: presentation -> business_logic -> data_access
1. presentation/controllers: chỉ map DTO <-> command và gọi service. CẤM import sqlalchemy, app.data_access.
2. business_logic: Python thuần. CẤM import fastapi, sqlalchemy, app.presentation, app.data_access.
   Làm việc với DB/file chỉ qua Protocol trong business_logic/interfaces.py.
3. data_access: SQLAlchemy + SQL thô cho PostGIS. Không chứa quy tắc nghiệp vụ. Repository KHÔNG commit;
   chỉ UnitOfWork.commit() do service gọi.
4. Dùng import tuyệt đối (from app....). Sau mỗi thay đổi chạy: pytest tests/unit
5. Mọi thao tác ghi dữ liệu khách nhìn thấy (POI, translation, media, campus) phải tăng
   campuses.data_version TRONG CÙNG transaction.
6. Lỗi nghiệp vụ là exception trong business_logic/exceptions.py; chỉ error_handlers.py đổi sang HTTP.
7. Schema chỉ thay đổi qua Alembic migration. Không create_all. Không SQLite. Không tài khoản admin mặc định.
8. File media: lưu file trước, ghi DB sau; DB lỗi thì xóa file vừa lưu; xóa/thay file cũ chỉ sau khi commit.
9. Giới hạn lấy từ core/config.py (bán kính, dung lượng, bitrate, số lần đăng nhập sai); không hard-code số.

FRONTEND (frontend/src)
1. src/core/** không import React; có test Vitest.
2. Chỉ MỘT phần tử <audio> cho cả ứng dụng (audioManager). unlock() gọi đồng bộ trong onClick.
3. triggerBuffer (chống phát lặp, reset khi d > R + 15) KHÁC viewedSet (trạng thái icon Đã xem). Không gộp.
4. Ưu tiên phát: QR và MANUAL cắt audio đang phát; GPS không cắt, vào hàng đợi.
5. POI INDOOR không bao giờ kích hoạt bằng GPS.
6. Deep link /poi/:code luôn đi qua WelcomePage trước khi tự phát.
7. Dữ liệu POI lấy qua ETag (If-None-Match); mất mạng thì dùng LocalStorage.
8. Không gửi tọa độ GPS của khách lên server.

KHÔNG ĐƯỢC BỊA: tọa độ GPS, ranh giới, số liệu lịch sử/Phật học, nội dung thuyết minh.
Chỗ chưa có dữ liệu thật phải ghi TODO rõ ràng.

PHONG CÁCH: commit theo Conventional Commits (feat:, fix:, test:, chore:). Comment và thông báo lỗi cho người dùng bằng tiếng Việt.
```

---

## 13. Rủi ro thực địa

| Rủi ro | Cách xử lý |
|---|---|
| **HTTPS bắt buộc**: Geolocation, camera (QR), Wake Lock chỉ chạy trên HTTPS (ngoại lệ: `localhost` trên chính máy dev) | Test điện thoại qua tunnel HTTPS (Cloudflare Tunnel/ngrok) từ ngày đầu Phase 5; production dùng Caddy + domain |
| **Màn hình khóa / tab nền**: trình duyệt di động thường tạm dừng GPS và có thể dừng audio | Dùng Wake Lock giữ màn hình sáng; hướng dẫn trên Welcome: "Giữ màn hình sáng khi tham quan". Ghi rõ giới hạn này trong báo cáo |
| iOS Safari không có `navigator.vibrate` | Đã có nhánh bỏ qua; đừng coi rung là bắt buộc |
| GPS sai số lớn gần tòa nhà cao (Bảo Tháp 63 m) | Chỉnh bán kính theo từng POI trong CMS; đo lại ở nhiều thời điểm; chấp nhận dùng QR cho POI gần tòa nhà lớn |
| Quét QR thiếu sáng / bảng bóng | ECC Q/H, in kích thước ≥ 5×5 cm, ưu tiên bảng mờ (matte) |
| Khách quét bằng camera gốc, chưa có thao tác chạm nào | Đã xử lý bằng Welcome gate (§2 mục 8) |
| LocalStorage giới hạn ~5 MB | Chỉ lưu JSON metadata + URL, không lưu file; cache file media offline là tính năng PWA tùy chọn |
| Quyền riêng tư | Geofence chạy hoàn toàn phía client; không gửi vị trí khách về server. Nên nói rõ điều này trên Welcome |
| Nội dung thuyết minh sai thuật ngữ Phật học | Có bước duyệt nội dung trước khi nhập CMS (Phase 7) |

Ma trận thử thực địa tối thiểu: {iPhone Safari, Android Chrome} × {4G, Wi-Fi chùa, mất mạng sau khi đã tải} × {Cổng Tam Quan, Bảo Tháp, Chánh Điện (QR), Phòng Trưng Bày (QR)} × {VI, EN}.

---

## 14. Phụ lục: README.md mới

README ở gốc repo nên **ngắn**, chỉ để người khác chạy được dự án:

```markdown
# Việt Nam Quốc Tự — Thuyết minh tự động đa ngôn ngữ
Mobile Web App (Geofencing GPS + QR trong nhà) + Admin CMS + Backend 3 lớp (FastAPI, PostgreSQL/PostGIS) + CI/CD (GitHub Actions, Docker).

## Chạy thử
1. `cp .env.example .env` rồi đổi `JWT_SECRET`.
2. `docker compose up --build`  → API tại http://localhost:8000/docs
3. `docker compose exec backend alembic upgrade head`
4. `docker compose exec backend python scripts/seed.py`
5. `docker compose exec backend python scripts/create_admin.py`
6. Frontend: `cd frontend && npm ci && npm run dev`

## Tài liệu
- Hướng dẫn xây dựng: `docs/BUILD_GUIDE.md`
- PRD: `docs/PRD/`

## Test
`cd backend && pytest` · `cd frontend && npm test`
```
