//// =============================================
//// wishlist.types.ts
//// =============================================
//export interface WishlistItemResponseDto {
//    wishlistItemId: number;
//    bookId: number;
//    bookTitle: string;
//    bookPrice: number;
//    imageUrl?: string;
//    author?: string;
//}

//export interface WishlistResponseDto {
//    wishlistId: number;
//    userId: number;
//    items: WishlistItemResponseDto[];
//}

export interface WishlistItemResponseDto {
    wishlistItemId: number;
    bookId: number;
    bookTitle: string;
    bookPrice: number;
    discountPrice?: number | null;
    imageUrl?: string;
    author?: string;
    stock: number;
}

export interface WishlistResponseDto {
    wishlistId: number;
    userId: number;
    items: WishlistItemResponseDto[];
}