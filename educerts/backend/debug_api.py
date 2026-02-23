import requests

try:
    print("Testing GET /api/certificates (Global) ...")
    response = requests.get("http://localhost:8000/api/certificates")
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.text}")
except Exception as e:
    print(f"Connection Error: {e}")
