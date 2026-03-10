from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.case_service import create_case, get_user_cases, update_case_status

router = APIRouter()

class CaseCreateReq(BaseModel):
    issue_type: str
    severity: str
    description: str

class CaseUpdateReq(BaseModel):
    status: str
    note: Optional[str] = ""

@router.post("/cases")
def create_new_case(req: CaseCreateReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # We must construct a dictionary or object easily accessible on frontend
    case = create_case(db, current_user.id, req.issue_type, req.severity, req.description)
    return {"case_id": case.case_id, "status": case.status}

@router.get("/cases")
def list_cases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_cases(db, current_user.id)

@router.put("/cases/{case_id}")
def update_case(case_id: str, req: CaseUpdateReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = update_case_status(db, current_user.id, case_id, req.status, req.note)
    if not case:
        return {"error": "Case not found or unauthorized"}
    return case
