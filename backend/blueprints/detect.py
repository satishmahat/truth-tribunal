from flask import Blueprint, request, jsonify

from services.detection_service import (
    predict_label_and_probabilities,
    explain_text_importances,
    explain_with_prediction,
)
from services.scraper_service import (
    is_url,
    get_domain,
    check_credibility,
    scrape_text,
    credibility_fake_prior,
)


detect_bp = Blueprint("detect", __name__)


@detect_bp.route("/detect", methods=["POST"])
def detect_text():
    data = request.get_json(silent=True) or {}
    original_input = (data.get("text") or "").strip()
    text = original_input
    if not text:
        return jsonify({"error": "Missing text"}), 400

    try:
        source = {"is_url": False}
        if is_url(original_input):
            scraped = scrape_text(original_input)
            if not scraped:
                return jsonify({"error": "Could not extract article text from URL"}), 400
            text = scraped
            domain = get_domain(original_input)
            source = {
                "is_url": True,
                "url": original_input,
                "domain": domain,
                "credibility": check_credibility(domain),
            }
        label, probs = predict_label_and_probabilities(text)

        response = {"label": label, "probabilities": probs, "source": source}

        # For URL inputs, compute a simple adjusted score using source prior
        if source.get("is_url"):
            prior_fake = credibility_fake_prior(source.get("domain", ""), source.get("credibility"))
            fake = float(probs.get("Fake", 0.0))
            real = float(probs.get("Real", 0.0))
            # Weighted blend: 0.7 text, 0.3 source prior
            overall_fake = 0.7 * fake + 0.3 * prior_fake
            overall_fake = max(0.0, min(1.0, overall_fake))
            overall_real = 1.0 - overall_fake
            adjusted_label = "Fake" if overall_fake > overall_real else "Real"
            uncertain = max(overall_fake, overall_real) < 0.6
            response["adjusted"] = {
                "label": adjusted_label,
                "probabilities": {"Real": overall_real, "Fake": overall_fake},
                "method": "url_prior_blend",
                "weights": {"text": 0.7, "source": 0.3},
                "prior_fake": prior_fake,
            }
            response["uncertain"] = uncertain

        return jsonify(response)
    except Exception as exc:  # noqa: BLE001 broad for API safety
        return jsonify({"error": str(exc)}), 500


@detect_bp.route("/detect/report", methods=["POST"])
def detect_report():
    data = request.get_json(silent=True) or {}
    original_input = (data.get("text") or "").strip()
    text = original_input
    if not text:
        return jsonify({"error": "Missing text"}), 400

    try:
        source = {"is_url": False}
        if is_url(original_input):
            scraped = scrape_text(original_input)
            if not scraped:
                return jsonify({"error": "Could not extract article text from URL"}), 400
            text = scraped
            domain = get_domain(original_input)
            source = {
                "is_url": True,
                "url": original_input,
                "domain": domain,
                "credibility": check_credibility(domain),
            }

        label, probs, tokens, signed_importances = explain_with_prediction(text)
        response = {
            "label": label,
            "probabilities": probs,
            "tokens": tokens,
            "token_importances_signed": signed_importances,
            "source": source,
        }

        if source.get("is_url"):
            prior_fake = credibility_fake_prior(source.get("domain", ""), source.get("credibility"))
            fake = float(probs.get("Fake", 0.0))
            real = float(probs.get("Real", 0.0))
            overall_fake = 0.7 * fake + 0.3 * prior_fake
            overall_fake = max(0.0, min(1.0, overall_fake))
            overall_real = 1.0 - overall_fake
            adjusted_label = "Fake" if overall_fake > overall_real else "Real"
            uncertain = max(overall_fake, overall_real) < 0.6
            response["adjusted"] = {
                "label": adjusted_label,
                "probabilities": {"Real": overall_real, "Fake": overall_fake},
                "method": "url_prior_blend",
                "weights": {"text": 0.7, "source": 0.3},
                "prior_fake": prior_fake,
            }
            response["uncertain"] = uncertain

        return jsonify(response)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": str(exc)}), 500


