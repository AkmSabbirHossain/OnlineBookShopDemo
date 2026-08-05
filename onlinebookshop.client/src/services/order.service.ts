// =============================================
// order.service.ts —
// =============================================

import axiosInstance from "./axiosInstance";
import type {
    OrderCreateDto,
    OrderResponseDto,
    OrderStatus,
} from "../types/order.types";

// ── String → Number (backend numeric enum expect ) ──
const STATUS_TO_NUMBER: Record<OrderStatus, number> = {
    Pending: 0,
    Paid: 1,
    Shipped: 2,
    Delivered: 3,
    Cancelled: 4,
};

const OrderService = {

    // POST /api/Order — Customer only
    placeOrder: async (dto: OrderCreateDto): Promise<OrderResponseDto> => {
        const res = await axiosInstance.post<OrderResponseDto>("/Order", dto);
        return res.data;
    },

    // GET /api/Order/my — Customer only
    getMyOrders: async (): Promise<OrderResponseDto[]> => {
        const res = await axiosInstance.get<OrderResponseDto[]>("/Order/my");
        return res.data;
    },

    // GET /api/Order/{orderId}
    getOrderById: async (orderId: number): Promise<OrderResponseDto> => {
        const res = await axiosInstance.get<OrderResponseDto>(`/Order/${orderId}`);
        return res.data;
    },

    // POST /api/Order/{orderId}/cancel — Customer only
    cancelOrder: async (orderId: number): Promise<void> => {
        await axiosInstance.post(`/Order/${orderId}/cancel`);
    },

    // GET /api/Order/vendor/my — Vendor only
    getVendorOrders: async (): Promise<OrderResponseDto[]> => {
        const res = await axiosInstance.get<OrderResponseDto[]>("/Order/vendor/my");
        return res.data;
    },

    // PUT /api/Order/{orderId}/status — Vendor, Admin
    updateStatus: async (orderId: number, newStatus: OrderStatus): Promise<void> => {
        await axiosInstance.put(`/Order/${orderId}/status`, {
            newStatus: STATUS_TO_NUMBER[newStatus], 
        });
    },
};

export default OrderService;