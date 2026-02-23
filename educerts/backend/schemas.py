from pydantic import BaseModel, field_validator, EmailStr
from typing import Dict, Any, Optional
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: str

    @field_validator("name")
    @classmethod
    def name_must_be_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters")
        if len(v) > 100:
            raise ValueError("Name must be at most 100 characters")
        # Prevent script injection
        forbidden = ["<", ">", "\"", "'", ";", "--", "/*", "*/"]
        for char in forbidden:
            if char in v:
                raise ValueError(f"Name contains invalid characters")
        return v

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if len(v) > 255:
            raise ValueError("Email too long")
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def password_must_be_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if len(v) > 128:
            raise ValueError("Password is too long")
        return v

class User(UserBase):
    id: int
    is_admin: bool

    class Config:
        from_attributes = True

class CertificateBase(BaseModel):
    student_name: str
    course_name: str
    cert_type: Optional[str] = "certificate"  # degree, diploma, training, professional, attendance, certificate
    data_payload: Dict[str, Any]

    @field_validator("student_name")
    @classmethod
    def student_name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 200:
            raise ValueError("Student name must be 2-200 characters")
        return v

    @field_validator("course_name")
    @classmethod
    def course_name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 200:
            raise ValueError("Course name must be 2-200 characters")
        return v

class CertificateCreate(CertificateBase):
    pass

class Certificate(CertificateBase):
    id: str
    student_id: Optional[int]
    cert_type: str
    signature: str
    organization: str
    claim_pin: Optional[str]
    claimed: bool
    issued_at: datetime
    revoked: bool
    batch_id: Optional[str] = None
    template_type: Optional[str] = "html"
    rendered_pdf_path: Optional[str] = None
    signing_status: Optional[str] = "unsigned"
    digital_signatures: Optional[Any] = None

    class Config:
        from_attributes = True

class VerificationRequest(BaseModel):
    certificate_id: Optional[str] = None
    data_payload: Optional[Dict[str, Any]] = None
    signature: Optional[str] = None
