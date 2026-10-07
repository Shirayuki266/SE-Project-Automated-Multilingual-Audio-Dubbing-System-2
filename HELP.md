# Hướng Dẫn Cài Đặt Môi Trường Ảo Python

Tài liệu này hướng dẫn cách khởi tạo môi trường ảo (virtual environment) và cài đặt các thư viện cần thiết từ file `requirements.txt`.

## Các bước thực hiện

### Bước 1: Tạo môi trường ảo
Mở terminal (hoặc Command Prompt/PowerShell) tại thư mục dự án của bạn và chạy lệnh sau:
```bash
python -m venv venv
```
*Lưu ý: Lệnh này sẽ tạo một thư mục tên là `venv` chứa toàn bộ cấu hình môi trường ảo.*

### Bước 2: Kích hoạt môi trường ảo
Tùy thuộc vào hệ điều hành bạn đang sử dụng, hãy chọn lệnh kích hoạt tương ứng:

*   **Trên Windows (Command Prompt / PowerShell):**
    ```bash
    venv\Scripts\activate
    ```
*   **Trên macOS / Linux:**
    ```bash
    source venv/bin/activate
    ```

> 💡 **Dấu hiệu nhận biết:** Sau khi kích hoạt thành công, bạn sẽ thấy chữ `(venv)` xuất hiện ở đầu dòng lệnh của terminal.

### Bước 3: Cài đặt các thư viện từ `requirements.txt`
Sau khi môi trường ảo đã được kích hoạt, chạy lệnh sau để tự động cài đặt tất cả các gói thư viện được yêu cầu:
```bash
pip install -r requirements.txt
```

---

## Hướng dẫn bổ sung (Khi làm việc xong)

*   **Hủy kích hoạt môi trường ảo:** Khi không muốn làm việc trên môi trường ảo nữa, bạn chỉ cần gõ lệnh:
    ```bash
    deactivate
    ```
*   **Cập nhật file `requirements.txt`:** Nếu bạn có cài đặt thêm thư viện mới và muốn lưu lại vào file, hãy dùng lệnh:
    ```bash
    pip freeze > requirements.txt
    ```
