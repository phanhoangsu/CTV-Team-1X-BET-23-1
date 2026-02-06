"""
Application entry point for F-LostFound
"""
from app import create_app, socketio
from app.extensions import db
from app.services.ai_trainer import refresh_ai_model

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        refresh_ai_model()
    socketio.run(app, debug=True, use_reloader=True, log_output=True)
