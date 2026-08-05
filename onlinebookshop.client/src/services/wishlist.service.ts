// =============================================
// wishlist.service.ts
// =============================================
import axiosInstance from "./axiosInstance";
import type { WishlistResponseDto } from "../types/wishlist.types";

const WishlistService = {
    // GET /api/Wishlist
    getMyWishlist: async (): Promise<WishlistResponseDto> => {
        const res = await axiosInstance.get<WishlistResponseDto>("/Wishlist");
        return res.data;
    },

    // POST /api/Wishlist/{bookId}
    addItem: async (bookId: number): Promise<WishlistResponseDto> => {
        const res = await axiosInstance.post<WishlistResponseDto>(`/Wishlist/${bookId}`);
        return res.data;
    },

    // DELETE /api/Wishlist/{bookId}
    removeItem: async (bookId: number): Promise<void> => {
        await axiosInstance.delete(`/Wishlist/${bookId}`);
    },
};

export default WishlistService;