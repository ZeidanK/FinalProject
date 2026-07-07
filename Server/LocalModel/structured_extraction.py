"""Shared structured invoice parsing for training annotation and inference.

XLM-R identifies learned spans. This module handles structures that BIO tagging
does not represent well on its own: repeated table rows, masked cards, and
payment-plan relationships. Every extracted value is grounded in source text;
line-item categories are deliberately left unset when they are not printed.
"""

from __future__ import annotations

import re
from statistics import mean
from typing import Any, Iterable


EXTRA_ENTITY_LABELS = [
    "CARD_LAST4",
    "INSTALLMENT_COUNT",
    "INSTALLMENT_AMOUNT",
    "CURRENT_INSTALLMENT",
    "PAYMENT_FREQUENCY",
    "LINE_DESC",
    "LINE_QTY",
    "LINE_UNIT_PRICE",
    "LINE_TOTAL",
    "LINE_VAT_RATE",
]

_CURRENCY = r"(?:USD|ILS|NIS|EUR|GBP|[$€£₪])"
_NUMBER = r"-?\d[\d,]*(?:\.\d+)?"
_FREQUENCIES = {
    "monthly": ("monthly", "month", "per month", "\u05d7\u05d5\u05d3\u05e9\u05d9"),
    "weekly": ("weekly", "per week", "\u05e9\u05d1\u05d5\u05e2\u05d9"),
    "biweekly": ("biweekly", "bi-weekly", "every two weeks", "\u05d3\u05d5 \u05e9\u05d1\u05d5\u05e2\u05d9"),
    "one-time": ("one-time", "one time", "single payment", "\u05d7\u05d3 \u05e4\u05e2\u05de\u05d9"),
}


def parse_number(value: Any) -> float | None:
    if value is None:
        return None
    match = re.search(_NUMBER, str(value).replace("\u00a0", " "))
    if not match:
        return None
    try:
        return float(match.group(0).replace(",", ""))
    except ValueError:
        return None


def _number_for_json(value: float | None) -> int | float | None:
    if value is None:
        return None
    return int(value) if value.is_integer() else value


def _line_bounds(text: str, position: int) -> tuple[int, int]:
    start = text.rfind("\n", 0, position) + 1
    end = text.find("\n", position)
    return start, len(text) if end == -1 else end


def _entity(label: str, start: int, end: int) -> dict[str, Any]:
    return {"start": start, "end": end, "label": label}


def _find_card(text: str) -> tuple[str | None, tuple[int, int] | None]:
    patterns = (
        r"(?:\*{2,}|x{2,}|X{2,}|\u2022{2,}|4\*{2,})[\s-]*(?P<value>\d{4})(?!\d)",
        r"(?:card|visa|mastercard|amex|ending\s+in|last\s*4)\D{0,18}(?P<value>\d{4})(?!\d)",
    )
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group("value"), match.span("value")
    return None, None


def _find_frequency(text: str) -> tuple[str | None, tuple[int, int] | None]:
    for normalized, variants in _FREQUENCIES.items():
        for variant in variants:
            match = re.search(re.escape(variant), text, re.IGNORECASE)
            if match:
                return normalized, match.span()
    return None, None


