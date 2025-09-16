import torch
import torch.nn.functional as F
import numpy as np
import re
from typing import List, Tuple, Dict
from pathlib import Path


def _get_sentiment_model_dir() -> Path:
    # backend/services -> backend
    backend_dir = Path(__file__).resolve().parent.parent
    return backend_dir / "model" / "sentiment"


def _load_sentiment_assets():
    """Load sentiment model and vocabulary"""
    model_dir = _get_sentiment_model_dir()
    vocab_path = model_dir / 'vocab.pt'
    model_path = model_dir / 'bigru_cnn_sentiment.pt'
    
    if not vocab_path.exists() or not model_path.exists():
        raise RuntimeError(f"Sentiment model assets not found at {model_dir}")
    
    vocab = torch.load(vocab_path, map_location='cpu')
    return vocab, model_path


def _preprocess_text_for_sentiment(text: str, vocab: Dict[str, int], max_seq_len: int = 512) -> Tuple[List[str], torch.Tensor]:
    """Preprocess text and return tokens and tensor"""
    tokens = re.findall(r'\w+', text.lower())
    ids = [vocab.get(token, vocab.get('<unk>', 1)) for token in tokens]
    
    if len(ids) < max_seq_len:
        ids += [vocab.get('<pad>', 0)] * (max_seq_len - len(ids))
    else:
        ids = ids[:max_seq_len]
    
    return tokens, torch.tensor([ids], dtype=torch.long)


def _compute_gradients(model, input_tensor, target_class):
    """Compute gradients for input tokens"""
    input_tensor.requires_grad_(True)
    
    # Forward pass
    embedded = model.embedding(input_tensor)
    gru_out, _ = model.gru(embedded)
    gru_out = gru_out.permute(0, 2, 1)
    
    conv_outs = [torch.relu(conv(gru_out)) for conv in model.convs]
    pooled = [torch.max(conv_out, dim=2)[0] for conv_out in conv_outs]
    cat = torch.cat(pooled, dim=1)
    x = model.dropout_cnn(cat)
    x = torch.relu(model.fc1(x))
    x = model.dropout_fc(x)
    logits = model.fc2(x)
    
    # Compute loss for target class
    if target_class == 1:  # Positive
        loss = -torch.log(torch.sigmoid(logits) + 1e-8)
    else:  # Negative
        loss = -torch.log(1 - torch.sigmoid(logits) + 1e-8)
    
    # Backward pass
    loss.backward()
    
    # Get gradients for embedding layer
    gradients = input_tensor.grad
    return gradients


