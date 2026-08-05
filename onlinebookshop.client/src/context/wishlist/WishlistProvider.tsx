//WishlistProvider.tsx
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { WishlistContext } from './WishlistContext';
import type { WishlistResponseDto } from '../../types/wishlist.types';
import WishlistService from '../../services/wishlist.service';
import AuthService from '../../services/auth.service';

const WishlistProvider = ({ children }: { children: ReactNode }) => {
    const [wishlist, setWishlist] = useState<WishlistResponseDto | null>(null);
    const [loading, setLoading] = useState(false);

    const wishlistItems = wishlist?.items ?? [];

    const refreshWishlist = useCallback(async () => {
        if (!AuthService.isAuthenticated()) {
            setWishlist(null);
            return;
        }
        setLoading(true);
        try {
            const data = await WishlistService.getMyWishlist();
            setWishlist(data);
        } catch (error) {
            console.error('Failed to load wishlist', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshWishlist();
        // AuthService dispatches this on login/logout — keeps wishlist in sync
        window.addEventListener('authChanged', refreshWishlist);
        return () => window.removeEventListener('authChanged', refreshWishlist);
    }, [refreshWishlist]);

    const addToWishlist = async (bookId: number) => {
        const data = await WishlistService.addItem(bookId);
        setWishlist(data);
    };

    const removeFromWishlist = async (bookId: number) => {
        await WishlistService.removeItem(bookId);
        setWishlist((prev) =>
            prev ? { ...prev, items: prev.items.filter((item) => item.bookId !== bookId) } : prev
        );
    };

    const isInWishlist = (bookId: number) =>
        wishlistItems.some((item) => item.bookId === bookId);

    return (
        <WishlistContext.Provider
            value={{ wishlist, wishlistItems, addToWishlist, removeFromWishlist, isInWishlist, loading, refreshWishlist }}
        >
            {children}
        </WishlistContext.Provider>
    );
};

export default WishlistProvider;