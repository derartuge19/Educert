import models, database, auth_utils
from sqlalchemy.orm import Session

def seed():
    print("Creating tables...")
    models.Base.metadata.create_all(bind=database.engine)
    
    db = database.SessionLocal()
    try:
        admin_email = "app-reguser@mailinator.com"
        # Check if already exists
        user = db.query(models.User).filter(models.User.email == admin_email).first()
        if not user:
            print(f"Creating admin user: {admin_email}")
            new_user = models.User(
                name="Eden",
                email=admin_email,
                password=auth_utils.get_password_hash("Password1"),
                is_admin=True
            )
            db.add(new_user)
            db.commit()
            print("Admin user created successfully.")
        else:
            print("Admin user already exists.")
    except Exception as e:
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
