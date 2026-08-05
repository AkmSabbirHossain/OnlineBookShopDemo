// ======================
// WishlistPage.tsx
// =====================
import { useState } from 'react';
import { useWishlist } from '../context/wishlist/useWishlist';
import { Link } from 'react-router-dom';
import CartService from '../services/cart.service';


const PLACEHOLDER_IMG = "https://placehold.co/160x220/e8f4f8/2c7be5?text=No+Cover";

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist, loading } = useWishlist();
    const [addingId, setAddingId] = useState<number | null>(null);
    const [addedId, setAddedId] = useState<number | null>(null);

    const handleRemove = async (bookId: number) => {
        try {
            await removeFromWishlist(bookId);
        } catch (error) {
            console.error('Failed to remove item', error);
        }
    };

    const handleAddToCart = async (bookId: number) => {
        setAddingId(bookId);
        try {
            await CartService.addItem({ bookId, quantity: 1 });
            window.dispatchEvent(new Event('cartUpdated'));
            setAddedId(bookId);
            setTimeout(() => setAddedId(null), 2000);
        } catch (error) {
            console.error('Failed to add to cart', error);
        } finally {
            setAddingId(null);
        }
    };

    if (loading) {
        return (
            <div className="wishlist-page text-center py-5">
                <div className="spinner-border text-primary" />
                <p className="text-muted mt-3 small">Loading wishlist...</p>
            </div>
        );
    }

    if (wishlistItems.length === 0) {
        return (
            <div className="wishlist-page" style={{ padding: 24, textAlign: 'center' }}>
                <h2>Your Wishlist is empty</h2>
                <p className="text-muted">Add your favorite books here।</p>
                <Link to="/">Show books</Link>
            </div>
        );
    }

    return (
        <div className="wishlist-page" style={{ padding: 24 }}>
            <h2 className="fw-bold mb-4">My Wishlist</h2>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: 16,
                }}
            >
                {wishlistItems.map((item) => {
                    const hasDiscount = !!item.discountPrice && item.discountPrice < item.bookPrice;
                    const displayPrice = hasDiscount ? item.discountPrice! : item.bookPrice;
                    const discountPercentage = hasDiscount
                        ? Math.round(((item.bookPrice - item.discountPrice!) / item.bookPrice) * 100)
                        : 0;
                    const isOutOfStock = item.stock === 0;
                    const isAdding = addingId === item.bookId;
                    const justAdded = addedId === item.bookId;

                    return (
                        <div
                            key={item.wishlistItemId}
                            className="card border-0 rounded-3 overflow-hidden position-relative"
                            style={{
                                height: '330px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                transition: 'box-shadow 0.2s, transform 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                            }}
                        >
                            {/* Remove (X) button */}
                            <button
                                onClick={() => handleRemove(item.bookId)}
                                className="btn btn-light btn-sm rounded-circle position-absolute d-flex align-items-center justify-content-center p-0"
                                style={{
                                    top: '8px',
                                    right: '8px',
                                    width: '28px',
                                    height: '28px',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    zIndex: 3,
                                }}
                                aria-label="Remove from wishlist"
                            >
                                <i className="bi bi-x-lg" style={{ fontSize: '12px' }}></i>
                            </button>

                            {/* Cover */}
                            <Link to={`/books/${item.bookId}`} className="text-decoration-none">
                                <div style={{ height: '230px', overflow: 'hidden', background: '#f0f4f8', position: 'relative' }}>
                                    <img
                                        src={item.imageUrl || PLACEHOLDER_IMG}
                                        alt={item.bookTitle}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                                    />

                                    {hasDiscount && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: 0,
                                                height: 0,
                                                borderStyle: 'solid',
                                                borderWidth: '64px 64px 0 0',
                                                borderColor: '#E24B4A transparent transparent transparent',
                                                zIndex: 2,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '-58px',
                                                    left: '2px',
                                                    color: '#fff',
                                                    fontSize: '11px',
                                                    fontWeight: 500,
                                                    lineHeight: 1.2,
                                                    transform: 'rotate(-45deg)',
                                                    textAlign: 'center',
                                                    width: '46px',
                                                }}
                                            >
                                                <span style={{ fontSize: '14px', fontWeight: 700 }}>{discountPercentage}%</span>
                                                <br />
                                                <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>OFF</span>
                                            </div>
                                        </div>
                                    )}

                                    {isOutOfStock && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.5)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <span className="badge bg-danger px-3 py-2">Out of Stock</span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            {/* Body */}
                            <div className="card-body p-2 d-flex flex-column" style={{ height: '130px' }}>
                                <Link to={`/books/${item.bookId}`} className="text-decoration-none text-dark" title={item.bookTitle}>
                                    <h6
                                        className="fw-semibold mb-1 lh-sm"
                                        style={{
                                            fontSize: '13px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            minHeight: '38px',
                                        }}
                                    >
                                        {item.bookTitle}
                                    </h6>
                                </Link>

                                {item.author && (
                                    <p className="text-muted mb-1" style={{ fontSize: '11px' }}>
                                        {item.author}
                                    </p>
                                )}

                                <div className="d-flex align-items-center justify-content-between mt-auto">
                                    <div>
                                        {hasDiscount ? (
                                            <>
                                                <span className="fw-bold text-success" style={{ fontSize: '15px' }}>
                                                    ৳{displayPrice.toFixed(0)}
                                                </span>
                                                <span className="text-muted text-decoration-line-through ms-2" style={{ fontSize: '12px' }}>
                                                    ৳{item.bookPrice.toFixed(0)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="fw-bold text-success" style={{ fontSize: '15px' }}>
                                                ৳{item.bookPrice.toFixed(0)}
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        className={`btn btn-sm fw-semibold px-2 py-1 ${isOutOfStock ? 'btn-secondary' : justAdded ? 'btn-success' : 'btn-primary'}`}
                                        style={{ fontSize: '11px' }}
                                        disabled={isOutOfStock || isAdding}
                                        onClick={() => handleAddToCart(item.bookId)}
                                    >
                                        {isAdding ? (
                                            <span className="spinner-border spinner-border-sm" />
                                        ) : isOutOfStock ? (
                                            'Unavailable'
                                        ) : justAdded ? (
                                            <><i className="bi bi-check-lg me-1"></i>Added</>
                                        ) : (
                                            <><i className="bi bi-cart-plus me-1"></i>Add to cart</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WishlistPage;