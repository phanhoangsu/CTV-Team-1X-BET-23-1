"""
Logout routes
"""
from flask import Blueprint, redirect, url_for
from flask_login import login_required, logout_user

bp = Blueprint('auth_logout', __name__)

@bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('posts_view.index'))