def _find_payment_plan(text: str) -> tuple[dict[str, Any] | None, list[dict[str, Any]]]:
    plan: dict[str, Any] = {
        "total_installments": None,
        "installment_amount": None,
        "frequency": None,
        "current_installment": None,
        "description": None,
    }
    spans: list[dict[str, Any]] = []
    description_position: int | None = None

    current_patterns = (
        r"(?:payment|installment)\s*(?P<current>\d+)\s*(?:of|/)\s*(?P<total>\d+)",
        r"\u05ea\u05e9\u05dc\u05d5\u05dd\s*(?P<current>\d+)\s*\u05de\u05ea\u05d5\u05da\s*(?P<total>\d+)",
    )
    for pattern in current_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            plan["current_installment"] = int(match.group("current"))
            plan["total_installments"] = int(match.group("total"))
            spans.extend(
                (
                    _entity("CURRENT_INSTALLMENT", *match.span("current")),
                    _entity("INSTALLMENT_COUNT", *match.span("total")),
                )
            )
            description_position = match.start()
            break

    count_patterns = (
        r"(?:paid\s+in|split\s+(?:in|into)|in)\s*(?P<count>\d+)\s*(?:equal\s+)?(?:installments|payments)",
        r"(?P<count>\d+)\s*(?:equal\s+)?(?:installments|payments)",
        r"(?P<count>\d+)\s*\u05ea\u05e9\u05dc\u05d5\u05de\u05d9\u05dd",
    )
    if plan["total_installments"] is None:
        for pattern in count_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                plan["total_installments"] = int(match.group("count"))
                spans.append(_entity("INSTALLMENT_COUNT", *match.span("count")))
                description_position = match.start()
                break

    amount_patterns = (
        rf"(?:installments|payments)\s+(?:of|at)\s+(?:{_CURRENCY}\s*)?(?P<amount>{_NUMBER})",
        rf"(?:installment|payment)\s+amount\s*[:\-]?\s*(?:{_CURRENCY}\s*)?(?P<amount>{_NUMBER})",
    )
    for pattern in amount_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            plan["installment_amount"] = _number_for_json(parse_number(match.group("amount")))
            spans.append(_entity("INSTALLMENT_AMOUNT", *match.span("amount")))
            description_position = description_position if description_position is not None else match.start()
            break

    frequency, frequency_span = _find_frequency(text)
    frequency_has_plan_context = False
    if frequency_span is not None:
        context_start, context_end = _line_bounds(text, frequency_span[0])
        frequency_has_plan_context = bool(
            re.search(
                r"payment\s+plan|installment|split\s+payment|\u05ea\u05e9\u05dc\u05d5\u05de",
                text[context_start:context_end],
                re.IGNORECASE,
            )
        )
    if frequency is not None and frequency_span is not None and (
        plan["total_installments"] is not None
        or plan["installment_amount"] is not None
        or frequency_has_plan_context
    ):
        plan["frequency"] = frequency
        spans.append(_entity("PAYMENT_FREQUENCY", *frequency_span))
        description_position = description_position if description_position is not None else frequency_span[0]

    if description_position is not None:
        start, end = _line_bounds(text, description_position)
        plan["description"] = text[start:end].strip() or None

    if not any(value is not None for key, value in plan.items() if key != "description"):
        return None, []
    return plan, spans


def _iter_lines(text: str) -> Iterable[tuple[str, int]]:
    offset = 0
    for raw_line in text.splitlines(keepends=True):
        line = raw_line.rstrip("\r\n")
        yield line, offset
        offset += len(raw_line)
    if not text:
        return
    if not text.endswith(("\n", "\r")) and offset < len(text):
        yield text[offset:], offset


def _is_table_header(line: str) -> bool:
    lower = line.lower()
    has_description = any(word in lower for word in ("description", "item", "product", "service", "particular"))
    has_amount = any(word in lower for word in ("qty", "quantity", "price", "amount", "total"))
    return has_description and has_amount


def _is_table_footer(line: str) -> bool:
    return bool(
        re.match(
            r"\s*(?:subtotal|sub[\s-]*total|grand\s+total|total|tax|vat|gst|amount\s+due|balance\s+due|installment\s+schedule)\b",
            line,
            re.IGNORECASE,
        )
    )


def _line_item_from_match(
    line: str,
    line_offset: int,
    match: re.Match[str],
    confidence: float,
) -> dict[str, Any] | None:
    description = match.group("description").strip()
    if len(description) < 2 or re.search(r"\b(?:subtotal|total|tax|vat|balance)\b", description, re.IGNORECASE):
        return None

    fields: dict[str, Any] = {}
    spans: list[dict[str, Any]] = []
    mapping = (
        ("description", "LINE_DESC"),
        ("quantity", "LINE_QTY"),
        ("unit_price", "LINE_UNIT_PRICE"),
        ("total_amount", "LINE_TOTAL"),
        ("vat_rate", "LINE_VAT_RATE"),
    )
    for group_name, label in mapping:
        try:
            raw = match.group(group_name)
        except IndexError:
            raw = None
        if raw is None:
            continue
        start, end = match.span(group_name)
        if group_name == "description":
            left_trim = len(raw) - len(raw.lstrip())
            right_trim = len(raw.rstrip())
            start += left_trim
            end = match.start(group_name) + right_trim
            fields[group_name] = description
        else:
            fields[group_name] = _number_for_json(parse_number(raw))
        spans.append(_entity(label, line_offset + start, line_offset + end))

    quantity = fields.get("quantity") or 1
    total = fields.get("total_amount")
    unit = fields.get("unit_price")
    if total is None and unit is not None:
        total = round(float(unit) * float(quantity), 2)
    if unit is None and total is not None and quantity:
        unit = round(float(total) / float(quantity), 2)

    return {
        "description": description,
        "quantity": quantity,
        "unit_price": unit or 0,
        "total_amount": total or 0,
        "vat_rate": fields.get("vat_rate"),
        "category": None,
        "ai_confidence_score": confidence,
        "_line_start": line_offset,
        "_spans": spans,
    }


