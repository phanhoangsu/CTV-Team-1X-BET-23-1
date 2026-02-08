"""
Create post routes
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.extensions import db
from app.models.item import Item
from app.models.action_log import ActionLog
from app.services.ai_service import ai_detector
from app.services.ai_trainer import refresh_ai_model

bp = Blueprint('posts_create', __name__)

@bp.route('/post', methods=['GET', 'POST'])
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
            return render_template('posts/post_item.html', title=title, description=desc, location=location, contact_info=contact)

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
        return redirect(url_for('posts_view.index'))
        
    return render_template('posts/post_item.html')
