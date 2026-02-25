import models
from database import SessionLocal

def check_users():
    db = SessionLocal()
    users = db.query(models.User).all()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Admin: {u.is_admin}")
    db.close()

if __name__ == "__main__":
    check_users()
