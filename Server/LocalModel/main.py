"""FastAPI service for full local invoice extraction.

The XLM-R token classifier handles learned invoice spans across overlapping
512-token windows. Deterministic post-processing turns repeated spans into
line items and payment-plan objects, preserving Gemini's application contract.
"""

from __future__ import annotations

import logging
import os
import re
import sys
from contextlib import asynccontextmanager
from statistics import mean
from typing import Any

# Do not load the unstable optional Arrow DLL through Transformers/pandas.
sys.modules["pyarrow"] = None

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from transformers import AutoModelForTokenClassification, AutoTokenizer

from structured_extraction import structured_from_ner


logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

MODEL_PATH = os.environ.get("MODEL_PATH", "./model")
BASE_MODEL = "xlm-roberta-base"
MAX_LENGTH = 512
WINDOW_STRIDE = 96
INFERENCE_BATCH_SIZE = 8

SCALAR_LABEL_FIELD_MAP = {
    "VENDOR": "vendor_name",
    "INVOICE_NUM": "invoice_number",
    "INVOICE_DATE": "invoice_date",
    "DUE_DATE": "due_date",
    "TOTAL": "total_amount",
    "SUBTOTAL": "subtotal",
    "TAX_AMT": "vat_amount",
    "TAX_RATE": "vat_rate",
    "TAX_ID": "vendor_tax_id",
    "CURRENCY": "currency",
}


class ExtractRequest(BaseModel):
    text: str


class PaymentPlanResponse(BaseModel):
    total_installments: int | None = None
    installment_amount: float | None = None
    frequency: str | None = None
    current_installment: int | None = None
    description: str | None = None


class LineItemResponse(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0
    total_amount: float = 0
    vat_rate: float | None = None
    category: str | None = None
    ai_confidence_score: float = Field(default=0.5, ge=0, le=1)


class ExtractResponse(BaseModel):
    vendor_name: str | None = None
    invoice_number: str | None = None
    invoice_date: str | None = None
    due_date: str | None = None
    total_amount: str | None = None
    subtotal: str | None = None
    vat_amount: str | None = None
    vat_rate: str | None = None
    vendor_tax_id: str | None = None
    currency: str | None = None
    last_four_digits_card: str | None = None
    item_count: int | None = None
    payment_plan: PaymentPlanResponse | None = None
    line_items: list[LineItemResponse] = Field(default_factory=list)
    confidence: float = Field(default=0, ge=0, le=1)


class SlidingWindowNER:
    def __init__(self, model_path: str) -> None:
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, use_fast=True)
        if not self.tokenizer.is_fast:
            raise RuntimeError("A fast tokenizer is required for offset mapping")
        self.model = AutoModelForTokenClassification.from_pretrained(model_path)
        self.device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.model.eval()
        self.id2label = {int(key): value for key, value in self.model.config.id2label.items()}
        logger.info("Inference device: %s", self.device)

    def _window_spans(
        self,
        text: str,
        offsets: list[list[int]],
        label_ids: list[int],
        probabilities: list[float],
    ) -> list[dict[str, Any]]:
        spans: list[dict[str, Any]] = []
        current: dict[str, Any] | None = None

        def finish() -> None:
            nonlocal current
            if current is not None:
                current["score"] = mean(current.pop("_scores"))
                current["word"] = text[current["start"]:current["end"]].strip()
                if current["word"]:
                    spans.append(current)
            current = None

        for offset, label_id, probability in zip(offsets, label_ids, probabilities):
            start, end = int(offset[0]), int(offset[1])
            full_label = self.id2label.get(int(label_id), "O")
            if start == end or full_label == "O" or "-" not in full_label:
                finish()
                continue
            prefix, label = full_label.split("-", 1)
            should_continue = (
                current is not None
                and prefix == "I"
                and current["label"] == label
                and start <= current["end"] + 1
            )
            if not should_continue:
                finish()
                current = {
                    "label": label,
                    "start": start,
                    "end": end,
                    "_scores": [float(probability)],
                }
            else:
                current["end"] = max(current["end"], end)
                current["_scores"].append(float(probability))
        finish()
        return spans

    @staticmethod
    def _merge_overlapping(spans: list[dict[str, Any]]) -> list[dict[str, Any]]:
        accepted: list[dict[str, Any]] = []
        for candidate in sorted(spans, key=lambda value: float(value["score"]), reverse=True):
            duplicate = any(
                old["label"] == candidate["label"]
                and candidate["start"] < old["end"]
                and candidate["end"] > old["start"]
                for old in accepted
            )
            if not duplicate:
                accepted.append(candidate)
        return sorted(accepted, key=lambda value: (value["start"], value["end"]))

    @torch.inference_mode()
    def predict(self, text: str) -> list[dict[str, Any]]:
        encoding = self.tokenizer(
            text,
            truncation=True,
            max_length=MAX_LENGTH,
            stride=WINDOW_STRIDE,
            return_overflowing_tokens=True,
            return_offsets_mapping=True,
            padding=True,
            return_tensors="pt",
        )
        offsets = encoding.pop("offset_mapping")
        encoding.pop("overflow_to_sample_mapping", None)
        all_spans: list[dict[str, Any]] = []
        window_count = int(encoding["input_ids"].shape[0])

        for batch_start in range(0, window_count, INFERENCE_BATCH_SIZE):
            batch_end = min(batch_start + INFERENCE_BATCH_SIZE, window_count)
            model_inputs = {
                key: value[batch_start:batch_end].to(self.device)
                for key, value in encoding.items()
            }
            with torch.autocast(
                device_type="cuda",
                dtype=torch.float16,
                enabled=self.device.type == "cuda",
            ):
                logits = self.model(**model_inputs).logits
            probabilities = torch.softmax(logits.float(), dim=-1)
            scores, labels = probabilities.max(dim=-1)

            for local_index in range(batch_end - batch_start):
                window_index = batch_start + local_index
                all_spans.extend(
                    self._window_spans(
                        text,
                        offsets[window_index].tolist(),
                        labels[local_index].tolist(),
                        scores[local_index].tolist(),
                    )
                )
        return self._merge_overlapping(all_spans)


