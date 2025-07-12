import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FiLogOut, FiLogIn } from 'react-icons/fi';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-14 ">
          {/* Logo/Brand */}
          <Link to="/" className="text-2xl font-medium tracking-tight text-red-700 select-none flex items-center gap-2">
            {/* Optionally add an icon here */}
            Truth Tribunal
          </Link>
          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {!user && (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="p-2 rounded-full hover:bg-gray-800 transition flex items-center justify-center cursor-pointer"
                  title="Login"
                  aria-label="Login"
                >
                  <FiLogIn className="text-xl text-red-600" />
                </button>
              </>
            )}
            {user?.role === 'reporter' && (
              <Link to="/reporter" className="text-gray-300 hover:text-red-600 font-medium transition">Dashboard</Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="text-gray-300 hover:text-red-600 font-medium transition">Admin Panel</Link>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-800 transition flex items-center justify-center cursor-pointer"
                title="Logout"
                aria-label="Logout"
              >
                <FiLogOut className="text-xl text-red-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 