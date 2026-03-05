from flask import Blueprint, request, redirect, url_for, flash, render_template
from flask_login import login_required, current_user
from app.extensions import db
from app.models.item import Item
from app.models.claim import Claim
from app.models.action_log import ActionLog
from datetime import datetime

bp = Blueprint('claims', __name__)

@bp.route('/claim/<int:item_id>', methods=['POST'])
@login_required
def claim_item(item_id):
    item = Item.query.get_or_404(item_id)
    
    if item.item_type != 'Found':
        flash('Bạn chỉ có thể nhận đồ nhặt được.', 'warning')
        return redirect(url_for('posts_view.index'))
        
    if item.user_id == current_user.id:
        flash('Bạn không thể nhận đồ do chính mình đăng.', 'warning')
        return redirect(url_for('posts_view.index'))
        
    # Check if already claimed
    existing_claim = Claim.query.filter_by(item_id=item_id, claimer_id=current_user.id).first()
    if existing_claim:
        flash('Bạn đã gửi yêu cầu nhận món đồ này rồi.', 'info')
        return redirect(url_for('posts_view.index'))
        
    # Create claim
    claim = Claim(item_id=item_id, claimer_id=current_user.id)
    db.session.add(claim)
    
    # Log action
    log = ActionLog(user_id=current_user.id, action="Yêu cầu nhận đồ", details=f"Đồ: {item.title}")
    db.session.add(log)
    
    db.session.commit()
    
    flash('Đã gửi yêu cầu nhận đồ. Vui lòng chờ người đăng xác nhận.', 'success')
    return redirect(url_for('posts_view.index'))

@bp.route('/claim/accept/<int:claim_id>', methods=['POST'])
@login_required
def accept_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    item = Item.query.get(claim.item_id)
    
    if item.user_id != current_user.id:
        flash('Bạn không có quyền thực hiện thao tác này.', 'danger')
        return redirect(url_for('posts_view.index'))
        
    # Update status
    claim.status = 'Accepted'
    
    # Log action
    log = ActionLog(user_id=current_user.id, action="Chấp nhận yêu cầu", details=f"Đồ: {item.title}, Người nhận: {claim.claimer.username}")
    db.session.add(log)
    
    db.session.commit()
    
    flash(f'Đã chấp nhận yêu cầu của {claim.claimer.username}. Họ sẽ nhìn thấy thông tin liên lạc của bạn.', 'success')
    return redirect(url_for('posts_view.index')) # Or stay on management view if we have one

@bp.route('/claim/reject/<int:claim_id>', methods=['POST'])
@login_required
def reject_claim(claim_id):
    claim = Claim.query.get_or_404(claim_id)
    item = Item.query.get(claim.item_id)
    
    if item.user_id != current_user.id:
        flash('Bạn không có quyền thực hiện thao tác này.', 'danger')
        return redirect(url_for('posts_view.index'))
        
    # Update status
    claim.status = 'Rejected'
    
    # Log action
    log = ActionLog(user_id=current_user.id, action="Từ chối yêu cầu", details=f"Đồ: {item.title}, Người nhận: {claim.claimer.username}")
    db.session.add(log)
    
    db.session.commit()
    
    flash(f'Đã từ chối yêu cầu của {claim.claimer.username}.', 'info')
    return redirect(url_for('posts_view.index'))
