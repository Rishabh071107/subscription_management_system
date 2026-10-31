import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to unwrap data and normalize error responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    const customErr = new Error(message);
    customErr.status = error.response?.status;
    customErr.data = error.response?.data;
    return Promise.reject(customErr);
  }
);

export default api;
