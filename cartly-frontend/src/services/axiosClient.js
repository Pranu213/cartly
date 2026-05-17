import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Primary axios instance: sends httpOnly cookies (withCredentials)
export const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let refreshPromise = null;

const getLocalToken = () => localStorage.getItem('token');
const setLocalToken = (token) => localStorage.setItem('token', token);
const removeLocalToken = () => localStorage.removeItem('token');

// Attach access token to outgoing requests
axiosClient.interceptors.request.use((config) => {
  const token = getLocalToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: on 401, attempt refresh once and retry original request
axiosClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (!originalRequest || originalRequest._retry) return Promise.reject(err);

    if (err.response && err.response.status === 401) {
      // Prevent multiple concurrent refreshes
      if (!isRefreshing) {
        isRefreshing = true;
        // Call refresh endpoint; uses httpOnly cookie
        refreshPromise = axiosClient.post('/auth/refresh').then((r) => r.data).finally(() => {
          isRefreshing = false;
        });
      }

      try {
        const data = await refreshPromise;
        if (data?.data?.accessToken) {
          setLocalToken(data.data.accessToken);
          originalRequest._retry = true;
          originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed: clear local token and propagate error
        removeLocalToken();
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(err);
  }
);

export default axiosClient;
