from app.extensions import db
from datetime import datetime

class Claim(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)
    claimer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='Pending') # Pending, Accepted, Rejected
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    item = db.relationship('Item', backref=db.backref('claims', lazy=True))
    claimer = db.relationship('User', backref=db.backref('my_claims', lazy=True))

    def __repr__(self):
        return f'<Claim {self.id} - Item {self.item_id} - User {self.claimer_id} - {self.status}>'
