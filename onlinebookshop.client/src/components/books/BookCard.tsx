// =============================================
// BookCard.tsx — Updated with Discount
// =============================================
import { Link } from "react-router-dom";
import type { BookResponseDto } from "../../types/book.types";

interface Props {
    book: BookResponseDto;
    onAddToCart: (bookId: number) => void;
    onAddToWishlist: (bookId: number) => void;
    addingToCart?: boolean;
    cartQuantity?: number;
   // isInWishlist?: boolean;
}

const PLACEHOLDER_IMG = "https://placehold.co/160x220/e8f4f8/2c7be5?text=No+Cover";

export default function BookCard({
    book,
    onAddToCart,
 
    addingToCart = false,
    cartQuantity = 0,
    //isInWishlist = false,
}: Props) {
    const isOutOfStock = book.stock === 0;
    const isMaxedOut = cartQuantity >= book.stock && book.stock > 0;

    // Discount Logic
    const hasDiscount = !!book.discountPrice && book.discountPrice < book.price;
    const displayPrice = hasDiscount ? book.discountPrice! : book.price;
    const discountPercentage = hasDiscount
        ? Math.round(((book.price - book.discountPrice!) / book.price) * 100)
        : 0;

    return (
        <div
            className="card border-0 rounded-3 overflow-hidden position-relative"
            style={{
                height: "330px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                transition: "box-shadow 0.2s, transform 0.2s",
                cursor: "pointer",
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
            }}
        >
            {/* ── Book Cover ── */}
            <Link to={`/books/${book.bookId}`} className="text-decoration-none">
                <div
                    style={{
                        height: "230px",
                        overflow: "hidden",
                        background: "#f0f4f8",
                        position: "relative",
                    }}
                >
                    <img
                        src={book.imageUrl || PLACEHOLDER_IMG}
                        alt={book.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transition: "transform 0.3s ease",
                        }}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                    />

                    {/* ── Corner Fold Discount Badge ── */}
                    {hasDiscount && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: 0,
                                height: 0,
                                borderStyle: "solid",
                                borderWidth: "64px 64px 0 0",
                                borderColor: "#E24B4A transparent transparent transparent",
                                zIndex: 2,
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: "-58px",
                                    left: "2px",
                                    color: "#fff",
                                    fontSize: "11px",
                                    fontWeight: 500,
                                    lineHeight: 1.2,
                                    transform: "rotate(-45deg)",
                                    textAlign: "center",
                                    width: "46px",
                                }}
                            >
                                <span style={{ fontSize: "14px", fontWeight: 700 }}>
                                    {discountPercentage}%
                                </span>
                                <br />
                                <span style={{ fontSize: "9px", letterSpacing: "0.05em" }}>
                                    OFF
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Out of Stock overlay */}
                    {isOutOfStock && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "rgba(0,0,0,0.5)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <span className="badge bg-danger px-3 py-2">Out of Stock</span>
                        </div>
                    )}

                    {/* In Cart badge */}
                    {cartQuantity > 0 && (
                        <span
                            className="badge bg-success position-absolute"
                            style={{ bottom: "6px", right: "6px", fontSize: "10px" }}
                        >
                            ✓ {cartQuantity} in cart
                        </span>
                    )}
                </div>
            </Link>

            {/* Wishlist button */}
            
            {/*<button*/}
            {/*    className="btn btn-light btn-sm rounded-circle position-absolute d-flex align-items-center justify-content-center p-0"*/}
            {/*    style={{*/}
            {/*        top: "8px",*/}
            {/*        right: "8px",*/}
            {/*        width: "32px",*/}
            {/*        height: "32px",*/}
            {/*        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",*/}
            {/*        zIndex: 2,*/}
            {/*    }}*/}
            {/*    onClick={(e) => {*/}
            {/*        e.stopPropagation();*/}
            {/*        onAddToWishlist(book.bookId);*/}
            {/*    }}*/}
            {/*    title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}*/}
            {/*>*/}
            {/*    <i*/}
            {/*        className={`bi ${isInWishlist ? "bi-heart-fill text-danger" : "bi-heart"}`}*/}
            {/*        style={{ fontSize: "14px" }}*/}
            {/*    ></i>*/}
            {/*</button>*/}

            {/* ── Card Body ── */}
            <div className="card-body p-2 d-flex flex-column" style={{ height: "130px" }}>
                {/* Title */}
                <Link
                    to={`/books/${book.bookId}`}
                    className="text-decoration-none text-dark"
                    title={book.title}
                >
                    <h6
                        className="fw-semibold mb-1 lh-sm"
                        style={{
                            fontSize: "13px",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            minHeight: "38px",
                        }}
                    >
                        {book.title}
                    </h6>
                </Link>

                {/* Author */}
                <p className="text-muted mb-1" style={{ fontSize: "11px" }}>
                    {book.author}
                </p>

                {/* Price Section */}
                <div className="d-flex align-items-center justify-content-between mt-auto">
                    <div>
                        {hasDiscount ? (
                            <>
                                <span className="fw-bold text-success" style={{ fontSize: "15px" }}>
                                    ৳{displayPrice.toFixed(0)}
                                </span>
                                <span
                                    className="text-muted text-decoration-line-through ms-2"
                                    style={{ fontSize: "12px" }}
                                >
                                    ৳{book.price.toFixed(0)}
                                </span>
                            </>
                        ) : (
                            <span className="fw-bold text-success" style={{ fontSize: "15px" }}>
                                ৳{book.price.toFixed(0)}
                            </span>
                        )}
                    </div>

                    <button
                        className={`btn btn-sm fw-semibold px-2 py-1 ${isOutOfStock || isMaxedOut ? "btn-secondary" : "btn-primary"}`}
                        style={{ fontSize: "11px" }}
                        disabled={isOutOfStock || addingToCart || isMaxedOut}
                        onClick={() => onAddToCart(book.bookId)}
                    >
                        {addingToCart ? (
                            <span className="spinner-border spinner-border-sm" />
                        ) : isOutOfStock ? (
                            "Unavailable"
                        ) : isMaxedOut ? (
                            `✓ ${cartQuantity}`
                        ) : (
                            <><i className="bi bi-cart-plus me-1"></i>Add to cart</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}