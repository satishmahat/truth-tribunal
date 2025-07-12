import { useState } from 'react';
import ReporterLogin from './ReporterLogin';
import AdminLogin from './AdminLogin';
import Register from './Register';

const TABS = [
  { key: 'reporter', label: 'Reporter Login' },
  { key: 'register', label: 'Register' },
  { key: 'admin', label: 'Admin Login' },
];

export default function LoginDashboard() {
  const [tab, setTab] = useState('reporter');

  // For animation: get index of active tab
  const activeIdx = TABS.findIndex(t => t.key === tab);

  return (
    <div className="bg-gradient-to-br from-white via-gray-100 to-red-50 flex flex-col items-center py-10 px-4"
    style={{ minHeight: 'calc(100vh - 3.6rem)' }}
    >
      <div className="w-full max-w-7xl flex flex-col md:flex-row overflow-hidden transition-all duration-200">
        {/* Responsive tab navigation */}
        <div className="relative w-full md:w-56 flex flex-row md:flex-col border-b md:border-b-0 md:border-r border-gray-200 z-10">
          {/* Animated active indicator */}
          <div
            className={
              `absolute transition-all duration-300 bg-gradient-to-r md:bg-gradient-to-b from-red-700 to-red-500 ` +
              `rounded-b md:rounded-r`
            }
            style={
              window.innerWidth < 768
                ? {
                    left: `${activeIdx * (100 / TABS.length)}%`,
                    bottom: 0,
                    width: `${100 / TABS.length}%`,
                    height: '0.25rem',
                  }
                : {
                    top: `${activeIdx * 64}px`,
                    left: 0,
                    width: '0.375rem',
                    height: '3rem',
                  }
            }
          />
          <div className="flex flex-row md:flex-col w-full">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 text-center md:text-left px-4 md:px-8 py-3 md:py-4 text-base md:text-lg transition-all duration-200 focus:outline-none
                  ${tab === t.key
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:text-red-700'}
                `}
                style={{ minWidth: 0, minHeight: 48 }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* Form card */}
        <div className="flex-1 flex items-center justify-center transition-all duration-200">
          <div className="w-full">
            {tab === 'reporter' && <ReporterLogin />}
            {tab === 'register' && <Register />}
            {tab === 'admin' && <AdminLogin />}
          </div>
        </div>
      </div>
    </div>
  );
} 