"""
uploads.py
==========
POST /api/v1/uploads/image

Accepts image files (jpg, jpeg, png, webp, heic) only.
Runs the full image intelligence pipeline:
  1. MIME validation (fast-fail before reading bytes)
  2. Size check
  3. Cloudinary upload
  4. Pillow open + HEIC support
  5. Tesseract OCR
  6. Template detection (keyword heuristics)
  7. Gemini structured extraction
  8. Return Cloudinary URL + OCR text + structured data

Tesseract path is resolved in priority order:
  1. TESSERACT_CMD environment variable
  2. System PATH (shutil.which)
  3. Hardcoded Windows default
"""
import pytesseract
import io
import os
import shutil
import time
import traceback

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services import cloudinary_service

pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_CMD",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)
router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

# ── Tesseract path resolution ───────────────────────────────────────────────────
def _resolve_tesseract_cmd() -> str:
    """Resolve Tesseract binary path in priority order."""
    # 1. Explicit env var
    from_env = os.environ.get("TESSERACT_CMD", "").strip()
    if from_env and os.path.isfile(from_env):
        return from_env

    # 2. System PATH
    on_path = shutil.which("tesseract")
    if on_path:
        return on_path

    # 3. Windows default install location
    win_default = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    if os.path.isfile(win_default):
        return win_default

    return "tesseract"  # final fallback — will fail with clear error at runtime


_TESSERACT_CMD = _resolve_tesseract_cmd()
print(f"[uploads.py] Tesseract resolved to: {_TESSERACT_CMD!r}")

# ── Startup-time credential check ──────────────────────────────────────────────
if not cloudinary_service.CLOUDINARY_API_KEY or not cloudinary_service.CLOUDINARY_API_SECRET:
    print(
        "[uploads.py] WARNING: CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET is empty. "
        "POST /api/v1/uploads/image will return HTTP 500 until these are set in backend/.env."
    )


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    # ── Step 0: MIME guard (fast-fail before reading bytes) ────────────────────
    print(
        f"[uploads.py] Incoming: filename={file.filename!r}, "
        f"content_type={file.content_type!r}"
    )

    if not file.content_type or not file.content_type.startswith("image/"):
        print(f"[uploads.py] REJECTED — non-image content_type: {file.content_type!r}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are accepted by this endpoint. "
                   f"Received: {file.content_type}",
        )

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type '{file.content_type}'. "
                   f"Allowed: {', '.join(ALLOWED_MIME_TYPES)}",
        )

    # ── Step 1: Read bytes + size check ───────────────────────────────────────
    file_bytes = await file.read()
    file_size = len(file_bytes)
    print(
        f"[uploads.py] File read: filename={file.filename!r}, "
        f"size={file_size} bytes, content_type={file.content_type!r}"
    )

    if file_size > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size {file_size // 1024}KB exceeds 10MB limit.",
        )

    # ── Step 2: Cloudinary upload ──────────────────────────────────────────────
    try:
        res = cloudinary_service.upload_image(file_bytes, folder="documents")
        print(f"[uploads.py] Cloudinary OK: public_id={res.get('public_id')!r}")
    except Exception as e:
        print(f"[uploads.py] Cloudinary FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloudinary upload failed: {type(e).__name__}: {e}",
        )

    # ── Step 3: Image intelligence pipeline ────────────────────────────────────
    from PIL import Image
    import pytesseract
    from app.services.document_intelligence.document_intelligence_service import DocumentIntelligenceService
    from app.services.document_intelligence.models import ExtractionRequest

    ocr_text = ""
    structured_data = None
    document_intelligence_success = False
    doc_type = "unknown"

    print("===== IMAGE DOCUMENT INTELLIGENCE =====")

    t_start_total = time.time()
    # ── Step 3a: Open image ────────────────────────────────────────────────────
    try:
        try:
            import pillow_heif
            pillow_heif.register_heif_opener()
        except ImportError:
            print("[uploads.py] WARNING: pillow-heif not installed. HEIC uploads will fail.")

        image = Image.open(io.BytesIO(file_bytes))
        if image.mode != "RGB":
            image = image.convert("RGB")
        print(f"Image opened: mode={image.mode}, size={image.size}")
    except Exception as e:
        print(f"PIL Image open FAILED: {type(e).__name__}: {e}")
        traceback.print_exc()
        print("=======================================")
        return _build_response(res, ocr_text, doc_type, "Unknown", "Unknown", structured_data, document_intelligence_success)

    # ── Step 3b: Tesseract OCR ────────────────────────────────────────────────
    try:
        tess_cmd = pytesseract.pytesseract.tesseract_cmd
        print(f"[OCR] Configured executable: {tess_cmd}")
        exists = os.path.isfile(tess_cmd)
        print(f"[OCR] Executable exists: {exists}")
        
        if not exists:
            return {
                "success": False,
                "message": "Tesseract OCR is not installed or configured.",
                "details": "Executable not found."
            }
            
        try:
            print(f"[OCR] Tesseract version: {pytesseract.get_tesseract_version()}")
        except Exception as v_err:
            print(f"[OCR] Could not fetch version: {v_err}")

        print("OCR started")
        t_ocr_start = time.time()
        ocr_text = pytesseract.image_to_string(image)
        t_ocr_end = time.time()
        print("OCR finished")
        print("OCR text:\n")
        print(ocr_text[:500])
    except Exception as e:
        print(f"OCR FAILED [{type(e).__name__}]: {e}")
        traceback.print_exc()
        print("=======================================")
        return {
            "success": False,
            "message": "OCR engine is unavailable.",
            "error": "Tesseract is not installed." if "tesseract is not installed" in str(e).lower() else str(e)
        }

    # ── Step 3c: Template detection ────────────────────────────────────────────
    print("Running TemplateMatcher...")
    from app.services.document_intelligence.template_matcher import TemplateMatcher
    
    matcher = TemplateMatcher()
    match_result = matcher.match(ocr_text)
    doc_type = match_result["template_id"]
    display_name = match_result["display_name"]
    category = match_result["category"]

    if doc_type != "unknown":
        print(f"Detected template:\n{doc_type} (Score: {match_result['confidence_score']}%)\nBuilding prompt...\nCalling Gemini...")
    else:
        print("No template matched\nUsing generic Gemini extraction\nCalling Gemini...")

    # ── Step 3d: Gemini extraction ─────────────────────────────────────────────
    try:
        t_gemini_start = time.time()
        svc = DocumentIntelligenceService()
        
        if doc_type != "unknown":
            req = ExtractionRequest(document_type=doc_type, raw_ocr_text=ocr_text)
            response = await svc.extract(req)
        else:
            prompt = f"""You are a document understanding AI.
Identify the document type.
Extract every meaningful field.
If a field does not exist, return null.
Return ONLY valid JSON.
Schema:
{{
    "document_type": "...",
    "fields": {{
        "<field_name>": {{
            "value": "<extracted string or null>",
            "confidence": 0.9
        }}
    }},
    "warnings": []
}}

## OCR TEXT
{ocr_text}
"""
            raw_response = await svc._engine.extract(prompt)
            from app.services.document_intelligence.models import DocumentTemplate
            generic_template = DocumentTemplate(
                document_type="unknown",
                display_name="Unknown Document",
                description="Unknown",
                required_fields=[],
                optional_fields=[]
            )
            response = svc._response_parser.parse(raw_response, generic_template)

        t_gemini_end = time.time()
        print("Gemini response received")
        print("Parsing JSON...")
        
        structured_data = response.model_dump().get("fields", {})
        doc_type = response.document_type
        
        document_intelligence_success = True
        print("Extraction success")
        print("Returning response")

    except Exception as e:
        print(f"Gemini extraction FAILED [{type(e).__name__}]: {e}")
        traceback.print_exc()

    print("=======================================")

    processing_time = time.time() - t_start_total
    return _build_response(res, ocr_text, doc_type, display_name, category, structured_data, document_intelligence_success, processing_time)


