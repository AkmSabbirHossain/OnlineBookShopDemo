// =============================================
// vendorUtils.ts — shared vendor panel helpers
// =============================================

import type { OrderResponseDto, OrderStatus } from "../../types/order.types";

const STATUS_BY_NUMBER: Record<number, OrderStatus> = {
    0: "Pending",
    1: "Paid",
    2: "Shipped",
    3: "Delivered",
    4: "Cancelled",
};

// The API serializes enums as numbers today, but older payloads used strings.
export function normalizeStatus(status: unknown): OrderStatus {
    if (typeof status === "number") return STATUS_BY_NUMBER[status] ?? "Pending";
    if (typeof status === "string") {
        const known: OrderStatus[] = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];
        return known.includes(status as OrderStatus) ? (status as OrderStatus) : "Pending";
    }
    return "Pending";
}

export const STATUS_META: Record<OrderStatus, { label: string; icon: string; cls: string }> = {
    Pending: { label: "Pending", icon: "bi-hourglass-split", cls: "pending" },
    Paid: { label: "Paid", icon: "bi-credit-card-2-front", cls: "paid" },
    Shipped: { label: "Shipped", icon: "bi-truck", cls: "shipped" },
    Delivered: { label: "Delivered", icon: "bi-check-circle-fill", cls: "delivered" },
    Cancelled: { label: "Cancelled", icon: "bi-x-circle", cls: "cancelled" },
};

export const NEXT_VENDOR_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    Pending: ["Paid", "Cancelled"],
    Paid: ["Shipped"],
    Shipped: ["Delivered"],
    Delivered: [],
    Cancelled: [],
};

export function orderOwnTotal(order: OrderResponseDto): number {
    if (order.items?.length) {
        return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }
    return order.subtotalAmount ?? order.totalAmount ?? 0;
}

export function formatTaka(value: number): string {
    return `৳${Math.round(value).toLocaleString("en-BD")}`;
}

export function formatTaka2(value: number): string {
    return `৳${value.toFixed(2)}`;
}

export function formatDate(value?: string | null): string {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function formatDateTime(value?: string | null): string {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export const PLACEHOLDER_COVER = "https://placehold.co/80x108?text=Book";
export const PLACEHOLDER_SHOP_LOGO = "https://placehold.co/100x100?text=Shop";
