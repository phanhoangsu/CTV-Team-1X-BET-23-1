# F-LostFound - Render Deployment

## Environment Variables cần thiết trên Render

Khi tạo Web Service trên Render, bạn cần set các environment variables sau:

### Tự động (từ render.yaml)
- `FLASK_ENV=production`
- `SECRET_KEY` - Render sẽ tự generate
- `DATABASE_URL` - Render sẽ tự inject từ PostgreSQL database
- `PYTHON_VERSION=3.11.0`

### Thủ công (nếu cần)
Nếu bạn không dùng render.yaml, cần set thủ công:
- `FLASK_ENV=production`
- `SECRET_KEY=<your-secret-key>` (generate bằng: `python -c "import secrets; print(secrets.token_hex(32))"`)

## Các bước deploy

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### 2. Tạo Web Service trên Render
1. Đăng nhập vào https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository của bạn
4. Render sẽ tự động detect `render.yaml` và tạo cả Web Service + PostgreSQL Database

### 3. Render sẽ tự động:
- Tạo PostgreSQL database (free tier)
- Chạy `build.sh` để:
  - Install dependencies từ `requirements.txt`
  - Tạo database tables
  - Refresh AI model
- Start application với Gunicorn
- Inject DATABASE_URL vào environment

### 4. Kiểm tra deployment
- Xem logs để đảm bảo build thành công
- Truy cập URL được cung cấp bởi Render
- Test các chức năng chính

## Lưu ý quan trọng

### SocketIO với Gunicorn
- Đã cấu hình sử dụng `eventlet` worker
- Chỉ dùng 1 worker (`-w 1`) để tránh conflict với SocketIO

### Database
- PostgreSQL database sẽ persistent (không mất data khi redeploy)
- Free tier có giới hạn 90 ngày, sau đó cần upgrade hoặc tạo database mới

### Static Files
- Flask sẽ serve static files trực tiếp
- Trong production thực tế, nên dùng CDN hoặc nginx

## Troubleshooting

### Build fails
- Kiểm tra logs trên Render dashboard
- Đảm bảo `build.sh` có execute permission: `git update-index --chmod=+x backend/build.sh`

### Database connection error
- Kiểm tra DATABASE_URL đã được inject chưa
- Xem logs để debug connection string

### SocketIO không hoạt động
- Đảm bảo đang dùng eventlet worker
- Kiểm tra client-side connection URL
