//// =============================================
//// BookDetailPage.tsx
//// =============================================

//import { useState, useEffect } from "react";
//import { useParams, useNavigate, Link } from "react-router-dom";
//import axios from "axios";
//import Navbar from "../components/common/Navbar";
//import ReviewSection from "../components/books/ReviewSection";
//import BookService from "../services/book.service";
//import CartService from "../services/cart.service";
//import ReviewService from "../services/review.service";
//import AuthService from "../services/auth.service";
//import type { BookResponseDto, CategoryResponseDto } from "../types/book.types";
//import type { ReviewResponseDto } from "../types/review.types";
//const PLACEHOLDER_IMG = "https://placehold.co/400x550?text=No+Cover";

//export default function BookDetailPage() {
//    const { id } = useParams<{ id: string }>();
//    const navigate = useNavigate();

//    const [book, setBook] = useState<BookResponseDto | null>(null);
//    const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
//    const [loading, setLoading] = useState(true);
//    const [error, setError] = useState("");
//    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
//    // Cart state
//    const [addingToCart, setAddingToCart] = useState(false);
//    const [cartMessage, setCartMessage] = useState("");
//    const [cartError, setCartError] = useState("");
//    const [cartQuantity, setCartQuantity] = useState(0);

//    // ── Fetch book + reviews ──

//    useEffect(() => {
//        const fetchData = async () => {
//            if (!id) return;
//            setLoading(true);
//            setError("");
//            try {

//                const [bookData, catsData] = await Promise.all([
//                    BookService.getBookById(parseInt(id)),
//                    BookService.getCategories(),
//                ]);
//                setBook(bookData);
//                setCategories(catsData);


//                try {
//                    const reviewsData = await ReviewService.getByBook(parseInt(id));
//                    setReviews(reviewsData);
//                } catch {
//                    setReviews([]);
//                }

//            } catch (err: unknown) {
//                if (axios.isAxiosError(err)) {
//                    setError(err.response?.data?.message || "Book not found.");
//                } else {
//                    setError("Something went wrong.");
//                }
//            } finally {
//                setLoading(false);
//            }
//        };
//        fetchData();
//    }, [id]);

//    // ── Fetch cart quantity ──
//    useEffect(() => {
//        if (!AuthService.isAuthenticated() || !id) return;
//        const loadCartQty = async () => {
//            try {
//                const cart = await CartService.getMyCart();
//                const item = cart.items.find((i) => i.bookId === parseInt(id));
//                setCartQuantity(item?.quantity ?? 0);
//            } catch {
//                setCartQuantity(0);
//            }
//        };
//        loadCartQty();
//    }, [id]);

//    // ── Add to Cart ──
//    const handleAddToCart = async () => {
//        if (!AuthService.isAuthenticated()) {
//            navigate("/auth");
//            return;
//        }
//        if (!book) return;

//        setAddingToCart(true);
//        setCartError("");
//        setCartMessage("");
//        try {
//            await CartService.addItem({ bookId: book.bookId, quantity: 1 });
//            setCartMessage("Book added to cart!");
//            setCartQuantity((prev) => prev + 1);
//            window.dispatchEvent(new Event("cartUpdated"));
//            setTimeout(() => setCartMessage(""), 2500);
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                setCartError(err.response?.data?.message || "Failed to add to cart.");
//            } else {
//                setCartError("Something went wrong.");
//            }
//            setTimeout(() => setCartError(""), 3000);
//        } finally {
//            setAddingToCart(false);
//        }
//    };

//    // ── Review handlers ──
//    const handleReviewAdded = (review: ReviewResponseDto) => {
//        setReviews((prev) => [review, ...prev]);
//    };

//    const handleReviewDeleted = (reviewId: number) => {
//        setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
//    };

//    // ── Computed values ──
//    const avgRating =
//        reviews.length > 0
//            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
//            : 0;

//    const isOutOfStock = book?.stock === 0;
//    const isMaxedOut = book ? cartQuantity >= book.stock : false;

//    // =============================================
//    // RENDER
//    // =============================================
//    return (
//        <>
//            <Navbar />
//            <div className="bg-light min-vh-100 py-4">
//                <div className="container">

//                    {/* Breadcrumb */}
//                    <nav className="mb-4" aria-label="breadcrumb">
//                        <ol className="breadcrumb">
//                            <li className="breadcrumb-item">
//                                <Link to="/" className="text-decoration-none">Home</Link>
//                            </li>
//                            <li className="breadcrumb-item active">
//                                {loading ? "Loading..." : book?.title ?? "Book Detail"}
//                            </li>
//                        </ol>
//                    </nav>

