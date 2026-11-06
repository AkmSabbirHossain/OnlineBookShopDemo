// =============================================
// axiosInstance.ts
// =============================================

import axios from "axios";

// Local backend (dotnet run)
//const LOCAL_API_URL = "https://localhost:7032/api";
// Deployed backend (Render)
const PRODUCTION_API_URL = "https://sabbirbookworld.onrender.com/api";

// VITE_API_BASE_URL overrides both; otherwise dev -> local, build -> production.
const baseURL =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    (import.meta.env.DEV ?  PRODUCTION_API_URL :  PRODUCTION_API_URL);
//const baseURL =
//    import.meta.env.VITE_API_BASE_URL?.trim() ||
//    (import.meta.env.DEV ? LOCAL_API_URL : PRODUCTION_API_URL);

const axiosInstance = axios.create({
    baseURL,
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