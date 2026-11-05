// =============================================
// BookDetailPage.tsx — Book detail
// =============================================

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import Seo from "../components/common/Seo";
import BookCard from "../components/books/BookCard";
import ReviewSection from "../components/books/ReviewSection";
import BookService from "../services/book.service";
import CartService from "../services/cart.service";
import ReviewService from "../services/review.service";
import AuthService from "../services/auth.service";
import { useLanguage } from "../i18n/language-context";
import { bookPath, creatorPath, slugify } from "../utils/slug";
import { absoluteUrl } from "../utils/seo";
import type { BookImageDto, BookResponseDto, CategoryResponseDto } from "../types/book.types";
import type { ReviewResponseDto } from "../types/review.types";
import WishlistButton from "../components/wishlist/WishlistButton";

const PLACEHOLDER_IMG = "https://placehold.co/400x550/f1f5f9/94a3b8?text=No+Cover";

type DetailTab = "summary" | "description" | "reviews";

export default function BookDetailPage() {
    const { id, slug } = useParams<{ id: string; slug?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const contentRef = useRef<HTMLDivElement>(null);
    const { t, formatNumber } = useLanguage();

    const [book, setBook] = useState<BookResponseDto | null>(null);
    const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [addingToCart, setAddingToCart] = useState(false);
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");
    const [cartQuantity, setCartQuantity] = useState(0);
    const [activeTab, setActiveTab] = useState<DetailTab>("description");
    const [related, setRelated] = useState<BookResponseDto[]>([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [addingRelatedToCart, setAddingRelatedToCart] = useState<number | null>(null);
    const [relatedCartQuantities, setRelatedCartQuantities] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setLoading(true);
            setError("");
            setRelated([]);
            setSelectedImageIndex(0);
            try {
                const bookId = parseInt(id);
                const [bookData, catsData, relatedData] = await Promise.all([
                    BookService.getBookById(bookId),
                    BookService.getCategories(),
                    BookService.getRelated(bookId).catch(() => [] as BookResponseDto[]),
                ]);
                setBook(bookData);
                setCategories(catsData);
                setRelated(relatedData);
                try {
                    const reviewsData = await ReviewService.getByBook(bookId);
                    setReviews(reviewsData);
                } catch {
                    setReviews([]);
                }
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || t("detail.notFound"));
                } else {
                    setError(t("detail.somethingWrong"));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, t]);

    useEffect(() => {
        if (!AuthService.isAuthenticated() || !id) return;
        const loadCartQty = async () => {
            try {
                const cart = await CartService.getMyCart();
                const quantities: Record<number, number> = {};
                cart.items.forEach((i) => { quantities[i.bookId] = i.quantity; });
                setRelatedCartQuantities(quantities);
                setCartQuantity(quantities[parseInt(id)] ?? 0);
            } catch {
                setCartQuantity(0);
            }
        };
        loadCartQty();
    }, [id]);

    // Keep the decorative slug segment in sync with the book title.
    useEffect(() => {
        if (!book) return;
        const expected = slugify(book.title) || "";
        if ((slug ?? "") === expected) return;
        if (!slug && !expected) return;
        navigate(bookPath(book), { replace: true });
    }, [book, slug, navigate]);

    const handleAddToCart = async () => {
        if (!AuthService.isAuthenticated()) { navigate("/auth"); return; }
        if (!book) return;
        setAddingToCart(true);
        setCartError("");
        setCartMessage("");
        try {
            await CartService.addItem({ bookId: book.bookId, quantity: 1 });
            setCartMessage(t("detail.addedToCart"));
            setCartQuantity((prev) => prev + 1);
            window.dispatchEvent(new Event("cartUpdated"));
            setTimeout(() => setCartMessage(""), 2500);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setCartError(err.response?.data?.message || t("detail.addFailed"));
            } else {
                setCartError(t("detail.somethingWrong"));
            }
            setTimeout(() => setCartError(""), 3000);
        } finally {
            setAddingToCart(false);
        }
    };

    const handleAddRelatedToCart = async (bookId: number) => {
        if (!AuthService.isAuthenticated()) { navigate("/auth"); return; }
        setAddingRelatedToCart(bookId);
        setCartError("");
        setCartMessage("");
        try {
            await CartService.addItem({ bookId, quantity: 1 });
            setCartMessage(t("detail.addedToCart"));
            setRelatedCartQuantities((prev) => ({
                ...prev,
                [bookId]: (prev[bookId] ?? 0) + 1,
            }));
            window.dispatchEvent(new Event("cartUpdated"));
            setTimeout(() => setCartMessage(""), 2500);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setCartError(err.response?.data?.message || t("detail.addFailed"));
            } else {
                setCartError(t("detail.somethingWrong"));
            }
            setTimeout(() => setCartError(""), 3000);
        } finally {
            setAddingRelatedToCart(null);
        }
    };

    const handleReviewAdded = (review: ReviewResponseDto) => setReviews((prev) => [review, ...prev]);
    const handleReviewDeleted = (reviewId: number) => setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));

    const computedAvgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    const avgRating = book?.reviewCount ? book.averageRating : computedAvgRating;
    const reviewCount = book?.reviewCount ?? reviews.length;

    const galleryImages: BookImageDto[] = book
        ? book.images?.length
            ? book.images
            : book.imageUrl
                ? [{ bookImageId: 0, imageUrl: book.imageUrl, isPrimary: true, displayOrder: 0 }]
                : []
        : [];
    const safeImageIndex = Math.min(selectedImageIndex, Math.max(0, galleryImages.length - 1));
    const currentImageUrl = galleryImages[safeImageIndex]?.imageUrl || PLACEHOLDER_IMG;

    const isOutOfStock = book?.stock === 0;
    const isMaxedOut = book ? cartQuantity >= book.stock : false;
    const lowStock = !!book && book.stock > 0 && book.stock <= (book.lowStockThreshold ?? 5);
    const categoryName = categories.find((c) => c.categoryId === book?.categoryId)?.name ?? "—";

    const hasDiscount = !!book?.discountPrice && book.discountPrice < book.price;
    const displayPrice = hasDiscount ? book!.discountPrice! : book?.price ?? 0;
    const savings = hasDiscount ? book!.price - book!.discountPrice! : 0;
    const discountPercentage = hasDiscount
        ? Math.round(((book!.price - book!.discountPrice!) / book!.price) * 100) : 0;

    const summaryRows: { label: string; value?: string | null; icon: string; to?: string }[] = book ? [
        { label: t("detail.author"), value: book.author, icon: "bi-person", to: book.authorId ? creatorPath("author", book.authorId, book.author) : undefined },
        { label: t("detail.category"), value: categoryName, icon: "bi-tag" },
        { label: t("detail.publisherLabel"), value: book.publisher, icon: "bi-building", to: book.publisherId && book.publisher ? creatorPath("publisher", book.publisherId, book.publisher) : undefined },
        { label: t("detail.edition"), value: book.edition, icon: "bi-journal-bookmark" },
        { label: t("detail.published"), value: book.publishedYear ? String(book.publishedYear) : null, icon: "bi-calendar3" },
        { label: t("detail.language"), value: book.language, icon: "bi-translate" },
        { label: t("detail.pages"), value: book.pageCount ? t("detail.pagesValue", { count: formatNumber(book.pageCount) }) : null, icon: "bi-file-text" },
        { label: t("detail.isbn"), value: book.isbn, icon: "bi-upc-scan" },
    ].filter((row) => row.value) : [];

    const facts: { label: string; value: string }[] = [];
    if (book) {
        if (book.language) facts.push({ label: t("detail.language"), value: book.language });
        if (book.pageCount) facts.push({ label: t("detail.pages"), value: formatNumber(book.pageCount) });
        if (book.edition) facts.push({ label: t("detail.edition"), value: book.edition });
        if (book.publishedYear) facts.push({ label: t("detail.published"), value: formatNumber(book.publishedYear) });
    }

    const authorName = book?.author;
    const authorHref = book?.authorId && authorName
        ? creatorPath("author", book.authorId, authorName)
        : undefined;

    const seoTitle = book
        ? t("seo.bookTitle", { title: book.title, author: book.author })
        : t("seo.defaultTitle");
    const seoDescription = book?.description || t("seo.defaultDescription");
    const seoImage = book?.imageUrl || undefined;
    const canonicalPath = book ? bookPath(book) : location.pathname;

    const bookJsonLd = useMemo(() => {
        if (!book) return undefined;
        const price = book.discountPrice && book.discountPrice < book.price
            ? book.discountPrice
            : book.price;
        return {
            "@context": "https://schema.org",
            "@type": "Book",
            name: book.title,
            ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
            author: { "@type": "Person", name: book.author },
            ...(book.publisher ? { publisher: { "@type": "Organization", name: book.publisher } } : {}),
            ...(book.isbn ? { isbn: book.isbn } : {}),
            ...(book.pageCount ? { numberOfPages: book.pageCount } : {}),
            ...(book.language ? { inLanguage: book.language } : {}),
            ...(book.description ? { description: book.description } : {}),
            ...(book.imageUrl ? { image: absoluteUrl(book.imageUrl) } : {}),
            url: absoluteUrl(bookPath(book)),
            offers: {
                "@type": "Offer",
                price: price.toFixed(2),
                priceCurrency: "BDT",
                availability:
                    book.stock === 0
                        ? "https://schema.org/OutOfStock"
                        : "https://schema.org/InStock",
                url: absoluteUrl(bookPath(book)),
            },
            ...(reviewCount > 0
                ? {
                      aggregateRating: {
                          "@type": "AggregateRating",
                          ratingValue: avgRating.toFixed(1),
                          reviewCount,
                      },
                  }
                : {}),
        };
    }, [book, reviewCount, avgRating]);

    const goToTab = (tab: DetailTab) => {
        setActiveTab(tab);
        requestAnimationFrame(() => {
            contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };

    const goToReviews = () => goToTab("reviews");

    return (
        <>
            <Navbar />
            <Seo
                title={seoTitle}
                description={seoDescription}
                path={canonicalPath}
                image={seoImage}
                type="book"
                jsonLd={bookJsonLd}
            />
            <div className="bd-page">
                <style>{`
                    .bd-page {
                        --bd-bg: #f4f6f9;
                        --bd-surface: #ffffff;
                        --bd-ink: #14213d;
                        --bd-text: #334155;
                        --bd-muted: #64748b;
                        --bd-border: #e6ebf2;
                        --bd-brand: #e8401c;
                        --bd-brand-dark: #c2340f;
                        --bd-soft: #fff4f1;
                        --bd-good: #15803d;
                        --bd-good-bg: #f0fdf4;
                        --bd-warn: #b45309;
                        --bd-warn-bg: #fffbeb;
                        --bd-bad: #b91c1c;
                        --bd-bad-bg: #fef2f2;
                        background: var(--bd-bg);
                        min-height: 100vh;
                        padding: 18px 0 56px;
                        font-family: 'Sora', 'Hind Siliguri', sans-serif;
                        color: var(--bd-text);
                    }
                    .bd-page *, .bd-page *::before, .bd-page *::after { box-sizing: border-box; }
                    .bd-shell { max-width: 1180px; margin: 0 auto; padding: 0 16px; }

                    /* ── Breadcrumbs ── */
                    .bd-crumbs {
                        display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
                        font-size: 12.5px; color: var(--bd-muted); margin: 2px 0 16px;
                    }
                    .bd-crumbs a { color: var(--bd-muted); text-decoration: none; transition: color .15s; }
                    .bd-crumbs a:hover { color: var(--bd-brand); }
                    .bd-crumb-sep { color: #cbd5e1; font-size: 10px; }
                    .bd-crumb-current {
                        color: var(--bd-ink); font-weight: 600;
                        max-width: min(100%, 420px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }

                    /* ── Hero ── */
                    .bd-hero {
                        display: grid;
                        grid-template-columns: minmax(240px, 320px) minmax(0, 1fr) 300px;
                        gap: 28px;
                        background: var(--bd-surface);
                        border: 1px solid var(--bd-border);
                        border-radius: 20px;
                        padding: 28px;
                        box-shadow: 0 18px 45px -30px rgba(15, 23, 42, 0.35);
                    }

                    /* Gallery */
                    .bd-gallery { min-width: 0; }
                    .bd-cover-frame {
                        position: relative; border-radius: 12px; overflow: hidden;
                        background: #f8fafc; border: 1px solid var(--bd-border);
                        box-shadow: 0 18px 35px -22px rgba(15, 23, 42, 0.45);
                    }
                    .bd-cover-frame img {
                        display: block; width: 100%; aspect-ratio: 3 / 4.1;
                        object-fit: cover; background: #f1f5f9;
                    }
                    .bd-cover-badges {
                        position: absolute; top: 12px; left: 12px; z-index: 2;
                        display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
                    }
                    .bd-badge-discount {
                        background: var(--bd-brand); color: #fff; font-size: 11px; font-weight: 800;
                        letter-spacing: .04em; padding: 5px 9px; border-radius: 6px;
                        box-shadow: 0 6px 14px -6px rgba(232, 64, 28, 0.8);
                    }
                    .bd-badge-featured {
                        background: rgba(20, 33, 61, 0.92); color: #ffd77a; font-size: 10.5px;
                        font-weight: 700; letter-spacing: .04em; padding: 5px 9px; border-radius: 6px;
                    }
                    .bd-thumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
                    .bd-thumb {
                        width: 54px; height: 70px; padding: 0; overflow: hidden;
                        background: #fff; border: 2px solid var(--bd-border); border-radius: 8px;
                        cursor: pointer; transition: border-color .15s, transform .15s, box-shadow .15s;
                    }
                    .bd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
                    .bd-thumb:hover { transform: translateY(-1px); }
                    .bd-thumb.is-active {
                        border-color: var(--bd-brand);
                        box-shadow: 0 0 0 3px rgba(232, 64, 28, 0.12);
                    }

                    /* Summary */
                    .bd-summary { min-width: 0; padding-top: 2px; }
                    .bd-eyebrow {
                        display: inline-flex; align-items: center; gap: 6px;
                        font-size: 11px; font-weight: 700; letter-spacing: .08em;
                        text-transform: uppercase; color: var(--bd-brand);
                    }
                    .bd-title {
                        font-size: clamp(24px, 2.5vw, 34px); line-height: 1.2;
                        letter-spacing: -0.02em; color: var(--bd-ink); font-weight: 800;
                        margin: 10px 0 6px;
                    }
                    .bd-subtitle { font-size: 15px; line-height: 1.5; color: var(--bd-muted); margin: 0 0 10px; }
                    .bd-byline { font-size: 14px; color: var(--bd-muted); margin-bottom: 14px; }
                    .bd-byline strong { color: var(--bd-ink); font-weight: 700; }
                    .bd-byline a { color: inherit; text-decoration: none; }
                    .bd-byline a:hover strong { color: var(--bd-brand); text-decoration: underline; }
                    .bd-spec-link { color: var(--bd-brand); text-decoration: none; }
                    .bd-spec-link:hover { text-decoration: underline; }
                    .bd-rating-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
                    .bd-stars { display: flex; gap: 2px; font-size: 14px; }
                    .bd-stars .bi-star-fill { color: #f59e0b; }
                    .bd-stars .bi-star { color: #dbe2ea; }
                    .bd-rating-score { font-size: 14px; font-weight: 800; color: var(--bd-ink); }
                    .bd-rating-link {
                        background: none; border: none; padding: 0; cursor: pointer;
                        color: var(--bd-brand); font-family: inherit; font-size: 12.5px; font-weight: 600;
                        text-decoration: underline; text-underline-offset: 2px;
                    }
                    .bd-rating-link:hover { color: var(--bd-brand-dark); }
                    .bd-lead {
                        font-size: 14.5px; line-height: 1.75; color: var(--bd-text); margin: 0 0 6px;
                        display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .bd-text-btn {
                        background: none; border: none; padding: 0; cursor: pointer;
                        color: var(--bd-brand); font-family: inherit; font-size: 12.5px; font-weight: 700;
                    }
                    .bd-text-btn:hover { text-decoration: underline; }
                    .bd-facts {
                        display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                        gap: 12px 18px; margin-top: 18px; padding-top: 16px;
                        border-top: 1px dashed var(--bd-border);
                    }
                    .bd-fact { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
                    .bd-fact span {
                        font-size: 10.5px; font-weight: 700; letter-spacing: .06em;
                        text-transform: uppercase; color: var(--bd-muted);
                    }
                    .bd-fact b {
                        font-size: 13px; font-weight: 600; color: var(--bd-ink);
                        overflow-wrap: anywhere;
                    }

                    /* Buy panel */
                    .bd-buy {
                        background: #fbfcfe; border: 1px solid var(--bd-border);
                        border-radius: 14px; padding: 20px; align-self: start;
                    }
                    .bd-buy-label {
                        font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
                        text-transform: uppercase; color: var(--bd-muted); margin-bottom: 8px;
                    }
                    .bd-price-row { display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px; }
                    .bd-price { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; color: var(--bd-ink); }
                    .bd-price-old { font-size: 15px; color: #94a3b8; text-decoration: line-through; }
                    .bd-save {
                        display: inline-block; margin-top: 8px; padding: 3px 9px; border-radius: 999px;
                        background: var(--bd-soft); color: var(--bd-brand);
                        font-size: 11px; font-weight: 700;
                    }
                    .bd-stock {
                        display: flex; align-items: center; gap: 8px;
                        margin: 14px 0; padding: 9px 12px; border-radius: 9px;
                        font-size: 12.5px; font-weight: 600;
                    }
                    .bd-stock i { font-size: 9px; }
                    .bd-stock.in { background: var(--bd-good-bg); color: var(--bd-good); }
                    .bd-stock.low { background: var(--bd-warn-bg); color: var(--bd-warn); }
                    .bd-stock.out { background: var(--bd-bad-bg); color: var(--bd-bad); }
                    .bd-cart-chip {
                        display: flex; align-items: center; justify-content: space-between; gap: 10px;
                        margin-bottom: 10px; padding: 8px 12px; border-radius: 8px;
                        background: #f1f5f9; font-size: 12px; color: var(--bd-muted);
                    }
                    .bd-cart-chip a { color: var(--bd-brand); font-weight: 700; text-decoration: none; }
                    .bd-cart-chip a:hover { text-decoration: underline; }
                    .bd-alert {
                        display: flex; align-items: center; gap: 8px;
                        margin-bottom: 10px; padding: 9px 12px; border-radius: 8px;
                        font-size: 12.5px; font-weight: 500;
                    }
                    .bd-alert.success { background: var(--bd-good-bg); color: var(--bd-good); }
                    .bd-alert.error { background: var(--bd-bad-bg); color: var(--bd-bad); }
                    .bd-btn-primary {
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                        width: 100%; padding: 13px 16px; border: none; border-radius: 10px;
                        background: var(--bd-brand); color: #fff;
                        font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
                        transition: background .18s, transform .15s, box-shadow .18s;
                        box-shadow: 0 10px 20px -12px rgba(232, 64, 28, 0.7);
                    }
                    .bd-btn-primary:hover:not(:disabled) { background: var(--bd-brand-dark); transform: translateY(-1px); }
                    .bd-btn-primary:disabled { background: #cbd5e1; box-shadow: none; cursor: not-allowed; }
                    .bd-btn-secondary {
                        display: flex; align-items: center; justify-content: center; gap: 8px;
                        width: 100%; margin-top: 8px; padding: 11px 16px;
                        border: 1px solid #f3c6b8; border-radius: 10px;
                        background: #fff; color: var(--bd-brand);
                        font-size: 13px; font-weight: 700; text-decoration: none;
                        transition: background .15s, color .15s;
                    }
                    .bd-btn-secondary:hover { background: var(--bd-soft); color: var(--bd-brand-dark); }
                    .bd-wish-row {
                        display: flex; align-items: center; gap: 8px; margin-top: 12px;
                        padding: 9px 12px; border: 1px dashed var(--bd-border); border-radius: 9px;
                        font-size: 12.5px; font-weight: 600; color: var(--bd-muted);
                    }
                    .bd-wish-row .wishlist-btn { color: var(--bd-muted); }
                    .bd-perks {
                        display: flex; flex-direction: column; gap: 8px;
                        margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--bd-border);
                    }
                    .bd-perk { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--bd-muted); }
                    .bd-perk i { color: #94a3b8; font-size: 13px; }

                    /* ── Tabs ── */
                    .bd-detail {
                        margin-top: 24px; background: var(--bd-surface);
                        border: 1px solid var(--bd-border); border-radius: 18px;
                        overflow: hidden; box-shadow: 0 12px 30px -26px rgba(15, 23, 42, 0.35);
                        scroll-margin-top: calc(var(--nb-header-h, 0px) + 16px);
                    }
                    .bd-tabs {
                        display: flex; gap: 4px; padding: 0 10px;
                        border-bottom: 1px solid var(--bd-border);
                        overflow-x: auto; scrollbar-width: none;
                    }
                    .bd-tabs::-webkit-scrollbar { display: none; }
                    .bd-tab {
                        position: relative; border: none; background: none;
                        padding: 16px 14px; cursor: pointer; white-space: nowrap;
                        font-family: inherit; font-size: 13px; font-weight: 700; color: var(--bd-muted);
                        transition: color .15s;
                    }
                    .bd-tab:hover { color: var(--bd-ink); }
                    .bd-tab.is-active { color: var(--bd-brand); }
                    .bd-tab.is-active::after {
                        content: ''; position: absolute; left: 14px; right: 14px; bottom: -1px;
                        height: 2.5px; border-radius: 2px 2px 0 0; background: var(--bd-brand);
                    }
                    .bd-panel { padding: 26px 28px; }
                    .bd-prose { max-width: 80ch; margin: 0; font-size: 14.5px; line-height: 1.9; color: var(--bd-text); }
                    .bd-empty { margin: 0; font-size: 13.5px; color: var(--bd-muted); }
                    .bd-specs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 24px; margin: 0; }
                    .bd-spec {
                        display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 12px; align-items: center;
                        padding: 11px 12px; border-radius: 8px; background: #f8fafc; font-size: 13px;
                    }
                    .bd-spec dt {
                        display: flex; align-items: center; gap: 7px; margin: 0;
                        font-size: 12.5px; font-weight: 600; color: var(--bd-muted);
                    }
                    .bd-spec dt i { color: #94a3b8; }
                    .bd-spec dd { margin: 0; font-weight: 600; color: var(--bd-ink); overflow-wrap: anywhere; }

                    /* ── Related ── */
                    .bd-related { margin-top: 28px; }
                    .bd-related-head { margin-bottom: 14px; }
                    .bd-related-head h2 {
                        margin: 0; font-size: 19px; font-weight: 800;
                        letter-spacing: -0.01em; color: var(--bd-ink);
                    }
                    .bd-related-head p { margin: 3px 0 0; font-size: 12.5px; color: var(--bd-muted); }

                    /* ── Loading skeleton ── */
                    .bd-skeleton {
                        display: grid; grid-template-columns: minmax(240px, 320px) minmax(0, 1fr) 300px;
                        gap: 28px; padding: 28px; background: var(--bd-surface);
                        border: 1px solid var(--bd-border); border-radius: 20px;
                    }
                    .bd-skel {
                        border-radius: 10px;
                        background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 37%, #eef2f7 63%);
                        background-size: 400% 100%;
                        animation: bdShimmer 1.4s ease infinite;
                    }
                    .bd-skel-cover { width: 100%; aspect-ratio: 3 / 4.1; }
                    .bd-skel-line { height: 12px; margin-bottom: 12px; }
                    .bd-skel-title { width: 70%; height: 28px; margin-bottom: 18px; }
                    .bd-skel-block { height: 150px; margin-bottom: 14px; }
                    @keyframes bdShimmer {
                        0% { background-position: 100% 0; }
                        100% { background-position: 0 0; }
                    }

                    /* ── Error ── */
                    .bd-error {
                        display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
                        padding: 18px 20px; border: 1px solid #fecaca; border-radius: 14px;
                        background: var(--bd-bad-bg); color: var(--bd-bad); font-size: 13.5px;
                    }
                    .bd-error a { margin-left: auto; color: var(--bd-brand); font-weight: 700; text-decoration: none; }
                    .bd-error a:hover { text-decoration: underline; }

                    /* ── Responsive ── */
                    @media (max-width: 1100px) {
                        .bd-hero { grid-template-columns: 250px minmax(0, 1fr); }
                        .bd-buy { grid-column: 1 / -1; }
                        .bd-skeleton { grid-template-columns: 250px minmax(0, 1fr); }
                        .bd-skeleton .bd-skel-buy { display: none; }
                    }
                    @media (max-width: 820px) {
                        .bd-hero { gap: 22px; padding: 22px; }
                        .bd-specs { grid-template-columns: 1fr; }
                    }
                    @media (max-width: 700px) {
                        .bd-page { padding-top: 12px; }
                        .bd-shell { padding: 0 12px; }
                        .bd-hero { grid-template-columns: 1fr; padding: 18px; gap: 20px; }
                        .bd-gallery { width: 100%; max-width: 280px; margin: 0 auto; }
                        .bd-buy { grid-column: auto; }
                        .bd-title { font-size: 24px; }
                        .bd-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                        .bd-panel { padding: 18px; }
                        .bd-tabs { padding: 0; }
                        .bd-tab {
                            flex: 1; display: inline-flex; align-items: center; justify-content: center;
                            padding: 14px 6px; font-size: 12px;
                        }
                        .bd-tab.is-active::after { left: 8px; right: 8px; }
                        .bd-spec { grid-template-columns: 110px minmax(0, 1fr); }
                        .bd-skeleton { grid-template-columns: 1fr; padding: 18px; }
                        .bd-skeleton .bd-skel-cover { max-width: 240px; margin: 0 auto; }
                        .bd-related-head h2 { font-size: 17px; }
                    }
                    @media (max-width: 360px) {
                        .bd-tab { padding: 13px 4px; font-size: 11.5px; }
                        .bd-tab i { display: none; }
                    }
                `}</style>

                <div className="bd-shell">
                    {/* Breadcrumb */}
                    <nav className="bd-crumbs" aria-label={t("detail.breadcrumb")}>
                        <Link to="/">{t("footer.home")}</Link>
                        <i className="bi bi-chevron-right bd-crumb-sep" aria-hidden="true"></i>
                        {book && !loading && (
                            <>
                                <span>{categoryName}</span>
                                <i className="bi bi-chevron-right bd-crumb-sep" aria-hidden="true"></i>
                            </>
                        )}
                        <span className="bd-crumb-current">
                            {loading ? t("detail.loading") : book?.title ?? t("home.allBooks")}
                        </span>
                    </nav>

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="bd-skeleton" aria-busy="true" aria-live="polite">
                            <div className="bd-skel bd-skel-cover"></div>
                            <div>
                                <div className="bd-skel bd-skel-line" style={{ width: "35%", height: 10 }}></div>
                                <div className="bd-skel bd-skel-title"></div>
                                <div className="bd-skel bd-skel-line" style={{ width: "45%" }}></div>
                                <div className="bd-skel bd-skel-line" style={{ width: "90%" }}></div>
                                <div className="bd-skel bd-skel-line" style={{ width: "80%" }}></div>
                                <div className="bd-skel bd-skel-line" style={{ width: "60%" }}></div>
                            </div>
                            <div className="bd-skel bd-skel-block bd-skel-buy"></div>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="bd-error" role="alert">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            <span>{error}</span>
                            <Link to="/">{t("detail.backHome")}</Link>
                        </div>
                    )}

                    {!loading && book && (
                        <>
                            {/* ══════════════ Hero ══════════════ */}
                            <section className="bd-hero">
                                {/* Gallery */}
                                <div className="bd-gallery">
                                    <div className="bd-cover-frame">
                                        <div className="bd-cover-badges">
                                            {hasDiscount && (
                                                <span className="bd-badge-discount">
                                                    {t("card.off")} {formatNumber(discountPercentage)}%
                                                </span>
                                            )}
                                            {book.isFeatured && (
                                                <span className="bd-badge-featured"><i className="bi bi-star-fill me-1"></i>{t("detail.featured")}</span>
                                            )}
                                        </div>
                                        <img
                                            src={currentImageUrl}
                                            alt={book.title}
                                            onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                                        />
                                    </div>

                                    {galleryImages.length > 1 && (
                                        <div className="bd-thumbs" role="group" aria-label={t("detail.bookImages")}>
                                            {galleryImages.map((image, i) => (
                                                <button
                                                    key={`${image.bookImageId}-${i}`}
                                                    type="button"
                                                    className={`bd-thumb${safeImageIndex === i ? " is-active" : ""}`}
                                                    onClick={() => setSelectedImageIndex(i)}
                                                    aria-label={t("detail.showImage", {
                                                        index: formatNumber(i + 1),
                                                        total: formatNumber(galleryImages.length),
                                                    })}
                                                    aria-pressed={safeImageIndex === i}
                                                >
                                                    <img
                                                        src={image.imageUrl}
                                                        alt=""
                                                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                <div className="bd-summary">
                                    <div className="bd-eyebrow">
                                        <i className="bi bi-tag-fill"></i>
                                        {categoryName}
                                    </div>
                                    <h1 className="bd-title">{book.title}</h1>
                                    {book.subtitle && <p className="bd-subtitle">{book.subtitle}</p>}
                                    <div className="bd-byline">
                                        {t("detail.by")}{" "}
                                        {authorHref ? (
                                            <Link to={authorHref}>
                                                <strong>{book.author}</strong>
                                            </Link>
                                        ) : (
                                            <strong>{book.author}</strong>
                                        )}
                                    </div>

                                    <div className="bd-rating-row">
                                        {reviewCount > 0 ? (
                                            <>
                                                <span className="bd-stars" aria-hidden="true">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <i key={star} className={`bi ${star <= Math.round(avgRating) ? "bi-star-fill" : "bi-star"}`}></i>
                                                    ))}
                                                </span>
                                                <span className="bd-rating-score">{formatNumber(Number(avgRating.toFixed(1)))}</span>
                                                <button type="button" className="bd-rating-link" onClick={goToReviews}>
                                                    {reviewCount === 1
                                                        ? t("detail.reviewCountOne")
                                                        : t("detail.reviewCount", { count: formatNumber(reviewCount) })}
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="bd-stars" aria-hidden="true">
                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                        <i key={star} className="bi bi-star"></i>
                                                    ))}
                                                </span>
                                                <button type="button" className="bd-rating-link" onClick={goToReviews}>
                                                    {t("detail.firstReview")}
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    {book.description && (
                                        <>
                                            <p className="bd-lead">{book.description}</p>
                                            {book.description.length > 200 && (
                                                <button type="button" className="bd-text-btn" onClick={() => goToTab("description")}>
                                                    {t("detail.readMore")}
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {facts.length > 0 && (
                                        <div className="bd-facts">
                                            {facts.map((fact) => (
                                                <div className="bd-fact" key={fact.label}>
                                                    <span>{fact.label}</span>
                                                    <b>{fact.value}</b>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Buy panel */}
                                <aside className="bd-buy" aria-label={t("detail.purchase")}>
                                    <div className="bd-buy-label">{t("detail.price")}</div>
                                    <div className="bd-price-row">
                                        <span className="bd-price">৳{formatNumber(displayPrice)}</span>
                                        {hasDiscount && (
                                            <span className="bd-price-old">৳{formatNumber(book.price)}</span>
                                        )}
                                    </div>
                                    {hasDiscount && (
                                        <span className="bd-save">{t("detail.youSave", { amount: `৳${formatNumber(savings)}` })}</span>
                                    )}

                                    <div className={`bd-stock ${isOutOfStock ? "out" : lowStock ? "low" : "in"}`}>
                                        <i className="bi bi-circle-fill" aria-hidden="true"></i>
                                        {isOutOfStock
                                            ? t("detail.outOfStock")
                                            : lowStock
                                                ? t("detail.lowStock", { count: formatNumber(book.stock) })
                                                : t("detail.inStock")}
                                    </div>

                                    {cartQuantity > 0 && (
                                        <div className="bd-cart-chip">
                                            <span><i className="bi bi-cart-check me-1"></i>{t("detail.inCart", { count: formatNumber(cartQuantity) })}</span>
                                            <Link to="/cart">{t("detail.viewCart")}</Link>
                                        </div>
                                    )}

                                    {cartMessage && (
                                        <div className="bd-alert success" role="status">
                                            <i className="bi bi-check-circle-fill"></i>{cartMessage}
                                        </div>
                                    )}
                                    {cartError && (
                                        <div className="bd-alert error" role="alert">
                                            <i className="bi bi-exclamation-circle-fill"></i>{cartError}
                                        </div>
                                    )}

                                    <button
                                        type="button"
                                        className="bd-btn-primary"
                                        onClick={handleAddToCart}
                                        disabled={isOutOfStock || addingToCart || isMaxedOut}
                                    >
                                        {addingToCart ? (
                                            <><span className="spinner-border spinner-border-sm" aria-hidden="true"></span>{t("detail.adding")}</>
                                        ) : isOutOfStock ? (
                                            t("detail.outOfStock")
                                        ) : isMaxedOut ? (
                                            t("detail.inCart", { count: formatNumber(cartQuantity) })
                                        ) : (
                                            <><i className="bi bi-cart-plus"></i>{t("detail.addToCart")}</>
                                        )}
                                    </button>

                                    {cartQuantity > 0 && (
                                        <Link to="/cart" className="bd-btn-secondary">
                                            <i className="bi bi-bag-check"></i>{t("detail.goToCart")}
                                        </Link>
                                    )}

                                    <div className="bd-wish-row">
                                        <WishlistButton bookId={book.bookId} />
                                        <span>{t("detail.saveToWishlist")}</span>
                                    </div>

                                    <div className="bd-perks">
                                        <div className="bd-perk"><i className="bi bi-truck"></i>{t("detail.perkDelivery")}</div>
                                        <div className="bd-perk"><i className="bi bi-arrow-repeat"></i>{t("detail.perkReturns")}</div>
                                        <div className="bd-perk"><i className="bi bi-shield-check"></i>{t("detail.perkSecure")}</div>
                                    </div>
                                </aside>
                            </section>

                            {/* ══════════════ Tabs ══════════════ */}
                            <section className="bd-detail" ref={contentRef}>
                                <div className="bd-tabs" role="tablist" aria-label={t("detail.bookInfo")}>
                                    {[
                                        { key: "description" as DetailTab, label: t("detail.tabDescription"), icon: "bi-text-left" },
                                        { key: "summary" as DetailTab, label: t("detail.specifications"), icon: "bi-card-list" },
                                        { key: "reviews" as DetailTab, label: `${t("detail.tabReviews")} (${formatNumber(reviewCount)})`, icon: "bi-star" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            role="tab"
                                            id={`bd-tab-${tab.key}`}
                                            aria-selected={activeTab === tab.key}
                                            aria-controls={`bd-panel-${tab.key}`}
                                            className={`bd-tab${activeTab === tab.key ? " is-active" : ""}`}
                                            onClick={() => setActiveTab(tab.key)}
                                        >
                                            <i className={`bi ${tab.icon} me-2`} aria-hidden="true"></i>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                <div
                                    className="bd-panel"
                                    role="tabpanel"
                                    id={`bd-panel-${activeTab}`}
                                    aria-labelledby={`bd-tab-${activeTab}`}
                                >
                                    {activeTab === "description" && (
                                        book.description
                                            ? <p className="bd-prose">{book.description}</p>
                                            : <p className="bd-empty">{t("detail.noDescription")}</p>
                                    )}

                                    {activeTab === "summary" && (
                                        summaryRows.length === 0
                                            ? <p className="bd-empty">{t("detail.noSpecs")}</p>
                                            : (
                                                <dl className="bd-specs">
                                                    {summaryRows.map((row) => (
                                                        <div className="bd-spec" key={row.label}>
                                                            <dt><i className={`bi ${row.icon}`} aria-hidden="true"></i>{row.label}</dt>
                                                            <dd>
                                                                {row.to ? (
                                                                    <Link to={row.to} className="bd-spec-link">{row.value}</Link>
                                                                ) : row.value}
                                                            </dd>
                                                        </div>
                                                    ))}
                                                </dl>
                                            )
                                    )}

                                    {activeTab === "reviews" && (
                                        <ReviewSection
                                            bookId={book.bookId}
                                            reviews={reviews}
                                            onReviewAdded={handleReviewAdded}
                                            onReviewDeleted={handleReviewDeleted}
                                        />
                                    )}
                                </div>
                            </section>

                            {/* ══════════════ Related ══════════════ */}
                            {related.length > 0 && (
                                <section className="bd-related">
                                    <div className="bd-related-head">
                                        <h2>{t("detail.related")}</h2>
                                        <p>{t("detail.relatedSub")}</p>
                                    </div>
                                    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2 g-sm-3">
                                        {related.map((relatedBook) => (
                                            <div key={relatedBook.bookId} className="col">
                                                <BookCard
                                                    book={relatedBook}
                                                    onAddToCart={handleAddRelatedToCart}
                                                    addingToCart={addingRelatedToCart === relatedBook.bookId}
                                                    cartQuantity={relatedCartQuantities[relatedBook.bookId] ?? 0}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
