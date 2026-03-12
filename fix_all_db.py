import sqlite3
import os

def migrate_db(db_path):
    if not os.path.exists(db_path):
        return
    
    print(f"[*] Migrating: {db_path}")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(item)")
        columns = [col[1] for col in cursor.fetchall()]
        
        new_columns = [
            ('specific_location', 'VARCHAR(200)'),
            ('category', 'VARCHAR(100)'),
            ('phone_number', 'VARCHAR(20)'),
            ('facebook_url', 'VARCHAR(500)'),
            ('incident_date', 'DATETIME'),
            ('status', 'VARCHAR(20) DEFAULT "Open"'),
            ('image_url', 'VARCHAR(500)')
        ]
        
        for col_name, col_type in new_columns:
            if col_name not in columns:
                print(f"  [+] Adding {col_name}...")
                cursor.execute(f"ALTER TABLE item ADD COLUMN {col_name} {col_type}")
            else:
                print(f"  [.] {col_name} exists.")
                
        conn.commit()
        conn.close()
        print(f"[+] Done with {db_path}\n")
    except Exception as e:
        print(f"  [!] Error migrating {db_path}: {e}")

# Các vị trí database có thể tồn tại (tính từ cả thư mục gốc và thư mục backend)
search_paths = [
    'instance/flostfound_dev.db',
    'instance/flostfound.db',
    'backend/instance/flostfound_dev.db',
    'backend/instance/flostfound.db',
    'flostfound_dev.db',
    'flostfound.db'
]

for path in search_paths:
    migrate_db(path)
