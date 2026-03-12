import sqlite3
import os

db_paths = [
    os.path.join('backend', 'instance', 'flostfound.db'),
    os.path.join('instance', 'flostfound.db'),
    'flostfound.db'
]

for db_path in db_paths:
    if os.path.exists(db_path):
        print(f"Checking database: {db_path}")
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(item)")
            columns = cursor.fetchall()
            print(f"Columns in 'item' table for {db_path}:")
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
            conn.close()
        except Exception as e:
            print(f"Error checking {db_path}: {e}")
    else:
        print(f"Database not found at: {db_path}")
