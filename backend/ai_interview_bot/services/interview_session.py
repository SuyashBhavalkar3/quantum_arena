from datetime import datetime

class SessionManager:
    def __init__(self):
        self.sessions = {}
    
    def create_session(self, session_id):
        self.sessions[session_id] = {
            "session_id": session_id,
            "transcript": [],
            "code": "",
            "violations": [],
            "stage": "intro",
            "last_question": "",
            "candidate_responses": []
        }
        return self.sessions[session_id]
    
    def add_transcript(self, session_id, speaker, message):
        if session_id in self.sessions:
            self.sessions[session_id]["transcript"].append({
                "speaker": speaker,
                "message": message,
                "timestamp": datetime.now().isoformat()
            })
    
    def update_code(self, session_id, code):
        if session_id in self.sessions:
            self.sessions[session_id]["code"] = code
    
    def update_last_question(self, session_id, question):
        if session_id in self.sessions:
            self.sessions[session_id]["last_question"] = question
    
    def add_candidate_response(self, session_id, response):
        if session_id in self.sessions:
            self.sessions[session_id]["candidate_responses"].append(response)
    
    def get_session(self, session_id):
        return self.sessions.get(session_id)
    
    def end_session(self, session_id):
        if session_id in self.sessions:
            self.sessions[session_id]["ended_at"] = datetime.now()
