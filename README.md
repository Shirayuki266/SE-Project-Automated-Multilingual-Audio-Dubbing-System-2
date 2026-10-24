# HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ CHO DI TÍCH PHẬT GIÁO VIỆT NAM QUỐC TỰ

Dự án phần mềm số hóa di sản và hướng dẫn viên ảo (Virtual Audio Guide) cho quần thể di tích Phật giáo **Việt Nam Quốc Tự** (244 đường Ba Tháng Hai, Phường 12, Quận 10, TP. Hồ Chí Minh).

---

## 🌟 Công Nghệ Cốt Lõi (Tech Stack)

| Thành Phần | Công Nghệ & Thư Viện | Vai Trò & Điểm Nổi Bật |
| :--- | :--- | :--- |
| **Backend** | **FastAPI + MongoDB** | Kiến trúc 3 Lớp (Presentation - Business Logic - Data Access). Hỗ trợ song song cả **Live MongoDB** lẫn **Embedded Resilient Database** hoạt động Offline-First không phụ thuộc mạng. |
| **Frontend** | **React 19.2 + Vite 7 PWA** | Zero-Install Mobile Web App, PWA Service Worker caching (CacheFirst cho audio, ảnh, tiles), responsive tối ưu cho thiết bị di động. |
| **Bản Đồ Số** | **MapLibre GL + PMTiles** | Bản đồ số tương tác chuyên dụng cho Việt Nam Quốc Tự, hỗ trợ PMTiles vector/raster, hiển thị 3 trạng thái POI (Chưa xem - Đang phát - Đã xem) và vòng bán kính Geofence (10m - 30m). |
| **Giọng Đọc AI** | **Microsoft Edge-TTS** | Tự động tổng hợp giọng đọc truyền cảm cho cả **Tiếng Việt** (`vi-VN-HoaiMyNeural`) và **Tiếng Anh** (`en-US-JennyNeural`) hoàn toàn miễn phí. |
| **Trợ Lý Phật Giáo** | **Gemini 2.5 Flash / ProxyPal** | Trợ lý ảo AI **"Pháp Hỷ - Tuệ Giác"** giải đáp lịch sử, giáo lý, ý nghĩa Bảo Tháp 13 tầng, xá lợi trái tim Bồ tát Thích Quảng Đức và đại tượng Phật 35 tấn. Hỗ trợ RAG ngoại tuyến thông minh. |
| **Triết Lý Thiết Kế**| **Offline-First & Low-Cost** | Tính toán Geofencing 100% Client-side (Haversine < 0.5ms), không tốn chi phí Server compute hay Google Maps API key. |

---

## 🏛️ Danh Sách 7 Điểm Tham Quan (POIs) Được Số Hóa

1. **Cổng Tam Quan – Lối Vào Thanh Tịnh** (`POI_01` - Bán kính 18m)
2. **Bảo Tháp 13 Tầng – Biểu Tượng Bất Diệt** (`POI_02` - Bán kính 20m - Nơi thờ xá lợi Trái tim Bồ tát Thích Quảng Đức)
3. **Tòa Đại Chánh Điện – Đại Tượng Phật 35 Tấn** (`POI_03` - Bán kính 25m - Tượng Phật bằng đồng lớn nhất Việt Nam)
4. **Tháp Chuông Đại Hồng Chung 3 Tấn** (`POI_04` - Bán kính 16m)
5. **Nhà Tổ – Tri Ân Chư Vị Tiền Bối Hữu Công** (`POI_05` - Bán kính 18m)
6. **Phòng Trưng Bày Văn Hóa Phật Giáo** (`POI_06` - Bán kính 18m)
7. **Vườn Lâm Tỳ Ni & Hồ Sen Thanh Tịnh** (`POI_07` - Bán kính 16m)

---

## 🚀 Hướng Dẫn Khởi Động Nhanh

### Cách 1: Khởi động 1-Click bằng file Script (Khuyên Dùng)
Nhấp đúp chuột vào file:
```cmd
start_all.bat
```
Hệ thống sẽ tự động khởi chạy Backend (cổng 8000), Frontend (cổng 5173) và mở trình duyệt tại `http://localhost:5173`.

### Cách 2: Khởi động thủ công

#### 1. Khởi động Backend (FastAPI):
```bash
cd "D:\doan CNMP\Backend"
.\venv\Scripts\activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Swagger API Docs: `http://localhost:8000/docs`

#### 2. Khởi động Frontend (React 19.2 + Vite 7 PWA):
```bash
cd "D:\doan CNMP\Frontend"
npm run dev -- --host 0.0.0.0 --port 5173
```
* Web App / PWA: `http://localhost:5173`

---

## 🔑 Tài Khoản Quản Trị Viên (Admin CMS)
* Đường dẫn: Bấm vào biểu tượng lá chắn 🛡️ trên thanh Header hoặc truy cập giao diện Quản trị.
* **Tài khoản**: `admin`
* **Mật khẩu**: `vietnamquoctu2026`

Các chức năng CMS:
- Thêm / Sửa / Xóa POI.
- Tinh chỉnh tọa độ và thanh kéo bán kính Geofence (10m - 30m).
- Biên tập nội dung song ngữ Việt - Anh.
- **Tạo giọng đọc Edge-TTS 1-Click** cho từng điểm tham quan.
- **Xuất mã QR**: Tải file ảnh PNG, file vector SVG hoặc tải toàn bộ mã QR của tất cả POI dạng ZIP để in biển đồng dán thực địa.

---

## 📱 Các Tính Năng Độc Đáo Dành Cho Khách Tham Quan

1. **Mở khóa Autoplay thông minh (Welcome Gateway)**: Giải quyết triệt để rào cản chặn âm thanh của Safari iOS và Chrome Android thông qua nút *"Bắt đầu chuyến chiêm bái"*.
2. **Bộ lọc chống giật định vị (Hysteresis Anti-jitter Buffer)**: Tự động ghi nhận `Visited_POIs` và chỉ reset khi du khách di chuyển ra xa `d > R + 15m`, triệt tiêu hoàn toàn hiện tượng phát lặp âm thanh.
3. **Quét mã QR trong nhà (Indoor Fallback)**: Dành cho Chánh Điện và Phòng Trưng Bày nơi sóng GPS vệ tinh bị suy hao do tường bê tông dày.
4. **Bảng giả lập bước đi GPS (GPS Simulator)**: Hỗ trợ người dùng và ban giám khảo kiểm thử toàn bộ luồng Geofencing ngay trên máy tính mà không cần phải di chuyển thực tế ngoài trời.
5. **Đa ngôn ngữ thời gian thực (Bilingual Switch)**: Chuyển đổi tức thì Tiếng Việt 🇻🇳 và English 🇬🇧 cả về giao diện, bài viết và file giọng đọc audio.
