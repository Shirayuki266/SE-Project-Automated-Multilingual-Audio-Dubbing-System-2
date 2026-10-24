# Cấu trúc thư mục dự án SE-Project-Automated-Multilingual-Audio-Dubbing-System

Tài liệu này mô tả cấu trúc hiện tại của repo và ý nghĩa từng phần nhằm giúp hiểu nhanh luồng phát triển và chạy dự án.

```text
SE-Project-Automated-Multilingual-Audio-Dubbing-System/
├── .env                           # Cấu hình runtime đang dùng ở local (không commit nhầm vào git)
├── .env.example                  # Mẫu biến môi trường cho dev / deploy
├── .gitignore                    # Loại trừ file nhạy cảm, cache, venv, build artifact
├── .github/
│   └── workflows/                # CI/CD workflow GitHub Actions
│       └── ...
├── app/                          # Backend chính theo kiến trúc FastAPI
│   ├── __init__.py               # Đánh dấu app là package Python
│   ├── config.py                 # Cấu hình Settings (DB, JWT, media, admin bootstrap)
│   ├── main.py                   # Composition root, mount router, startup seeding, static frontend
│   ├── business_logic/           # Tầng nghiệp vụ (service, validation, helper)
│   │   ├── helpers/
│   │   │   └── geofence.py       # Hàm kiểm tra tọa độ nằm trong ranh giới khuôn viên
│   │   ├── services/
│   │   │   ├── analytics_service.py
│   │   │   ├── auth_service.py
│   │   │   ├── content_service.py
│   │   │   ├── media_service.py
│   │   │   └── ...
│   │   └── ...
│   ├── data_access/              # Tầng truy cập dữ liệu / ORM / repository
│   │   ├── database.py           # Khởi tạo engine và session SQLAlchemy
│   │   ├── entities/
│   │   │   └── models.py         # Campus, POI, POIMedia, AdminUser, ListeningAnalytics
│   │   ├── repositories/
│   │   │   ├── analytics_repository.py
│   │   │   ├── auth_repository.py
│   │   │   ├── content_repository.py
│   │   │   └── ...
│   │   └── ...
│   ├── presentation/             # Tầng API / controller / DTO / middleware
│   │   ├── controllers/
│   │   │   ├── analytics_controller.py
│   │   │   ├── auth_controller.py
│   │   │   ├── campus_controller.py
│   │   │   ├── content_controller.py
│   │   │   ├── media_controller.py
│   │   │   └── ...
│   │   ├── dtos/
│   │   │   ├── campus.py
│   │   │   ├── content.py
│   │   │   ├── media.py
│   │   │   └── ...
│   │   ├── middlewares/
│   │   │   ├── auth.py
│   │   │   ├── rate_limit.py
│   │   │   └── ...
│   │   ├── static/               # Frontend tĩnh phục vụ bởi FastAPI
│   │   │   ├── admin.css
│   │   │   ├── admin.html
│   │   │   ├── admin.js
│   │   │   ├── app.js
│   │   │   ├── index.html
│   │   │   └── styles.css
│   │   └── ...
│   └── ...
├── tests/                        # Test suite cho backend
│   ├── conftest.py              # Fixture chung cho app và client test
│   ├── integration/
│   │   └── api/
│   │       └── test_backend_api.py
│   ├── unit/
│   │   └── ...
│   └── ...
├── Dockerfile                    # Docker image cho backend/service
├── docker-compose.yml            # Chạy project ở local dev
├── README.md                     # Tài liệu dự án, mô tả hệ thống và luồng nghiệp vụ
├── requirements.txt              # Dependency Python chính
├── structure.md                 # File giải thích cấu trúc thư mục hiện tại
├── vietnamquoctu.db              # SQLite local database cho dev/demo (nếu đang dùng)
├── venv/                         # Môi trường ảo local (không commit nếu không cần)
├── node_modules/                 # Module frontend/local build cache (thường không commit)
└── ...
```

## Ghi chú nhanh

- `app/` chứa toàn bộ logic backend chính.
- `app/presentation/static/` là giao diện web mobile/public và admin được phục vụ trực tiếp từ FastAPI.
- `app/business_logic/` là nơi thực hiện validation, geofence, auth, POI logic và nghiệp vụ.
- `app/data_access/` là nơi ORM models và repository truy cập database.
- `tests/` kiểm tra API, auth, boundary, upload media, analytic... và chạy nhằm bảo đảm dự án hoạt động đúng.
- `Dockerfile` / `docker-compose.yml` dùng để chạy hoặc đóng gói ứng dụng.
- `README.md` mô tả định hướng chức năng, không phải luôn phản ánh đường dẫn file chi tiết như trong repo.

## Mục tiêu của cấu trúc hiện tại

- Giữ backend và frontend gọn trong cùng repo để làm demo / chạy nhanh.
- Tách rõ ba tầng: presentation, business_logic, data_access.
- Dễ mở rộng thêm campus, media, analytics, admin CMS.
- Cho phép internal test chạy qua FastAPI TestClient mà không cần khởi động server thật.