//                    {/* Loading */}
//                    {loading && (
//                        <div className="text-center py-5">
//                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
//                            <p className="text-muted mt-3">Loading book details...</p>
//                        </div>
//                    )}

//                    {/* Error */}
//                    {!loading && error && (
//                        <div className="alert alert-danger d-flex align-items-center gap-2">
//                            <i className="bi bi-exclamation-triangle-fill"></i>
//                            {error}
//                            <Link to="/" className="btn btn-link btn-sm ms-auto p-0">
//                                Go back to Home
//                            </Link>
//                        </div>
//                    )}

//                    {/* Book Content */}
//                    {!loading && book && (
//                        <>
//                            <div className="row g-5 mb-5">

//                                {/* ── Left: Book Cover ── */}
//                                <div className="col-lg-4 col-md-5">
//                                    <div className="sticky-top" style={{ top: "80px" }}>

//                                        {/* Cover Image */}
//                                        <div className="card border-0 shadow rounded-3 overflow-hidden mb-3">
//                                            <img
//                                                src={book.imageUrl || PLACEHOLDER_IMG}
//                                                alt={book.title}
//                                                className="w-100"
//                                                style={{ maxHeight: "480px", objectFit: "cover" }}
//                                                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
//                                            />
//                                        </div>

//                                        {/* Cart Actions */}
//                                        <div className="card border-0 shadow-sm rounded-3 p-3">

//                                            {/* Price */}
//                                            <div className="d-flex align-items-center justify-content-between mb-3">
//                                                <span className="display-6 fw-bold text-success">
//                                                    ৳ {book.price.toFixed(2)}
//                                                </span>
//                                                <span
//                                                    className={`badge fs-6 ${isOutOfStock
//                                                            ? "bg-danger"
//                                                            : isMaxedOut
//                                                                ? "bg-secondary"
//                                                                : "bg-success"
//                                                        }`}
//                                                >
//                                                    {isOutOfStock
//                                                        ? "Out of Stock"
//                                                        : isMaxedOut
//                                                            ? "Max Added"
//                                                            : `${book.stock} in stock`}
//                                                </span>
//                                            </div>

//                                            {/* Cart message */}
//                                            {cartMessage && (
//                                                <div className="alert alert-success py-2 small mb-3 d-flex align-items-center gap-2">
//                                                    <i className="bi bi-check-circle-fill"></i>
//                                                    {cartMessage}
//                                                </div>
//                                            )}
//                                            {cartError && (
//                                                <div className="alert alert-danger py-2 small mb-3">
//                                                    {cartError}
//                                                </div>
//                                            )}

//                                            {/* Cart quantity indicator */}
//                                            {cartQuantity > 0 && (
//                                                <div className="alert alert-light border py-2 small mb-3 d-flex align-items-center gap-2">
//                                                    <i className="bi bi-cart-check text-success"></i>
//                                                    <span>{cartQuantity} in your cart</span>
//                                                    <Link to="/cart" className="ms-auto btn btn-link btn-sm p-0 text-decoration-none">
//                                                        View Cart →
//                                                    </Link>
//                                                </div>
//                                            )}

//                                            {/* Add to Cart Button */}
//                                            <button
//                                                className={`btn w-100 fw-bold py-2 mb-2 ${isMaxedOut && !isOutOfStock ? "btn-secondary" : "btn-primary"
//                                                    }`}
//                                                onClick={handleAddToCart}
//                                                disabled={isOutOfStock || addingToCart || isMaxedOut}
//                                            >
//                                                {addingToCart ? (
//                                                    <>
//                                                        <span className="spinner-border spinner-border-sm me-2" />
//                                                        Adding...
//                                                    </>
//                                                ) : isOutOfStock ? (
//                                                    <>
//                                                        <i className="bi bi-x-circle me-2"></i>
//                                                        Out of Stock
//                                                    </>
//                                                ) : isMaxedOut ? (
//                                                    <>
//                                                        <i className="bi bi-check-circle me-2"></i>
//                                                        In Cart ({cartQuantity})
//                                                    </>
//                                                ) : (
//                                                    <>
//                                                        <i className="bi bi-cart-plus me-2"></i>
//                                                        Add to Cart
//                                                    </>
//                                                )}
//                                            </button>

