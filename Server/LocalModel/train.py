"""Fine-tune XLM-RoBERTa for multilingual invoice NER.

Input JSONL format (one invoice per line):
{
    "text": "Invoice INV-001 from Acme Ltd. Total USD 120.00",
    "entities": [
        {"start": 8, "end": 15, "label": "INVOICE_NUM"},
        {"start": 21, "end": 29, "label": "VENDOR"}
    ]
}

This script intentionally uses torch.utils.data.Dataset only. It does not use
Hugging Face datasets.Dataset, Dataset.from_list, or PyArrow.
"""

from __future__ import annotations

import argparse
import inspect
import json
import random
import sys
from collections import Counter
from pathlib import Path
from typing import Any

# Prevent optional imports in pandas/Transformers from loading PyArrow. A None
# entry makes `import pyarrow` behave exactly like an uninstalled optional
# dependency, before any of its native code can be loaded.
sys.modules["pyarrow"] = None

# Import seqeval (and its sklearn/pandas dependencies) before torch. Some
# Microsoft Store Python environments otherwise hit Windows heap corruption
# while loading pandas' native extensions after torch's native DLLs.
from seqeval.metrics import classification_report
import numpy as np
import torch
from torch.utils.data import Dataset

# Trainer conditionally imports the optional Hugging Face `datasets` package
# when it is installed, even when the supplied dataset is a PyTorch Dataset.
# In the affected Windows environment that indirect import loads PyArrow and
# can terminate the interpreter natively. Mark the optional integration as
# unavailable before importing Trainer; no Trainer functionality used here
# depends on it.
import transformers.utils as _transformers_utils
from transformers.utils import import_utils as _transformers_import_utils


def _datasets_are_unavailable() -> bool:
    return False


_transformers_import_utils.is_datasets_available = _datasets_are_unavailable
_transformers_utils.is_datasets_available = _datasets_are_unavailable

from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    DataCollatorForTokenClassification,
    Trainer,
    TrainingArguments,
    set_seed,
)


ENTITY_LABELS = [
    "VENDOR",
    "INVOICE_NUM",
    "INVOICE_DATE",
    "DUE_DATE",
    "TOTAL",
    "SUBTOTAL",
    "TAX_AMT",
    "TAX_RATE",
    "TAX_ID",
    "CURRENCY",
]

# Interleaved BIO order: O, B-VENDOR, I-VENDOR, B-INVOICE_NUM, ...
BIO_LABELS = ["O"] + [
    bio_label
    for entity_label in ENTITY_LABELS
    for bio_label in (f"B-{entity_label}", f"I-{entity_label}")
]
LABEL2ID = {label: index for index, label in enumerate(BIO_LABELS)}
ID2LABEL = {index: label for index, label in enumerate(BIO_LABELS)}

MAX_LENGTH = 512
SEED = 42


class InvoiceNERDataset(Dataset):
    """A plain in-memory PyTorch dataset of tokenized invoice records."""

    def __init__(self, records: list[dict[str, list[int]]]) -> None:
        self.records = records

    def __len__(self) -> int:
        return len(self.records)

    def __getitem__(self, index: int) -> dict[str, list[int]]:
        return self.records[index]


