from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String, nullable=True)          # Full name from Google or profile
    google_id = Column(String, unique=True, index=True, nullable=True)  # Google's 'sub' claim
    hashed_password = Column(String, nullable=True)  # Nullable → Google-only users have no password
    role = Column(String, default="public_user")
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="owner", cascade="all, delete")

class Case(Base):
    __tablename__ = "cases"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(String, unique=True, index=True)
    issue_type = Column(String)
    severity = Column(String)
    description = Column(String)
    status = Column(String, default="Complaint Filed")
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    owner_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="cases")
    updates = relationship("CaseUpdate", back_populates="case", cascade="all, delete")
    
    platform = Column(String, nullable=True)
    account_username = Column(String, nullable=True)
    incident_date = Column(DateTime, nullable=True)
    evidence_list = relationship("Evidence", back_populates="case", cascade="all, delete")

class CaseUpdate(Base):
    __tablename__ = "case_updates"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    note = Column(String)

    case = relationship("Case", back_populates="updates")

class Evidence(Base):
    __tablename__ = "evidence"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    file_name = Column(String)
    file_path = Column(String)
    content_type = Column(String)
    upload_timestamp = Column(DateTime, default=datetime.utcnow)

    case = relationship("Case", back_populates="evidence_list")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    sender = Column(String)
    text = Column(String)
    issue_type = Column(String, nullable=True)
    severity_level = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class IncidentLog(Base):
    __tablename__ = "incident_logs"
    id = Column(Integer, primary_key=True, index=True)
    log_data = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)