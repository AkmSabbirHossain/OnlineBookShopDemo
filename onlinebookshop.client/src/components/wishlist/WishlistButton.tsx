// =============================================
// WishlistButton.tsx
// =============================================
import { useState } from 'react';
import { useWishlist } from '../../context/wishlist/useWishlist'; 

interface WishlistButtonProps {
    bookId: number;
    className?: string;
}

const WishlistButton = ({ bookId, className = '' }: WishlistButtonProps) => {
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const [loading, setLoading] = useState(false);

    const inWishlist = isInWishlist(bookId);

    const handleClick = async () => {
        if (loading) return;

        const isAuthenticated = !!localStorage.getItem('accessToken');
        if (!isAuthenticated) {
            alert('Wishlist ব্যবহার করতে আগে Login করুন');
            return;
        }

        setLoading(true);
        try {
            if (inWishlist) {
                await removeFromWishlist(bookId);
            } else {
                await addToWishlist(bookId);
            }
        } catch (error) {
            console.error('Wishlist action failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            className={`wishlist-btn ${inWishlist ? 'active' : ''} ${className}`}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.6 : 1,
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill={inWishlist ? '#e63946' : 'none'}
                stroke={inWishlist ? '#e63946' : 'currentColor'}
                strokeWidth="2"
            >
                <path d="M12.1 21.35l-1.1-1.02C5.14 15.36 2 12.5 2 8.9 2 6.09 4.09 4 6.9 4c1.6 0 3.13.75 4.1 1.98A5.4 5.4 0 0115.1 4C17.91 4 20 6.09 20 8.9c0 3.6-3.14 6.46-8.99 11.44l-1.01.87z" />
            </svg>
        </button>
    );
};

export default WishlistButton;