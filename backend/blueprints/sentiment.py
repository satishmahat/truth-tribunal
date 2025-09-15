from flask import Blueprint, request, jsonify
import os
import re
import torch
import torch.nn as nn
from services.sentiment_explanation_service import explain_sentiment_with_prediction, predict_sentiment_with_probabilities


sentiment_bp = Blueprint('sentiment', __name__)


# Lazy-loaded globals
_sent_model = None
_sent_vocab = None
_sent_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_MAX_SEQ_LEN = 512


class BiGRU_CNN(nn.Module):
    def __init__(self, vocab_size, embedding_dim, hidden_dim, output_dim, n_layers, bidirectional, dropout_gru, cnn_kernel_sizes, cnn_num_filters, dropout_cnn, fc_hidden_dim, dropout_fc, pad_idx):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embedding_dim, padding_idx=pad_idx)
        self.gru = nn.GRU(embedding_dim, hidden_dim, num_layers=n_layers,
                          bidirectional=bidirectional, batch_first=True, dropout=dropout_gru)
        self.convs = nn.ModuleList([
            nn.Conv1d(in_channels=hidden_dim*2, out_channels=cnn_num_filters, kernel_size=k)
            for k in cnn_kernel_sizes
        ])
        self.dropout_cnn = nn.Dropout(dropout_cnn)
        self.fc1 = nn.Linear(len(cnn_kernel_sizes)*cnn_num_filters, fc_hidden_dim)
        self.dropout_fc = nn.Dropout(dropout_fc)
        self.fc2 = nn.Linear(fc_hidden_dim, output_dim)

    def forward(self, text):
        embedded = self.embedding(text)
        gru_out, _ = self.gru(embedded)
        gru_out = gru_out.permute(0, 2, 1)
        conv_outs = [torch.relu(conv(gru_out)) for conv in self.convs]
        pooled = [torch.max(conv_out, dim=2)[0] for conv_out in conv_outs]
        cat = torch.cat(pooled, dim=1)
        x = self.dropout_cnn(cat)
        x = torch.relu(self.fc1(x))
        x = self.dropout_fc(x)
        return self.fc2(x)


def _load_sentiment_model_if_needed():
    global _sent_model, _sent_vocab
    if _sent_model is not None and _sent_vocab is not None:
        return True

    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'model', 'sentiment')
    vocab_path = os.path.join(base_dir, 'vocab.pt')
    model_path = os.path.join(base_dir, 'bigru_cnn_sentiment.pt')

    if not os.path.exists(vocab_path) or not os.path.exists(model_path):
        return False

    _sent_vocab = torch.load(vocab_path, map_location='cpu')

    VOCAB_SIZE = len(_sent_vocab)
    EMBEDDING_DIM = 256
    HIDDEN_DIM = 250
    OUTPUT_DIM = 1
    N_LAYERS = 1
    BIDIRECTIONAL = True
    DROPOUT_GRU = 0.0
    CNN_KERNEL_SIZES = [2, 3, 4, 5]
    CNN_NUM_FILTERS = 96
    DROPOUT_CNN = 0.4
    FC_HIDDEN_DIM = 32
    DROPOUT_FC = 0.4
    PAD_IDX = 0

    model = BiGRU_CNN(
        VOCAB_SIZE, EMBEDDING_DIM, HIDDEN_DIM, OUTPUT_DIM, N_LAYERS,
        BIDIRECTIONAL, DROPOUT_GRU, CNN_KERNEL_SIZES, CNN_NUM_FILTERS,
        DROPOUT_CNN, FC_HIDDEN_DIM, DROPOUT_FC, PAD_IDX
    ).to(_sent_device)

    state = torch.load(model_path, map_location=_sent_device)
    model.load_state_dict(state)
    model.eval()

    _sent_model = model
    return True


def _preprocess_text_for_sentiment(text):
    tokens = re.findall(r'\w+', text.lower())
    ids = [_sent_vocab.get(token, _sent_vocab.get('<unk>', 1)) for token in tokens]
    if len(ids) < _MAX_SEQ_LEN:
        ids += [_sent_vocab.get('<pad>', 0)] * (_MAX_SEQ_LEN - len(ids))
    else:
        ids = ids[:_MAX_SEQ_LEN]
    return torch.tensor([ids], dtype=torch.long, device=_sent_device)


@sentiment_bp.route('/sentiment', methods=['POST'])
def sentiment_predict():
    if not _load_sentiment_model_if_needed():
        return jsonify({"error": "Sentiment model assets not found. Ensure model and vocab are copied to backend/model/sentiment."}), 500

    data = request.get_json(silent=True) or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        with torch.no_grad():
            input_tensor = _preprocess_text_for_sentiment(text)
            logits = _sent_model(input_tensor)
            prob_pos = torch.sigmoid(logits).item()
        sentiment = "Positive" if prob_pos > 0.5 else "Negative"
        confidence = prob_pos if sentiment == "Positive" else (1 - prob_pos)
        return jsonify({
            "sentiment": sentiment,
            "confidence": round(confidence * 100, 2),
            "probability_positive": round(prob_pos * 100, 2)
        })
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


@sentiment_bp.route('/sentiment/report', methods=['POST'])
def sentiment_report():
    data = request.get_json(silent=True) or {}
    text = (data.get('text') or '').strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        sentiment, probabilities, tokens, signed_importances = explain_sentiment_with_prediction(text)
        return jsonify({
            "sentiment": sentiment,
            "probabilities": probabilities,
            "tokens": tokens,
            "token_importances_signed": signed_importances
        })
    except Exception as e:
        return jsonify({"error": f"Sentiment report failed: {str(e)}"}), 500