def _build_response(
    cloudinary_res: dict,
    ocr_text: str,
    doc_type: str,
    display_name: str,
    category: str,
    structured_data,
    document_intelligence_success: bool,
    processing_time: float = 0.0,
) -> dict:
    # Format structured fields to flat key: value if structured_data is present
    flat_structured = {}
    confidence = 0.0
    validation_result = None

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
        else:
            confidence = 0.9 if document_intelligence_success else 0.0
            
        # Run ValidationEngine
        try:
            from app.services.document_intelligence.template_loader import TemplateLoader
            from app.services.document_intelligence.validation_engine import ValidationEngine
            
            loader = TemplateLoader()
            template = loader.load(doc_type)
            validator = ValidationEngine()
            
            val_result = validator.validate(template, structured_data)
            validation_result = val_result.to_dict()
        except Exception as e:
            print(f"Validation Engine failed: {e}")
            validation_result = {
                "score": 0.0,
                "overall_status": "Error",
                "field_results": {}
            }

    return {
        "secure_url": cloudinary_res.get("secure_url"),
        "public_id": cloudinary_res.get("public_id"),
        "width": cloudinary_res.get("width"),
        "height": cloudinary_res.get("height"),
        "document_type": doc_type,
        "display_name": display_name,
        "category": category,
        "confidence": confidence,
        "extracted_text": ocr_text,
        "ocr_text": ocr_text,
        "structured_data": flat_structured if flat_structured else None,
        "validation": validation_result,
        "document_intelligence_success": document_intelligence_success,
        "processing_time_seconds": round(processing_time, 2),
    }
