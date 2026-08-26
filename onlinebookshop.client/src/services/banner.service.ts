import axiosInstance from "./axiosInstance";
import type { BannerCreateDto, BannerResponseDto } from "../types/banner.types";

const BannerService = {
    getActive: async (): Promise<BannerResponseDto[]> => {
        const res = await axiosInstance.get<BannerResponseDto[]>("/Banner/active");
        return res.data;
    },

    getAll: async (): Promise<BannerResponseDto[]> => {
        const res = await axiosInstance.get<BannerResponseDto[]>("/Banner");
        return res.data;
    },

    create: async (dto: BannerCreateDto): Promise<BannerResponseDto> => {
        const res = await axiosInstance.post<BannerResponseDto>("/Banner", dto);
        return res.data;
    },

    update: async (id: number, dto: BannerCreateDto): Promise<void> => {
        await axiosInstance.put(`/Banner/${id}`, dto);
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/Banner/${id}`);
    },
};

export default BannerService;