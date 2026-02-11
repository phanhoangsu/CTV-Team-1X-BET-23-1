from flask import Blueprint

bp = Blueprint('posts_update', __name__)

from . import routes
