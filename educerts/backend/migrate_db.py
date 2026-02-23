import models
import database
from sqlalchemy import text, inspect

def run_migrations():
    print("Checking database for missing columns...")
    engine = database.engine
    inspector = inspect(engine)
    
    # 1. Create all tables (will create digital_signature_records if missing)
    models.Base.metadata.create_all(bind=engine)
    print("Table creation check complete.")
    
    # 2. Add missing columns to 'certificates' table
    columns = [c['name'] for c in inspector.get_columns('certificates')]
    
    new_cols = [
        ("template_type", "VARCHAR(10) DEFAULT 'html'"),
        ("rendered_pdf_path", "VARCHAR(500)"),
        ("signing_status", "VARCHAR(20) DEFAULT 'unsigned'"),
        ("digital_signatures", "JSONB"),
        ("batch_id", "VARCHAR(36) REFERENCES document_registry(id)"),
    ]
    
    with engine.connect() as conn:
        for col_name, col_type in new_cols:
            if col_name not in columns:
                print(f"Adding column {col_name} to certificates table...")
                try:
                    conn.execute(text(f"ALTER TABLE certificates ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                except Exception as e:
                    print(f"Error adding {col_name}: {e}")
            else:
                print(f"Column {col_name} already exists.")

    print("Migration finished!")

if __name__ == "__main__":
    run_migrations()
