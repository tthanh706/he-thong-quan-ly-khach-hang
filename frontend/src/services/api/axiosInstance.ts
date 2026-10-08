import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000/api', // Thay cổng API Backend của bạn tại đây
  headers: {
    'Content-Type': 'application/json',
  },
});