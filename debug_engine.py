import sys
import os

# Add backend dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from backend.app.database.connection import SessionLocal
from backend.app.models.user import User
from backend.app.services import document_service
from backend.app.copilot.eligibility_engine import EligibilityEngine, get_document_type
from backend.app.models.scheme import Scheme

def debug():
    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        print("No users found in database.")
        return
        
    print("="*50)
    print(f"Step 1: Fetched user profile for {user.firebase_uid}")
    print("="*50)
    
    docs = document_service.get_documents(db, user.id)
    print("Step 2: Fetch ALL uploaded documents")
    for d in docs:
        d_type = get_document_type(d.title or "")
        print(f"document_id: {d.id} | document_type: {d_type} | file_name: {d.title} | user_id: {d.user_id}")
        
    print("="*50)
    print("Step 3: Evaluate All Schemes")
    
    # We will also just run one scheme to see debug prints
    scheme = db.query(Scheme).filter(Scheme.schemeId == "scheme-001").first()
    if scheme:
        print(f"Evaluating scheme: {scheme.title}")
        res = EligibilityEngine.evaluate_scheme(scheme, user, docs)
        print("Required docs:", scheme.requiredDocuments)
        print("Missing docs evaluated:", res.missing_documents)
        
    print("="*50)
    print("Running evaluate_all (bypassing cache)")
    from backend.app.copilot.eligibility_engine import invalidate_eligibility_cache
    invalidate_eligibility_cache(user.firebase_uid)
    
    final_res = EligibilityEngine.evaluate_all(db, user.firebase_uid)
    print("Global Missing Docs:", final_res.get("missing_documents"))

if __name__ == "__main__":
    debug()