ner: SlidingWindowNER | None = None


@asynccontextmanager
async def lifespan(_: FastAPI):
    global ner
    model_to_load = MODEL_PATH if os.path.isdir(MODEL_PATH) else BASE_MODEL
    logger.info("Loading model from: %s", model_to_load)
    try:
        ner = SlidingWindowNER(model_to_load)
        logger.info("Model loaded successfully")
    except Exception:
        logger.exception("Failed to load model")
    yield
    ner = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


app = FastAPI(title="Invoice NER Service", version="2.0.0", lifespan=lifespan)


def build_extraction(text: str, entities: list[dict[str, Any]]) -> ExtractResponse:
    result: dict[str, Any] = {field: None for field in SCALAR_LABEL_FIELD_MAP.values()}
    selected_scores: list[float] = []
    for label, field in SCALAR_LABEL_FIELD_MAP.items():
        candidates = [entity for entity in entities if entity["label"] == label]
        if label == "TAX_RATE":
            candidates = [
                entity for entity in candidates
                if "%" in text[max(0, int(entity["start"]) - 24):min(len(text), int(entity["end"]) + 8)]
                or re.search(
                    r"vat|tax|gst",
                    text[max(0, int(entity["start"]) - 24):min(len(text), int(entity["end"]) + 8)],
                    re.IGNORECASE,
                )
            ]
        if not candidates:
            continue
        best = max(candidates, key=lambda value: float(value["score"]))
        result[field] = text[int(best["start"]):int(best["end"])].strip()
        selected_scores.append(float(best["score"]))

    structured = structured_from_ner(text, entities)
    result.update(structured)
    item_scores = [float(item["ai_confidence_score"]) for item in structured["line_items"]]
    confidence_scores = selected_scores + item_scores
    result["confidence"] = mean(confidence_scores) if confidence_scores else 0.0
    return ExtractResponse(**result)


@app.post("/extract", response_model=ExtractResponse)
def extract(request: ExtractRequest) -> ExtractResponse:
    if ner is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="text field is empty")
    if len(request.text) > 250_000:
        raise HTTPException(status_code=413, detail="invoice text exceeds 250,000 characters")
    return build_extraction(request.text, ner.predict(request.text))


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": ner is not None,
        "device": str(ner.device) if ner is not None else None,
        "schema_version": 2,
    }
