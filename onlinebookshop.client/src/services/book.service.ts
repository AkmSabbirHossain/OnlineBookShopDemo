// =============================================
// book.service.ts — 
// =============================================

import axiosInstance from "./axiosInstance";
import type {
  BookFilterParams,
  BookResponseDto,
  CategoryResponseDto,
  PagedResult,
} from "../types/book.types";

const BookService = {

  // ── All Books ──
  getBooks: async (): Promise<BookResponseDto[]> => {
    const res = await axiosInstance.get<BookResponseDto[]>("/book");
    return res.data;
  },

  // ── Search / filter / sort / paginate ──
  searchBooks: async (
    params: BookFilterParams,
    signal?: AbortSignal
  ): Promise<PagedResult<BookResponseDto>> => {
    const res = await axiosInstance.get<PagedResult<BookResponseDto>>("/book/search", { params, signal });
    return res.data;
  },

  // ── Single Book ──
  getBookById: async (bookId: number): Promise<BookResponseDto> => {
    const res = await axiosInstance.get<BookResponseDto>(`/book/${bookId}`);
    return res.data;
  },

  // ── Related / recommended books ──
  getRelated: async (bookId: number, count = 8): Promise<BookResponseDto[]> => {
    const res = await axiosInstance.get<BookResponseDto[]>(`/book/${bookId}/related`, {
      params: { count },
    });
    return res.data;
  },
   
  // ── All Categories ──
  getCategories: async (): Promise<CategoryResponseDto[]> => {
    const res = await axiosInstance.get<CategoryResponseDto[]>("/category");
    return res.data;
  },
};

export default BookService;