import sqlite3
import os

db_path = os.path.join('backend', 'instance', 'flostfound_dev.db')
if not os.path.exists(db_path):
    print(f"Database NOT found at {db_path}")
    # Fallback to flostfound.db just in case
    db_path = os.path.join('backend', 'instance', 'flostfound.db')
    if not os.path.exists(db_path):
        print("No database found.")
        exit(1)

print(f"Migrating {db_path}...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get existing columns
cursor.execute("PRAGMA table_info(item)")
columns = [col[1] for col in cursor.fetchall()]
print(f"Current columns: {columns}")

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
        print(f"Adding {col_name}...")
        try:
            cursor.execute(f"ALTER TABLE item ADD COLUMN {col_name} {col_type}")
        except Exception as e:
            print(f"Error adding {col_name}: {e}")
    else:
        print(f"{col_name} already exists.")

conn.commit()
conn.close()
print("Migration DONE!")
