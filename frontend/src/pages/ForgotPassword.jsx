import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import logoFull from '../assets/logo-full.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/forgot-password', { email });
      setEmailSent(true);
      toast.success('If an account with that email exists, a password reset link has been sent');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4 min-h-screen">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaEnvelope className="text-green-600 text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-2 list-decimal list-inside space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the reset link in the email</li>
                <li>Create a new password</li>
              </ol>
            </div>
            <div className="space-y-3">
              <Link
                to="/login"
                className="w-full bg-red-700 text-white py-2 px-4 rounded-lg hover:bg-red-800 transition flex items-center justify-center gap-2"
              >
                <FaArrowLeft /> Back to Login
              </Link>
              <button
                onClick={() => setEmailSent(false)}
                className="w-full text-gray-600 hover:text-gray-800 transition"
              >
                Try different email
              </button>
            </div>
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
              <FaEnvelope className="text-red-700" size={26} />
              Forgot Password
            </h2>
            <p className="text-gray-600 text-sm">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaEnvelope className="mr-2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition text-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
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
              Forgot Your Password?
            </div>
            <div className="text-gray-500 text-sm text-center">
              No worries! We'll help you get back into your account.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
