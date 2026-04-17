from datetime import datetime

def log_violation(session_id, violation_type, session_manager):
    session = session_manager.get_session(session_id)
    if session:
        session["violations"].append({
            "type": violation_type,
            "timestamp": datetime.now().isoformat()
        })
