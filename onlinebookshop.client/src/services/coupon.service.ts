// =============================================
// coupon.service.ts
// =============================================

import axiosInstance from "./axiosInstance";
import type {
    CouponApplyDto,
    CouponResponseDto,
    CouponUpsertDto,
    CouponValidationDto,
} from "../types/coupon.types";

const CouponService = {
    // POST /api/Coupon/validate — Customer only
    validate: async (dto: CouponApplyDto): Promise<CouponValidationDto> => {
        const res = await axiosInstance.post<CouponValidationDto>("/Coupon/validate", dto);
        return res.data;
    },

    // GET /api/Coupon/manage — Admin only
    getAllForAdmin: async (): Promise<CouponResponseDto[]> => {
        const res = await axiosInstance.get<CouponResponseDto[]>("/Coupon/manage");
        return res.data;
    },

    // POST /api/Coupon — Admin only
    create: async (dto: CouponUpsertDto): Promise<CouponResponseDto> => {
        const res = await axiosInstance.post<CouponResponseDto>("/Coupon", dto);
        return res.data;
    },

    // PUT /api/Coupon/{couponId} — Admin only
    update: async (couponId: number, dto: CouponUpsertDto): Promise<CouponResponseDto> => {
        const res = await axiosInstance.put<CouponResponseDto>(`/Coupon/${couponId}`, dto);
        return res.data;
    },

    // PATCH /api/Coupon/{couponId}/status — Admin only
    setStatus: async (couponId: number, isActive: boolean): Promise<CouponResponseDto> => {
        const res = await axiosInstance.patch<CouponResponseDto>(`/Coupon/${couponId}/status`, {
            isActive,
        });
        return res.data;
    },
};

export default CouponService;
