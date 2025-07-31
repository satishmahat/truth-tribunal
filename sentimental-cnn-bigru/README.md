# Sentiment Analysis Web Application

This is a Flask-based web application that uses a BiGRU-CNN hybrid model for sentiment analysis. The application provides a user-friendly web interface where users can input text and receive sentiment predictions.

## Features

- **Modern Web UI**: Clean, responsive design with real-time sentiment analysis
- **BiGRU-CNN Model**: Advanced neural network architecture combining Bidirectional GRU and CNN
- **Real-time Analysis**: Instant sentiment prediction with confidence scores
- **Example Texts**: Pre-loaded examples to test the system
- **Error Handling**: Comprehensive error handling and user feedback

## Project Structure

```
sentimental-cnn-bigru/
├── sentiment_analyzer.py    # Training script for the model
├── app.py                   # Flask web application
├── templates/
│   └── index.html          # Web UI template
├── requirements.txt         # Python dependencies
├── README.md               # This file
└── result/                 # Model outputs and saved models
    └── bigru_cnn_sentiment.pt  # Trained model weights
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train the Model (if not already trained)

First, run the training script to create the model:

```bash
python sentiment_analyzer.py
```

This will:
- Download the IMDb dataset
- Train the BiGRU-CNN model
- Save the trained model to `result/bigru_cnn_sentiment.pt`

### 3. Run the Web Application

```bash
python app.py
```

The application will start on `http://localhost:5000`

## Usage

1. **Open the Web Interface**: Navigate to `http://localhost:5000` in your browser
2. **Enter Text**: Type or paste the text you want to analyze in the text area
3. **Analyze**: Click the "Analyze Sentiment" button
4. **View Results**: The application will display:
   - Sentiment prediction (Positive/Negative)
   - Confidence score
   - Visual confidence bar

### Example Usage

Try these example texts:
- **Positive**: "This movie was absolutely fantastic! The acting was superb and the plot was engaging from start to finish."
- **Negative**: "This was the worst experience ever. Terrible service and poor quality. I would never recommend this to anyone."

## API Endpoints

### POST `/api/predict`
Analyze the sentiment of provided text.

**Request:**
```json
{
    "text": "Your text here"
}
```

**Response:**
```json
{
    "sentiment": "Positive",
    "confidence": 85.5,
    "probability": 85.5
}
```

### GET `/api/health`
Check the health status of the application.

**Response:**
```json
{
    "status": "healthy",
    "model_loaded": true
}
```

## Model Architecture

The sentiment analysis model uses a hybrid architecture:

- **Embedding Layer**: Converts words to dense vectors
- **Bidirectional GRU**: Captures sequential patterns in both directions
- **CNN Layers**: Multiple convolutional layers with different kernel sizes (2, 3, 4, 5)
- **Max Pooling**: Extracts the most important features
- **Fully Connected Layers**: Final classification layers

## Technical Details

- **Framework**: PyTorch for model, Flask for web server
- **Dataset**: IMDb movie reviews (50K reviews)
- **Vocabulary Size**: 10,000 most common words
- **Sequence Length**: 512 tokens maximum
- **Model Size**: ~2.5M parameters

## Troubleshooting

### Common Issues

1. **Model not found error**: Ensure you've run `sentiment_analyzer.py` first to train the model
2. **CUDA errors**: The model will automatically use CPU if CUDA is not available
3. **Port already in use**: Change the port in `app.py` or kill the process using port 5000

### Performance Tips

- For production deployment, consider using a WSGI server like Gunicorn
- The model loads into memory on startup for faster inference
- Consider model quantization for reduced memory usage

## Development

To modify the application:

1. **UI Changes**: Edit `templates/index.html`
2. **API Changes**: Modify `app.py`
3. **Model Changes**: Update `sentiment_analyzer.py` and retrain

## License

This project is for educational and research purposes. 