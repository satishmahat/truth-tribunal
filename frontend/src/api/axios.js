import axios from 'axios';
import { toast } from 'react-toastify';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a response interceptor
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Check if this is a login failure (has error message) vs session expiration
      const isLoginFailure = error.response.data && error.response.data.msg;
      
      if (!isLoginFailure) {
        // Only show session expired for actual session/token issues
        window.dispatchEvent(new CustomEvent('session-expired'));
        toast.error('Session expired. Please log in again.');
      }
    }
    return Promise.reject(error);
  }
);

export default instance; 