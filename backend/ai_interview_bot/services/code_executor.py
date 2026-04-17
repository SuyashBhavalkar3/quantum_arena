import os
import requests
from dotenv import load_dotenv

load_dotenv()

def execute_code(code, language="python3", versionIndex="4"):
    client_id = os.getenv("JDOODLE_CLIENT_ID")
    client_secret = os.getenv("JDOODLE_CLIENT_SECRET")
    
    if not client_id or not client_secret:
        return {"error": "JDoodle credentials not configured"}
    
    payload = {
        "clientId": client_id,
        "clientSecret": client_secret,
        "script": code,
        "language": language,
        "versionIndex": versionIndex
    }
    
    try:
        response = requests.post("https://api.jdoodle.com/v1/execute", json=payload)
        response.raise_for_status()
        data = response.json()
        
        if data.get("statusCode") == 200:
            return {
                "output": data.get("output", ""),
                "memory": data.get("memory", ""),
                "cpuTime": data.get("cpuTime", "")
            }
        else:
            return {"error": f"JDoodle execution failed: {data.get('statusCode', 'Unknown error')}"}
    except requests.RequestException as e:
        return {"error": f"Request to JDoodle failed: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
