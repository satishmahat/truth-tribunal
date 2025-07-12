import { useNavigate } from 'react-router-dom';

function truncateHtml(html, maxLength) {
  const div = document.createElement('div');
  div.innerHTML = html;
  let text = div.textContent || div.innerText || '';
  if (text.length > maxLength) text = text.slice(0, maxLength) + '...';
  return text;
}

function getTimeAgo(date) {
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
}

export default function NewsCard({
  id,
  title,
  content,
  author,
  date,
  image,
  tag,
  time,
  layout = 'list', // 'hero' or 'list'
}) {
  const navigate = useNavigate();
  const displayImg = image;
  const displayTag = tag;
  const displayTime = time || getTimeAgo(date);

  if (layout === 'hero') {
    return (
      <div
        className="relative rounded-xl overflow-hidden shadow-lg cursor-pointer min-h-[350px] flex flex-col justify-end bg-gray-200 w-full h-full group"
        onClick={() => navigate(`/news/${id}`)}
        style={{ minHeight: 350 }}
      >
        {displayImg && (
          <img
            src={displayImg}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover object-center z-0 transition-transform duration-300 group-hover:scale-101"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10" />
        <div className="relative z-20 p-6 flex flex-col gap-3">
          {/* Top row: author, category, time */}
          <div className="flex items-center gap-3 mb-2">
            {author && (
              <span className="bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow border border-gray-800">
                {author}
              </span>
            )}
            {displayTag && (
              <span className="bg-white/80 text-gray-800 text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                {displayTag}
              </span>
            )}
            {displayTime && (
              <span className="flex items-center gap-1 text-xs text-white/80 bg-black/30 px-2 py-1 rounded-full">
                <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {displayTime}
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow mb-1 leading-tight">
            {title}
          </h2>
          <p className="text-white/90 text-base font-medium drop-shadow mb-2">
            {truncateHtml(content, 100)}
          </p>
        </div>
      </div>
    );
  }

  // List layout (side cards)
  return (
    <div
      className="flex gap-4 items-start bg-white rounded-xl shadow p-3 hover:shadow-lg transition cursor-pointer w-full min-h-[110px]"
      onClick={() => navigate(`/news/${id}`)}
    >
      {displayImg && (
        <img
          src={displayImg}
          alt={title}
          className="w-24 h-20 object-cover rounded-lg flex-shrink-0 bg-gray-100"
        />
      )}
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
          {title}
        </h3>
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">
          {truncateHtml(content, 60)}
        </p>
        {/* Time and category row */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mt-auto">
          {/* Clock icon and time */}
          {displayTime && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {displayTime}
            </span>
          )}
          {/* Category/tag */}
          {displayTag && (
            <span className="bg-gray-100 text-gray-900 text-xs font-semibold px-2 py-0.2 rounded-full border border-gray-300">{displayTag}</span>
          )}
        </div>
      </div>
    </div>
  );
} 