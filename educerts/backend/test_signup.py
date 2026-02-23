import database
import models
import auth_utils
from sqlalchemy.orm import Session

def test_signup():
    db = database.SessionLocal()
    print("Attempting to create a test user...")
    try:
        # Check if user exists
        exists = db.query(models.User).filter(models.User.email == "test@example.com").first()
        if exists:
            print("Test user already exists. Deleting...")
            db.delete(exists)
            db.commit()
        
        hashed = auth_utils.get_password_hash("testpass")
        new_user = models.User(
            name="testuser",
            email="test@example.com",
            password=hashed,
            is_admin=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"Success! Created user ID: {new_user.id}")
        
    except Exception as e:
        print(f"FAILED to create user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_signup()
