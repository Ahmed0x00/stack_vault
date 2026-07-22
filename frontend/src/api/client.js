import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://decohomz.com/sv-api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

// Interceptor to inject JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for 401 unauthenticated handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (localStorage.getItem('sv_token')) {
        localStorage.removeItem('sv_token');
        localStorage.removeItem('sv_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
