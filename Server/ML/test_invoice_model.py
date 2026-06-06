import argparse
import json
import sys
import joblib
import numpy as np
import re

def predict_keys_from_text(text, vectorizer, model):
    # Split the text into individual lines
    lines = text.strip().split('\n')
    # Initialize a dictionary to store predicted keys and their values
    predictions = {}
    
    # Vectorize each line and predict keys
    for line in lines:
        tokens = re.findall(r'\b\w+\b', line)  # Example tokenization using words
        X = vectorizer.transform(tokens)
        predicted_key = model.predict(X)[0]
        
        # Extract the value based on the predicted key
        predictions[predicted_key] = line.strip()
    
    return predictions

def main():
    parser = argparse.ArgumentParser(description="Run a saved invoice text model against text from stdin.")
    parser.add_argument("--model", required=True, help="Path to the trained model pickle file")
    parser.add_argument("--vectorizer", required=True, help="Path to the vectorizer pickle file")
    args = parser.parse_args()
    
    raw_text = sys.stdin.read().strip()
    if not raw_text:
        print(json.dumps({"error": "Input text is empty"}, ensure_ascii=False, indent=2))
        return 1
    
    result = {
        "inputLength": len(raw_text),
        "modelPath": args.model,
        "vectorizerPath": args.vectorizer,
    }
    
    try:
        vectorizer = joblib.load(args.vectorizer)
        model = joblib.load(args.model)
        
        # Predict keys and values for each extracted text
        predictions = predict_keys_from_text(raw_text, vectorizer, model)
        
        print(json.dumps(predictions, ensure_ascii=False, indent=2))
    except Exception as ex:
        import traceback
        error_info = traceback.format_exc()
        result["error"] = f"{type(ex).__name__}: {ex}\n{error_info}"
        print(json.dumps(result, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

if __name__ == "__main__":
    raise SystemExit(main())