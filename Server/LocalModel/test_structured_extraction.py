import unittest

from main import SlidingWindowNER, build_extraction
from structured_extraction import (
    extract_structured_fields,
    infer_extra_entities,
)


class StructuredExtractionTests(unittest.TestCase):
    def test_extracts_full_payment_plan_card_and_line_item(self):
        text = (
            "Invoice\nCard: ****2420\n"
            "Monthly payment plan - Payment 2 of 6\n"
            "Paid in 6 installments of ILS 600.00\n"
            "Description Qty Unit price Line total VAT Rate\n"
            "Office chair 2 ILS 300.00 ILS 600.00 17%\n"
            "Subtotal ILS 512.82\nTotal ILS 600.00"
        )
        result = extract_structured_fields(text)
        self.assertEqual("2420", result["last_four_digits_card"])
        self.assertEqual(6, result["payment_plan"]["total_installments"])
        self.assertEqual(2, result["payment_plan"]["current_installment"])
        self.assertEqual(600, result["payment_plan"]["installment_amount"])
        self.assertEqual("monthly", result["payment_plan"]["frequency"])
        self.assertEqual(1, result["item_count"])
        self.assertEqual("Office chair", result["line_items"][0]["description"])
        self.assertEqual(17, result["line_items"][0]["vat_rate"])
        self.assertIsNone(result["line_items"][0]["category"])

    def test_saas_multiline_item_does_not_treat_billing_period_as_item(self):
        text = (
            "Description Qty Unit price Amount\n"
            "Professional Plan - Annual\n"
            "Apr 27, 2025 - Apr 27, 2026\n"
            "1 $144.00 $144.00\nSubtotal $144.00"
        )
        items = extract_structured_fields(text)["line_items"]
        self.assertEqual(1, len(items))
        self.assertEqual("Professional Plan - Annual", items[0]["description"])
        self.assertEqual(144, items[0]["total_amount"])

    def test_annotation_spans_are_valid_and_non_overlapping(self):
        text = (
            "Card ending in 1234\nPaid in 3 installments of USD 20.00\n"
            "Description Qty Price Amount\nService 1 USD 20.00 USD 20.00\nTotal USD 20.00"
        )
        entities = infer_extra_entities(text)
        self.assertTrue(entities)
        for entity in entities:
            self.assertGreater(entity["end"], entity["start"])
        for left, right in zip(entities, entities[1:]):
            self.assertLessEqual(left["end"], right["start"])

    def test_full_contract_accepts_entities_after_character_2000(self):
        prefix = "noise " * 400
        text = prefix + "Grand Total 987.65"
        start = text.index("987.65")
        response = build_extraction(text, [{
            "label": "TOTAL",
            "start": start,
            "end": start + len("987.65"),
            "score": 0.98,
        }])
        self.assertEqual("987.65", response.total_amount)
        self.assertAlmostEqual(0.98, response.confidence)

    def test_overlapping_windows_keep_highest_score(self):
        merged = SlidingWindowNER._merge_overlapping([
            {"label": "TOTAL", "start": 10, "end": 16, "score": 0.7},
            {"label": "TOTAL", "start": 10, "end": 16, "score": 0.95},
            {"label": "VENDOR", "start": 10, "end": 16, "score": 0.8},
        ])
        totals = [item for item in merged if item["label"] == "TOTAL"]
        self.assertEqual(1, len(totals))
        self.assertEqual(0.95, totals[0]["score"])


if __name__ == "__main__":
    unittest.main()