//                                            {/* View Cart Button */}
//                                            {cartQuantity > 0 && (
//                                                <Link to="/cart" className="btn btn-outline-success w-100 fw-semibold">
//                                                    <i className="bi bi-cart3 me-2"></i>
//                                                    Go to Cart
//                                                </Link>
//                                            )}

//                                        </div>
//                                    </div>
//                                </div>

//                                {/* ── Right: Book Details ── */}
//                                <div className="col-lg-8 col-md-7">

//                                    {/* Title */}
//                                    <h1 className="fw-bold mb-2" style={{ lineHeight: 1.2 }}>
//                                        {book.title}
//                                    </h1>

//                                    {/* Author */}
//                                    <p className="text-muted fs-5 mb-3">
//                                        <i className="bi bi-person me-2"></i>
//                                        by <span className="fw-semibold text-dark">{book.author}</span>
//                                    </p>

//                                    {/* Rating Summary */}
//                                    {reviews.length > 0 && (
//                                        <div className="d-flex align-items-center gap-2 mb-3">
//                                            <div className="d-flex gap-1">
//                                                {[1, 2, 3, 4, 5].map((star) => (
//                                                    <i
//                                                        key={star}
//                                                        className={`bi ${star <= Math.round(avgRating)
//                                                                ? "bi-star-fill text-warning"
//                                                                : "bi-star text-muted"
//                                                            }`}
//                                                        style={{ fontSize: "16px" }}
//                                                    />
//                                                ))}
//                                            </div>
//                                            <span className="fw-semibold">{avgRating.toFixed(1)}</span>
//                                            <span className="text-muted small">({reviews.length} reviews)</span>
//                                        </div>
//                                    )}


//                                    <div className="row g-2 mb-4">
//                                        <div className="col-auto">
//                                            <span className="badge bg-primary-subtle text-primary-emphasis px-3 py-2">
//                                                <i className="bi bi-tag me-1"></i>
//                                                Category: {categories.find((c) => c.categoryId === book.categoryId)?.name ?? `Category #${book.categoryId}`}
//                                            </span>
//                                        </div>
//                                        <div className="col-auto">
//                                            <span className="badge bg-secondary-subtle text-secondary-emphasis px-3 py-2">
//                                                <i className="bi bi-shop me-1"></i>
//                                                Publisher :{book.publisher}
//                                            </span>
//                                        </div>
//                                        <div className="col-auto">
//                                            <span className="badge bg-secondary-subtle text-secondary-emphasis px-3 py-2">
//                                                <i className="bi bi-shop me-1"></i>
//                                                Edition :{book.edition}
//                                            </span>
//                                        </div>

//                                        {/*<div className="col-auto">*/}
//                                        {/*    <span className="badge bg-light text-muted border px-3 py-2">*/}
//                                        {/*        <i className="bi bi-calendar me-1"></i>*/}
//                                        {/*        {new Date(book.createdAt).toLocaleDateString("en-GB", {*/}
//                                        {/*            day: "2-digit",*/}
//                                        {/*            month: "short",*/}
//                                        {/*            year: "numeric",*/}
//                                        {/*        })}*/}
//                                        {/*    </span>*/}
//                                        {/*</div>*/}
//                                    </div>
//                                    {/* Description */}
//                                    {book.description && (
//                                        <div className="mb-4">
//                                            <h5 className="fw-bold mb-3">About this book</h5>
//                                            <p className="text-muted lh-lg">{book.description}</p>
//                                        </div>
//                                    )}

//                                    {/* Divider */}
//                                    <hr className="my-4" />

//                                    {/* Reviews Section */}
//                                    <ReviewSection
//                                        bookId={book.bookId}
//                                        reviews={reviews}
//                                        onReviewAdded={handleReviewAdded}
//                                        onReviewDeleted={handleReviewDeleted}
//                                    />

//                                </div>
//                            </div>
//                        </>
//                    )}

//                </div>
//            </div>
//        </>
//    );
//}

// BookDetailPage.tsx — Production-level redesign
// =============================================

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import ReviewSection from "../components/books/ReviewSection";
import BookService from "../services/book.service";
import CartService from "../services/cart.service";
import ReviewService from "../services/review.service";
import AuthService from "../services/auth.service";
import type { BookResponseDto, CategoryResponseDto } from "../types/book.types";
import type { ReviewResponseDto } from "../types/review.types";
import WishlistButton from "../components/wishlist/WishlistButton";

