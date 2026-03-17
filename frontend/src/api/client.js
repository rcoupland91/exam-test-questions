import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const client = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT (localStorage = remember me, sessionStorage = session) or Guest ID
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('exam_token') || sessionStorage.getItem('exam_token');
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
      localStorage.removeItem('exam_token');
      localStorage.removeItem('exam_user');
      sessionStorage.removeItem('exam_token');
      sessionStorage.removeItem('exam_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
