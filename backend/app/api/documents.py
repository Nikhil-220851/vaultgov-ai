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
        
        # Simple detection based on OCR text
        print("Running TemplateMatcher...")
        from app.services.document_intelligence.template_matcher import TemplateMatcher
        
        matcher = TemplateMatcher()
        match_result = matcher.match(text)
        doc_type = match_result["template_id"]
        display_name = match_result["display_name"]
        category = match_result["category"]
        confidence = match_result.get("confidence_score", 0.0) / 100.0

        if doc_type != "unknown":
            try:
                print(f"Detected template:\n{doc_type} (Score: {match_result['confidence_score']}%)\nBuilding prompt...\nCalling Gemini...")
                from app.services.document_intelligence.service import DocumentIntelligenceService
                di_service = DocumentIntelligenceService()
                
                result = di_service.extract(
                    document_type=doc_type,
                    raw_ocr_text=text
                )
                structured_data = result.model_dump()
                document_intelligence_success = True
                confidence = result.overall_confidence
            except Exception as e:
                print(f"Document Intelligence failed: {e}")
        else:
            print("No template matched\nUsing generic extraction")
            doc_type = "pdf"
            display_name = "Document PDF"
            category = "Other"
        
        flat_structured = {}
        validation_result = None
        if structured_data and "fields" in structured_data:
            fields = structured_data["fields"]
            if isinstance(fields, dict):
                for k, v in fields.items():
                    if isinstance(v, dict):
                        flat_structured[k] = v.get("value")
                    else:
                        flat_structured[k] = v
                        
                # Run ValidationEngine
                try:
                    from app.services.document_intelligence.template_loader import TemplateLoader
                    from app.services.document_intelligence.validation_engine import ValidationEngine
                    
                    loader = TemplateLoader()
                    template = loader.load(doc_type)
                    validator = ValidationEngine()
                    
                    val_result = validator.validate(template, fields)
                    validation_result = val_result.to_dict()
                except Exception as e:
                    print(f"Validation Engine failed: {e}")
                    validation_result = {
                        "score": 0.0,
                        "overall_status": "Error",
                        "field_results": {}
                    }

        return {
            "secure_url": None,
            "public_id": None,
            "document_type": doc_type,
            "display_name": display_name,
            "category": category,
            "confidence": confidence,
            "extracted_text": text,
            "ocr_text": text,
            "structured_data": flat_structured if flat_structured else None,
            "validation": validation_result,
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


@router.get("/categories", response_model=List[str])
def get_categories(
    current_uid: str = Depends(get_current_uid),
) -> List[str]:
    from app.services.document_intelligence.template_loader import TemplateLoader
    
    loader = TemplateLoader()
    available_types = loader.list_available()
    categories = set()
    
    for t_type in available_types:
        try:
            template = loader.load(t_type)
            if template.category:
                categories.add(template.category)
        except Exception as e:
            print(f"Failed to load template {t_type} for category extraction: {e}")
            
    return sorted(list(categories))


@router.post("/validate")
async def validate_document(payload: dict):
    """
    Endpoint for real-time validation on the frontend.
    Accepts: { "document_type": "aadhaar", "fields": { "aadhaar_number": "1234..." } }
    Returns: ValidationResult dict
    """
    try:
        doc_type = payload.get("document_type")
        fields = payload.get("fields", {})
        
        from app.services.document_intelligence.template_loader import TemplateLoader
        from app.services.document_intelligence.validation_engine import ValidationEngine
        
        loader = TemplateLoader()
        template = loader.load(doc_type)
        validator = ValidationEngine()
        
        val_result = validator.validate(template, fields)
        return val_result.to_dict()
    except Exception as e:
        print(f"Real-time validation failed: {e}")
        return {
            "score": 0.0,
            "overall_status": "Error",
            "field_results": {}
        }


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
