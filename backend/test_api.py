from fastapi.testclient import TestClient
from uuid import uuid4
from app.main import app
from app.core.firebase_admin import get_current_uid
from app.database.connection import SessionLocal
from app.models.user import User

client = TestClient(app)

# Override the auth dependency
TEST_UID = "test_user_uid"

def override_get_current_uid():
    return TEST_UID

app.dependency_overrides[get_current_uid] = override_get_current_uid

# First ensure the user exists
db = SessionLocal()
test_user = db.query(User).filter(User.firebase_uid == TEST_UID).first()
if not test_user:
    test_user = User(firebase_uid=TEST_UID, mobile_number="+1234567890")
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
db.close()

# Test 1: Create Document
print("Testing CREATE...")
doc_data = {
    "title": "Test Document",
    "category": "Invoice",
    "tags": ["test", "api"],
    "source": "api_test"
}
response = client.post("/api/v1/documents/", json=doc_data)
print("Create Status:", response.status_code)
if response.status_code != 201:
    print("Create Error:", response.json())
    exit(1)
doc_id = response.json()["id"]
print("Created Doc ID:", doc_id)

# Test 2: Retrieve Document
print("Testing GET...")
response = client.get(f"/api/v1/documents/{doc_id}")
print("Get Status:", response.status_code)
if response.status_code != 200:
    print("Get Error:", response.json())
    exit(1)
print("Doc Title:", response.json()["title"])

# Test 3: Update Document
print("Testing UPDATE...")
update_data = {"title": "Updated Test Document"}
response = client.put(f"/api/v1/documents/{doc_id}", json=update_data)
print("Update Status:", response.status_code)
if response.status_code != 200:
    print("Update Error:", response.json())
    exit(1)
print("Updated Title:", response.json()["title"])

# Test 4: Delete Document
print("Testing DELETE...")
response = client.delete(f"/api/v1/documents/{doc_id}")
print("Delete Status:", response.status_code)
if response.status_code != 204:
    print("Delete Error:", response.json())
    exit(1)

# Verify Delete
response = client.get(f"/api/v1/documents/{doc_id}")
print("Verify Delete Status (should be 404):", response.status_code)

print("ALL TESTS PASSED")
