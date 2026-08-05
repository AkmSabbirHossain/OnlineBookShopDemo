//// =============================================
//// cart.types.ts 
//// =============================================

export interface CartItemCreateDto {
    bookId: number;
    quantity: number;
}

export interface CartItemUpdateDto {
    bookId: number;
    quantity: number;
}

export interface CartItemResponseDto {
    cartItemId: number;
    bookId: number;
    bookTitle: string;
    bookPrice: number;
    quantity: number;
    subtotal: number;
    imageUrl?: string;
}

export interface CartResponseDto {
    cartId: number;
    userId: number;
    items: CartItemResponseDto[];
    totalAmount: number;
}

export interface CartAddResponse {
    message: string;
}


