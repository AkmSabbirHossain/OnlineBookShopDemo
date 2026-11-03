export interface AuthorResponseDto {
    authorId: number;
    name: string;
    bio?: string;
    imageUrl?: string;
    isActive: boolean;
    bookCount: number;
}

export interface PublisherResponseDto {
    publisherId: number;
    name: string;
    bio?: string;
    imageUrl?: string;
    isActive: boolean;
    bookCount: number;
}

export interface CreatorListParams {
    search?: string;
    page?: number;
    pageSize?: number;
}

export interface CreatorUpsertDto {
    name: string;
    bio?: string;
    imageUrl?: string;
    isActive: boolean;
}
