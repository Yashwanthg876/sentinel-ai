import json
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_PATH = os.path.join(BASE_DIR, "logs", "query_logs.jsonl")

def log_query(query, sop_id, confidence, clarification_triggered):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "query": query,
        "sop_id": sop_id,
        "confidence": confidence,
        "clarification_triggered": clarification_triggered
    }

    if not os.path.exists(LOG_PATH):
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)

    try:
        with open(LOG_PATH, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"Error logging query: {e}")
