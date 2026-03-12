"""
SSE (Server-Sent Events) routes for realtime messaging.
Replaces Flask-SocketIO with standard HTTP streaming for Cloudflare Workers compatibility.

Architecture:
  - GET  /api/stream         → SSE stream (server → client, one per user)
  - POST /api/messages/send  → Send a message (client → server via fetch)
"""
import queue
import json
import threading
from flask import Blueprint, Response, request, stream_with_context, jsonify
from flask_login import login_required, current_user
from app.extensions import db
from app.models.message import Message
from app.models.user import User

bp = Blueprint('sse', __name__)

# ──────────────────────────────────────────────
# In-memory per-user queues for SSE connections
# Each user_id maps to a list of Queue objects
# (one per open browser tab / SSE connection)
# ──────────────────────────────────────────────
_lock = threading.Lock()
_user_queues = {}  # {user_id: [queue.Queue, ...]}


def _push_event(user_id, event_type, data):
    """Push an SSE event to every open connection for a given user."""
    with _lock:
        queues = _user_queues.get(user_id, [])
        dead = []
        for q in queues:
            try:
                q.put_nowait(f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n")
            except queue.Full:
                dead.append(q)
        # Clean up any full/dead queues
        for q in dead:
            queues.remove(q)


# ──────────────────────────────────────────────
# SSE Stream endpoint
# ──────────────────────────────────────────────
@bp.route('/api/stream')
@login_required
def stream():
    """
    SSE endpoint. The client opens an EventSource to this URL.
    Server keeps the connection open and pushes events as they happen.
    """
    uid = current_user.id
    q = queue.Queue(maxsize=50)

    with _lock:
        _user_queues.setdefault(uid, []).append(q)

    def generate():
        try:
            # Send an initial connected event
            yield f"event: connected\ndata: {json.dumps({'user_id': uid})}\n\n"
            while True:
                try:
                    # Block for up to 25 seconds waiting for a message
                    msg = q.get(timeout=25)
                    yield msg
                except queue.Empty:
                    # Send keepalive comment to prevent connection timeout
                    yield ": keepalive\n\n"
        except GeneratorExit:
            pass
        finally:
            # Clean up when client disconnects
            with _lock:
                if uid in _user_queues and q in _user_queues[uid]:
                    _user_queues[uid].remove(q)
                    if not _user_queues[uid]:
                        del _user_queues[uid]

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        }
    )


# ──────────────────────────────────────────────
# Send Message via HTTP POST (replaces socket.emit)
# ──────────────────────────────────────────────
@bp.route('/api/messages/send', methods=['POST'])
@login_required
def send_message():
    """
    Client sends a chat message via HTTP POST.
    The server saves it to DB and pushes SSE events to both sender & recipient.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Invalid JSON'}), 400

    recipient_id = data.get('recipient_id')
    body = data.get('message', '').strip()

    if not recipient_id or not body:
        return jsonify({'error': 'recipient_id and message are required'}), 400

    recipient_id = int(recipient_id)

    # Verify recipient exists
    recipient = User.query.get(recipient_id)
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404

    # Save to database
    msg = Message(
        sender_id=current_user.id,
        recipient_id=recipient_id,
        body=body
    )
    db.session.add(msg)
    db.session.commit()

    # Build the message payload
    message_payload = {
        'sender_id': current_user.id,
        'sender_name': current_user.username,
        'recipient_id': recipient_id,
        'message': body,
        'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M')
    }

    # Push "receive_message" to both sender and recipient
    _push_event(current_user.id, 'receive_message', message_payload)
    _push_event(recipient_id, 'receive_message', message_payload)

    # Push "notification" only to recipient
    _push_event(recipient_id, 'notification', {
        'sender_id': current_user.id,
        'sender_name': current_user.username,
        'message': body
    })

    return jsonify({'status': 'ok', 'message_id': msg.id})
