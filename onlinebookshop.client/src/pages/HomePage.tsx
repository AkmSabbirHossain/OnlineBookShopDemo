// =============================================
// HomePage.tsx
// =============================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import BookCard from "../components/books/BookCard";
import BookService from "../services/book.service";
import CartService from "../services/cart.service";
import AuthService from "../services/auth.service";
import BannerService from "../services/banner.service";

import type {
    BookResponseDto,
    CategoryResponseDto,
    BookFilterParams,
} from "../types/book.types";
import type { BannerResponseDto } from "../types/banner.types";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: BookFilterParams = {
    search: undefined,
    categoryId: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    sortBy: undefined,
    page: 1,
    pageSize: PAGE_SIZE,
};

const CATEGORY_ICONS: Record<string, string> = {
    "Fiction": "bi-book",
    "Science": "bi-flask",
    "History": "bi-bank",
    "Children": "bi-balloon",
    "Religion": "bi-moon-stars",
    "Biography": "bi-person",
    "Technology": "bi-cpu",
    "Business": "bi-briefcase",
    "Poetry": "bi-pen",
    "Travel": "bi-compass",
};

// ── Section Header ──
function SectionHeader({
    title,
    icon,
    onSeeAll,
}: {
    title: string;
    icon?: string;
    onSeeAll?: () => void;
}) {
    return (
        <div className="d-flex align-items-center justify-content-between mb-3">
            <div className="d-flex align-items-center gap-2">
                <div
                    style={{
                        width: "4px",
                        height: "24px",
                        background: "linear-gradient(180deg, #1a237e, #3949ab)",
                        borderRadius: "2px",
                    }}
                />
                {icon && <i className={`bi ${icon} text-primary`} style={{ fontSize: "16px" }}></i>}
                <h5 className="fw-bold mb-0" style={{ fontSize: "15px" }}>{title}</h5>
            </div>
            {onSeeAll && (
                <button
                    className="btn btn-link btn-sm text-decoration-none p-0 fw-semibold"
                    onClick={onSeeAll}
                    style={{ fontSize: "13px" }}
                >
                    See All <i className="bi bi-arrow-right ms-1"></i>
                </button>
            )}
        </div>
    );
}