def align_labels_to_tokens(
    text: str,
    entities: list[dict[str, Any]],
    tokenizer: Any,
    max_length: int = MAX_LENGTH,
) -> dict[str, list[int]]:
    """Tokenize text and align character spans to interleaved BIO labels."""
    if not isinstance(text, str):
        raise TypeError("'text' must be a string")

    normalized_entities: list[tuple[int, int, str]] = []
    for entity in entities:
        label = str(entity["label"])
        if label not in ENTITY_LABELS:
            raise ValueError(f"unknown entity label: {label!r}")

        start = int(entity["start"])
        end = int(entity["end"])
        if start < 0 or end <= start or end > len(text):
            raise ValueError(
                f"invalid {label} span [{start}, {end}) for text length {len(text)}"
            )
        normalized_entities.append((start, end, label))

    normalized_entities.sort(key=lambda item: (item[0], item[1]))

    encoding = tokenizer(
        text,
        truncation=True,
        max_length=max_length,
        return_offsets_mapping=True,
    )
    offsets = encoding.pop("offset_mapping")

    labels: list[int] = []
    started_entities: set[int] = set()

    for token_start, token_end in offsets:
        # XLM-R special tokens have an empty (0, 0) offset. The collator also
        # uses -100 for padding labels, so all non-text tokens are ignored.
        if token_start == token_end:
            labels.append(-100)
            continue

        matching_index = None
        for entity_index, (entity_start, entity_end, _) in enumerate(
            normalized_entities
        ):
            if token_start < entity_end and token_end > entity_start:
                matching_index = entity_index
                break

        if matching_index is None:
            labels.append(LABEL2ID["O"])
            continue

        _, _, entity_label = normalized_entities[matching_index]
        prefix = "I" if matching_index in started_entities else "B"
        started_entities.add(matching_index)
        labels.append(LABEL2ID[f"{prefix}-{entity_label}"])

    # BatchEncoding is deliberately converted to a built-in dict containing
    # built-in lists. No Arrow-backed object is created anywhere in this file.
    record = {key: list(value) for key, value in encoding.items()}
    record["labels"] = labels
    return record


def read_jsonl(path: str | Path, tokenizer: Any) -> list[dict[str, list[int]]]:
    """Read and tokenize a JSONL file, warning about malformed records."""
    records: list[dict[str, list[int]]] = []
    skipped = 0

    with Path(path).open("r", encoding="utf-8-sig") as source:
        for line_number, line in enumerate(source, start=1):
            if not line.strip():
                continue
            try:
                item = json.loads(line)
                entities = item.get("entities", [])
                if not isinstance(entities, list):
                    raise TypeError("'entities' must be a list")
                records.append(
                    align_labels_to_tokens(item["text"], entities, tokenizer)
                )
            except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
                print(f"[WARN] Skipping line {line_number}: {exc}", flush=True)
                skipped += 1

    print(f"Loaded {len(records)} examples ({skipped} skipped).", flush=True)
    if not records:
        raise ValueError(f"No usable examples were found in {path}")
    return records


def make_train_validation_datasets(
    data_path: str,
    validation_path: str | None,
    tokenizer: Any,
) -> tuple[InvoiceNERDataset, InvoiceNERDataset]:
    if validation_path:
        train_records = read_jsonl(data_path, tokenizer)
        validation_records = read_jsonl(validation_path, tokenizer)
    else:
        records = read_jsonl(data_path, tokenizer)
        if len(records) < 2:
            raise ValueError("At least two examples are required for a train/val split")

        random.Random(SEED).shuffle(records)
        validation_size = max(1, int(len(records) * 0.10))
        validation_records = records[:validation_size]
        train_records = records[validation_size:]
        print(
            f"Split -> train={len(train_records)}  val={len(validation_records)}",
            flush=True,
        )

    return InvoiceNERDataset(train_records), InvoiceNERDataset(validation_records)


def make_compute_metrics(id2label: dict[int, str]):
    """Create a Trainer metric callback with per-entity F1 reporting."""

    def compute_metrics(eval_prediction: Any) -> dict[str, float]:
        logits = eval_prediction.predictions
        labels = eval_prediction.label_ids
        if isinstance(logits, tuple):
            logits = logits[0]
        predictions = np.argmax(logits, axis=-1)

        true_labels: list[list[str]] = []
        true_predictions: list[list[str]] = []
        for prediction_row, label_row in zip(predictions, labels):
            true_labels.append(
                [id2label[int(label)] for label in label_row if label != -100]
            )
            true_predictions.append(
                [
                    id2label[int(prediction)]
                    for prediction, label in zip(prediction_row, label_row)
                    if label != -100
                ]
            )

        report = classification_report(
            true_labels,
            true_predictions,
            output_dict=True,
            zero_division=0,
        )

        print("\n--- Per-label F1 ---")
        aggregate_rows = {"micro avg", "macro avg", "weighted avg"}
        for label, values in sorted(report.items()):
            if isinstance(values, dict) and label not in aggregate_rows:
                f1 = float(values.get("f1-score", 0.0))
                support = int(values.get("support", 0))
                bar = "#" * int(f1 * 20)
                print(
                    f"  {label:<18} f1={f1:.3f}  "
                    f"n={support:>4}  [{bar:<20}]"
                )
        print()

        micro = report.get("micro avg", {})
        return {
            "precision": float(micro.get("precision", 0.0)),
            "recall": float(micro.get("recall", 0.0)),
            "f1": float(micro.get("f1-score", 0.0)),
        }

    return compute_metrics


