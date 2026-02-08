import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'instance', 'flostfound.db')

def add_column_if_not_exists(cursor, table, column, definition):
    try:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
        print(f"Added column {column} to {table}")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower() or "no such table" in str(e).lower():
            print(f"Column {column} already exists in {table} or table missing (Error: {e})")
        else:
            print(f"Error adding {column} to {table}: {e}")

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. It will be created on first run.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Add is_admin to user
    add_column_if_not_exists(cursor, 'user', 'is_admin', 'BOOLEAN DEFAULT 0')

    # Create ActionLog table if not exists (app.py db.create_all() usually handles this but only for new tables, let's let app.py handle the new table, or force it here if needed. But usually db.create_all() works for new tables)
    # However, to be safe, let's just rely on App.py for the new table since it's completely new.
    # But wait, if we are altering existing schema, we might as well do it.
    
    conn.commit()
    conn.close()
    print("Migration check complete.")

if __name__ == "__main__":
    migrate()
