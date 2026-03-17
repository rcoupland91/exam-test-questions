import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT or Guest ID from localStorage
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('exam_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      const guestId = localStorage.getItem('examforge_guest_id');
      if (guestId) {
        config.headers['X-Guest-ID'] = guestId;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — normalize errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      localStorage.removeItem('exam_token');
      localStorage.removeItem('exam_user');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
