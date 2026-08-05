// =============================================
// vendor.types.ts
// =============================================

export interface VendorResponseDto {
    vendorId: number;
    userId: number;
    shopName: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
    isApproved: boolean;
    isActive: boolean;         
    createdAt: string;
    updatedAt?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    country?: string;
    businessRegistrationNumber?: string;
    averageRating?: number;
    totalReviews?: number;
    totalSales?: number;
    adminNote?: string;
}

export interface VendorRegisterDto {
    shopName: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;          
    phoneNumber?: string;       
    address?: string;           
    city?: string;              
    businessRegistrationNumber?: string; 
}