import json
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
LOG_PATH = os.path.join(BASE_DIR, "logs", "query_logs.json")

def log_query(query, sop_id, confidence, clarification_triggered):
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "query": query,
        "sop_id": sop_id,
        "confidence": confidence,
        "clarification_triggered": clarification_triggered
    }

    if not os.path.exists(LOG_PATH):
        # We also need to make sure the directory exists just in case
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, "w") as f:
            json.dump([], f)

    try:
        with open(LOG_PATH, "r+") as f:
            try:
                data = json.load(f)
            except json.JSONDecodeError:
                data = []
            data.append(log_entry)
            f.seek(0)
            json.dump(data, f, indent=2)
            f.truncate()
    except Exception as e:
        print(f"Error logging query: {e}")
