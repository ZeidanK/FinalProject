"""
diagnose.py
===========
Reports training data quality: per-label entity counts, zero-entity examples,
and class imbalance ratio. Run this BEFORE training to check your data.

Usage:
  python diagnose.py                        # checks invoices_combined.jsonl
  python diagnose.py --data invoices.jsonl  # check a specific file
"""

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="invoices_combined.jsonl")
    args = parser.parse_args()

    path = Path(args.data)
    if not path.exists():
        print(f"[ERROR] File not found: {path}")
        return

    records = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass

    label_counts:  Counter      = Counter()
    example_labels: defaultdict = defaultdict(int)
    zero_entity    = 0
    total_chars    = 0

    for rec in records:
        entities = rec.get("entities", [])
        total_chars += len(rec.get("text", ""))
        if not entities:
            zero_entity += 1
        seen = set()
        for ent in entities:
            label = ent.get("label", "?")
            label_counts[label] += 1
            seen.add(label)
        for lbl in seen:
            example_labels[lbl] += 1

    print(f"\n{'='*55}")
    print(f"  TRAINING DATA DIAGNOSTIC")
    print(f"{'='*55}")
    print(f"  File           : {path}")
    print(f"  Total examples : {len(records)}")
    print(f"  Zero-entity    : {zero_entity}  "
          f"({'%.0f' % (zero_entity/max(len(records),1)*100)}% — these teach nothing)")
    print(f"  Avg text length: {total_chars // max(len(records),1)} chars")
    print()

    if not label_counts:
        print("  [WARNING] NO entity spans found at all!")
        print("  generate_training_data.py could not locate any field values in the text.")
        print("  Check that field values in your JSONL match what appears in the invoice text.")
        print(f"{'='*55}\n")
        return

    all_labels = [
        "VENDOR", "INVOICE_NUM", "INVOICE_DATE", "DUE_DATE",
        "TOTAL", "SUBTOTAL", "TAX_AMT", "TAX_RATE", "TAX_ID", "CURRENCY",
    ]

    total_entity_tokens = sum(label_counts.values())
    # Rough estimate: avg text 1000 chars / 5 chars per token = 200 tokens per example
    est_o_tokens = max(len(records) * 200 - total_entity_tokens, 0)

    print(f"  {'Label':<16} {'Spans':>6}  {'In N examples':>14}  {'Status'}")
    print(f"  {'-'*16} {'-'*6}  {'-'*14}  {'-'*20}")

    for lbl in all_labels:
        count   = label_counts.get(lbl, 0)
        in_exs  = example_labels.get(lbl, 0)
        if count == 0:
            status = "⚠  NO DATA — model cannot learn this"
        elif count < 5:
            status = "⚠  Very few — unreliable"
        elif count < 20:
            status = "△  Low — may not generalise"
        else:
            status = "✓"
        print(f"  {lbl:<16} {count:>6}  {in_exs:>11} ex  {status}")

    imbalance = est_o_tokens / max(total_entity_tokens, 1)
    print()
    print(f"  Estimated O:entity token ratio  ≈ {imbalance:.0f}:1")
    if imbalance > 30:
        print(f"  [WARNING] High imbalance! train.py uses class weighting to compensate.")
    else:
        print(f"  [OK] Imbalance is manageable with class weighting.")

    print(f"\n  Recommendation:")
    weak = [l for l in all_labels if label_counts.get(l, 0) < 10]
    if weak:
        print(f"  Labels with < 10 spans: {', '.join(weak)}")
        print(f"  → Add more synthetic examples or real invoices containing these fields.")
    else:
        print(f"  All labels have ≥ 10 spans. Ready to train.")

    print(f"{'='*55}\n")


if __name__ == "__main__":
    main()
