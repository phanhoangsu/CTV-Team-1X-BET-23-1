"""
AI model training and refresh utilities
"""
from flask import current_app
from app.models.item import Item
from app.services.ai_service import ai_detector

def refresh_ai_model():
    """Refresh the AI model with all current posts"""
    with current_app.app_context():
        # Get all posts text for AI training
        items = Item.query.all()
        texts = [f"{item.title} {item.description}" for item in items]
        ai_detector.fit_data(texts)