const PLACEHOLDER_IMG = "https://placehold.co/400x550/f1f5f9/94a3b8?text=No+Cover";

type DetailTab = "summary" | "description" | "reviews";

export default function BookDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [book, setBook] = useState<BookResponseDto | null>(null);
    const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");
    const [cartQuantity, setCartQuantity] = useState(0);
    const [activeTab, setActiveTab] = useState<DetailTab>("summary");

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            setError("");
            try {
                const [bookData, catsData] = await Promise.all([
                    BookService.getBookById(parseInt(id)),
                    BookService.getCategories(),
                ]);
                setBook(bookData);
                setCategories(catsData);
                try {
                    const reviewsData = await ReviewService.getByBook(parseInt(id));
                    setReviews(reviewsData);
                } catch {
                    setReviews([]);
                }
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || "Book not found.");
                } else {
                    setError("Something went wrong.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (!AuthService.isAuthenticated() || !id) return;
        const loadCartQty = async () => {
            try {
                const cart = await CartService.getMyCart();
                const item = cart.items.find((i) => i.bookId === parseInt(id));
                setCartQuantity(item?.quantity ?? 0);
            } catch {
                setCartQuantity(0);
            }
        };
        loadCartQty();
    }, [id]);

    const handleAddToCart = async () => {
        if (!AuthService.isAuthenticated()) { navigate("/auth"); return; }
        if (!book) return;
        setAddingToCart(true);
        setCartError("");
        setCartMessage("");
        try {
            await CartService.addItem({ bookId: book.bookId, quantity: 1 });
            setCartMessage("Book added to cart!");
            setCartQuantity((prev) => prev + 1);
            window.dispatchEvent(new Event("cartUpdated"));
            setTimeout(() => setCartMessage(""), 2500);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setCartError(err.response?.data?.message || "Failed to add to cart.");
            } else {
                setCartError("Something went wrong.");
            }
            setTimeout(() => setCartError(""), 3000);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleReviewAdded = (review: ReviewResponseDto) => setReviews((prev) => [review, ...prev]);
    const handleReviewDeleted = (reviewId: number) => setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));

    const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    const isOutOfStock = book?.stock === 0;
    const isMaxedOut = book ? cartQuantity >= book.stock : false;
    const categoryName = categories.find((c) => c.categoryId === book?.categoryId)?.name ?? "—";

    const hasDiscount = !!book?.discountPrice && book.discountPrice < book.price;
    const displayPrice = hasDiscount ? book!.discountPrice! : book?.price ?? 0;
    const discountPercentage = hasDiscount
        ? Math.round(((book!.price - book!.discountPrice!) / book!.price) * 100) : 0;

    // ── Specification rows (single source of truth — shown once, in Summary tab) ──
    const summaryRows = book ? [
        { label: "Author", value: book.author, icon: "bi-person" },
        { label: "Category", value: categoryName, icon: "bi-tag" },
        { label: "Publisher", value: book.publisher, icon: "bi-building" },
        { label: "Edition", value: book.edition, icon: "bi-journal-bookmark" },
        { label: "Language", value: book.language, icon: "bi-translate" },
        { label: "Pages", value: book.pageCount ? `${book.pageCount} pages` : null, icon: "bi-file-text" },
        { label: "ISBN", value: book.isbn, icon: "bi-upc-scan" },
    ].filter((row) => row.value) : [];

    return (
        <>
            <Navbar />
            <div style={{ background: "#f8fafc", minHeight: "100vh" }} className="py-4">
                <div className="container" style={{ maxWidth: "1140px" }}>

                    {/* Breadcrumb */}
                    <nav className="mb-4" aria-label="breadcrumb">
                        <ol className="breadcrumb mb-0" style={{ fontSize: "13px" }}>
                            <li className="breadcrumb-item">
                                <Link to="/" className="text-decoration-none text-muted">Home</Link>
                            </li>
                            {book && !loading && (
                                <li className="breadcrumb-item">
                                    <span className="text-muted">{categoryName}</span>
                                </li>
                            )}
                            <li className="breadcrumb-item active text-truncate" style={{ maxWidth: "300px" }}>
                                {loading ? "Loading..." : book?.title ?? "Book Detail"}
                            </li>
                        </ol>
                    </nav>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" style={{ width: "2.5rem", height: "2.5rem" }} />
                            <p className="text-muted mt-3 small">Loading book details...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 border-0 shadow-sm">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            {error}
                            <Link to="/" className="btn btn-link btn-sm ms-auto p-0">Go back to Home</Link>
                        </div>
                    )}

                    {!loading && book && (
                        <>
                            {/* ══════════════ Top Section: Cover + Buy Box + Key Info ══════════════ */}
                            <div className="row g-4 mb-4">

                                {/* ── Left: Cover ── */}
                                <div className="col-lg-3 col-md-4">
                                    <div className="sticky-top" style={{ top: "80px" }}>
                                        <div
                                            className="rounded-4 overflow-hidden position-relative bg-white"
                                            style={{ boxShadow: "0 4px 24px rgba(15,23,42,0.08)" }}
                                        >
                                            {hasDiscount && (
                                                <div style={{
                                                    position: "absolute", top: 0, left: 0,
                                                    width: 0, height: 0, borderStyle: "solid",
                                                    borderWidth: "58px 58px 0 0",
                                                    borderColor: "#e11d48 transparent transparent transparent",
                                                    zIndex: 2,
                                                }}>
                                                    <div style={{
                                                        position: "absolute", top: "-52px", left: "1px",
                                                        color: "#fff", fontSize: "10px", fontWeight: 500,
                                                        lineHeight: 1.15, transform: "rotate(-45deg)",
                                                        textAlign: "center", width: "42px",
                                                    }}>
                                                        <span style={{ fontSize: "13px", fontWeight: 700 }}>{discountPercentage}%</span>
                                                        <br />
                                                        <span style={{ fontSize: "8px", letterSpacing: "0.05em" }}>OFF</span>
                                                    </div>
                                                </div>
                                            )}
                                            <img
                                                src={book.imageUrl || PLACEHOLDER_IMG}
                                                alt={book.title}
                                                className="w-100"
                                                style={{ aspectRatio: "3/4.2", objectFit: "cover", display: "block" }}
                                                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                                            />
                                        </div>

                                        {/* Status badges below cover */}
                                        <div className="d-flex gap-2 mt-3 flex-wrap">
                                            {book.isFeatured && (
                                                <span className="badge rounded-pill px-3 py-2" style={{ background: "#fef3c7", color: "#92400e", fontSize: "11px", fontWeight: 600 }}>
                                                    <i className="bi bi-star-fill me-1"></i>Featured
                                                </span>
                                            )}
                                            {/*{!book.isActive && (*/}
                                            {/*    <span className="badge rounded-pill px-3 py-2 bg-secondary" style={{ fontSize: "11px" }}>*/}
                                            {/*        Inactive*/}
                                            {/*    </span>*/}
                                            {/*)}*/}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Middle: Title, Meta, Description snippet ── */}
                                <div className="col-lg-6 col-md-8">

                                 
                                    <h1
                                        className="fw-bold mb-2"
                                        style={{ fontSize: "26px", lineHeight: 1.25, color: "#0f172a", letterSpacing: "-0.01em" }}
                                    >
                                        {book.title}
                                       
                                    </h1>
                                    <p className="mb-3" style={{ fontSize: "15px" }}>
                                        <span className="text-muted">by </span>
                                        <span className="fw-semibold" style={{ color: "#1d4ed8" }}>{book.author}</span>
                                    </p>

                                    {/* Rating row */}
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        {reviews.length > 0 ? (
                                            <>
                                                <div className="d-flex gap-1">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <i key={star}
                                                            className={`bi ${star <= Math.round(avgRating) ? "bi-star-fill" : "bi-star"}`}
                                                            style={{ fontSize: "15px", color: star <= Math.round(avgRating) ? "#f59e0b" : "#cbd5e1" }}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="fw-semibold small" style={{ color: "#0f172a" }}>{avgRating.toFixed(1)}</span>
                                                <span className="text-muted small">({reviews.length} review{reviews.length !== 1 ? "s" : ""})</span>
                                            </>
                                        ) : (
                                            <span className="text-muted small">
                                                <i className="bi bi-star me-1"></i>No reviews yet
                                            </span>
                                        )}
                                    </div>

                                    {/* Wishlist action — separate line below */}
                                    <div className="d-flex align-items-center gap-1 mb-3">
                                        <WishlistButton bookId={book.bookId} />
                                        <span className="text-muted small">Add to Wishlist</span>
                                    </div>
                                    {/* Quick meta chips */}
                              
                                    <div className="d-flex flex-column gap-2 mb-4">
                                        {[
                                            { label: "Category", icon: "bi-tag", text: categoryName },
                                            book.publisher ? { label: "Publisher", icon: "bi-building", text: book.publisher } : null,
                                   
                                           
                                        ].filter(Boolean).map((chip) => (
                                            <span
                                                key={chip!.label}
                                                className="d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill"
                                                style={{ background: "#eef2ff", color: "#4338ca", fontSize: "12px", fontWeight: 500, width: "fit-content" }}
                                            >
                                                <i className={`bi ${chip!.icon}`}></i>
                                                <span style={{ fontWeight: 600 }}>{chip!.label}:</span>
                                                {chip!.text}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Short description preview */}
                                    {book.description && (
                                        <p
                                            className="text-muted mb-0"
                                            style={{
                                                fontSize: "14px",
                                                lineHeight: 1.7,
                                                display: "-webkit-box",
                                                WebkitLineClamp: 4,
                                                WebkitBoxOrient: "vertical" as const,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {book.description}
                                        </p>
                                    )}
                                </div>

                                {/* ── Right: Buy Box ── */}
                                <div className="col-lg-3 col-md-12">
                                    <div
                                        className="rounded-4 p-4 bg-white sticky-top"
                                        style={{ top: "80px", boxShadow: "0 4px 24px rgba(15,23,42,0.08)" }}
                                    >
                                        {/* Price */}
                                        <div className="mb-3">
                                            {hasDiscount ? (
                                                <>
                                                    <div className="d-flex align-items-baseline gap-2">
                                                        <span className="fw-bold" style={{ fontSize: "28px", color: "#16a34a" }}>
                                                            ৳{displayPrice.toFixed(0)}
                                                        </span>
                                                        <span className="text-muted text-decoration-line-through" style={{ fontSize: "15px" }}>
                                                            ৳{book.price.toFixed(0)}
                                                        </span>
                                                    </div>
                                                    <span className="badge mt-1" style={{ background: "#fee2e2", color: "#dc2626", fontSize: "11px" }}>
                                                        Save {discountPercentage}%
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="fw-bold" style={{ fontSize: "28px", color: "#16a34a" }}>
                                                    ৳{book.price.toFixed(0)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock status */}
                                        <div
                                            className="d-flex align-items-center gap-2 mb-3 px-3 py-2 rounded-3"
                                            style={{
                                                background: isOutOfStock ? "#fef2f2" : "#f0fdf4",
                                                fontSize: "13px",
                                            }}
                                        >
                                            <i className={`bi ${isOutOfStock ? "bi-x-circle-fill text-danger" : "bi-check-circle-fill text-success"}`}></i>
                                            <span className={isOutOfStock ? "text-danger fw-semibold" : "text-success fw-semibold"}>
                                                {isOutOfStock ? "Out of Stock" : isMaxedOut ? "Max quantity in cart" : `${book.stock} in stock`}
                                            </span>
                                        </div>

                                        {cartMessage && (
                                            <div className="alert alert-success py-2 px-3 small mb-3 border-0 rounded-3 d-flex align-items-center gap-2">
                                                <i className="bi bi-check-circle-fill"></i>{cartMessage}
                                            </div>
                                        )}
                                        {cartError && (
                                            <div className="alert alert-danger py-2 px-3 small mb-3 border-0 rounded-3">{cartError}</div>
                                        )}

                                        {cartQuantity > 0 && (
                                            <div className="d-flex align-items-center justify-content-between mb-3 px-3 py-2 rounded-3" style={{ background: "#f8fafc", fontSize: "13px" }}>
                                                <span className="text-muted">
                                                    <i className="bi bi-cart-check me-1 text-success"></i>
                                                    {cartQuantity} in cart
                                                </span>
                                                <Link to="/cart" className="text-decoration-none fw-semibold" style={{ fontSize: "12px" }}>
                                                    View →
                                                </Link>
                                            </div>
                                        )}

                                        <button
                                            className="btn w-100 fw-bold py-2 mb-2 border-0"
                                            style={{
                                                background: isOutOfStock || isMaxedOut ? "#94a3b8" : "#4f46e5",
                                                color: "#fff",
                                                borderRadius: "10px",
                                                fontSize: "14px",
                                            }}
                                            onClick={handleAddToCart}
                                            disabled={isOutOfStock || addingToCart || isMaxedOut}
                                        >
                                            {addingToCart ? <><span className="spinner-border spinner-border-sm me-2" />Adding...</>
                                                : isOutOfStock ? "Out of Stock"
                                                    : isMaxedOut ? `In Cart (${cartQuantity})`
                                                        : <><i className="bi bi-cart-plus me-2"></i>Add to Cart</>}
                                        </button>

                                        {cartQuantity > 0 && (
                                            <Link
                                                to="/cart"
                                                className="btn w-100 fw-semibold"
                                                style={{ background: "#f0fdf4", color: "#16a34a", borderRadius: "10px", fontSize: "13px" }}
                                            >
                                                <i className="bi bi-cart3 me-2"></i>Go to Cart
                                            </Link>
                                        )}

                                        {/* Trust signals */}
                                        <div className="mt-3 pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                                            {[
                                                { icon: "bi-truck", text: "Fast home delivery" },
                                                { icon: "bi-arrow-repeat", text: "Easy returns" },
                                                { icon: "bi-shield-check", text: "Secure payment" },
                                            ].map((t) => (
                                                <div key={t.text} className="d-flex align-items-center gap-2 mb-1">
                                                    <i className={`bi ${t.icon} text-muted`} style={{ fontSize: "13px" }}></i>
                                                    <span className="text-muted" style={{ fontSize: "12px" }}>{t.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ══════════════ Bottom Section: Tabs ══════════════ */}
                            <div className="row">
                                <div className="col-lg-9">
                                    <div
                                        className="rounded-4 bg-white overflow-hidden"
                                        style={{ boxShadow: "0 2px 12px rgba(15,23,42,0.05)" }}
                                    >
                                        {/* Tab headers */}
                                        <div style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <div className="d-flex" style={{ overflowX: "auto" }}>
                                                {[
                                                    { key: "summary" as DetailTab, label: "Specification", icon: "bi-card-list" },
                                                    { key: "description" as DetailTab, label: "Description", icon: "bi-text-left" },
                                                    { key: "reviews" as DetailTab, label: `Reviews (${reviews.length})`, icon: "bi-star" },
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.key}
                                                        className="btn border-0 rounded-0 px-4 py-3 fw-semibold"
                                                        onClick={() => setActiveTab(tab.key)}
                                                        style={{
                                                            fontSize: "13.5px",
                                                            whiteSpace: "nowrap",
                                                            color: activeTab === tab.key ? "#4f46e5" : "#64748b",
                                                            borderBottom: activeTab === tab.key ? "2.5px solid #4f46e5" : "2.5px solid transparent",
                                                            background: "transparent",
                                                            transition: "color 0.15s",
                                                        }}
                                                    >
                                                        <i className={`bi ${tab.icon} me-2`}></i>
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="p-4">

                                            {/* ── Specification Tab ── */}
                                            {activeTab === "summary" && (
                                                summaryRows.length === 0 ? (
                                                    <p className="text-muted mb-0 small">No specification details available.</p>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-borderless mb-0" style={{ fontSize: "13.5px" }}>
                                                            <tbody>
                                                                {summaryRows.map((row, i) => (
                                                                    <tr key={row.label} style={{ background: i % 2 === 0 ? "#f8fafc" : "transparent" }}>
                                                                        <td
                                                                            className="fw-semibold"
                                                                            style={{ width: "180px", color: "#64748b", padding: "12px 16px", borderRadius: "8px 0 0 8px" }}
                                                                        >
                                                                            <i className={`bi ${row.icon} me-2`} style={{ color: "#94a3b8" }}></i>
                                                                            {row.label}
                                                                        </td>
                                                                        <td style={{ color: "#0f172a", fontWeight: 500, padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
                                                                            {row.value}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )
                                            )}

                                            {/* ── Description Tab ── */}
                                            {activeTab === "description" && (
                                                <div>
                                                    {book.description ? (
                                                        <p className="mb-0" style={{ color: "#334155", lineHeight: 1.8, fontSize: "14.5px" }}>
                                                            {book.description}
                                                        </p>
                                                    ) : (
                                                        <p className="text-muted mb-0 small">No description available for this book.</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* ── Reviews Tab ── */}
                                            {activeTab === "reviews" && (
                                                <ReviewSection
                                                    bookId={book.bookId}
                                                    reviews={reviews}
                                                    onReviewAdded={handleReviewAdded}
                                                    onReviewDeleted={handleReviewDeleted}
                                                />
                                            )}

                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </>
    );
}