from database import SessionLocal
from models import User

def promote_user(email: str):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.is_admin = True
        db.commit()
        print(f"User {email} promoted to admin successfully.")
    else:
        print(f"User {email} not found.")
    db.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        email = sys.argv[1]
    else:
        email = input("Enter email to promote to admin: ")
    promote_user(email)
