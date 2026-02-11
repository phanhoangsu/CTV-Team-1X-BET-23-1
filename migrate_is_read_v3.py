import sqlite3
import os

DB_PATH = os.path.join(os.getcwd(), 'backend', 'instance', 'flostfound.db')

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # Add is_read column to message table
        cursor.execute("ALTER TABLE message ADD COLUMN is_read BOOLEAN DEFAULT 0")
        print("Successfully added 'is_read' column to 'message' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e).lower():
            print("Column 'is_read' already exists in 'message' table.")
        else:
            print(f"Error adding column: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
