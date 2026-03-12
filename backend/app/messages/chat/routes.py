"""
Chat routes
"""
from flask import Blueprint, render_template, Response, request, jsonify, stream_with_context
from flask_login import login_required, current_user
from datetime import datetime
import queue
from app.models.user import User
from app.models.message import Message
from app.core.sse import announcer

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
    
    # Mark unread messages from this sender as read
    unread_msgs = Message.query.filter_by(sender_id=recipient_id, recipient_id=current_user.id, is_read=False).all()
    if unread_msgs:
        for msg in unread_msgs:
            msg.is_read = True
        try:
            from app.extensions import db
            db.session.commit()
        except:
             db.session.rollback()
    
    return render_template('messages/chat.html', recipient=recipient, messages=messages, datetime=datetime)

@bp.route('/stream')
@login_required
def stream():
    # CRITICAL: Capture user_id BEFORE entering the generator
    # because current_user proxy loses request context inside generators
    user_id = current_user.id

    def stream_events():
        q = announcer.listen(user_id)
        try:
            while True:
                try:
                    msg = q.get(timeout=10)
                    yield msg
                except queue.Empty:
                    yield "event: keepalive\ndata: {}\n\n"
        except GeneratorExit:
            if user_id in announcer.listeners:
                if q in announcer.listeners[user_id]:
                    announcer.listeners[user_id].remove(q)

    response = Response(stream_with_context(stream_events()), content_type='text/event-stream')
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['X-Accel-Buffering'] = 'no'
    response.headers['Connection'] = 'keep-alive'
    return response

@bp.route('/api/send_message', methods=['POST'])
@login_required
def api_send_message():
    data = request.json
    recipient_id = data.get('recipient_id')
    body = data.get('message')
    
    if not body or not recipient_id:
        return jsonify({'error': 'Invalid data'}), 400
        
    from app.extensions import db
    msg = Message(sender_id=current_user.id, recipient_id=int(recipient_id), body=body)
    db.session.add(msg)
    db.session.commit()
    
    event_data = {
        'sender_id': current_user.id,
        'message': body,
        'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M')
    }
    # Notify sender to show their own message
    announcer.announce(current_user.id, 'receive_message', event_data)
    
    # Notify recipient to show the message and notification
    announcer.announce(int(recipient_id), 'receive_message', event_data)
    
    notification_data = {
        'sender_id': current_user.id,
        'sender_name': current_user.username,
        'message': body
    }
    announcer.announce(int(recipient_id), 'notification', notification_data)
    
    return jsonify({'status': 'ok'})
