from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.case_service import create_case, get_all_cases, update_case_status

router = APIRouter()

class CaseCreateReq(BaseModel):
    issue_type: str
    severity: str
    description: str

class CaseUpdateReq(BaseModel):
    status: str
    note: Optional[str] = ""

@router.post("/cases")
def create_new_case(req: CaseCreateReq):
    return create_case(req.issue_type, req.severity, req.description)

@router.get("/cases")
def list_cases():
    return get_all_cases()

@router.put("/cases/{case_id}")
def update_case(case_id: str, req: CaseUpdateReq):
    case = update_case_status(case_id, req.status, req.note)
    if not case:
        return {"error": "Case not found"}
    return case
