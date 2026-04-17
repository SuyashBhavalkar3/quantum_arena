from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict

class RateLimiter:
    def __init__(self, requests: int = 100, window: int = 60):
        self.requests = requests
        self.window = window
        self.clients: Dict[str, list] = defaultdict(list)
    
    async def __call__(self, request: Request):
        client_ip = request.client.host
        now = datetime.now()
        
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if now - req_time < timedelta(seconds=self.window)
        ]
        
        if len(self.clients[client_ip]) >= self.requests:
            raise HTTPException(status_code=429, detail="Too many requests")
        
        self.clients[client_ip].append(now)

rate_limiter = RateLimiter(requests=100, window=60)
