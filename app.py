from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from flask_socketio import SocketIO, emit, join_room, leave_room
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Item, Message, ActionLog
from ai_service import ai_detector
import os
from datetime import datetime
import cloudinary
import cloudinary.uploader
import json
from pydantic import BaseModel, Field, field_validator, ValidationError
from enum import Enum
from typing import Optional, List

cloudinary.config( 
  cloud_name = "dbpqjnu0o", 
  api_key = "993875778549414", 
  api_secret = "3x481JaXw14kqHXncdocSg_A5O8" 
)

# Pydantic Validation Schemas
class PostType(str, Enum):
    LOST = "LOST"
    FOUND = "FOUND"

class LocationSchema(BaseModel):
    building: str
    detail: str = Field(..., min_length=1)
    
    @field_validator('detail')
    @classmethod
    def detail_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Vui lòng cho biết bạn mất/nhặt được ở đâu.')
        return v.strip()

class PostCreateSchema(BaseModel):
    type: PostType
    title: str = Field(..., min_length=10, max_length=100)
    description: str = Field(..., min_length=10, max_length=1000)
    category_id: int = Field(..., gt=0)
    location: LocationSchema
    event_date: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    contact_phone: Optional[str] = None

    @field_validator('title')
    @classmethod
    def title_must_not_be_all_numbers(cls, v):
        if v.strip().isdigit():
            raise ValueError('Tiêu đề không được chỉ chứa số')
        return v.strip()

    @field_validator('description')
    @classmethod
    def description_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Hãy mô tả chi tiết để mọi người dễ nhận diện đồ vật.')
        return v.strip()


    @field_validator('event_date')
    @classmethod
    def event_date_not_future(cls, v):
        if v:
            try:
                # Parse datetime-local format (YYYY-MM-DDTHH:mm)
                # This is in local time, so we need to compare with local time
                if 'T' in v:
                    # If it has time component
                    event_date = datetime.fromisoformat(v)
                else:
                    # If only date, set to end of day
                    event_date = datetime.fromisoformat(v + 'T23:59:59')
                
                # Compare with current local time (not UTC)
                now = datetime.now()
                
                # Add a small buffer (1 minute) to account for timezone differences
                from datetime import timedelta
                buffer = timedelta(minutes=1)
                
                if event_date > (now + buffer):
                    raise ValueError('Ngày không thể là ngày mai được!')
            except ValueError as e:
                # Re-raise validation errors
                raise
            except Exception:
                # Let it pass if parsing fails, will be handled in route
                pass
        return v

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev_key_secret' # Change in production
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'instance', 'flostfound.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
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

from functools import wraps

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or not current_user.is_admin:
            flash('Bạn không có quyền truy cập trang này.', 'danger')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return decorated_function

@app.before_request
def before_request():
    if current_user.is_authenticated:
        current_user.last_seen = datetime.utcnow()
        db.session.commit()

@app.route('/')
def index():
    query = request.args.get('q', '').strip()
    if query:
        items = Item.query.filter(
            (Item.title.contains(query)) | 
            (Item.description.contains(query)) |
            (Item.location.contains(query))
        ).order_by(Item.date_posted.desc()).all()
    else:
        items = Item.query.order_by(Item.date_posted.desc()).all()
    
    # Parse images JSON for each item
    for item in items:
        if item.images:
            try:
                item.images_list = json.loads(item.images)
            except:
                item.images_list = []
        else:
            item.images_list = []
            # Fallback to image_url if images is empty
            if item.image_url:
                item.images_list = [item.image_url]
    
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
        
        # Log action
        log = ActionLog(user_id=current_user.id, action="Đăng bài", details=f"Tiêu đề: {title}")
        db.session.add(log)
        db.session.commit()
        
        # Update AI model with new data
        refresh_ai_model()
        
        flash('Đăng tin thành công!', 'success')
        return redirect(url_for('index'))
        
    return render_template('post_item.html')

