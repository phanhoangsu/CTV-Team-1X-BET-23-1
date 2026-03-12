"""
Migration script to add missing columns to the item table.
Adds: phone_number, facebook_url
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'flostfound_dev.db')

def get_existing_columns(cursor, table_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    return [row[1] for row in cursor.fetchall()]

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    existing = get_existing_columns(cursor, 'item')
    print(f"Current columns in 'item': {existing}")
    
    columns_to_add = {
        'phone_number': 'VARCHAR(20)',
        'facebook_url': 'VARCHAR(500)',
    }
    
    added = []
    for col_name, col_type in columns_to_add.items():
        if col_name not in existing:
            print(f"  Adding column: {col_name} ({col_type})")
            cursor.execute(f"ALTER TABLE item ADD COLUMN {col_name} {col_type}")
            added.append(col_name)
        else:
            print(f"  Column already exists: {col_name}")
    
    conn.commit()
    conn.close()
    
    if added:
        print(f"\n✅ Successfully added columns: {', '.join(added)}")
    else:
        print("\n✅ No migration needed, all columns already exist.")

if __name__ == '__main__':
    migrate()
