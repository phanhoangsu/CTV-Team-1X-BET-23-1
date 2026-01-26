from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Item, Message
from ai_service import ai_detector
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev_key_secret' # Change in production
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flostfound.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)
socketio = SocketIO(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def refresh_ai_model():
    with app.app_context():
        # Get all posts text for AI training
        items = Item.query.all()
        texts = [f"{item.title} {item.description}" for item in items]
        ai_detector.fit_data(texts)

@app.route('/')
def index():
    query = request.args.get('q', '')
    if query:
        items = Item.query.filter(
            (Item.title.contains(query)) | 
            (Item.description.contains(query)) |
            (Item.location.contains(query))
        ).order_by(Item.date_posted.desc()).all()
    else:
        items = Item.query.order_by(Item.date_posted.desc()).all()
    return render_template('index.html', items=items, query=query)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form.get('username')
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user:
            flash('Tên đăng nhập đã tồn tại.', 'danger')
            return redirect(url_for('register'))
            
        new_user = User(username=username, email=email, password=generate_password_hash(password, method='scrypt'))
        db.session.add(new_user)
        db.session.commit()
        
        flash('Tạo tài khoản thành công! Vui lòng đăng nhập.', 'success')
        return redirect(url_for('login'))
        
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            login_user(user)
            return redirect(url_for('index'))
        else:
            flash('Đăng nhập thất bại. Kiểm tra lại thông tin.', 'danger')
            
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/post', methods=['GET', 'POST'])
@login_required
def post_item():
    if request.method == 'POST':
        title = request.form.get('title')
        desc = request.form.get('description')
        location = request.form.get('location')
        itype = request.form.get('item_type')
        contact = request.form.get('contact_info')
        
        # AI Spam Check
        post_text = f"{title} {desc}"
        is_spam, score = ai_detector.is_spam(post_text)
        
        if is_spam:
            flash(f'Bài viết bị từ chối: Nội dung quá giống với bài viết đã có (Độ trùng lặp: {score:.2f}). Vui lòng kiểm tra xem bạn đã đăng chưa.', 'warning')
            return render_template('post_item.html', title=title, description=desc, location=location, contact_info=contact)

        new_item = Item(
            title=title, description=desc, location=location, 
            item_type=itype, contact_info=contact, user_id=current_user.id
        )
        db.session.add(new_item)
        db.session.commit()
        
        # Update AI model with new data
        refresh_ai_model()
        
        flash('Đăng tin thành công!', 'success')
        return redirect(url_for('index'))
        
    return render_template('post_item.html')

@app.route('/chat/<int:recipient_id>')
@login_required
def chat(recipient_id):
    recipient = User.query.get_or_404(recipient_id)
    # Get history
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.recipient_id == recipient_id)) |
        ((Message.sender_id == recipient_id) & (Message.recipient_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()
    
    return render_template('chat.html', recipient=recipient, messages=messages)

@socketio.on('send_message')
def handle_message(data):
    # data = {recipient_id, message}
    recipient_id = data.get('recipient_id')
    body = data.get('message')
    
    if not current_user.is_authenticated:
        return
        
    msg = Message(sender_id=current_user.id, recipient_id=recipient_id, body=body)
    db.session.add(msg)
    db.session.commit()
    
    room = f"chat_{min(current_user.id, int(recipient_id))}_{max(current_user.id, int(recipient_id))}"
    emit('receive_message', {
        'sender_id': current_user.id,
        'message': body,
        'timestamp': msg.timestamp.strftime('%Y-%m-%d %H:%M')
    }, room=room)

@socketio.on('join_chat')
def on_join(data):
    recipient_id = data.get('recipient_id')
    room = f"chat_{min(current_user.id, int(recipient_id))}_{max(current_user.id, int(recipient_id))}"
    join_room(room)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        refresh_ai_model()
    socketio.run(app, debug=True, use_reloader=False, log_output=True)
