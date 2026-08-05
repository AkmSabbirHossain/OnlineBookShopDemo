// =============================================
// cart.service.ts — 
// =============================================

import axiosInstance from "./axiosInstance";
import type { CartResponseDto, CartItemCreateDto, CartItemUpdateDto } from "../types/cart.types";

const CartService = {

  // GET /api/Cart
  getMyCart: async (): Promise<CartResponseDto> => {
    const res = await axiosInstance.get<CartResponseDto>("/Cart");
    return res.data;
  },

  // POST /api/Cart/add
  addItem: async (dto: CartItemCreateDto): Promise<void> => {
    await axiosInstance.post("/Cart/add", dto);
  },

  // PUT /api/Cart/update — body তে bookId + quantity
  updateItem: async (dto: CartItemUpdateDto): Promise<void> => {
    await axiosInstance.put("/Cart/update", dto);
  },

  // DELETE /api/Cart/remove/{bookId} — URL এ bookId
  removeItem: async (bookId: number): Promise<void> => {
    await axiosInstance.delete(`/Cart/remove/${bookId}`);
  },

  // DELETE /api/Cart/clear
  clearCart: async (): Promise<void> => {
    await axiosInstance.delete("/Cart/clear");
  },
};

export default CartService;