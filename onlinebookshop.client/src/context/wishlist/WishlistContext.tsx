//WishlistContext.tsx

import { createContext } from 'react';
import type { WishlistResponseDto, WishlistItemResponseDto } from '../../types/wishlist.types';

export interface WishlistContextType {
    wishlist: WishlistResponseDto | null;
    wishlistItems: WishlistItemResponseDto[];
    addToWishlist: (bookId: number) => Promise<void>;
    removeFromWishlist: (bookId: number) => Promise<void>;
    isInWishlist: (bookId: number) => boolean;
    loading: boolean;
    refreshWishlist: () => Promise<void>;
}
export const WishlistContext = createContext<WishlistContextType | undefined>(undefined);