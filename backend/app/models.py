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

    cases = relationship("Case", back_populates="owner")

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

class CaseUpdate(Base):
    __tablename__ = "case_updates"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    note = Column(String)

    case = relationship("Case", back_populates="updates")