def compute_class_weights(
    dataset: InvoiceNERDataset,
    number_of_labels: int,
) -> list[float]:
    """Compute capped inverse-frequency weights from the training set."""
    counts: Counter[int] = Counter()
    for example in dataset:
        counts.update(label for label in example["labels"] if label != -100)

    token_count = sum(counts.values())
    if token_count == 0:
        raise ValueError("The training set contains no non-special tokens")

    weights = [
        min(token_count / (number_of_labels * max(counts.get(i, 0), 1)), 15.0)
        for i in range(number_of_labels)
    ]

    print("\nLargest class weights:")
    for label_id, weight in sorted(
        enumerate(weights), key=lambda item: item[1], reverse=True
    )[:6]:
        print(f"  {ID2LABEL[label_id]:<18} weight={weight:.2f}")
    print(f"  {'O':<18} weight={weights[LABEL2ID['O']]:.2f}  (baseline)\n")
    return weights


class WeightedTrainer(Trainer):
    """Trainer using class-weighted token-level cross-entropy."""

    def __init__(
        self,
        *args: Any,
        class_weights: list[float] | None = None,
        **kwargs: Any,
    ) -> None:
        super().__init__(*args, **kwargs)
        self.class_weights = (
            torch.tensor(class_weights, dtype=torch.float32, device=self.args.device)
            if class_weights is not None
            else None
        )

    def compute_loss(
        self,
        model: torch.nn.Module,
        inputs: dict[str, torch.Tensor],
        return_outputs: bool = False,
        **_: Any,
    ):
        labels = inputs.get("labels")
        if labels is None:
            raise ValueError("The batch does not contain labels")

        # Do not pass labels to the model: its unweighted loss is unnecessary.
        model_inputs = {key: value for key, value in inputs.items() if key != "labels"}
        outputs = model(**model_inputs)
        logits = outputs.logits

        # Calculate cross-entropy in fp32 even when the forward pass uses fp16.
        # This is more numerically stable and still preserves mixed-precision speed.
        loss_function = torch.nn.CrossEntropyLoss(
            weight=self.class_weights,
            ignore_index=-100,
        )
        loss = loss_function(
            logits.float().reshape(-1, logits.shape[-1]),
            labels.reshape(-1),
        )
        return (loss, outputs) if return_outputs else loss


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fine-tune XLM-RoBERTa for invoice NER"
    )
    parser.add_argument("--data", required=True, help="Training JSONL path")
    parser.add_argument("--val", default=None, help="Optional validation JSONL path")
    parser.add_argument("--base", default="xlm-roberta-base", help="Base model name/path")
    parser.add_argument("--output", default="./model", help="Output model directory")
    parser.add_argument("--epochs", type=int, default=5, help="Training epochs")
    parser.add_argument("--batch", type=int, default=8, help="Per-device batch size")
    parser.add_argument("--lr", type=float, default=3e-5, help="Learning rate")

    precision = parser.add_mutually_exclusive_group()
    precision.add_argument(
        "--fp16",
        dest="fp16",
        action="store_true",
        help="Enable fp16 (automatically enabled on CUDA by default)",
    )
    precision.add_argument(
        "--no-fp16",
        dest="fp16",
        action="store_false",
        help="Disable fp16",
    )
    parser.set_defaults(fp16=None)

    args = parser.parse_args()
    if args.epochs <= 0:
        parser.error("--epochs must be greater than zero")
    if args.batch <= 0:
        parser.error("--batch must be greater than zero")
    if args.lr <= 0:
        parser.error("--lr must be greater than zero")
    return args


