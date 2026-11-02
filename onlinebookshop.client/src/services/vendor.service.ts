//// =============================================
//// vendor.service.ts — VendorController এর সাথে match
//// =============================================

//import axiosInstance from "./axiosInstance";
//import type { VendorResponseDto, VendorRegisterDto } from "../types/vendor.types";
//import type { BookResponseDto, BookCreateDto, BookUpdateDto } from "../types/book.types";

//const VendorService = {

//    // ── POST /api/vendor/register ──
//    registerVendor: async (dto: VendorRegisterDto): Promise<VendorResponseDto> => {
//        const res = await axiosInstance.post<VendorResponseDto>("/vendor/register", dto);
//        return res.data;
//    },

//    // ── GET /api/vendor/me ──
//    getMyProfile: async (): Promise<VendorResponseDto> => {
//        const res = await axiosInstance.get<VendorResponseDto>("/vendor/me");
//        return res.data;
//    },

//    // ── GET /api/books?vendorId=me (vendor এর নিজের books) ──
//    getMyBooks: async (): Promise<BookResponseDto[]> => {
//        const res = await axiosInstance.get<BookResponseDto[]>("/books/my");
//        return res.data;
//    },

//    // ── POST /api/books ──
//    createBook: async (dto: BookCreateDto): Promise<BookResponseDto> => {
//        const res = await axiosInstance.post<BookResponseDto>("/books", dto);
//        return res.data;
//    },

//    // ── PUT /api/books/:id ──
//    updateBook: async (bookId: number, dto: BookUpdateDto): Promise<BookResponseDto> => {
//        const res = await axiosInstance.put<BookResponseDto>(`/books/${bookId}`, dto);
//        return res.data;
//    },

//    // ── DELETE /api/books/:id ──
//    deleteBook: async (bookId: number): Promise<void> => {
//        await axiosInstance.delete(`/books/${bookId}`);
//    },
//};

//export default VendorService;







// =============================================
// vendor.service.ts —
// =============================================

import axiosInstance from "./axiosInstance";
import type { VendorResponseDto, VendorRegisterDto } from "../types/vendor.types";
import type { BookImageDto, BookResponseDto, BookCreateDto, BookUpdateDto } from "../types/book.types";

const VendorService = {

    // ── POST /api/vendor/register ──
    registerVendor: async (dto: VendorRegisterDto): Promise<VendorResponseDto> => {
        const res = await axiosInstance.post<VendorResponseDto>("/vendor/register", dto);
        return res.data;
    },

    // ── GET /api/vendor/me ──
    getMyProfile: async (): Promise<VendorResponseDto> => {
        const res = await axiosInstance.get<VendorResponseDto>("/vendor/me");
        return res.data;
    },


    getVendorProfile: async (): Promise<VendorResponseDto> => {
        const res = await axiosInstance.get<VendorResponseDto>("/vendor/me");
        return res.data;
    },


    getMyBooks: async (): Promise<BookResponseDto[]> => {
        const res = await axiosInstance.get<BookResponseDto[]>("/book/my");
        return res.data;
    },


    getVendorProducts: async (): Promise<BookResponseDto[]> => {
        const res = await axiosInstance.get<BookResponseDto[]>("/book/my");
        return res.data;
    },

    getVendorStats: async (): Promise<Record<string, unknown>> => {
        const res = await axiosInstance.get<Record<string, unknown>>("/vendor/stats");
        return res.data;
    },

    getVendorOrders: async (params?: { limit?: number }): Promise<Record<string, unknown>[]> => {
        const res = await axiosInstance.get<Record<string, unknown>[]>("/vendor/orders", { params });
        return res.data;
    },

    // ── POST /api/books ──
    createBook: async (dto: BookCreateDto): Promise<BookResponseDto> => {
        const res = await axiosInstance.post<BookResponseDto>("/book", dto);
        return res.data;
    },

    // ── PUT /api/books/:id ──
    updateBook: async (bookId: number, dto: BookUpdateDto): Promise<BookResponseDto> => {
        const res = await axiosInstance.put<BookResponseDto>(`/book/${bookId}`, dto);
        return res.data;
    },

    // ── PATCH /api/book/:id/status ──
    setBookStatus: async (
        bookId: number,
        status: { isActive?: boolean; isFeatured?: boolean }
    ): Promise<BookResponseDto> => {
        const res = await axiosInstance.patch<BookResponseDto>(`/book/${bookId}/status`, status);
        return res.data;
    },

    // ── DELETE /api/books/:id ──
    deleteBook: async (bookId: number): Promise<void> => {
        await axiosInstance.delete(`/book/${bookId}`);
    },

    // ── POST /api/book/:id/images ──
    uploadBookImage: async (bookId: number, file: File): Promise<BookImageDto> => {
        const formData = new FormData();
        formData.append("file", file);
        // Override the client's default JSON content type so the browser
        // sends a real multipart body with the correct boundary.
        const res = await axiosInstance.post<BookImageDto>(`/book/${bookId}/images`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    },

    // ── DELETE /api/book/:id/images/:imageId ──
    deleteBookImage: async (bookId: number, imageId: number): Promise<BookImageDto> => {
        const res = await axiosInstance.delete<BookImageDto>(`/book/${bookId}/images/${imageId}`);
        return res.data;
    },

    // ── PATCH /api/book/:id/images/:imageId/primary ──
    setPrimaryBookImage: async (bookId: number, imageId: number): Promise<BookImageDto> => {
        const res = await axiosInstance.patch<BookImageDto>(`/book/${bookId}/images/${imageId}/primary`);
        return res.data;
    },

    //--update vendor profile

    updateMyProfile: async (dto: Partial<VendorResponseDto>): Promise<VendorResponseDto> => {
      
        const res = await axiosInstance.put<VendorResponseDto>("/vendor/update", dto);
        return res.data;
    },

};

export default VendorService;