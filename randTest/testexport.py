# extract_receipt.py
# Usage: python extract_receipt.py /path/to/receipt.(pdf|png|jpg|jpeg|tiff)
# Outputs a JSON with the extracted fields to stdout.

import sys, os, re, json, io
from datetime import datetime
from dateutil import parser as dateparser

# --- Optional deps (install per README) ---
# - pdfplumber for text PDFs
# - pdf2image + poppler-utils to rasterize PDF pages
# - pytesseract + tesseract-ocr[-heb] for OCR
try:
    import pdfplumber
except Exception:
    pdfplumber = None

try:
    from pdf2image import convert_from_path
    HAVE_PDF2IMAGE = True
except Exception:
    HAVE_PDF2IMAGE = False

try:
    import pytesseract
    from PIL import Image
    HAVE_TESS = True
except Exception:
    HAVE_TESS = False


# -----------------------------
# Heuristics & Regex Patterns
# -----------------------------

CURRENCY = r'(?:₪|ILS|NIS|\$|USD|EUR|€)'
NUM = r'(?:\d{1,3}(?:[,\s]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2})?)'

RE_EMAIL = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
RE_PHONE = re.compile(r'\b(?:\+?\d{1,3}[-\s]?)?(?:0\d|[1-9]\d)(?:[-\s]?\d){7,}\b')
RE_URL = re.compile(r'\b(?:https?://)?(?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:/[^\s]*)?\b')

# Israeli Business ID patterns (common tokens). Also keep generic 8-9 digits near tokens.
RE_BIZ_ID = re.compile(
    r'(?:(?:ח"?פ|ח\.פ\.|ע"?מ|ע\.מ\.|מס[\'"]? עוסק|מספר\s+עוסק|עוסק\s+מורשה)\s*[:\-]?\s*)?(\d{8,9})'
)

# Dates: 12/10/2025, 12-10-25, 2025-10-12, 12.10.2025, 12 Oct 2025 ...
RE_DATE = re.compile(
    r'\b(\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|\d{4}[./-]\d{1,2}[./-]\d{1,2}|'
    r'\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}|'
    r'\d{1,2}\s+[א-ת]{3,15}\s+\d{2,4})\b'
)

# Times: 14:03, 14:03:22, 2:03 PM
RE_TIME = re.compile(r'\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)?)\b')

# Totals: English + Hebrew cues; capture last number on line or in vicinity
RE_TOTAL_LINE = re.compile(
    rf'(?i)\b(total|grand\s*total|amount\s*(due|paid)?|balance\s*due|סה"?כ|סהכ|לסכום|לתשלום|סך\s*הכל)\b.*?({CURRENCY}?\s*{NUM})'
)

RE_VAT_LINE = re.compile(r'(?i)\b(vat|tax|מע"מ|מ"?ע)\b.*?(' + NUM + r')')

# Number of payments / installments
RE_PAYMENTS = re.compile(r'(?i)\b(payments?|installments?|תשלומים)\b[:\s\-]*([0-9]{1,3})')
# Last 4 digits of card
RE_CARD_LAST4 = re.compile(r'(?i)\b(?:card|visa|master|amex|discover|כרטיס)\b.*?(\*{0,4}|x{0,4}|X{0,4}|#*|-*)\s*([0-9]{4})\b')

# Items (very heuristic): lines that look like "name ... price"
RE_ITEM_LINE = re.compile(r'^[^\n]*?\b(' + NUM + r')\b[^\n]*$', re.MULTILINE)

# Common header words to skip when guessing vendor name
HEADER_WORDS = set("""
invoice tax receipt paid vendor customer cashier store shop supermarket order number ref
חשבון קבלה מסמך מס חשבונית חשבונית מס קבלה ספק לקוח קופה חנות מגה סופר מרקט הזמנה
""".split())

# Address hints (English + Hebrew)
RE_ADDRESS_HINT = re.compile(r'(?i)\b(st(?:\.|reet)?|ave(?:\.|nue)?|road|rd\.|blvd|way|strasse|str\.|suite|apt|קרן|רח\'|רחוב|דרך|שד\')\b')