def make_training_arguments(args: argparse.Namespace, use_fp16: bool):
    """Build TrainingArguments across Transformers 4.40+ naming changes."""
    keyword_args: dict[str, Any] = {
        "output_dir": args.output,
        "num_train_epochs": args.epochs,
        "per_device_train_batch_size": args.batch,
        "per_device_eval_batch_size": args.batch,
        "learning_rate": args.lr,
        "weight_decay": 0.01,
        "warmup_ratio": 0.1,
        "fp16": use_fp16,
        "dataloader_num_workers": 0,
        "save_strategy": "epoch",
        # Adam states are about 2 GB for XLM-R base. Save model weights only
        # and keep bounded checkpoint history so long runs cannot fill C:.
        "save_only_model": True,
        "save_total_limit": 2,
        "load_best_model_at_end": True,
        "metric_for_best_model": "f1",
        "greater_is_better": True,
        "logging_steps": 10,
        "report_to": "none",
        "seed": SEED,
        "data_seed": SEED,
    }

    parameters = inspect.signature(TrainingArguments.__init__).parameters
    evaluation_name = (
        "eval_strategy" if "eval_strategy" in parameters else "evaluation_strategy"
    )
    keyword_args[evaluation_name] = "epoch"
    return TrainingArguments(**keyword_args)


def main() -> None:
    args = parse_args()
    set_seed(SEED)

    cuda_available = torch.cuda.is_available()
    if args.fp16 is True and not cuda_available:
        raise RuntimeError("--fp16 requires a CUDA GPU")
    use_fp16 = cuda_available if args.fp16 is None else args.fp16

    print("\n=== Invoice NER Training ===")
    if cuda_available:
        print(f"Device     : cuda:0 ({torch.cuda.get_device_name(0)})")
    else:
        print("Device     : CPU (CUDA was not detected)")
    print(f"fp16      : {'enabled' if use_fp16 else 'disabled'}")
    print(f"Base model : {args.base}")
    print(f"Train data : {args.data}")
    print(f"Output     : {args.output}")
    print(f"Epochs     : {args.epochs}\n")

    tokenizer = AutoTokenizer.from_pretrained(args.base, use_fast=True)
    if not tokenizer.is_fast:
        raise RuntimeError("A fast tokenizer is required for offset mapping")

    train_dataset, validation_dataset = make_train_validation_datasets(
        args.data,
        args.val,
        tokenizer,
    )
    print(f"Train samples : {len(train_dataset)}")
    print(f"Val samples   : {len(validation_dataset)}\n")

    class_weights = compute_class_weights(train_dataset, len(BIO_LABELS))
    model = AutoModelForTokenClassification.from_pretrained(
        args.base,
        num_labels=len(BIO_LABELS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
        ignore_mismatched_sizes=True,
    )

    training_args = make_training_arguments(args, use_fp16)
    data_collator = DataCollatorForTokenClassification(
        tokenizer=tokenizer,
        padding=True,
        label_pad_token_id=-100,
        return_tensors="pt",
    )

    trainer_keyword_args: dict[str, Any] = {
        "model": model,
        "args": training_args,
        "train_dataset": train_dataset,
        "eval_dataset": validation_dataset,
        "data_collator": data_collator,
        "compute_metrics": make_compute_metrics(ID2LABEL),
        "class_weights": class_weights,
    }
    # `processing_class` replaced `tokenizer` in newer Transformers releases.
    trainer_parameters = inspect.signature(Trainer.__init__).parameters
    if "processing_class" in trainer_parameters:
        trainer_keyword_args["processing_class"] = tokenizer
    else:
        trainer_keyword_args["tokenizer"] = tokenizer

    trainer = WeightedTrainer(**trainer_keyword_args)
    print(f"Trainer device: {trainer.args.device}\n", flush=True)
    trainer.train()
    trainer.save_model(args.output)
    tokenizer.save_pretrained(args.output)
    print(f"\nModel saved to: {Path(args.output).resolve()}")


if __name__ == "__main__":
    main()
