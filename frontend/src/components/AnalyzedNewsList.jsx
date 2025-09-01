import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export const AnalyzedNewsList = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [analyzedArticles, setAnalyzedArticles] = useState({
    positive: [],
    negative: []
  });
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('positive');

  // Function to remove HTML tags from text
  const stripHtmlTags = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  // Function to analyze sentiment of text
  const analyzeSentiment = async (text) => {
    try {
      const response = await api.post('/sentiment', { text });
      return response.data;
    } catch (err) {
      return { sentiment: 'Unknown', confidence: 0 };
    }
  };

  // Function to analyze all articles
  const analyzeAllArticles = async (articles) => {
    setAnalyzing(true);
    const positive = [];
    const negative = [];

    try {
      for (const article of articles) {
        const cleanText = stripHtmlTags(article.content);
        
        const sentimentResult = await analyzeSentiment(cleanText);
        
        const analyzedArticle = {
          ...article,
          sentiment: sentimentResult.sentiment,
          confidence: sentimentResult.confidence
        };

        if (sentimentResult.sentiment === 'Positive') {
          positive.push(analyzedArticle);
        } else if (sentimentResult.sentiment === 'Negative') {
          negative.push(analyzedArticle);
        }
      }

      setAnalyzedArticles({ positive, negative });
    } catch (error) {
      console.error('Error during sentiment analysis:', error);
      setError('Failed to analyze sentiment for some articles');
    } finally {
      setAnalyzing(false);
    }
  };

  // Fetch articles on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await api.get('/news');
        setArticles(response.data);
        setError(null);
        
        // Analyze articles after fetching
        if (response.data.length > 0) {
          await analyzeAllArticles(response.data);
        } else {
          // If no articles, set loading to false immediately
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching articles:', err);
        setError('Failed to fetch articles');
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  // Handle news card click
  const handleNewsClick = (articleId) => {
    navigate(`/news/${articleId}`);
  };



  // Show loading while waiting for articles
  if (loading) {
    return (
      <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className="flex items-center justify-center py-20">
          <div className="text-gray-500 text-lg">Loading articles...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className="text-center py-20">
          <div className="text-red-600 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  if (!articles.length) {
    return (
      <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className="text-center py-20">
          <div className="text-gray-500 text-lg">No articles found. Please publish some articles first.</div>
        </div>
      </div>
    );
  }

  const currentArticles = analyzedArticles[activeTab] || [];

  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8'>
      {/* Header Section */}
      <div className="flex items-center mb-8">
        <h1 className="text-3xl sm:text-4xl text-gray-800 whitespace-nowrap">Sentiment Based News</h1>
        <div className="flex-1 h-0.5 bg-red-800 mr-4 lg:mr-6" />
        {analyzing && (
          <div className="flex items-center gap-2 text-blue-600 ml-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm">Analyzing...</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-8">
        <button
          onClick={() => setActiveTab('positive')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'positive'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          😊 Positive News ({analyzedArticles.positive.length})
        </button>
        <button
          onClick={() => setActiveTab('negative')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'negative'
              ? 'bg-red-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          😞 Negative News ({analyzedArticles.negative.length})
        </button>
      </div>

      {/* Articles Grid */}
      {currentArticles.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-gray-500 text-lg">
            No {activeTab} articles found.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-6">
          {currentArticles.map((article) => (
            <NewsCard
              key={article.id}
              article={article}
              onClick={() => handleNewsClick(article.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// News Card Component
const NewsCard = ({ article, onClick }) => {
  const stripHtmlTags = (html) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const getTimeAgo = (date) => {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diff = Math.max(0, now - then);
    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;
    const month = 30 * day;
    const year = 365 * day;
    if (diff < hour) return `${Math.max(1, Math.round(diff / min))} Minutes`;
    if (diff < day) return `${Math.round(diff / hour)} Hours`;
    if (diff < month) return `${Math.round(diff / day)} Days`;
    if (diff < year) return `${Math.round(diff / month)} Months`;
    return `${Math.round(diff / year)} Years`;
  };

  const getSentimentColor = (sentiment) => {
    return sentiment === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getSentimentIcon = (sentiment) => {
    return sentiment === 'Positive' ? '😊' : '😞';
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
      onClick={onClick}
    >
      {article.cover_image && (
        <img
          src={article.cover_image}
          alt={article.title}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(article.sentiment)}`}>
            {getSentimentIcon(article.sentiment)} {article.sentiment}
          </span>
          <span className="text-xs text-gray-500">
            {getTimeAgo(article.created_at)}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {article.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {stripHtmlTags(article.content)}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded-full">
            {article.category || 'Uncategorized'}
          </span>
          <span className="font-medium">
            Confidence: {Math.round(article.confidence)}%
          </span>
        </div>
      </div>
    </div>
  );
};
