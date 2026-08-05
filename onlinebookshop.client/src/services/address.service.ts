// =============================================
// address.service.ts —
//
// Backend endpoints:
// GET    /api/Address        → getMyAddresses
// GET    /api/Address/{id}   → getById
// POST   /api/Address        → create  (Customer,Admin only!)
// PUT    /api/Address/{id}   → update
// DELETE /api/Address/{id}   → delete
// =============================================

import axiosInstance from "./axiosInstance";
import type {
  AddressResponseDto,
  AddressCreateDto,
  AddressUpdateDto,
} from "../types/address.types";

const AddressService = {

  // GET /api/Address
  getMyAddresses: async (): Promise<AddressResponseDto[]> => {
    const res = await axiosInstance.get<AddressResponseDto[]>("/Address");
    return res.data;
  },

  // POST /api/Address
  create: async (dto: AddressCreateDto): Promise<AddressResponseDto> => {
    const res = await axiosInstance.post<AddressResponseDto>("/Address", dto);
    return res.data;
  },

  // PUT /api/Address/{id}
  update: async (addressId: number, dto: AddressUpdateDto): Promise<void> => {
    await axiosInstance.put(`/Address/${addressId}`, dto);
  },

  // DELETE /api/Address/{id}
  delete: async (addressId: number): Promise<void> => {
    await axiosInstance.delete(`/Address/${addressId}`);
  },
};

export default AddressService;