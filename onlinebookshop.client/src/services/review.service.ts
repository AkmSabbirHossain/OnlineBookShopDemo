// =============================================
// review.service.ts
// =============================================

import axiosInstance from "./axiosInstance";
import type {
    ReviewCreateDto,
    ReviewModerationDto,
    ReviewResponseDto,
    ReviewStatus,
} from "../types/review.types";

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

    // GET /api/Review/manage?status= — Admin only
    getForAdmin: async (status?: ReviewStatus): Promise<ReviewModerationDto[]> => {
        const res = await axiosInstance.get<ReviewModerationDto[]>("/Review/manage", {
            params: status ? { status } : undefined,
        });
        return res.data;
    },

    // PATCH /api/Review/{reviewId}/status — Admin only
    setStatus: async (reviewId: number, status: ReviewStatus): Promise<ReviewModerationDto> => {
        const res = await axiosInstance.patch<ReviewModerationDto>(
            `/Review/${reviewId}/status`,
            { status }
        );
        return res.data;
    },
};

export default ReviewService;