// ── Hero Slider (Full Width) ──
function HeroSlider({ banners }: { banners: BannerResponseDto[] }) {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (banners.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % banners.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [banners.length]);

    if (banners.length === 0) return null;

    return (
        <div className="hero-slider-fullwidth">
            {banners.map((b, i) => {
                const slide = (
                    <div
                        key={b.bannerId}
                        className={`hero-slide ${i === index ? "hero-slide-active" : ""}`}
                    >
                        <img src={b.imageUrl} alt={b.title} className="hero-slide-img" />
                        <div className="hero-slide-caption">
                            <div className="hero-slide-title">{b.title}</div>
                            {b.subtitle && (
                                <div className="hero-slide-subtitle">{b.subtitle}</div>
                            )}
                        </div>
                    </div>
                );
                return b.linkUrl ? (
                    <a key={b.bannerId} href={b.linkUrl} style={{ textDecoration: "none" }}>
                        {slide}
                    </a>
                ) : (
                    slide
                );
            })}

            {banners.length > 1 && (
                <div className="hero-slider-dots">
                    {banners.map((b, i) => (
                        <button
                            key={b.bannerId}
                            className={`hero-slider-dot ${i === index ? "hero-slider-dot-active" : ""}`}
                            onClick={() => setIndex(i)}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [banners, setBanners] = useState<BannerResponseDto[]>([]);
    const [filters, setFilters] = useState<BookFilterParams>(DEFAULT_FILTERS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});
    const [showAllBooks, setShowAllBooks] = useState(false);

    // ── Fetch ──
    const fetchBooks = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await BookService.getBooks();
            setAllBooks(data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to load books.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCartQuantities = async () => {
        if (!AuthService.isAuthenticated()) return;
        try {
            const cart = await CartService.getMyCart();
            const quantities: Record<number, number> = {};
            cart.items.forEach((item) => {
                quantities[item.bookId] = item.quantity;
            });
            setCartQuantities(quantities);
        } catch (err) {
            console.error("Failed to fetch cart", err);
        }
    };

    useEffect(() => {
        fetchBooks();
        BookService.getCategories().then(setCategories).catch(() => { });
        BannerService.getActive().then(setBanners).catch(() => { });
        fetchCartQuantities();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchParam = params.get("search");
        if (searchParam && searchParam.trim()) {
            setFilters({ ...DEFAULT_FILTERS, search: searchParam.trim() });
            setShowAllBooks(true);
        } else {
            setFilters(DEFAULT_FILTERS);
            setShowAllBooks(false);
        }
    }, [location.search]);

    useEffect(() => {
        const handleCartUpdate = () => fetchCartQuantities();
        window.addEventListener("cartUpdated", handleCartUpdate);
        return () => window.removeEventListener("cartUpdated", handleCartUpdate);
    }, []);

    // ── Filtered books ──
    const filteredBooks = useMemo(() => {
        let result = [...allBooks];
        if (filters.search) {
            const q = filters.search.toLowerCase();
            result = result.filter(
                (b) =>
                    b.title.toLowerCase().includes(q) ||
                    b.author.toLowerCase().includes(q)
            );
        }
        if (filters.categoryId !== undefined) {
            result = result.filter((b) => b.categoryId === filters.categoryId);
        }
        if (filters.minPrice !== undefined)
            result = result.filter((b) => b.price >= filters.minPrice!);
        if (filters.maxPrice !== undefined)
            result = result.filter((b) => b.price <= filters.maxPrice!);
        switch (filters.sortBy) {
            case "price_asc":
                result.sort((a, b) => a.price - b.price);
                break;
            case "price_desc":
                result.sort((a, b) => b.price - a.price);
                break;
            case "newest":
                result.sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
                break;
            case "title_asc":
                result.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        return result;
    }, [allBooks, filters]);

    const newArrivals = useMemo(
        () =>
            [...allBooks]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
                .slice(0, 10),
        [allBooks]
    );

    const currentPage = filters.page ?? 1;
    const totalCount = filteredBooks.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
    const paginatedBooks = filteredBooks.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    const isFiltering = !!(
        filters.search ||
        filters.categoryId !== undefined ||
        filters.sortBy ||
        filters.minPrice ||
        filters.maxPrice
    );

    // ── Handlers ──
    const handleCategoryClick = (categoryId: number) => {
        setFilters({ ...DEFAULT_FILTERS, categoryId });
        setShowAllBooks(true);
        navigate("/", { replace: true });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleAddToCart = async (bookId: number) => {
        if (!AuthService.isAuthenticated()) {
            navigate("/auth");
            return;
        }
        setAddingToCart(bookId);
        setCartError("");
        setCartMessage("");
        try {
            await CartService.addItem({ bookId, quantity: 1 });
            setCartMessage("Book added to cart!");
            setCartQuantities((prev) => ({
                ...prev,
                [bookId]: (prev[bookId] ?? 0) + 1,
            }));
            window.dispatchEvent(new Event("cartUpdated"));
            setTimeout(() => setCartMessage(""), 2500);
        } catch (err: unknown) {
            if (axios.isAxiosError(err))
                setCartError(
                    err.response?.data?.message || "Failed to add to cart."
                );
            else setCartError("Something went wrong.");
            setTimeout(() => setCartError(""), 3000);
        } finally {
            setAddingToCart(null);
        }
    };

    const handleAddToWishlist = (bookId: number) => {
        if (!AuthService.isAuthenticated()) {
            navigate("/auth");
            return;
        }
        console.log("Wishlist:", bookId);
    };

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
        window.scrollTo({ top: 400, behavior: "smooth" });
    };

    const handleReset = () => {
        setFilters(DEFAULT_FILTERS);
        setShowAllBooks(false);
        navigate("/", { replace: true });
    };

    const getPaginationPages = (): (number | "...")[] => {
        const pages: (number | "...")[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            )
                pages.push(i);
            if (currentPage < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    // ── Sub-components ──
    const BookGrid = ({ books }: { books: BookResponseDto[] }) => (
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-2 g-sm-3">
            {books.map((book) => (
                <div key={book.bookId} className="col">
                    <BookCard
                        book={book}
                        onAddToCart={handleAddToCart}
                        onAddToWishlist={handleAddToWishlist}
                        addingToCart={addingToCart === book.bookId}
                        cartQuantity={cartQuantities[book.bookId] ?? 0}
                    />
                </div>
            ))}
        </div>
    );

    const SkeletonGrid = ({ count = 5 }: { count?: number }) => (
        <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2 g-sm-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="col">
                    <div
                        className="card border-0 rounded-3 placeholder-glow"
                        style={{ height: "280px" }}
                    >
                        <div
                            className="placeholder rounded-top"
                            style={{ height: "170px" }}
                        ></div>
                        <div className="card-body p-2">
                            <p className="placeholder col-10 mb-1"></p>
                            <p className="placeholder col-7 mb-2"></p>
                            <p className="placeholder col-5"></p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    // =============================================
    // RENDER
    // =============================================
    return (
        <>
            <Navbar />

            {/* Toast notifications */}
            {cartMessage && (
                <div
                    className="position-fixed bottom-0 end-0 m-2 m-sm-3 alert alert-success shadow d-flex align-items-center gap-2 py-2"
                    style={{
                        zIndex: 9999,
                        minWidth: "200px",
                        maxWidth: "calc(100vw - 16px)",
                        fontSize: "14px",
                    }}
                >
                    <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                    <span>{cartMessage}</span>
                </div>
            )}
            {cartError && (
                <div
                    className="position-fixed bottom-0 end-0 m-2 m-sm-3 alert alert-danger shadow d-flex align-items-center gap-2 py-2"
                    style={{
                        zIndex: 9999,
                        minWidth: "200px",
                        maxWidth: "calc(100vw - 16px)",
                        fontSize: "14px",
                    }}
                >
                    <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                    <span>{cartError}</span>
                </div>
            )}

            <div style={{ background: "#f0f2f5", minHeight: "100vh" }}>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

                    /* ── Full-width Hero Slider ── */
                    .hero-slider-fullwidth {
                        position: relative;
                        width: 100%;
                        height: 420px;
                        overflow: hidden;
                    }
                    @media (max-width: 767px) {
                        .hero-slider-fullwidth { height: 220px; }
                    }
                    @media (min-width: 768px) and (max-width: 1199px) {
                        .hero-slider-fullwidth { height: 340px; }
                    }
                    .hero-slide {
                        position: absolute;
                        inset: 0;
                        opacity: 0;
                        transition: opacity 0.8s ease;
                        pointer-events: none;
                    }
                    .hero-slide-active {
                        opacity: 1;
                        pointer-events: auto;
                    }
                    .hero-slide-img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        object-position: center top;
                    }
                    .hero-slide-caption {
                        position: absolute;
                        left: 0; right: 0; bottom: 0;
                        padding: 20px 28px;
                        background: linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%);
                        color: #fff;
                    }
                    .hero-slide-title {
                        font-family: 'Playfair Display', serif;
                        font-weight: 700;
                        font-size: 20px;
                    }
                    @media (max-width: 575px) {
                        .hero-slide-title { font-size: 14px; }
                        .hero-slide-caption { padding: 12px 14px; }
                    }
                    .hero-slide-subtitle { font-size: 13px; opacity: 0.85; }
                    .hero-slider-dots {
                        position: absolute;
                        bottom: 14px; right: 18px;
                        display: flex; gap: 6px;
                        z-index: 2;
                    }
                    .hero-slider-dot {
                        width: 8px; height: 8px;
                        border-radius: 50%;
                        border: none;
                        background: rgba(255,255,255,0.5);
                        transition: all 0.3s;
                        padding: 0; cursor: pointer;
                    }
                    .hero-slider-dot-active {
                        background: #fff;
                        width: 22px;
                        border-radius: 4px;
                    }

                    /* ── Category pills ── */
                    .cat-pills-wrap {
                        display: flex; gap: 8px;
                        flex-wrap: wrap; align-items: center;
                    }

                    /* ── Section cards ── */
                    .section-card {
                        background: #fff; border-radius: 14px;
                        padding: 16px; margin-bottom: 16px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 8px rgba(0,0,0,0.03);
                    }
                    @media (min-width: 576px) {
                        .section-card { padding: 24px; margin-bottom: 20px; }
                    }

                    /* ── Filter / sort bars ── */
                    .filter-bar { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
                    .sort-bar   { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

                    /* ── Pagination ── */
                    .pagination-wrap {
                        display: flex; justify-content: center;
                        overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px;
                    }
                    .pagination-wrap .pagination { flex-wrap: nowrap; margin-bottom: 0; }
                    @media (max-width: 575px) {
                        .pagination-wrap .page-link { padding: 4px 8px; font-size: 13px; }
                    }

                    /* ── Category browse grid ── */
                    .cat-browse-btn {
                        transition: all 0.18s ease;
                        background: #fafafa !important;
                        border-color: #e0e0e0 !important;
                        color: #333 !important;
                    }
                    .cat-browse-btn:hover {
                        background: #1a237e !important;
                        border-color: #1a237e !important;
                        color: #fff !important;
                        transform: translateY(-2px);
                        box-shadow: 0 6px 20px rgba(26,35,126,0.22) !important;
                    }

                    /* ── Footer ── */
                    .footer-root {
                        background: linear-gradient(160deg, #0e1225 0%, #151c35 60%, #0e1225 100%);
                        color: #fff; margin-top: 36px; padding: 48px 0 24px;
                        border-top: 1px solid rgba(255,255,255,0.05);
                    }
                    .footer-grid {
                        display: grid; grid-template-columns: 1fr 1fr; gap: 28px;
                    }
                    @media (min-width: 768px) {
                        .footer-grid { grid-template-columns: 2.2fr 1fr 1fr 1.8fr; }
                    }
                    .footer-link {
                        color: rgba(255,255,255,0.52) !important;
                        text-decoration: none !important;
                        font-size: 13px;
                        transition: color 0.18s;
                        display: block; margin-bottom: 7px;
                    }
                    .footer-link:hover { color: rgba(255,255,255,0.88) !important; }
                    .footer-brand-logo {
                        display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
                    }
                    .footer-brand-icon {
                        width: 36px; height: 36px; border-radius: 9px;
                        background: linear-gradient(135deg, #1a237e, #3949ab);
                        display: flex; align-items: center; justify-content: center;
                        flex-shrink: 0;
                    }
                    .footer-brand-name {
                        font-family: 'Playfair Display', serif;
                        font-size: 17px; font-weight: 800; color: #fff; line-height: 1.1;
                    }
                    .footer-brand-tagline {
                        font-family: 'DM Sans', sans-serif;
                        font-size: 10px; color: rgba(255,255,255,0.38);
                        letter-spacing: 0.06em; text-transform: uppercase;
                    }
                    .footer-feature {
                        display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
                    }
                    .footer-feature-icon {
                        width: 30px; height: 30px; border-radius: 8px;
                        background: rgba(255,255,255,0.07);
                        display: flex; align-items: center; justify-content: center;
                        flex-shrink: 0; font-size: 13px;
                    }
                `}</style>

                {/* ══════════════════════════════════════════
                    FULL-WIDTH BANNER SLIDER
                ══════════════════════════════════════════ */}
                {banners.length > 0 && <HeroSlider banners={banners} />}

                {/* ══════════════════════════════════════════
                    CATEGORY PILL TABS
                ══════════════════════════════════════════ */}
                {categories.length > 0 && (
                    <div style={{ background: "#fff", borderBottom: "1px solid #eaeaea" }}>
                        <div className="container py-3">
                            <div className="cat-pills-wrap">
                                <button
                                    className={`btn btn-sm rounded-pill fw-semibold ${!filters.categoryId ? "btn-primary" : "btn-outline-secondary"}`}
                                    onClick={handleReset}
                                    style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                                >
                                    All Books
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.categoryId}
                                        className={`btn btn-sm rounded-pill fw-semibold ${filters.categoryId === cat.categoryId ? "btn-primary" : "btn-outline-secondary"}`}
                                        onClick={() => handleCategoryClick(cat.categoryId)}
                                        style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                                    >
                                        <i className={`bi ${CATEGORY_ICONS[cat.name] ?? "bi-bookmark"} me-1`}></i>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════
                    MAIN CONTENT
                ══════════════════════════════════════════ */}
                <div className="container py-3 py-sm-4">

                    {/* Error banner */}
                    {error && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
                            <i className="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
                            <span>{error}</span>
                            <button
                                className="btn btn-link btn-sm ms-auto p-0 text-nowrap"
                                onClick={fetchBooks}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* ── FILTERED / SEARCH RESULTS VIEW ── */}
                    {(isFiltering || showAllBooks) && (
                        <div>
                            {/* Active filters bar */}
                            <div className="filter-bar mb-3">
                                {filters.search && (
                                    <span className="badge bg-primary-subtle text-primary-emphasis px-3 py-2">
                                        <i className="bi bi-search me-1"></i>
                                        &ldquo;{filters.search}&rdquo;
                                        <button
                                            className="btn-close btn-close-sm ms-2"
                                            style={{ fontSize: "10px" }}
                                            onClick={() => {
                                                setFilters((p) => ({
                                                    ...p,
                                                    search: undefined,
                                                    page: 1,
                                                }));
                                                navigate("/", { replace: true });
                                            }}
                                        ></button>
                                    </span>
                                )}
                                {filters.categoryId !== undefined && (
                                    <span className="badge bg-info-subtle text-info-emphasis px-3 py-2">
                                        <i className="bi bi-tag me-1"></i>
                                        {categories.find(
                                            (c) => c.categoryId === filters.categoryId
                                        )?.name}
                                        <button
                                            className="btn-close btn-close-sm ms-2"
                                            style={{ fontSize: "10px" }}
                                            onClick={() =>
                                                setFilters((p) => ({
                                                    ...p,
                                                    categoryId: undefined,
                                                    page: 1,
                                                }))
                                            }
                                        ></button>
                                    </span>
                                )}
                                <span className="text-muted small">
                                    {totalCount} book{totalCount !== 1 ? "s" : ""} found
                                </span>
                                <button
                                    className="btn btn-link btn-sm p-0 text-danger ms-auto text-nowrap"
                                    onClick={handleReset}
                                >
                                    <i className="bi bi-x-circle me-1"></i>Clear all
                                </button>
                            </div>

                            {/* Sort bar */}
                            <div className="sort-bar mb-3">
                                <span className="text-muted small fw-semibold text-nowrap">
                                    Sort by:
                                </span>
                                {[
                                    { value: undefined, label: "Default" },
                                    { value: "newest", label: "Newest" },
                                    { value: "price_asc", label: "Price Low" },
                                    { value: "price_desc", label: "Price High" },
                                    { value: "title_asc", label: "A to Z" },
                                ].map((s) => (
                                    <button
                                        key={s.label}
                                        className={`btn btn-sm ${filters.sortBy === s.value ? "btn-primary" : "btn-outline-secondary"}`}
                                        onClick={() =>
                                            setFilters((p) => ({
                                                ...p,
                                                sortBy: s.value as BookFilterParams["sortBy"],
                                                page: 1,
                                            }))
                                        }
                                        style={{ fontSize: "12px", whiteSpace: "nowrap" }}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* Results */}
                            {loading ? (
                                <SkeletonGrid count={10} />
                            ) : paginatedBooks.length === 0 ? (
                                <div className="text-center py-5">
                                    <div
                                        style={{
                                            width: "80px", height: "80px",
                                            borderRadius: "50%",
                                            background: "#f0f0f0",
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center",
                                            margin: "0 auto 16px",
                                        }}
                                    >
                                        <i
                                            className="bi bi-search"
                                            style={{ fontSize: "32px", color: "#aaa" }}
                                        ></i>
                                    </div>
                                    <h5 className="fw-bold">No books found</h5>
                                    <p className="text-muted small">
                                        Try different search terms or browse categories
                                    </p>
                                    <button
                                        className="btn btn-primary px-4"
                                        onClick={handleReset}
                                    >
                                        Browse All Books
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <BookGrid books={paginatedBooks} />

                                    {totalPages > 1 && (
                                        <nav
                                            className="mt-4 pagination-wrap"
                                            aria-label="Book pages"
                                        >
                                            <ul className="pagination pagination-sm">
                                                <li
                                                    className={`page-item ${currentPage <= 1 ? "disabled" : ""}`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() =>
                                                            handlePageChange(currentPage - 1)
                                                        }
                                                        aria-label="Previous"
                                                    >
                                                        <i className="bi bi-chevron-left"></i>
                                                    </button>
                                                </li>
                                                {getPaginationPages().map((p, i) =>
                                                    p === "..." ? (
                                                        <li
                                                            key={`e-${i}`}
                                                            className="page-item disabled"
                                                        >
                                                            <span className="page-link">
                                                                &hellip;
                                                            </span>
                                                        </li>
                                                    ) : (
                                                        <li
                                                            key={p}
                                                            className={`page-item ${currentPage === p ? "active" : ""}`}
                                                        >
                                                            <button
                                                                className="page-link"
                                                                onClick={() =>
                                                                    handlePageChange(p as number)
                                                                }
                                                            >
                                                                {p}
                                                            </button>
                                                        </li>
                                                    )
                                                )}
                                                <li
                                                    className={`page-item ${currentPage >= totalPages ? "disabled" : ""}`}
                                                >
                                                    <button
                                                        className="page-link"
                                                        onClick={() =>
                                                            handlePageChange(currentPage + 1)
                                                        }
                                                        aria-label="Next"
                                                    >
                                                        <i className="bi bi-chevron-right"></i>
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    )}
                                    <p
                                        className="text-center text-muted small mt-2"
                                        style={{ fontSize: "12px" }}
                                    >
                                        Showing{" "}
                                        {(currentPage - 1) * PAGE_SIZE + 1}&ndash;
                                        {Math.min(currentPage * PAGE_SIZE, totalCount)} of{" "}
                                        {totalCount} books
                                    </p>
                                </>
                            )}
                        </div>
                    )}

                    {/* ── LANDING SECTIONS ── */}
                    {!isFiltering && !showAllBooks && (
                        <>
                            {/* New Arrivals */}
                            <div className="section-card">
                                <SectionHeader
                                    title="New Arrivals"
                                    icon="bi-stars"
                                    onSeeAll={() => {
                                        setFilters({
                                            ...DEFAULT_FILTERS,
                                            sortBy: "newest",
                                        });
                                        setShowAllBooks(true);
                                    }}
                                />
                                {loading ? (
                                    <SkeletonGrid count={5} />
                                ) : (
                                    <BookGrid books={newArrivals} />
                                )}
                            </div>

                            {/* Browse by Category */}
                            {categories.length > 0 && (
                                <div className="section-card">
                                    <SectionHeader
                                        title="Browse by Category"
                                        icon="bi-grid-3x3-gap"
                                    />
                                    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 g-2 g-sm-3">
                                        {categories.map((cat) => (
                                            <div key={cat.categoryId} className="col">
                                                <button
                                                    className="btn cat-browse-btn w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-1 gap-sm-2 py-2 py-sm-3 rounded-3"
                                                    onClick={() =>
                                                        handleCategoryClick(cat.categoryId)
                                                    }
                                                    style={{
                                                        fontSize: "11px",
                                                        minHeight: "76px",
                                                        border: "1.5px solid #e0e0e0",
                                                    }}
                                                >
                                                    {cat.imageUrl ? (
                                                        <img
                                                            src={cat.imageUrl}
                                                            alt={cat.name}
                                                            style={{
                                                                width: "160px",
                                                                height: "80px",
                                                                objectFit: "cover",
                                                                borderRadius: "3px",
                                                            }}
                                                        />
                                                    ) : (
                                                        <i className={`bi ${CATEGORY_ICONS[cat.name] ?? "bi-bookmark"} fs-5`}></i>
                                                    )}
                                                    <span
                                                        className="fw-semibold text-center lh-sm"
                                                        style={{ fontSize: "11px" }}
                                                    >
                                                        {cat.name}
                                                    </span>
                                                    <span
                                                        className="badge bg-light text-muted"
                                                        style={{ fontSize: "9px" }}
                                                    >
                                                        {allBooks.filter(
                                                            (b) => b.categoryId === cat.categoryId
                                                        ).length}{" "}
                                                        books
                                                    </span>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Books */}
                            <div className="section-card">
                                <SectionHeader
                                    title="All Books"
                                    icon="bi-journals"
                                    onSeeAll={() => setShowAllBooks(true)}
                                />
                                {loading ? (
                                    <SkeletonGrid count={10} />
                                ) : (
                                    <>
                                        <BookGrid books={allBooks.slice(0, PAGE_SIZE)} />
                                        {allBooks.length > PAGE_SIZE && (
                                            <div className="text-center mt-4">
                                                <button
                                                    className="btn btn-outline-primary px-4 px-sm-5 fw-semibold"
                                                    onClick={() => setShowAllBooks(true)}
                                                >
                                                    View All {allBooks.length} Books
                                                    <i className="bi bi-arrow-right ms-2"></i>
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ══════════════════════════════════════════
                    FOOTER
                ══════════════════════════════════════════ */}
                <footer className="footer-root">
                    <div className="container">
                        <div className="footer-grid mb-5">

                            {/* Brand */}
                            <div>
                                <div className="footer-brand-logo">
                                    <div className="footer-brand-icon">
                                        <i
                                            className="bi bi-book-half"
                                            style={{ color: "#fff", fontSize: "16px" }}
                                        ></i>
                                    </div>
                                    <div>
                                        <div className="footer-brand-name">Sabbir BookMall</div>
                                        <div className="footer-brand-tagline">Bangladesh's Book Marketplace</div>
                                    </div>
                                </div>
                                <p
                                    style={{
                                        color: "rgba(255,255,255,0.45)",
                                        fontSize: "13px",
                                        lineHeight: "1.7",
                                        maxWidth: "260px",
                                    }}
                                >
                                    Bangladesh's multi-vendor online bookshop. Discover
                                    books from verified vendors across every genre —
                                    fiction, academic, Islamic, children's and more.
                                </p>
                            </div>

                            {/* Quick Links */}
                            <div>
                                <h6
                                    className="fw-bold mb-3"
                                    style={{
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.35)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    Quick Links
                                </h6>
                                {[
                                    { label: "Home", to: "/" },
                                    { label: "My Orders", to: "/orders" },
                                    { label: "Cart", to: "/cart" },
                                    { label: "My Profile", to: "/profile" },
                                ].map((l) => (
                                    <Link key={l.label} to={l.to} className="footer-link">
                                        {l.label}
                                    </Link>
                                ))}
                            </div>

                            {/* Sell Books */}
                            <div>
                                <h6
                                    className="fw-bold mb-3"
                                    style={{
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.35)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    Sell on BookMall
                                </h6>
                                <Link to="/vendor/register" className="footer-link">
                                    Become a Vendor
                                </Link>
                                <Link to="/vendor/dashboard" className="footer-link">
                                    Vendor Dashboard
                                </Link>
                                <Link to="/auth" className="footer-link">
                                    Seller Login
                                </Link>
                            </div>

                            {/* Why us */}
                            <div>
                                <h6
                                    className="fw-bold mb-3"
                                    style={{
                                        fontSize: "12px",
                                        color: "rgba(255,255,255,0.35)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.08em",
                                    }}
                                >
                                    Why Sabbir BookMall?
                                </h6>
                                {[
                                    { icon: "bi-patch-check-fill", text: "100% Genuine Books", color: "#f59e0b" },
                                    { icon: "bi-truck-front-fill", text: "Fast Nationwide Delivery", color: "#34d399" },
                                    { icon: "bi-shield-lock-fill", text: "Secure Checkout", color: "#60a5fa" },
                                    { icon: "bi-arrow-counterclockwise", text: "7-Day Easy Returns", color: "#f87171" },
                                ].map((f) => (
                                    <div key={f.text} className="footer-feature">
                                        <div className="footer-feature-icon">
                                            <i
                                                className={`bi ${f.icon}`}
                                                style={{ color: f.color, fontSize: "13px" }}
                                            ></i>
                                        </div>
                                        <span
                                            style={{
                                                color: "rgba(255,255,255,0.6)",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {f.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "0 0 20px" }} />

                        <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-2">
                            <p
                                className="mb-0"
                                style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}
                            >
                                &copy; {new Date().getFullYear()} Sabbir BookMall. All rights reserved.
                            </p>
                            <p
                                className="mb-0"
                                style={{ color: "rgba(255,255,255,0.22)", fontSize: "12px" }}
                            >
                                Developed by Md Sabbir Hossain
                            </p>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}
