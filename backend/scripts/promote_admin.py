from app import app, db, User

with app.app_context():
    users = User.query.all()
    if not users:
        print("No users found. Please register a user first.")
    else:
        print(f"Found {len(users)} users.")
        for u in users:
            print(f"- {u.username} (ID: {u.id}, IsAdmin: {u.is_admin})")
        
        # Promote the first one or specific one
        # For this script, let's promote the first one found if not already admin
        target_user = users[0]
        if not target_user.is_admin:
            target_user.is_admin = True
            db.session.commit()
            print(f"Successfully promoted user '{target_user.username}' to Admin.")
        else:
            print(f"User '{target_user.username}' is already an Admin.")
