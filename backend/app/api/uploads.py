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

import io
import os
import shutil
import time
import traceback

from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services import cloudinary_service

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
        return _build_response(res, ocr_text, doc_type, structured_data, document_intelligence_success)

    # ── Step 3b: Tesseract OCR ────────────────────────────────────────────────
    try:
        pytesseract.pytesseract.tesseract_cmd = _TESSERACT_CMD
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
        return _build_response(res, ocr_text, doc_type, structured_data, document_intelligence_success)

    # ── Step 3c: Template detection ────────────────────────────────────────────
    print("Running template detector...")
    text_lower = ocr_text.lower()
    if "aadhaar" in text_lower or "uidai" in text_lower:
        doc_type = "aadhaar"
    elif "permanent account number" in text_lower or "income tax department" in text_lower:
        doc_type = "pan"
    elif "passport" in text_lower:
        doc_type = "passport"
    elif "driving licence" in text_lower or "driving license" in text_lower or "dl no" in text_lower:
        doc_type = "driving_license"

    if doc_type != "unknown":
        print(f"Detected template:\n{doc_type}\nBuilding prompt...\nCalling Gemini...")
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
    return _build_response(res, ocr_text, doc_type, structured_data, document_intelligence_success, processing_time)


def _build_response(
    cloudinary_res: dict,
    ocr_text: str,
    doc_type: str,
    structured_data,
    document_intelligence_success: bool,
    processing_time: float = 0.0,
) -> dict:
    display_names = {
        "aadhaar": "Aadhaar Card",
        "pan": "PAN Card",
        "passport": "Passport",
        "driving_license": "Driving Licence",
        "unknown": "Unknown Document",
    }
    categories = {
        "aadhaar": "Identity",
        "pan": "Identity",
        "passport": "Identity",
        "driving_license": "Identity",
        "unknown": "Other",
    }
    
    # Format structured fields to flat key: value if structured_data is present
    flat_structured = {}
    confidence = 0.0
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

    return {
        "secure_url": cloudinary_res.get("secure_url"),
        "public_id": cloudinary_res.get("public_id"),
        "width": cloudinary_res.get("width"),
        "height": cloudinary_res.get("height"),
        "document_type": doc_type,
        "display_name": display_names.get(doc_type, "Unknown Document"),
        "category": categories.get(doc_type, "Other"),
        "confidence": confidence,
        "extracted_text": ocr_text,
        "ocr_text": ocr_text,
        "structured_data": flat_structured,
        "document_intelligence_success": document_intelligence_success,
        "processing_time": round(processing_time, 2),
    }
