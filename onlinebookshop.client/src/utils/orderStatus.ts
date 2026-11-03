// =============================================
// orderStatus.ts — Shared order status helpers
// =============================================

import type { OrderStatus } from "../types/order.types";

const STATUS_MAP: Record<number, OrderStatus> = {
    0: "Pending",
    1: "Paid",
    2: "Shipped",
    3: "Delivered",
    4: "Cancelled",
};

export function getOrderStatus(status: OrderStatus | number): OrderStatus {
    if (typeof status === "number") return STATUS_MAP[status] ?? "Pending";
    return status;
}

export const ORDER_STATUS_META: Record<
    OrderStatus,
    { label: string; timelineLabel: string; icon: string; description: string }
> = {
    Pending: {
        label: "Pending",
        timelineLabel: "Order placed",
        icon: "bi-bag-check",
        description: "We received your order and it is waiting for confirmation.",
    },
    Paid: {
        label: "Paid",
        timelineLabel: "Payment confirmed",
        icon: "bi-credit-card-2-front",
        description: "Your payment has been confirmed.",
    },
    Shipped: {
        label: "Shipped",
        timelineLabel: "On the way",
        icon: "bi-truck",
        description: "Your order is on its way to your address.",
    },
    Delivered: {
        label: "Delivered",
        timelineLabel: "Delivered",
        icon: "bi-check-circle-fill",
        description: "Your order has been delivered. Enjoy your books!",
    },
    Cancelled: {
        label: "Cancelled",
        timelineLabel: "Cancelled",
        icon: "bi-x-circle",
        description: "This order was cancelled and the stock was restored.",
    },
};

export const TIMELINE_STEPS: OrderStatus[] = ["Pending", "Paid", "Shipped", "Delivered"];
