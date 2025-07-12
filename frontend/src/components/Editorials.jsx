import { useEffect, useState } from 'react';
import api from '../api/axios';
import NewsCard from './NewsCard';

export const Editorials = () => {

  const [news, setNews] = useState([]);
  useEffect(() => {
    api.get('/news').then(res => setNews(res.data));
  }, []);

  // Split featured (first) and rest
  const featured = news[0];
  const rest = news.slice(1, 4); // Show up to 3 on the right
  return (
    <div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className="flex items-center mb-8">
        <h1 className="text-4xl text-gray-800 whitespace-nowrap">Our Editorials</h1>
        <div className="flex-1 h-0.5 bg-red-800 ml-4 lg:ml-6" />
      </div>
      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6">
        {/* Hero card (left, spans 2 columns on desktop) */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          {featured && (
            <NewsCard
              id={featured.id}
              title={featured.title}
              content={featured.content}
              author={featured.author}
              date={featured.created_at}
              image={featured.cover_image}
              tag={featured.category}
              time={featured.time}
              layout="hero"
            />
          )}
        </div>
        {/* List cards (right) */}
        <div className="flex flex-col gap-6 lg:gap-4">
          {rest.map(article => (
            <NewsCard
              key={article.id}
              id={article.id}
              title={article.title}
              content={article.content}
              author={article.author}
              date={article.created_at}
              image={article.cover_image}
              tag={article.category}
              time={article.time}
              layout="list"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
