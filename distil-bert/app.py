from flask import Flask, request, render_template
import torch
from transformers import DistilBertTokenizerFast, DistilBertForSequenceClassification
from transformers_interpret import SequenceClassificationExplainer
from scrapper import get_domain, check_credibility, scrape_text

app = Flask(__name__)

# Load fine-tuned model
tokenizer = DistilBertTokenizerFast.from_pretrained("fine_tuned_distilbert")
model     = DistilBertForSequenceClassification.from_pretrained("fine_tuned_distilbert")
explainer = SequenceClassificationExplainer(model, tokenizer)

def attribution_to_html(word_attributions):
    words = []
    scores = []
    current_word = ""
    current_scores = []
    for token, score in word_attributions:
        if token.startswith("##") and current_word:
            current_word += token[2:]
            current_scores.append(score)
        else:
            if current_word:
                # Save previous word
                words.append(current_word)
                scores.append(sum(current_scores) / len(current_scores))
            current_word = token
            current_scores = [score]
    # Add the last word
    if current_word:
        words.append(current_word)
        scores.append(sum(current_scores) / len(current_scores))

    # Now build HTML
    max_score = max(abs(s) for s in scores) if scores else 1
    html = ""
    for word, score in zip(words, scores):
        norm_score = abs(score) / max_score if max_score else 0
        if score > 0:
            color = f"rgba(0, 255, 0, {norm_score * 0.7 + 0.2})"
        else:
            color = f"rgba(255, 0, 0, {norm_score * 0.7 + 0.2})"
        html += f'<span style="background-color:{color}; padding:2px; border-radius:3px; margin:1px;">{word}</span> '
    return html

@app.route("/", methods=["GET", "POST"])
def home():
    result = {}
    if request.method == "POST":
        text_or_url = request.form["input"]
        if text_or_url.startswith("http"):
            domain = get_domain(text_or_url)
            result["credibility"] = check_credibility(domain)
            text = scrape_text(text_or_url)
        else:
            result["credibility"] = "n/a"
            text = text_or_url

        # Ensure text is not too long for DistilBERT (max 512 tokens including special tokens)
        tokens = tokenizer.tokenize(text)
        if len(tokens) > 510:  # 510 + 2 special tokens = 512
            tokens = tokens[:510]
            text = tokenizer.convert_tokens_to_string(tokens)

        # classify
        inputs = tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        )
        with torch.no_grad():
            logits = model(**inputs).logits
        probs = torch.softmax(logits, dim=1)[0]
        result["label"]      = "FAKE" if probs[1] > probs[0] else "REAL"
        result["confidence"] = round(probs.max().item(), 3)

        # interpret
        attributions = explainer(text)
        html_map = attribution_to_html(attributions)
        result["attention_map"] = html_map

    return render_template("index.html", **result)

if __name__ == "__main__":
    app.run(debug=True)
