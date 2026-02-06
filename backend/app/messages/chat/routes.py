"""
Chat routes
"""
from flask import Blueprint, render_template
from flask_login import login_required, current_user
from datetime import datetime
from app.models.user import User
from app.models.message import Message

bp = Blueprint('messages_chat', __name__)

@bp.route('/chat/<int:recipient_id>')
@login_required
def chat(recipient_id):
    recipient = User.query.get_or_404(recipient_id)
    # Get history
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.recipient_id == recipient_id)) |
        ((Message.sender_id == recipient_id) & (Message.recipient_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()
    
    return render_template('messages/chat.html', recipient=recipient, messages=messages, datetime=datetime)
