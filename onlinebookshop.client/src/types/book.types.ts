// =============================================
// book.types.ts � Updated
// =============================================
export interface CategoryResponseDto {
    categoryId: number;
    name: string;
    description?: string;
    imageUrl?: string;
    displayOrder: number;
    isActive: boolean;
    bookCount: number;
}

export interface BookImageDto {
    bookImageId: number;
    imageUrl: string;
    isPrimary: boolean;
    displayOrder: number;
}

export interface BookResponseDto {
    bookId: number;
    title: string;
    subtitle?: string;
    author: string;
    price: number;
    discountPrice?: number;
    stock: number;
    description?: string;
    imageUrl?: string;
    isActive: boolean;
    isFeatured: boolean;
    authorId?: number;
    publisherId?: number;
    publisher?: string;
    edition?: string;
    publishedYear?: number;
    pageCount?: number;
    language?: string;
    isbn?: string;
    categoryId: number;
    vendorId: number;
    createdAt: string;
    updatedAt?: string;
    averageRating: number;
    reviewCount: number;
    lowStockThreshold: number;
    images: BookImageDto[];
}

export interface BookCreateDto {
    title: string;
    subtitle?: string;
    author: string;
    price: number;
    discountPrice?: number;
    stock: number;
    description?: string;
    imageUrl?: string;
    categoryId: number;
    publisher?: string;
    edition?: string;
    publishedYear?: number;
    pageCount?: number;
    language?: string;
    isbn?: string;
    lowStockThreshold?: number;
}

export interface BookUpdateDto {
    title?: string;
    subtitle?: string;
    author?: string;
    price?: number;
    discountPrice?: number;
    stock?: number;
    description?: string;
    imageUrl?: string;
    categoryId?: number;
    publisher?: string;
    edition?: string;
    publishedYear?: number;
    pageCount?: number;
    language?: string;
    isbn?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    lowStockThreshold?: number;
}

export interface BookFilterParams {
    search?: string;
    categoryId?: number;
    authorId?: number;
    publisherId?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "price_asc" | "price_desc" | "newest" | "title_asc" | "title_desc"
        | "rating_desc" | "rating_asc" | "popular";
    page?: number;
    pageSize?: number;
    inStockOnly?: boolean;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}