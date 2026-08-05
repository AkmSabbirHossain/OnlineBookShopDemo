// =============================================
// admin.service.ts — Updated
// =============================================
import axiosInstance from "./axiosInstance";
import type {
    VendorResponseDto,
    CategoryResponseDto,
    CategoryCreateDto,
} from "../types/admin.types";

const AdminService = {
    // ── All Vendors (for Suspend/Activate) ──
    getAllVendors: async (): Promise<VendorResponseDto[]> => {
        const res = await axiosInstance.get<VendorResponseDto[]>("/Vendor/all");
        return res.data;
    },

    // ── Pending Vendors ──
    getPendingVendors: async (): Promise<VendorResponseDto[]> => {
        const res = await axiosInstance.get<VendorResponseDto[]>("/Vendor/pending");
        return res.data;
    },

    // ── Approve Vendor ──
    approveVendor: async (vendorId: number): Promise<void> => {
        await axiosInstance.post(`/Vendor/${vendorId}/approve`);
    },

    // ── Reject Vendor ──
    rejectVendor: async (vendorId: number): Promise<void> => {
        await axiosInstance.post(`/Vendor/${vendorId}/reject`);
    },

    // ── Suspend Vendor (New) ──
    suspendVendor: async (vendorId: number): Promise<void> => {
        await axiosInstance.post(`/Vendor/${vendorId}/suspend`);
    },

    // ── Activate Vendor (New) ──
    activateVendor: async (vendorId: number): Promise<void> => {
        await axiosInstance.post(`/Vendor/${vendorId}/activate`);
    },
    deleteVendor: async (vendorId: number): Promise<void> => {
        await axiosInstance.post(`/Vendor/${vendorId}/ delete`);
    },
  
    // ── All Categories ──
    getCategories: async (): Promise<CategoryResponseDto[]> => {
        const res = await axiosInstance.get<CategoryResponseDto[]>("/Category");
        return res.data;
    },

    // ── Create Category ──
    createCategory: async (dto: CategoryCreateDto): Promise<CategoryResponseDto> => {
        const res = await axiosInstance.post<CategoryResponseDto>("/Category", dto);
        return res.data;
    },

    // ── Delete Category ──
    deleteCategory: async (categoryId: number): Promise<void> => {
        await axiosInstance.delete(`/Category/${categoryId}`);

    },

};

export default AdminService;

//// =============================================
//// admin.service.ts — Admin only endpoints
////
//// GET    /api/Vendor/pending          → getPendingVendors
//// POST   /api/Vendor/{id}/approve    → approveVendor
//// POST   /api/Vendor/{id}/reject     → rejectVendor
//// GET    /api/Category               → getCategories
//// POST   /api/Category               → createCategory
//// DELETE /api/Category/{id}          → deleteCategory
//// =============================================

//import axiosInstance from "./axiosInstance";
//import type {
//    VendorResponseDto,
//    CategoryResponseDto,
//    CategoryCreateDto,
//} from "../types/admin.types";

//const AdminService = {

//    // ── Pending Vendors ──
//    getPendingVendors: async (): Promise<VendorResponseDto[]> => {
//        const res = await axiosInstance.get<VendorResponseDto[]>("/Vendor/pending");
//        return res.data;
//    },

//    // ── Approve Vendor ──
//    approveVendor: async (vendorId: number): Promise<void> => {
//        await axiosInstance.post(`/Vendor/${vendorId}/approve`);
//    },

//    // ── Reject Vendor ──
//    rejectVendor: async (vendorId: number): Promise<void> => {
//        await axiosInstance.post(`/Vendor/${vendorId}/reject`);
//    },

//    // ── All Categories ──
//    getCategories: async (): Promise<CategoryResponseDto[]> => {
//        const res = await axiosInstance.get<CategoryResponseDto[]>("/Category");
//        return res.data;
//    },

//    // ── Create Category ──
//    createCategory: async (dto: CategoryCreateDto): Promise<CategoryResponseDto> => {
//        const res = await axiosInstance.post<CategoryResponseDto>("/Category", dto);
//        return res.data;
//    },

//    // ── Delete Category ──
//    deleteCategory: async (categoryId: number): Promise<void> => {
//        await axiosInstance.delete(`/Category/${categoryId}`);
//    },
//};

//export default AdminService;