import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function NewsDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);

  useEffect(() => {
    api.get(`/news/${id}`).then(res => setArticle(res.data));
  }, [id]);

  if (!article) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-red-50 py-10 px-4 flex flex-col items-center">
      <div className="bg-white rounded-sm shadow-sm p-10 max-w-6xl w-full flex flex-col gap-6 border border-red-900">
        {article.cover_image && (
          <img
            src={article.cover_image}
            alt="Cover"
            className="w-full max-h-96 object-cover rounded-lg border border-red-900 mb-4"
          />
        )}
        <h1 className="text-4xl font-extrabold mb-2 text-gray-900">{article.title}</h1>
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="text-black bg-white px-3 py-1 border-1 border-red-900 rounded-full font-medium">By {article.author || 'Unknown'}</span>
          <span className="text-black">
            {article.created_at ?
              new Date(article.created_at).toLocaleString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
                hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short'
              })
              : ''}
          </span>
          {article.category && <span className="ml-4 px-3 py-1 bg-red-900 text-white rounded-full font-medium">{article.category}</span>}
        </div>
        <div className="prose max-w-none text-gray-800 text-lg" dangerouslySetInnerHTML={{ __html: article.content }} />
      </div>
      <button
        className="mt-8 px-5 py-2 bg-red-900 text-white rounded-lg font-semibold shadow hover:bg-red-800 transition  flex items-center gap-2 cursor-pointer"
        onClick={() => navigate(-1)}
      >
        <span className="text-lg">&larr;</span> Back
      </button>
    </div>
  );
} 