# -----------------------------
# Text Extraction
# -----------------------------

def extract_text_any(path, ocr_lang='eng+heb'):
    """
    Returns (text, source_type) where source_type in:
    - 'digital_pdf' (text from pdfplumber)
    - 'scanned_pdf' (OCR result from PDF pages)
    - 'image_scan' (OCR result from image file)
    """
    ext = os.path.splitext(path.lower())[1]
    if ext == '.pdf':
        # Try text mode first
        if pdfplumber is not None:
            try:
                text_pages = []
                with pdfplumber.open(path) as pdf:
                    for p in pdf.pages:
                        t = p.extract_text() or ''
                        text_pages.append(t)
                text = "\n".join(text_pages).strip()
                # If we got meaningful text, call it digital
                if len(text.replace('\n', '').strip()) > 50:
                    return text, 'digital_pdf'
            except Exception:
                pass

        # Fallback to OCR for PDF
        if HAVE_PDF2IMAGE and HAVE_TESS:
            try:
                images = convert_from_path(path, dpi=300)
                ocr_texts = []
                for img in images:
                    ocr_texts.append(pytesseract.image_to_string(img, lang=ocr_lang))
                text = "\n".join(ocr_texts).strip()
                if text:
                    return text, 'scanned_pdf'
            except Exception:
                pass

        return "", 'digital_pdf'  # default if all fails

    # Images
    if ext in ('.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp'):
        if not HAVE_TESS:
            return "", 'image_scan'
        try:
            img = Image.open(path)
            text = pytesseract.image_to_string(img, lang=ocr_lang)
            return text.strip(), 'image_scan'
        except Exception:
            return "", 'image_scan'

    return "", 'unknown'


# -----------------------------
# Parsing Helpers
# -----------------------------

def safe_parse_date(s):
    try:
        # dayfirst helps with dd/mm/yyyy common in IL
        dt = dateparser.parse(s, dayfirst=True, fuzzy=True)
        if dt:
            return dt.strftime('%Y-%m-%d')
    except Exception:
        return None

def normalize_amount(raw):
    if not raw:
        return None
    x = raw.strip()
    x = re.sub(r'[^\d,.\-]', '', x)
    # If both comma and dot present, assume comma is thousand sep
    if ',' in x and '.' in x:
        x = x.replace(',', '')
    else:
        # If comma but no dot, assume comma is decimal sep
        if ',' in x and '.' not in x:
            x = x.replace(',', '.')
    try:
        return float(x)
    except Exception:
        return None

def top_candidate_lines(text, limit=8):
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # Return first few non-empty lines
    return lines[:limit]

def guess_vendor_name(text):
    # Heuristic: from the first 8 non-empty lines, pick the longest line that:
    # - has letters
    # - not mostly numbers
    # - not a known header word
    # Prefer lines with no email/phone/url
    cands = []
    for ln in top_candidate_lines(text, limit=10):
        if RE_EMAIL.search(ln) or RE_PHONE.search(ln) or RE_URL.search(ln):
            continue
        alpha = sum(ch.isalpha() for ch in ln)
        digit = sum(ch.isdigit() for ch in ln)
        tokens = re.findall(r'[^\W_]+', ln, flags=re.UNICODE)
        lower_tokens = [t.lower() for t in tokens]
        if alpha >= 3 and alpha > digit and not (set(lower_tokens) & HEADER_WORDS):
            cands.append(ln)
    # Fallback: look for line with words like LTD/בע"מ
    if not cands:
        for ln in top_candidate_lines(text, limit=12):
            if re.search(r'(?i)\b(ltd|inc|gmbh|s\.?a\.?|בע"?מ|בע\.מ\.)\b', ln):
                cands.append(ln)
    return cands[0] if cands else None

def count_itemish_lines(text):
    # Count lines that look like "something ... price"
    lines = text.splitlines()
    count = 0
    for ln in lines:
        if len(ln.strip()) < 3: 
            continue
        if RE_ITEM_LINE.search(ln):
            # Exclude obvious header/footer lines
            if re.search(r'(?i)\b(total|subtotal|vat|tax|cash|change|payment|סה"?כ|מע"מ)\b', ln):
                continue
            count += 1
    return count if count > 0 else None