def _parse_item_line(line: str, offset: int) -> dict[str, Any] | None:
    if re.search(
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s+\d{4}\s*[\-–]",
        line,
        re.IGNORECASE,
    ):
        return None
    currency = rf"(?:{_CURRENCY}\s*)?"
    patterns: tuple[tuple[str, float], ...] = (
        (
            rf"^(?P<description>.+?)\s+(?P<quantity>\d+(?:\.\d+)?)\s+{currency}(?P<unit_price>{_NUMBER})\s+{currency}(?P<total_amount>{_NUMBER})(?:\s+(?P<vat_rate>\d+(?:\.\d+)?)\s*%)?\s*$",
            0.90,
        ),
        (
            rf"^(?P<quantity>\d+(?:\.\d+)?)\s+(?P<description>.+?)\s+{currency}(?P<unit_price>{_NUMBER})\s+{currency}(?P<total_amount>{_NUMBER})(?:\s+(?P<vat_rate>\d+(?:\.\d+)?)\s*%)?\s*$",
            0.88,
        ),
        (
            rf"^(?P<description>.+?)\s+(?P<quantity>\d+(?:\.\d+)?)\s+{currency}(?P<total_amount>{_NUMBER})\s*$",
            0.72,
        ),
        (
            rf"^(?P<description>.+?)\s+{currency}(?P<unit_price>{_NUMBER})\s+{currency}(?P<total_amount>{_NUMBER})\s*$",
            0.70,
        ),
    )
    for pattern, confidence in patterns:
        match = re.match(pattern, line, re.IGNORECASE)
        if match:
            item = _line_item_from_match(line, offset, match, confidence)
            if item is not None:
                return item
    return None


def _find_line_items(text: str) -> list[dict[str, Any]]:
    lines = list(_iter_lines(text))
    header_index = next((i for i, (line, _) in enumerate(lines) if _is_table_header(line)), None)
    start_index = 0 if header_index is None else header_index + 1
    items: list[dict[str, Any]] = []
    pending_description: tuple[str, int] | None = None

    for line, offset in lines[start_index:]:
        if header_index is not None and _is_table_footer(line):
            break
        if not line.strip() or _is_table_header(line):
            continue
        item = _parse_item_line(line.strip(), offset + len(line) - len(line.lstrip()))
        if item is not None:
            items.append(item)
            pending_description = None
            continue

        stripped = line.strip()
        numeric_row = re.match(
            rf"^(?P<quantity>\d+(?:\.\d+)?)\s+(?:{_CURRENCY}\s*)?(?P<unit>{_NUMBER})\s+(?:{_CURRENCY}\s*)?(?P<total>{_NUMBER})\s*$",
            stripped,
            re.IGNORECASE,
        )
        if numeric_row and pending_description is not None:
            description, description_start = pending_description
            left_trim = len(line) - len(line.lstrip())
            spans = [
                _entity("LINE_DESC", description_start, description_start + len(description)),
                _entity("LINE_QTY", offset + left_trim + numeric_row.start("quantity"), offset + left_trim + numeric_row.end("quantity")),
                _entity("LINE_UNIT_PRICE", offset + left_trim + numeric_row.start("unit"), offset + left_trim + numeric_row.end("unit")),
                _entity("LINE_TOTAL", offset + left_trim + numeric_row.start("total"), offset + left_trim + numeric_row.end("total")),
            ]
            quantity = _number_for_json(parse_number(numeric_row.group("quantity"))) or 1
            unit = _number_for_json(parse_number(numeric_row.group("unit"))) or 0
            total = _number_for_json(parse_number(numeric_row.group("total"))) or 0
            items.append({
                "description": description,
                "quantity": quantity,
                "unit_price": unit,
                "total_amount": total,
                "vat_rate": None,
                "category": None,
                "ai_confidence_score": 0.78,
                "_line_start": description_start,
                "_spans": spans,
            })
            pending_description = None
            continue

        is_date_or_noise = bool(
            re.search(r"\b\d{4}\b.*[\-–].*\b\d{4}\b", stripped)
            or re.match(r"^(?:page|invoice|date|bill\s+to|pay\s+online)\b", stripped, re.IGNORECASE)
        )
        if header_index is not None and re.search(r"[A-Za-z\u0590-\u05ff]", stripped) and not is_date_or_noise:
            leading = len(line) - len(line.lstrip())
            pending_description = (stripped, offset + leading)
    return items


def infer_extra_entities(text: str) -> list[dict[str, Any]]:
    """Infer grounded extra BIO spans for an existing invoice text."""
    entities: list[dict[str, Any]] = []
    _, card_span = _find_card(text)
    if card_span is not None:
        entities.append(_entity("CARD_LAST4", *card_span))
    _, payment_spans = _find_payment_plan(text)
    entities.extend(payment_spans)
    for item in _find_line_items(text):
        entities.extend(item["_spans"])

    accepted: list[dict[str, Any]] = []
    for entity in sorted(entities, key=lambda value: (value["start"], value["end"])):
        if any(entity["start"] < old["end"] and entity["end"] > old["start"] for old in accepted):
            continue
        accepted.append(entity)
    return accepted


