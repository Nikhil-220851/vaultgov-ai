import sys
from fastapi.testclient import TestClient
from app.main import app
from app.core.firebase_admin import get_current_uid
from app.core.admin_auth import require_admin
from app.database.connection import SessionLocal
from app.models.scheme import Scheme, SchemeAuditLog
from app.models.user import User

client = TestClient(app)

TEST_UID = "test_user_uid"
TEST_ADMIN_UID = "test_admin_uid"

# Setup dependencies
def override_get_current_uid():
    return TEST_UID

def override_require_admin():
    return TEST_ADMIN_UID

app.dependency_overrides[get_current_uid] = override_get_current_uid
app.dependency_overrides[require_admin] = override_require_admin

print("Starting Schemes API Verification...")

# 1. Verify read active schemes (GET /api/v1/schemes/)
print("Testing GET active schemes...")
response = client.get("/api/v1/schemes/")
assert response.status_code == 200, f"Failed active schemes: {response.text}"
active_schemes = response.json()
print(f"Active schemes returned: {len(active_schemes)}")

# 2. Verify search schemes (GET /api/v1/schemes/search)
print("Testing search schemes...")
response = client.get("/api/v1/schemes/search?q=ayushman&page=1&page_size=5")
assert response.status_code == 200, f"Search failed: {response.text}"
search_res = response.json()
assert search_res["total"] >= 1, "Search didn't find seeded PM-JAY scheme"
print(f"Search successfully returned {search_res['total']} match(es) for 'ayushman'")

# 3. Verify admin endpoints
print("Testing admin CREATE scheme...")
scheme_id = "test-scheme-xyz"
new_scheme_payload = {
    "schemeId": scheme_id,
    "title": "Pradhan Mantri Test Scheme",
    "subtitle": "Test Scheme Subtitle",
    "description": "This is a verification test scheme for testing FastAPI endpoints.",
    "category": "Education",
    "benefits": ["Benefit 1: Tuition fee waiver", "Benefit 2: Free test kit"],
    "eligibility": "Open to all students with family income under ₹3 Lakh per annum.",
    "requiredDocuments": ["Aadhaar Card", "Income Certificate"],
    "gender": "All",
    "occupation": "Student",
    "ageRange": "15-25",
    "incomeLimit": "LIG",
    "education": "Secondary",
    "state": "All",
    "applicationStart": "2026-01-01",
    "applicationEnd": "2026-12-31",
    "officialWebsite": "https://test.gov.in",
    "officialApplyLink": "https://apply.test.gov.in",
    "ministry": "Ministry of Education",
    "launchYear": 2026,
    "sourceName": "Test Portal Source",
    "sourceURL": "https://source.test.gov.in"
}

response = client.post("/api/v1/schemes/", json=new_scheme_payload)
assert response.status_code == 201, f"Admin create failed: {response.text}"
created_scheme = response.json()
assert created_scheme["schemeId"] == scheme_id
assert created_scheme["contentHash"] is not None
print("Admin CREATE successful. Content Hash computed:", created_scheme["contentHash"])

# 4. Verify Audit Log was created
db = SessionLocal()
audit_log = db.query(SchemeAuditLog).filter(SchemeAuditLog.scheme_id == scheme_id).first()
assert audit_log is not None, "No audit log entry found for CREATE operation"
assert audit_log.action == "CREATE"
assert audit_log.admin_uid == TEST_ADMIN_UID
print("Audit logging verified successfully for CREATE.")

# 5. Verify admin UPDATE scheme partial patching
print("Testing admin UPDATE benefits...")
update_benefits_payload = {
    "benefits": ["Updated Benefit: 100% Tuition fee waiver"]
}
response = client.patch(f"/api/v1/schemes/{scheme_id}/benefits", json=update_benefits_payload)
assert response.status_code == 200, f"Admin benefits update failed: {response.text}"
updated_scheme = response.json()
assert updated_scheme["benefits"][0] == "Updated Benefit: 100% Tuition fee waiver"
print("Admin UPDATE benefits successful.")

# 6. Verify audit logs list route
response = client.get(f"/api/v1/schemes/{scheme_id}/audit")
assert response.status_code == 200, f"Audit get failed: {response.text}"
audit_logs = response.json()
assert len(audit_logs) >= 2, "Expected at least 2 logs (CREATE + UPDATE_BENEFITS)"
print(f"Retrieved {len(audit_logs)} audit log entries for scheme.")

# 7. Verify delta sync with since query parameter (GET /api/v1/schemes/sync)
print("Testing schemes sync...")
response = client.get(f"/api/v1/schemes/sync")
assert response.status_code == 200, f"Initial sync failed: {response.text}"
initial_sync = response.json()
assert len(initial_sync["newSchemes"]) > 0
print(f"Initial sync successfully returned {len(initial_sync['newSchemes'])} schemes.")

# 8. Verify soft disable / soft delete replacing hard deletes
print("Testing soft disable (replacing physical delete)...")
response = client.patch(f"/api/v1/schemes/{scheme_id}/disable")
assert response.status_code == 200, f"Disable failed: {response.text}"
disabled_scheme = response.json()
assert disabled_scheme["status"] == "Disabled"

# Verify it is no longer returned in active schemes list
response = client.get("/api/v1/schemes/")
active_res = response.json()
found = any(s["schemeId"] == scheme_id for s in active_res)
assert not found, "Disabled scheme was found in active schemes listing!"
print("Soft delete / disable logic verified successfully.")

# Clean up test scheme
db.query(SchemeAuditLog).filter(SchemeAuditLog.scheme_id == scheme_id).delete()
db.query(Scheme).filter(Scheme.schemeId == scheme_id).delete()
db.commit()
db.close()

print("ALL SCHEME VERIFICATION TESTS PASSED SUCCESSFULLY!")
