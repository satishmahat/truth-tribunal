import { Link } from 'react-router-dom';
import { FiAlertTriangle } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50"
         style={{ minHeight: 'calc(100vh - 3.6rem)' }}
    >
      <div className="flex flex-col items-center">
        <FiAlertTriangle className="text-6xl text-red-800 mb-4" />
        <h1 className="text-7xl font-extrabold text-red-800 mb-2 tracking-tight">404</h1>
        <p className="text-2xl text-gray-800 mb-2 font-semibold">Page Not Found</p>
        <p className="text-gray-500 mb-6 text-center max-w-md">Sorry, the page you are looking for does not exist or has been moved.</p>
        <Link
          to="/"
          className="inline-block bg-red-800 hover:bg-red-700 text-white px-6 py-2 rounded-full shadow transition"
        >
          Go back to Homepage
        </Link>
      </div>
    </div>
  );
} 