import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8000', // Đổi theo port Backend Laravel của bạn
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Tự động gắn Token Sanctum/JWT nếu có
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;