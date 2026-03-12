"""
Application entry point for F-LostFound
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from app import create_app
from app.extensions import db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    # threaded=True is required for SSE (concurrent streaming responses)
    app.run(debug=True, use_reloader=True, threaded=True)

