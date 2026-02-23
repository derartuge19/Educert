from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    email = Column(String(255), unique=True, index=True)
    password = Column(String(256))
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, index=True)  # UUID
    student_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    student_name = Column(String(200))
    course_name = Column(String(200))
    cert_type = Column(String(50), default="certificate")
    data_payload = Column(JSON)
    signature = Column(Text)
    organization = Column(String(200), default="EduCerts Academy")
    claim_pin = Column(String(6), nullable=True)
    claimed = Column(Boolean, default=False)
    issued_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Boolean, default=False)
    batch_id = Column(String(36), ForeignKey("document_registry.id"), nullable=True)

    # ── Template & PDF fields ──
    template_type = Column(String(10), default="html")  # "html" or "pdf"
    rendered_pdf_path = Column(String(500), nullable=True)  # path to the generated PDF file

    # ── Digital Signing fields ──
    signing_status = Column(String(20), default="unsigned")  # "unsigned" | "signed"
    digital_signatures = Column(JSON, nullable=True)  # list of {signer_name, role, applied_at}

    student = relationship("User", back_populates="certificates")
    batch = relationship("DocumentRegistry", back_populates="certificates")

User.certificates = relationship("Certificate", back_populates="student")


class DocumentRegistry(Base):
    """
    Simulates an OpenAttestation Document Store smart contract.
    """
    __tablename__ = "document_registry"

    id = Column(String(36), primary_key=True, index=True)
    merkle_root = Column(String(64), unique=True, index=True)
    issuer_name = Column(String(200))
    organization = Column(String(200))
    cert_count = Column(Integer, default=1)
    anchored_at = Column(DateTime(timezone=True), server_default=func.now())
    revoked = Column(Boolean, default=False)

    certificates = relationship("Certificate", back_populates="batch")


class DigitalSignatureRecord(Base):
    """
    Stores the signature and stamp images uploaded by an authorized signer.
    """
    __tablename__ = "digital_signature_records"

    id = Column(Integer, primary_key=True, index=True)
    signer_name = Column(String(200))
    signer_role = Column(String(200))
    signature_path = Column(String(500), nullable=True)  # path to signature PNG
    stamp_path = Column(String(500), nullable=True)       # path to stamp PNG
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
