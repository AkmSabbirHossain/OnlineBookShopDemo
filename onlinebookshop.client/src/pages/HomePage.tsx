// =============================================
// HomePage.tsx —
// =============================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import BookCard from "../components/books/BookCard";
import BookService from "../services/book.service";
import CartService from "../services/cart.service";
import AuthService from "../services/auth.service";
import type {
    BookResponseDto,
    CategoryResponseDto,
    BookFilterParams,
} from "../types/book.types";

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

// ── Section Header ──// ── Section Header ──
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

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
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

            {/* ── Toast notifications ── */}
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

                {/* ══════════════════════════════════════════
                    GLOBAL STYLES
                ══════════════════════════════════════════ */}
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

                    /* ── Hero ── */
                    .hero-root {
                        position: relative;
                        overflow: hidden;
                        background: #060b18;
                        min-height: 460px;
                        display: flex;
                        align-items: center;
                    }
                    @media (max-width: 575px) {
                        .hero-root { min-height: unset; padding: 40px 0 44px; }
                    }

                    .hero-mesh {
                        position: absolute; inset: 0; z-index: 0;
                        background:
                            radial-gradient(ellipse 90% 70% at 72% 50%, rgba(88,44,200,0.38) 0%, transparent 60%),
                            radial-gradient(ellipse 55% 85% at 8%  82%, rgba(220,56,20,0.22)  0%, transparent 55%),
                            radial-gradient(ellipse 65% 55% at 92% 12%, rgba(14,165,233,0.20)  0%, transparent 50%),
                            linear-gradient(160deg, #060b18 0%, #0e1525 50%, #090f1e 100%);
                    }
                    .hero-grain {
                        position: absolute; inset: 0; z-index: 0;
                        opacity: 0.04;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
                        background-size: 200px;
                    }
                    .hero-grid-lines {
                        position: absolute; inset: 0; z-index: 0;
                        background-image:
                            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
                        background-size: 64px 64px;
                        mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
                    }
                    .hero-orb {
                        position: absolute; border-radius: 50%;
                        filter: blur(80px); opacity: 0.16; z-index: 0;
                        animation: orbDrift 10s ease-in-out infinite alternate;
                    }
                    .hero-orb-1 { width: 420px; height: 420px; background: #5c1e9e; top: -120px; right: 80px;  animation-duration: 9s; }
                    .hero-orb-2 { width: 300px; height: 300px; background: #dc3814; bottom: -90px; left: 4%;   animation-duration: 12s; animation-delay: -4s; }
                    .hero-orb-3 { width: 260px; height: 260px; background: #0ea5e9; top: 28%;   right: -70px; animation-duration: 14s; animation-delay: -7s; }
                    @keyframes orbDrift {
                        from { transform: translateY(0px)  scale(1);    }
                        to   { transform: translateY(28px) scale(1.07); }
                    }

                    .hero-content { position: relative; z-index: 1; }

                    /* Badge */
                    .hero-badge {
                        display: inline-flex; align-items: center; gap: 8px;
                        background: rgba(255,255,255,0.06);
                        border: 1px solid rgba(255,255,255,0.11);
                        border-radius: 100px;
                        padding: 5px 16px 5px 8px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 11px; font-weight: 500;
                        color: rgba(255,255,255,0.68);
                        letter-spacing: 0.06em; text-transform: uppercase;
                        margin-bottom: 20px;
                        backdrop-filter: blur(10px);
                        max-width: 100%; word-break: break-word;
                    }
                    .hero-badge-dot {
                        width: 7px; height: 7px; flex-shrink: 0;
                        border-radius: 50%; background: #e84420;
                        box-shadow: 0 0 8px rgba(232,68,32,0.9);
                        animation: pulseDot 2s ease-in-out infinite;
                    }
                    @keyframes pulseDot {
                        0%,100% { box-shadow: 0 0 6px  rgba(232,68,32,0.8); }
                        50%     { box-shadow: 0 0 18px rgba(232,68,32,1);   }
                    }

                    /* Headline */
                    .hero-headline {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-weight: 900;
                        font-size: clamp(30px, 7.5vw, 62px);
                        line-height: 1.09; color: #fff;
                        letter-spacing: -0.02em; margin-bottom: 16px;
                    }
                    .hero-accent {
                        background: linear-gradient(90deg, #f59e0b 0%, #fcd34d 45%, #f59e0b 100%);
                        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                        background-clip: text; background-size: 200%;
                        animation: shimmer 4s linear infinite;
                    }
                    @keyframes shimmer {
                        0%   { background-position: 0%   50%; }
                        100% { background-position: 200% 50%; }
                    }

                    /* Sub */
                    .hero-sub {
                        font-family: 'DM Sans', sans-serif;
                        font-size: 14px; font-weight: 300;
                        color: rgba(255,255,255,0.48); line-height: 1.75;
                        max-width: 100%; margin-bottom: 28px;
                    }
                    @media (min-width: 576px) { .hero-sub { font-size: 15px; max-width: 430px; } }

                    /* Stats */
                    .hero-stats { display: flex; flex-wrap: wrap; gap: 14px 0; }
                    .hero-stat {
                        display: flex; flex-direction: column;
                        padding-right: 22px; margin-right: 22px;
                        border-right: 1px solid rgba(255,255,255,0.09);
                        min-width: 0;
                    }
                    .hero-stat:last-child { border-right: none; margin-right: 0; padding-right: 0; }
                    .hero-stat-value {
                        font-family: 'Playfair Display', serif;
                        font-size: 22px; font-weight: 800; color: #fff;
                        line-height: 1; margin-bottom: 4px; white-space: nowrap;
                    }
                    .hero-stat-label {
                        font-family: 'DM Sans', sans-serif;
                        font-size: 10px; font-weight: 400;
                        color: rgba(255,255,255,0.38);
                        text-transform: uppercase; letter-spacing: 0.09em; white-space: nowrap;
                    }
                    @media (min-width: 576px) {
                        .hero-stat { padding-right: 30px; margin-right: 30px; }
                        .hero-stat-value { font-size: 26px; }
                        .hero-stat-label { font-size: 11px; }
                    }

                    /* Hero visual — right side */
                    .hero-visual {
                        position: relative; height: 360px;
                        display: flex; align-items: center; justify-content: center;
                    }
                    .hero-glow-disc {
                        position: absolute; width: 280px; height: 280px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(92,30,158,0.32) 0%, rgba(88,44,200,0.10) 50%, transparent 70%);
                        top: 50%; left: 50%; transform: translate(-50%,-50%);
                        filter: blur(24px);
                    }
                    /* CSS-drawn book spine blocks */
                    .hb { /* hero-book */
                        position: absolute; border-radius: 8px 10px 10px 8px;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.55), inset 3px 0 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(255,255,255,0.06);
                        transition: transform 0.35s ease;
                        overflow: hidden;
                        display: flex; align-items: flex-end; justify-content: center;
                        padding-bottom: 12px;
                    }
                    .hb::before {
                        content: ''; position: absolute;
                        top: 0; left: 0; right: 0; height: 40%;
                        background: rgba(255,255,255,0.05);
                    }
                    .hb::after {
                        content: ''; position: absolute;
                        left: 0; top: 0; bottom: 0; width: 5px;
                        background: rgba(0,0,0,0.25);
                    }
                    .hb:hover { transform: translateY(-10px) rotate(0deg) !important; }
                    .hb-title {
                        font-family: 'Playfair Display', serif;
                        font-size: 9px; font-weight: 700;
                        color: rgba(255,255,255,0.55);
                        text-align: center; line-height: 1.3;
                        letter-spacing: 0.04em; z-index: 1;
                        padding: 0 8px;
                    }

                    .hb-1 {
                        width: 108px; height: 158px;
                        background: linear-gradient(160deg, #1e3c72 0%, #0b1e45 100%);
                        left: 50%; top: 50%;
                        transform: translate(-50%,-50%) rotate(-9deg) translateX(-88px);
                        animation: bookFloat1 6s ease-in-out infinite alternate;
                    }
                    .hb-2 {
                        width: 122px; height: 176px;
                        background: linear-gradient(160deg, #3d1a78 0%, #1a0842 100%);
                        left: 50%; top: 50%;
                        transform: translate(-50%,-50%) rotate(1deg) translateY(-14px);
                        animation: bookFloat2 7.5s ease-in-out infinite alternate; z-index: 2;
                    }
                    .hb-3 {
                        width: 104px; height: 150px;
                        background: linear-gradient(160deg, #7b1d1d 0%, #3a0808 100%);
                        left: 50%; top: 50%;
                        transform: translate(-50%,-50%) rotate(11deg) translateX(84px);
                        animation: bookFloat3 5.5s ease-in-out infinite alternate;
                    }
                    @keyframes bookFloat1 {
                        from { transform: translate(-50%,-50%) rotate(-9deg)  translateX(-88px) translateY(0px); }
                        to   { transform: translate(-50%,-50%) rotate(-7deg)  translateX(-88px) translateY(-14px); }
                    }
                    @keyframes bookFloat2 {
                        from { transform: translate(-50%,-50%) rotate(1deg)   translateY(-14px); }
                        to   { transform: translate(-50%,-50%) rotate(2.5deg) translateY(-28px); }
                    }
                    @keyframes bookFloat3 {
                        from { transform: translate(-50%,-50%) rotate(11deg)  translateX(84px) translateY(0px); }
                        to   { transform: translate(-50%,-50%) rotate(9deg)   translateX(84px) translateY(-18px); }
                    }

                    /* Floating info chips */
                    .hero-chip {
                        position: absolute;
                        background: rgba(255,255,255,0.065);
                        border: 1px solid rgba(255,255,255,0.11);
                        border-radius: 9px; padding: 7px 13px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 11px; font-weight: 500;
                        color: rgba(255,255,255,0.62);
                        backdrop-filter: blur(8px); white-space: nowrap;
                        display: flex; align-items: center; gap: 6px;
                    }
                    .hero-chip-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
                    .chip-1 { top: 15%; left: 4%;  animation: chipFloat 5s   ease-in-out infinite alternate; }
                    .chip-2 { bottom: 20%; right: 0%; animation: chipFloat 6.5s ease-in-out infinite alternate-reverse; }
                    .chip-3 { top: 62%; left: 0%;  animation: chipFloat 7s   ease-in-out infinite alternate; }
                    @keyframes chipFloat {
                        from { transform: translateY(0px); }
                        to   { transform: translateY(-11px); }
                    }

                    .hero-divider-line {
                        position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07) 30%, rgba(255,255,255,0.07) 70%, transparent);
                    }

                    /* ── Trust bar ── */
                    .trust-bar {
                        background: #fff;
                        border-bottom: 1px solid rgba(0,0,0,0.06);
                        padding: 12px 0;
                    }
                    .trust-bar-inner {
                        display: flex; align-items: center; justify-content: center;
                        gap: 8px; flex-wrap: wrap;
                    }
                    .trust-item {
                        display: flex; align-items: center; gap: 6px;
                        font-family: 'DM Sans', sans-serif;
                        font-size: 12px; font-weight: 500; color: #555;
                        padding: 0 14px;
                        border-right: 1px solid #e0e0e0;
                    }
                    .trust-item:last-child { border-right: none; }
                    @media (max-width: 575px) {
                        .trust-item { padding: 0 8px; font-size: 11px; }
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
                    HERO
                ══════════════════════════════════════════ */}
                <div className="hero-root">
                    <div className="hero-mesh" />
                    <div className="hero-grain" />
                    <div className="hero-grid-lines" />
                    <div className="hero-orb hero-orb-1" />
                    <div className="hero-orb hero-orb-2" />
                    <div className="hero-orb hero-orb-3" />
                    <div className="hero-divider-line" />

                    <div className="container hero-content py-4 py-sm-5">
                        <div className="row align-items-center g-4">

                            {/* Left */}
                            <div className="col-lg-6">
                                <div className="hero-badge">
                                    <span className="hero-badge-dot" />
                                    Bangladesh's Premier Online Bookshop
                                </div>

                                <h1 className="hero-headline">
                                    Every Story<br />
                                    Begins With{" "}
                                    <span className="hero-accent">One Right Book</span>
                                
                                </h1>

                                <p className="hero-sub">
                                    Thousands of titles across Fiction, Academic, Islamic, Children's
                                    and more — sourced from verified vendors, delivered to your door.
                                </p>

                                <div className="hero-stats">
                                    {[
                                        { value: `${allBooks.length}+`, label: "Books" },
                                        { value: "50+", label: "Vendors" },
                                        { value: `${categories.length}+`, label: "Categories" },
                                        { value: "Free", label: "Over BDT 500" },
                                    ].map((s) => (
                                        <div key={s.label} className="hero-stat">
                                            <span className="hero-stat-value">{s.value}</span>
                                            <span className="hero-stat-label">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right — CSS book visual */}
                            <div className="col-lg-6 d-none d-lg-block">
                                <div className="hero-visual">
                                    <div className="hero-glow-disc" />

                                    {/* Floating info chips */}
                                    <div className="hero-chip chip-1">
                                        <span className="hero-chip-dot" style={{ background: "#f59e0b" }} />
                                        Fiction &amp; Literature
                                    </div>
                                    <div className="hero-chip chip-2">
                                        <span className="hero-chip-dot" style={{ background: "#10b981" }} />
                                        Free Delivery Available
                                    </div>
                                    <div className="hero-chip chip-3">
                                        <span className="hero-chip-dot" style={{ background: "#60a5fa" }} />
                                        Academic &amp; Reference
                                    </div>

                                    {/* CSS book spines */}
                                    <div className="hb hb-1">
                                        <span className="hb-title">Classic Fiction</span>
                                    </div>
                                    <div className="hb hb-2">
                                        <span className="hb-title">Bestseller 2025</span>
                                    </div>
                                    <div className="hb hb-3">
                                        <span className="hb-title">Islamic Books</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════
                    TRUST BAR
                ══════════════════════════════════════════ */}
                <div className="trust-bar">
                    <div className="container">
                        <div className="trust-bar-inner">
                            {[
                                { icon: "bi-shield-fill-check", text: "100% Genuine Books", color: "#1a237e" },
                                { icon: "bi-truck", text: "Fast Delivery", color: "#1a237e" },
                                { icon: "bi-arrow-repeat", text: "Easy Returns", color: "#1a237e" },
                                { icon: "bi-lock-fill", text: "Secure Payment", color: "#1a237e" },
                                { icon: "bi-headset", text: "Customer Support", color: "#1a237e" },
                            ].map((t) => (
                                <div key={t.text} className="trust-item">
                                    <i
                                        className={`bi ${t.icon}`}
                                        style={{ color: t.color, fontSize: "14px" }}
                                    ></i>
                                    <span>{t.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

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
                                        <i
                                            className={`bi ${CATEGORY_ICONS[cat.name] ?? "bi-bookmark"} me-1`}
                                        ></i>
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
                                                    <i
                                                        className={`bi ${CATEGORY_ICONS[cat.name] ?? "bi-bookmark"} fs-5`}
                                                    ></i>
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
                                    title=" All Books"
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
