from app import create_app
from app.extensions import db
from app.models.claim import Claim

app = create_app()

with app.app_context():
    print("Creating tables...")
    db.create_all()
    print("Tables created.")
