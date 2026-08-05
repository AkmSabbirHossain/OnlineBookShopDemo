// =============================================
// book.types.ts — Updated
// =============================================
export interface CategoryResponseDto {
    categoryId: number;
    name: string;
    description?: string;
    imageUrl?: string;
    displayOrder: number;
    isActive: boolean;
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
}

export interface BookFilterParams {
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: "price_asc" | "price_desc" | "newest" | "title_asc" | "title_desc";
    page?: number;
    pageSize?: number;
}

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}