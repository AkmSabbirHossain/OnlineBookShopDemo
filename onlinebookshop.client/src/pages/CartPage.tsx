// =============================================
// CartPage.tsx
// =============================================

import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import Seo from "../components/common/Seo";
import CartItemComponent from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import CartService from "../services/cart.service";
import { useLanguage } from "../i18n/language-context";
import type { CartResponseDto } from "../types/cart.types";

export default function CartPage() {
    const { t } = useLanguage();
    const [cart, setCart] = useState<CartResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [clearing, setClearing] = useState(false);
    const actionErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flashActionError = (message: string) => {
        setActionError(message);
        if (actionErrorTimer.current) clearTimeout(actionErrorTimer.current);
        actionErrorTimer.current = setTimeout(() => setActionError(""), 4000);
    };

    useEffect(() => () => {
        if (actionErrorTimer.current) clearTimeout(actionErrorTimer.current);
    }, []);

    const fetchCart = async (showSpinner = false) => {
        if (showSpinner) setLoading(true);
        setError("");
        try {
            const data = await CartService.getMyCart();
            setCart(data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "There was a problem loading your cart.");
            } else {
                setError("Something went wrong while loading your cart.");
            }
        } finally {
            if (showSpinner) setLoading(false);
        }
    };

    useEffect(() => { fetchCart(true); }, []);

    // ── Quantity Update (Optimistic) ──
    const handleQuantityChange = async (bookId: number, quantity: number) => {
        if (!cart) return;
        const prevCart = cart;

        const updatedItems = cart.items.map((item) =>
            item.bookId === bookId
                ? { ...item, quantity, subtotal: item.bookPrice * quantity }
                : item
        );
        const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
        setCart({ ...cart, items: updatedItems, totalAmount: newTotal });

        try {
            await CartService.updateItem({ bookId, quantity });
            fetchCart(false);
        } catch {
            setCart(prevCart);
            flashActionError("We couldn't update that quantity. Please try again.");
        }
    };

    // ── Remove Item (Optimistic) ──
    const handleRemove = async (bookId: number) => {
        if (!cart) return;
        const prevCart = cart;

        const updatedItems = cart.items.filter((item) => item.bookId !== bookId);
        const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
        setCart({ ...cart, items: updatedItems, totalAmount: newTotal });

        try {
            await CartService.removeItem(bookId);
            fetchCart(false);
        } catch {
            setCart(prevCart);
            flashActionError("We couldn't remove that book. Please try again.");
        }
    };

    // ── Clear Cart ──
    const handleClearCart = async () => {
        if (!window.confirm("Remove all items from your cart?")) return;
        setClearing(true);
        try {
            await CartService.clearCart();
            setActionError("");
            await fetchCart(false);
        } catch {
            flashActionError("We couldn't clear your cart. Please try again.");
            fetchCart(false);
        } finally {
            setClearing(false);
        }
    };

    const itemCount = cart?.items.length ?? 0;
    const totalQuantity = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

    return (
        <>
            <Navbar />
            <Seo title={t("seo.cartTitle")} noindex />

            <div className="cp-page">
                <style>{`
                    .cp-page {
                        --cp-bg: #f4f6f9;
                        --cp-surface: #ffffff;
                        --cp-ink: #14213d;
                        --cp-text: #334155;
                        --cp-muted: #64748b;
                        --cp-border: #e6ebf2;
                        --cp-brand: #e8401c;
                        --cp-brand-dark: #c2340f;
                        --cp-soft: #fff4f1;
                        --cp-good: #15803d;
                        --cp-good-bg: #f0fdf4;
                        --cp-bad: #b91c1c;
                        --cp-bad-bg: #fef2f2;
                        background: var(--cp-bg);
                        min-height: 100vh;
                        padding: 18px 0 56px;
                        font-family: 'Sora', 'Hind Siliguri', sans-serif;
                        color: var(--cp-text);
                    }
                    .cp-page *, .cp-page *::before, .cp-page *::after { box-sizing: border-box; }
                    .cp-shell { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
                    .cp-sr-only {
                        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
                        overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
                    }

                    /* ── Breadcrumbs ── */
                    .cp-crumbs {
                        display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
                        font-size: 12.5px; color: var(--cp-muted); margin: 2px 0 16px;
                    }
                    .cp-crumbs a { color: var(--cp-muted); text-decoration: none; transition: color .15s; }
                    .cp-crumbs a:hover { color: var(--cp-brand); }
                    .cp-crumb-sep { color: #cbd5e1; font-size: 10px; }
                    .cp-crumb-current { color: var(--cp-ink); font-weight: 600; }

                    /* ── Header ── */
                    .cp-head {
                        display: flex; align-items: flex-end; justify-content: space-between;
                        gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
                    }
                    .cp-title {
                        margin: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
                        font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--cp-ink);
                    }
                    .cp-title > i { color: var(--cp-brand); font-size: 24px; }
                    .cp-count {
                        font-size: 12px; font-weight: 700; letter-spacing: 0; color: var(--cp-brand);
                        background: var(--cp-soft); border: 1px solid #ffd9ce;
                        border-radius: 999px; padding: 4px 11px;
                    }
                    .cp-sub { margin: 7px 0 0; font-size: 13px; color: var(--cp-muted); }
                    .cp-continue {
                        display: inline-flex; align-items: center; gap: 7px;
                        padding: 9px 14px; border-radius: 10px; border: 1px solid var(--cp-border);
                        background: var(--cp-surface); color: var(--cp-ink);
                        font-size: 13px; font-weight: 700; text-decoration: none;
                        transition: border-color .15s, color .15s, transform .15s;
                    }
                    .cp-continue:hover { border-color: var(--cp-brand); color: var(--cp-brand); transform: translateY(-1px); }

                    /* ── Layout ── */
                    .cp-grid {
                        display: grid; grid-template-columns: minmax(0, 1fr) 360px;
                        gap: 24px; align-items: start;
                    }
                    .cp-items-card {
                        background: var(--cp-surface); border: 1px solid var(--cp-border);
                        border-radius: 18px; overflow: hidden;
                        box-shadow: 0 18px 45px -34px rgba(15, 23, 42, 0.4);
                    }
                    .cp-items-head {
                        display: grid;
                        grid-template-columns: 88px minmax(0, 1fr) 150px 110px 36px;
                        gap: 18px; align-items: center;
                        padding: 12px 20px; background: #f8fafc;
                        border-bottom: 1px solid var(--cp-border);
                        font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
                        text-transform: uppercase; color: var(--cp-muted);
                    }
                    .cp-items-head span:nth-child(3) { text-align: center; }
                    .cp-items-head span:nth-child(4) { text-align: right; }

                    /* ── Cart item ── */
                    .cp-item {
                        display: grid;
                        grid-template-columns: 88px minmax(0, 1fr) 150px 110px 36px;
                        gap: 18px; align-items: center;
                        padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
                        transition: background .15s, opacity .15s;
                    }
                    .cp-item:last-child { border-bottom: none; }
                    .cp-item:hover { background: #fcfdff; }
                    .cp-item.is-updating { opacity: 0.72; }
                    .cp-buy-row { display: contents; }
                    .cp-thumb {
                        width: 88px; height: 116px; border-radius: 10px; overflow: hidden;
                        background: #f1f5f9; border: 1px solid var(--cp-border);
                    }
                    .cp-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
                    .cp-info { min-width: 0; }
                    .cp-item-title {
                        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                        overflow: hidden; margin-bottom: 5px;
                        font-size: 15px; font-weight: 700; line-height: 1.4;
                        color: var(--cp-ink); text-decoration: none; overflow-wrap: anywhere;
                        transition: color .15s;
                    }
                    .cp-item-title:hover { color: var(--cp-brand); }
                    .cp-unit { font-size: 12.5px; color: var(--cp-muted); }
                    .cp-unit b { color: var(--cp-good); font-weight: 700; }
                    .cp-updating {
                        display: inline-flex; align-items: center; gap: 6px; margin-top: 7px;
                        font-size: 11.5px; color: var(--cp-muted);
                    }
                    .cp-qty {
                        display: inline-flex; align-items: center; justify-self: center;
                        border: 1px solid var(--cp-border); border-radius: 9px;
                        background: var(--cp-surface); overflow: hidden;
                    }
                    .cp-qty-btn {
                        width: 34px; height: 36px; border: none; background: transparent;
                        color: var(--cp-ink); cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        transition: background .15s, color .15s;
                    }
                    .cp-qty-btn:hover:not(:disabled) { background: var(--cp-soft); color: var(--cp-brand); }
                    .cp-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
                    .cp-qty-input {
                        width: 46px; height: 36px; border: none; background: var(--cp-surface);
                        border-left: 1px solid #eef2f7; border-right: 1px solid #eef2f7;
                        text-align: center; font: inherit; font-size: 13.5px; font-weight: 700;
                        color: var(--cp-ink); -moz-appearance: textfield;
                    }
                    .cp-qty-input::-webkit-outer-spin-button,
                    .cp-qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                    .cp-qty-input:disabled { color: var(--cp-muted); }
                    .cp-line-total {
                        text-align: right; font-size: 16px; font-weight: 800;
                        color: var(--cp-ink); white-space: nowrap;
                    }
                    .cp-line-total small {
                        display: block; margin-top: 3px;
                        font-size: 11px; font-weight: 600; color: var(--cp-muted);
                    }
                    .cp-remove {
                        width: 34px; height: 34px; justify-self: center;
                        border: 1px solid transparent; border-radius: 8px; background: transparent;
                        color: #94a3b8; cursor: pointer;
                        display: flex; align-items: center; justify-content: center;
                        transition: background .15s, color .15s, border-color .15s;
                    }
                    .cp-remove:hover:not(:disabled) {
                        background: var(--cp-bad-bg); color: var(--cp-bad); border-color: #fecaca;
                    }
                    .cp-remove:disabled { cursor: not-allowed; opacity: 0.6; }

                    /* ── Summary ── */
                    .cp-side { position: sticky; top: calc(var(--nb-header-h, 0px) + 16px); }
                    .cp-summary {
                        background: var(--cp-surface); border: 1px solid var(--cp-border);
                        border-radius: 18px; overflow: hidden;
                        box-shadow: 0 18px 45px -34px rgba(15, 23, 42, 0.4);
                    }
                    .cp-summary-head {
                        display: flex; align-items: center; justify-content: space-between; gap: 12px;
                        padding: 16px 20px; border-bottom: 1px solid var(--cp-border); background: #fff;
                    }
                    .cp-summary-head h2 {
                        margin: 0; display: flex; align-items: center; gap: 8px;
                        font-size: 15px; font-weight: 800; color: var(--cp-ink);
                    }
                    .cp-summary-head h2 i { color: var(--cp-brand); }
                    .cp-summary-count { font-size: 11.5px; font-weight: 600; color: var(--cp-muted); white-space: nowrap; }
                    .cp-summary-body { padding: 18px 20px 20px; }
                    .cp-row {
                        display: flex; justify-content: space-between; align-items: baseline;
                        gap: 12px; margin-bottom: 10px; font-size: 13.5px; color: var(--cp-muted);
                    }
                    .cp-row b { color: var(--cp-ink); font-weight: 700; }
                    .cp-row .cp-free-tag { color: var(--cp-good); font-weight: 800; }
                    .cp-free {
                        margin: 6px 0 16px; padding: 12px; border-radius: 10px;
                        background: #f8fafc; border: 1px solid var(--cp-border);
                    }
                    .cp-free.done { background: var(--cp-good-bg); border-color: #bbf7d0; }
                    .cp-free-top {
                        display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px;
                        font-size: 11.5px; font-weight: 700; color: var(--cp-muted);
                    }
                    .cp-free.done .cp-free-top { color: var(--cp-good); }
                    .cp-progress { height: 6px; border-radius: 999px; background: #e8eef5; overflow: hidden; }
                    .cp-progress span {
                        display: block; height: 100%; border-radius: 999px;
                        background: linear-gradient(90deg, #22c55e, #16a34a);
                        transition: width .35s ease;
                    }
                    .cp-free-hint { margin: 8px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--cp-muted); }
                    .cp-free.done .cp-free-hint { color: var(--cp-good); }
                    .cp-total-row {
                        display: flex; justify-content: space-between; align-items: baseline;
                        gap: 12px; margin-top: 4px; padding-top: 14px;
                        border-top: 1px dashed var(--cp-border);
                    }
                    .cp-total-label { font-size: 14px; font-weight: 800; color: var(--cp-ink); }
                    .cp-total-value { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--cp-ink); }
                    .cp-cod {
                        display: flex; align-items: flex-start; gap: 10px;
                        margin: 16px 0; padding: 11px 12px; border-radius: 10px;
                        background: var(--cp-good-bg); border: 1px solid #bbf7d0;
                    }
                    .cp-cod i { font-size: 18px; color: var(--cp-good); line-height: 1.2; }
                    .cp-cod strong { display: block; font-size: 12px; font-weight: 700; color: #166534; }
                    .cp-cod span { display: block; margin-top: 1px; font-size: 11.5px; color: #15803d; }
                    .cp-cta {
                        width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                        padding: 13px 16px; border: none; border-radius: 11px;
                        background: var(--cp-brand); color: #fff;
                        font: inherit; font-size: 14px; font-weight: 800; cursor: pointer;
                        box-shadow: 0 12px 24px -14px rgba(232, 64, 28, 0.6);
                        transition: background .18s, transform .15s, box-shadow .18s;
                    }
                    .cp-cta:hover:not(:disabled) {
                        background: var(--cp-brand-dark); transform: translateY(-1px);
                        box-shadow: 0 16px 28px -14px rgba(232, 64, 28, 0.65);
                    }
                    .cp-cta:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
                    .cp-secondary {
                        width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
                        margin-top: 10px; padding: 11px;
                        border: 1px solid var(--cp-border); border-radius: 11px;
                        background: var(--cp-surface); color: var(--cp-ink);
                        font: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
                        transition: border-color .15s, color .15s;
                    }
                    .cp-secondary:hover { border-color: var(--cp-brand); color: var(--cp-brand); }
                    .cp-clear {
                        width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
                        margin-top: 10px; padding: 7px; border: none; border-radius: 8px;
                        background: transparent; color: var(--cp-bad);
                        font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
                        transition: background .15s;
                    }
                    .cp-clear:hover:not(:disabled) { background: var(--cp-bad-bg); }
                    .cp-clear:disabled { opacity: 0.6; cursor: not-allowed; }
                    .cp-perks {
                        display: grid; gap: 8px; margin-top: 16px; padding-top: 14px;
                        border-top: 1px solid #f1f5f9;
                    }
                    .cp-perk { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--cp-muted); }
                    .cp-perk i { font-size: 13px; color: #94a3b8; }

                    /* ── Action error banner ── */
                    .cp-banner-error {
                        display: flex; align-items: center; gap: 9px; margin-bottom: 16px;
                        padding: 11px 14px; border-radius: 10px;
                        background: var(--cp-bad-bg); border: 1px solid #fecaca;
                        color: var(--cp-bad); font-size: 12.5px; font-weight: 600;
                    }

                    /* ── Empty / Error states ── */
                    .cp-empty, .cp-error {
                        padding: 54px 24px; text-align: center;
                        background: var(--cp-surface); border: 1px solid var(--cp-border);
                        border-radius: 20px; box-shadow: 0 18px 45px -36px rgba(15, 23, 42, 0.35);
                    }
                    .cp-empty-icon, .cp-error-icon {
                        display: flex; align-items: center; justify-content: center;
                        width: 84px; height: 84px; margin: 0 auto 18px; border-radius: 50%;
                    }
                    .cp-empty-icon { background: var(--cp-soft); color: var(--cp-brand); font-size: 34px; }
                    .cp-error-icon { background: var(--cp-bad-bg); color: var(--cp-bad); font-size: 32px; }
                    .cp-empty h2, .cp-error h2 {
                        margin: 0 0 7px; font-size: 20px; font-weight: 800;
                        letter-spacing: -0.01em; color: var(--cp-ink);
                    }
                    .cp-empty p, .cp-error p {
                        max-width: 380px; margin: 0 auto 22px;
                        font-size: 13.5px; line-height: 1.65; color: var(--cp-muted);
                    }
                    .cp-empty-cta, .cp-error-retry {
                        display: inline-flex; align-items: center; gap: 8px;
                        padding: 12px 20px; border: none; border-radius: 11px;
                        background: var(--cp-brand); color: #fff;
                        font: inherit; font-size: 13.5px; font-weight: 800;
                        text-decoration: none; cursor: pointer;
                        box-shadow: 0 12px 24px -14px rgba(232, 64, 28, 0.6);
                        transition: background .18s, transform .15s;
                    }
                    .cp-empty-cta:hover, .cp-error-retry:hover {
                        background: var(--cp-brand-dark); color: #fff; transform: translateY(-1px);
                    }

                    /* ── Loading skeleton ── */
                    .cp-skeleton { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: start; }
                    .cp-skel-card {
                        padding: 8px 20px; background: var(--cp-surface);
                        border: 1px solid var(--cp-border); border-radius: 18px;
                    }
                    .cp-skel-row {
                        display: grid; grid-template-columns: 88px minmax(0, 1fr) 150px 110px;
                        gap: 18px; align-items: center; padding: 16px 0;
                        border-bottom: 1px solid #f1f5f9;
                    }
                    .cp-skel-row:last-child { border-bottom: none; }
                    .cp-skel {
                        border-radius: 8px;
                        background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 37%, #eef2f7 63%);
                        background-size: 400% 100%;
                        animation: cpShimmer 1.4s ease infinite;
                    }
                    .cp-skel-thumb { width: 88px; height: 116px; }
                    .cp-skel-line { height: 12px; }
                    .cp-skel-block { height: 120px; margin-bottom: 14px; }
                    @keyframes cpShimmer {
                        0% { background-position: 100% 0; }
                        100% { background-position: 0 0; }
                    }

                    /* ── Responsive ── */
                    @media (max-width: 1080px) {
                        .cp-grid, .cp-skeleton { grid-template-columns: 1fr; }
                        .cp-side { position: static; }
                    }
                    @media (max-width: 640px) {
                        .cp-page { padding-top: 12px; }
                        .cp-shell { padding: 0 12px; }
                        .cp-head { align-items: flex-start; margin-bottom: 16px; }
                        .cp-title { font-size: 22px; }
                        .cp-title > i { font-size: 20px; }
                        .cp-sub { font-size: 12.5px; }
                        .cp-items-head { display: none; }
                        .cp-item {
                            grid-template-columns: 76px minmax(0, 1fr) 34px;
                            grid-template-areas:
                                "thumb info remove"
                                "buy buy buy";
                            gap: 12px 14px; align-items: start; padding: 16px;
                        }
                        .cp-thumb { grid-area: thumb; width: 76px; height: 100px; }
                        .cp-info { grid-area: info; }
                        .cp-remove { grid-area: remove; align-self: start; }
                        .cp-buy-row {
                            grid-area: buy; display: flex; align-items: center;
                            justify-content: space-between; gap: 14px;
                        }
                        .cp-qty { justify-self: auto; margin-top: 2px; }
                        .cp-line-total { font-size: 15px; text-align: right; }
                        .cp-summary-body { padding: 16px; }
                        .cp-summary-head { padding: 14px 16px; }
                        .cp-empty, .cp-error { padding: 40px 18px; }
                    }
                    @media (max-width: 380px) {
                        .cp-item { grid-template-columns: 68px minmax(0, 1fr) 34px; }
                        .cp-thumb { width: 68px; height: 92px; }
                        .cp-line-total { font-size: 14px; }
                        .cp-qty-btn { width: 32px; }
                        .cp-qty-input { width: 42px; }
                    }
                `}</style>

                <div className="cp-shell">
                    <nav className="cp-crumbs" aria-label="Breadcrumb">
                        <Link to="/">Home</Link>
                        <i className="bi bi-chevron-right cp-crumb-sep" aria-hidden="true"></i>
                        <span className="cp-crumb-current">Shopping Cart</span>
                    </nav>

                    <header className="cp-head">
                        <div>
                            <h1 className="cp-title">
                                <i className="bi bi-bag-check" aria-hidden="true"></i>
                                Shopping Cart
                                {!loading && itemCount > 0 && (
                                    <span className="cp-count">
                                        {totalQuantity} item{totalQuantity !== 1 ? "s" : ""}
                                    </span>
                                )}
                            </h1>
                            <p className="cp-sub">Review the items in your cart before checkout.</p>
                        </div>
                        <Link to="/" className="cp-continue">
                            <i className="bi bi-arrow-left" aria-hidden="true"></i>
                            Continue shopping
                        </Link>
                    </header>

                    {/* Loading */}
                    {loading && (
                        <>
                            <p className="cp-sr-only" role="status">Loading your cart…</p>
                            <div className="cp-skeleton" aria-hidden="true">
                                <div className="cp-skel-card">
                                    {[0, 1, 2].map((row) => (
                                        <div className="cp-skel-row" key={row}>
                                            <div className="cp-skel cp-skel-thumb"></div>
                                            <div>
                                                <div className="cp-skel cp-skel-line" style={{ width: "72%", marginBottom: "10px" }}></div>
                                                <div className="cp-skel cp-skel-line" style={{ width: "38%" }}></div>
                                            </div>
                                            <div className="cp-skel cp-skel-line"></div>
                                            <div className="cp-skel cp-skel-line"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="cp-skel-card" style={{ padding: "20px" }}>
                                    <div className="cp-skel cp-skel-line" style={{ width: "50%", marginBottom: "18px" }}></div>
                                    <div className="cp-skel cp-skel-block"></div>
                                    <div className="cp-skel cp-skel-line" style={{ width: "70%" }}></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="cp-error" role="alert">
                            <div className="cp-error-icon"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i></div>
                            <h2>We couldn't load your cart</h2>
                            <p>{error}</p>
                            <button type="button" className="cp-error-retry" onClick={() => fetchCart(true)}>
                                <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && itemCount === 0 && (
                        <div className="cp-empty">
                            <div className="cp-empty-icon"><i className="bi bi-bag" aria-hidden="true"></i></div>
                            <h2>Your cart is empty</h2>
                            <p>Looks like you haven't added any books yet. Browse the collection and find your next read.</p>
                            <Link to="/" className="cp-empty-cta">
                                <i className="bi bi-book" aria-hidden="true"></i>
                                Browse books
                            </Link>
                        </div>
                    )}

                    {/* Cart Content */}
                    {!loading && !error && cart && itemCount > 0 && (
                        <>
                            {actionError && (
                                <div className="cp-banner-error" role="alert">
                                    <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                                    {actionError}
                                </div>
                            )}

                            <div className="cp-grid">
                                <section className="cp-items-card" aria-label="Cart items">
                                    <div className="cp-items-head" aria-hidden="true">
                                        <span></span>
                                        <span>Product</span>
                                        <span>Quantity</span>
                                        <span>Subtotal</span>
                                        <span></span>
                                    </div>

                                    {cart.items.map((item) => (
                                        <CartItemComponent
                                            key={item.cartItemId}
                                            item={item}
                                            onQuantityChange={handleQuantityChange}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </section>

                                <aside className="cp-side">
                                    <CartSummary
                                        totalAmount={cart.totalAmount}
                                        itemCount={totalQuantity}
                                        onClearCart={handleClearCart}
                                        clearing={clearing}
                                    />
                                </aside>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
