import models, database, auth_utils
from sqlalchemy.orm import Session

def seed_admin():
    db = database.SessionLocal()
    try:
        # Check if user already exists
        email = "eden@gmail.com"
        name = "Eden Admin"
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        
        if existing_user:
            print(f"User {email} already exists. Updating to admin...")
            existing_user.is_admin = True
            db.commit()
            print("Update successful.")
            return

        hashed_password = auth_utils.get_password_hash("admin1234")
        new_user = models.User(
            name=name,
            email=email,
            password=hashed_password,
            is_admin=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Admin user created successfully: {email}")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
