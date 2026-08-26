export interface BannerCreateDto {
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    displayOrder: number;
    isActive: boolean;
}

export interface BannerResponseDto {
    bannerId: number;
    title: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    displayOrder: number;
    isActive: boolean;
}