// =============================================
// HomePage.tsx — storefront home & catalog
// URL is the single source of truth for filters.
// =============================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Seo from "../components/common/Seo";
import BookCard from "../components/books/BookCard";
import CreatorCard from "../components/creators/CreatorCard";
import HeroSlider, { HeroSkeleton } from "../components/home/HeroSlider";
import { useLanguage } from "../i18n/language-context";
import type { TranslationKey } from "../i18n/translations";
import { categoryPath } from "../utils/slug";
import { absoluteUrl } from "../utils/seo";

import BookService from "../services/book.service";
import CartService from "../services/cart.service";
import AuthService from "../services/auth.service";
import BannerService from "../services/banner.service";
import CreatorService from "../services/creator.service";

import type {
    BookFilterParams,
    BookResponseDto,
    CategoryResponseDto,
} from "../types/book.types";
import type { BannerResponseDto } from "../types/banner.types";
import type { AuthorResponseDto, PublisherResponseDto } from "../types/creator.types";

import "./home.css";

const PAGE_SIZE = 20;
const LANDING_ALL_BOOKS = 20;
const LANDING_NEW_ARRIVALS = 10;
const LANDING_CREATORS = 12;

type SortValue = NonNullable<BookFilterParams["sortBy"]>;

const SORT_OPTIONS: { value: SortValue | ""; labelKey: TranslationKey }[] = [
    { value: "", labelKey: "sort.recommended" },
    { value: "newest", labelKey: "sort.newest" },
    { value: "rating_desc", labelKey: "sort.topRated" },
    { value: "popular", labelKey: "sort.popular" },
    { value: "price_asc", labelKey: "sort.priceLowHigh" },
    { value: "price_desc", labelKey: "sort.priceHighLow" },
    { value: "title_asc", labelKey: "sort.titleAZ" },
];

const SORT_LOOKUP: Record<string, SortValue> = {
    new: "newest",
    newest: "newest",
    createdatdesc: "newest",
    oldest: "title_asc",
    rating: "rating_desc",
    ratingdesc: "rating_desc",
    toprated: "rating_desc",
    popular: "popular",
    popularity: "popular",
    priceasc: "price_asc",
    lowtohigh: "price_asc",
    pricedesc: "price_desc",
    hightolow: "price_desc",
    titleasc: "title_asc",
    az: "title_asc",
    titledesc: "title_desc",
    za: "title_desc",
};

const CATEGORY_ICONS: Record<string, string> = {
    fiction: "bi-book",
    nonfiction: "bi-journal-text",
    science: "bi-flask",
    history: "bi-bank",
    childrensbooks: "bi-balloon",
    religion: "bi-moon-stars",
    biography: "bi-person",
    technology: "bi-cpu",
    business: "bi-briefcase",
    poetry: "bi-pen",
    travel: "bi-compass",
    islamic: "bi-moon-stars",
    academic: "bi-mortarboard",
};

const EMPTY_DRAFT: FilterDraft = {
    search: "",
    categoryId: undefined,
    minPrice: "",
    maxPrice: "",
    inStockOnly: false,
};

// ── URL helpers ──
interface ParsedUrl {
    search?: string;
    categorySlug?: string;
    sortBy?: SortValue;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly: boolean;
    page: number;
    showAll: boolean;
}

interface FilterDraft {
    search: string;
    categoryId?: number;
    minPrice: string;
    maxPrice: string;
    inStockOnly: boolean;
}

function normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function singularize(key: string): string {
    return key.endsWith("s") ? key.slice(0, -1) : key;
}

function normalizeSort(raw: string | null): SortValue | undefined {
    if (!raw) return undefined;
    return SORT_LOOKUP[normalizeKey(raw)];
}

function parseMoney(raw: string | null): number | undefined {
    if (raw === null || raw.trim() === "") return undefined;
    const value = Number(raw);
    return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function readPathCategory(pathname: string): string | undefined {
    const prefix = "/category/";
    if (!pathname.startsWith(prefix)) return undefined;
    const segment = pathname.slice(prefix.length).split("/")[0];
    if (!segment) return undefined;
    try {
        return decodeURIComponent(segment).toLowerCase();
    } catch {
        return undefined;
    }
}

function parseUrlState(
    rawSearch: string,
    pathCategory: string | undefined,
    catalogPath: boolean
): ParsedUrl {
    const params = new URLSearchParams(rawSearch);
    const search = params.get("search")?.trim() || undefined;
    const categorySlug =
        pathCategory ?? (params.get("category")?.trim().toLowerCase() || undefined);
    const sortBy = normalizeSort(params.get("sort"));
    const minPrice = parseMoney(params.get("minPrice"));
    const maxPrice = parseMoney(params.get("maxPrice"));
    const inStockOnly = params.get("inStock") === "true";
    const parsedPage = Number.parseInt(params.get("page") ?? "1", 10);
    const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const showAll =
        catalogPath ||
        Boolean(
            search ||
            categorySlug ||
            sortBy ||
            minPrice !== undefined ||
            maxPrice !== undefined ||
            inStockOnly ||
            page > 1
        );

    return { search, categorySlug, sortBy, minPrice, maxPrice, inStockOnly, page, showAll };
}

function isAllBooksSlug(slug: string): boolean {
    const key = normalizeKey(slug);
    return key === "books" || key === "all" || key === "allbooks";
}

function matchCategory(
    categories: CategoryResponseDto[],
    slug: string
): CategoryResponseDto | undefined {
    const key = normalizeKey(slug);
    if (!key) return undefined;

    const exact = categories.find((cat) => normalizeKey(cat.name) === key);
    if (exact) return exact;

    const singular = singularize(key);
    const bySingular = categories.filter(
        (cat) => singularize(normalizeKey(cat.name)) === singular
    );
    if (bySingular.length === 1) return bySingular[0];

    const byPrefix = categories.filter((cat) => {
        const nameKey = normalizeKey(cat.name);
        return nameKey.startsWith(key) || key.startsWith(nameKey);
    });
    return byPrefix.length === 1 ? byPrefix[0] : undefined;
}

interface CatalogLocation {
    pathname: string;
    search: string;
}

function buildLocation(
    filters: BookFilterParams,
    catalog: boolean,
    categories: CategoryResponseDto[]
): CatalogLocation {
    if (!catalog) return { pathname: "/", search: "" };

    let pathname = "/books";
    if (filters.categoryId !== undefined) {
        const category = categories.find((cat) => cat.categoryId === filters.categoryId);
        if (category) pathname = categoryPath(category.name);
    }

    const params = new URLSearchParams();
    if (filters.search?.trim()) params.set("search", filters.search.trim());
    if (filters.sortBy) params.set("sort", filters.sortBy);
    if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));
    if (filters.inStockOnly) params.set("inStock", "true");
    if ((filters.page ?? 1) > 1) params.set("page", String(filters.page));

    const search = params.toString();
    return { pathname, search: search ? `?${search}` : "" };
}

