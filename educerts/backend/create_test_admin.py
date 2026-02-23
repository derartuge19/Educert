from database import SessionLocal
import models
import auth_utils

def create_admin_user(name: str, email: str, password: str):
    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating to admin...")
            user.is_admin = True
            db.commit()
            print("Successfully promoted existing user to admin.")
            return

        # Create new user
        hashed_password = auth_utils.get_password_hash(password)
        new_user = models.User(
            name=name,
            email=email,
            password=hashed_password,
            is_admin=True
        )
        db.add(new_user)
        db.commit()
        print(f"User {email} created and promoted to admin successfully.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user("Eden", "edenzewdutadesse11@gmail.com", "ed1234")
