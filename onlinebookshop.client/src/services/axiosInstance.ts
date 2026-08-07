// =============================================
// axiosInstance.ts
// =============================================

import axios from "axios";

const axiosInstance = axios.create({
   
    baseURL: "https://sabbirbookworld.onrender.com/api",
   
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 50000,
});

// ── Request Interceptor:  ──
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response Interceptor: 
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;