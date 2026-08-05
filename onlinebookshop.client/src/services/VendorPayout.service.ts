// src/services/VendorPayout.service.ts
import axiosInstance from "./axiosInstance"; // tomar existing axiosInstance path onujayi adjust koro


import type {
    VendorEarning,
    VendorPayoutSummary,
    VendorPayout,
    CreatePayoutRequest,
} from "../types/vendorPayout.types";
import type { VendorResponseDto } from "../types/admin.types";

const BASE_URL = "/VendorPayout";

const VendorPayoutService = {
    // Admin: shob vendor er pending summary
    getPendingSummary: async (): Promise<VendorPayoutSummary[]> => {
        const res = await axiosInstance.get(`${BASE_URL}/pending-summary`);
        return res.data;
    },

    // Admin: ekta specific vendor er pending earnings list
    getVendorPendingEarnings: async (vendorId: number): Promise<VendorEarning[]> => {
        const res = await axiosInstance.get(`${BASE_URL}/vendor/${vendorId}/pending-earnings`);
        return res.data;
    },

    // Admin: payout process koro
    processPayout: async (dto: CreatePayoutRequest): Promise<VendorPayout> => {
        const res = await axiosInstance.post(`${BASE_URL}/process`, dto);
        return res.data;
    },

    // Vendor/Admin: payout history
    getPayoutHistory: async (vendorId: number): Promise<VendorPayout[]> => {
        const res = await axiosInstance.get(`${BASE_URL}/vendor/${vendorId}/history`);
        return res.data;
    },
    // tomar Vendor response DTO type onujayi adjust koro
    getMyProfile: async (): Promise<VendorResponseDto> => {
        const res = await axiosInstance.get(`${BASE_URL}/me`);
        return res.data;
    },
};

export default VendorPayoutService;