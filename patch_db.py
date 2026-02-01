import sqlite3
import os

db_path = os.path.join(os.getcwd(), 'instance', 'flostfound.db')
print(f"Patching database at: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def add_col(table, col, type_def):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {type_def}")
        print(f"Added {col} to {table}")
    except Exception as e:
        print(f"Skipped {col} (probably exists): {e}")

# Add columns requested by new features
add_col('item', 'images', 'TEXT')
add_col('item', 'category_id', 'INTEGER')
add_col('item', 'event_date', 'DATETIME')
add_col('item', 'location_detail', 'TEXT')
add_col('user', 'is_admin', 'BOOLEAN DEFAULT 0')

conn.commit()
conn.close()
print("Database patched.")
