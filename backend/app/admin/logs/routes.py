"""
Admin logs routes
"""
from flask import Blueprint, render_template
from flask_login import login_required
from app.core.decorators import admin_required
from app.models.action_log import ActionLog

bp = Blueprint('admin_logs', __name__)

@bp.route('/admin/logs')
@login_required
@admin_required
def admin_logs():
    logs = ActionLog.query.order_by(ActionLog.timestamp.desc()).all()
    return render_template('admin/logs.html', logs=logs)
