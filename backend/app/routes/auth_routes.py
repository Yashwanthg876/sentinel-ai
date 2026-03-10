from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.config import settings
from pydantic import BaseModel
from typing import Optional
from datetime import timedelta

# Google auth-lib
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter()

# ─── Pydantic Schemas ──────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleTokenPayload(BaseModel):
    token: str  # Google ID token from the frontend

class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None

    class Config:
        orm_mode = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# ─── Email / Password routes (existing) ───────────────────────────────────────

@router.post("/register", response_model=TokenResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not db_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user": db_user}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

# ─── Google OAuth route (new) ─────────────────────────────────────────────────

@router.post("/google", response_model=TokenResponse)
def google_login(payload: GoogleTokenPayload, db: Session = Depends(get_db)):
    """
    Verify a Google ID token sent from the frontend Google Sign-In button.
    Creates a new user if they haven't signed in before, otherwise returns
    the existing account. Returns a JWT for all subsequent API calls.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google authentication is not configured. Set GOOGLE_CLIENT_ID in backend/.env",
        )

    # 1. Verify the token against Google's public certs
    try:
        id_info = id_token.verify_oauth2_token(
            payload.token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,  # slight tolerance for clock drift
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {exc}",
        )

    # 2. Extract user info from the verified claims
    google_sub = id_info["sub"]          # stable unique identifier
    email      = id_info.get("email", "")
    name       = id_info.get("name", "")

    # 3. Look up by google_id first (returning user), then by email (account merge)
    db_user = db.query(User).filter(User.google_id == google_sub).first()

    if not db_user and email:
        # Email-registered user signing in with Google for the first time → link accounts
        db_user = db.query(User).filter(User.email == email).first()
        if db_user:
            db_user.google_id = google_sub
            if not db_user.name:
                db_user.name = name
            db.commit()
            db.refresh(db_user)

    if not db_user:
        # Brand new user — create account
        db_user = User(
            email=email,
            name=name,
            google_id=google_sub,
            hashed_password=None,        # Google users have no password
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

    # 4. Issue our own JWT
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user,
    }
