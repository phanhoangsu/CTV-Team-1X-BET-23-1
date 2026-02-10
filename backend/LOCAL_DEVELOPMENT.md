# Local Development với PostgreSQL

## Yêu cầu
- Python 3.11+
- PostgreSQL 14+ đã cài đặt

## Setup PostgreSQL cho Local Development

### 1. Cài đặt PostgreSQL
**Windows:**
- Download từ: https://www.postgresql.org/download/windows/
- Hoặc dùng: `winget install PostgreSQL.PostgreSQL`

**macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Tạo Database
```bash
# Truy cập PostgreSQL shell
psql -U postgres

# Tạo database và user
CREATE DATABASE flostfound_dev;
CREATE USER flostfound_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE flostfound_dev TO flostfound_user;
\q
```

### 3. Cấu hình Environment Variables
Tạo file `.env` trong thư mục `backend/`:

```bash
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=postgresql://flostfound_user:your_password@localhost:5432/flostfound_dev
```

### 4. Cài đặt Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 5. Chạy Application
```bash
python run.py
```

Application sẽ chạy tại: http://localhost:5000

## Troubleshooting

### Connection Error
Nếu gặp lỗi kết nối PostgreSQL:
1. Kiểm tra PostgreSQL service đang chạy
2. Kiểm tra username/password trong DATABASE_URL
3. Kiểm tra database đã được tạo chưa

### Permission Error
Nếu gặp lỗi permission:
```sql
-- Trong psql
GRANT ALL PRIVILEGES ON DATABASE flostfound_dev TO flostfound_user;
ALTER DATABASE flostfound_dev OWNER TO flostfound_user;
```

## Testing với PostgreSQL

Để chạy tests với PostgreSQL:
```bash
# Set test database URL
export DATABASE_URL=postgresql://flostfound_user:your_password@localhost:5432/flostfound_test

# Run tests
pytest
```
