import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUser, FaEnvelope, FaLock, FaKey } from 'react-icons/fa';
import logo from '../assets/logo.png';
import logoFull from '../assets/logo-full.png';

export default function ReporterLogin() {
  const [form, setForm] = useState({ email: '', password: '', license_key: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const res = await api.post('/login', form);
      if (res.data.role !== 'reporter') throw new Error('Not a reporter account');
      const { access_token, ...userData } = res.data;
      login(userData, access_token);
      navigate('/reporter');
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
          <h2 className="text-3xl text-red-700 mb-2 flex items-center gap-2">
            <FaUser className="text-red-700" size={26} /> Reporter Login
          </h2>
          <p className="text-gray-600 mb-4 text-sm">Only approved reporters can login. Ask admin for your license key after registration.</p>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaEnvelope className="mr-2 text-gray-400" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaLock className="mr-2 text-gray-400" />
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaKey className="mr-2 text-gray-400" />
            <input name="license_key" value={form.license_key} onChange={handleChange} placeholder="License Key" required className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <button type="submit" className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition text-lg shadow-md mt-2">Login</button>
        </form>
        {/* Right: Illustration or Info */}
        <div className="flex-1 bg-gradient-to-br from-red-50 via-white to-gray-100 p-8 flex flex-col justify-center items-center gap-8">
          <div className="w-full flex flex-col items-center gap-2">
            <img src={logoFull} alt="Truth Tribunal Logo" className="h-32 w-auto mb-2" />
            <div className="text-gray-700 text-lg font-medium text-center">Welcome back, Reporter!</div>
            <div className="text-gray-500 text-sm text-center">Enter your credentials and license key to access your dashboard.</div>
          </div>
        </div>
      </div>
    </div>
  );
} 