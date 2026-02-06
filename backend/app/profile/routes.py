"""
User profile routes
"""
from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from app.extensions import db
from app.models.item import Item

bp = Blueprint('profile', __name__)

@bp.route('/profile', methods=['GET', 'POST'])
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
        return redirect(url_for('profile.profile'))
        
    # Get user's items
    my_items = Item.query.filter_by(user_id=current_user.id).order_by(Item.date_posted.desc()).all()
    lost_items = [i for i in my_items if i.item_type == 'Lost']
    found_items = [i for i in my_items if i.item_type == 'Found']
    
    return render_template('profile/profile.html', user=current_user, lost_items=lost_items, found_items=found_items)
