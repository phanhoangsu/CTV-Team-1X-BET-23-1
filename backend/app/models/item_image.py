from app.extensions import db

class ItemImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    image_url = db.Column(db.String(500), nullable=False)
    item_id = db.Column(db.Integer, db.ForeignKey('item.id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url
        }
