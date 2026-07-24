import sys
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.connection import DATABASE_URL
from app.models.conversation import Conversation
from app.schemas.conversation import Conversation as SchemaConversation
from pydantic import TypeAdapter
from typing import List

logging.basicConfig(level=logging.DEBUG)

def main():
    try:
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        
        print("Fetching conversations...")
        convos = db.query(Conversation).limit(5).all()
        print(f"Found {len(convos)} conversations.")
        
        if convos:
            print("Testing Pydantic serialization...")
            try:
                adapter = TypeAdapter(List[SchemaConversation])
                serialized = adapter.validate_python(convos)
                print("Serialization successful!")
            except Exception as e:
                print("Serialization Error:", e)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
