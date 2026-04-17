import requests
import json

# Simulate what frontend sends to backend
frontend_payload = {
    "code": "print('Hello from Frontend')",
    "language": "python3",
    "sessionId": "test_session_123",
    "versionIndex": "3"
}

print("Testing frontend -> backend -> JDoodle flow")
print("=" * 60)
print(f"Frontend payload: {json.dumps(frontend_payload, indent=2)}")
print("=" * 60)

# Test the endpoint
backend_url = "http://localhost:8000/api/execute-code"

try:
    response = requests.post(backend_url, json=frontend_payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"ERROR: {str(e)}")
    print("\nMake sure backend is running on http://localhost:8000")
