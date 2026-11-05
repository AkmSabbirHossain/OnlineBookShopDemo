// =============================================
// BookCard.tsx — responsive catalog card
// =============================================
import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/language-context";
import { bookPath } from "../../utils/slug";
import type { BookResponseDto } from "../../types/book.types";
import "./book-card.css";

interface Props {
    book: BookResponseDto;
    onAddToCart: (bookId: number) => void;
    addingToCart?: boolean;
    cartQuantity?: number;
}

export default function BookCard({
    book,
    onAddToCart,
    addingToCart = false,
    cartQuantity = 0,
}: Props) {
    const { t, formatNumber } = useLanguage();
    const [imageFailed, setImageFailed] = useState(false);

    const isOutOfStock = book.stock === 0;
    const isMaxedOut = book.stock > 0 && cartQuantity >= book.stock;

    const hasDiscount = !!book.discountPrice && book.discountPrice < book.price;
    const displayPrice = hasDiscount ? book.discountPrice! : book.price;
    const discountPercent = hasDiscount
        ? Math.round(((book.price - book.discountPrice!) / book.price) * 100)
        : 0;

    const showImage = !!book.imageUrl && !imageFailed;
    const bookHref = bookPath(book);

    return (
        <article className="bc-card">
            <Link
                to={bookHref}
                className="bc-cover"
                aria-label={t("card.viewBook", { title: book.title })}
                tabIndex={-1}
            >
                {showImage ? (
                    <img
                        className="bc-cover-img"
                        src={book.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <span className="bc-cover-fallback" aria-hidden="true">
                        <i className="bi bi-book" />
                        <span>{t("card.noCover")}</span>
                    </span>
                )}

                {hasDiscount && !isOutOfStock && (
                    <span className="bc-discount">
                        {formatNumber(discountPercent)}%<span>{t("card.off")}</span>
                    </span>
                )}

                {book.reviewCount > 0 && (
                    <span
                        className="bc-rating"
                        title={t("card.ratingTitle", {
                            rating: book.averageRating.toFixed(1),
                            count: formatNumber(book.reviewCount),
                        })}
                    >
                        <i className="bi bi-star-fill" aria-hidden="true" />
                        {book.averageRating.toFixed(1)}
                        <span>({formatNumber(book.reviewCount)})</span>
                    </span>
                )}

                {cartQuantity > 0 && !isOutOfStock && (
                    <span
                        className="bc-in-cart"
                        aria-label={t("card.inCart", { count: formatNumber(cartQuantity) })}
                    >
                        <i className="bi bi-check2" aria-hidden="true" />
                        {formatNumber(cartQuantity)}
                    </span>
                )}

                {isOutOfStock && (
                    <span className="bc-out-overlay">
                        <span className="bc-out-badge">{t("card.outOfStock")}</span>
                    </span>
                )}
            </Link>

            <div className="bc-body">
                <Link className="bc-title" to={bookHref} title={book.title}>
                    {book.title}
                </Link>
                <p className="bc-author" title={book.author}>
                    {book.author}
                </p>

                <div className="bc-footer">
                    <p className="bc-prices">
                        <span className="bc-price">৳{formatNumber(displayPrice)}</span>
                        {hasDiscount && (
                            <span className="bc-price-old">৳{formatNumber(book.price)}</span>
                        )}
                    </p>

                    <button
                        type="button"
                        className={`bc-add${isOutOfStock || isMaxedOut ? " is-disabled" : ""}`}
                        disabled={isOutOfStock || addingToCart || isMaxedOut}
                        onClick={() => onAddToCart(book.bookId)}
                        aria-label={
                            isOutOfStock
                                ? t("card.outOfStockAria", { title: book.title })
                                : isMaxedOut
                                    ? t("card.maxedAria", { title: book.title })
                                    : t("card.addToCart", { title: book.title })
                        }
                    >
                        {addingToCart ? (
                            <span className="bc-spinner" aria-hidden="true" />
                        ) : isOutOfStock ? (
                            <span>{t("card.unavailable")}</span>
                        ) : isMaxedOut ? (
                            <><i className="bi bi-check2" aria-hidden="true" /><span>{t("card.added")}</span></>
                        ) : (
                            <><i className="bi bi-cart-plus" aria-hidden="true" /><span>{t("card.add")}</span></>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
}
