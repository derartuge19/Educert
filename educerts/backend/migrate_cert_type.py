from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE certificates ADD COLUMN IF NOT EXISTS cert_type VARCHAR(50) DEFAULT 'certificate'"))
        conn.commit()
        print("SUCCESS: cert_type column added to certificates table")
    except Exception as e:
        print(f"Note: {e}")
