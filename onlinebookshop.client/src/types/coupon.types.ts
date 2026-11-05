// =============================================
// coupon.types.ts
// =============================================

export type CouponDiscountType = "Percentage" | "FixedAmount";

export type CouponStatus = "Active" | "Scheduled" | "Expired" | "Exhausted" | "Inactive";

export interface CouponApplyDto {
    code: string;
}

export interface CouponUpsertDto {
    code: string;
    description?: string;
    discountType: CouponDiscountType;
    discountValue: number;
    minimumOrderAmount: number;
    maximumDiscountAmount?: number;
    usageLimit?: number;
    perUserLimit: number;
    startsAt?: string;
    expiresAt?: string;
    isActive: boolean;
}

export interface CouponResponseDto {
    couponId: number;
    code: string;
    description?: string;
    discountType: CouponDiscountType;
    discountValue: number;
    minimumOrderAmount: number;
    maximumDiscountAmount?: number;
    usageLimit?: number;
    perUserLimit: number;
    redeemedCount: number;
    startsAt?: string;
    expiresAt?: string;
    isActive: boolean;
    status: CouponStatus;
    createdAt: string;
    updatedAt?: string;
}

export interface CouponValidationDto {
    couponId: number;
    code: string;
    description?: string;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    perUserLimit: number;
}