def detect_receipt_type(source_type, text):
    # Map to requested: digital / print / handwritten (heuristic)
    if source_type == 'digital_pdf':
        return 'digital'
    if source_type in ('scanned_pdf', 'image_scan'):
        # crude heuristic: many short lines & low punctuation => maybe handwritten
        words = re.findall(r'\w+', text)
        avg = (sum(len(w) for w in words)/len(words)) if words else 0
        if avg < 3.2 and len(words) < 80:
            return 'handwritten'
        return 'print'
    return 'unknown'

def resolved_status(text):
    # True if it looks like a successful paid receipt
    if re.search(r'(?i)\b(paid|approved|sale|completed|success|אושר|שולם)\b', text):
        return True
    if re.search(r'(?i)\b(declined|void|canceled|בוטל|נדחה)\b', text):
        return False
    return None


# -----------------------------
# Main Parse
# -----------------------------

def parse_receipt_text(text):
    out = {
        # Supplier section
        "supplier": {
            "name": None,
            "address": None,
            "email": None,
            "phone_number": None,
            "website": None,
            "business_id": None
        },
        # Receipt section
        "receipt": {
            "total_pay": None,
            "number_of_items": None,
            "date": None,
            "time": None,
            "supplier": None,  # duplicate of supplier.name if present
            "number_of_payments": None,
            "last4_card": None,
            "resolved": None,
            "type": None
        },
        "raw_text": text
    }

    # Emails / websites / phones (take first found)
    m = RE_EMAIL.search(text)
    if m: out["supplier"]["email"] = m.group(0)

    m = RE_URL.search(text)
    if m: out["supplier"]["website"] = m.group(0)

    m = RE_PHONE.search(text)
    if m: out["supplier"]["phone_number"] = m.group(0)

    # Business ID
    m_all = list(RE_BIZ_ID.finditer(text))
    if m_all:
        out["supplier"]["business_id"] = m_all[0].group(1)

    # Address guess: look for a line with address hint
    addr = None
    for ln in text.splitlines():
        if RE_ADDRESS_HINT.search(ln):
            addr = ln.strip()
            break
    out["supplier"]["address"] = addr

    # Vendor name
    vendor = guess_vendor_name(text)
    out["supplier"]["name"] = vendor
    out["receipt"]["supplier"] = vendor

    # Total
    totals = list(RE_TOTAL_LINE.finditer(text))
    if totals:
        raw_total = totals[-1].group(3)  # last occurrence
        out["receipt"]["total_pay"] = normalize_amount(raw_total)

    # VAT (optional): Not requested, but could help validation — left out for now

    # Date
    dates = RE_DATE.findall(text)
    parsed_date = None
    for d in dates:
        parsed_date = safe_parse_date(d)
        if parsed_date:
            break
    out["receipt"]["date"] = parsed_date

    # Time
    m = RE_TIME.search(text)
    if m:
        out["receipt"]["time"] = m.group(1).strip()

    # Number of payments
    m = RE_PAYMENTS.search(text)
    if m:
        try:
            out["receipt"]["number_of_payments"] = int(m.group(2))
        except Exception:
            pass

    # Card last 4
    m_all = list(RE_CARD_LAST4.finditer(text))
    if m_all:
        out["receipt"]["last4_card"] = m_all[-1].group(2)

    # Number of items (heuristic)
    out["receipt"]["number_of_items"] = count_itemish_lines(text)

    # Resolved?
    out["receipt"]["resolved"] = resolved_status(text)

    return out


# -----------------------------
# CLI
# -----------------------------

def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_receipt.py /path/to/receipt.(pdf|png|jpg|jpeg|tiff)")
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(json.dumps({"error": f"File not found: {path}"}))
        sys.exit(2)

    text, source_type = extract_text_any(path, ocr_lang='eng+heb')
    parsed = parse_receipt_text(text or "")
    parsed["receipt"]["type"] = detect_receipt_type(source_type, text or "")

    print(json.dumps(parsed, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

