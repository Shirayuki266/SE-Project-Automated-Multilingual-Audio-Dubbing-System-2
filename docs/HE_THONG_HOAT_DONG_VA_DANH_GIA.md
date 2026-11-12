# BÁO CÁO TOÀN DIỆN VỀ KIẾN TRÚC VÀ ĐÁNH GIÁ CHẤT LƯỢNG HỆ THỐNG
## HỆ THỐNG THUYẾT MINH TỰ ĐỘNG ĐA NGÔN NGỮ VIỆT NAM QUỐC TỰ

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc & Cơ Chế Hoạt Động Của Hệ Thống](#1-tổng-quan-kiến-trúc--cơ-chế-hoạt-động)
2. [Đánh Giá Các Vấn Đề Nghiêm Trọng Về Audio](#2-đánh-giá-các-vấn-đề-nghiêm-trọng-về-audio)
3. [Đánh Giá Vấn Đề Dữ Liệu Ảo (Mock Data vs Real Data)](#3-đánh-giá-vấn-đề-dữ-liệu-ảo)
4. [Đánh Giá Lượng File Và Code Rác / Dư Thừa](#4-đánh-giá-lượng-file-và-code-rác--dư-thừa)
5. [Đánh Giá Thiết Kế Cơ Sở Dữ Liệu (Có Dư Thừa Không?)](#5-đánh-giá-thiết-kế-cơ-sở-dữ-liệu)
6. [Biểu Đồ Luồng Dữ Liệu (DFD - Data Flow Diagrams)](#6-biểu-đồ-luồng-dữ-liệu-dfd)
   - 6.1 DFD Cấp 0 (Context Diagram)
   - 6.2 DFD Cấp 1 (System Level Breakdown)
   - 6.3 DFD Cấp 2 (Tiến trình Định vị GPS & Kích hoạt Thuyết minh Tự động)
   - 6.4 DFD Cấp 2 (Tiến trình Dịch thuật & Thuyết minh Đa ngữ Gemini AI)
7. [Kết Luận & Lộ Trình Tối Ưu Hóa Khuyến Nghị](#7-kết-luận--lộ-trình-tối-ưu-hóa)

---

## 1. TỔNG QUAN KIẾN TRÚC & CƠ CHẾ HOẠT ĐỘNG

Hệ thống được xây dựng dưới dạng **Web App Full-Stack đơn khối (Single Monolith Process)** chạy trên nền tảng Node.js 22, kết hợp:
- **Frontend SPA**: React 19, TypeScript, Tailwind CSS, Leaflet Map, Motion (Framer Motion), Lucide Icons.
- **Backend API Server**: Node.js Express 4, kiến trúc 3 tầng (Controllers $\rightarrow$ Services $\rightarrow$ Repositories $\rightarrow$ DB Engine).
- **Trình nạp & Dev Server**: Vite 8 gắn trực tiếp vào Express thông qua `vite.middlewares` (chạy trên cùng 1 cổng duy nhất `3000`).
- **Cơ chế hoạt động cốt lõi**:
  1. **Khách viếng thăm mở trình duyệt**: Client gửi thông số phần cứng (User-Agent, độ phân giải màn hình, ngôn ngữ, timezone) lên API `/api/real-devices/access` để ghi nhận thiết bị thực không giả lập (chống spam số liệu bằng thuật toán Fingerprint SHA-256).
  2. **Bắt tín hiệu GPS**: Hook `useGPSTracker` lấy tọa độ từ trình duyệt qua `navigator.geolocation.watchPosition`, đưa qua **Bộ lọc Kalman 2D** (`MobileGPSKalmanFilter`) để triệt tiêu hiện tượng nhảy tọa độ (GPS drift) trong hành lang chùa.
  3. **Kiểm tra Vùng địa lý ảo (Geofencing)**: Thuật toán Haversine đo khoảng cách giữa khách và 8 điểm chiêm bái (POI). Nếu khoảng cách $\le$ bán kính geofence (15m - 25m), hệ thống tự động rung chuông cảnh báo và kích hoạt chế độ thuyết minh tự động.
  4. **Phát âm thuyết minh**: Kích hoạt bộ máy `AudioSpeechEngine`, xử lý ngắt đoạn câu thông minh để đọc thuyết minh theo ngôn ngữ được chọn.
  5. **Quản trị viên (Admin Portal)**: Đăng nhập xác thực JWT bí mật tại `/api/auth/login`, quản lý danh sách POI, chỉnh sửa tọa độ trực quan trên bản đồ kéo thả, quản lý khóa/mở khóa thiết bị thực, xem biểu đồ phân tích khách viếng thăm.

---

## 2. ĐÁNH GIÁ CÁC VẤN ĐỀ NGHIÊM TRỌNG VỀ AUDIO

Hệ thống hiện tại có **3 vấn đề nghiêm trọng** liên quan đến phần Audio:

### 2.1 Xung đột giữa File MP3 tĩnh và Bộ máy Text-To-Speech (TTS)
- **Thực tế trong mã nguồn**: Trong thư mục `public/audio/` có tới **96 file `.mp3`** (`poi-*-vi.mp3`, `poi-*-en.mp3`,...). Tuy nhiên, khi kiểm tra kịch bản sinh ra các file này (`scripts/generate-mp3-audio.py`), các file MP3 này **thực chất chỉ là tiếng chuông chùa nhân tạo ngân dài 6.5 giây** được lặp đi lặp lại, **HOÀN TOÀN KHÔNG CÓ GIỌNG NÓI THUYẾT MINH NỘI DUNG**.
- **Hệ quả khi chạy**: Trong `src/utils/audioSpeech.ts`, phương thức `playNarration` có logic:
  ```typescript
  if (isDedicatedAudioUrl) {
    const audio = new Audio(audioUrl); // Phát file MP3
    ...
  }
  ```
  Nếu hệ thống trỏ vào file MP3 tĩnh này, người dùng **chỉ nghe thấy tiếng chuông boong 6 giây rồi tắt hẳn**, không nghe thấy bất kỳ lời giới thiệu lịch sử nào! Muốn nghe được toàn bộ bài thuyết minh 300 từ, hệ thống bắt buộc phải bỏ qua file MP3 và chuyển sang dùng Web Speech API của trình duyệt.
- **Kết luận**: Có sự đánh tráo khái niệm giữa "file audio thuyết minh" và "tiếng chuông dạo đầu".

### 2.2 Sự không ổn định của Web Speech API trên iOS Safari (WebKit)
Khi dùng Web Speech API để đọc tiếng Việt trên điện thoại iPhone/iPad:
- **Lỗi 15-second cutoff**: WebKit trên iOS tự động hủy (cancel) tiến trình phát giọng nói nếu đoạn văn bản đọc liên tục quá 15 giây mà không có tương tác mới.
- **Lỗi đánh vần (Letter spelling)**: Nếu một câu dài trên 100 ký tự tiếng Việt có dấu, engine iOS thường ngắt và chuyển sang đánh vần từng chữ cái (ví dụ: "V-I-E-T-N-A-M"). Mặc dù mã nguồn đã cố gắng khắc phục bằng hàm `splitTextIntoSentences` cắt dưới 88 ký tự, đây vẫn chỉ là giải pháp chắp vá phía client.
- **Lỗi thiếu gói giọng nói**: Trên rất nhiều máy iOS, gói giọng tiếng Việt chuẩn ("Linh", "Mai") **chưa được tải về máy** theo mặc định của Apple. Khi đó trình duyệt sẽ bị câm tiếng hoặc đọc bằng phát âm tiếng Anh lơ lớ.

### 2.3 Thiếu cơ chế Server-side Audio Synthesis (Cloud TTS)
- Dự án chưa tích hợp dịch vụ Text-to-Speech phía máy chủ thực thụ (như Google Cloud Text-to-Speech API hoặc ElevenLabs) để sinh ra file MP3 giọng đọc chuẩn, lưu trên CDN/Server. Việc phụ thuộc 100% vào chip và trình duyệt của điện thoại người dùng khiến chất lượng âm thanh không đồng đều giữa các dòng máy.

---

## 3. ĐÁNH GIÁ VẤN ĐỀ DỮ LIỆU ẢO (MOCK DATA VS REAL DATA)

| Hạng mục dữ liệu | Trạng thái thực tế trong mã nguồn | Đánh giá & Rủi ro |
| :--- | :--- | :--- |
| **8 Điểm Chiêm Bái (POI)** | Hardcode trong `src/server/repositories/seedPOIs.ts` | **Chấp nhận được**: Đây là dữ liệu thực tế về tọa độ, lịch sử và hình ảnh của Việt Nam Quốc Tự tại Quận 10. Tuy nhiên, nếu không có MongoDB Atlas bên ngoài, mỗi lần server khởi động lại toàn bộ thay đổi trong Admin sẽ bị reset về bộ seed cứng này. |
| **Bản dịch 10 ngôn ngữ phụ** | Hardcode sẵn các đoạn mô tả ngắn mang tính tượng trưng | **Còn hình thức**: Các bản dịch tiếng Nga, Đức, Tây Ban Nha, Thái, Indo trong seedPOIs chỉ gồm 1-2 câu ngắn mô tả chung chung, chưa phải bài thuyết minh đầy đủ. Khi người dùng bấm nút AI dịch mới gọi Gemini để viết lại. |
| **Thống kê Khách Viếng Thăm** | Tồn tại cơ chế song song: `dailyDeviceAccess` và `real_devices` | **Đã cải thiện nhưng còn thừa**: Trước đây hệ thống có hiện tượng tạo dữ liệu ảo (random visitor/starts). Hiện tại đã bổ sung bảng `real_devices` chỉ ghi nhận thiết bị thật. Tuy nhiên hàm `getStats()` vẫn có các mảng hardcode số 0 cho 24 giờ (`hourlyActivity`). |
| **Thiết bị Thực (Real Devices)** | Tính năng thu thập Fingerprint + User-Agent thực tế | **Tốt**: Bảng `real_devices` chỉ tạo record khi có request HTTP thật từ trình duyệt, có trích xuất đúng dòng máy (iPhone, Android, Windows, Mac). |

---

## 4. ĐÁNH GIÁ LƯỢNG FILE VÀ CODE RÁC / DƯ THỪA

Mã nguồn hiện đang chứa nhiều thành phần thừa không phục vụ runtime của ứng dụng:

### 4.1 Thư mục Python không cần thiết (`/python/spatial_ai_service.py`)
- **Tình trạng**: File `spatial_ai_service.py` dài 150 dòng viết bằng Python 3 để tính Haversine và tổng hợp sóng âm chuông chùa (`generate_temple_bell_wav`).
- **Thực tế**: Backend Node.js đã có sẵn `src/utils/geo.ts` và `src/utils/audioSynth.ts` viết bằng TypeScript thuần với tốc độ cao hơn và không cần tiến trình con. File Python này **không hề được gọi bởi bất kỳ API nào trong `api.ts`**, chỉ duy nhất file `test/backend.test.ts` gọi nó để chạy test cho có.
- **Khuyến nghị**: Nên dọn dẹp hoặc loại bỏ để giảm tải kích thước repo và loại bỏ phụ thuộc vào runtime Python trong môi trường Node.js.

### 4.2 Thư mục ảnh và tệp tạm trong Artifacts
- Các file trong `/.aistudio/artifacts/brain/.../.tempmediaStorage/` (các file `.bmp`, `.png` cũ từ quá trình import) không còn được ứng dụng tham chiếu đến.
- Thư mục `/public/assets/aistudio/` chứa các ảnh chụp màn hình UI cũ (`image_0315ecc5.png`) không dùng trong giao diện chính.

### 4.3 96 file MP3 chuông chiếm dung lượng vô ích
- Thư mục `public/audio/` chứa 96 file `.mp3` chiếm ~10MB dung lượng tĩnh, nhưng tất cả chỉ chứa âm thanh chuông 6.5 giây giống hệt nhau.

---

## 5. ĐÁNH GIÁ THIẾT KẾ CƠ SỞ DỮ LIỆU (CÓ DƯ THỪA KHÔNG?)

Thiết kế cơ sở dữ liệu hiện tại có **3 điểm dư thừa và chưa tối ưu**:

### 5.1 Thực thể `Campus` (Cơ sở) bị thừa đối với một ứng dụng đơn chùa
- Trong `db.ts`, có định nghĩa Model `Campus`, bảng `campuses`, seed `seedCampus`, các hàm `getAllCampuses()`, `getCampusById()`.
- **Thực tế**: Toàn bộ ứng dụng từ đầu đến cuối chỉ phục vụ **duy nhất 1 khuôn viên** là "Việt Nam Quốc Tự" (`vnqt-campus-01`). Mọi POI đều gán cứng `campus_id: 'vnqt-campus-01'`.
- **Đánh giá**: Thiết kế này là **Over-engineering** (thiết kế vượt quá nhu cầu), chỉ có ích nếu sau này mở rộng thành hệ thống quản lý danh lam thắng cảnh toàn quốc. Hiện tại nó làm phức tạp thêm các câu lệnh truy vấn và bộ lọc.

### 5.2 Mô hình hóa quan hệ kiểu RDBMS (Relational) trên nền MongoDB NoSQL
- Trong MongoDB, nguyên lý thiết kế tối ưu là **Document Embedding**: một điểm POI nên chứa luôn mảng `translations: []` và mảng `media: []` trong cùng 1 Document.
- **Cách làm hiện tại của dự án**: Tách thành 3 bảng riêng biệt (`pois`, `poi_translations`, `poi_media`) giống hệt cơ sở dữ liệu quan hệ SQL (MySQL/PostgreSQL), sau đó trong code TypeScript phải viết hàm `assembleRichPOI` để duyệt vòng lặp `for` thủ công kết nối (Join) các mảng lại với nhau. Khi xóa 1 POI (`deletePOI`), code phải duyệt thủ công toàn bộ bảng dịch và media để xóa theo (cascade delete bằng tay).
- **Đánh giá**: Vừa làm chậm tốc độ đọc dữ liệu vừa tăng độ phức tạp của code.

### 5.3 Trùng lặp giữa `dailyDeviceAccess` và `real_devices`
- Trong `MongoDatabaseEngine` tồn tại song song 2 cấu trúc:
  1. `dailyDeviceAccess`: Lưu lượt truy cập theo ngày (`fingerprintHash_dateStr`).
  2. `real_devices`: Lưu thông tin thiết bị thực theo `device_id`.
- Cả hai bảng đều lưu các trường: IP, User-Agent, Device Type, Language, thời gian truy cập. Điều này làm tăng gấp đôi dung lượng bộ nhớ RAM và dễ dẫn tới tình trạng bất đồng bộ số liệu giữa màn hình Thống kê chung và màn hình Quản lý thiết bị.

---

## 6. BIỂU ĐỒ LUỒNG DỮ LIỆU (DFD - DATA FLOW DIAGRAMS)

### 6.1 DFD CẤP 0 (Context Diagram - Sơ đồ ngữ cảnh toàn hệ thống)

```
                            [ Tín hiệu Vệ tinh GPS ]
                                       │
                                       │ Tọa độ thô (WGS84 Lat, Lng, Accuracy)
                                       ▼
  [ Khách Hành Hương ] ────────► ┌──────────────────────────────────────┐ ────────► [ Google Gemini AI ]
    (Điện thoại di động)         │                                      │   Yêu cầu   (gemini-3.8-flash)
                                 │   HỆ THỐNG THUYẾT MINH TỰ ĐỘNG       │   dịch thuật
    ◄─────────────────────────── │        VIỆT NAM QUỐC TỰ              │ ◄──────────
      - Bản đồ khuôn viên & vị trí│                                      │   Bản dịch 12 ngôn ngữ
      - Thuyết minh tiếng nói    └──────────────────────────────────────┘
      - Quét mã QR POI                         ▲          │
                                   Đăng nhập   │          │ Ghi nhận thiết bị thực
                                   & Thao tác  │          │ & Thống kê lưu lượng
                                               │          ▼
                                       [ Quản Trị Viên Chùa ]
                                        (Admin CMS Dashboard)
```

---

### 6.2 DFD CẤP 1 (Phân Rã Chức Năng Cốt Lõi Hệ Thống)

```
[ Người Dùng / GPS ]
         │
         │ (Tọa độ WGS84)
         ▼
   ┌───────────┐         Tọa độ mượt
   │  1.0      │ ────────────────────────┐
   │ Lọc Nhiễu │                         │
   │ GPS Kalman│                         ▼
   └───────────┘                ┌────────────────┐
                                │  2.0           │ ◄─────── ( D1: Kho Dữ Liệu POI & Tọa Độ )
                                │ Nhận Diện POI  │
                                │ & Geofencing   │
                                └────────────────┘
                                         │
                                         │ POI gần nhất (< 25m)
                                         ▼
                                ┌────────────────┐
                                │  3.0           │ ◄─────── ( D2: Kho Bản Dịch & Audio )
                                │ Bộ Máy         │
                                │ Thuyết Minh    │ ────────► [ Loa Thiết Bị / Web Speech ]
                                └────────────────┘
                                         │
                          Nếu chưa có ngôn ngữ yêu cầu
                                         ▼
                                ┌────────────────┐
                                │  4.0           │ ────────► [ Gemini 3.8 Flash API ]
                                │ Dịch Thuật AI  │ ◄──────── (Trả về JSON dịch thuật)
                                └────────────────┘
                                         │
                                         ▼ Ghi vào D2

[ Thông tin phần cứng ] ───────► ┌────────────────┐
(UA, Màn hình, IP)               │  5.0           │ ────────► ( D3: Bảng Thiết Bị Thực real_devices )
                                │ Giám Sát Thiết │
                                │ Bị Thực Tế     │
                                └────────────────┘
                                         │
                                         ▼
[ Admin Quản Trị ] ────────────► ┌────────────────┐
                                │  6.0           │ ◄─────── Đọc D1, D2, D3
                                │ Báo Cáo & CMS  │ ────────► Xuất biểu đồ & Cập nhật POI
                                └────────────────┘
```

---

### 6.3 DFD CẤP 2 (Tiến Trình 1.0 & 2.0: Định Vị GPS & Kích Hoạt Thuyết Minh)

```
[ Cảm biến GPS điện thoại ]
             │
             │ {lat, lng, accuracy, timestamp, heading}
             ▼
   ┌───────────────────────┐
   │ 1.1 Khởi tạo ma trận  │
   │     sai số Kalman     │
   └───────────────────────┘
             │
             ▼
   ┌───────────────────────┐
   │ 1.2 Kiểm tra Outlier  │ ─── [Nếu tốc độ > 7m/s & accuracy > 20m] ──► (Hủy bỏ điểm nhảy cóc)
   │     (Gate Rejection)  │
   └───────────────────────┘
             │ Điểm hợp lệ
             ▼
   ┌───────────────────────┐
   │ 1.3 Cập nhật vị trí   │
   │     và góc xoay mượt  │
   └───────────────────────┘
             │
             │ Tọa độ đã lọc {lat_kalman, lng_kalman}
             ▼
   ┌───────────────────────┐
   │ 2.1 Tính Haversine    │ ◄─── Đọc danh sách tọa độ 8 POI từ CSDL
   │     với từng POI      │
   └───────────────────────┘
             │
             │ Khoảng cách d(m) tới từng POI
             ▼
   ┌───────────────────────┐
   │ 2.2 So sánh bán kính  │
   │     Geofence (<= 25m) │
   └───────────────────────┘
             │
      ┌──────┴────────────────────────┐
      │ d <= bán kính geofence        │ d > bán kính geofence
      ▼                               ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│ Kích hoạt chuông thông báo│   │ Chỉ cập nhật vị trí marker│
│ & Chuyển sang POI đang xem│   │ trên bản đồ Leaflet       │
│ & Bắt đầu phát Thuyết minh│   └───────────────────────────┘
└───────────────────────────┘
```

---

### 6.4 DFD CẤP 2 (Tiến Trình 3.0 & 4.0: Thuyết Minh Âm Thanh & Dịch Thuật AI)

```
[ Lệnh Phát Thuyết Minh (POI_ID, Ngôn Ngữ) ]
                     │
                     ▼
        ┌─────────────────────────┐
        │ 3.1 Kiểm tra bản dịch   │ ◄─── ( Kho lưu trữ POI Translations )
        │     trong Cơ sở dữ liệu │
        └─────────────────────────┘
                     │
         ┌───────────┴────────────────────────┐
         │ Đã tồn tại                         │ Chưa có bản dịch (VD: tiếng Đức, Ý)
         ▼                                    ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│ Lấy Tiêu đề, Giới thiệu,│          │ 4.1 Tạo Prompt dịch     │
│ và Nội dung thuyết minh │          │     chuyên sâu Phật học │
└─────────────────────────┘          └─────────────────────────┘
         │                                    │
         │                                    ▼
         │                           ┌─────────────────────────┐
         │                           │ 4.2 Gửi tới Gemini API  │
         │                           │ (gemini-3.8-flash JSON) │
         │                           └─────────────────────────┘
         │                                    │
         │                                    ▼
         │                           ┌─────────────────────────┐
         │                           │ 4.3 Lưu bản dịch mới    │ ──► Ghi vào CSDL
         │                           │     vào CSDL MongoDB    │
         │                           └─────────────────────────┘
         │                                    │
         └─────────────────┬──────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ 3.2 Tách câu thông minh │ (Cắt thành các đoạn <= 88 ký tự
              │     (Sentence Splitter) │  theo dấu câu tự nhiên để chống lỗi iOS)
              └─────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ 3.3 Khóa méo tiếng Apple│ (Nếu là iOS/macOS: rate = 1.0, pitch = 1.0,
              │     (Distortion Shield) │  ưu tiên giọng Apple Linh/Mai)
              └─────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │ 3.4 Đẩy vào hàng đợi    │ ──► [ Loa Điện Thoại / Tai Nghe Khách ]
              │     Web Speech Synth    │
              └─────────────────────────┘
```

---

## 7. KẾT LUẬN & LỘ TRÌNH TỐI ƯU HÓA KHUYẾN NGHỊ

1. **Về Audio**:
   - Cần phân định rõ ràng giữa file hiệu ứng chuông (`chime.mp3`) và bài thuyết minh giọng nói.
   - Nên chuyển hướng tích hợp Text-To-Speech đám mây (Google Cloud TTS / Gemini Audio output) để tạo file âm thanh thực thụ lưu sẵn trên máy chủ thay vì phụ thuộc vào bộ tổng hợp giọng nói không ổn định của hệ điều hành di động.
2. **Về Dữ liệu & Code rác**:
   - Loại bỏ file `python/spatial_ai_service.py` và script tạo mp3 giả lập để làm sạch mã nguồn.
   - Hợp nhất 2 bảng `dailyDeviceAccess` và `real_devices` thành 1 bảng duy nhất quản lý thiết bị thực.
3. **Về Cơ sở dữ liệu**:
   - Đưa cấu trúc dữ liệu về chuẩn Document của MongoDB (nhúng trực tiếp `translations` và `media` vào document `poi`), loại bỏ các bảng quan hệ rời rạc để tăng gấp đôi tốc độ truy vấn.
   - Loại bỏ thực thể `Campus` dư thừa, đơn giản hóa cấu trúc thực thể.
