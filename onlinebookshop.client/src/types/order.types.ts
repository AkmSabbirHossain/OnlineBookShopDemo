// =============================================
// order.types.ts
// =============================================

export type OrderStatus = "Pending" | "Paid" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderItemCreateDto {
    bookId: number;
    quantity: number;
}

export interface OrderCreateDto {
    addressId: number;
    items: OrderItemCreateDto[];
    couponCode?: string;
}

export interface OrderItemResponseDto {
    orderItemId: number;
    bookId: number;
    quantity: number;
    price: number;
    title: string;
    bookTitle?: string;
    imageUrl?: string;
}

export interface OrderStatusHistoryDto {
    orderStatusHistoryId: number;
    orderId: number;
    status: OrderStatus;
    changedAt: string;
}

export interface OrderAddressDto {
    addressId: number;
    street: string;
    city: string;
    stateOrDivision?: string;
    postalCode?: string;
    country: string;
}

export interface OrderResponseDto {
    orderId: number;
    userId: number;
    addressId: number;
    subtotalAmount: number;
    discountAmount: number;
    totalAmount: number;
    couponCode?: string;
    status: OrderStatus;
    orderDate: string;
    items: OrderItemResponseDto[];
    address?: OrderAddressDto;
    statusHistory?: OrderStatusHistoryDto[];
    createdAt?: string;
}

// PUT /api/Order/{orderId}/status
export interface OrderStatusUpdateDto {
    newStatus: OrderStatus;
}