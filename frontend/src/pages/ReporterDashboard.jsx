import { useState } from 'react';
import NewsForm from '../components/NewsForm';
import { useAuth } from '../auth/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaNewspaper } from 'react-icons/fa';
import { NewsList } from '../components/NewsList';

const TABS = [
  { key: 'newsform', label: 'News Form', icon: <FaNewspaper /> },
  { key: 'published', label: 'Published Articles', icon: <FaNewspaper /> },
];

export default function ReporterDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('newsform');

  // Fallbacks for missing user info
  const profileImg = user?.profile_photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user?.name || 'Reporter');
  const name = user?.name || 'Reporter';
  const email = user?.email || 'No email';
  const phone = user?.phone_number || 'No number';

  return (
    <div
      className="bg-gradient-to-br from-white via-gray-100 to-red-50 flex flex-col items-center py-6 px-2 sm:py-8 sm:px-4"
      style={{ minHeight: 'calc(100vh - 3.6rem)' }}
    >
      <div
        className="flex flex-col lg:flex-row w-full max-w-7xl overflow-hidden transition-all duration-200 mx-auto px-4 sm:px-6 lg:px-8 mb-8"
      >
        {/* Sidebar */}
        <aside
          className="bg-gradient-to-r from-red-900 to-red-800 text-white w-full lg:w-72 flex-shrink-0 flex flex-col items-center py-6 px-2 sm:py-10 sm:px-4 min-h-0 lg:min-h-screen shadow-lg"
        >
          <div className="flex flex-col items-center w-full">
            <img
              src={profileImg}
              alt="Profile"
              className="h-20 w-20 sm:h-26 sm:w-26 rounded-full object-cover border-2 border-white shadow mb-3 sm:mb-4 bg-white"
              onError={e => { e.target.src = 'https://ui-avatars.com/api/?name=Reporter'; }}
            />
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <FaUser className="text-white/80 text-base sm:text-lg" />
              <span className="font-bold text-base sm:text-lg">{name}</span>
            </div>
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <FaPhone className="text-white/80 text-base sm:text-lg" />
              <span className="text-xs sm:text-sm">{phone}</span>
            </div>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <FaEnvelope className="text-white/80 text-base sm:text-lg" />
              <span className="text-xs sm:text-sm break-all">{email}</span>
            </div>
          </div>
          {/* Tabs */}
          <nav className="w-full mt-2 sm:mt-4 flex flex-col gap-1 sm:gap-2">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 w-full text-left focus:outline-none ${tab === t.key ? 'bg-white/90 text-red-800 shadow' : 'hover:bg-white/20'}`}
              >
                <span className="text-lg sm:text-xl">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-start py-6 px-2 sm:py-10 sm:px-4">
          <div className="w-full max-w-4xl">
            {tab === 'newsform' && <NewsForm />}
            {tab === 'published' && <NewsList/>}
          </div>
        </main>
      </div>
    </div>
  );
} 