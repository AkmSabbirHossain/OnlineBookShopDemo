// =============================================
// review.types.ts
// =============================================

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
    createdAt: string;
}