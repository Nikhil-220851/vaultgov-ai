import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os
import sys
import traceback
import time

pytesseract.pytesseract.tesseract_cmd = os.getenv(
    "TESSERACT_CMD", 
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)

print("===================================")
print("PDF SERVICE LOADED")
print("===================================")
print(f"Absolute path: {os.path.abspath(__file__)}")
print(f"Current working directory: {os.getcwd()}")
print(f"Python executable: {sys.executable}")
print(f"Tesseract executable: {pytesseract.pytesseract.tesseract_cmd}")
print(f"Tesseract exists: {os.path.exists(pytesseract.pytesseract.tesseract_cmd)}")
print(f"PyMuPDF version: {fitz.version[0]}")
try:
    print(f"Pytesseract version: {pytesseract.get_tesseract_version()}")
except Exception:
    traceback.print_exc()
print(f"Loaded from: {__file__}")
print(f"Configured executable: {pytesseract.pytesseract.tesseract_cmd}")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extract text from a PDF file. 
    It first tries to extract text digitally. If the extracted text is too short,
    it assumes the PDF is scanned and falls back to OCR.
    """
    t0 = time.time()
    t_digital = 0
    t_ocr = 0
    
    file_size = len(file_bytes)
    try:
        # Open the PDF from bytes
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        # Check if it's password protected or corrupted
        error_str = str(e).lower()
        if "password" in error_str or "encrypted" in error_str:
            print("ValueError: This PDF is password protected.")
            traceback.print_exc()
            raise ValueError("This PDF is password protected.")
        print("ValueError: Unable to read this PDF.")
        traceback.print_exc()
        raise ValueError("Unable to read this PDF.")

    if doc.needs_pass:
        doc.close()
        print("ValueError: This PDF is password protected.")
        traceback.print_stack()
        raise ValueError("This PDF is password protected.")

    print("===================================")
    print(f"Number of pages: {len(doc)}")
    print(f"PDF encrypted?: {doc.is_encrypted}")
    print(f"PDF metadata: {doc.metadata}")
    print("===================================")

    extracted_text = []
    
    # Pass 1: Try digital extraction
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        extracted_text.append(text)
    
    full_text = "\n".join(extracted_text).strip()
    print(f"Digital text length: {len(full_text)}")
    
    t_digital_end = time.time()
    t_digital = t_digital_end - t0
    
    # If we got meaningful text, return it
    if len(full_text) > 50:
        page_count = len(doc)   # capture BEFORE close — accessing len(doc) after close raises RuntimeError
        doc.close()
        t_total = time.time() - t0
        print("\n===== PDF OCR =====")
        print(f"Size:    {file_size / 1024:.1f} KB")
        print(f"Pages:   {page_count}")
        print(f"Digital: {t_digital:.2f}s  (text extraction, no OCR needed)")
        print(f"OCR:     0.00s")
        print(f"Total:   {t_total:.2f}s")
        print("==================\n")
        return full_text
        
    # Pass 2: Scanned PDF fallback using PyMuPDF to render image + pytesseract
    ocr_text = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        # Render page to an image (pixmap) with a reasonable resolution
        zoom_matrix = fitz.Matrix(2.0, 2.0)  # 2x zoom for better OCR
        pix = page.get_pixmap(matrix=zoom_matrix)
        
        # Convert pixmap to PIL Image
        img_bytes = pix.tobytes("png")
        img = Image.open(io.BytesIO(img_bytes))
        
        # Add debug logs before OCR
        print(f"Page number: {page_num}")
        print(f"Image width: {img.width}")
        print(f"Image height: {img.height}")
        print(f"Image mode: {img.mode}")
        print(f"OCR language: eng")
        
        # Run OCR
        try:
            text = pytesseract.image_to_string(img)
            print(f"Characters extracted: {len(text)}")
            ocr_text.append(text)
        except Exception as e:
            # Replace generic exception handling with full traceback
            print(f"OCR failed for page {page_num}:")
            traceback.print_exc()
            raise ValueError(f"OCR failed on page {page_num}. Exception: {str(e)}") from e
            
    page_count = len(doc)   # capture BEFORE close — accessing len(doc) after close raises RuntimeError
    doc.close()
    
    t_ocr_end = time.time()
    t_ocr = t_ocr_end - t_digital_end
    
    final_text = "\n".join(ocr_text).strip()
    print(f"OCR text length: {len(final_text)}")
    
    t_total = time.time() - t0
    print("\n===== PDF OCR =====")
    print(f"Size:    {file_size / 1024:.1f} KB")
    print(f"Pages:   {page_count}")
    print(f"Digital: {t_digital:.2f}s  (no usable text, fell back to OCR)")
    print(f"OCR:     {t_ocr:.2f}s")
    print(f"Total:   {t_total:.2f}s")
    print("==================\n")
    
    if not final_text:
        print("ValueError: No readable text found.")
        traceback.print_stack()
        raise ValueError("No readable text found.")
        
    return final_text
