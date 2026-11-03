import axiosInstance from "./axiosInstance";
import type { PagedResult } from "../types/book.types";
import type {
    AuthorResponseDto,
    PublisherResponseDto,
    CreatorListParams,
    CreatorUpsertDto,
} from "../types/creator.types";

const CreatorService = {
    // ── Public ──
    getAuthors: async (params: CreatorListParams = {}): Promise<PagedResult<AuthorResponseDto>> => {
        const res = await axiosInstance.get<PagedResult<AuthorResponseDto>>("/author", { params });
        return res.data;
    },

    getAuthor: async (authorId: number): Promise<AuthorResponseDto> => {
        const res = await axiosInstance.get<AuthorResponseDto>(`/author/${authorId}`);
        return res.data;
    },

    getPublishers: async (params: CreatorListParams = {}): Promise<PagedResult<PublisherResponseDto>> => {
        const res = await axiosInstance.get<PagedResult<PublisherResponseDto>>("/publisher", { params });
        return res.data;
    },

    getPublisher: async (publisherId: number): Promise<PublisherResponseDto> => {
        const res = await axiosInstance.get<PublisherResponseDto>(`/publisher/${publisherId}`);
        return res.data;
    },

    // ── Admin ──
    getAuthorsForAdmin: async (): Promise<AuthorResponseDto[]> => {
        const res = await axiosInstance.get<AuthorResponseDto[]>("/author/manage");
        return res.data;
    },

    createAuthor: async (data: CreatorUpsertDto): Promise<AuthorResponseDto> => {
        const res = await axiosInstance.post<AuthorResponseDto>("/author", data);
        return res.data;
    },

    updateAuthor: async (authorId: number, data: CreatorUpsertDto): Promise<AuthorResponseDto> => {
        const res = await axiosInstance.put<AuthorResponseDto>(`/author/${authorId}`, data);
        return res.data;
    },

    setAuthorStatus: async (authorId: number, isActive: boolean): Promise<AuthorResponseDto> => {
        const res = await axiosInstance.patch<AuthorResponseDto>(`/author/${authorId}/status`, { isActive });
        return res.data;
    },

    getPublishersForAdmin: async (): Promise<PublisherResponseDto[]> => {
        const res = await axiosInstance.get<PublisherResponseDto[]>("/publisher/manage");
        return res.data;
    },

    createPublisher: async (data: CreatorUpsertDto): Promise<PublisherResponseDto> => {
        const res = await axiosInstance.post<PublisherResponseDto>("/publisher", data);
        return res.data;
    },

    updatePublisher: async (publisherId: number, data: CreatorUpsertDto): Promise<PublisherResponseDto> => {
        const res = await axiosInstance.put<PublisherResponseDto>(`/publisher/${publisherId}`, data);
        return res.data;
    },

    setPublisherStatus: async (publisherId: number, isActive: boolean): Promise<PublisherResponseDto> => {
        const res = await axiosInstance.patch<PublisherResponseDto>(`/publisher/${publisherId}/status`, { isActive });
        return res.data;
    },
};

export default CreatorService;
