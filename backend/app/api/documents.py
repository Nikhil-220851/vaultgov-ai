from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.firebase_admin import get_current_uid
from app.database.connection import get_db
from app.schemas.document import DocumentCreate, DocumentResponse, DocumentUpdate
from app.services import document_service, user_service

router = APIRouter(prefix="/documents", tags=["documents"])


def _get_user_id(db: Session, current_uid: str) -> UUID:
    user = user_service.get_user_by_uid(db, current_uid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user.id


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    body: DocumentCreate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> DocumentResponse:
    user_id = _get_user_id(db, current_uid)
    doc = document_service.create_document(db, user_id, body)
    return DocumentResponse.model_validate(doc)


@router.post("/upload-pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    current_uid: str = Depends(get_current_uid),
):
    from app.services.pdf_service import extract_text_from_pdf
    
    if not file.filename.lower().endswith(".pdf"):
        import traceback
        print("Failing validation: Only PDF files are supported.")
        traceback.print_stack()
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        import time
        t_start = time.time()
        file_bytes = await file.read()
        print(f"===================================")
        print(f"ENDPOINT: POST /api/v1/documents/upload-pdf")
        print(f"CALLING: extract_text_from_pdf()")
        print(f"===================================")
        text = extract_text_from_pdf(file_bytes)
        
        # Document Intelligence Integration
        document_intelligence_success = False
        structured_data = None
        doc_type = "pdf"
        
        # Simple detection based on OCR text
        text_lower = text.lower()
        if "aadhaar" in text_lower or "uidai" in text_lower:
            doc_type = "aadhaar"
        elif "permanent account number" in text_lower or "income tax department" in text_lower:
            doc_type = "pan"
        elif "passport" in text_lower:
            doc_type = "passport"
        elif "driving licence" in text_lower or "driving license" in text_lower or "dl no" in text_lower:
            doc_type = "driving_license"

        if doc_type != "pdf":
            try:
                import traceback
                from app.services.document_intelligence.document_intelligence_service import DocumentIntelligenceService
                from app.services.document_intelligence.models import ExtractionRequest
                
                print("===== DOCUMENT INTELLIGENCE =====")
                print(f"Detected document: {doc_type}")
                print(f"Template: {doc_type}.json")
                print("Calling Gemini...")
                
                start_time = time.time()
                svc = DocumentIntelligenceService()
                req = ExtractionRequest(document_type=doc_type, raw_ocr_text=text)
                response = await svc.extract(req)
                
                structured_data = response.model_dump().get("fields", {})
                document_intelligence_success = True
                
                print(f"Gemini response time: {time.time() - start_time:.2f}s")
                print(f"Structured fields: {len(structured_data)}")
                print("Extraction success")
                print("=======================================")
            except Exception as e:
                import traceback
                print("===== DOCUMENT INTELLIGENCE =====")
                print(f"Gemini extraction failed: {type(e).__name__}: {e}")
                traceback.print_exc()
                print("=======================================")
                document_intelligence_success = False
                structured_data = None
        
        display_names = {
            "aadhaar": "Aadhaar Card",
            "pan": "PAN Card",
            "passport": "Passport",
            "driving_license": "Driving Licence",
            "unknown": "Unknown Document",
            "pdf": "Document PDF"
        }
        categories = {
            "aadhaar": "Identity",
            "pan": "Identity",
            "passport": "Identity",
            "driving_license": "Identity",
            "unknown": "Other",
            "pdf": "Other"
        }
        
        flat_structured = {}
        confidence = 0.9 if document_intelligence_success else 0.0
        if structured_data and isinstance(structured_data, dict):
            conf_scores = []
            for k, v in structured_data.items():
                if isinstance(v, dict):
                    val = v.get("value")
                    c = v.get("confidence")
                    if c is not None:
                        try:
                            conf_scores.append(float(c))
                        except (ValueError, TypeError):
                            pass
                    flat_structured[k] = val
                else:
                    flat_structured[k] = v
            if conf_scores:
                confidence = sum(conf_scores) / len(conf_scores)

        return {
            "secure_url": None,
            "public_id": None,
            "document_type": doc_type,
            "display_name": display_names.get(doc_type, "Document PDF"),
            "category": categories.get(doc_type, "Other"),
            "confidence": confidence,
            "extracted_text": text,
            "ocr_text": text,
            "structured_data": flat_structured,
            "document_intelligence_success": document_intelligence_success,
            "processing_time": round(time.time() - t_start, 2),
            "metadata": {
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(file_bytes)
            }
        }
    except ValueError as e:
        import traceback
        print(f"OCR/PDF Parsing Error (ValueError) in endpoint: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Unexpected FastAPI endpoint Error: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="An error occurred while processing the PDF.")


@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> List[DocumentResponse]:
    user_id = _get_user_id(db, current_uid)
    docs = document_service.get_documents(db, user_id)
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> DocumentResponse:
    user_id = _get_user_id(db, current_uid)
    doc = document_service.get_document(db, document_id, user_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse.model_validate(doc)


@router.put("/{document_id}", response_model=DocumentResponse)
def update_document(
    document_id: UUID,
    body: DocumentUpdate,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> DocumentResponse:
    user_id = _get_user_id(db, current_uid)
    doc = document_service.update_document(db, document_id, user_id, body)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    return DocumentResponse.model_validate(doc)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_uid: str = Depends(get_current_uid),
) -> None:
    user_id = _get_user_id(db, current_uid)
    
    # Get document to extract image_uri before deletion
    doc = document_service.get_document(db, document_id, user_id)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    # Try to delete from Cloudinary if there's an image
    if doc.image_uri and "cloudinary.com" in doc.image_uri:
        try:
            # Example URI: https://res.cloudinary.com/.../upload/v1234/documents/abc.jpg
            # Extract public_id: documents/abc
            parts = doc.image_uri.split("/upload/")
            if len(parts) > 1:
                path_part = parts[1]
                # Remove version if present (e.g. v1234/)
                path_parts = path_part.split("/")
                if path_parts[0].startswith("v") and path_parts[0][1:].isdigit():
                    path_parts = path_parts[1:]
                
                # Rejoin and remove extension
                public_id_with_ext = "/".join(path_parts)
                public_id = public_id_with_ext.rsplit(".", 1)[0]
                
                from app.services import cloudinary_service
                cloudinary_service.delete_image(public_id)
        except Exception as e:
            # Log error but don't fail the deletion
            print(f"Failed to delete image from Cloudinary: {e}")

    success = document_service.delete_document(db, document_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
