# F-LostFound - Lost and Found Platform

A web application for finding lost items at FPT Hanoi, featuring AI-powered spam detection.

## Project Structure

```
JS/
├── backend/                    # Backend application
│   ├── app/                   # Main application code
│   │   ├── auth/             # Authentication modules (login, register, logout)
│   │   ├── posts/            # Posts modules (view, create, delete)
│   │   ├── messages/         # Messaging modules (chat, inbox, socketio)
│   │   ├── admin/            # Admin modules (dashboard, posts, logs)
│   │   ├── profile/          # User profile module
│   │   ├── models/           # Database models
│   │   ├── services/         # Business logic (AI spam detection)
│   │   └── core/             # Core utilities (decorators, hooks)
│   ├── instance/             # Database files
│   ├── scripts/              # Utility scripts
│   └── run.py               # Application entry point
│
└── frontend/                  # Frontend assets
    ├── templates/            # Jinja2 templates organized by feature
    └── static/               # CSS, JS, images
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set your SECRET_KEY
```

### 3. Initialize Database

```bash
# The database will be created automatically on first run
python run.py
```

### 4. Create Admin User (Optional)

```bash
python scripts/promote_admin.py
```

## Running the Application

```bash
cd backend
python run.py
```

The application will be available at `http://localhost:5000`

## Team Workflow

### Module Organization

Each team member can work on different modules without conflicts:

- **Auth Team**: `app/auth/` (login, register, logout)
- **Posts Team**: `app/posts/` (view, create, delete)
- **Messages Team**: `app/messages/` (chat, inbox, socketio)
- **Admin Team**: `app/admin/` (dashboard, posts, logs)
- **Profile Team**: `app/profile/`
- **Database Team**: `app/models/`
- **AI Team**: `app/services/`

### Git Workflow

1. **Pull latest changes** before starting work
   ```bash
   git pull origin main
   ```

2. **Create a feature branch** for your module
   ```bash
   git checkout -b feature/your-module-name
   ```

3. **Make changes** in your assigned module

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-module-name
   ```

5. **Create Pull Request** for review

### Avoiding Conflicts

- Each module has its own directory - work only in your assigned module
- Templates are organized by feature - edit only your feature's templates
- If you need to modify shared files (models, base.html), coordinate with the team

## Features

- **User Authentication**: Register, login, logout
- **Post Management**: Create, view, search, delete lost/found items
- **AI Spam Detection**: Prevents duplicate posts using TF-IDF and cosine similarity
- **Real-time Messaging**: Chat with other users via SocketIO
- **Admin Dashboard**: User management, post moderation, action logs
- **User Profiles**: View and update profile information

## Technology Stack

- **Backend**: Flask, SQLAlchemy, Flask-Login, Flask-SocketIO
- **AI**: scikit-learn (TF-IDF, cosine similarity)
- **Database**: SQLite
- **Frontend**: Jinja2 templates, Bootstrap, JavaScript
