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
      // Dispatch a custom event to trigger logout in React
      window.dispatchEvent(new CustomEvent('session-expired'));
      toast.error('Session expired. Please log in again.');
    }
    return Promise.reject(error);
  }
);

export default instance; 