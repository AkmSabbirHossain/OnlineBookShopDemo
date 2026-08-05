// =============================================
// profile.types.ts
// =============================================

export interface UserProfileDto {
    userId: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

export interface UpdateProfileDto {
    name: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}