// admin.types.ts

export interface AdminStatsDto {
    totalUsers: number;
    totalVendors: number;
    totalBooks: number;
    totalOrders: number;
    pendingVendors: number;
}

export interface VendorResponseDto {
    vendorId: number;
    userId: number;
    shopName: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    businessRegistrationNumber?: string;
    isApproved: boolean;
    isActive: boolean;          
    createdAt: string;
    updatedAt?: string;
    averageRating: number;
    totalReviews: number;
    totalSales: number;
    adminNote?: string;         
}

export interface CategoryCreateDto {
    name: string;
}

export interface CategoryResponseDto {
    categoryId: number;
    name: string;
}



//// =============================================
//// admin.types.ts
//// =============================================

//export interface AdminStatsDto {
//    totalUsers: number;
//    totalVendors: number;
//    totalBooks: number;
//    totalOrders: number;
//    pendingVendors: number;
//}

//export interface VendorResponseDto {
//    vendorId: number;
//    userId: number;
//    shopName: string;
//    description?: string;
//    logoUrl?: string;
//    isApproved: boolean;
//    createdAt: string;
//}

//export interface CategoryCreateDto {
//    name: string;
//}

//export interface CategoryResponseDto {
//    categoryId: number;
//    name: string;
//}