import requests
import os
from dotenv import load_dotenv
load_dotenv()

url = "https://api.jdoodle.com/v1/execute"

payload = {
    "clientId": os.getenv("JDOODLE_CLIENT_ID"),
    "clientSecret": os.getenv("JDOODLE_CLIENT_SECRET"),
    "script": "print('Hello from JDoodle')",
    "language": "python3",
    "versionIndex": "3"
}

response = requests.post(url, json=payload)

print(response.json())