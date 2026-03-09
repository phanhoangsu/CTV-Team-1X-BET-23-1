import os
from app import create_app
from app.extensions import db
from app.models.user import User

app = create_app()

with app.app_context():
    # Execute raw SQL to migrate data
    conn = db.engine.raw_connection()
    cursor = conn.cursor()
    
    try:
        # Rename old table
        cursor.execute("ALTER TABLE user RENAME TO user_old;")
        conn.commit()
    except Exception as e:
        print("Rename failed, maybe already renamed?", e)
    
    # Let SQLAlchemy create the actual correct table
    db.create_all()
    
    try:
        # Copy data back
        cursor.execute("""
            INSERT INTO user (id, username, email, password_hash, full_name, phone_number, avatar_url, about_me, is_admin, last_seen)
            SELECT 
                id, 
                username, 
                email, 
                COALESCE(password_hash, password), 
                full_name, 
                COALESCE(phone_number, phone), 
                avatar_url, 
                about_me, 
                is_admin, 
                last_seen 
            FROM user_old;
        """)
        conn.commit()
        print("Data migrated successfully.")
        
        # Drop old table
        cursor.execute("DROP TABLE user_old;")
        conn.commit()
        print("Old table dropped. Migration complete.")
        
    except Exception as e:
        print("Data migration failed:", e)
    finally:
        conn.close()
