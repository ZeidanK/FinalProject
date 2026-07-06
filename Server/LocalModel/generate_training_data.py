"""
generate_training_data.py
=========================
Bootstraps NER training data from invoices already extracted by Gemini/Ollama.

Input  — a JSONL file where each line is a JSON object with:
  - "text"           : the raw extracted text of the invoice
  - "vendor_name"    : (optional) extracted vendor name
  - "invoice_number" : (optional) extracted invoice number
  - "invoice_date"   : (optional) extracted invoice date string
  - "due_date"       : (optional) extracted due date string
  - "total_amount"   : (optional) extracted total amount string
  - "subtotal"       : (optional) extracted subtotal string
  - "vat_amount"     : (optional) extracted VAT/GST amount string
  - "vat_rate"       : (optional) extracted VAT rate string (e.g. "17")
  - "vendor_tax_id"  : (optional) extracted tax/ABN ID string
  - "currency"       : (optional) currency code (e.g. "USD")

Output — a JSONL file ready for train.py, where each line is:
  { "text": "...", "entities": [{"start": N, "end": N, "label": "LABEL"}, ...] }

Usage:
  python generate_training_data.py --input gemini_extractions.jsonl --output invoices.jsonl

How to get the input data:
  Export your existing Gemini/Ollama-extracted invoice records from the DB or
  save them directly from the API response logs. The minimum required field is
  "text" (the raw invoice text). All other fields that ARE present will be
  located in the text and turned into entity spans.

Tips:
  - Run this once to generate initial training data.
  - After fine-tuning, correct any wrong spans manually and re-train.
  - Each new batch of Gemini extractions = more free training data.
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Map from input JSON field name → NER label name (must match train.py BIO_LABELS)
FIELD_LABEL_MAP = {
    "vendor_name":    "VENDOR",
    "invoice_number": "INVOICE_NUM",
    "invoice_date":   "INVOICE_DATE",
    "due_date":       "DUE_DATE",
    "total_amount":   "TOTAL",
    "subtotal":       "SUBTOTAL",
    "vat_amount":     "TAX_AMT",
    "vat_rate":       "TAX_RATE",
    "vendor_tax_id":  "TAX_ID",
    "currency":       "CURRENCY",
}


def find_spans(text: str, value: str) -> list[tuple[int, int]]:
    """
    Return all (start, end) char positions where `value` appears in `text`,
    case-insensitively.  Uses word-boundary anchors for short values (< 6
    chars) so that "17" does not match inside "510751878" or "17/04/25".
    """
    if not value or len(value.strip()) < 2:
        return []

    escaped = re.escape(value.strip())

    # Use word boundaries for short values to avoid substring false-positives
    # e.g. vat_rate "17" matching inside dates, phone numbers, tax IDs
    if len(value.strip()) < 6:
        pattern = r'(?<![\w.])' + escaped + r'(?![\w.])'
    else:
        pattern = escaped

    spans = []
    for m in re.finditer(pattern, text, re.IGNORECASE):
        spans.append((m.start(), m.end()))
    return spans


def process_record(obj: dict) -> dict | None:
    """
    Convert one input record to the train.py JSONL format.
    Returns None if no text is present.
    """
    text: str = obj.get("text", "").strip()
    if not text:
        return None

    entities: list[dict] = []
    seen_ranges: list[tuple[int, int]] = []   # avoid overlapping spans

    for field, label in FIELD_LABEL_MAP.items():
        raw_value = obj.get(field)
        if raw_value is None:
            continue
        value = str(raw_value).strip()
        if not value or value.lower() in ("null", "none", ""):
            continue

        spans = find_spans(text, value)
        if not spans:
            continue

        # Use the first non-overlapping occurrence
        for (start, end) in spans:
            overlaps = any(
                not (end <= s or start >= e) for (s, e) in seen_ranges
            )
            if not overlaps:
                entities.append({"start": start, "end": end, "label": label})
                seen_ranges.append((start, end))
                break   # one span per field is enough

    return {"text": text, "entities": entities}


def main():
    parser = argparse.ArgumentParser(
        description="Generate NER training data from Gemini-extracted invoices"
    )
    parser.add_argument(
        "--input",  required=True,
        help="Input JSONL file (Gemini/Ollama extractions)"
    )
    parser.add_argument(
        "--output", required=True,
        help="Output JSONL file for train.py"
    )
    parser.add_argument(
        "--min-entities", type=int, default=1,
        help="Skip records with fewer than N entity spans (default: 1)"
    )
    args = parser.parse_args()

    in_path  = Path(args.input)
    out_path = Path(args.output)

    if not in_path.exists():
        print(f"[ERROR] Input file not found: {in_path}", file=sys.stderr)
        sys.exit(1)

    written = 0
    skipped = 0

    with open(in_path, encoding="utf-8") as fin, \
         open(out_path, "w", encoding="utf-8") as fout:

        for lineno, line in enumerate(fin, 1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as exc:
                print(f"[WARN] Line {lineno}: JSON parse error — {exc}")
                skipped += 1
                continue

            record = process_record(obj)
            if record is None or len(record["entities"]) < args.min_entities:
                skipped += 1
                continue

            fout.write(json.dumps(record, ensure_ascii=False) + "\n")
            written += 1

    print(f"\nDone.")
    print(f"  Written : {written} training examples → {out_path}")
    print(f"  Skipped : {skipped} records (no text or too few entities)")
    print(f"\nNext step:")
    print(f"  python train.py --data {out_path} --epochs 5 --output ./model")


if __name__ == "__main__":
    main()
