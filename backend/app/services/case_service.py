import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Case, CaseUpdate

def create_case(db: Session, user_id: int, issue_type: str, severity: str, description: str):
    new_case = Case(
        case_id=f"CASE-{str(uuid.uuid4())[:8].upper()}",
        issue_type=issue_type,
        severity=severity,
        description=description,
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
            "status": c.status,
            "timestamp": c.timestamp.isoformat(),
            "updates": [{"timestamp": u.timestamp.isoformat(), "note": u.note} for u in c.updates]
        })
    return result

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
