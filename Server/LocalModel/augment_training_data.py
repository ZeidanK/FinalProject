"""
augment_training_data.py
========================
Expands gemini_extractions.jsonl by generating format variants of each
invoice record, then feeds the augmented data through generate_training_data.py
to produce a larger invoices.jsonl for training.

Augmentations per record:
  1. Date format variants — 8 common date formats tried per date field
  2. Amount format variants — with/without commas, with/without decimals
  3. Context prefix variants — adds common invoice header labels before the text
  4. Capitalisation variants — UPPER / lower / Title Case on non-entity text

Usage:
  python augment_training_data.py                         (default I/O)
  python augment_training_data.py --input gemini_extractions.jsonl --output gemini_augmented.jsonl

Then run:
  python generate_training_data.py --input gemini_augmented.jsonl --output invoices.jsonl
  python train.py --data invoices.jsonl --epochs 5 --output ./model
"""

import argparse
import json
import re
import sys
from copy import deepcopy
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

DATE_FORMATS = [
    "%Y-%m-%d",      # 2025-04-17   (ISO — DB default)
    "%d/%m/%Y",      # 17/04/2025
    "%m/%d/%Y",      # 04/17/2025
    "%d-%m-%Y",      # 17-04-2025
    "%d.%m.%Y",      # 17.04.2025
    "%B %d, %Y",     # April 17, 2025
    "%d %B %Y",      # 17 April 2025
    "%d %b %Y",      # 17 Apr 2025
    "%b %d, %Y",     # Apr 17, 2025
]

def _parse_date(val: str) -> datetime | None:
    clean = val.strip().split("T")[0]
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(clean, fmt)
        except ValueError:
            pass
    return None


def _find_date_in_text(text: str, dt: datetime) -> tuple[str, str] | None:
    """Return (matched_string, format_used) for the first format found in text."""
    for fmt in DATE_FORMATS:
        s = dt.strftime(fmt)
        if s in text:
            return s, fmt
    return None


def augment_dates(record: dict) -> list[dict]:
    """Return new records with date fields rewritten in alternative formats."""
    results = []
    for field in ("invoice_date", "due_date"):
        val = record.get(field)
        if not val:
            continue
        dt = _parse_date(str(val))
        if not dt:
            continue
        found = _find_date_in_text(record["text"], dt)
        if not found:
            continue
        original_str, _ = found
        for fmt in DATE_FORMATS:
            new_str = dt.strftime(fmt)
            if new_str == original_str:
                continue
            new_rec = deepcopy(record)
            new_rec["text"] = new_rec["text"].replace(original_str, new_str)
            new_rec[field] = new_str
            results.append(new_rec)
    return results


# ---------------------------------------------------------------------------
# Amount helpers
# ---------------------------------------------------------------------------

def _parse_amount(val) -> float | None:
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        return None


def _amount_variants(amount: float) -> list[str]:
    variants = [
        f"{amount:.2f}",               # 1200.00
        f"{amount:,.2f}",              # 1,200.00
        f"{amount:.0f}",               # 1200
        f"{int(amount)}",              # 1200
    ]
    # Deduplicate while preserving order
    seen = set()
    return [v for v in variants if not (v in seen or seen.add(v))]


def augment_amounts(record: dict) -> list[dict]:
    """Return new records with amount fields rewritten in alternative formats."""
    results = []
    for field in ("total_amount", "subtotal", "vat_amount"):
        val = record.get(field)
        if not val:
            continue
        amount = _parse_amount(val)
        if amount is None:
            continue
        variants = _amount_variants(amount)
        # Find which variant is in the text
        original = next((v for v in variants if v in record["text"]), None)
        if not original:
            continue
        for new_v in variants:
            if new_v == original:
                continue
            new_rec = deepcopy(record)
            new_rec["text"] = new_rec["text"].replace(original, new_v)
            new_rec[field] = new_v
            results.append(new_rec)
    return results


# ---------------------------------------------------------------------------
# Context prefix variants
# ---------------------------------------------------------------------------

PREFIXES = [
    "TAX INVOICE\n",
    "INVOICE\n",
    "RECEIPT\n",
    "BILL\n",
    "PROFORMA INVOICE\n",
    "---\n",
    "\n",
]

def augment_prefixes(record: dict) -> list[dict]:
    """Return copies with different header lines prepended."""
    results = []
    for prefix in PREFIXES:
        if record["text"].startswith(prefix):
            continue
        new_rec = deepcopy(record)
        new_rec["text"] = prefix + new_rec["text"]
        results.append(new_rec)
    return results


# ---------------------------------------------------------------------------
# Capitalisation variants
# ---------------------------------------------------------------------------

def _apply_case_outside_entities(text: str, case_fn, entities: list[dict]) -> str:
    """Apply a case function to all text segments NOT covered by entity spans."""
    if not entities:
        return case_fn(text)
    
    sorted_ents = sorted(entities, key=lambda e: e["start"])
    result = []
    pos = 0
    for ent in sorted_ents:
        # Non-entity segment before this entity
        if pos < ent["start"]:
            result.append(case_fn(text[pos:ent["start"]]))
        # Entity segment — keep original case
        result.append(text[ent["start"]:ent["end"]])
        pos = ent["end"]
    # Trailing non-entity text
    if pos < len(text):
        result.append(case_fn(text[pos:]))
    return "".join(result)


def augment_capitalisation(record: dict) -> list[dict]:
    """Return UPPER and lower case variants of surrounding (non-entity) text."""
    entities = record.get("entities", [])
    results = []
    for case_fn in (str.upper, str.lower):
        new_text = _apply_case_outside_entities(record["text"], case_fn, entities)
        if new_text != record["text"]:
            new_rec = deepcopy(record)
            new_rec["text"] = new_text
            results.append(new_rec)
    return results


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Augment invoice NER training data")
    parser.add_argument("--input",  default="gemini_extractions.jsonl",
                        help="Input JSONL (gemini_extractions format)")
    parser.add_argument("--output", default="gemini_augmented.jsonl",
                        help="Output JSONL (augmented, same format)")
    parser.add_argument("--no-dates",    action="store_true", help="Skip date augmentation")
    parser.add_argument("--no-amounts",  action="store_true", help="Skip amount augmentation")
    parser.add_argument("--no-prefixes", action="store_true", help="Skip prefix augmentation")
    parser.add_argument("--no-case",     action="store_true", help="Skip capitalisation augmentation")
    args = parser.parse_args()

    in_path  = Path(args.input)
    out_path = Path(args.output)

    if not in_path.exists():
        print(f"[ERROR] Input file not found: {in_path}", file=sys.stderr)
        print("  Run build_training_input.py first to create it.", file=sys.stderr)
        sys.exit(1)

    original_records: list[dict] = []
    with open(in_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    original_records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    print(f"Loaded {len(original_records)} original records.")

    all_records = list(original_records)  # start with originals

    for rec in original_records:
        if not args.no_dates:
            all_records.extend(augment_dates(rec))
        if not args.no_amounts:
            all_records.extend(augment_amounts(rec))
        if not args.no_prefixes:
            all_records.extend(augment_prefixes(rec))
        if not args.no_case:
            all_records.extend(augment_capitalisation(rec))

    with open(out_path, "w", encoding="utf-8") as f:
        for rec in all_records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"Done. {len(original_records)} originals → {len(all_records)} total records → {out_path}")
    print(f"\nNext steps:")
    print(f"  python generate_training_data.py --input {out_path} --output invoices.jsonl")
    print(f"  python train.py --data invoices.jsonl --epochs 5 --output ./model")


if __name__ == "__main__":
    main()
