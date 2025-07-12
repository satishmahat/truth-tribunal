import { useState } from 'react';
import api from '../api/axios';
import { FaUser, FaEnvelope, FaLock, FaPhone, FaIdCard, FaImage } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone_number: '',
    citizenship_number: '',
  });
  const [msg, setMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [idCardFile, setIdCardFile] = useState(null);
  const [idCardPreview, setIdCardPreview] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    if (type === 'profile') {
      if (file.size > 200 * 1024) {
        toast.error('Profile photo must be less than 200KB');
        return;
      }
      setProfileFile(file);
      setProfilePreview(URL.createObjectURL(file));
    } else if (type === 'idcard') {
      if (file.size > 300 * 1024) {
        toast.error('ID Card image must be less than 300KB');
        return;
      }
      setIdCardFile(file);
      setIdCardPreview(URL.createObjectURL(file));
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    const res = await fetch(CLOUDINARY_CONFIG.UPLOAD_URL, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!profileFile || !idCardFile) {
      toast.error('Please select both profile photo and ID card image.');
      return;
    }
    setUploading(true);
    try {
      const [profileUrl, idCardUrl] = await Promise.all([
        uploadToCloudinary(profileFile),
        uploadToCloudinary(idCardFile)
      ]);
      const payload = {
        ...form,
        profile_photo_url: profileUrl,
        reporter_id_card_url: idCardUrl
      };
      await api.post('/register', payload);
      toast.success('Registration submitted! Please wait for admin approval and your license key.');
      setForm({
        name: '',
        email: '',
        password: '',
        phone_number: '',
        citizenship_number: '',
      });
      setProfileFile(null);
      setProfilePreview(null);
      setIdCardFile(null);
      setIdCardPreview(null);
      setSubmitted(true);
    } catch (err) {
      toast.error('Registration or image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center bg-gradient-to-br from-white via-gray-100 to-red-50 py-4 px-4"
    >
      <div className="w-full max-w-4xl bg-white rounded-sm flex flex-col md:flex-row overflow-hidden">
        {/* Left: Form Fields & Text */}
        <form onSubmit={handleSubmit} className="flex-1 p-8 flex flex-col justify-center space-y-5">
          <h2 className="text-3xl text-red-700 mb-2 flex items-center gap-2">
            <FaUser className="text-red-700" size={26} /> Register as Reporter
          </h2>
          <p className="text-gray-600 mb-4 text-sm">Fill in your details to join Truth Tribunal as a reporter. Please provide valid information and clear images for verification.</p>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaUser className="mr-2 text-gray-400" />
            <input name="name" value={form.name} onChange={handleChange} placeholder="Full Name" required disabled={submitted} className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaEnvelope className="mr-2 text-gray-400" />
            <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required disabled={submitted} className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaLock className="mr-2 text-gray-400" />
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Password" required disabled={submitted} className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaPhone className="mr-2 text-gray-400" />
            <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Phone Number" required disabled={submitted} className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <div className="flex items-center border border-gray-200 rounded-lg px-3 py-2 bg-gray-50">
            <FaIdCard className="mr-2 text-gray-400" />
            <input name="citizenship_number" value={form.citizenship_number} onChange={handleChange} placeholder="Citizenship Number" required disabled={submitted} className="w-full bg-transparent outline-none text-gray-800 placeholder-gray-400" />
          </div>
          <button type="submit" disabled={submitted || uploading} className="w-full bg-red-700 text-white py-2 rounded-lg hover:bg-red-800 transition disabled:opacity-50 text-lg shadow-md mt-2">{uploading ? 'Registering...' : 'Register'}</button>
          {/* Toasts are now used for messages */}
        </form>
        {/* Right: Image Uploads & Previews */}
        <div className="flex-1 bg-gradient-to-br from-red-50 via-white to-gray-100 p-8 flex flex-col justify-center items-center gap-8">
          <div className="w-full flex flex-col items-center gap-2">
            <label className="flex items-center gap-2 text-gray-700 font-medium">
              <FaImage className="text-red-700" /> Profile Photo (max 200KB)
            </label>
            <input type="file" accept="image/*" disabled={submitted || uploading} onChange={e => handleFileChange(e, 'profile')} className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800" />
            {profilePreview && <img src={profilePreview} alt="Profile Preview" className="h-24 w-24 rounded-full object-cover border-2 border-red-700 shadow-md" />}
          </div>
          <div className="w-full flex flex-col items-center gap-2">
            <label className="flex items-center gap-2 text-gray-700 font-medium">
              <FaIdCard className="text-red-700" /> Reporter ID Card (max 300KB)
            </label>
            <input type="file" accept="image/*" disabled={submitted || uploading} onChange={e => handleFileChange(e, 'idcard')} className="border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800" />
            {idCardPreview && <img src={idCardPreview} alt="ID Card Preview" className="h-24 w-40 object-cover border-2 border-red-700 shadow-md rounded-lg" />}
          </div>
        </div>
      </div>
    </div>
  );
} 