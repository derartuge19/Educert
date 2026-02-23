import requests
import json

payload = {
    "version": "https://schema.opencerts.io/transcripts/2.1",
    "data": {
        "id": {"salt": "93fce1186e04513de948fdfafccddfe5", "value": "f5a80708"},
        "name": {"salt": "65cf78544465edef8e8f86554a72c49b", "value": "EduCerts Verifiable Certificate"},
        "issuedOn": {"salt": "afdac52694a47b4e788bf781cd62ba99", "value": "2026-02-21T16:35:42.816292"},
        "recipient.name": {"salt": "db2cb0ea7b7b1bb7921f7c9074bf6305", "value": "eden mulugeta"},
        "recipient.studentId": {"salt": "684e03b9ae500fba6807e3d8cec89451", "value": "N/A"},
        "transcript": {"salt": "f8aeda6f901511cb680831966a5b34ca", "value": [{"name": "English ", "grade": "A", "courseCode": "CS101", "semester": "1"}]},
        "issuers": {"salt": "dd2743439ee5b9048c54f669b478d0cb", "value": [{"name": "EduCerts Academy", "url": "https://educerts.io", "documentStore": "0x007d40224f6562461633ccfbaffd359ebb2fc9ba", "identityProof": {"type": "DNS-TXT", "location": "educerts.io"}}]}
    },
    "signature": {
        "type": "SHA3MerkleProof",
        "targetHash": "fc2f4f3419ddc854f1ce8be8156043d9acc29d4b98d92b477f18b148432584b7",
        "proof": [],
        "merkleRoot": "fc2f4f3419ddc854f1ce8be8156043d9acc29d4b98d92b477f18b148432584b7",
        "signature": "OxoBTXWVe06f7oECFiLu+BtuHeFC4KPl2n3AzxOoZK6v6joig7jVvwPLFNDqKhvE1gSj5aTULJwNcslexQrKBw==",
        "publicKey": "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAh8Kq0bFLoEpD02KQBVNL4IzvwaXdfqYwzLkMZg8UwZ4=\n-----END PUBLIC KEY-----\n"
    }
}

try:
    print("Simulating verification for provided JSON...")
    response = requests.post("http://localhost:8000/api/verify", json={"data_payload": payload})
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
