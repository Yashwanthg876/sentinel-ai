import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Case, CaseUpdate, Evidence

def create_case(db: Session, user_id: int, issue_type: str, severity: str, description: str, platform: str = None, account_username: str = None, incident_date: datetime = None):
    new_case = Case(
        case_id=f"CASE-{str(uuid.uuid4())[:8].upper()}",
        issue_type=issue_type,
        severity=severity,
        description=description,
        platform=platform,
        account_username=account_username,
        incident_date=incident_date,
        status="Complaint Filed",
        owner_id=user_id,
        timestamp=datetime.utcnow()
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    
    # Add initial update
    initial_update = CaseUpdate(
        case_id=new_case.id,
        note="Case initialized in SentinelAI",
        timestamp=datetime.utcnow()
    )
    db.add(initial_update)
    db.commit()
    db.refresh(new_case)
    return new_case

def get_user_cases(db: Session, user_id: int):
    # order by newest
    cases = db.query(Case).filter(Case.owner_id == user_id).order_by(Case.timestamp.desc()).all()
    # Serialize for frontend since relationships might be tricky
    result = []
    for c in cases:
        result.append({
            "case_id": c.case_id,
            "issue_type": c.issue_type,
            "severity": c.severity,
            "description": c.description,
            "platform": c.platform,
            "account_username": c.account_username,
            "incident_date": c.incident_date.isoformat() if c.incident_date else None,
            "status": c.status,
            "timestamp": c.timestamp.isoformat(),
            "updates": [{"timestamp": u.timestamp.isoformat(), "note": u.note} for u in c.updates],
            "evidence": [{"id": e.id, "file_name": e.file_name, "upload_timestamp": e.upload_timestamp.isoformat()} for e in c.evidence_list]
        })
    return result

def get_case(db: Session, user_id: int, case_id: str):
    case = db.query(Case).filter(Case.owner_id == user_id, Case.case_id == case_id).first()
    if not case:
        return None
    return {
        "case_id": case.case_id,
        "issue_type": case.issue_type,
        "severity": case.severity,
        "description": case.description,
        "platform": case.platform,
        "account_username": case.account_username,
        "incident_date": case.incident_date.isoformat() if case.incident_date else None,
        "status": case.status,
        "timestamp": case.timestamp.isoformat(),
        "updates": [{"timestamp": u.timestamp.isoformat(), "note": u.note} for u in case.updates],
        "evidence": [{"id": e.id, "file_name": e.file_name, "upload_timestamp": e.upload_timestamp.isoformat()} for e in case.evidence_list]
    }

def update_case_status(db: Session, user_id: int, case_id: str, new_status: str, note: str=""):
    case = db.query(Case).filter(Case.case_id == case_id, Case.owner_id == user_id).first()
    if not case:
        return None
        
    case.status = new_status
    if note:
        new_update = CaseUpdate(
            case_id=case.id,
            note=note,
            timestamp=datetime.utcnow()
        )
        db.add(new_update)
        
    db.commit()
    db.refresh(case)
    
    return {
        "case_id": case.case_id,
        "status": case.status,
        "updates": [{"timestamp": u.timestamp.isoformat(), "note": u.note} for u in case.updates]
    }

def add_evidence(db: Session, user_id: int, case_id_str: str, file_name: str, file_path: str, content_type: str):
    case = db.query(Case).filter(Case.case_id == case_id_str, Case.owner_id == user_id).first()
    if not case:
        return None
    
    new_evidence = Evidence(
        case_id=case.id,
        file_name=file_name,
        file_path=file_path,
        content_type=content_type,
        upload_timestamp=datetime.utcnow()
    )
    db.add(new_evidence)
    db.commit()
    db.refresh(new_evidence)
    return new_evidence
