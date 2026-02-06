"""
View posts routes (index/home page)
"""
from flask import Blueprint, render_template, request
from app.models.item import Item

bp = Blueprint('posts_view', __name__)

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
    return render_template('posts/index.html', items=items, query=query)
