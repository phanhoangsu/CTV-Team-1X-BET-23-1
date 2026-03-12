-- ============================================================
-- F-LostFound D1 Database Schema
-- Converted from SQLAlchemy models
-- ============================================================

-- Users table
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

-- Items (Lost/Found posts)
CREATE TABLE IF NOT EXISTS item (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    specific_location TEXT,
    category TEXT,
    item_type TEXT NOT NULL CHECK (item_type IN ('Lost', 'Found')),
    contact_info TEXT,
    image_url TEXT,
    date_posted TEXT DEFAULT (datetime('now')),
    incident_date TEXT,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    user_id INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Item images (multiple per item)
CREATE TABLE IF NOT EXISTS item_image (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_url TEXT NOT NULL,
    item_id INTEGER NOT NULL,
    FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE
);

-- Messages (chat)
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

-- Categories
CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

-- Action logs
CREATE TABLE IF NOT EXISTS action_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_item_user_id ON item(user_id);
CREATE INDEX IF NOT EXISTS idx_item_date_posted ON item(date_posted);
CREATE INDEX IF NOT EXISTS idx_item_status ON item(status);
CREATE INDEX IF NOT EXISTS idx_item_type ON item(item_type);
CREATE INDEX IF NOT EXISTS idx_message_sender ON message(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_recipient ON message(recipient_id);
CREATE INDEX IF NOT EXISTS idx_message_timestamp ON message(timestamp);
CREATE INDEX IF NOT EXISTS idx_action_log_user ON action_log(user_id);
CREATE INDEX IF NOT EXISTS idx_action_log_timestamp ON action_log(timestamp);
