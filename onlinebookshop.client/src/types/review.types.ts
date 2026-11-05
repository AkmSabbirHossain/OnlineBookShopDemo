// =============================================
// review.types.ts
// =============================================

export type ReviewStatus = "Pending" | "Approved" | "Hidden";

export interface ReviewCreateDto {
    bookId: number;
    rating: number;
    comment?: string;
}

export interface ReviewResponseDto {
    reviewId: number;
    bookId: number;
    userId: number;
    userName: string;
    rating: number;
    comment?: string;
    isVerifiedPurchase: boolean;
    status: ReviewStatus;
    createdAt: string;
}

export interface ReviewModerationDto {
    reviewId: number;
    bookId: number;
    bookTitle: string;
    userId: number;
    userName: string;
    rating: number;
    comment?: string;
    isVerifiedPurchase: boolean;
    status: ReviewStatus;
    createdAt: string;
}
