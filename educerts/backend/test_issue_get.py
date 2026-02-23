import requests

issue_data = {
    "student_name": "Eden",
    "course_name": "Full Stack Mastery",
    "data_payload": {
        "transcript": [
            {"name": "Python Backend", "grade": "A", "courseCode": "PB101", "semester": "1"}
        ],
        "organization": "Ethiopia"
    }
}

try:
    print("Issuing certificate for Eden...")
    res = requests.post("http://localhost:8000/api/issue", json=issue_data)
    print(f"Issue Status: {res.status_code}")
    if res.status_code == 200:
        print("Success. Testing GET /api/certificates/Eden ...")
        res_get = requests.get("http://localhost:8000/api/certificates/Eden")
        print(f"GET Status: {res_get.status_code}")
        print(f"GET Content: {res_get.text}")
    else:
        print(f"Issue Failed: {res.text}")
except Exception as e:
    print(f"Error: {e}")