def _public_item(item: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in item.items() if not key.startswith("_")}


def extract_structured_fields(text: str) -> dict[str, Any]:
    card, _ = _find_card(text)
    payment_plan, _ = _find_payment_plan(text)
    items = [_public_item(item) for item in _find_line_items(text)]
    return {
        "last_four_digits_card": card,
        "item_count": len(items) if items else None,
        "payment_plan": payment_plan,
        "line_items": items,
    }


def _entity_value(text: str, entity: dict[str, Any]) -> str:
    start = int(entity.get("start", 0))
    end = int(entity.get("end", start))
    return text[start:end].strip()


def structured_from_ner(text: str, entities: list[dict[str, Any]]) -> dict[str, Any]:
    """Build nested parity fields, preferring NER spans over parser fallbacks."""
    fallback = extract_structured_fields(text)
    by_label: dict[str, list[dict[str, Any]]] = {}
    for entity in entities:
        by_label.setdefault(str(entity.get("label", "")), []).append(entity)

    card_entities = by_label.get("CARD_LAST4", [])
    if card_entities:
        best = max(card_entities, key=lambda value: float(value.get("score", 0)))
        fallback["last_four_digits_card"] = _entity_value(text, best)

    payment_map = {
        "INSTALLMENT_COUNT": "total_installments",
        "INSTALLMENT_AMOUNT": "installment_amount",
        "CURRENT_INSTALLMENT": "current_installment",
        "PAYMENT_FREQUENCY": "frequency",
    }
    plan = dict(fallback.get("payment_plan") or {
        "total_installments": None,
        "installment_amount": None,
        "frequency": None,
        "current_installment": None,
        "description": None,
    })
    for label, key in payment_map.items():
        candidates = by_label.get(label, [])
        if not candidates:
            continue
        best = max(candidates, key=lambda value: float(value.get("score", 0)))
        raw = _entity_value(text, best)
        if key == "frequency":
            normalized, _ = _find_frequency(raw)
            plan[key] = normalized or raw.lower()
        else:
            plan[key] = _number_for_json(parse_number(raw))
        if plan.get("description") is None:
            start, end = _line_bounds(text, int(best["start"]))
            plan["description"] = text[start:end].strip() or None
    if any(value is not None for key, value in plan.items() if key != "description"):
        fallback["payment_plan"] = plan

    line_labels = {"LINE_DESC", "LINE_QTY", "LINE_UNIT_PRICE", "LINE_TOTAL", "LINE_VAT_RATE"}
    grouped: dict[int, list[dict[str, Any]]] = {}
    for entity in entities:
        if entity.get("label") in line_labels:
            line_start, _ = _line_bounds(text, int(entity["start"]))
            grouped.setdefault(line_start, []).append(entity)

    ner_items: list[dict[str, Any]] = []
    item_keys = {
        "LINE_DESC": "description",
        "LINE_QTY": "quantity",
        "LINE_UNIT_PRICE": "unit_price",
        "LINE_TOTAL": "total_amount",
        "LINE_VAT_RATE": "vat_rate",
    }
    for _, row_entities in sorted(grouped.items()):
        values: dict[str, Any] = {}
        scores: list[float] = []
        for label, key in item_keys.items():
            candidates = [entity for entity in row_entities if entity.get("label") == label]
            if not candidates:
                continue
            best = max(candidates, key=lambda value: float(value.get("score", 0)))
            raw = _entity_value(text, best)
            values[key] = raw if key == "description" else _number_for_json(parse_number(raw))
            scores.append(float(best.get("score", 0)))
        if values.get("description") and (values.get("total_amount") is not None or values.get("unit_price") is not None):
            quantity = values.get("quantity") or 1
            total = values.get("total_amount")
            unit = values.get("unit_price")
            if total is None and unit is not None:
                total = round(float(unit) * float(quantity), 2)
            if unit is None and total is not None and quantity:
                unit = round(float(total) / float(quantity), 2)
            ner_items.append({
                "description": values["description"],
                "quantity": quantity,
                "unit_price": unit or 0,
                "total_amount": total or 0,
                "vat_rate": values.get("vat_rate"),
                "category": None,
                "ai_confidence_score": mean(scores) if scores else 0.5,
            })

    if ner_items:
        fallback["line_items"] = ner_items
        fallback["item_count"] = len(ner_items)
    return fallback
