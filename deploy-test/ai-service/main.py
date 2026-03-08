from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
from typing import Optional
import re

# Try to import OCR libraries
try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("⚠️  Warning: pytesseract or Pillow not available. Using mock OCR.")

try:
    from pdf2image import convert_from_bytes
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("⚠️  Warning: pdf2image not available. PDF OCR will use mock data.")

app = FastAPI(title="AI OCR Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ExtractionRequest(BaseModel):
    file_data: str  # Base64 encoded file
    filename: str
    mimetype: str

class ExtractionResponse(BaseModel):
    text: str
    confidence: Optional[float] = None
    method: str

def extract_text_from_image(image_bytes: bytes) -> str:
    """Extract text from image using OCR"""
    if not OCR_AVAILABLE:
        return mock_ocr_text()
    
    try:
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return mock_ocr_text()

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract text from PDF using OCR"""
    if not PDF_AVAILABLE:
        return mock_ocr_text()
    
    try:
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes)
        
        # Extract text from each page
        all_text = []
        for i, image in enumerate(images):
            if OCR_AVAILABLE:
                text = pytesseract.image_to_string(image)
                all_text.append(f"--- Page {i+1} ---\n{text}")
            else:
                all_text.append(mock_ocr_text())
        
        return "\n\n".join(all_text)
    except Exception as e:
        print(f"PDF OCR Error: {e}")
        return mock_ocr_text()

def mock_ocr_text() -> str:
    """Return mock OCR data when libraries aren't available"""
    return """INVOICE

ABC Suppliers Ltd
123 Business Street
London, UK

Invoice Number: INV-2024-001
Date: January 15, 2024
Due Date: February 15, 2024

Bill To:
Acme Corporation
456 Client Avenue
Manchester, UK

Description                 Quantity    Price       Total
Widget Professional           10        £50.00      £500.00
Service Package A              5        £100.00     £500.00
Consulting Hours              20        £75.00      £1,500.00

                                        Subtotal:   £2,500.00
                                        VAT (20%):  £500.00
                                        Total:      £3,000.00

Payment Terms: Net 30 days
Payment Reference: INV-2024-001

Thank you for your business!

---
(This is MOCK data - Tesseract OCR not installed)
"""

@app.get("/")
async def root():
    return {
        "service": "AI OCR Service",
        "version": "1.0.0",
        "status": "running",
        "ocr_available": OCR_AVAILABLE,
        "pdf_available": PDF_AVAILABLE
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "ocr_enabled": OCR_AVAILABLE,
        "pdf_enabled": PDF_AVAILABLE
    }

@app.post("/extract", response_model=ExtractionResponse)
async def extract_text(request: ExtractionRequest):
    """
    Extract text from uploaded file (image or PDF)
    """
    try:
        # Decode base64 file data
        file_bytes = base64.b64decode(request.file_data)
        
        # Determine file type and extract
        if request.mimetype == 'application/pdf':
            text = extract_text_from_pdf(file_bytes)
            method = "PDF OCR" if PDF_AVAILABLE else "Mock"
        elif request.mimetype in ['image/png', 'image/jpeg', 'image/jpg']:
            text = extract_text_from_image(file_bytes)
            method = "Image OCR" if OCR_AVAILABLE else "Mock"
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Calculate basic confidence (mock for now)
        confidence = 0.95 if (OCR_AVAILABLE or PDF_AVAILABLE) else 0.50
        
        return ExtractionResponse(
            text=text,
            confidence=confidence,
            method=method
        )
        
    except base64.binascii.Error:
        raise HTTPException(status_code=400, detail="Invalid base64 encoding")
    except Exception as e:
        print(f"Extraction error: {e}")
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
