import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { FaTrash } from 'react-icons/fa';

export const NewsList = () => {

  const { user, token } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    api.get(`/news/reporter/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setArticles(res.data);
        setError(null);
      })
      .catch(err => {
        setError('Failed to fetch articles');
        setArticles([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      setLoading(true);
      await api.delete(`/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArticles(articles => articles.filter(a => a.id !== id));
    } catch (err) {
      setError('Failed to delete article');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading articles...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!articles.length) return <div className="text-gray-500">No articles posted yet.</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl text-gray-900 mb-4">Your Published Articles</h2>
      {articles.map(article => (
        <div key={article.id} className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row gap-4 border border-gray-100">
          {article.cover_image && (
            <img src={article.cover_image} alt="cover" className="w-32 h-32 object-cover rounded-md border border-gray-200" />
          )}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-red-900">{article.title}</span>
              <span className=" text-xs text-gray-600">{article.created_at ? new Date(article.created_at).toLocaleString() : ''}</span>
              <button
                className="ml-auto text-red-600 hover:text-red-800 p-2 rounded-full focus:outline-none"
                title="Delete Article"
                onClick={() => handleDelete(article.id)}
                disabled={loading}
              >
                <FaTrash />
              </button>
            </div>
            <div className="text-sm text-gray-700 mb-1"><b>Category:</b> {article.category || 'Uncategorized'}</div>
            <div className="text-sm text-gray-600 line-clamp-3" dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
          
        </div>
      ))}
    </div>
  );
}
