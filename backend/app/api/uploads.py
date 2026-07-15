from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.services import cloudinary_service

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

@router.post("/image")
async def upload_image(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid MIME type. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}"
        )
    
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds 10MB limit."
        )
    
    try:
        res = cloudinary_service.upload_image(file_bytes, folder="documents")
        return {
            "secure_url": res.get("secure_url"),
            "public_id": res.get("public_id"),
            "width": res.get("width"),
            "height": res.get("height"),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloudinary upload failed: {str(e)}"
        )
