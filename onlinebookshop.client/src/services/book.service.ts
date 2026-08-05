// =============================================
// book.service.ts — 
// =============================================

import axiosInstance from "./axiosInstance";
import type { BookResponseDto, CategoryResponseDto } from "../types/book.types";

const BookService = {

  // ── All Books ──
  getBooks: async (): Promise<BookResponseDto[]> => {
    const res = await axiosInstance.get<BookResponseDto[]>("/book");
    return res.data;
  },

  // ── Single Book ──
  getBookById: async (bookId: number): Promise<BookResponseDto> => {
    const res = await axiosInstance.get<BookResponseDto>(`/book/${bookId}`);
    return res.data;
  },
   
  // ── All Categories ──
  getCategories: async (): Promise<CategoryResponseDto[]> => {
    const res = await axiosInstance.get<CategoryResponseDto[]>("/category");
    return res.data;
  },
};

export default BookService;