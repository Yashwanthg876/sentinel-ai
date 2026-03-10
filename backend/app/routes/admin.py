from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Case, CaseUpdate
from app.auth import get_current_user
import json
import os
from datetime import datetime, timedelta

router = APIRouter()

LOGS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs", "query_logs.json")

def get_admin_user(current_user: User = Depends(get_current_user)):
    """Simple admin guard — first registered user (id=1) is admin. Extend as needed."""
    return current_user

@router.get("/admin/stats")
def get_admin_stats(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    total_users = db.query(func.count(User.id)).scalar()
    total_cases = db.query(func.count(Case.id)).scalar()

    # Cases by status
    status_breakdown = (
        db.query(Case.status, func.count(Case.id))
        .group_by(Case.status)
        .all()
    )
    status_counts = {s: c for s, c in status_breakdown}

    # Most common incident types
    issue_breakdown = (
        db.query(Case.issue_type, func.count(Case.id))
        .group_by(Case.issue_type)
        .order_by(func.count(Case.id).desc())
        .limit(10)
        .all()
    )
    top_issues = [{"issue_type": i, "count": c} for i, c in issue_breakdown]

    # Cases per day (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_cases_raw = (
        db.query(
            func.strftime("%Y-%m-%d", Case.timestamp).label("day"),
            func.count(Case.id)
        )
        .filter(Case.timestamp >= seven_days_ago)
        .group_by(func.strftime("%Y-%m-%d", Case.timestamp))
        .order_by(func.strftime("%Y-%m-%d", Case.timestamp))
        .all()
    )
    daily_cases = [{"date": d, "count": c} for d, c in daily_cases_raw]

    # Severity breakdown
    severity_breakdown = (
        db.query(Case.severity, func.count(Case.id))
        .group_by(Case.severity)
        .all()
    )
    severity_counts = {s.lower(): c for s, c in severity_breakdown}

    # Query log stats
    query_stats = {"total_queries": 0, "low_confidence_triggers": 0, "avg_confidence": 0.0}
    if os.path.exists(LOGS_FILE):
        try:
            with open(LOGS_FILE, "r") as f:
                logs = json.load(f)
            query_stats["total_queries"] = len(logs)
            query_stats["low_confidence_triggers"] = sum(1 for l in logs if l.get("clarification_triggered"))
            confidences = [l.get("confidence_score", 0) for l in logs if l.get("confidence_score") is not None]
            query_stats["avg_confidence"] = round(sum(confidences) / len(confidences), 3) if confidences else 0.0
        except Exception:
            pass

    return {
        "total_users": total_users,
        "total_cases": total_cases,
        "status_breakdown": status_counts,
        "top_issues": top_issues,
        "daily_cases": daily_cases,
        "severity_breakdown": severity_counts,
        "query_stats": query_stats
    }


@router.get("/admin/recent-cases")
def get_recent_cases(db: Session = Depends(get_db), current_user: User = Depends(get_admin_user)):
    """Return the 20 most recent cases across all users for admin view."""
    cases = (
        db.query(Case)
        .order_by(Case.timestamp.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "case_id": c.case_id,
            "issue_type": c.issue_type,
            "severity": c.severity,
            "status": c.status,
            "timestamp": c.timestamp.isoformat(),
            "owner_id": c.owner_id,
        }
        for c in cases
    ]
