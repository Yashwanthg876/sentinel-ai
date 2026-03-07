import json
import os
import uuid
from datetime import datetime

CASES_FILE = os.path.join(os.path.dirname(__file__), "../data/cases.json")

def _load_cases():
    if not os.path.exists(CASES_FILE):
        return []
    with open(CASES_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def _save_cases(cases):
    os.makedirs(os.path.dirname(CASES_FILE), exist_ok=True)
    with open(CASES_FILE, 'w') as f:
        json.dump(cases, f, indent=4)

def create_case(issue_type: str, severity: str, description: str):
    cases = _load_cases()
    new_case = {
        "case_id": f"CASE-{str(uuid.uuid4())[:8].upper()}",
        "issue_type": issue_type,
        "severity": severity,
        "description": description,
        "status": "Complaint Filed",
        "timestamp": datetime.now().isoformat(),
        "updates": [
            {
                "timestamp": datetime.now().isoformat(),
                "note": "Case initialized in SentinelAI"
            }
        ]
    }
    # Add to the beginning of the list to show newest first
    cases.insert(0, new_case)
    _save_cases(cases)
    return new_case

def get_all_cases():
    return _load_cases()

def update_case_status(case_id: str, new_status: str, note: str=""):
    cases = _load_cases()
    for case in cases:
        if case["case_id"] == case_id:
            case["status"] = new_status
            case["updates"].append({
                "timestamp": datetime.now().isoformat(),
                "note": note
            })
            _save_cases(cases)
            return case
    return None
