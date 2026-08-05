// =============================================
// Navbar.tsx —
// =============================================

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthService from "../../services/auth.service";
import CartService from "../../services/cart.service";
import NotificationBell from "../notifications/NotificationBell";

// ── SVG Icons ────────────────────────────────
const BookIcon = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
);
const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
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
const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ── Category nav items ──────────────────────
const CATEGORIES = [
    { label: "Books", to: "/?category=books" },
    { label: "Academic", to: "/?category=academic" },
    { label: "Children", to: "/?category=children" },
    { label: "Islamic", to: "/?category=islamic" },
    { label: "Fiction", to: "/?category=fiction" },
    { label: "Non-Fiction", to: "/?category=nonfiction" },
    { label: "Stationery", to: "/?category=stationery" },
    { label: "New Arrivals", to: "/?sort=new" },
];

// ── Typewriter placeholder phrases ──────────────────────
const SEARCH_PLACEHOLDERS = [
    "Search by book name (Chintar poriborton,Nobir Bani...)",
    "Search by author name (Sabbir,Ariful Islam...)",
];

// ── Custom debounce hook ──────────────────────
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [user, setUser] = useState(AuthService.getCurrentUser());
    const [searchQuery, setSearchQuery] = useState("");
    const [cartCount, setCartCount] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const debouncedSearch = useDebounce(searchQuery, 300);

    // ── Typewriter placeholder ──
    const [placeholderText, setPlaceholderText] = useState("");
    const [phraseIndex, setPhraseIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const deletePauseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const current = SEARCH_PLACEHOLDERS[phraseIndex];
        const speed = isDeleting ? 35 : 75;

        const timer = setTimeout(() => {
            if (!isDeleting && charIndex < current.length) {
                setPlaceholderText(current.slice(0, charIndex + 1));
                setCharIndex((c) => c + 1);
            } else if (!isDeleting && charIndex === current.length) {
                deletePauseRef.current = setTimeout(() => setIsDeleting(true), 1600);
            } else if (isDeleting && charIndex > 0) {
                setPlaceholderText(current.slice(0, charIndex - 1));
                setCharIndex((c) => c - 1);
            } else {
                setIsDeleting(false);
                setPhraseIndex((p) => (p + 1) % SEARCH_PLACEHOLDERS.length);
            }
        }, speed);

        return () => {
            clearTimeout(timer);
            if (deletePauseRef.current) clearTimeout(deletePauseRef.current);
        };
    }, [charIndex, isDeleting, phraseIndex]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const urlSearch = params.get("search") ?? "";
        setSearchQuery(urlSearch);
    }, [location.search]);

    useEffect(() => {
        const trimmed = debouncedSearch.trim();
        if (trimmed) {
            navigate(`/?search=${encodeURIComponent(trimmed)}`, { replace: true });
        } else {
            if (location.pathname === "/") {
                navigate("/", { replace: true });
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    useEffect(() => {
        const t = setTimeout(() => { setMobileMenuOpen(false); setDropdownOpen(false); }, 0);
        return () => clearTimeout(t);
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
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleLogout = () => {
        setDropdownOpen(false);
        AuthService.logout();
        navigate("/auth");
    };

    const handleClearSearch = useCallback(() => {
        setSearchQuery("");
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchQuery.trim();
        if (trimmed) {
            navigate(`/?search=${encodeURIComponent(trimmed)}`, { replace: true });
        }
    };

    const roleBadge = (role: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            Admin: { bg: "#fee2e2", color: "#dc2626" },
            Vendor: { bg: "#fef3c7", color: "#b45309" },
            Customer: { bg: "#dbeafe", color: "#1d4ed8" },
        };
        return map[role] ?? { bg: "#f1f5f9", color: "#475569" };
    };

    const showClearBtn = searchQuery.length > 0;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Sora:wght@400;500;600;700;800&display=swap');

                :root {
                    --brand:       #e8401c;
                    --brand-dark:  #c2340f;
                    --brand-light: #fff4f1;
                    --navy:        #1b2a4a;
                    --text:        #1e293b;
                    --muted:       #64748b;
                    --border:      #e8edf3;
                    --surface:     #ffffff;
                    --topbar-bg:   #1b2a4a;
                }

                .nb-root * { box-sizing: border-box; margin: 0; padding: 0; }
                .nb-root { font-family: 'Sora', 'Hind Siliguri', sans-serif; }

                /* ── Top bar ── */
                .nb-topbar {
                    background: var(--topbar-bg);
                    color: rgba(255,255,255,0.7);
                    font-size: 11.5px;
                    font-weight: 500;
                    letter-spacing: 0.02em;
                    padding: 5px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                .nb-topbar-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }
                .nb-topbar-left { display: flex; align-items: center; gap: 16px; }
                .nb-topbar-right { display: flex; align-items: center; gap: 16px; }
                .nb-topbar-item {
                    display: flex; align-items: center; gap: 5px;
                    color: rgba(255,255,255,0.65);
                    text-decoration: none;
                    transition: color 0.15s;
                }
                .nb-topbar-item:hover { color: #fff; }
                .nb-topbar-divider { width: 1px; height: 12px; background: rgba(255,255,255,0.15); }

                /* ── Main bar ── */
                .nb-main {
                    background: #fff;
                    border-bottom: 1px solid var(--border);
                    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                    position: sticky;
                    top: 0;
                    z-index: 1000;
                }
                .nb-main-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 20px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    height: 68px;
                }

                /* ── Brand ── */
                .nb-brand {
                    display: flex; align-items: center; gap: 10px;
                    text-decoration: none; flex-shrink: 0; user-select: none;
                }
                .nb-brand-icon {
                    width: 40px; height: 40px; background: var(--brand);
                    border-radius: 10px; display: flex; align-items: center; justify-content: center;
                    color: #fff; box-shadow: 0 4px 12px rgba(232,64,28,0.35); flex-shrink: 0;
                }
                .nb-brand-text { display: flex; flex-direction: column; line-height: 1; }
                .nb-brand-name { font-size: 18px; font-weight: 800; color: var(--navy); letter-spacing: -0.03em; }
                .nb-brand-name span { color: var(--brand); }
                .nb-brand-tagline {
                    font-size: 9.5px; font-weight: 500; color: var(--muted);
                    letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px;
                }

                /* ── Search ── */
                .nb-search { flex: 1; max-width: 560px; }
                .nb-search-form { display: flex; width: 100%; position: relative; }
                .nb-search-input-wrap { position: relative; flex: 1; display: flex; }
                .nb-search-input {
                    flex: 1; border: 2px solid var(--border); border-right: none;
                    border-radius: 10px 0 0 10px; padding: 0 40px 0 16px; height: 44px;
                    font-size: 13.5px; font-family: inherit; color: var(--text); outline: none;
                    background: #f8fafc; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
                    width: 100%;
                    /* Suppress ALL browser-native clear buttons */
                    -webkit-appearance: none;
                    appearance: none;
                }
                .nb-search-input::placeholder { color: #a0aec0; }
                .nb-search-input:focus {
                    border-color: var(--brand); background: #fff;
                    box-shadow: 0 0 0 3px rgba(232,64,28,0.1);
                }
                .nb-search-input.has-value { border-color: var(--brand); background: #fff; }
                /* Hide browser-native clear button on ALL browsers */
                .nb-search-input::-webkit-search-cancel-button,
                .nb-search-input::-webkit-search-decoration,
                .nb-search-input::-ms-clear,
                .nb-search-input::-ms-reveal {
                    display: none;
                    -webkit-appearance: none;
                    appearance: none;
                }

                /* Custom clear (×) button */
                .nb-search-clear {
                    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                    background: #e2e8f0; border: none; border-radius: 50%;
                    width: 20px; height: 20px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: var(--muted); padding: 0;
                    transition: background 0.15s, color 0.15s; flex-shrink: 0;
                }
                .nb-search-clear:hover { background: var(--brand); color: #fff; }

                .nb-search-btn {
                    background: var(--brand); border: 2px solid var(--brand); color: #fff;
                    border-radius: 0 10px 10px 0; padding: 0 18px; height: 44px; cursor: pointer;
                    display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600;
                    font-family: inherit; transition: background 0.2s, border-color 0.2s;
                    white-space: nowrap; flex-shrink: 0;
                }
                .nb-search-btn:hover { background: var(--brand-dark); border-color: var(--brand-dark); }

                .nb-typing-dot {
                    width: 6px; height: 6px; border-radius: 50%;
                    background: rgba(255,255,255,0.7);
                    animation: nbPulse 0.8s ease-in-out infinite alternate;
                }
                @keyframes nbPulse {
                    from { opacity: 0.4; transform: scale(0.8); }
                    to   { opacity: 1;   transform: scale(1.2); }
                }

                /* ── Action icons ── */
                .nb-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; }
                .nb-icon-btn {
                    position: relative; display: flex; flex-direction: column;
                    align-items: center; justify-content: center; gap: 2px;
                    width: 52px; height: 52px; border-radius: 10px;
                    color: var(--navy); text-decoration: none;
                    transition: background 0.15s, color 0.15s; cursor: pointer;
                    background: transparent; border: none; font-family: inherit;
                }
                .nb-icon-btn:hover { background: #f1f5f9; color: var(--brand); }
                .nb-icon-label {
                    font-size: 9px; font-weight: 600; letter-spacing: 0.04em;
                    color: var(--muted); text-transform: uppercase;
                }
                .nb-icon-btn:hover .nb-icon-label { color: var(--brand); }
                .nb-cart-badge {
                    position: absolute; top: 6px; right: 6px;
                    background: var(--brand); color: #fff; font-size: 9px; font-weight: 700;
                    min-width: 17px; height: 17px; border-radius: 10px;
                    display: flex; align-items: center; justify-content: center;
                    padding: 0 4px; border: 2px solid #fff; line-height: 1;
                }

                /* ── Sign In button ── */
                .nb-signin-btn {
                    display: flex; align-items: center; gap: 7px;
                    background: var(--brand); color: #fff !important; border-radius: 10px;
                    padding: 0 16px; height: 40px; font-size: 13px; font-weight: 700;
                    text-decoration: none; transition: background 0.2s, transform 0.15s;
                    white-space: nowrap; flex-shrink: 0; border: none; cursor: pointer;
                    font-family: inherit; box-shadow: 0 4px 12px rgba(232,64,28,0.3);
                }
                .nb-signin-btn:hover { background: var(--brand-dark); transform: translateY(-1px); }

                /* ── User dropdown trigger ── */
                .nb-user-btn {
                    display: flex; align-items: center; gap: 8px;
                    background: #f8fafc; border: 1.5px solid var(--border); border-radius: 10px;
                    padding: 0 12px 0 8px; height: 40px; font-size: 13px; font-weight: 600;
                    color: var(--navy); cursor: pointer; font-family: inherit;
                    transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
                }
                .nb-user-btn:hover { border-color: var(--brand); background: var(--brand-light); }
                .nb-user-avatar {
                    width: 28px; height: 28px; border-radius: 8px;
                    background: linear-gradient(135deg, var(--brand) 0%, #ff6b45 100%);
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; font-size: 12px; font-weight: 800; flex-shrink: 0;
                }
                .nb-user-name { max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

                /* ── Dropdown menu ── */
                .nb-dropdown {
                    position: absolute; top: calc(100% + 8px); right: 0;
                    background: #fff; border: 1px solid var(--border); border-radius: 14px;
                    min-width: 230px; box-shadow: 0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
                    z-index: 9999; overflow: hidden; animation: nbDropIn 0.18s ease;
                }
                @keyframes nbDropIn {
                    from { opacity: 0; transform: translateY(-8px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .nb-dropdown-header {
                    padding: 14px 16px 12px;
                    background: linear-gradient(135deg, #fff4f1 0%, #fff 100%);
                    border-bottom: 1px solid var(--border);
                }
                .nb-dropdown-user-name { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
                .nb-dropdown-email { font-size: 11.5px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 190px; }
                .nb-dropdown-role {
                    display: inline-block; padding: 2px 8px; border-radius: 20px;
                    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 6px;
                }
                .nb-dropdown-body { padding: 6px 0; }
                .nb-dropdown-item {
                    display: flex; align-items: center; gap: 10px; padding: 10px 16px;
                    font-size: 13.5px; font-weight: 500; color: var(--text); text-decoration: none;
                    cursor: pointer; background: transparent; border: none; width: 100%;
                    font-family: inherit; transition: background 0.15s, color 0.15s;
                }
                .nb-dropdown-item:hover { background: #f8fafc; color: var(--brand); }
                .nb-dropdown-item svg { color: var(--muted); flex-shrink: 0; }
                .nb-dropdown-item:hover svg { color: var(--brand); }
                .nb-dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }
                .nb-dropdown-item.danger { color: #dc2626; }
                .nb-dropdown-item.danger:hover { background: #fef2f2; }
                .nb-dropdown-item.danger svg { color: #dc2626; }

                /* ── Category nav ── */
                .nb-cat { background: var(--navy); border-top: none; }
                .nb-cat-inner {
                    max-width: 1200px; margin: 0 auto; padding: 0 20px;
                    display: flex; align-items: center; gap: 2px;
                    overflow-x: auto; scrollbar-width: none;
                }
                .nb-cat-inner::-webkit-scrollbar { display: none; }
                .nb-cat-link {
                    display: inline-flex; align-items: center; padding: 0 14px; height: 38px;
                    font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.75);
                    text-decoration: none; white-space: nowrap; border-radius: 0;
                    transition: color 0.15s, background 0.15s; letter-spacing: 0.01em; position: relative;
                }
                .nb-cat-link::after {
                    content: ''; position: absolute; bottom: 0; left: 14px; right: 14px;
                    height: 2px; background: var(--brand); transform: scaleX(0);
                    transition: transform 0.2s ease; border-radius: 2px 2px 0 0;
                }
                .nb-cat-link:hover { color: #fff; }
                .nb-cat-link:hover::after { transform: scaleX(1); }
                .nb-cat-link.active { color: #fff; }
                .nb-cat-link.active::after { transform: scaleX(1); }
                .nb-cat-highlight { color: #fbbf24 !important; font-weight: 700; }
                .nb-cat-highlight:hover { color: #fde68a !important; }

                /* ── Mobile search row ── */
                .nb-mobile-search {
                    display: none; padding: 10px 16px; background: #fff; border-top: 1px solid var(--border);
                }
                .nb-mobile-search-form { display: flex; width: 100%; position: relative; }
                .nb-mobile-search-input-wrap { position: relative; flex: 1; display: flex; }
                .nb-mobile-search-input {
                    flex: 1; border: 2px solid var(--border); border-right: none;
                    border-radius: 8px 0 0 8px; padding: 0 36px 0 14px; height: 40px;
                    font-size: 13px; font-family: inherit; color: var(--text); outline: none;
                    background: #f8fafc; transition: border-color 0.2s; width: 100%;
                    /* Suppress browser-native clear buttons */
                    -webkit-appearance: none;
                    appearance: none;
                }
                .nb-mobile-search-input:focus { border-color: var(--brand); background: #fff; }
                .nb-mobile-search-input.has-value { border-color: var(--brand); background: #fff; }
                /* Hide browser-native clear button */
                .nb-mobile-search-input::-webkit-search-cancel-button,
                .nb-mobile-search-input::-webkit-search-decoration,
                .nb-mobile-search-input::-ms-clear,
                .nb-mobile-search-input::-ms-reveal {
                    display: none;
                    -webkit-appearance: none;
                    appearance: none;
                }
                .nb-mobile-search-clear {
                    position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
                    background: #e2e8f0; border: none; border-radius: 50%;
                    width: 18px; height: 18px; display: flex; align-items: center; justify-content: center;
                    cursor: pointer; color: var(--muted); padding: 0; transition: background 0.15s, color 0.15s;
                }
                .nb-mobile-search-clear:hover { background: var(--brand); color: #fff; }
                .nb-mobile-search-btn {
                    background: var(--brand); border: 2px solid var(--brand); color: #fff;
                    border-radius: 0 8px 8px 0; padding: 0 14px; height: 40px; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    font-family: inherit; transition: background 0.2s; flex-shrink: 0;
                }
                .nb-mobile-search-btn:hover { background: var(--brand-dark); border-color: var(--brand-dark); }

                /* ── Hamburger ── */
                .nb-hamburger {
                    display: none; flex-direction: column; align-items: center; justify-content: center;
                    gap: 5px; width: 40px; height: 40px; border: 1.5px solid var(--border);
                    border-radius: 9px; background: transparent; cursor: pointer;
                    flex-shrink: 0; padding: 0; transition: background 0.15s;
                }
                .nb-hamburger:hover { background: #f1f5f9; }
                .nb-hamburger-line {
                    width: 18px; height: 2px; background: var(--navy); border-radius: 2px;
                    transition: all 0.25s ease; transform-origin: center;
                }
                .nb-hamburger.open .nb-hamburger-line:nth-child(1) { transform: translateY(7px) rotate(45deg); }
                .nb-hamburger.open .nb-hamburger-line:nth-child(2) { opacity: 0; transform: scaleX(0); }
                .nb-hamburger.open .nb-hamburger-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

                /* ── Mobile drawer ── */
                .nb-mobile-menu {
                    display: none; flex-direction: column; background: #fff;
                    border-top: 1px solid var(--border); animation: nbSlideDown 0.22s ease;
                    max-height: calc(100vh - 120px); overflow-y: auto;
                }
                @keyframes nbSlideDown {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .nb-mobile-menu.open { display: flex; }
                .nb-mobile-user-block {
                    display: flex; align-items: center; gap: 12px; padding: 16px 20px;
                    background: linear-gradient(135deg, #fff4f1 0%, #fff 100%);
                    border-bottom: 1px solid var(--border);
                }
                .nb-mobile-user-avatar {
                    width: 44px; height: 44px; border-radius: 12px;
                    background: linear-gradient(135deg, var(--brand) 0%, #ff6b45 100%);
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; font-size: 19px; font-weight: 800; flex-shrink: 0;
                }
                .nb-mobile-user-name { font-size: 14px; font-weight: 700; color: var(--navy); }
                .nb-mobile-user-email { font-size: 11.5px; color: var(--muted); margin-top: 2px; word-break: break-all; }
                .nb-mobile-user-role {
                    display: inline-block; margin-top: 5px; padding: 2px 9px; border-radius: 20px;
                    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
                }
                .nb-mobile-link {
                    display: flex; align-items: center; gap: 12px; padding: 14px 20px;
                    font-size: 14px; font-weight: 500; color: var(--text); text-decoration: none;
                    border-bottom: 1px solid #f1f5f9; cursor: pointer; background: transparent;
                    border-left: none; border-right: none; border-top: none;
                    width: 100%; font-family: inherit; transition: background 0.15s, color 0.15s; text-align: left;
                }
                .nb-mobile-link:hover { background: #f8fafc; color: var(--brand); }
                .nb-mobile-link svg { color: var(--muted); flex-shrink: 0; }
                .nb-mobile-link:hover svg { color: var(--brand); }
                .nb-mobile-link.danger { color: #dc2626; }
                .nb-mobile-link.danger:hover { background: #fef2f2; }
                .nb-mobile-link.danger svg { color: #dc2626; }
                .nb-mobile-divider { height: 1px; background: var(--border); margin: 4px 0; }
                .nb-mobile-section-title {
                    font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
                    text-transform: uppercase; color: var(--muted); padding: 12px 20px 6px;
                }
                .nb-mobile-cats { padding: 8px 16px 16px; background: var(--navy); }
                .nb-mobile-cats-title {
                    font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
                    text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 10px; padding: 8px 4px 0;
                }
                .nb-mobile-cats-grid { display: flex; flex-wrap: wrap; gap: 7px; }
                .nb-mobile-cat-chip {
                    display: inline-flex; align-items: center; padding: 6px 13px;
                    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 20px; font-size: 12px; font-weight: 600;
                    color: rgba(255,255,255,0.8); text-decoration: none; transition: background 0.15s, color 0.15s;
                }
                .nb-mobile-cat-chip:hover,
                .nb-mobile-cat-chip.active { background: var(--brand); border-color: var(--brand); color: #fff; }
                .nb-mobile-cat-chip.highlight { color: #fbbf24; border-color: rgba(251,191,36,0.3); }
                .nb-mobile-cat-chip.highlight:hover { background: #fbbf24; color: var(--navy); border-color: #fbbf24; }

                /* ── Responsive ── */
                @media (max-width: 900px) {
                    .nb-search { display: none; }
                    .nb-mobile-search { display: block; }
                    .nb-cat { display: none; }
                    .nb-hamburger { display: flex; }
                    .nb-icon-label { display: none; }
                    .nb-icon-btn { width: 44px; height: 44px; }
                    .nb-topbar-left { display: none; }
                }
                @media (max-width: 600px) {
                    .nb-user-name { display: none; }
                    .nb-main-inner { padding: 0 12px; gap: 8px; height: 58px; }
                    .nb-brand-tagline { display: none; }
                    .nb-brand-name { font-size: 16px; }
                    .nb-brand-icon { width: 34px; height: 34px; border-radius: 8px; }
                    .nb-mobile-search { padding: 8px 12px; }
                    .nb-wishlist-icon { display: none; }
                    .nb-topbar { display: none; }
                }
                @media (max-width: 380px) {
                    .nb-brand-name { font-size: 14px; }
                    .nb-icon-btn { width: 38px; height: 38px; }
                    .nb-main-inner { gap: 4px; padding: 0 10px; }
                }
            `}</style>

            <div className="nb-root">
                {/* ── Top bar ── */}
                <div className="nb-topbar">
                    <div className="nb-topbar-inner">
                        <div className="nb-topbar-left">
                            <span className="nb-topbar-item"><TruckIcon /> Free delivery on orders over ৳500</span>
                            <div className="nb-topbar-divider" />
                            <span className="nb-topbar-item"><PhoneIcon /> 16297 (10am – 8pm)</span>
                        </div>
                        <div className="nb-topbar-right">
                            <Link to="/vendor/register" className="nb-topbar-item">Become a Vendor</Link>
                            <div className="nb-topbar-divider" />
                            <Link to="/orders" className="nb-topbar-item">Track Order</Link>
                        </div>
                    </div>
                </div>

                {/* ── Main bar ── */}
                <div className="nb-main">
                    <div className="nb-main-inner">

                        {/* Brand */}
                        <Link className="nb-brand" to="/">
                            <div className="nb-brand-icon"><BookIcon /></div>
                            <div className="nb-brand-text">
                                <span className="nb-brand-name">Sabbir Book<span>Mall</span></span>
                                <span className="nb-brand-tagline">Welcome to book world</span>
                            </div>
                        </Link>

                        {/* ── Desktop Search ── */}
                        <div className="nb-search">
                            <form className="nb-search-form" onSubmit={handleSearch}>
                                <div className="nb-search-input-wrap">
                                    <input
                                        type="text"
                                        className={`nb-search-input${showClearBtn ? " has-value" : ""}`}
                                        placeholder={placeholderText || "Search book, author..."}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                    {showClearBtn && (
                                        <button
                                            type="button"
                                            className="nb-search-clear"
                                            onClick={handleClearSearch}
                                            tabIndex={-1}
                                            aria-label="Clear search"
                                        >
                                            <XIcon />
                                        </button>
                                    )}
                                </div>
                                <button className="nb-search-btn" type="submit">
                                    {searchQuery !== debouncedSearch ? (
                                        <span className="nb-typing-dot" />
                                    ) : (
                                        <SearchIcon />
                                    )}
                                    <span>Search</span>
                                </button>
                            </form>
                        </div>

                        {/* Actions */}
                        <div className="nb-actions">
                            <div className="d-flex align-items-center gap-3">
                                <NotificationBell />
                            </div>
                            <Link className="nb-icon-btn nb-wishlist-icon" to="/wishlist" title="Wishlist">
                                <HeartIcon />
                                <span className="nb-icon-label">Wishlist</span>
                            </Link>
                       
                            <Link
                                className="nb-icon-btn"
                                to={AuthService.isAuthenticated() ? "/cart" : "/auth"}
                                title="Cart"
                            >
                                <CartIcon />
                                {cartCount > 0 && (
                                    <span className="nb-cart-badge">{cartCount > 99 ? "99+" : cartCount}</span>
                                )}
                                <span className="nb-icon-label">Cart</span>
                            </Link>

                            {user ? (
                                <div style={{ position: "relative" }} ref={dropdownRef}>
                                    <button className="nb-user-btn" onClick={() => setDropdownOpen((p) => !p)}>
                                        <div className="nb-user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                                        <span className="nb-user-name">{user.name.split(" ")[0]}</span>
                                        <ChevronDownIcon open={dropdownOpen} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className="nb-dropdown">
                                            <div className="nb-dropdown-header">
                                                <div className="nb-dropdown-user-name">{user.name}</div>
                                                <div className="nb-dropdown-email">{user.email}</div>
                                                <span className="nb-dropdown-role" style={{ background: roleBadge(user.role).bg, color: roleBadge(user.role).color }}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <div className="nb-dropdown-body">
                                                <Link className="nb-dropdown-item" to="/profile" onClick={() => setDropdownOpen(false)}>
                                                    <UserIcon /> My Profile
                                                </Link>
                                                {user.role === "Customer" && (<>
                                                    <Link className="nb-dropdown-item" to="/orders" onClick={() => setDropdownOpen(false)}><OrderIcon /> My Orders</Link>
                                                    <Link className="nb-dropdown-item" to="/vendor/register" onClick={() => setDropdownOpen(false)}><ShopIcon /> Become a Vendor</Link>
                                                </>)}
                                                {user.role === "Vendor" && (<>
                                                    <Link className="nb-dropdown-item" to="/vendor/dashboard" onClick={() => setDropdownOpen(false)}><ShopIcon /> Vendor Dashboard</Link>
                                                    <Link className="nb-dropdown-item" to="/vendor/earnings" onClick={() => setDropdownOpen(false)}><OrderIcon /> My Earnings</Link>
                                                </>)}
                                                {user.role === "Admin" && (<>
                                                    <Link className="nb-dropdown-item" to="/admin/dashboard" onClick={() => setDropdownOpen(false)}><GearIcon /> Admin Panel</Link>
                                                    <Link className="nb-dropdown-item" to="/admin/vendor-payouts" onClick={() => setDropdownOpen(false)}><OrderIcon /> Vendor Payouts</Link>
                                                </>)}
                                                <div className="nb-dropdown-divider" />
                                                <button className="nb-dropdown-item danger" onClick={handleLogout}><LogoutIcon /> Logout</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link className="nb-signin-btn" to="/auth"><UserIcon />Sign In</Link>
                            )}

                            <button
                                className={`nb-hamburger${mobileMenuOpen ? " open" : ""}`}
                                onClick={() => setMobileMenuOpen((p) => !p)}
                                aria-label="Toggle menu"
                            >
                                <span className="nb-hamburger-line" />
                                <span className="nb-hamburger-line" />
                                <span className="nb-hamburger-line" />
                            </button>
                        </div>
                    </div>

                    {/* ── Mobile Search ── */}
                    <div className="nb-mobile-search">
                        <form className="nb-mobile-search-form" onSubmit={handleSearch}>
                            <div className="nb-mobile-search-input-wrap">
                                <input
                                    type="text"
                                    className={`nb-mobile-search-input${showClearBtn ? " has-value" : ""}`}
                                    placeholder={placeholderText || "Search book, author..."}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoComplete="off"
                                />
                                {showClearBtn && (
                                    <button
                                        type="button"
                                        className="nb-mobile-search-clear"
                                        onClick={handleClearSearch}
                                        tabIndex={-1}
                                        aria-label="Clear search"
                                    >
                                        <XIcon />
                                    </button>
                                )}
                            </div>
                            <button className="nb-mobile-search-btn" type="submit">
                                {searchQuery !== debouncedSearch ? <span className="nb-typing-dot" /> : <SearchIcon />}
                            </button>
                        </form>
                    </div>

                    {/* ── Mobile drawer ── */}
                    {/* ── Mobile drawer ── */}
                    <div className={`nb-mobile-menu${mobileMenuOpen ? " open" : ""}`}>
                        {user && (
                            <div className="nb-mobile-user-block">
                                <div className="nb-mobile-user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className="nb-mobile-user-name">{user.name}</div>
                                    <div className="nb-mobile-user-email">{user.email}</div>
                                    <span className="nb-mobile-user-role" style={{ background: roleBadge(user.role).bg, color: roleBadge(user.role).color }}>
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="nb-mobile-section-title">Navigation</div>

                        {/* Wishlist - Now showing for all logged in Customers */}
                    
                        <Link className="nb-mobile-link" to={AuthService.isAuthenticated() ? "/cart" : "/auth"}>
                            <CartIcon /> Cart {cartCount > 0 && `(${cartCount})`}
                        </Link>

                        {user ? (
                            <>
                                <Link className="nb-mobile-link" to="/profile">
                                    <UserIcon /> My Profile
                                </Link>

                                {user.role === "Customer" && (
                                    <>
                                        <Link className="nb-mobile-link" to="/orders">
                                            <OrderIcon /> My Orders
                                        </Link>
                                    
                                        
                                  
                                        <Link className="nb-mobile-link" to="/vendor/register">
                                            <ShopIcon /> Become a Vendor
                                        </Link>
                                    </>
                                )}

                                {user.role === "Vendor" && (<>
                                    <Link className="nb-mobile-link" to="/vendor/dashboard">
                                        <ShopIcon /> Vendor Dashboard
                                    </Link>
                                    <Link className="nb-mobile-link" to="/vendor/earnings">
                                        <OrderIcon /> My Earnings
                                    </Link>
                                </>)}

                                {user.role === "Admin" && (<>
                                    <Link className="nb-mobile-link" to="/admin/dashboard">
                                        <GearIcon /> Admin Panel
                                    </Link>
                                    <Link className="nb-mobile-link" to="/admin/vendor-payouts">
                                        <OrderIcon /> Vendor Payouts
                                    </Link>
                                </>)}

                                <div className="nb-mobile-divider" />

                                <button className="nb-mobile-link danger" onClick={handleLogout}>
                                    <LogoutIcon /> Logout
                                </button>
                            </>
                        ) : (
                            <Link className="nb-mobile-link" to="/auth">
                                <UserIcon /> Sign In / Register
                            </Link>
                        )}

                        <div className="nb-mobile-cats">
                            <div className="nb-mobile-cats-title">Browse Categories</div>
                            <div className="nb-mobile-cats-grid">
                                {CATEGORIES.map((cat) => (
                                    <Link
                                        key={cat.to}
                                        className={`nb-mobile-cat-chip${cat.label === "New Arrivals" ? " highlight" : ""}${location.search.includes(cat.to.split("?")[1] ?? "~~") ? " active" : ""}`}
                                        to={cat.to}
                                    >
                                        {cat.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Desktop category nav ── */}
                    <div className="nb-cat">
                        <div className="nb-cat-inner">
                            {CATEGORIES.map((cat) => (
                                <Link
                                    key={cat.to}
                                    className={`nb-cat-link${cat.label === "New Arrivals" ? " nb-cat-highlight" : ""}${location.search.includes(cat.to.split("?")[1] ?? "~~") ? " active" : ""}`}
                                    to={cat.to}
                                >
                                    {cat.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}