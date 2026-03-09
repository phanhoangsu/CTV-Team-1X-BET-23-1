import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'flostfound_dev.db')

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(user)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
except Exception as e:
    print(e)
finally:
    if 'conn' in locals():
        conn.close()
