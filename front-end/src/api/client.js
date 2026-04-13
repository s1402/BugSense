import axios from 'axios';
import { config } from '../config/env.js';

const client = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT on every request
client.interceptors.request.use((req) => {
  const token = localStorage.getItem('bugsense_token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Global response error handling
client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    const status  = err.response?.status;

    // Auto logout on 401 — but NOT for login/register requests
    const isAuthRoute = err.config?.url?.startsWith('/auth/');
    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem('bugsense_token');
      localStorage.removeItem('bugsense_user');
      window.location.href = '/';
    }

    return Promise.reject({ message, status });
  }
);

export default client;
