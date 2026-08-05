// =============================================
// profile.service.ts
// =============================================

import axiosInstance from "./axiosInstance";
import type { UserProfileDto, UpdateProfileDto, ChangePasswordDto } from "../types/profile.types";

const ProfileService = {

    // GET /api/User/me
    getProfile: async (): Promise<UserProfileDto> => {
        const res = await axiosInstance.get<UserProfileDto>("/User/me");
        return res.data;
    },

    // PUT /api/User/me
    updateProfile: async (dto: UpdateProfileDto): Promise<UserProfileDto> => {
        const res = await axiosInstance.put<UserProfileDto>("/User/me", dto);
        return res.data;
    },

    // POST /api/User/change-password
    changePassword: async (dto: ChangePasswordDto): Promise<void> => {
        await axiosInstance.post("/User/change-password", dto);
    },
};

export default ProfileService;