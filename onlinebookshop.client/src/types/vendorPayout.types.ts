// src/types/vendorPayout.types.ts

export interface VendorEarning {
    vendorEarningId: number;
    orderItemId: number;
    grossAmount: number;
    commissionAmount: number;
    netAmount: number;
    isPaidOut: boolean;
    earnedAt: string;
}

export interface VendorPayoutSummary {
    vendorId: number;
    vendorName: string;
    pendingAmount: number;
    pendingEarningsCount: number;
}

export interface VendorPayout {
    vendorPayoutId: number;
    vendorId: number;
    amount: number;
    paidAt: string;
    status: string;
    transactionReference?: string;
}

interface CreatePayoutRequest {
    vendorId: number;
    transactionReference?: string;
    notes?: string;
}

export type { CreatePayoutRequest }; 