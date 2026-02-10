# 🚀 Hướng dẫn Deploy lên Render - Từng bước

## Bước 1: Push code lên GitHub

### 1.1. Kiểm tra Git status
```bash
cd c:\Users\Admin\Desktop\JS
git status
```

### 1.2. Add tất cả files (trừ .env - đã có trong .gitignore)
```bash
git add .
```

### 1.3. Commit với message rõ ràng
```bash
git commit -m "Add Render deployment configuration with PostgreSQL"
```

### 1.4. Push lên GitHub
```bash
git push origin main
```
> **Lưu ý:** Nếu branch của bạn là `master` thay vì `main`, dùng `git push origin master`

---

## Bước 2: Tạo Web Service trên Render

### 2.1. Đăng nhập Render
1. Truy cập: https://render.com
2. Đăng nhập bằng GitHub account

### 2.2. Tạo Web Service mới
1. Click nút **"New +"** (góc trên bên phải)
2. Chọn **"Web Service"**

### 2.3. Connect GitHub Repository
1. Chọn repository của bạn từ danh sách
2. Nếu không thấy repo:
   - Click **"Configure account"**
   - Grant access cho repository

### 2.4. Cấu hình Web Service

Render sẽ **TỰ ĐỘNG** phát hiện file `render.yaml` và điền sẵn các thông tin:

**Thông tin sẽ được auto-fill từ render.yaml:**
- ✅ **Name:** `flostfound-app`
- ✅ **Environment:** `Python`
- ✅ **Region:** `Singapore`
- ✅ **Branch:** `main` (hoặc branch bạn chọn)
- ✅ **Build Command:** `./build.sh`
- ✅ **Start Command:** `gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT run:app`

**Environment Variables (auto-configured):**
- ✅ `FLASK_ENV=production`
- ✅ `SECRET_KEY` (auto-generated)
- ✅ `DATABASE_URL` (linked từ database bạn đã tạo)

### 2.5. Link Database
Render sẽ tự động:
1. Phát hiện database `flostfound-db` (bạn đã tạo)
2. Link database với web service
3. Inject `DATABASE_URL` vào environment variables

### 2.6. Deploy
1. Click **"Create Web Service"**
2. Render sẽ bắt đầu build và deploy

---

## Bước 3: Theo dõi Deployment

### 3.1. Xem Build Logs
- Render sẽ hiển thị real-time logs
- Các bước sẽ thấy:
  ```
  ✓ Cloning repository
  ✓ Installing dependencies (pip install -r requirements.txt)
  ✓ Running build.sh
    - Creating database tables
    - Refreshing AI model
  ✓ Starting application with Gunicorn
  ```

### 3.2. Thời gian deploy
- **Lần đầu:** ~5-10 phút
- **Lần sau:** ~2-3 phút (nếu không thay đổi dependencies)

### 3.3. Kiểm tra deployment thành công
Khi thấy:
```
==> Your service is live 🎉
```

---

## Bước 4: Test Application

### 4.1. Truy cập URL
Render sẽ cung cấp URL dạng:
```
https://flostfound-app.onrender.com
```

### 4.2. Test các chức năng chính
- [ ] Trang chủ load thành công
- [ ] Register account mới
- [ ] Login
- [ ] Tạo post (lost/found item)
- [ ] AI spam detection hoạt động
- [ ] Real-time chat (SocketIO)
- [ ] Admin dashboard (nếu có admin account)

---

## Troubleshooting

### ❌ Build fails với "Permission denied: ./build.sh"
**Giải pháp:**
```bash
git update-index --chmod=+x backend/build.sh
git commit -m "Make build.sh executable"
git push
```

### ❌ "DATABASE_URL not found"
**Nguyên nhân:** Database chưa được link với web service

**Giải pháp:**
1. Vào Render dashboard
2. Chọn Web Service
3. Tab "Environment"
4. Thêm `DATABASE_URL` từ database bạn đã tạo:
   ```
   postgresql://flostfound_db_user:ALMgWwtn0q7iO5xekgDIQNiGwWZqySeq@dpg-d65g6hu3jp1c73apv0v0-a.singapore-postgres.render.com/flostfound_db
   ```

### ❌ Application crash sau khi start
**Kiểm tra:**
1. Xem logs trên Render dashboard
2. Verify `SECRET_KEY` đã được set
3. Verify database connection string đúng

### ❌ SocketIO không hoạt động
**Nguyên nhân:** Client-side connection URL sai

**Kiểm tra:** Frontend code có đúng URL không:
```javascript
// Phải dùng production URL, không phải localhost
const socket = io('https://flostfound-app.onrender.com');
```

---

## Auto-Deployment (Bonus)

Sau khi setup xong, **MỖI LẦN** bạn push code mới lên GitHub:
1. Render tự động detect changes
2. Tự động build lại
3. Tự động deploy version mới
4. Zero downtime deployment

**Workflow:**
```bash
# Local development
git add .
git commit -m "Add new feature"
git push

# Render tự động deploy (không cần làm gì thêm!)
```

---

## Summary

**Những gì bạn CẦN làm:**
1. ✅ Push code lên GitHub
2. ✅ Tạo Web Service trên Render
3. ✅ Connect GitHub repo
4. ✅ Đợi Render build & deploy
5. ✅ Test application

**Những gì Render TỰ ĐỘNG làm:**
- ✅ Detect `render.yaml`
- ✅ Link database
- ✅ Set environment variables
- ✅ Run build script
- ✅ Start application
- ✅ Provide HTTPS URL
- ✅ Auto-deploy khi có code mới

**Thời gian:** ~10 phút cho lần đầu tiên! 🚀
