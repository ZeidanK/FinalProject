"""
Invoice NER Microservice
========================
Runs a fine-tuned DistilBERT token-classification model and exposes two endpoints:

  POST /extract   { "text": "<raw invoice text>" }
                  → { vendor_name, invoice_number, invoice_date, due_date,
                      total_amount, subtotal, vat_amount, vat_rate,
                      vendor_tax_id, currency, confidence }

  GET  /health    → { "status": "ok", "model_loaded": true }

Startup:
  If ./model/ exists  → loads your fine-tuned model.
  Otherwise           → loads distilbert-base-uncased (no labels yet; will return
                        empty extractions until you train with train.py).

Environment variables:
  MODEL_PATH   path to fine-tuned model directory  (default: ./model)
  PORT         port to bind                         (default: 8000)
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

MODEL_PATH = os.environ.get("MODEL_PATH", "./model")
BASE_MODEL = "xlm-roberta-base"   # multilingual — handles Hebrew + English

# Maps the NER label names (from train.py) to JSON response keys.
LABEL_FIELD_MAP: dict[str, str] = {
    "VENDOR":       "vendor_name",
    "INVOICE_NUM":  "invoice_number",
    "INVOICE_DATE": "invoice_date",
    "DUE_DATE":     "due_date",
    "TOTAL":        "total_amount",
    "SUBTOTAL":     "subtotal",
    "TAX_AMT":      "vat_amount",
    "TAX_RATE":     "vat_rate",
    "TAX_ID":       "vendor_tax_id",
    "CURRENCY":     "currency",
}

# ---------------------------------------------------------------------------
# Lifespan: load model once on startup
# ---------------------------------------------------------------------------

ner_pipeline = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ner_pipeline

    model_to_load = MODEL_PATH if os.path.isdir(MODEL_PATH) else BASE_MODEL
    logger.info("Loading model from: %s", model_to_load)

    try:
        ner_pipeline = pipeline(
            "token-classification",
            model=model_to_load,
            tokenizer=model_to_load,
            aggregation_strategy="simple",
        )
        logger.info("Model loaded successfully.")
    except Exception as exc:
        logger.error("Failed to load model: %s", exc)
        # Service starts but /extract will return 503 until fixed.

    yield
    ner_pipeline = None


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title="Invoice NER Service", version="1.0.0", lifespan=lifespan)


class ExtractRequest(BaseModel):
    text: str


class ExtractResponse(BaseModel):
    vendor_name:    Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date:   Optional[str] = None
    due_date:       Optional[str] = None
    total_amount:   Optional[str] = None
    subtotal:       Optional[str] = None
    vat_amount:     Optional[str] = None
    vat_rate:       Optional[str] = None
    vendor_tax_id:  Optional[str] = None
    currency:       Optional[str] = None
    confidence:     float = 0.0


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest) -> ExtractResponse:
    if ner_pipeline is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="text field is empty")

    entities = ner_pipeline(req.text[:2000])   # cap at 2k chars — DistilBERT 512-token limit

    result: dict = {v: None for v in LABEL_FIELD_MAP.values()}
    scores: list[float] = []

    for ent in entities:
        label: str = ent.get("entity_group", "")
        if label in LABEL_FIELD_MAP:
            field = LABEL_FIELD_MAP[label]
            if result[field] is None:           # keep first / highest-scored span
                result[field] = ent["word"].strip()
                scores.append(float(ent["score"]))

    result["confidence"] = sum(scores) / len(scores) if scores else 0.0
    return ExtractResponse(**result)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": ner_pipeline is not None}
