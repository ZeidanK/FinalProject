"""
generate_training_data.py
=========================
Bootstraps NER training data from invoices already extracted by Gemini/Ollama
or from verified hybrid-audit JSONL records saved after user confirmation.

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
from collections import Counter
from pathlib import Path

from structured_extraction import EXTRA_ENTITY_LABELS, infer_extra_entities

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


def first_present(obj: dict, *keys: str):
    for key in keys:
        if key in obj:
            return obj.get(key)
    return None


def flatten_extraction_result(result: dict) -> dict:
    return {
        "vendor_name": first_present(result, "vendor_name", "vendorName"),
        "invoice_number": first_present(result, "invoice_number", "invoiceNumber"),
        "invoice_date": first_present(result, "invoice_date", "invoiceDate"),
        "due_date": first_present(result, "due_date", "dueDate"),
        "total_amount": first_present(result, "total_amount", "totalAmount"),
        "subtotal": first_present(result, "subtotal"),
        "vat_amount": first_present(result, "vat_amount", "vatAmount"),
        "vat_rate": first_present(result, "vat_rate", "vatRate"),
        "vendor_tax_id": first_present(result, "vendor_tax_id", "vendorTaxId"),
        "currency": first_present(result, "currency"),
        "last_four_digits_card": first_present(result, "last_four_digits_card", "lastFourDigitsCard"),
        "item_count": first_present(result, "item_count", "itemCount"),
        "payment_plan": first_present(result, "payment_plan", "paymentPlan"),
        "line_items": first_present(result, "line_items", "lineItems"),
    }


def normalize_input_record(obj: dict) -> dict:
    if not isinstance(obj, dict):
        return obj

    source = None
    for key in ("verifiedResult", "verified_result", "finalResult", "final_result", "mergedResult", "merged_result"):
        candidate = obj.get(key)
        if isinstance(candidate, dict):
            source = candidate
            break

    if source is None and any(key in obj for key in FIELD_LABEL_MAP):
        source = obj
    elif source is None and isinstance(obj.get("extractedData"), dict):
        source = obj["extractedData"]

    if source is None:
        return obj

    normalized = flatten_extraction_result(source)
    normalized["text"] = first_present(obj, "text") or first_present(source, "text", "raw_text", "rawText")
    if not normalized["text"] and isinstance(obj.get("extractedData"), dict):
        normalized["text"] = first_present(obj["extractedData"], "text", "raw_text", "rawText")
    if "entities" in obj:
        normalized["entities"] = obj["entities"]
    return normalized


def valid_tax_rate_span(text: str, start: int, end: int) -> bool:
    context = text[max(0, start - 24):min(len(text), end + 8)].lower()
    return "%" in context or any(word in context for word in ("vat", "tax", "gst"))


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
    obj = normalize_input_record(obj)
    text = obj.get("text", "")
    if not isinstance(text, str) or not text.strip():
        return None

    entities: list[dict] = []
    seen_ranges: list[tuple[int, int]] = []

    # Preserve reviewed annotations when an already-token-label-ready JSONL is
    # used as input, then add newly inferred structured spans around them.
    for entity in obj.get("entities", []):
        try:
            start = int(entity["start"])
            end = int(entity["end"])
            label = str(entity["label"])
        except (KeyError, TypeError, ValueError):
            continue
        if 0 <= start < end <= len(text):
            if label == "TAX_RATE" and not valid_tax_rate_span(text, start, end):
                continue
            entities.append({"start": start, "end": end, "label": label})
            seen_ranges.append((start, end))

    for field, label in FIELD_LABEL_MAP.items():
        raw_value = obj.get(field)
        if raw_value is None:
            continue
        value = str(raw_value).strip()
        if not value or value.lower() in ("null", "none", ""):
            continue

        spans = find_spans(text, value)
        if label == "TAX_RATE":
            spans = [span for span in spans if valid_tax_rate_span(text, *span)]
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

    for inferred in infer_extra_entities(text):
        start, end = inferred["start"], inferred["end"]
        if any(not (end <= old_start or start >= old_end) for old_start, old_end in seen_ranges):
            continue
        entities.append(inferred)
        seen_ranges.append((start, end))

    entities.sort(key=lambda entity: (entity["start"], entity["end"]))
    return {"text": text, "entities": entities}


def main():
    parser = argparse.ArgumentParser(
        description="Generate NER training data from Gemini-extracted invoices"
    )
    parser.add_argument(
        "--input", required=True,
        help="Input raw-extraction or annotated JSONL file"
    )
    parser.add_argument(
        "--output", required=True,
        help="Output JSONL file for train.py"
    )
    parser.add_argument(
        "--min-entities", type=int, default=1,
        help="Skip records with fewer than N entity spans (default: 1)"
    )
    parser.add_argument(
        "--allow-missing-labels", action="store_true",
        help="Write output even if a new structured label has no examples"
    )
    args = parser.parse_args()

    in_path = Path(args.input)
    out_path = Path(args.output)

    if not in_path.exists():
        print(f"[ERROR] Input file not found: {in_path}", file=sys.stderr)
        sys.exit(1)

    written = 0
    skipped = 0
    label_counts: Counter[str] = Counter()

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
            label_counts.update(entity["label"] for entity in record["entities"])
            written += 1

    print(f"\nDone.")
    print(f"  Written : {written} training examples -> {out_path}")
    print(f"  Skipped : {skipped} records (no text or too few entities)")
    print("\n  Label coverage:")
    for label, count in sorted(label_counts.items()):
        print(f"    {label:<24} {count}")

    missing = [label for label in EXTRA_ENTITY_LABELS if label_counts[label] == 0]
    if missing and not args.allow_missing_labels:
        print("\n[ERROR] Missing required structured labels: " + ", ".join(missing), file=sys.stderr)
        out_path.unlink(missing_ok=True)
        sys.exit(1)
    print(f"\nNext step:")
    print(f"  python train.py --data {out_path} --epochs 5 --output ./model")


if __name__ == "__main__":
    main()
