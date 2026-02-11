"""
Core application hooks (before_request, user_loader, etc.)
"""
from datetime import datetime
from flask_login import current_user
from app.extensions import db, login_manager
from app.models.user import User

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login"""
    return User.query.get(int(user_id))

def register_hooks(app):
    """Register application hooks"""
    
    @app.before_request
    def before_request():
        """Update user's last_seen timestamp before each request"""
        if current_user.is_authenticated:
            current_user.last_seen = datetime.utcnow()
            db.session.commit()

    @app.context_processor
    def inject_unread_count():
        """Inject unread message count into all templates"""
        if current_user.is_authenticated:
            # Import here to avoid circular imports if necessary, or check if top-level works
            from app.models.message import Message 
            count = Message.query.filter_by(recipient_id=current_user.id, is_read=False).count()
            return dict(unread_count=count)
        return dict(unread_count=0)


