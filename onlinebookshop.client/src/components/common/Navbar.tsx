// =============================================
// Navbar.tsx — storefront header
// =============================================

import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthService from "../../services/auth.service";
import CartService from "../../services/cart.service";
import BookService from "../../services/book.service";
import NotificationBell from "../notifications/NotificationBell";
import BookSearchBox from "../search/BookSearchBox";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../../i18n/language-context";
import { bookPath, categoryPath } from "../../utils/slug";
import type { BookResponseDto, CategoryResponseDto } from "../../types/book.types";
import brandIcon from "../../assets/logo-mark.svg";
import "./navbar.css";

// ── SVG Icons ────────────────────────────────
const CartIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
);
const HeartIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
);
const UserIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);
const ChevronDownIcon = ({ open }: { open: boolean }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
const LogoutIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);
const OrderIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);
const ShopIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);
const GearIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
);
const PhoneIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15a16 16 0 006.29 6.29l1.42-1.42a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
);
const TruckIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
);

// ── Static nav items ─────────────────────────
const OFFERS_PATH = "/books?discounted=true";
const MAX_NAV_CATEGORIES = 14;

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();
    const searchPlaceholders = useMemo(
        () => [t("nav.searchPhrase1"), t("nav.searchPhrase2")],
        [t]
    );

    const [user, setUser] = useState(AuthService.getCurrentUser());
    const urlSearch = useMemo(
        () => new URLSearchParams(location.search).get("search") ?? "",
        [location.search]
    );
    const [searchQuery, setSearchQuery] = useState(urlSearch);
    const [syncedUrlSearch, setSyncedUrlSearch] = useState(urlSearch);
    if (urlSearch !== syncedUrlSearch) {
        setSyncedUrlSearch(urlSearch);
        setSearchQuery(urlSearch);
    }
    const [cartCount, setCartCount] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [catDropdownOpen, setCatDropdownOpen] = useState(false);
    const catDropdownRef = useRef<HTMLDivElement>(null);
    const [navCategories, setNavCategories] = useState<CategoryResponseDto[]>([]);

    useEffect(() => {
        let active = true;
        BookService.getCategories()
            .then((list) => {
                if (!active) return;
                const visible = list
                    .filter((cat) => cat.isActive !== false)
                    .sort((a, b) => a.displayOrder - b.displayOrder)
                    .slice(0, MAX_NAV_CATEGORIES);
                setNavCategories(visible);
            })
            .catch(() => { /* nav works without the dropdown list */ });
        return () => { active = false; };
    }, []);

    // ── Typewriter placeholder ──
    const [placeholderText, setPlaceholderText] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const deletePauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const current = searchPlaceholders[phraseIndex % searchPlaceholders.length];
        const position = Math.min(charIndex, current.length);
        const speed = isDeleting ? 35 : 75;

        const timer = setTimeout(() => {
            if (!isDeleting && position < current.length) {
                setPlaceholderText(current.slice(0, position + 1));
                setCharIndex(position + 1);
            } else if (!isDeleting && position === current.length) {
                deletePauseRef.current = setTimeout(() => setIsDeleting(true), 1600);
            } else if (isDeleting && position > 0) {
                setPlaceholderText(current.slice(0, position - 1));
                setCharIndex(position - 1);
            } else {
                setIsDeleting(false);
                setCharIndex(0);
                setPhraseIndex((p) => (p + 1) % searchPlaceholders.length);
            }
        }, speed);

        return () => {
            clearTimeout(timer);
            if (deletePauseRef.current) clearTimeout(deletePauseRef.current);
        };
    }, [charIndex, isDeleting, phraseIndex, searchPlaceholders]);

    useEffect(() => {
        const timer = setTimeout(() => { setMobileMenuOpen(false); setDropdownOpen(false); setCatDropdownOpen(false); }, 0);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    useEffect(() => {
        const load = async () => {
            if (!AuthService.isAuthenticated()) { setCartCount(0); return; }
            try {
                const cart = await CartService.getMyCart();
                setCartCount(cart.items.length);
            } catch {
                setCartCount(0);
            }
        };
        void load();
    }, [location.pathname]);

    useEffect(() => {
        const handler = () => {
            if (!AuthService.isAuthenticated()) return;
            CartService.getMyCart()
                .then((cart) => setCartCount(cart.items.length))
                .catch(() => setCartCount(0));
        };
        window.addEventListener("cartUpdated", handler);
        return () => window.removeEventListener("cartUpdated", handler);
    }, []);

    useEffect(() => {
        const handler = () => { setUser(AuthService.getCurrentUser()); setCartCount(0); };
        window.addEventListener("authChanged", handler);
        return () => window.removeEventListener("authChanged", handler);
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
                setDropdownOpen(false);
            if (catDropdownRef.current && !catDropdownRef.current.contains(e.target as Node))
                setCatDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Drawer behaviour ──
    const closeMobileMenu = () => setMobileMenuOpen(false);

    useEffect(() => {
        if (!mobileMenuOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = previous; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        if (!mobileMenuOpen && !dropdownOpen && !catDropdownOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Escape") return;
            setMobileMenuOpen(false);
            setDropdownOpen(false);
            setCatDropdownOpen(false);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [mobileMenuOpen, dropdownOpen, catDropdownOpen]);

    useEffect(() => {
        const media = window.matchMedia("(min-width: 901px)");
        const onChange = () => {
            if (media.matches) setMobileMenuOpen(false);
        };
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    const isNavActive = (to: string) => {
        const [path, query] = to.split("?");
        if (query) {
            return (
                location.pathname === path &&
                new URLSearchParams(location.search).get("sort") ===
                    new URLSearchParams(query).get("sort")
            );
        }
        if (path === "/books") {
            return (
                location.pathname === "/books" &&
                !new URLSearchParams(location.search).has("sort")
            );
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    const isOffersActive = () =>
        location.pathname === "/books" &&
        new URLSearchParams(location.search).get("discounted") === "true";

    const isCategoryAreaActive = () => location.pathname.startsWith("/category");

    const handleLogout = () => {
        setDropdownOpen(false);
        AuthService.logout();
        navigate("/auth");
    };

    const handleSearch = (term: string) => {
        const trimmed = term.trim();
        setMobileMenuOpen(false);
        if (!trimmed) {
            if (location.pathname === "/" && location.search) {
                navigate("/", { replace: true });
            }
            return;
        }
        navigate(`/books?search=${encodeURIComponent(trimmed)}`, { replace: true });
    };

    const handleQueryChange = (next: string) => {
        setSearchQuery(next);
        if (next.trim()) return;
        if (location.pathname === "/") {
            if (location.search) navigate("/", { replace: true });
            return;
        }
        const params = new URLSearchParams(location.search);
        if (!params.has("search")) return;
        params.delete("search");
        const search = params.toString();
        navigate(
            { pathname: location.pathname, search: search ? `?${search}` : "" },
            { replace: true }
        );
    };

    const handleSelectSuggestion = (book: BookResponseDto) => {
        setMobileMenuOpen(false);
        navigate(bookPath(book));
    };

    const roleBadge = (role: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            Admin: { bg: "#fee2e2", color: "#dc2626" },
            Vendor: { bg: "#fef3c7", color: "#b45309" },
            Customer: { bg: "#dbeafe", color: "#1d4ed8" },
        };
        return map[role] ?? { bg: "#f1f5f9", color: "#475569" };
    };

    return (
        <>
            {/* ── Top bar (scrolls away) ── */}
            <div className="nb-topbar">
                <div className="nb-topbar-inner">
                    <div className="nb-topbar-left">
                        <span className="nb-topbar-item"><TruckIcon /> {t("topbar.delivery")}</span>
                        <div className="nb-topbar-divider" />
                        <span className="nb-topbar-item"><PhoneIcon /> {t("topbar.helpline")}</span>
                    </div>
                    <div className="nb-topbar-right">
                        <Link to="/vendor/register" className="nb-topbar-item">{t("topbar.becomeVendor")}</Link>
                        <div className="nb-topbar-divider" />
                        <Link to="/orders" className="nb-topbar-item">{t("topbar.trackOrder")}</Link>
                    </div>
                </div>
            </div>

            {/* ── Sticky header ── */}
            <div className="nb-root">
                <div className="nb-main">
                    <div className="nb-main-inner">

                        {/* Brand */}
                        <Link className="nb-brand" to="/">
                            <img src={brandIcon} alt="Sabbir Book Mall" className="nb-brand-icon" />
                            <div className="nb-brand-text">
                                <span className="nb-brand-name">Sabbir Book<span>Mall</span></span>
                                <span className="nb-brand-tagline">{t("brand.tagline")}</span>
                            </div>
                        </Link>

                        {/* ── Desktop Search ── */}
                        <BookSearchBox
                            idPrefix="nb-desktop-search"
                            variant="desktop"
                            value={searchQuery}
                            placeholder={placeholderText || t("nav.searchPlaceholderDesktop")}
                            onChange={handleQueryChange}
                            onSearch={handleSearch}
                            onSelectBook={handleSelectSuggestion}
                        />

                        {/* Actions */}
                        <div className="nb-actions">
                            <LanguageToggle variant="bar" />
                            <div className="d-flex align-items-center gap-3">
                                <NotificationBell />
                            </div>
                            <Link className="nb-icon-btn nb-wishlist-icon" to="/wishlist" title={t("nav.wishlist")}>
                                <HeartIcon />
                                <span className="nb-icon-label">{t("nav.wishlist")}</span>
                            </Link>

                            <Link
                                className="nb-icon-btn"
                                to={AuthService.isAuthenticated() ? "/cart" : "/auth"}
                                title={t("nav.cart")}
                            >
                                <CartIcon />
                                {cartCount > 0 && (
                                    <span className="nb-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
                                )}
                                <span className="nb-icon-label">{t("nav.cart")}</span>
                            </Link>

                            {user ? (
                                <div style={{ position: "relative" }} ref={dropdownRef}>
                                    <button
                                        type="button"
                                        className="nb-user-btn"
                                        onClick={() => setDropdownOpen((p) => !p)}
                                        aria-haspopup="menu"
                                        aria-expanded={dropdownOpen}
                                    >
                                        <span className="nb-user-avatar">
                                            {user.name.charAt(0).toUpperCase() || "U"}
                                        </span>
                                        <span className="nb-user-name">{user.name.split(" ")[0]}</span>
                                        <ChevronDownIcon open={dropdownOpen} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="nb-dropdown" role="menu">
                                            <div className="nb-dropdown-header">
                                                <div className="nb-dropdown-user-name">{user.name}</div>
                                                <div className="nb-dropdown-email">{user.email}</div>
                                                <span className="nb-dropdown-role" style={{ background: roleBadge(user.role).bg, color: roleBadge(user.role).color }}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <div className="nb-dropdown-body">
                                                <Link className="nb-dropdown-item" role="menuitem" to="/profile" onClick={() => setDropdownOpen(false)}>
                                                    <UserIcon /> {t("nav.myProfile")}
                                                </Link>
                                                {user.role === "Customer" && (<>
                                                    <Link className="nb-dropdown-item" role="menuitem" to="/orders" onClick={() => setDropdownOpen(false)}><OrderIcon /> {t("nav.myOrders")}</Link>
                                                    <Link className="nb-dropdown-item" role="menuitem" to="/vendor/register" onClick={() => setDropdownOpen(false)}><ShopIcon /> {t("nav.becomeVendor")}</Link>
                                                </>)}
                                                {user.role === "Vendor" && (<>
                                                    <Link className="nb-dropdown-item" role="menuitem" to="/vendor/dashboard" onClick={() => setDropdownOpen(false)}><ShopIcon /> {t("nav.vendorDashboard")}</Link>
                                                </>)}
                                                {user.role === "Admin" && (<>
                                                    <Link className="nb-dropdown-item" role="menuitem" to="/admin/dashboard" onClick={() => setDropdownOpen(false)}><GearIcon /> {t("nav.adminPanel")}</Link>
                                                </>)}
                                                <div className="nb-dropdown-divider" />
                                                <button type="button" className="nb-dropdown-item danger" role="menuitem" onClick={handleLogout}><LogoutIcon /> {t("nav.logout")}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link className="nb-signin-btn" to="/auth" aria-label={t("nav.signIn")}><UserIcon /><span className="nb-signin-text">{t("nav.signIn")}</span></Link>
                            )}

                            <button
                                type="button"
                                className={`nb-hamburger${mobileMenuOpen ? " open" : ""}`}
                                onClick={() => setMobileMenuOpen((p) => !p)}
                                aria-label={t("nav.toggleMenu")}
                                aria-expanded={mobileMenuOpen}
                                aria-controls="nb-mobile-menu"
                            >
                                <span className="nb-hamburger-line" />
                                <span className="nb-hamburger-line" />
                                <span className="nb-hamburger-line" />
                            </button>
                        </div>
                    </div>

                    {/* ── Mobile Search ── */}
                    <BookSearchBox
                        idPrefix="nb-mobile-search"
                        variant="mobile"
                        value={searchQuery}
                        placeholder={placeholderText || t("nav.searchPlaceholderMobile")}
                        onChange={handleQueryChange}
                        onSearch={handleSearch}
                        onSelectBook={handleSelectSuggestion}
                    />

                    {/* ── Mobile drawer ── */}
                    <div
                        id="nb-mobile-menu"
                        className={`nb-mobile-menu${mobileMenuOpen ? " open" : ""}`}
                        aria-label={t("nav.navigation")}
                    >
                        {user && (
                            <div className="nb-mobile-user-block">
                                <div className="nb-mobile-user-avatar">{user.name.charAt(0).toUpperCase() || "U"}</div>
                                <div>
                                    <div className="nb-mobile-user-name">{user.name}</div>
                                    <div className="nb-mobile-user-email">{user.email}</div>
                                    <span className="nb-mobile-user-role" style={{ background: roleBadge(user.role).bg, color: roleBadge(user.role).color }}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="nb-mobile-section-title">{t("nav.navigation")}</div>

                        <div className="nb-mobile-lang">
                            <div className="nb-mobile-lang-label">{t("nav.language")}</div>
                            <LanguageToggle variant="drawer" />
                        </div>

                        <Link className="nb-mobile-link" to={AuthService.isAuthenticated() ? "/cart" : "/auth"} onClick={closeMobileMenu}>
                            <CartIcon /> {t("nav.cart")} {cartCount > 0 && `(${cartCount})`}
                        </Link>

                        {user ? (
                            <>
                                <Link className="nb-mobile-link" to="/profile" onClick={closeMobileMenu}>
                                    <UserIcon /> {t("nav.myProfile")}
                                </Link>

                                {user.role === "Customer" && (
                                    <>
                                        <Link className="nb-mobile-link" to="/orders" onClick={closeMobileMenu}>
                                            <OrderIcon /> {t("nav.myOrders")}
                                        </Link>
                                        <Link className="nb-mobile-link" to="/vendor/register" onClick={closeMobileMenu}>
                                            <ShopIcon /> {t("nav.becomeVendor")}
                                        </Link>
                                    </>
                                )}

                                {user.role === "Vendor" && (<>
                                    <Link className="nb-mobile-link" to="/vendor/dashboard" onClick={closeMobileMenu}>
                                        <ShopIcon /> {t("nav.vendorDashboard")}
                                    </Link>
                                    <Link className="nb-mobile-link" to="/vendor/earnings" onClick={closeMobileMenu}>
                                        <OrderIcon /> {t("nav.myEarnings")}
                                    </Link>
                                </>)}

                                {user.role === "Admin" && (<>
                                    <Link className="nb-mobile-link" to="/admin/dashboard" onClick={closeMobileMenu}>
                                        <GearIcon /> {t("nav.adminPanel")}
                                    </Link>
                                    <Link className="nb-mobile-link" to="/admin/vendor-payouts" onClick={closeMobileMenu}>
                                        <OrderIcon /> {t("nav.vendorPayouts")}
                                    </Link>
                                </>)}

                                <div className="nb-mobile-divider" />

                                <button type="button" className="nb-mobile-link danger" onClick={handleLogout}>
                                    <LogoutIcon /> {t("nav.logout")}
                                </button>
                            </>
                        ) : (
                            <Link className="nb-mobile-link" to="/auth" onClick={closeMobileMenu}>
                                <UserIcon /> {t("nav.signInRegister")}
                            </Link>
                        )}

                        <div className="nb-mobile-section-title">{t("nav.siteMenu")}</div>

                        <Link className="nb-mobile-link" to="/" onClick={closeMobileMenu}>
                            <ShopIcon /> {t("nav.home")}
                        </Link>
                        <Link className="nb-mobile-link" to="/authors" onClick={closeMobileMenu}>
                            <UserIcon /> {t("nav.writers")}
                        </Link>
                        <Link className="nb-mobile-link" to="/publishers" onClick={closeMobileMenu}>
                            <GearIcon /> {t("nav.publishers")}
                        </Link>
                        <Link className={`nb-mobile-link${isOffersActive() ? " text-warning" : ""}`} to={OFFERS_PATH} onClick={closeMobileMenu}>
                            <CartIcon /> {t("nav.offers")}
                        </Link>
                        <Link className="nb-mobile-link" to="/category/stationery" onClick={closeMobileMenu}>
                            <OrderIcon /> {t("nav.stationery")}
                        </Link>
                        <Link className="nb-mobile-link" to="/membership" onClick={closeMobileMenu}>
                            <HeartIcon /> {t("nav.membership")}
                        </Link>

                        <div className="nb-mobile-cats">
                            <div className="nb-mobile-cats-title">{t("nav.browseCategories")}</div>
                            <div className="nb-mobile-cats-grid">
                                {navCategories.map((cat) => (
                                    <Link
                                        key={cat.categoryId}
                                        className="nb-mobile-cat-chip"
                                        to={categoryPath(cat.name)}
                                        onClick={closeMobileMenu}
                                    >
                                        {cat.name}
                                    </Link>
                                ))}
                                <Link className="nb-mobile-cat-chip" to="/books" onClick={closeMobileMenu}>
                                    {t("nav.allBooks")}
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop category nav ── */}
                    <div className="nb-cat">
                        <div className="nb-cat-inner">
                            <Link
                                className={`nb-cat-link${location.pathname === "/" ? " active" : ""}`}
                                to="/"
                            >
                                {t("nav.home")}
                            </Link>

                            <div className="nb-cat-item" ref={catDropdownRef}>
                                <button
                                    type="button"
                                    className={`nb-cat-link${isCategoryAreaActive() ? " active" : ""}`}
                                    onClick={() => setCatDropdownOpen((p) => !p)}
                                    aria-expanded={catDropdownOpen}
                                    aria-haspopup="menu"
                                >
                                    {t("nav.categories")}
                                    <span className="nb-cat-caret"><ChevronDownIcon open={catDropdownOpen} /></span>
                                </button>

                                {catDropdownOpen && (
                                    <div className="nb-cat-menu" role="menu">
                                        {navCategories.map((cat) => (
                                            <Link
                                                key={cat.categoryId}
                                                className="nb-cat-menu-link"
                                                to={categoryPath(cat.name)}
                                                onClick={() => setCatDropdownOpen(false)}
                                            >
                                                <i className="bi bi-tag"></i>
                                                {cat.name}
                                            </Link>
                                        ))}
                                        <div className="nb-cat-menu-divider" />
                                        <Link
                                            className="nb-cat-menu-link nb-cat-menu-all"
                                            to="/books"
                                            onClick={() => setCatDropdownOpen(false)}
                                        >
                                            <i className="bi bi-grid"></i>
                                            {t("nav.allBooks")}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <Link
                                className={`nb-cat-link${isNavActive("/authors") ? " active" : ""}`}
                                to="/authors"
                            >
                                {t("nav.writers")}
                            </Link>
                            <Link
                                className={`nb-cat-link${isNavActive("/publishers") ? " active" : ""}`}
                                to="/publishers"
                            >
                                {t("nav.publishers")}
                            </Link>
                            <Link
                                className={`nb-cat-link nb-cat-highlight${isOffersActive() ? " active" : ""}`}
                                to={OFFERS_PATH}
                            >
                                {t("nav.offers")}
                            </Link>
                            <Link
                                className={`nb-cat-link${isNavActive("/category/stationery") ? " active" : ""}`}
                                to="/category/stationery"
                            >
                                {t("nav.stationery")}
                            </Link>
                            <Link
                                className={`nb-cat-link${isNavActive("/membership") ? " active" : ""}`}
                                to="/membership"
                            >
                                {t("nav.membership")}
                            </Link>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="nb-scrim" onClick={closeMobileMenu} aria-hidden="true" />
                )}
            </div>
        </>
    );
}
