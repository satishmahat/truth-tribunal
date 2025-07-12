import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import logo from '../assets/logo.png';
import logoFull from '../assets/logo-full.png';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/login', form);
      if (res.data.role !== 'admin') throw new Error('Not an admin account');
      const { access_token, ...userData } = res.data;
      login(userData, access_token);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.msg || err.message || 'Login failed');
    }
  };

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4"
    >
      <div className="w-full max-w-4xl bg-white rounded-sm flex flex-col-reverse md:flex-row overflow-hidden">
        {/* Left: Form Fields & Text */}
        <form onSubmit={handleSubmit} className="flex-1 p-8 flex flex-col justify-center space-y-5">
          <h2 className="text-3xl text-red-700 mb-6 flex items-center gap-2">
            <FaUser className="text-red-700" size={26} /> Admin Login
          </h2>

          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaEnvelope className="mr-2 text-gray-400" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaLock className="mr-2 text-gray-400" />
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <button type="submit" className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition text-lg shadow-md mt-2">Login</button>
        </form>
        {/* Right: Illustration or Info */}
        <div className="flex-1 bg-gradient-to-br from-red-50 via-white to-gray-100 p-8 flex flex-col justify-center items-center gap-8">
          <div className="w-full flex flex-col items-center gap-2">
            <img src={logoFull} alt="Truth Tribunal Logo" className="h-32 w-auto mb-2" />
            <div className="text-gray-700 text-lg font-medium text-center">Admin Portal</div>
            <div className="text-gray-500 text-sm text-center">Enter your admin credentials to access the dashboard.</div>
          </div>
        </div>
      </div>
    </div>
  );
} 