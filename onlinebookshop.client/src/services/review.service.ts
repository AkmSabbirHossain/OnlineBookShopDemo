// =============================================
// review.service.ts
// =============================================

import axiosInstance from "./axiosInstance";
import type { ReviewCreateDto, ReviewResponseDto } from "../types/review.types";

const ReviewService = {

    // GET /api/Review/book/{bookId}
    getByBook: async (bookId: number): Promise<ReviewResponseDto[]> => {
        const res = await axiosInstance.get<ReviewResponseDto[]>(`/Review/book/${bookId}`);
        return res.data;
    },

    // POST /api/Review
    create: async (dto: ReviewCreateDto): Promise<ReviewResponseDto> => {
        const res = await axiosInstance.post<ReviewResponseDto>("/Review", dto);
        return res.data;
    },

    // DELETE /api/Review/{reviewId}
    delete: async (reviewId: number): Promise<void> => {
        await axiosInstance.delete(`/Review/${reviewId}`);
    },
};

export default ReviewService;