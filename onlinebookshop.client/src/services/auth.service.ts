// =============================================
// auth.service.ts
// =============================================

import axiosInstance from "./axiosInstance";
import type { AuthResponse, UserLoginDto, UserRegisterDto } from "../types/auth.types";

const AuthService = {

    // ── Register ──
    register: async (dto: UserRegisterDto): Promise<AuthResponse> => {
        const response = await axiosInstance.post<AuthResponse>("/auth/register", dto);
        return response.data;
    },

    // ── Login ──
    login: async (dto: UserLoginDto): Promise<AuthResponse> => {
        const response = await axiosInstance.post<AuthResponse>("/auth/login", dto);
        return response.data;
    },

    // ── Token & User localStorage  save  ──
    saveSession: (data: AuthResponse): void => {
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("authChanged"));
    },

    // ── Logout ──
    logout: (): void => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChanged"));
    },

    // ── Current user  ──
    getCurrentUser: () => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },

    // ── Token check ──
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem("accessToken");
    },
};

export default AuthService;