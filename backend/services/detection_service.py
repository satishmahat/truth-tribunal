from __future__ import annotations

import torch
from pathlib import Path
from typing import Dict, List, Tuple

from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from transformers_interpret import SequenceClassificationExplainer


_tokenizer: DistilBertTokenizerFast | None = None
_model: DistilBertForSequenceClassification | None = None
_explainer: SequenceClassificationExplainer | None = None


def _get_model_dir() -> Path:
    # backend/services -> backend
    backend_dir = Path(__file__).resolve().parent.parent
    return backend_dir / "model" / "fine_tuned_distilbert"


def _ensure_loaded() -> None:
    global _tokenizer, _model, _explainer
    if _tokenizer is not None and _model is not None and _explainer is not None:
        return

    model_dir = _get_model_dir()
    if not model_dir.exists():
        raise RuntimeError(f"Model directory not found at {model_dir}")

    _tokenizer = DistilBertTokenizerFast.from_pretrained(str(model_dir))
    _model = DistilBertForSequenceClassification.from_pretrained(str(model_dir))
    _model.eval()
    _explainer = SequenceClassificationExplainer(_model, _tokenizer)


def _truncate_text_to_bert_limit(text: str) -> str:
    assert _tokenizer is not None
    tokens = _tokenizer.tokenize(text)
    if len(tokens) > 510:
        tokens = tokens[:510]
        text = _tokenizer.convert_tokens_to_string(tokens)
    return text


def predict_label_and_probabilities(text: str) -> Tuple[str, Dict[str, float]]:
    """
    Run the classifier and return a tuple of (label, probabilities_dict).
    Label is one of "Real" | "Fake". Probabilities dict has keys "Real" and "Fake".
    """
    _ensure_loaded()
    assert _tokenizer is not None and _model is not None

    text = _truncate_text_to_bert_limit(text)

    inputs = _tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        padding=True,
        max_length=512,
    )
    with torch.no_grad():
        logits = _model(**inputs).logits
    probs_tensor = torch.softmax(logits, dim=1)[0]

    prob_real = float(probs_tensor[0].item())
    prob_fake = float(probs_tensor[1].item())
    label = "Fake" if prob_fake > prob_real else "Real"

    return label, {"Real": prob_real, "Fake": prob_fake}


def _aggregate_word_attributions(word_attributions: List[Tuple[str, float]]) -> Tuple[List[str], List[float]]:
    """
    Merge WordPiece tokens (##) into full words by averaging their scores.
    Returns words and their corresponding average scores.
    """
    words: List[str] = []
    scores: List[float] = []
    current_word = ""
    current_scores: List[float] = []
    for token, score in word_attributions:
        if token.startswith("##") and current_word:
            current_word += token[2:]
            current_scores.append(score)
        else:
            if current_word:
                words.append(current_word)
                scores.append(sum(current_scores) / len(current_scores))
            current_word = token
            current_scores = [score]
    if current_word:
        words.append(current_word)
        scores.append(sum(current_scores) / len(current_scores))
    return words, scores


def explain_text_importances(text: str) -> Tuple[List[str], List[float]]:
    """
    Backward-compatible helper: returns (tokens, abs_importances [0,1]).
    """
    tokens, signed = explain_with_prediction(text)[2:4]
    abs_norm = [abs(v) for v in signed]
    return tokens, abs_norm


def explain_with_prediction(text: str) -> Tuple[str, Dict[str, float], List[str], List[float]]:
    """
    Returns (label, probabilities, tokens, signed_importances) where
    signed_importances are in [-1,1], normalized by max absolute value.
    Positive scores support the predicted label, negative oppose it.
    """
    _ensure_loaded()
    assert _explainer is not None

    # First, get prediction (also truncates)
    label, probs = predict_label_and_probabilities(text)

    # SequenceClassificationExplainer by default explains the predicted class
    text = _truncate_text_to_bert_limit(text)
    attributions = _explainer(text)
    words, scores = _aggregate_word_attributions(attributions)
    if not scores:
        return label, probs, words, []

    max_abs = max(abs(s) for s in scores) or 1.0
    signed_norm = [float(s / max_abs) for s in scores]
    return label, probs, words, signed_norm


