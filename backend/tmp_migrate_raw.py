import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'flostfound_dev.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check if 'password' column exists in user
    cursor.execute("PRAGMA table_info(user)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'password' in columns:
        print("Starting migration...")
        
        # 1. Rename old table
        cursor.execute("ALTER TABLE user RENAME TO user_old;")
        
        # 2. Create new table matching User model
        cursor.execute("""
            CREATE TABLE user (
                id INTEGER NOT NULL PRIMARY KEY, 
                username VARCHAR(150) NOT NULL, 
                email VARCHAR(150) NOT NULL, 
                password_hash VARCHAR(255) NOT NULL, 
                full_name VARCHAR(100), 
                phone_number VARCHAR(20), 
                avatar_url VARCHAR(300), 
                about_me TEXT, 
                is_admin BOOLEAN, 
                last_seen DATETIME, 
                UNIQUE (email), 
                UNIQUE (username)
            );
        """)
        
        # 3. Copy data
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
        
        # 4. Drop old table
        cursor.execute("DROP TABLE user_old;")
        
        conn.commit()
        print("Migration complete!")
    else:
        print("Column 'password' does not exist in 'user' table. No migration needed.")
        
except Exception as e:
    print("Migration failed:", e)
    conn.rollback()
finally:
    if 'conn' in locals():
        conn.close()
