from flask import Flask, request, jsonify, render_template
import torch
import torch.nn as nn
import re
from collections import Counter
from itertools import chain
import os

app = Flask(__name__)

# Model class definition (same as in sentiment_analyzer.py)
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
        assert (text < self.embedding.num_embeddings).all(), f"Input index out of range for embedding: max {text.max().item()}, vocab size {self.embedding.num_embeddings}"
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

# Global variables for model and vocab
model = None
vocab = None
device = None
MAX_SEQ_LEN = 512

def load_model():
    global model, vocab, device
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")
    
    # Model hyperparameters - updated to match the trained model
    VOCAB_SIZE = 20002  # Updated to match the trained model
    EMBEDDING_DIM = 256
    HIDDEN_DIM = 250
    OUTPUT_DIM = 1
    N_LAYERS = 1
    BIDIRECTIONAL = True
    DROPOUT_LSTM = 0.0  # Set to 0 since num_layers=1
    CNN_KERNEL_SIZES = [2, 3, 4, 5]
    CNN_NUM_FILTERS = 96
    DROPOUT_CNN = 0.4
    FC_HIDDEN_DIM = 32
    DROPOUT_FC = 0.4
    PAD_IDX = 0
    
    # Initialize model
    model = BiGRU_CNN(VOCAB_SIZE, EMBEDDING_DIM, HIDDEN_DIM, OUTPUT_DIM, N_LAYERS, 
                      BIDIRECTIONAL, DROPOUT_LSTM, CNN_KERNEL_SIZES, CNN_NUM_FILTERS, 
                      DROPOUT_CNN, FC_HIDDEN_DIM, DROPOUT_FC, PAD_IDX).to(device)
    
    # Load trained model weights
    model_path = 'result/bigru_cnn_sentiment.pt'
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.eval()
        print(f"Model loaded from {model_path}")
    else:
        print(f"Warning: Model file {model_path} not found. Please train the model first.")
        return False
    
    # For now, create a simple vocabulary for inference
    # In a production environment, you should save and load the actual vocabulary from training
    vocab = {'<pad>': 0, '<unk>': 1}
    
    # Add some common words to the vocabulary
    common_words = [
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
        'good', 'bad', 'great', 'terrible', 'excellent', 'awful', 'amazing', 'horrible',
        'love', 'hate', 'like', 'dislike', 'enjoy', 'enjoyed', 'enjoying',
        'movie', 'film', 'book', 'product', 'service', 'food', 'restaurant',
        'acting', 'plot', 'story', 'quality', 'price', 'value', 'experience',
        'fantastic', 'wonderful', 'amazing', 'brilliant', 'outstanding',
        'terrible', 'awful', 'horrible', 'disgusting', 'disappointing',
        'recommend', 'recommended', 'avoid', 'never', 'always', 'best', 'worst'
    ]
    
    for i, word in enumerate(common_words, start=2):
        vocab[word] = i
    
    print("Model and vocabulary loaded successfully")
    return True

def preprocess_text(text):
    """Preprocess text for sentiment analysis"""
    # Convert to lowercase and tokenize
    tokens = re.findall(r'\w+', text.lower())
    
    # Convert tokens to indices
    ids = [vocab.get(token, vocab['<unk>']) for token in tokens]
    
    # Pad/truncate to MAX_SEQ_LEN
    if len(ids) < MAX_SEQ_LEN:
        ids += [vocab['<pad>']] * (MAX_SEQ_LEN - len(ids))
    else:
        ids = ids[:MAX_SEQ_LEN]
    
    return torch.tensor([ids], dtype=torch.long).to(device)

def predict_sentiment(text):
    """Predict sentiment for given text"""
    if model is None:
        return {"error": "Model not loaded"}
    
    try:
        # Preprocess text
        input_tensor = preprocess_text(text)
        
        # Get prediction
        with torch.no_grad():
            prediction = model(input_tensor)
            probability = torch.sigmoid(prediction).item()
            sentiment = "Positive" if probability > 0.5 else "Negative"
            confidence = probability if sentiment == "Positive" else 1 - probability
        
        return {
            "sentiment": sentiment,
            "confidence": round(confidence * 100, 2),
            "probability": round(probability * 100, 2)
        }
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    """API endpoint for sentiment prediction"""
    try:
        data = request.get_json()
        text = data.get('text', '').strip()
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        result = predict_sentiment(text)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/health')
def health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

if __name__ == '__main__':
    # Load model on startup
    if load_model():
        print("Starting Flask app...")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load model. Please ensure the model is trained first.") 