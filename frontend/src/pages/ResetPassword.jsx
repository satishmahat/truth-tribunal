import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FaLock, FaCheck, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import logoFull from '../assets/logo-full.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset link');
      navigate('/forgot-password');
      return;
    }

    validateToken();
  }, [token, navigate]);

  const validateToken = async () => {
    try {
      const response = await api.post('/validate-reset-token', { token });
      setIsValidToken(true);
      setUserEmail(response.data.user_email);
    } catch (err) {
      setIsValidToken(false);
      toast.error(err.response?.data?.msg || 'Invalid or expired reset link');
    } finally {
      setIsValidating(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/reset-password', {
        token,
        password: form.password,
        confirm_password: form.confirmPassword
      });
      
      setPasswordReset(true);
      toast.success('Password has been reset successfully');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto mb-4"></div>
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaExclamationTriangle className="text-red-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="w-full bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition flex items-center justify-center gap-2"
              >
                Request New Reset Link
              </Link>
              <Link
                to="/login"
                className="w-full text-gray-600 hover:text-gray-800 transition flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="w-full bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition flex items-center justify-center gap-2"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4 min-h-screen">
      <div className="w-full max-w-4xl bg-white rounded-lg flex flex-col-reverse md:flex-row overflow-hidden shadow-lg">
        {/* Left: Form */}
        <form onSubmit={handleSubmit} className="flex-1 p-8 flex flex-col justify-center space-y-6">
          <div>
            <h2 className="text-3xl text-red-700 mb-2 flex items-center gap-2">
              <FaLock className="text-red-700" size={26} />
              Reset Password
            </h2>
            <p className="text-gray-600 text-sm">
              Create a new password for <strong>{userEmail}</strong>
            </p>
          </div>

          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaLock className="mr-2 text-gray-400" />
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="New password"
              required
              className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaLock className="mr-2 text-gray-400" />
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
              className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Password Requirements:</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Contains uppercase and lowercase letters</li>
              <li>• Contains at least one number</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-800 transition flex items-center justify-center gap-2"
            >
              <FaArrowLeft /> Back to Login
            </Link>
          </div>
        </form>

        {/* Right: Illustration */}
        <div className="flex-1 bg-gradient-to-br from-red-50 via-white to-gray-100 p-8 flex flex-col justify-center items-center gap-8">
          <div className="w-full flex flex-col items-center gap-2">
            <img src={logoFull} alt="Truth Tribunal Logo" className="h-32 w-auto mb-2" />
            <div className="text-gray-700 text-lg font-medium text-center">
              Create New Password
            </div>
            <div className="text-gray-500 text-sm text-center">
              Choose a strong password to secure your account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
