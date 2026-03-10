# 🚀 F-LostFound - Nền tảng tìm đồ thất lạc FPT

Chào mừng bạn gia nhập đội ngũ phát triển dự án F-LostFound. Đây là hệ thống hỗ trợ sinh viên FPT tìm kiếm đồ thất lạc, tích hợp công nghệ AI để nhận diện bài đăng trùng lặp/spam.

## 🛠 1. Yêu cầu hệ thống (Prerequisites)
Trước khi bắt đầu, hãy đảm bảo máy bạn đã có:
- **Python 3.9+** (Khuyên dùng Python 3.11+)
- **Git**
- **Trình duyệt web** (Chrome, Edge, Firefox...)
- Một IDE tùy chọn (Khuyên dùng VS Code hoặc PyCharm)

## 📥 2. Cài đặt dự án (Setup)

**Bước 1: Clone mã nguồn**
Mở Terminal/Command Prompt và chạy:
```bash
git clone https://github.com/phanhoangsu/CTV-Team-1X-BET-23-1.git
cd CTV-Team-1X-BET-23-1
```

**Bước 2: Tạo môi trường ảo (Khuyên dùng)**
Việc này giúp tránh xung đột thư viện giữa các project.
Đứng tại thư mục `CTV-Team-1X-BET-23-1`, chạy:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```
*(Nếu kích hoạt thành công, bạn sẽ thấy chữ `(venv)` hiện ở đầu dòng Terminal).*

**Bước 3: Cài đặt các thư viện cần thiết**
Dự án sử dụng Flask, các thư viện AI (scikit-learn) và Cloudinary. Chạy lệnh sau:
```bash
cd backend
pip install -r requirements.txt
```
*(Lưu ý: Bắt buộc phải cd vào thư mục `backend` trước khi thực thi lệnh pip install).*

**Bước 4: Cấu hình môi trường (Environment)**
1. Đảm bảo bạn đang ở thư mục `backend`, hãy tìm file `.env.example`.
2. Tạo một file mới tên là `.env` (ngang hàng với file example) và copy nội dung sang.
3. Điền `SECRET_KEY` (có thể là một chuỗi ký tự ngẫu nhiên bất kỳ để bảo mật session).
4. **Đặc biệt lưu ý:** Bổ sung biến môi trường Cloudinary. Tính năng đăng ảnh bài viết bắt buộc phải có thông số này. (Đăng ký tài khoản miễn phí tại trang chủ Cloudinary để lấy key api):
```ini
CLOUDINARY_URL=cloudinary://<API_KEY>:<API_SECRET>@<CLOUD_NAME>
```

## 🗄️ 3. Khởi tạo Cơ sở dữ liệu (Database)

Dự án sử dụng **SQLite** làm mặc định ở môi trường phát triển (Development). Do đó, bạn không cần cài đặt SQL Server hay PostgreSQL phức tạp để bắt đầu chạy thử.
Hệ thống sẽ tự động tạo cấu trúc toàn bộ Table và file database là `flostfound.db` nằm ở trong thư mục `backend/instance/` ngay trong lần đầu tiên bạn khởi chạy hệ thống.

**Tuỳ chọn cho ai muốn xài PostgreSQL:**
Nếu nhóm quyết định dùng Postgres cho môi trường dev, vui lòng tham khảo riêng file `backend/LOCAL_DEVELOPMENT.md` để setup chuỗi kết nối bằng biến `DATABASE_URL`.


## 🚀 4. Chạy ứng dụng
Đảm bảo bạn đang ở thư mục gốc của script là `backend` và môi trường ảo `venv` vẫn đang kích hoạt. Khởi chạy ứng dụng:
```bash
python run.py
```
Khi Terminal hiện thông báo: `Running on http://127.0.0.1:5000` (đôi khi là dòng báo của Gunicorn), lúc này hệ thống đã lên! Hãy mở trình duyệt và truy cập địa chỉ đó để bắt đầu sử dụng.


## 👑 5. Phân quyền Admin (Tuỳ chọn)
Để có đặc quyền Admin duyệt bài đăng hoặc quản lý người dùng, bạn cần tự cấp quyền cho chính mình:
1. **Chạy ứng dụng** ở Bước 4 thành công.
2. Mở trình duyệt, vào trang web đăng ký 1 acc mới bình thường.
3. Mở một **Terminal mới** (nhớ kích hoạt lại `venv` và `cd backend`).
4. Chạy script cấp quyền quản trị:
```bash
python scripts/promote_admin.py
```

## 📂 6. Cấu trúc thư mục (Dành cho Dev)
Để không làm rối code của nhau (tránh Conflict), hãy lưu ý quy tắc tổ chức thư mục của project:
- `backend/app/auth/`: Xử lý Đăng ký/Đăng nhập (Authentication).
- `backend/app/posts/`: Quản lý logic bài đăng tìm đồ/trả đồ (View, Create, Update, Delete).
- `backend/app/messages/`: Hệ thống Chat Real-time inbox giữa các user (SocketIO).
- `backend/app/admin/`: Module xử lý Trang Dashboard, duyệt bài, Logs Audit ghi log hành vi.
- `backend/app/services/`: Nơi chứa logic Models AI (Huấn luyện và nhận diện Spam detection bài đăng rác).
- `backend/app/models/`: Cấu trúc Schema các Table trong Database.
- `frontend/templates/`: Chứa các file giao diện đồ hoạ HTML (viết dưới dạng thẻ Jinja2).
- `frontend/static/`: Chứa tệp tĩnh như file cấu hình CSS, JS và hình ảnh cục bộ.


## 🤝 7. Quy trình làm việc (Git Workflow)
Quy tắc vận hành code đẩy lên Github (hạn chế vỡ code người khác):
1. Nhớ luôn gõ **`git pull origin main`** trước khi bắt đầu tạo hay sửa code mới để đồng bộ hóa mã nguồn.
2. Thiết lập nhánh code (Branch) riêng cho mỗi tính năng bạn làm: **`git checkout -b feature/ten-cua-ban`**.
3. Sau khi code xong, thực hiện tuần tự: `git add .` -> `git commit -m "Báo cáo update nội dung gì..."` -> `git push origin feature/ten-cua-ban`.
4. Trở lại GitHub web trên trình duyệt và tạo Pull Request (PR) để chờ Leader và các anh em test chéo. (Tuyệt đối không push thẳng code lên nhánh `main`).

## 🆘 Hỗ trợ
Nếu quá trình cài đặt gặp lỗi xuất hiện trên Terminal báo đỏ (đặc biệt các dạng lỗi `ImportError` ở thư viện scikit-learn, psycopg binary hoặc cài thiếu package eventlet / SocketIO), bạn hãy copy đoạn text log lỗi đó vào box chat team hoặc hỏi ChatBot để được hỗ trợ lệnh pip cài bổ sung ngay kịp thời!

**Chúc bạn có những trải nghiệm code thật tốt và lấy điểm cao cùng đồng đội CTV Team! 🚩**
