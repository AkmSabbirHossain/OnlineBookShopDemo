// =============================================
// AUTH TYPES 
// =============================================

export interface UserRegisterDto {
    name: string;
    email: string;
    password: string;
}

export interface UserLoginDto {
    email: string;
    password: string;
}

export interface UserResponseDto {
    userId: number;
    name: string;
    email: string;
    role: "Admin" | "Vendor" | "Customer";
    createdAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserResponseDto;
}

export interface ApiErrorResponse {
    message: string;
    errors?: Record<string, string[]>;
}