"""
View posts routes (index/home page)
"""
from flask import Blueprint, render_template, request
from app.models.item import Item

bp = Blueprint('posts_view', __name__)

from flask_login import current_user
from app.models.claim import Claim

@bp.route('/')
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
        
    # Create a map of item_id -> my_claim for the current user
    my_claims_map = {}
    if current_user.is_authenticated:
        my_claims = Claim.query.filter_by(claimer_id=current_user.id).all()
        for c in my_claims:
            my_claims_map[c.item_id] = c

    return render_template('posts/index.html', items=items, query=query, my_claims_map=my_claims_map)