@app.route('/api/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    # Debug logging
    print('=== BACKEND FILE UPLOAD DEBUG ===')
    print(f'File name: {file.filename}')
    print(f'File content_type: {file.content_type}')
    print(f'File content_length: {request.content_length}')
    
    # Validate file type
    allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'}  # JFIF is JPEG format
    allowed_mime_types = {
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'image/x-png', 'image/x-icon'  # Some systems use these variants
    }
    
    # Get file extension - handle spaces and normalize
    filename_lower = file.filename.lower().strip()
    print(f'File name (lowercase, trimmed): {filename_lower}')
    
    if '.' in filename_lower:
        file_ext = filename_lower.rsplit('.', 1)[1].strip()  # Remove spaces from extension
    else:
        file_ext = ''
    
    print(f'File extension (extracted): {file_ext}')
    print(f'Is extension in allowed list? {file_ext in allowed_extensions}')
    print(f'Is MIME type in allowed list? {file.content_type in allowed_mime_types if file.content_type else "No MIME type"}')
    print(f'Does MIME type start with image/? {file.content_type.startswith("image/") if file.content_type else "No MIME type"}')
    
    # Priority: Check MIME type first (more reliable), then extension
    is_valid_mime = file.content_type and (file.content_type in allowed_mime_types or file.content_type.startswith('image/'))
    is_valid_ext = file_ext and file_ext in allowed_extensions
    
    # Allow if either MIME type or extension is valid
    if not is_valid_mime and not is_valid_ext:
        print(f'VALIDATION FAILED: Both MIME type and extension check failed')
        print(f'Extension: {file_ext} | Allowed extensions: {allowed_extensions}')
        print(f'MIME type: {file.content_type} | Allowed MIME types: {allowed_mime_types}')
        return jsonify({
            'error': 'Chỉ chấp nhận file ảnh: JPG, PNG, GIF, WEBP',
            'debug': {
                'filename': file.filename,
                'extension': file_ext,
                'mime_type': file.content_type
            }
        }), 400
    
    if is_valid_mime:
        print('✅ Validation passed via MIME type')
    elif is_valid_ext:
        print('✅ Validation passed via extension')
    
    # Validate file size (max 5MB)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    max_size = 5 * 1024 * 1024  # 5MB
    if file_size > max_size:
        return jsonify({'error': 'File quá lớn, tối đa 5MB thôi bạn nhé!'}), 400
    
    # Validate MIME type (more lenient - only warn if extension is valid but MIME type is suspicious)
    if file.content_type:
        # Check if MIME type starts with 'image/' (more flexible)
        if not file.content_type.startswith('image/'):
            # If extension is valid but MIME type doesn't start with 'image/', still allow it
            # because some systems may have incorrect MIME types
            if file_ext in allowed_extensions:
                pass  # Allow it based on extension
            else:
                return jsonify({'error': 'File không phải là ảnh hợp lệ'}), 400
    
    try:
        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(
            file, 
            folder = "FPT_Lost_Found", 
            use_filename = True,       
            unique_filename = True
        )
        return jsonify({'url': upload_result['secure_url']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/posts', methods=['POST'])
@login_required
def create_post_api():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Không có dữ liệu được gửi lên'}), 400
        
        # Validate with Pydantic
        try:
            validated_data = PostCreateSchema(**data)
        except ValidationError as e:
            # Format validation errors for frontend
            errors = {}
            for error in e.errors():
                field = '.'.join(str(x) for x in error['loc'])
                message = error['msg']
                errors[field] = message
            
            return jsonify({
                'error': 'Validation failed',
                'errors': errors
            }), 400

        # Extract validated data
        title = validated_data.title
        description = validated_data.description
        location_building = validated_data.location.building
        location_detail = validated_data.location.detail
        category_id = validated_data.category_id
        event_date_str = validated_data.event_date
        images = validated_data.images
        contact_phone = validated_data.contact_phone
        item_type = validated_data.type
        
        # Map item_type to DB format
        db_item_type = 'Lost' if item_type == PostType.LOST else 'Found'

        # Parse date
        event_date = None
        if event_date_str:
            try:
                # Parse datetime-local format (YYYY-MM-DDTHH:mm) - this is in local time
                if 'T' in event_date_str:
                    event_date = datetime.fromisoformat(event_date_str)
                else:
                    # If only date, set to end of day
                    event_date = datetime.fromisoformat(event_date_str + 'T23:59:59')
                
                # Double check date is not in future (compare with local time, not UTC)
                now = datetime.now()
                from datetime import timedelta
                buffer = timedelta(minutes=1)  # 1 minute buffer
                
                if event_date > (now + buffer):
                    return jsonify({
                        'error': 'Validation failed',
                        'errors': {'event_date': 'Ngày không thể là ngày mai được!'}
                    }), 400
            except Exception as e:
                print(f'Error parsing date: {e}')
                event_date = datetime.now()  # Use local time, not UTC

        # Concatenate location for backward compatibility
        full_location = f"{location_building}, {location_detail}"

        # AI Spam Check
        post_text = f"{title} {description}"
        is_spam, score = ai_detector.is_spam(post_text)
        if is_spam:
            return jsonify({
                'error': 'Spam detection',
                'message': f'Bài viết bị từ chối: Nội dung quá giống với bài viết đã có (Độ trùng lặp: {score:.2f}). Vui lòng kiểm tra xem bạn đã đăng chưa.',
                'is_spam': True
            }), 400

        new_item = Item(
            title=title,
            description=description,
            location=full_location,
            location_detail=location_detail,
            item_type=db_item_type,
            contact_info=contact_phone or current_user.email,
            user_id=current_user.id,
            images=json.dumps(images),
            image_url=images[0] if images else None,
            category_id=category_id,
            event_date=event_date
        )
        
        db.session.add(new_item)
        db.session.commit()
        
        # Log action
        log = ActionLog(user_id=current_user.id, action="Đăng bài API", details=f"Tiêu đề: {title}")
        db.session.add(log)
        db.session.commit()
        
        refresh_ai_model()
        return jsonify({'message': 'Post created successfully', 'id': new_item.id})

    except ValidationError as e:
        errors = {}
        for error in e.errors():
            field = '.'.join(str(x) for x in error['loc'])
            message = error['msg']
            errors[field] = message
        return jsonify({
            'error': 'Validation failed',
            'errors': errors
        }), 400
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/chat/<int:recipient_id>')
@login_required
def chat(recipient_id):
    recipient = User.query.get_or_404(recipient_id)
    # Get history
    messages = Message.query.filter(
        ((Message.sender_id == current_user.id) & (Message.recipient_id == recipient_id)) |
        ((Message.sender_id == recipient_id) & (Message.recipient_id == current_user.id))
    ).order_by(Message.timestamp.asc()).all()
    
    return render_template('chat.html', recipient=recipient, messages=messages, datetime=datetime)

@app.route('/messages')
@login_required
def messages_inbox():
    # Find all users involved in conversations with current_user
    # distinct sender_id where recipient = current
    # distinct recipient_id where sender = current
    
    # Simple approach: Get all messages involving current_user, order by time desc
    all_msgs = Message.query.filter(
        (Message.sender_id == current_user.id) | (Message.recipient_id == current_user.id)
    ).order_by(Message.timestamp.desc()).all()
    
    conversations = {}
    for msg in all_msgs:
        other_id = msg.recipient_id if msg.sender_id == current_user.id else msg.sender_id
        if other_id not in conversations:
            other_user = User.query.get(other_id)
            if other_user:
                conversations[other_id] = {
                    'user': other_user,
                    'last_message': msg
                }
    
    # Convert to list
    inbox_items = list(conversations.values())
    return render_template('inbox.html', conversations=inbox_items)

@socketio.on('join_notifications')
def on_join_notifications():
    if current_user.is_authenticated:
        room = f"user_{current_user.id}"
        join_room(room)

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
    
    # Emit notification to recipient's private room
    notification_room = f"user_{recipient_id}"
    emit('notification', {
        'sender_id': current_user.id,
        'sender_name': current_user.username,
        'message': body
    }, room=notification_room)

@socketio.on('join_chat')
def on_join(data):
    recipient_id = data.get('recipient_id')
    room = f"chat_{min(current_user.id, int(recipient_id))}_{max(current_user.id, int(recipient_id))}"
    join_room(room)

# Admin Routes
@app.route('/admin')
@login_required
@admin_required
def admin_dashboard():
    # User Management Search
    search_query = request.args.get('q', '')
    if search_query:
        users = User.query.filter(
            (User.username.contains(search_query)) | 
            (User.email.contains(search_query))
        ).all()
    else:
        users = User.query.order_by(User.last_seen.desc()).all()

    # Statistics
    total_users = User.query.count()
    total_items = Item.query.count()
    total_lost = Item.query.filter_by(item_type='Lost').count()
    total_found = Item.query.filter_by(item_type='Found').count()
    
    # Calculate stats for charts
    lost_items = Item.query.filter_by(item_type='Lost').all()
    found_items = Item.query.filter_by(item_type='Found').all()
    
    # Helper to count items by date
    from collections import defaultdict
    dates = defaultdict(lambda: {'lost': 0, 'found': 0})
    
    for item in lost_items:
        date_str = item.date_posted.strftime('%Y-%m-%d')
        dates[date_str]['lost'] += 1
        
    for item in found_items:
        date_str = item.date_posted.strftime('%Y-%m-%d')
        dates[date_str]['found'] += 1
        
    # Sort dates
    sorted_dates = sorted(dates.keys())
    chart_labels = sorted_dates[-7:] # Last 7 days
    chart_lost_data = [dates[d]['lost'] for d in chart_labels]
    chart_found_data = [dates[d]['found'] for d in chart_labels]
    
    return render_template('admin_dashboard.html', 
                           total_users=total_users, 
                           total_items=total_items,
                           total_lost=total_lost,
                           total_found=total_found,
                           chart_labels=chart_labels,
                           chart_lost_data=chart_lost_data,
                           chart_found_data=chart_found_data,
                           users=users,
                           search_query=search_query,
                           now=datetime.utcnow())

@app.route('/admin/posts')
@login_required
@admin_required
def admin_posts():
    items = Item.query.order_by(Item.date_posted.desc()).all()
    return render_template('admin_posts.html', items=items)

# ... existing admin routes ...

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    if request.method == 'POST':
        # Update Profile Info
        phone = request.form.get('phone')
        email = request.form.get('email')
        
        # Basic validation could go here
        current_user.phone = phone
        current_user.email = email
        db.session.commit()
        flash('Cập nhật thông tin thành công!', 'success')
        return redirect(url_for('profile'))
        
    # Get user's items
    my_items = Item.query.filter_by(user_id=current_user.id).order_by(Item.date_posted.desc()).all()
    lost_items = [i for i in my_items if i.item_type == 'Lost']
    found_items = [i for i in my_items if i.item_type == 'Found']
    
    return render_template('profile.html', user=current_user, lost_items=lost_items, found_items=found_items)

# Unified delete route for Admin and Post Owner
@app.route('/post/delete/<int:item_id>', methods=['POST'])
@login_required
def delete_post(item_id):
    item = Item.query.get_or_404(item_id)
    
    # Check permission: Admin or Owner
    if not current_user.is_admin and current_user.id != item.user_id:
        flash('Bạn không có quyền xóa bài này.', 'danger')
        return redirect(url_for('index'))
        
    # Log the deletion
    action_type = "Admin Xóa bài" if current_user.is_admin and current_user.id != item.user_id else "Người dùng xóa bài"
    log = ActionLog(user_id=current_user.id, action=action_type, details=f"Đã xóa bài: {item.title}")
    db.session.add(log)
    
    db.session.delete(item)
    db.session.commit()
    flash('Đã xóa bài đăng.', 'success')
    
    # Redirect back to where they came from if possible, or default
    if request.referrer and 'admin' in request.referrer:
        return redirect(url_for('admin_posts'))
    elif request.referrer and 'profile' in request.referrer:
        return redirect(url_for('profile'))
    else:
        return redirect(url_for('index'))

def patch_database():
    """Add missing columns to existing database"""
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    def add_col(table, col, type_def):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {type_def}")
            print(f"Added {col} to {table}")
        except Exception as e:
            if "duplicate column name" not in str(e).lower():
                print(f"Skipped {col} (probably exists): {e}")
    
    # Add columns requested by new features
    add_col('item', 'images', 'TEXT')
    add_col('item', 'category_id', 'INTEGER')
    add_col('item', 'event_date', 'DATETIME')
    add_col('item', 'location_detail', 'TEXT')
    add_col('user', 'is_admin', 'BOOLEAN DEFAULT 0')
    
    conn.commit()
    conn.close()
    print("Database patched.")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        patch_database()
        refresh_ai_model()
    socketio.run(app, debug=True, use_reloader=True, log_output=True)
