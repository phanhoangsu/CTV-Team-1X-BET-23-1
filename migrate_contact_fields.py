import sqlite3
import os

# Possible database locations
db_paths = [
    os.path.join('backend', 'instance', 'flostfound.db'),
    os.path.join('instance', 'flostfound.db'),
    'flostfound.db',
    os.path.join('backend', 'flostfound.db')
]

# Find the existing database
target_db = None
for path in db_paths:
    if os.path.exists(path):
        target_db = path
        print(f"Found database at: {target_db}")
        # Apply migration to this database
        conn = sqlite3.connect(target_db)
        cursor = conn.cursor()
        
        try:
            # Check existing columns
            cursor.execute("PRAGMA table_info(item)")
            columns = [col[1] for col in cursor.fetchall()]
            
            # List of columns to add if they don't exist
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
                    print(f"Adding {col_name} column to {target_db}...")
                    cursor.execute(f"ALTER TABLE item ADD COLUMN {col_name} {col_type}")
                else:
                    print(f"{col_name} column already exists in {target_db}.")

            conn.commit()
            print(f"Migration successful for {target_db}!")
        except Exception as e:
            print(f"Error during migration of {target_db}: {e}")
        finally:
            conn.close()

if not target_db:
    print("No database found to migrate.")

