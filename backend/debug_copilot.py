import traceback
from app.database.connection import get_db
from app.copilot.data_resolver import DataResolver
from app.models.user import User

db = next(get_db())

uid = "qMZVYzb6eefcqykBj8LBYX8ctSp2"

user_exists = db.query(User).filter(User.firebase_uid == uid).first() is not None
print("User exists:", user_exists)

tests = [
    ("Documents", DataResolver.resolve_documents),
    ("Expiring Documents", DataResolver.resolve_expiring_documents),
    ("Profile", DataResolver.resolve_profile),
    ("Schemes", DataResolver.resolve_schemes),
    ("Statistics", DataResolver.resolve_statistics),
]

for name, fn in tests:
    print("=" * 60)
    print(name)
    try:
        if name == "Schemes":
            result = fn(db)
        else:
            result = fn(db, uid)
        print(result)
    except Exception:
        traceback.print_exc()
