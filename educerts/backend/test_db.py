import database
import models
from sqlalchemy import inspect

def test_db():
    print("Testing DB connection...")
    try:
        # Create engine
        engine = database.engine
        # Inspect tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables found: {tables}")
        
        if 'users' not in tables:
            print("Creating tables...")
            models.Base.metadata.create_all(bind=engine)
            print("Tables created.")
        
        # Check columns for 'users'
        columns = [c['name'] for c in inspector.get_columns('users')]
        print(f"Columns in 'users': {columns}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_db()
