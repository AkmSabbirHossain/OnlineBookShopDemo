// ======================
// WishlistPage.tsx
// =====================
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/wishlist/useWishlist";
import CartService from "../services/cart.service";
import AuthService from "../services/auth.service";
import { bookPath } from "../utils/slug";
import Seo from "../components/common/Seo";
import Navbar from "../components/common/Navbar";
import { useLanguage } from "../i18n/language-context";
import "./wishlist.css";

interface Toast {
    message: string;
    tone: "success" | "error";
}

const WishlistPage = () => {
    const { wishlistItems, removeFromWishlist, loading } = useWishlist();
    const { t, formatNumber } = useLanguage();
    const [addingId, setAddingId] = useState<number | null>(null);
    const [addedId, setAddedId] = useState<number | null>(null);
    const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
    const [toast, setToast] = useState<Toast | null>(null);

    const toastTimer = useRef<number | null>(null);
    const addedTimer = useRef<number | null>(null);

    const isAuthenticated = AuthService.isAuthenticated();

    const showToast = useCallback((message: string, tone: Toast["tone"]) => {
        setToast({ message, tone });
        if (toastTimer.current) window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 2800);
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimer.current) window.clearTimeout(toastTimer.current);
            if (addedTimer.current) window.clearTimeout(addedTimer.current);
        };
    }, []);

    const handleRemove = async (bookId: number) => {
        try {
            await removeFromWishlist(bookId);
            showToast(t("wishlist.removedToast"), "success");
        } catch (error) {
            console.error("Failed to remove item", error);
            showToast(t("wishlist.removeError"), "error");
        }
    };

    const handleAddToCart = async (bookId: number) => {
        if (addingId !== null) return;
        setAddingId(bookId);
        try {
            await CartService.addItem({ bookId, quantity: 1 });
            window.dispatchEvent(new Event("cartUpdated"));
            setAddedId(bookId);
            showToast(t("wishlist.addedToast"), "success");
            if (addedTimer.current) window.clearTimeout(addedTimer.current);
            addedTimer.current = window.setTimeout(() => setAddedId(null), 2200);
        } catch (error) {
            console.error("Failed to add to cart", error);
            showToast(t("wishlist.addError"), "error");
        } finally {
            setAddingId(null);
        }
    };

    let body: ReactNode;

    if (loading) {
        body = (
            <div className="wl-grid" aria-busy="true" aria-label={t("wishlist.loading")}>
                {Array.from({ length: 4 }).map((_, index) => (
                    <div className="wl-skeleton" key={index}>
                        <div className="wl-skeleton-media" />
                        <div className="wl-skeleton-body">
                            <span className="wl-skeleton-line" />
                            <span className="wl-skeleton-line is-short" />
                            <span className="wl-skeleton-line is-price" />
                        </div>
                    </div>
                ))}
            </div>
        );
    } else if (!isAuthenticated) {
        body = (
            <div className="wl-state">
                <span className="wl-state-icon" aria-hidden="true">
                    <i className="bi bi-person-lock" />
                </span>
                <h2 className="wl-state-title">{t("wishlist.signInTitle")}</h2>
                <p className="wl-state-text">{t("wishlist.signInText")}</p>
                <Link className="wl-state-btn" to="/auth">
                    {t("wishlist.signInCta")}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
            </div>
        );
    } else if (wishlistItems.length === 0) {
        body = (
            <div className="wl-state">
                <span className="wl-state-icon" aria-hidden="true">
                    <i className="bi bi-heart" />
                </span>
                <h2 className="wl-state-title">{t("wishlist.emptyTitle")}</h2>
                <p className="wl-state-text">{t("wishlist.emptyText")}</p>
                <Link className="wl-state-btn" to="/books">
                    {t("wishlist.emptyCta")}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                </Link>
            </div>
        );
    } else {
        body = (
            <div className="wl-grid">
                {wishlistItems.map((item) => {
                    const hasDiscount =
                        !!item.discountPrice && item.discountPrice < item.bookPrice;
                    const displayPrice = hasDiscount ? item.discountPrice! : item.bookPrice;
                    const discountPercentage = hasDiscount
                        ? Math.round(
                              ((item.bookPrice - item.discountPrice!) / item.bookPrice) * 100
                          )
                        : 0;
                    const isOutOfStock = item.stock === 0;
                    const isAdding = addingId === item.bookId;
                    const justAdded = addedId === item.bookId;
                    const href = bookPath({ bookId: item.bookId, title: item.bookTitle });
                    const showImage = !!item.imageUrl && !failedImages[item.bookId];

                    return (
                        <article className="wl-card" key={item.wishlistItemId}>
                            <div className="wl-media">
                                <Link
                                    className="wl-media-link"
                                    to={href}
                                    aria-label={t("card.viewBook", { title: item.bookTitle })}
                                    tabIndex={-1}
                                >
                                    {showImage ? (
                                        <img
                                            className="wl-cover"
                                            src={item.imageUrl}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                            onError={() =>
                                                setFailedImages((prev) => ({
                                                    ...prev,
                                                    [item.bookId]: true,
                                                }))
                                            }
                                        />
                                    ) : (
                                        <span className="wl-cover-fallback" aria-hidden="true">
                                            <i className="bi bi-book" />
                                            <span>{t("card.noCover")}</span>
                                        </span>
                                    )}
                                </Link>

                                {hasDiscount && !isOutOfStock && (
                                    <span className="wl-discount">
                                        {formatNumber(discountPercentage)}%
                                        <em>{t("card.off")}</em>
                                    </span>
                                )}

                                {isOutOfStock && (
                                    <span className="wl-out">{t("card.outOfStock")}</span>
                                )}

                                <button
                                    type="button"
                                    className="wl-remove"
                                    aria-label={t("wishlist.remove", {
                                        title: item.bookTitle,
                                    })}
                                    title={t("wishlist.remove", { title: item.bookTitle })}
                                    onClick={() => handleRemove(item.bookId)}
                                >
                                    <i className="bi bi-trash3" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="wl-body">
                                <Link className="wl-name" to={href} title={item.bookTitle}>
                                    {item.bookTitle}
                                </Link>

                                {item.author && <p className="wl-author">{item.author}</p>}

                                <div className="wl-prices">
                                    <span className="wl-price">
                                        ৳{formatNumber(displayPrice)}
                                    </span>
                                    {hasDiscount && (
                                        <span className="wl-price-old">
                                            ৳{formatNumber(item.bookPrice)}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    className={`wl-add${justAdded ? " is-added" : ""}`}
                                    disabled={isOutOfStock || addingId !== null}
                                    aria-label={
                                        isOutOfStock
                                            ? t("card.outOfStockAria", { title: item.bookTitle })
                                            : t("card.addToCart", { title: item.bookTitle })
                                    }
                                    onClick={() => handleAddToCart(item.bookId)}
                                >
                                    {isAdding ? (
                                        <span className="wl-spinner" aria-hidden="true" />
                                    ) : isOutOfStock ? (
                                        <span>{t("card.unavailable")}</span>
                                    ) : justAdded ? (
                                        <>
                                            <i className="bi bi-check2" aria-hidden="true" />
                                            <span>{t("card.added")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-cart-plus" aria-hidden="true" />
                                            <span>{t("card.add")}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        );
    }

    return (
        <>
            <Seo title={t("seo.wishlistTitle")} noindex />
            <Navbar />
            <div className="wl-page">
                <div className="container wl-container">
                    <header className="wl-header">
                        <div className="wl-header-text">
                            <nav className="wl-breadcrumb" aria-label="Breadcrumb">
                                <Link to="/">{t("footer.home")}</Link>
                                <i className="bi bi-chevron-right" aria-hidden="true" />
                                <span aria-current="page">{t("nav.wishlist")}</span>
                            </nav>
                            <h1 className="wl-title">{t("wishlist.title")}</h1>
                            <p className="wl-subtitle">
                                {isAuthenticated && wishlistItems.length > 0
                                    ? t("wishlist.count", {
                                          count: formatNumber(wishlistItems.length),
                                      })
                                    : t("wishlist.subtitle")}
                            </p>
                        </div>
                        <Link className="wl-browse" to="/books">
                            <i className="bi bi-grid" aria-hidden="true" />
                            {t("wishlist.browse")}
                        </Link>
                    </header>

                    {body}
                </div>

                {toast && (
                    <div
                        className={`wl-toast is-${toast.tone}`}
                        role="status"
                        aria-live="polite"
                    >
                        <i
                            className={`bi ${
                                toast.tone === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle-fill"
                            }`}
                            aria-hidden="true"
                        />
                        {toast.message}
                    </div>
                )}
            </div>
        </>
    );
};

export default WishlistPage;
