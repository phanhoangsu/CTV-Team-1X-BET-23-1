-- ============================================================
-- F-LostFound Database Schema for Cloudflare D1
-- ============================================================

CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT DEFAULT '',
    phone_number TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    about_me TEXT DEFAULT '',
    is_admin INTEGER DEFAULT 0,
    last_seen TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    specific_location TEXT DEFAULT '',
    category TEXT DEFAULT '',
    item_type TEXT NOT NULL CHECK(item_type IN ('Lost', 'Found')),
    contact_info TEXT DEFAULT '',
    phone_number TEXT DEFAULT '',
    facebook_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    date_posted TEXT DEFAULT (datetime('now')),
    incident_date TEXT,
    status TEXT DEFAULT 'Open' CHECK(status IN ('Open', 'Closed')),
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS item_image (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES user(id),
    FOREIGN KEY (recipient_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT DEFAULT '',
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Default categories
INSERT OR IGNORE INTO category (name) VALUES ('Điện thoại');
INSERT OR IGNORE INTO category (name) VALUES ('Ví/Thẻ');
INSERT OR IGNORE INTO category (name) VALUES ('Chìa khóa');
INSERT OR IGNORE INTO category (name) VALUES ('Khác');
