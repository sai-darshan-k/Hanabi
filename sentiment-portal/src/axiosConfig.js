import axios from 'axios';

const API_BASE_URL = 'https://hanabi-2.onrender.com/'; // Replace with your production domain

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

export default axiosInstance;
