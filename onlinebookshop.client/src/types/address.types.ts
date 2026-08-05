// =============================================
// address.types.ts
// =============================================

export interface AddressResponseDto {
    addressId: number;
    street: string;
    city: string;
    stateOrDivision?: string;
    postalCode?: string;
    country: string;
    isDefault: boolean;
}

export interface AddressCreateDto {
    street: string;
    city: string;
    stateOrDivision?: string;
    postalCode?: string;
    country: string;
    isDefault: boolean;
}

export interface AddressUpdateDto {
    street: string;
    city: string;
    stateOrDivision?: string;
    postalCode?: string;
    country: string;
    isDefault: boolean;
}