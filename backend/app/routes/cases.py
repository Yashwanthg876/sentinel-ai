from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.services.case_service import create_case, get_user_cases, update_case_status, get_case, add_evidence
import os
import shutil

router = APIRouter()

class CaseCreateReq(BaseModel):
    issue_type: str
    severity: str
    description: str
    platform: Optional[str] = None
    account_username: Optional[str] = None
    incident_date: Optional[str] = None

class CaseUpdateReq(BaseModel):
    status: str
    note: Optional[str] = ""

@router.post("/cases")
def create_new_case(req: CaseCreateReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # We must construct a dictionary or object easily accessible on frontend
    
    incident_date_obj = None
    if req.incident_date:
        from datetime import datetime
        try:
            incident_date_obj = datetime.fromisoformat(req.incident_date.replace('Z', '+00:00'))
        except ValueError:
            pass
            
    case = create_case(
        db, 
        current_user.id, 
        req.issue_type, 
        req.severity, 
        req.description,
        platform=req.platform,
        account_username=req.account_username,
        incident_date=incident_date_obj
    )
    return {"case_id": case.case_id, "status": case.status}

@router.get("/cases")
def list_cases(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_user_cases(db, current_user.id)

@router.get("/cases/{case_id}")
def retrieve_case(case_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = get_case(db, current_user.id, case_id)
    if not case:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@router.put("/cases/{case_id}")
def update_case(case_id: str, req: CaseUpdateReq, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = update_case_status(db, current_user.id, case_id, req.status, req.note)
    if not case:
        return {"error": "Case not found or unauthorized"}
    return case

@router.post("/cases/{case_id}/evidence")
async def upload_evidence(case_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Create uploads directory if it doesn't exist
    upload_dir = "data/evidence_files"
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir)
        
    file_path = os.path.join(upload_dir, f"{case_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    evidence = add_evidence(db, current_user.id, case_id, file.filename, file_path, file.content_type)
    if not evidence:
        raise HTTPException(status_code=404, detail="Case not found or unauthorized")
        
    return {"message": "Evidence uploaded successfully", "file_name": file.filename}

@router.post("/cases/{case_id}/generate-complaint")
async def generate_complaint(case_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    case = get_case(db, current_user.id, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    complaint_dir = "data/complaints"
    if not os.path.exists(complaint_dir):
        os.makedirs(complaint_dir)
        
    output_path = os.path.join(complaint_dir, f"complaint_{case_id}.pdf")
    from app.services.complaint_service import generate_complaint_pdf
    generate_complaint_pdf(case, output_path)
    
    return {"message": "Complaint generated", "download_url": f"/cases/{case_id}/download-complaint"}

@router.get("/cases/{case_id}/download-complaint")
async def download_complaint(case_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Verify case ownership
    case = get_case(db, current_user.id, case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    file_path = os.path.join("data/complaints", f"complaint_{case_id}.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Complaint not found. Generate it first.")
        
    return FileResponse(file_path, media_type='application/pdf', filename=f"Complaint_{case_id}.pdf")
