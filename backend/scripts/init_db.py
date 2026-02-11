import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.services.ai_trainer import refresh_ai_model

def init_db():
    app = create_app()
    with app.app_context():
        # Create tables
        print("Creating database tables...")
        db.create_all()
        print("✅ Database tables created successfully!")
        
        # Create admin user if not exists
        if not User.query.filter_by(username='admin').first():
            print("Creating admin user...")
            admin = User(username='admin', email='admin@example.com', is_admin=True)
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("✅ Admin user created: admin / admin123")
        else:
            print("ℹ️ Admin user already exists.")
            
        # Refresh AI model
        try:
            print("Refreshing AI model...")
            refresh_ai_model()
            print("✅ AI model refreshed successfully")
        except Exception as e:
            print(f"⚠️ Warning: Failed to refresh AI model: {e}")

if __name__ == "__main__":
    init_db()
