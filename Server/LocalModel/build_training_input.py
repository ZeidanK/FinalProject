"""
build_training_input.py
=======================
Reads the existing invoice DB export and the actual PDF files on disk,
extracts raw text from each PDF, then writes gemini_extractions.jsonl —
the input format expected by generate_training_data.py.

Run this ONCE from Server/LocalModel/:
  pip install pypdf          (already in requirements.txt)
  python build_training_input.py

Then continue with:
  python generate_training_data.py --input gemini_extractions.jsonl --output invoices.jsonl
  python train.py --data invoices.jsonl --epochs 5 --output ./model
"""

import json
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    print("[ERROR] pypdf not installed. Run:  pip install pypdf")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths  (relative to Server/LocalModel/ where this script lives)
# ---------------------------------------------------------------------------

SCRIPT_DIR   = Path(__file__).parent                          # Server/LocalModel/
DB_EXPORT    = SCRIPT_DIR / "../DAL/current invoices in the database.json"
WWWROOT      = SCRIPT_DIR / "../wwwroot"
OUTPUT_FILE  = SCRIPT_DIR / "gemini_extractions.jsonl"


# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Return all text from a PDF, joining pages with newlines."""
    try:
        reader = PdfReader(str(pdf_path))
        pages = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages.append(text)
        return "\n".join(pages).strip()
    except Exception as exc:
        print(f"  [WARN] Could not read {pdf_path.name}: {exc}")
        return ""


# ---------------------------------------------------------------------------
# Field mapping: DB column → generate_training_data.py key
# ---------------------------------------------------------------------------

def invoice_to_extraction_record(inv: dict, raw_text: str) -> dict:
    """Map one DB invoice row + raw text to the gemini_extractions format."""

    def fmt_date(val):
        """Trim to YYYY-MM-DD if value looks like an ISO datetime."""
        if val and isinstance(val, str) and "T" in val:
            return val.split("T")[0]
        return val

    def fmt_decimal(val):
        """Return as string without trailing .00 noise, or None."""
        if val is None:
            return None
        try:
            f = float(val)
            # Return as plain number string so span-search finds it in text
            return f"{f:g}"
        except (TypeError, ValueError):
            return str(val)

    return {
        "text":           raw_text,
        "vendor_name":    inv.get("vendor_name"),
        "invoice_number": inv.get("invoice_number"),
        "invoice_date":   fmt_date(inv.get("invoice_date")),
        "due_date":       fmt_date(inv.get("due_date")),
        "total_amount":   fmt_decimal(inv.get("total_amount")),
        "subtotal":       fmt_decimal(inv.get("subtotal")),
        "vat_amount":     fmt_decimal(inv.get("vat_amount")),
        "vat_rate":       fmt_decimal(inv.get("vat_rate")),
        "vendor_tax_id":  inv.get("vendor_tax_id"),
        "currency":       inv.get("currency"),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    db_path = DB_EXPORT.resolve()
    if not db_path.exists():
        print(f"[ERROR] DB export not found: {db_path}")
        print("  Expected: Server/DAL/current invoices in the database.json")
        sys.exit(1)

    with open(db_path, encoding="utf-8") as f:
        invoices: list[dict] = json.load(f)

    print(f"Found {len(invoices)} invoices in DB export.\n")

    written  = 0
    skipped  = 0

    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        for inv in invoices:
            inv_id      = inv.get("id")
            file_path   = inv.get("file_path", "")
            file_name   = inv.get("file_original_name", f"invoice_{inv_id}.pdf")

            if not file_path:
                print(f"  [SKIP] Invoice {inv_id} — no file_path in DB record.")
                skipped += 1
                continue

            pdf_path = (WWWROOT / file_path).resolve()

            if not pdf_path.exists():
                print(f"  [SKIP] Invoice {inv_id} ({file_name}) — PDF not found at {pdf_path}")
                skipped += 1
                continue

            print(f"  Processing invoice {inv_id}: {file_name} ...")
            raw_text = extract_text_from_pdf(pdf_path)

            if not raw_text:
                print(f"  [SKIP] Invoice {inv_id} — could not extract any text from PDF.")
                skipped += 1
                continue

            record = invoice_to_extraction_record(inv, raw_text)
            out.write(json.dumps(record, ensure_ascii=False) + "\n")
            written += 1

    print(f"\nDone.")
    print(f"  Written : {written} records → {OUTPUT_FILE}")
    print(f"  Skipped : {skipped} records")

    if written == 0:
        print("\n[ERROR] No records written. Check that PDF files exist under Server/wwwroot/uploads/")
        sys.exit(1)

    print(f"\nNext steps:")
    print(f"  python generate_training_data.py --input gemini_extractions.jsonl --output invoices.jsonl")
    print(f"  python train.py --data invoices.jsonl --epochs 5 --output ./model")


if __name__ == "__main__":
    main()
