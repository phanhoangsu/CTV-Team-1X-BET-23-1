"""
Item model for lost and found posts
"""
from datetime import datetime
from app.extensions import db

class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(100), nullable=False)  # e.g., "Dom A", "Canteen 1"
    item_type = db.Column(db.String(20), nullable=False)  # "Lost" or "Found"
    contact_info = db.Column(db.String(200), nullable=False)
    image_url = db.Column(db.String(500), nullable=True)
    date_posted = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('items', lazy=True))