def explain_sentiment_with_prediction(text: str) -> Tuple[str, Dict[str, float], List[str], List[float]]:
    """
    Explain sentiment prediction with token importance using gradient-based attribution.
    Returns (sentiment_label, probabilities, tokens, signed_importances)
    """
    try:
        vocab, model_path = _load_sentiment_assets()
        
        # Model parameters (matching the training script)
        VOCAB_SIZE = len(vocab)
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
        
        # Import the model class
        import sys
        sys.path.append(str(Path(__file__).parent.parent / "blueprints"))
        from sentiment import BiGRU_CNN
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = BiGRU_CNN(
            VOCAB_SIZE, EMBEDDING_DIM, HIDDEN_DIM, OUTPUT_DIM, N_LAYERS,
            BIDIRECTIONAL, DROPOUT_GRU, CNN_KERNEL_SIZES, CNN_NUM_FILTERS,
            DROPOUT_CNN, FC_HIDDEN_DIM, DROPOUT_FC, PAD_IDX
        ).to(device)
        
        state = torch.load(model_path, map_location=device)
        model.load_state_dict(state)
        model.eval()
        
        # Preprocess text
        tokens, input_tensor = _preprocess_text_for_sentiment(text, vocab)
        input_tensor = input_tensor.to(device)
        
        # Get prediction
        with torch.no_grad():
            logits = model(input_tensor)
            prob_pos = torch.sigmoid(logits).item()
        
        sentiment = "Positive" if prob_pos > 0.5 else "Negative"
        probabilities = {
            "Positive": round(prob_pos * 100, 2),
            "Negative": round((1 - prob_pos) * 100, 2)
        }
        
        # Use gradient-based attribution with respect to embeddings (like detection service)
        # First get embeddings without gradients
        with torch.no_grad():
            embedded = model.embedding(input_tensor)
        
        # Now enable gradients on embeddings
        embedded.requires_grad_(True)
        
        # Temporarily switch model to training mode for gradient computation
        model.train()
        
        try:
            # Forward pass from embeddings
            gru_out, _ = model.gru(embedded)
            gru_out_permuted = gru_out.permute(0, 2, 1)
            conv_outs = [torch.relu(conv(gru_out_permuted)) for conv in model.convs]
            pooled = [torch.max(conv_out, dim=2)[0] for conv_out in conv_outs]
            cat = torch.cat(pooled, dim=1)
            x = model.dropout_cnn(cat)
            x = torch.relu(model.fc1(x))
            x = model.dropout_fc(x)
            logits_grad = model.fc2(x)
            
            # Compute loss for the predicted class
            if sentiment == "Positive":
                loss = -torch.log(torch.sigmoid(logits_grad) + 1e-8)
            else:
                loss = -torch.log(1 - torch.sigmoid(logits_grad) + 1e-8)
            
            # Backward pass
            loss.backward()
            
            # Get gradients for embeddings
            embedding_gradients = embedded.grad[0].cpu().numpy()  # [seq_len, embedding_dim]
            
        finally:
            # Always switch back to eval mode
            model.eval()
        
        # Compute token importance based on embedding gradients
        token_importances = []
        signed_importances = []
        
        for i, token in enumerate(tokens):
            if i < embedding_gradients.shape[0]:
                # Use L2 norm of embedding gradients as importance
                importance = np.linalg.norm(embedding_gradients[i])
                
                # For signed importance, use the mean of gradients
                # Positive mean supports the prediction, negative opposes it
                gradient_mean = np.mean(embedding_gradients[i])
                if sentiment == "Positive":
                    sign = 1 if gradient_mean >= 0 else -1
                else:
                    sign = 1 if gradient_mean <= 0 else -1
                
                signed_importance = sign * importance
            else:
                importance = 0.0
                signed_importance = 0.0
            
            token_importances.append(importance)
            signed_importances.append(signed_importance)
        
        # Normalize importances similar to detection service
        if token_importances:
            max_abs = max(abs(s) for s in signed_importances) or 1.0
            signed_importances = [float(s / max_abs) for s in signed_importances]
        
        return sentiment, probabilities, tokens, signed_importances
        
    except Exception as e:
        raise RuntimeError(f"Sentiment explanation failed: {str(e)}")


def predict_sentiment_with_probabilities(text: str) -> Tuple[str, Dict[str, float]]:
    """
    Predict sentiment and return probabilities.
    Returns (sentiment_label, probabilities_dict)
    """
    try:
        vocab, model_path = _load_sentiment_assets()
        
        # Model parameters
        VOCAB_SIZE = len(vocab)
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
        
        # Import the model class
        import sys
        sys.path.append(str(Path(__file__).parent.parent / "blueprints"))
        from sentiment import BiGRU_CNN
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model = BiGRU_CNN(
            VOCAB_SIZE, EMBEDDING_DIM, HIDDEN_DIM, OUTPUT_DIM, N_LAYERS,
            BIDIRECTIONAL, DROPOUT_GRU, CNN_KERNEL_SIZES, CNN_NUM_FILTERS,
            DROPOUT_CNN, FC_HIDDEN_DIM, DROPOUT_FC, PAD_IDX
        ).to(device)
        
        state = torch.load(model_path, map_location=device)
        model.load_state_dict(state)
        model.eval()
        
        # Preprocess text
        _, input_tensor = _preprocess_text_for_sentiment(text, vocab)
        input_tensor = input_tensor.to(device)
        
        # Get prediction
        with torch.no_grad():
            logits = model(input_tensor)
            prob_pos = torch.sigmoid(logits).item()
        
        sentiment = "Positive" if prob_pos > 0.5 else "Negative"
        probabilities = {
            "Positive": round(prob_pos * 100, 2),
            "Negative": round((1 - prob_pos) * 100, 2)
        }
        
        return sentiment, probabilities
        
    except Exception as e:
        raise RuntimeError(f"Sentiment prediction failed: {str(e)}")