function readError(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string; title?: string } | undefined;
        return data?.message || data?.title || fallback;
    }
    return fallback;
}

function getPaginationPages(current: number, total: number): (number | "…")[] {
    if (total <= 6) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | "…")[] = [1];
    if (current > 3) pages.push("…");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
    }
    if (current < total - 2) pages.push("…");
    pages.push(total);
    return pages;
}

// ── Shared UI ──
function SectionHeader({
    id,
    title,
    subtitle,
    icon,
    actionLabel,
    onAction,
}: {
    id: string;
    title: string;
    subtitle?: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <div className="hm-section-head">
            <div className="hm-section-heading">
                {icon && (
                    <span className="hm-section-icon" aria-hidden="true">
                        <i className={`bi ${icon}`} />
                    </span>
                )}
                <div>
                    <h2 id={id} className="hm-section-title">
                        {title}
                    </h2>
                    {subtitle && <p className="hm-section-sub">{subtitle}</p>}
                </div>
            </div>
            {onAction && actionLabel && (
                <button type="button" className="hm-viewall" onClick={onAction}>
                    {actionLabel}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                </button>
            )}
        </div>
    );
}

function InlineNotice({
    tone = "warning",
    title,
    actionLabel,
    onAction,
    children,
}: {
    tone?: "warning" | "error";
    title?: string;
    actionLabel?: string;
    onAction?: () => void;
    children: ReactNode;
}) {
    return (
        <div
            className={`hm-notice${tone === "error" ? " is-error" : ""}`}
            role={tone === "error" ? "alert" : "status"}
        >
            <i
                className={`bi ${tone === "error" ? "bi-exclamation-octagon" : "bi-info-circle"}`}
                aria-hidden="true"
            />
            <div className="hm-notice-body">
                {title && <p className="hm-notice-title">{title}</p>}
                <p className="hm-notice-text">{children}</p>
            </div>
            {onAction && (
                <button type="button" className="hm-notice-action" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

function ErrorCard({
    title,
    message,
    onRetry,
}: {
    title: string;
    message: string;
    onRetry: () => void;
}) {
    const { t } = useLanguage();
    return (
        <div className="hm-error-card" role="alert">
            <span className="hm-state-icon" aria-hidden="true">
                <i className="bi bi-wifi-off" />
            </span>
            <h2>{title}</h2>
            <p>{message}</p>
            <button type="button" className="hm-btn hm-btn--dark" onClick={onRetry}>
                <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                {t("common.tryAgain")}
            </button>
        </div>
    );
}

function EmptyState({
    title,
    message,
    actionLabel,
    onAction,
}: {
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}) {
    return (
        <div className="hm-empty">
            <span className="hm-state-icon" aria-hidden="true">
                <i className="bi bi-search" />
            </span>
            <h2>{title}</h2>
            <p>{message}</p>
            {onAction && actionLabel && (
                <button type="button" className="hm-btn hm-btn--primary" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}

function CategoryTile({
    category,
    onSelect,
}: {
    category: CategoryResponseDto;
    onSelect: (category: CategoryResponseDto) => void;
}) {
    const { t, formatNumber } = useLanguage();
    const [imageFailed, setImageFailed] = useState(false);
    const icon = CATEGORY_ICONS[normalizeKey(category.name)] ?? "bi-bookmark";
    const showImage = !!category.imageUrl && !imageFailed;
    const countLabel =
        category.bookCount === 1
            ? t("common.bookOne")
            : t("common.bookMany", { count: formatNumber(category.bookCount) });

    return (
        <button
            type="button"
            className="hm-cat-tile"
            onClick={() => onSelect(category)}
            aria-label={`${t("home.browseByCategory")} — ${category.name}, ${countLabel}`}
        >
            <span className="hm-cat-media">
                {showImage ? (
                    <img
                        src={category.imageUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <i className={`bi ${icon}`} aria-hidden="true" />
                )}
            </span>
            <span className="hm-cat-body">
                <span className="hm-cat-name">{category.name}</span>
                <span className="hm-cat-count">{countLabel}</span>
            </span>
        </button>
    );
}

// ── Skeletons ──
const GRID_COLS = "row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-xl-5 g-2 g-sm-3";

function BookSkeletonGrid({ count = 10 }: { count?: number }) {
    return (
        <div className={GRID_COLS} aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div className="col" key={i}>
                    <div className="hm-skeleton-card">
                        <div className="hm-skeleton hm-skeleton-cover" />
                        <div className="hm-skeleton-lines">
                            <div className="hm-skeleton hm-skeleton-line" />
                            <div className="hm-skeleton hm-skeleton-line short" />
                            <div className="hm-skeleton hm-skeleton-line short" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function CategorySkeletonGrid({ count = 6 }: { count?: number }) {
    return (
        <div className="hm-cat-grid" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="hm-skeleton hm-skeleton-tile" />
            ))}
        </div>
    );
}

function CreatorSkeletonStrip({ count = 5 }: { count?: number }) {
    return (
        <div className="hm-skeleton-strip" aria-hidden="true">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="hm-skeleton hm-skeleton-creator" />
            ))}
        </div>
    );
}

// ── Book grid ──
function BookGrid({
    books,
    onAddToCart,
    addingToCart,
    cartQuantities,
}: {
    books: BookResponseDto[];
    onAddToCart: (bookId: number) => void;
    addingToCart: number | null;
    cartQuantities: Record<number, number>;
}) {
    return (
        <div className={`hm-grid ${GRID_COLS}`}>
            {books.map((book) => (
                <div key={book.bookId} className="col">
                    <BookCard
                        book={book}
                        onAddToCart={onAddToCart}
                        addingToCart={addingToCart === book.bookId}
                        cartQuantity={cartQuantities[book.bookId] ?? 0}
                    />
                </div>
            ))}
        </div>
    );
}

export default function HomePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, formatNumber } = useLanguage();

    // ── Catalog data ──
    const [landingBooks, setLandingBooks] = useState<BookResponseDto[]>([]);
    const [landingTotal, setLandingTotal] = useState(0);
    const [newArrivals, setNewArrivals] = useState<BookResponseDto[]>([]);
    const [landingLoading, setLandingLoading] = useState(true);
    const [landingError, setLandingError] = useState("");
    const [catalogBooks, setCatalogBooks] = useState<BookResponseDto[]>([]);
    const [catalogTotal, setCatalogTotal] = useState(0);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogError, setCatalogError] = useState("");
    const [reloadToken, setReloadToken] = useState(0);

    // ── Home meta ──
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [categoriesLoaded, setCategoriesLoaded] = useState(false);
    const [categoriesError, setCategoriesError] = useState("");
    const [banners, setBanners] = useState<BannerResponseDto[]>([]);
    const [bannersLoading, setBannersLoading] = useState(true);
    const [bannersError, setBannersError] = useState("");
    const [authors, setAuthors] = useState<AuthorResponseDto[]>([]);
    const [authorsLoading, setAuthorsLoading] = useState(true);
    const [publishers, setPublishers] = useState<PublisherResponseDto[]>([]);
    const [publishersLoading, setPublishersLoading] = useState(true);
    const [metaReload, setMetaReload] = useState(0);

    // ── Filter UI ──
    const [draft, setDraft] = useState<FilterDraft>(EMPTY_DRAFT);
    const [priceError, setPriceError] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);

    // ── Cart & toasts ──
    const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [cartMessage, setCartMessage] = useState("");
    const [cartError, setCartError] = useState("");

    const resultsRef = useRef<HTMLDivElement | null>(null);
    const pendingScroll = useRef(false);
    const messageTimer = useRef<number | null>(null);
    const errorTimer = useRef<number | null>(null);

    // ── URL-derived state ──
    const pathCategory = useMemo(
        () => readPathCategory(location.pathname),
        [location.pathname]
    );
    const isCatalogPath = location.pathname === "/books" || pathCategory !== undefined;

    const urlState = useMemo(
        () => parseUrlState(location.search, pathCategory, isCatalogPath),
        [location.search, pathCategory, isCatalogPath]
    );

    const matchedCategory = useMemo(() => {
        if (!urlState.categorySlug || isAllBooksSlug(urlState.categorySlug)) return undefined;
        return matchCategory(categories, urlState.categorySlug);
    }, [urlState.categorySlug, categories]);

    const awaitingCategoryResolution =
        !!urlState.categorySlug && !matchedCategory && !categoriesLoaded;

    const activeFilters = useMemo<BookFilterParams>(
        () => ({
            search: urlState.search,
            categoryId: matchedCategory?.categoryId,
            sortBy: urlState.sortBy,
            minPrice: urlState.minPrice,
            maxPrice: urlState.maxPrice,
            inStockOnly: urlState.inStockOnly,
            page: urlState.page,
            pageSize: PAGE_SIZE,
        }),
        [urlState, matchedCategory]
    );

    const showResults = urlState.showAll;

    const unresolvedCategory =
        urlState.categorySlug &&
        !isAllBooksSlug(urlState.categorySlug) &&
        categoriesLoaded &&
        !matchedCategory
            ? urlState.categorySlug
            : null;

    // ── Meta loading ──
    useEffect(() => {
        let active = true;
        setBannersLoading(true);
        setBannersError("");
        BannerService.getActive()
            .then((list) => {
                if (active) setBanners(list);
            })
            .catch((err: unknown) => {
                if (active) setBannersError(readError(err, t("home.bannerError")));
            })
            .finally(() => {
                if (active) setBannersLoading(false);
            });
        return () => {
            active = false;
        };
    }, [metaReload, t]);

    useEffect(() => {
        let active = true;
        setCategoriesError("");
        BookService.getCategories()
            .then((list) => {
                if (active) setCategories(list);
            })
            .catch((err: unknown) => {
                if (active) setCategoriesError(readError(err, t("home.categoryError")));
            })
            .finally(() => {
                if (active) setCategoriesLoaded(true);
            });
        return () => {
            active = false;
        };
    }, [metaReload, t]);

    useEffect(() => {
        let active = true;
        setAuthorsLoading(true);
        CreatorService.getAuthors({ page: 1, pageSize: LANDING_CREATORS })
            .then((result) => {
                if (active) setAuthors(result.items);
            })
            .catch(() => {
                if (active) setAuthors([]);
            })
            .finally(() => {
                if (active) setAuthorsLoading(false);
            });
        return () => {
            active = false;
        };
    }, [metaReload]);

    useEffect(() => {
        let active = true;
        setPublishersLoading(true);
        CreatorService.getPublishers({ page: 1, pageSize: LANDING_CREATORS })
            .then((result) => {
                if (active) setPublishers(result.items);
            })
            .catch(() => {
                if (active) setPublishers([]);
            })
            .finally(() => {
                if (active) setPublishersLoading(false);
            });
        return () => {
            active = false;
        };
    }, [metaReload]);

    // ── Landing data ──
    useEffect(() => {
        if (showResults) return;
        const controller = new AbortController();

        setLandingLoading(true);
        setLandingError("");
        Promise.all([
            BookService.searchBooks(
                { page: 1, pageSize: LANDING_ALL_BOOKS },
                controller.signal
            ),
            BookService.searchBooks(
                { page: 1, pageSize: LANDING_NEW_ARRIVALS, sortBy: "newest" },
                controller.signal
            ),
        ])
            .then(([all, newest]) => {
                setLandingBooks(all.items);
                setLandingTotal(all.totalCount);
                setNewArrivals(newest.items);
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                setLandingError(readError(err, t("home.loadCatalogError")));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLandingLoading(false);
            });

        return () => controller.abort();
    }, [showResults, reloadToken, t]);

    // ── Filtered catalog ──
    useEffect(() => {
        if (!showResults || awaitingCategoryResolution) return;
        const controller = new AbortController();

        setCatalogLoading(true);
        setCatalogError("");
        BookService.searchBooks(activeFilters, controller.signal)
            .then((result) => {
                setCatalogBooks(result.items);
                setCatalogTotal(result.totalCount);
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                setCatalogError(readError(err, t("home.loadFilteredError")));
            })
            .finally(() => {
                if (!controller.signal.aborted) setCatalogLoading(false);
            });

        return () => controller.abort();
    }, [showResults, activeFilters, awaitingCategoryResolution, reloadToken, t]);

    // ── Draft sync ──
    useEffect(() => {
        setDraft({
            search: urlState.search ?? "",
            categoryId: matchedCategory?.categoryId,
            minPrice: urlState.minPrice === undefined ? "" : String(urlState.minPrice),
            maxPrice: urlState.maxPrice === undefined ? "" : String(urlState.maxPrice),
            inStockOnly: urlState.inStockOnly,
        });
        setPriceError("");
    }, [
        urlState.search,
        urlState.minPrice,
        urlState.maxPrice,
        urlState.inStockOnly,
        matchedCategory,
    ]);

    // ── Legacy query URLs → clean paths ──
    useEffect(() => {
        if (location.pathname !== "/") return;
        const params = new URLSearchParams(location.search);
        const legacyKeys = [
            "view",
            "category",
            "search",
            "sort",
            "minPrice",
            "maxPrice",
            "inStock",
            "page",
        ];
        if (!legacyKeys.some((key) => params.has(key))) return;

        const categorySlug = params.get("category")?.trim().toLowerCase();
        if (categorySlug && !isAllBooksSlug(categorySlug)) {
            if (!categoriesLoaded) return;
            const matched = matchCategory(categories, categorySlug);
            if (!matched) {
                const remaining = new URLSearchParams(params);
                remaining.delete("category");
                remaining.delete("view");
                const search = remaining.toString();
                navigate(
                    {
                        pathname: `/category/${encodeURIComponent(categorySlug)}`,
                        search: search ? `?${search}` : "",
                    },
                    { replace: true }
                );
                return;
            }
            navigate(
                buildLocation(
                    {
                        search: params.get("search")?.trim() || undefined,
                        categoryId: matched.categoryId,
                        minPrice: parseMoney(params.get("minPrice")),
                        maxPrice: parseMoney(params.get("maxPrice")),
                        inStockOnly: params.get("inStock") === "true",
                        sortBy: normalizeSort(params.get("sort")),
                        page: Math.max(
                            1,
                            Number.parseInt(params.get("page") ?? "1", 10) || 1
                        ),
                    },
                    true,
                    categories
                ),
                { replace: true }
            );
            return;
        }

        navigate(
            buildLocation(
                {
                    search: params.get("search")?.trim() || undefined,
                    minPrice: parseMoney(params.get("minPrice")),
                    maxPrice: parseMoney(params.get("maxPrice")),
                    inStockOnly: params.get("inStock") === "true",
                    sortBy: normalizeSort(params.get("sort")),
                    page: Math.max(
                        1,
                        Number.parseInt(params.get("page") ?? "1", 10) || 1
                    ),
                },
                true,
                categories
            ),
            { replace: true }
        );
    }, [location.pathname, location.search, categories, categoriesLoaded, navigate]);

    // ── Cart ──
    const fetchCartQuantities = useCallback(async () => {
        if (!AuthService.isAuthenticated()) {
            setCartQuantities({});
            return;
        }
        try {
            const cart = await CartService.getMyCart();
            const quantities: Record<number, number> = {};
            cart.items.forEach((item) => {
                quantities[item.bookId] = item.quantity;
            });
            setCartQuantities(quantities);
        } catch (err) {
            if (
                axios.isAxiosError(err) &&
                (err.response?.status === 401 || err.response?.status === 403)
            ) {
                setCartQuantities({});
                return;
            }
            console.error("Failed to load cart", err);
        }
    }, []);

    useEffect(() => {
        void fetchCartQuantities();
    }, [fetchCartQuantities]);

    useEffect(() => {
        const handleCartUpdate = () => {
            void fetchCartQuantities();
        };
        window.addEventListener("cartUpdated", handleCartUpdate);
        return () => window.removeEventListener("cartUpdated", handleCartUpdate);
    }, [fetchCartQuantities]);

    useEffect(() => {
        return () => {
            if (messageTimer.current) window.clearTimeout(messageTimer.current);
            if (errorTimer.current) window.clearTimeout(errorTimer.current);
        };
    }, []);

    // ── Scroll behaviour ──
    const scrollToResults = useCallback(() => {
        const node = resultsRef.current;
        if (!node) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, []);

    useEffect(() => {
        if (!showResults || !pendingScroll.current) return;
        pendingScroll.current = false;
        const id = window.setTimeout(scrollToResults, 80);
        return () => window.clearTimeout(id);
    }, [showResults, scrollToResults]);

    // ── Filtering ──
    const applyFilters = useCallback(
        (next: BookFilterParams, catalog: boolean, replace = false) => {
            setPriceError("");
            const target = buildLocation(next, catalog, categories);
            if (
                target.pathname === location.pathname &&
                target.search === location.search
            ) {
                return;
            }
            navigate(target, { replace });
        },
        [categories, location.pathname, location.search, navigate]
    );

    const handleFilterSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const rawMin = draft.minPrice.trim();
        const rawMax = draft.maxPrice.trim();
        const minValue = rawMin === "" ? undefined : Number(rawMin);
        const maxValue = rawMax === "" ? undefined : Number(rawMax);

        if (
            (minValue !== undefined && (!Number.isFinite(minValue) || minValue < 0)) ||
            (maxValue !== undefined && (!Number.isFinite(maxValue) || maxValue < 0))
        ) {
            setPriceError(t("home.priceInvalid"));
            return;
        }

        if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
            setPriceError(t("home.priceRangeInvalid"));
            return;
        }

        setFiltersOpen(false);
        applyFilters(
            {
                search: draft.search.trim() || undefined,
                categoryId: draft.categoryId,
                minPrice: minValue,
                maxPrice: maxValue,
                inStockOnly: draft.inStockOnly,
                sortBy: activeFilters.sortBy,
                page: 1,
            },
            true
        );
        scrollToResults();
    };

    const handleSortChange = (value: string) => {
        applyFilters(
            {
                ...activeFilters,
                sortBy: value ? (value as SortValue) : undefined,
                page: 1,
            },
            true
        );
    };

    const handlePageChange = (page: number) => {
        if (page < 1) return;
        applyFilters({ ...activeFilters, page }, true, true);
        scrollToResults();
    };

    const handleClearFilters = () => {
        setFiltersOpen(false);
        applyFilters({}, true);
    };

    const handleChipRemove = (key: "search" | "category" | "price" | "stock" | "sort") => {
        const next: BookFilterParams = { ...activeFilters, page: 1 };
        if (key === "search") next.search = undefined;
        if (key === "category") next.categoryId = undefined;
        if (key === "price") {
            next.minPrice = undefined;
            next.maxPrice = undefined;
        }
        if (key === "stock") next.inStockOnly = false;
        if (key === "sort") next.sortBy = undefined;
        applyFilters(next, true);
    };

    const handleCategoryClick = (category: CategoryResponseDto) => {
        pendingScroll.current = true;
        navigate({ pathname: categoryPath(category.name) });
    };

    const handleSeeAllBooks = (sortBy?: SortValue) => {
        pendingScroll.current = true;
        navigate(buildLocation({ sortBy, page: 1 }, true, categories));
    };

    const handleAddToCart = async (bookId: number) => {
        if (!AuthService.isAuthenticated()) {
            navigate("/auth");
            return;
        }
        if (addingToCart === bookId) return;

        setAddingToCart(bookId);
        setCartError("");
        setCartMessage("");

        try {
            await CartService.addItem({ bookId, quantity: 1 });
            setCartQuantities((prev) => ({
                ...prev,
                [bookId]: (prev[bookId] ?? 0) + 1,
            }));
            setCartMessage(t("home.cartAdded"));
            window.dispatchEvent(new Event("cartUpdated"));
            if (messageTimer.current) window.clearTimeout(messageTimer.current);
            messageTimer.current = window.setTimeout(() => setCartMessage(""), 2600);
        } catch (err: unknown) {
            setCartError(readError(err, t("home.cartFailed")));
            if (errorTimer.current) window.clearTimeout(errorTimer.current);
            errorTimer.current = window.setTimeout(() => setCartError(""), 3200);
        } finally {
            setAddingToCart(null);
        }
    };

    // ── Derived view data ──
    const totalPages = Math.max(1, Math.ceil(catalogTotal / PAGE_SIZE));
    const currentPage = Math.min(urlState.page, totalPages);
    const activeFilterCount = [
        Boolean(urlState.search),
        Boolean(matchedCategory),
        urlState.minPrice !== undefined || urlState.maxPrice !== undefined,
        urlState.inStockOnly,
        Boolean(urlState.sortBy),
    ].filter(Boolean).length;

    const resultsTitle = urlState.search
        ? t("home.resultsFor", { query: urlState.search })
        : matchedCategory
            ? matchedCategory.name
            : t("home.allBooks");

    const money = (value: number) => `৳${formatNumber(value)}`;

    const priceLabel =
        urlState.minPrice !== undefined && urlState.maxPrice !== undefined
            ? t("home.priceRange", {
                  min: money(urlState.minPrice),
                  max: money(urlState.maxPrice),
              })
            : urlState.minPrice !== undefined
                ? t("home.priceFrom", { min: money(urlState.minPrice) })
                : urlState.maxPrice !== undefined
                    ? t("home.priceUpTo", { max: money(urlState.maxPrice) })
                    : "";

    const sortLabel = t(
        SORT_OPTIONS.find((option) => option.value === (urlState.sortBy ?? ""))?.labelKey ??
            "sort.recommended"
    );

    const metaError = categoriesError || bannersError;

    const seoTitle = urlState.search
        ? t("seo.searchTitle", { query: urlState.search })
        : matchedCategory
            ? t("seo.categoryTitle", { name: matchedCategory.name })
            : showResults
                ? t("seo.catalogTitle")
                : t("seo.defaultTitle");
    const seoDescription = matchedCategory?.description || t("seo.defaultDescription");
    const seoPath = showResults ? location.pathname : "/";

    const seoJsonLd = useMemo(() => {
        const base = { "@context": "https://schema.org" };
        if (!showResults) {
            return [
                {
                    ...base,
                    "@type": "WebSite",
                    name: "Sabbir BookMall",
                    url: absoluteUrl("/"),
                    potentialAction: {
                        "@type": "SearchAction",
                        target: `${absoluteUrl("/books")}?search={search_term_string}`,
                        "query-input": "required name=search_term_string",
                    },
                },
                {
                    ...base,
                    "@type": "Organization",
                    name: "Sabbir BookMall",
                    url: absoluteUrl("/"),
                    logo: absoluteUrl("/og-cover.jpg"),
                },
            ];
        }
        return [
            {
                ...base,
                "@type": "BreadcrumbList",
                itemListElement: [
                    {
                        "@type": "ListItem",
                        position: 1,
                        name: t("footer.home"),
                        item: absoluteUrl("/"),
                    },
                    {
                        "@type": "ListItem",
                        position: 2,
                        name: resultsTitle,
                        item: absoluteUrl(location.pathname),
                    },
                ],
            },
        ];
    }, [showResults, resultsTitle, location.pathname, t]);

    return (
        <>
            <Navbar />
            <Seo
                title={seoTitle}
                description={seoDescription}
                path={seoPath}
                jsonLd={seoJsonLd}
            />

            <div className="hm-page">
                <h1 className="hm-sr-only">{t("home.h1")}</h1>

                {bannersLoading ? (
                    <HeroSkeleton />
                ) : banners.length > 0 ? (
                    <HeroSlider banners={banners} />
                ) : null}

                <main className="hm-container hm-main" id="main-content">
                    {metaError && (
                        <InlineNotice
                            tone="error"
                            title={t("home.metaError")}
                            actionLabel={t("common.retry")}
                            onAction={() => setMetaReload((token) => token + 1)}
                        >
                            {metaError}
                        </InlineNotice>
                    )}

                    {showResults ? (
                        <section
                            className="hm-results"
                            ref={resultsRef}
                            aria-labelledby="hm-results-title"
                            aria-busy={catalogLoading || awaitingCategoryResolution}
                        >
                            <div className="hm-results-panel">
                                <div className="hm-results-top">
                                    <div>
                                        <h2 id="hm-results-title" className="hm-results-title">
                                            {resultsTitle}
                                        </h2>
                                        <p className="hm-results-count" aria-live="polite">
                                            {catalogLoading || awaitingCategoryResolution
                                                ? t("home.loadingBooks")
                                                : t("home.booksFound", {
                                                      count: formatNumber(catalogTotal),
                                                  })}
                                        </p>
                                    </div>

                                    <div className="hm-results-actions">
                                        <button
                                            type="button"
                                            className="hm-filter-toggle"
                                            aria-expanded={filtersOpen}
                                            aria-controls="hm-filter-panel"
                                            onClick={() => setFiltersOpen((open) => !open)}
                                        >
                                            <i className="bi bi-sliders2" aria-hidden="true" />
                                            {t("home.filters")}
                                            {activeFilterCount > 0 && (
                                                <span className="hm-filter-count">
                                                    {formatNumber(activeFilterCount)}
                                                </span>
                                            )}
                                        </button>

                                        <label className="hm-sort-label" htmlFor="hm-sort">
                                            {t("home.sort")}
                                        </label>
                                        <select
                                            id="hm-sort"
                                            className="hm-select"
                                            value={urlState.sortBy ?? ""}
                                            onChange={(event) => handleSortChange(event.target.value)}
                                        >
                                            {SORT_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {t(option.labelKey)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {unresolvedCategory && (
                                    <InlineNotice
                                        title={t("home.categoryNotFound")}
                                        actionLabel={t("home.showAllBooks")}
                                        onAction={() => navigate({ pathname: "/books" })}
                                    >
                                        {t("home.categoryNotFoundBody", {
                                            slug: unresolvedCategory,
                                        })}
                                    </InlineNotice>
                                )}

                                <form
                                    id="hm-filter-panel"
                                    className={`hm-filters-panel${filtersOpen ? " is-open" : ""}`}
                                    onSubmit={handleFilterSubmit}
                                    noValidate
                                >
                                    <div className="hm-filter-form">
                                        <div className="hm-field">
                                            <label htmlFor="hm-filter-search">
                                                {t("home.search")}
                                            </label>
                                            <input
                                                id="hm-filter-search"
                                                className="hm-input"
                                                type="search"
                                                placeholder={t("home.filterSearchPlaceholder")}
                                                value={draft.search}
                                                onChange={(event) =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        search: event.target.value,
                                                    }))
                                                }
                                            />
                                        </div>

                                        <div className="hm-field">
                                            <label htmlFor="hm-filter-category">
                                                {t("home.category")}
                                            </label>
                                            <select
                                                id="hm-filter-category"
                                                className="hm-select"
                                                value={draft.categoryId ?? ""}
                                                disabled={!categoriesLoaded}
                                                onChange={(event) =>
                                                    setDraft((prev) => ({
                                                        ...prev,
                                                        categoryId:
                                                            event.target.value === ""
                                                                ? undefined
                                                                : Number(event.target.value),
                                                    }))
                                                }
                                            >
                                                <option value="">{t("home.allCategories")}</option>
                                                {categories.map((category) => (
                                                    <option
                                                        key={category.categoryId}
                                                        value={category.categoryId}
                                                    >
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="hm-field">
                                            <span className="hm-field-label">{t("home.price")}</span>
                                            <div className="hm-price-row">
                                                <input
                                                    className="hm-input"
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0"
                                                    step="1"
                                                    placeholder={t("home.min")}
                                                    aria-label={t("home.minPrice")}
                                                    aria-invalid={!!priceError}
                                                    aria-describedby={
                                                        priceError ? "hm-price-error" : undefined
                                                    }
                                                    value={draft.minPrice}
                                                    onChange={(event) => {
                                                        setPriceError("");
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            minPrice: event.target.value,
                                                        }));
                                                    }}
                                                />
                                                <span className="hm-price-sep" aria-hidden="true">
                                                    –
                                                </span>
                                                <input
                                                    className="hm-input"
                                                    type="number"
                                                    inputMode="decimal"
                                                    min="0"
                                                    step="1"
                                                    placeholder={t("home.max")}
                                                    aria-label={t("home.maxPrice")}
                                                    aria-invalid={!!priceError}
                                                    aria-describedby={
                                                        priceError ? "hm-price-error" : undefined
                                                    }
                                                    value={draft.maxPrice}
                                                    onChange={(event) => {
                                                        setPriceError("");
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            maxPrice: event.target.value,
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            {priceError && (
                                                <p
                                                    className="hm-field-error"
                                                    id="hm-price-error"
                                                    role="alert"
                                                >
                                                    {priceError}
                                                </p>
                                            )}
                                        </div>

                                        <div className="hm-field hm-filter-actions">
                                            <label className="hm-check">
                                                <input
                                                    type="checkbox"
                                                    checked={draft.inStockOnly}
                                                    onChange={(event) =>
                                                        setDraft((prev) => ({
                                                            ...prev,
                                                            inStockOnly: event.target.checked,
                                                        }))
                                                    }
                                                />
                                                {t("home.inStockOnly")}
                                            </label>
                                            <button type="submit" className="hm-btn hm-btn--primary">
                                                {t("home.applyFilters")}
                                            </button>
                                        </div>
                                    </div>
                                </form>

                                {activeFilterCount > 0 && (
                                    <div className="hm-chips">
                                        {urlState.search && (
                                            <span className="hm-chip">
                                                “{urlState.search}”
                                                <button
                                                    type="button"
                                                    className="hm-chip-remove"
                                                    aria-label={t("home.removeSearch")}
                                                    onClick={() => handleChipRemove("search")}
                                                >
                                                    <i className="bi bi-x" aria-hidden="true" />
                                                </button>
                                            </span>
                                        )}
                                        {matchedCategory && (
                                            <span className="hm-chip">
                                                {matchedCategory.name}
                                                <button
                                                    type="button"
                                                    className="hm-chip-remove"
                                                    aria-label={t("home.removeCategory", {
                                                        name: matchedCategory.name,
                                                    })}
                                                    onClick={() => handleChipRemove("category")}
                                                >
                                                    <i className="bi bi-x" aria-hidden="true" />
                                                </button>
                                            </span>
                                        )}
                                        {priceLabel && (
                                            <span className="hm-chip">
                                                {priceLabel}
                                                <button
                                                    type="button"
                                                    className="hm-chip-remove"
                                                    aria-label={t("home.removePrice")}
                                                    onClick={() => handleChipRemove("price")}
                                                >
                                                    <i className="bi bi-x" aria-hidden="true" />
                                                </button>
                                            </span>
                                        )}
                                        {urlState.inStockOnly && (
                                            <span className="hm-chip">
                                                {t("home.inStock")}
                                                <button
                                                    type="button"
                                                    className="hm-chip-remove"
                                                    aria-label={t("home.removeStock")}
                                                    onClick={() => handleChipRemove("stock")}
                                                >
                                                    <i className="bi bi-x" aria-hidden="true" />
                                                </button>
                                            </span>
                                        )}
                                        {urlState.sortBy && (
                                            <span className="hm-chip">
                                                {sortLabel}
                                                <button
                                                    type="button"
                                                    className="hm-chip-remove"
                                                    aria-label={t("home.removeSort")}
                                                    onClick={() => handleChipRemove("sort")}
                                                >
                                                    <i className="bi bi-x" aria-hidden="true" />
                                                </button>
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            className="hm-clear-link"
                                            onClick={handleClearFilters}
                                        >
                                            {t("home.clearAll")}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {catalogLoading || awaitingCategoryResolution ? (
                                <BookSkeletonGrid count={10} />
                            ) : catalogError ? (
                                <ErrorCard
                                    title={t("home.booksCouldntLoad")}
                                    message={catalogError}
                                    onRetry={() => setReloadToken((token) => token + 1)}
                                />
                            ) : catalogBooks.length === 0 ? (
                                <EmptyState
                                    title={t("home.noMatch")}
                                    message={t("home.noMatchBody")}
                                    actionLabel={t("home.clearFilters")}
                                    onAction={handleClearFilters}
                                />
                            ) : (
                                <>
                                    <BookGrid
                                        books={catalogBooks}
                                        onAddToCart={handleAddToCart}
                                        addingToCart={addingToCart}
                                        cartQuantities={cartQuantities}
                                    />

                                    {totalPages > 1 && (
                                        <nav className="hm-pagination" aria-label={t("home.catalogPages")}>
                                            <ul className="pagination pagination-sm">
                                                <li
                                                    className={`page-item${
                                                        currentPage === 1 ? " disabled" : ""
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="page-link"
                                                        onClick={() => handlePageChange(currentPage - 1)}
                                                        disabled={currentPage === 1}
                                                        aria-label={t("home.prevPage")}
                                                    >
                                                        <i
                                                            className="bi bi-chevron-left"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </li>

                                                {getPaginationPages(currentPage, totalPages).map(
                                                    (page, index) =>
                                                        page === "…" ? (
                                                            <li
                                                                key={`gap-${index}`}
                                                                className="page-item disabled"
                                                            >
                                                                <span className="page-link">…</span>
                                                            </li>
                                                        ) : (
                                                            <li
                                                                key={page}
                                                                className={`page-item${
                                                                    page === currentPage
                                                                        ? " active"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <button
                                                                    type="button"
                                                                    className="page-link"
                                                                    onClick={() => handlePageChange(page)}
                                                                    aria-current={
                                                                        page === currentPage
                                                                            ? "page"
                                                                            : undefined
                                                                    }
                                                                >
                                                                    {formatNumber(page)}
                                                                </button>
                                                            </li>
                                                        )
                                                )}

                                                <li
                                                    className={`page-item${
                                                        currentPage === totalPages ? " disabled" : ""
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="page-link"
                                                        onClick={() => handlePageChange(currentPage + 1)}
                                                        disabled={currentPage === totalPages}
                                                        aria-label={t("home.nextPage")}
                                                    >
                                                        <i
                                                            className="bi bi-chevron-right"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </li>
                                            </ul>
                                        </nav>
                                    )}

                                    <p className="hm-showing">
                                        {t("home.showing", {
                                            from: formatNumber(
                                                (currentPage - 1) * PAGE_SIZE + 1
                                            ),
                                            to: formatNumber(
                                                Math.min(currentPage * PAGE_SIZE, catalogTotal)
                                            ),
                                            total: formatNumber(catalogTotal),
                                        })}
                                    </p>
                                </>
                            )}
                        </section>
                    ) : (
                        <>
                            <section className="hm-section" aria-labelledby="hm-new-arrivals">
                                <SectionHeader
                                    id="hm-new-arrivals"
                                    title={t("home.newArrivals")}
                                    subtitle={t("home.newArrivalsSub")}
                                    icon="bi-stars"
                                    actionLabel={t("common.seeAll")}
                                    onAction={() => handleSeeAllBooks("newest")}
                                />
                                {landingLoading ? (
                                    <BookSkeletonGrid count={5} />
                                ) : newArrivals.length > 0 ? (
                                    <BookGrid
                                        books={newArrivals}
                                        onAddToCart={handleAddToCart}
                                        addingToCart={addingToCart}
                                        cartQuantities={cartQuantities}
                                    />
                                ) : (
                                    <div className="hm-empty hm-empty--compact">
                                        <p className="mb-0">{t("home.newArrivalsEmpty")}</p>
                                    </div>
                                )}
                            </section>

                            <section className="hm-section" aria-labelledby="hm-categories">
                                <SectionHeader
                                    id="hm-categories"
                                    title={t("home.browseByCategory")}
                                    subtitle={t("home.browseByCategorySub")}
                                    icon="bi-grid-3x3-gap"
                                />
                                {!categoriesLoaded ? (
                                    <CategorySkeletonGrid />
                                ) : categories.length === 0 ? (
                                    categoriesError ? (
                                        <EmptyState
                                            title={t("home.categoriesUnavailable")}
                                            message={t("home.categoriesUnavailableBody")}
                                            actionLabel={t("common.retry")}
                                            onAction={() => setMetaReload((token) => token + 1)}
                                        />
                                    ) : (
                                        <div className="hm-empty hm-empty--compact">
                                            <p className="mb-0">{t("home.noCategories")}</p>
                                        </div>
                                    )
                                ) : (
                                    <div className="hm-cat-grid">
                                        {categories.map((category) => (
                                            <CategoryTile
                                                key={category.categoryId}
                                                category={category}
                                                onSelect={handleCategoryClick}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="hm-section" aria-labelledby="hm-writers">
                                <SectionHeader
                                    id="hm-writers"
                                    title={t("home.popularWriters")}
                                    subtitle={t("home.popularWritersSub")}
                                    icon="bi-pencil-square"
                                    actionLabel={t("common.seeAll")}
                                    onAction={() => navigate("/authors")}
                                />
                                {authorsLoading ? (
                                    <CreatorSkeletonStrip />
                                ) : authors.length > 0 ? (
                                    <div className="cr-strip">
                                        {authors.map((author) => (
                                            <CreatorCard
                                                key={author.authorId}
                                                kind="author"
                                                id={author.authorId}
                                                name={author.name}
                                                imageUrl={author.imageUrl}
                                                bookCount={author.bookCount}
                                                variant="strip"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="hm-empty hm-empty--compact">
                                        <p className="mb-0">{t("home.writersEmpty")}</p>
                                    </div>
                                )}
                            </section>

                            <section className="hm-section" aria-labelledby="hm-publishers">
                                <SectionHeader
                                    id="hm-publishers"
                                    title={t("home.publishers")}
                                    subtitle={t("home.publishersSub")}
                                    icon="bi-building"
                                    actionLabel={t("common.seeAll")}
                                    onAction={() => navigate("/publishers")}
                                />
                                {publishersLoading ? (
                                    <CreatorSkeletonStrip />
                                ) : publishers.length > 0 ? (
                                    <div className="cr-strip">
                                        {publishers.map((publisher) => (
                                            <CreatorCard
                                                key={publisher.publisherId}
                                                kind="publisher"
                                                id={publisher.publisherId}
                                                name={publisher.name}
                                                imageUrl={publisher.imageUrl}
                                                bookCount={publisher.bookCount}
                                                variant="strip"
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="hm-empty hm-empty--compact">
                                        <p className="mb-0">{t("home.publishersEmpty")}</p>
                                    </div>
                                )}
                            </section>

                            <section className="hm-section" aria-labelledby="hm-all-books">
                                <SectionHeader
                                    id="hm-all-books"
                                    title={t("home.allBooks")}
                                    subtitle={
                                        landingTotal > 0
                                            ? t("home.titlesAvailable", {
                                                  count: formatNumber(landingTotal),
                                              })
                                            : undefined
                                    }
                                    icon="bi-journal-bookmark"
                                    actionLabel={t("common.viewAll")}
                                    onAction={() => handleSeeAllBooks()}
                                />
                                {landingLoading ? (
                                    <BookSkeletonGrid count={10} />
                                ) : landingError ? (
                                    <ErrorCard
                                        title={t("home.booksCouldntLoad")}
                                        message={landingError}
                                        onRetry={() => setReloadToken((token) => token + 1)}
                                    />
                                ) : landingBooks.length === 0 ? (
                                    <div className="hm-empty hm-empty--compact">
                                        <p className="mb-0">{t("home.noBooks")}</p>
                                    </div>
                                ) : (
                                    <>
                                        <BookGrid
                                            books={landingBooks}
                                            onAddToCart={handleAddToCart}
                                            addingToCart={addingToCart}
                                            cartQuantities={cartQuantities}
                                        />
                                        <div className="hm-section-cta">
                                            <button
                                                type="button"
                                                className="hm-btn hm-btn--outline"
                                                onClick={() => handleSeeAllBooks()}
                                            >
                                                {t("common.browseAllBooks")}
                                                <i className="bi bi-arrow-right" aria-hidden="true" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </section>
                        </>
                    )}
                </main>

                <Footer />
            </div>

            {cartMessage && (
                <div className="hm-toast hm-toast--ok" role="status">
                    <i className="bi bi-check-circle-fill" aria-hidden="true" />
                    <span>{cartMessage}</span>
                </div>
            )}
            {cartError && (
                <div className="hm-toast hm-toast--error" role="alert">
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                    <span>{cartError}</span>
                </div>
            )}
        </>
    );
}
