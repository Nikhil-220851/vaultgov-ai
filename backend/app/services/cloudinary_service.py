import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# We expect the user to provide these via .env
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "vaultgov-ai")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

def upload_image(file_bytes: bytes, folder: str = "documents"):
    """
    Uploads raw file bytes to Cloudinary.
    Returns the JSON dictionary response from Cloudinary.
    """
    if not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
        # Fallback error for dev environments missing secrets
        raise ValueError("Cloudinary API credentials missing. Check backend/.env.")
        
    return cloudinary.uploader.upload(file_bytes, folder=folder)

def delete_image(public_id: str):
    """
    Deletes an asset from Cloudinary using its public_id.
    """
    if not public_id or not CLOUDINARY_API_KEY or not CLOUDINARY_API_SECRET:
        return None
        
    return cloudinary.uploader.destroy(public_id)
