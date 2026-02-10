#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Run database migrations and setup
python << END
from app import create_app
from app.extensions import db
from app.services.ai_trainer import refresh_ai_model

app = create_app()
with app.app_context():
    db.create_all()
    print("Database tables created successfully")
    refresh_ai_model()
    print("AI model refreshed successfully")
END
