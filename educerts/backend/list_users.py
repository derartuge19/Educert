import database
import models
from sqlalchemy.orm import Session

def list_users():
    db = database.SessionLocal()
    print("Listing all users in 'users' table:")
    try:
        users = db.query(models.User).all()
        for u in users:
            print(f"ID: {u.id} | Name: {u.name} | Email: {u.email} | Admin: {u.is_admin}")
        if not users:
            print("No users found in DB.")
    except Exception as e:
        print(f"Error listing users: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    list_users()
