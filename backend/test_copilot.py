import sys
import json
from fastapi.testclient import TestClient
from app.main import app
from app.core.firebase_admin import get_current_uid

# Override the auth dependency
app.dependency_overrides[get_current_uid] = lambda: "test_uid"

client = TestClient(app)

print("Sending request to /api/copilot/chat...")
response = client.post("/api/copilot/chat", json={"message": "list schemes"})
print("Status Code:", response.status_code)
try:
    print("Response JSON:", json.dumps(response.json(), indent=2))
except Exception as e:
    print("Response Text:", response.text)
