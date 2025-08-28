# Fake News Detection System (FNDS)

A comprehensive, multi-model AI-powered system for detecting fake news and analyzing sentiment in news articles. This project combines state-of-the-art deep learning models with a modern web interface to provide reliable fake news detection and sentiment analysis capabilities.

## 🚀 Project Overview

The FNDS system is designed to combat misinformation by leveraging multiple AI models:
- **DistilBERT-based Fake News Detection**: Fine-tuned transformer model for binary classification (Real/Fake)
- **BiGRU-CNN Sentiment Analysis**: Hybrid neural network for sentiment classification (Positive/Negative)
- **Multi-source Analysis**: Combines text analysis with source credibility assessment
- **Real-time Processing**: Instant analysis with detailed explanations and confidence scores

## 🏗️ Architecture

```
FNDS System
├── Backend (Flask API)
│   ├── Fake News Detection Service
│   ├── Sentiment Analysis Service
│   ├── News Scraping Service
│   └── User Authentication & Management
├── Frontend (React + Vite)
│   ├── Detection Interface
│   ├── Sentiment Analysis Interface
│   ├── News Management System
│   └── Admin Dashboard
├── AI Models
│   ├── DistilBERT (Fake News Detection)
│   ├── BiGRU-CNN (Sentiment Analysis)
│   └── Model Training Scripts
└── Data Processing
    ├── Web Scraping
    ├── Text Preprocessing
    └── Dataset Management
```

## ✨ Key Features

### 🔍 Fake News Detection
- **Text Analysis**: Analyze any text content for authenticity
- **URL Processing**: Direct URL input with automatic text extraction
- **Source Credibility**: Domain-based credibility assessment
- **Confidence Scoring**: Probability-based predictions with uncertainty indicators
- **Explainable AI**: Token-level importance visualization

### 😊 Sentiment Analysis
- **Real-time Analysis**: Instant sentiment classification
- **Confidence Metrics**: Detailed probability scores
- **Visual Feedback**: Interactive confidence bars and indicators
- **Batch Processing**: Handle multiple texts efficiently

### 🌐 Web Interface
- **Responsive Design**: Modern, mobile-friendly interface
- **Real-time Updates**: Live prediction results
- **User Management**: Authentication and role-based access
- **News Management**: CRUD operations for news articles
- **Admin Dashboard**: Comprehensive system monitoring

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT-based security
- **AI/ML**: PyTorch, Transformers, Custom Models
- **Web Scraping**: Newspaper3k, BeautifulSoup

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router DOM
- **HTTP Client**: Axios

### AI Models
- **Fake News Detection**: Fine-tuned DistilBERT
- **Sentiment Analysis**: BiGRU-CNN hybrid architecture
- **Model Serving**: PyTorch inference
- **Interpretability**: Attention maps and token importance

## 📁 Project Structure

```
WORKING-FNDS-system/
├── backend/                    # Main Flask backend
│   ├── app.py                 # Flask application entry point
│   ├── blueprints/            # API route modules
│   ├── services/              # Business logic services
│   ├── models/                # Database models
│   ├── extensions.py          # Flask extensions
│   └── requirements.txt       # Python dependencies
├── frontend/                  # React frontend application
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   ├── package.json           # Node.js dependencies
│   └── vite.config.js         # Vite configuration
├── distil-bert/               # DistilBERT fake news detection
│   ├── app.py                 # Standalone Flask app
│   ├── train.py               # Model training script
│   └── data/                  # Training datasets
├── sentimental-cnn-bigru/      # Sentiment analysis system
│   ├── app.py                 # Flask sentiment analyzer
│   ├── sentiment_analyzer.py  # Model training
│   └── result/                # Trained models
└── README.md                  # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- MySQL 8.0+
- CUDA-compatible GPU (optional, for faster inference)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Model Training
```bash
# Train DistilBERT for fake news detection
cd distil-bert
python train.py

# Train BiGRU-CNN for sentiment analysis
cd sentimental-cnn-bigru
python sentiment_analyzer.py
```

## 📊 Model Performance

### DistilBERT Fake News Detection
- **Accuracy**: 94% on balanced test set
- **Precision**: High precision for fake news detection
- **Recall**: Balanced performance across classes
- **Model Size**: ~66M parameters (distilled from BERT)

### BiGRU-CNN Sentiment Analysis
- **Accuracy**: 87% on IMDb dataset
- **Architecture**: Bidirectional GRU + CNN hybrid
- **Vocabulary**: 10,000 most common words
- **Sequence Length**: Up to 512 tokens

## 🔧 API Endpoints

### Fake News Detection
- `POST /detect` - Analyze text for authenticity
- `POST /detect/report` - Detailed analysis with explanations
- `GET /health` - System health check

### Sentiment Analysis
- `POST /sentiment/analyze` - Analyze text sentiment
- `POST /sentiment/batch` - Batch sentiment analysis

### News Management
- `GET /news` - Retrieve news articles
- `POST /news` - Create new article
- `PUT /news/:id` - Update article
- `DELETE /news/:id` - Delete article

## 🎯 Use Cases

- **Journalists**: Verify article authenticity before publication
- **News Readers**: Fact-check articles and social media posts
- **Educators**: Teach media literacy and critical thinking
- **Researchers**: Analyze misinformation patterns
- **Content Moderators**: Screen user-generated content

## 🔒 Security Features

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting and abuse prevention
- Secure API endpoints

## 📈 Performance Optimization

- Model quantization for reduced memory usage
- Batch processing for multiple requests
- Caching for frequently accessed data
- Asynchronous processing for long operations
- GPU acceleration when available

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is for educational and research purposes. Please ensure compliance with local laws and regulations when using this system.

## 🙏 Acknowledgments

- Hugging Face Transformers library
- PyTorch community
- IMDb dataset providers
- Open-source contributors

---

**Note**: This system is designed for educational and research purposes. Always verify results with multiple sources and exercise critical thinking when consuming news content.
