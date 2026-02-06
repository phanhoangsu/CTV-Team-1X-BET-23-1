"""
Admin dashboard routes
"""
from flask import Blueprint, render_template, request
from flask_login import login_required
from datetime import datetime
from collections import defaultdict
from app.core.decorators import admin_required
from app.models.user import User
from app.models.item import Item

bp = Blueprint('admin_dashboard', __name__)

@bp.route('/admin')
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
    dates = defaultdict(lambda: {'lost': 0, 'found': 0})
    
    for item in lost_items:
        date_str = item.date_posted.strftime('%Y-%m-%d')
        dates[date_str]['lost'] += 1
        
    for item in found_items:
        date_str = item.date_posted.strftime('%Y-%m-%d')
        dates[date_str]['found'] += 1
        
    # Sort dates
    sorted_dates = sorted(dates.keys())
    chart_labels = sorted_dates[-7:]  # Last 7 days
    chart_lost_data = [dates[d]['lost'] for d in chart_labels]
    chart_found_data = [dates[d]['found'] for d in chart_labels]
    
    return render_template('admin/dashboard.html', 
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
