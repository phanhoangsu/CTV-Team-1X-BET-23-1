"""
Admin posts management routes
"""
from flask import Blueprint, render_template
from flask_login import login_required
from app.core.decorators import admin_required
from app.models.item import Item

bp = Blueprint('admin_posts', __name__)

@bp.route('/admin/posts')
@login_required
@admin_required
def admin_posts():
    items = Item.query.order_by(Item.date_posted.desc()).all()
    return render_template('admin/posts.html', items=items)
