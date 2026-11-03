// =============================================
// OrderDetailPage.tsx — Order detail & tracking
// =============================================

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import OrderService from "../services/order.service";
import type { OrderResponseDto, OrderStatus } from "../types/order.types";
import { getOrderStatus, ORDER_STATUS_META, TIMELINE_STEPS } from "../utils/orderStatus";
import { getDeliveryCharge } from "../utils/pricing";

const PLACEHOLDER_IMG = "https://placehold.co/200x260/f1f5f9/94a3b8?text=Book";
const currency = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function formatDate(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : dateFmt.format(date);
}

function formatDateTime(value?: string): string {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : dateTimeFmt.format(date);
}

export default function OrderDetailPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const parsedId = Number.parseInt(orderId ?? "", 10);
    const isValidId = Number.isInteger(parsedId) && parsedId > 0;

    const [order, setOrder] = useState<OrderResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [actionError, setActionError] = useState("");
    const [cancelling, setCancelling] = useState(false);

    const fetchOrder = useCallback(async (showSpinner = false) => {
        if (!isValidId) {
            setLoading(false);
            setNotFound(true);
            return;
        }

        if (showSpinner) setLoading(true);
        setError("");
        setNotFound(false);

        try {
            const data = await OrderService.getOrderById(parsedId);
            setOrder(data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.status === 404) {
                setNotFound(true);
            } else if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "There was a problem loading this order.");
            } else {
                setError("Something went wrong while loading this order.");
            }
        } finally {
            setLoading(false);
        }
    }, [isValidId, parsedId]);

    useEffect(() => {
        fetchOrder(true);
    }, [fetchOrder]);

    const handleCancel = async () => {
        if (!order) return;
        if (!window.confirm("Cancel this order? The books will be returned to stock.")) return;

        setCancelling(true);
        setActionError("");
        try {
            await OrderService.cancelOrder(order.orderId);
            await fetchOrder(false);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setActionError(err.response?.data?.message || "We couldn't cancel this order. Please try again.");
            } else {
                setActionError("We couldn't cancel this order. Please try again.");
            }
        } finally {
            setCancelling(false);
        }
    };

    const currentStatus: OrderStatus = order ? getOrderStatus(order.status) : "Pending";
    const totalQuantity = order?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const subtotal = order?.totalAmount ?? 0;
    const deliveryCharge = order ? getDeliveryCharge(order.totalAmount) : 0;
    const grandTotal = subtotal + deliveryCharge;

    const timelineEvents: { status: OrderStatus; changedAt?: string }[] = [];
    if (order) {
        for (const history of order.statusHistory ?? []) {
            const status = getOrderStatus(history.status);
            if (timelineEvents[timelineEvents.length - 1]?.status !== status) {
                timelineEvents.push({ status, changedAt: history.changedAt });
            }
        }

        if (timelineEvents.length === 0) {
            timelineEvents.push({ status: currentStatus, changedAt: order.orderDate });
        } else if (timelineEvents[timelineEvents.length - 1].status !== currentStatus) {
            timelineEvents.push({ status: currentStatus, changedAt: order.orderDate });
        }
    }

    const isTerminal = currentStatus === "Delivered" || currentStatus === "Cancelled";
    const currentStepIndex = TIMELINE_STEPS.indexOf(currentStatus);
    const upcomingSteps = isTerminal || currentStepIndex === -1
        ? []
        : TIMELINE_STEPS.slice(currentStepIndex + 1);

    return (
        <>
            <Navbar />

            <div className="od-page">
                <style>{`
                    .od-page {
                        --od-bg: #f4f6f9;
                        --od-surface: #ffffff;
                        --od-ink: #14213d;
                        --od-text: #334155;
                        --od-muted: #64748b;
                        --od-border: #e6ebf2;
                        --od-brand: #e8401c;
                        --od-brand-dark: #c2340f;
                        --od-good: #15803d;
                        --od-good-bg: #f0fdf4;
                        --od-warn: #b45309;
                        --od-warn-bg: #fffbeb;
                        --od-bad: #b91c1c;
                        --od-bad-bg: #fef2f2;
                        --od-info: #1d4ed8;
                        --od-info-bg: #eff6ff;
                        background: var(--od-bg);
                        min-height: 100vh;
                        padding: 18px 0 56px;
                        font-family: 'Sora', 'Hind Siliguri', sans-serif;
                        color: var(--od-text);
                    }
                    .od-page *, .od-page *::before, .od-page *::after { box-sizing: border-box; }
                    .od-shell { max-width: 1180px; margin: 0 auto; padding: 0 16px; }
                    .od-sr-only {
                        position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
                        overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
                    }

                    /* ── Breadcrumbs ── */
                    .od-crumbs {
                        display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
                        font-size: 12.5px; color: var(--od-muted); margin: 2px 0 16px;
                    }
                    .od-crumbs a { color: var(--od-muted); text-decoration: none; transition: color .15s; }
                    .od-crumbs a:hover { color: var(--od-brand); }
                    .od-crumb-sep { color: #cbd5e1; font-size: 10px; }
                    .od-crumb-current {
                        color: var(--od-ink); font-weight: 600;
                        max-width: min(100%, 320px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    }

                    /* ── Header ── */
                    .od-head {
                        display: flex; align-items: flex-end; justify-content: space-between;
                        gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
                    }
                    .od-title {
                        margin: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
                        font-size: 26px; font-weight: 800; letter-spacing: -0.02em; color: var(--od-ink);
                    }
                    .od-title > i { color: var(--od-brand); font-size: 24px; }
                    .od-head-meta {
                        display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px;
                        margin-top: 8px; font-size: 12.5px; color: var(--od-muted);
                    }
                    .od-head-meta span { display: inline-flex; align-items: center; gap: 6px; }
                    .od-badge {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 5px 12px; border-radius: 999px;
                        font-size: 12px; font-weight: 800; letter-spacing: 0.01em;
                        border: 1px solid transparent;
                    }
                    .od-badge.is-pending { color: var(--od-warn); background: var(--od-warn-bg); border-color: #fde68a; }
                    .od-badge.is-paid { color: var(--od-info); background: var(--od-info-bg); border-color: #bfdbfe; }
                    .od-badge.is-shipped { color: #3730a3; background: #eef2ff; border-color: #c7d2fe; }
                    .od-badge.is-delivered { color: var(--od-good); background: var(--od-good-bg); border-color: #bbf7d0; }
                    .od-badge.is-cancelled { color: var(--od-bad); background: var(--od-bad-bg); border-color: #fecaca; }
                    .od-back {
                        display: inline-flex; align-items: center; gap: 7px;
                        padding: 9px 14px; border-radius: 10px; border: 1px solid var(--od-border);
                        background: var(--od-surface); color: var(--od-ink);
                        font-size: 13px; font-weight: 700; text-decoration: none;
                        transition: border-color .15s, color .15s, transform .15s;
                    }
                    .od-back:hover { border-color: var(--od-brand); color: var(--od-brand); transform: translateY(-1px); }

                    /* ── Layout ── */
                    .od-grid {
                        display: grid; grid-template-columns: minmax(0, 1fr) 340px;
                        gap: 24px; align-items: start;
                    }
                    .od-card {
                        background: var(--od-surface); border: 1px solid var(--od-border);
                        border-radius: 18px; overflow: hidden;
                        box-shadow: 0 18px 45px -34px rgba(15, 23, 42, 0.4);
                    }
                    .od-card + .od-card { margin-top: 20px; }
                    .od-card-head {
                        display: flex; align-items: center; justify-content: space-between; gap: 12px;
                        padding: 16px 20px; border-bottom: 1px solid var(--od-border);
                    }
                    .od-card-head h2 {
                        margin: 0; display: flex; align-items: center; gap: 8px;
                        font-size: 15px; font-weight: 800; color: var(--od-ink);
                    }
                    .od-card-head h2 i { color: var(--od-brand); }
                    .od-card-count { font-size: 11.5px; font-weight: 600; color: var(--od-muted); white-space: nowrap; }

                    /* ── Timeline ── */
                    .od-timeline {
                        list-style: none; margin: 0; padding: 20px 20px 4px;
                    }
                    .od-step {
                        position: relative; display: grid;
                        grid-template-columns: 38px minmax(0, 1fr);
                        gap: 14px; padding-bottom: 22px;
                    }
                    .od-step:not(:last-child)::before {
                        content: ""; position: absolute; left: 18px; top: 38px; bottom: 4px;
                        width: 2px; background: #e2e8f0; border-radius: 2px;
                    }
                    .od-step.is-done:not(.is-current):not(:last-child)::before { background: #bbf7d0; }
                    .od-step.is-cancelled:not(:last-child)::before { background: #fecaca; }
                    .od-step-dot {
                        width: 38px; height: 38px; border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        background: #f1f5f9; color: #94a3b8; font-size: 16px;
                        border: 1px solid var(--od-border);
                    }
                    .od-step.is-done .od-step-dot { background: var(--od-good-bg); color: var(--od-good); border-color: #bbf7d0; }
                    .od-step.is-current .od-step-dot {
                        box-shadow: 0 0 0 4px #f0fdf4; border-color: #86efac;
                    }
                    .od-step.is-cancelled .od-step-dot { background: var(--od-bad-bg); color: var(--od-bad); border-color: #fecaca; }
                    .od-step.is-cancelled.is-current .od-step-dot { box-shadow: 0 0 0 4px #fef2f2; }
                    .od-step.is-upcoming .od-step-dot { opacity: 0.65; }
                    .od-step-body { min-width: 0; padding-top: 2px; }
                    .od-step-top {
                        display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
                        font-size: 13.5px; color: var(--od-ink);
                    }
                    .od-step-top strong { font-weight: 800; }
                    .od-step.is-upcoming .od-step-top { color: var(--od-muted); font-weight: 600; }
                    .od-now {
                        font-size: 10px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
                        color: var(--od-good); background: var(--od-good-bg); border: 1px solid #bbf7d0;
                        padding: 2px 8px; border-radius: 999px;
                    }
                    .od-step.is-cancelled .od-now { color: var(--od-bad); background: var(--od-bad-bg); border-color: #fecaca; }
                    .od-step-desc { margin: 4px 0 0; font-size: 12px; line-height: 1.55; color: var(--od-muted); }
                    .od-step-time { display: block; margin-top: 5px; font-size: 11.5px; color: #94a3b8; }
                    .od-step-pending { display: block; margin-top: 4px; font-size: 12px; color: #94a3b8; }

                    /* ── Items ── */
                    .od-item {
                        display: grid; grid-template-columns: 64px minmax(0, 1fr) auto;
                        gap: 14px; align-items: center;
                        padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
                    }
                    .od-item:last-child { border-bottom: none; }
                    .od-thumb {
                        width: 64px; height: 84px; border-radius: 9px; overflow: hidden;
                        background: #f1f5f9; border: 1px solid var(--od-border);
                    }
                    .od-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
                    .od-item-info { min-width: 0; }
                    .od-item-title {
                        display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
                        overflow: hidden; margin-bottom: 5px;
                        font-size: 14px; font-weight: 700; line-height: 1.4;
                        color: var(--od-ink); text-decoration: none; overflow-wrap: anywhere;
                        transition: color .15s;
                    }
                    .od-item-title:hover { color: var(--od-brand); }
                    .od-item-unit { font-size: 12px; color: var(--od-muted); }
                    .od-item-total {
                        text-align: right; font-size: 15px; font-weight: 800;
                        color: var(--od-ink); white-space: nowrap;
                    }
                    .od-item-total small {
                        display: block; margin-top: 3px;
                        font-size: 11px; font-weight: 600; color: var(--od-muted);
                    }

                    /* ── Summary ── */
                    .od-side { position: sticky; top: calc(var(--nb-header-h, 0px) + 16px); }
                    .od-summary-body { padding: 18px 20px 20px; }
                    .od-row {
                        display: flex; justify-content: space-between; align-items: baseline;
                        gap: 12px; margin-bottom: 10px; font-size: 13.5px; color: var(--od-muted);
                    }
                    .od-row b { color: var(--od-ink); font-weight: 700; }
                    .od-row .od-free-tag { color: var(--od-good); font-weight: 800; }
                    .od-total-row {
                        display: flex; justify-content: space-between; align-items: baseline;
                        gap: 12px; margin-top: 4px; padding-top: 14px;
                        border-top: 1px dashed var(--od-border);
                    }
                    .od-total-label { font-size: 14px; font-weight: 800; color: var(--od-ink); }
                    .od-total-value { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: var(--od-ink); }
                    .od-payment {
                        display: flex; align-items: flex-start; gap: 10px;
                        margin: 16px 0; padding: 11px 12px; border-radius: 10px;
                        background: var(--od-good-bg); border: 1px solid #bbf7d0;
                    }
                    .od-payment i { font-size: 18px; color: var(--od-good); line-height: 1.2; }
                    .od-payment strong { display: block; font-size: 12px; font-weight: 700; color: #166534; }
                    .od-payment span { display: block; margin-top: 1px; font-size: 11.5px; color: var(--od-good); }
                    .od-cancel {
                        width: 100%; display: flex; align-items: center; justify-content: center; gap: 7px;
                        padding: 11px; border: 1px solid #fecaca; border-radius: 11px;
                        background: var(--od-bad-bg); color: var(--od-bad);
                        font: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
                        transition: background .15s, border-color .15s;
                    }
                    .od-cancel:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; }
                    .od-cancel:disabled { opacity: 0.65; cursor: not-allowed; }

                    /* ── Address ── */
                    .od-address-body { padding: 16px 20px 18px; }
                    .od-address-name { margin: 0 0 2px; font-size: 13px; font-weight: 800; color: var(--od-ink); }
                    .od-address-line { margin: 0; font-size: 12.5px; line-height: 1.6; color: var(--od-muted); }

                    /* ── Banner / error states ── */
                    .od-banner-error {
                        display: flex; align-items: center; gap: 9px; margin-bottom: 16px;
                        padding: 11px 14px; border-radius: 10px;
                        background: var(--od-bad-bg); border: 1px solid #fecaca;
                        color: var(--od-bad); font-size: 12.5px; font-weight: 600;
                    }
                    .od-error {
                        padding: 54px 24px; text-align: center;
                        background: var(--od-surface); border: 1px solid var(--od-border);
                        border-radius: 20px; box-shadow: 0 18px 45px -36px rgba(15, 23, 42, 0.35);
                    }
                    .od-error-icon {
                        display: flex; align-items: center; justify-content: center;
                        width: 84px; height: 84px; margin: 0 auto 18px; border-radius: 50%;
                        background: var(--od-bad-bg); color: var(--od-bad); font-size: 32px;
                    }
                    .od-error h2 {
                        margin: 0 0 7px; font-size: 20px; font-weight: 800;
                        letter-spacing: -0.01em; color: var(--od-ink);
                    }
                    .od-error p {
                        max-width: 380px; margin: 0 auto 22px;
                        font-size: 13.5px; line-height: 1.65; color: var(--od-muted);
                    }
                    .od-error-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; }
                    .od-cta, .od-cta-secondary {
                        display: inline-flex; align-items: center; gap: 8px;
                        padding: 11px 18px; border-radius: 11px;
                        font: inherit; font-size: 13px; font-weight: 800;
                        text-decoration: none; cursor: pointer; transition: background .18s, color .18s, border-color .18s;
                    }
                    .od-cta {
                        border: none; background: var(--od-brand); color: #fff;
                        box-shadow: 0 12px 24px -14px rgba(232, 64, 28, 0.6);
                    }
                    .od-cta:hover { background: var(--od-brand-dark); color: #fff; }
                    .od-cta-secondary {
                        border: 1px solid var(--od-border); background: var(--od-surface); color: var(--od-ink);
                    }
                    .od-cta-secondary:hover { border-color: var(--od-brand); color: var(--od-brand); }

                    /* ── Skeleton ── */
                    .od-skeleton { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 24px; align-items: start; }
                    .od-skel-card {
                        padding: 20px; background: var(--od-surface);
                        border: 1px solid var(--od-border); border-radius: 18px;
                    }
                    .od-skel {
                        border-radius: 8px;
                        background: linear-gradient(90deg, #eef2f7 25%, #f8fafc 37%, #eef2f7 63%);
                        background-size: 400% 100%;
                        animation: odShimmer 1.4s ease infinite;
                    }
                    .od-skel-line { height: 12px; }
                    .od-skel-thumb { width: 64px; height: 84px; }
                    .od-skel-row { display: grid; grid-template-columns: 64px 1fr; gap: 14px; margin-bottom: 18px; }
                    @keyframes odShimmer {
                        0% { background-position: 100% 0; }
                        100% { background-position: 0 0; }
                    }

                    /* ── Responsive ── */
                    @media (max-width: 1080px) {
                        .od-grid, .od-skeleton { grid-template-columns: 1fr; }
                        .od-side { position: static; }
                    }
                    @media (max-width: 640px) {
                        .od-page { padding-top: 12px; }
                        .od-shell { padding: 0 12px; }
                        .od-head { align-items: flex-start; margin-bottom: 16px; }
                        .od-title { font-size: 22px; }
                        .od-title > i { font-size: 20px; }
                        .od-grid { gap: 16px; }
                        .od-card + .od-card { margin-top: 16px; }
                        .od-card-head { padding: 14px 16px; }
                        .od-timeline { padding: 16px 16px 0; }
                        .od-step { grid-template-columns: 34px minmax(0, 1fr); gap: 12px; }
                        .od-step:not(:last-child)::before { left: 16px; top: 34px; }
                        .od-step-dot { width: 34px; height: 34px; font-size: 14px; }
                        .od-item {
                            grid-template-columns: 56px minmax(0, 1fr);
                            grid-template-areas: "thumb info" "thumb total";
                            gap: 6px 12px; align-items: start; padding: 14px 16px;
                        }
                        .od-thumb { grid-area: thumb; width: 56px; height: 74px; margin-top: 2px; }
                        .od-item-info { grid-area: info; }
                        .od-item-total {
                            grid-area: total; text-align: left; display: flex;
                            align-items: baseline; flex-wrap: wrap; gap: 4px 8px;
                        }
                        .od-item-total small { display: inline; margin-top: 0; }
                        .od-summary-body { padding: 16px; }
                        .od-address-body { padding: 14px 16px 16px; }
                        .od-error { padding: 40px 18px; }
                    }
                `}</style>

                <div className="od-shell">
                    <nav className="od-crumbs" aria-label="Breadcrumb">
                        <Link to="/">Home</Link>
                        <i className="bi bi-chevron-right od-crumb-sep" aria-hidden="true"></i>
                        <Link to="/orders">My Orders</Link>
                        <i className="bi bi-chevron-right od-crumb-sep" aria-hidden="true"></i>
                        <span className="od-crumb-current">{isValidId ? `Order #${parsedId}` : "Order"}</span>
                    </nav>

                    {/* Loading */}
                    {loading && (
                        <>
                            <p className="od-sr-only" role="status">Loading your order…</p>
                            <div className="od-skeleton" aria-hidden="true">
                                <div>
                                    <div className="od-skel-card" style={{ marginBottom: "20px" }}>
                                        <div className="od-skel od-skel-line" style={{ width: "38%", marginBottom: "18px" }}></div>
                                        <div className="od-skel od-skel-line" style={{ width: "70%", marginBottom: "12px" }}></div>
                                        <div className="od-skel od-skel-line" style={{ width: "52%" }}></div>
                                    </div>
                                    <div className="od-skel-card">
                                        {[0, 1].map((row) => (
                                            <div className="od-skel-row" key={row}>
                                                <div className="od-skel od-skel-thumb"></div>
                                                <div>
                                                    <div className="od-skel od-skel-line" style={{ width: "64%", marginBottom: "10px" }}></div>
                                                    <div className="od-skel od-skel-line" style={{ width: "34%" }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="od-skel-card">
                                    <div className="od-skel od-skel-line" style={{ width: "46%", marginBottom: "18px" }}></div>
                                    <div className="od-skel od-skel-line" style={{ width: "100%", height: "96px" }}></div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Not found */}
                    {!loading && notFound && (
                        <div className="od-error" role="alert">
                            <div className="od-error-icon"><i className="bi bi-receipt" aria-hidden="true"></i></div>
                            <h2>Order not found</h2>
                            <p>We couldn't find this order, or it doesn't belong to your account.</p>
                            <div className="od-error-actions">
                                <Link to="/orders" className="od-cta">
                                    <i className="bi bi-bag" aria-hidden="true"></i>
                                    Back to my orders
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && !notFound && error && (
                        <div className="od-error" role="alert">
                            <div className="od-error-icon"><i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i></div>
                            <h2>We couldn't load this order</h2>
                            <p>{error}</p>
                            <div className="od-error-actions">
                                <button type="button" className="od-cta" onClick={() => fetchOrder(true)}>
                                    <i className="bi bi-arrow-clockwise" aria-hidden="true"></i>
                                    Try again
                                </button>
                                <Link to="/orders" className="od-cta-secondary">Back to my orders</Link>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    {!loading && !notFound && !error && order && (
                        <>
                            <header className="od-head">
                                <div>
                                    <h1 className="od-title">
                                        <i className="bi bi-receipt" aria-hidden="true"></i>
                                        Order #{order.orderId}
                                        <span className={`od-badge is-${currentStatus.toLowerCase()}`}>
                                            <i className={`bi ${ORDER_STATUS_META[currentStatus].icon}`} aria-hidden="true"></i>
                                            {ORDER_STATUS_META[currentStatus].label}
                                        </span>
                                    </h1>
                                    <div className="od-head-meta">
                                        <span><i className="bi bi-calendar3" aria-hidden="true"></i>{formatDate(order.orderDate)}</span>
                                        <span><i className="bi bi-bag" aria-hidden="true"></i>{totalQuantity} item{totalQuantity !== 1 ? "s" : ""}</span>
                                        <span><i className="bi bi-cash-coin" aria-hidden="true"></i>Cash on Delivery</span>
                                    </div>
                                </div>
                                <Link to="/orders" className="od-back">
                                    <i className="bi bi-arrow-left" aria-hidden="true"></i>
                                    My Orders
                                </Link>
                            </header>

                            {actionError && (
                                <div className="od-banner-error" role="alert">
                                    <i className="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                                    {actionError}
                                </div>
                            )}

                            <div className="od-grid">
                                <div>
                                    <section className="od-card" aria-label="Order timeline">
                                        <div className="od-card-head">
                                            <h2><i className="bi bi-signpost-split" aria-hidden="true"></i>Order timeline</h2>
                                            <span className="od-card-count">{ORDER_STATUS_META[currentStatus].label}</span>
                                        </div>
                                        <ol className="od-timeline">
                                            {timelineEvents.map((event, index) => {
                                                const meta = ORDER_STATUS_META[event.status];
                                                const isCurrent = index === timelineEvents.length - 1;
                                                const isCancelled = event.status === "Cancelled";
                                                return (
                                                    <li
                                                        className={`od-step is-done${isCurrent ? " is-current" : ""}${isCancelled ? " is-cancelled" : ""}`}
                                                        key={`${event.status}-${index}`}
                                                        aria-current={isCurrent ? "step" : undefined}
                                                    >
                                                        <span className="od-step-dot">
                                                            <i className={`bi ${meta.icon}`} aria-hidden="true"></i>
                                                        </span>
                                                        <div className="od-step-body">
                                                            <div className="od-step-top">
                                                                <strong>{meta.timelineLabel}</strong>
                                                                {isCurrent && <span className="od-now">Current</span>}
                                                            </div>
                                                            <p className="od-step-desc">{meta.description}</p>
                                                            {event.changedAt && (
                                                                <time className="od-step-time" dateTime={event.changedAt}>
                                                                    {formatDateTime(event.changedAt)}
                                                                </time>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                            {upcomingSteps.map((status) => {
                                                const meta = ORDER_STATUS_META[status];
                                                return (
                                                    <li className="od-step is-upcoming" key={status}>
                                                        <span className="od-step-dot">
                                                            <i className={`bi ${meta.icon}`} aria-hidden="true"></i>
                                                        </span>
                                                        <div className="od-step-body">
                                                            <div className="od-step-top">
                                                                <strong>{meta.timelineLabel}</strong>
                                                            </div>
                                                            <span className="od-step-pending">Waiting for this step</span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    </section>

                                    <section className="od-card" aria-label="Ordered books">
                                        <div className="od-card-head">
                                            <h2><i className="bi bi-book" aria-hidden="true"></i>Books in this order</h2>
                                            <span className="od-card-count">{order.items.length} line{order.items.length !== 1 ? "s" : ""}</span>
                                        </div>
                                        {order.items.map((item) => (
                                            <article className="od-item" key={item.orderItemId}>
                                                <div className="od-thumb">
                                                    <img
                                                        src={item.imageUrl || PLACEHOLDER_IMG}
                                                        alt={item.title || `Book #${item.bookId}`}
                                                        loading="lazy"
                                                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                                                    />
                                                </div>
                                                <div className="od-item-info">
                                                    <Link to={`/books/${item.bookId}`} className="od-item-title">
                                                        {item.title || `Book #${item.bookId}`}
                                                    </Link>
                                                    <div className="od-item-unit">
                                                        ৳ {currency.format(item.price)} each · Qty {item.quantity}
                                                    </div>
                                                </div>
                                                <div className="od-item-total">
                                                    ৳ {currency.format(item.price * item.quantity)}
                                                    <small>{item.quantity} × ৳ {currency.format(item.price)}</small>
                                                </div>
                                            </article>
                                        ))}
                                    </section>
                                </div>

                                <aside className="od-side">
                                    <div className="od-card">
                                        <div className="od-card-head">
                                            <h2><i className="bi bi-receipt-cutoff" aria-hidden="true"></i>Payment summary</h2>
                                        </div>
                                        <div className="od-summary-body">
                                            <div className="od-row">
                                                <span>Subtotal</span>
                                                <b>৳ {currency.format(subtotal)}</b>
                                            </div>
                                            <div className="od-row">
                                                <span>Delivery charge</span>
                                                {deliveryCharge === 0 ? (
                                                    <b className="od-free-tag">FREE</b>
                                                ) : (
                                                    <b>৳ {currency.format(deliveryCharge)}</b>
                                                )}
                                            </div>
                                            <div className="od-total-row">
                                                <span className="od-total-label">Total</span>
                                                <span className="od-total-value">৳ {currency.format(grandTotal)}</span>
                                            </div>
                                            <div className="od-payment">
                                                <i className="bi bi-cash-coin" aria-hidden="true"></i>
                                                <div>
                                                    <strong>Cash on Delivery</strong>
                                                    <span>Pay when you receive your order.</span>
                                                </div>
                                            </div>
                                            {currentStatus === "Pending" && (
                                                <button
                                                    type="button"
                                                    className="od-cancel"
                                                    onClick={handleCancel}
                                                    disabled={cancelling}
                                                >
                                                    {cancelling ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                                            Cancelling…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="bi bi-x-circle" aria-hidden="true"></i>
                                                            Cancel order
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {order.address && (
                                        <div className="od-card">
                                            <div className="od-card-head">
                                                <h2><i className="bi bi-geo-alt" aria-hidden="true"></i>Delivery address</h2>
                                            </div>
                                            <div className="od-address-body">
                                                <p className="od-address-line">{order.address.street}</p>
                                                <p className="od-address-line">
                                                    {order.address.city}
                                                    {order.address.stateOrDivision && order.address.stateOrDivision !== order.address.city
                                                        ? `, ${order.address.stateOrDivision}`
                                                        : ""}
                                                </p>
                                                <p className="od-address-line">
                                                    {[order.address.postalCode, order.address.country].filter(Boolean).join(", ")}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </aside>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
