// =============================================
// VendorOverview.tsx — Dashboard landing tab
// =============================================

import type { VendorResponseDto } from "../../types/vendor.types";
import type { BookResponseDto } from "../../types/book.types";
import type { OrderResponseDto } from "../../types/order.types";
import type { VendorTab } from "./VendorSidebar";
import {
    formatDate,
    formatTaka,
    normalizeStatus,
    orderOwnTotal,
    STATUS_META,
} from "./vendorUtils";

interface Props {
    vendor: VendorResponseDto;
    books: BookResponseDto[];
    orders: OrderResponseDto[];
    onNavigate: (tab: VendorTab) => void;
    onAddBook: () => void;
}

export default function VendorOverview({ vendor, books, orders, onNavigate, onAddBook }: Props) {
    const paidStatuses = ["Paid", "Shipped", "Delivered"];
    const revenueOrders = orders.filter((o) => paidStatuses.includes(normalizeStatus(o.status)));
    const revenue = revenueOrders.reduce((sum, o) => sum + orderOwnTotal(o), 0);

    const pendingOrders = orders.filter((o) => normalizeStatus(o.status) === "Pending");
    const lowStockBooks = books.filter(
        (b) => b.stock <= (b.lowStockThreshold ?? 5)
    );

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, 5);

    const profileFields = [
        vendor.logoUrl,
        vendor.bannerUrl,
        vendor.description,
        vendor.phoneNumber,
        vendor.address,
        vendor.city,
        vendor.businessRegistrationNumber,
    ];
    const completeness = Math.round(
        (profileFields.filter((f) => !!f && String(f).trim().length > 0).length /
            profileFields.length) *
            100
    );

    const kpis = [
        {
            label: "Revenue",
            value: formatTaka(revenue),
            sub: `${revenueOrders.length} paid / shipped orders`,
            icon: "bi-cash-stack",
            tone: "tone-green",
        },
        {
            label: "Total orders",
            value: orders.length.toString(),
            sub: `${pendingOrders.length} awaiting action`,
            icon: "bi-bag-check",
            tone: "tone-navy",
        },
        {
            label: "Pending fulfilment",
            value: pendingOrders.length.toString(),
            sub: pendingOrders.length > 0 ? "Confirm payment or cancel" : "All caught up",
            icon: "bi-hourglass-split",
            tone: pendingOrders.length > 0 ? "tone-amber" : "tone-slate",
        },
        {
            label: "Low stock alerts",
            value: lowStockBooks.length.toString(),
            sub: lowStockBooks.length > 0 ? "Titles need restocking" : "Inventory healthy",
            icon: "bi-exclamation-triangle",
            tone: lowStockBooks.length > 0 ? "tone-red" : "tone-slate",
        },
    ];

    return (
        <>
            <div className="vp-kpi-grid">
                {kpis.map((k) => (
                    <div className="vp-kpi" key={k.label}>
                        <div className="vp-kpi-top">
                            <span className={`vp-kpi-icon ${k.tone}`}>
                                <i className={`bi ${k.icon}`}></i>
                            </span>
                        </div>
                        <p className="vp-kpi-label">{k.label}</p>
                        <p className="vp-kpi-value">{k.value}</p>
                        <p className="vp-kpi-sub">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="vp-overview-grid">
                <div className="vp-stack">
                    <div className="vp-card">
                        <div className="vp-card-head">
                            <h3 className="vp-card-title">
                                <i className="bi bi-receipt"></i>
                                Recent orders
                            </h3>
                            <button
                                type="button"
                                className="vp-btn vp-btn-sm"
                                onClick={() => onNavigate("orders")}
                            >
                                All orders
                                <i className="bi bi-arrow-right"></i>
                            </button>
                        </div>
                        {recentOrders.length === 0 ? (
                            <div className="vp-empty">
                                <div className="vp-empty-icon">
                                    <i className="bi bi-inbox"></i>
                                </div>
                                <h4>No orders yet</h4>
                                <p>Orders containing your books will appear here.</p>
                            </div>
                        ) : (
                            <div className="vp-list">
                                {recentOrders.map((order) => {
                                    const status = normalizeStatus(order.status);
                                    const meta = STATUS_META[status];
                                    return (
                                        <div className="vp-list-row" key={order.orderId}>
                                            <div className="vp-list-main">
                                                <p className="vp-list-title">
                                                    Order #{order.orderId}
                                                    <span
                                                        className={`vp-pill ${meta.cls}`}
                                                        style={{ marginLeft: 8 }}
                                                    >
                                                        <i className={`bi ${meta.icon}`}></i>
                                                        {meta.label}
                                                    </span>
                                                </p>
                                                <p className="vp-list-sub">
                                                    {formatDate(order.orderDate)} ·{" "}
                                                    {order.items.length} item
                                                    {order.items.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <span className="vp-list-amount">
                                                {formatTaka(orderOwnTotal(order))}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="vp-card">
                        <div className="vp-card-head">
                            <h3 className="vp-card-title">
                                <i className="bi bi-exclamation-triangle"></i>
                                Stock alerts
                            </h3>
                            <button
                                type="button"
                                className="vp-btn vp-btn-sm"
                                onClick={() => onNavigate("books")}
                            >
                                Manage inventory
                                <i className="bi bi-arrow-right"></i>
                            </button>
                        </div>
                        {lowStockBooks.length === 0 ? (
                            <div className="vp-empty">
                                <div className="vp-empty-icon">
                                    <i className="bi bi-check2-circle"></i>
                                </div>
                                <h4>Everything in stock</h4>
                                <p>No titles are below their low-stock threshold.</p>
                            </div>
                        ) : (
                            <div className="vp-list">
                                {lowStockBooks.slice(0, 5).map((book) => {
                                    const threshold = book.lowStockThreshold ?? 5;
                                    const pct = Math.min(
                                        100,
                                        Math.round((book.stock / Math.max(threshold, 1)) * 100)
                                    );
                                    const tone =
                                        book.stock === 0
                                            ? "#dc2626"
                                            : book.stock <= threshold / 2
                                              ? "#e8401c"
                                              : "#f59e0b";
                                    return (
                                        <div className="vp-list-row" key={book.bookId}>
                                            <div className="vp-list-main">
                                                <p className="vp-list-title">{book.title}</p>
                                                <p className="vp-list-sub">
                                                    Threshold {threshold} ·{" "}
                                                    {book.isActive ? "Live" : "Hidden"}
                                                </p>
                                            </div>
                                            <div className="vp-stock">
                                                <div className="vp-stock-bar">
                                                    <span
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: tone,
                                                        }}
                                                    ></span>
                                                </div>
                                                <span className="vp-stock-num">
                                                    {book.stock} pcs
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="vp-stack">
                    <div className="vp-card">
                        <div className="vp-card-head">
                            <h3 className="vp-card-title">
                                <i className="bi bi-shop"></i>
                                Store snapshot
                            </h3>
                        </div>
                        <div className="vp-card-body">
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 12.5,
                                    marginBottom: 6,
                                }}
                            >
                                <span style={{ color: "#64748b", fontWeight: 600 }}>
                                    Profile completeness
                                </span>
                                <strong style={{ color: "#16233d" }}>{completeness}%</strong>
                            </div>
                            <div className="vp-progress">
                                <span style={{ width: `${completeness}%` }}></span>
                            </div>
                            {completeness < 100 && (
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "#64748b",
                                        margin: "10px 0 0",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    Add logo, banner and business details so buyers trust your shop.
                                </p>
                            )}

                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 12,
                                    marginTop: 18,
                                }}
                            >
                                <div
                                    style={{
                                        background: "#f8fafc",
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                    }}
                                >
                                    <p className="vp-kpi-label" style={{ marginBottom: 3 }}>
                                        Rating
                                    </p>
                                    <p style={{ margin: 0, fontWeight: 800, color: "#16233d" }}>
                                        <i
                                            className="bi bi-star-fill"
                                            style={{ color: "#f59e0b", fontSize: 13 }}
                                        ></i>{" "}
                                        {(vendor.averageRating ?? 0).toFixed(1)}
                                    </p>
                                    <p className="vp-kpi-sub" style={{ marginTop: 2 }}>
                                        {vendor.totalReviews ?? 0} reviews
                                    </p>
                                </div>
                                <div
                                    style={{
                                        background: "#f8fafc",
                                        borderRadius: 12,
                                        padding: "12px 14px",
                                    }}
                                >
                                    <p className="vp-kpi-label" style={{ marginBottom: 3 }}>
                                        Lifetime sales
                                    </p>
                                    <p style={{ margin: 0, fontWeight: 800, color: "#16233d" }}>
                                        {formatTaka(vendor.totalSales ?? 0)}
                                    </p>
                                    <p className="vp-kpi-sub" style={{ marginTop: 2 }}>
                                        All time
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                className="vp-btn"
                                style={{ width: "100%", marginTop: 16 }}
                                onClick={() => onNavigate("profile")}
                            >
                                <i className="bi bi-pencil-square"></i>
                                Edit shop profile
                            </button>
                        </div>
                    </div>

                    <div className="vp-card">
                        <div className="vp-card-head">
                            <h3 className="vp-card-title">
                                <i className="bi bi-lightning-charge"></i>
                                Quick actions
                            </h3>
                        </div>
                        <div className="vp-card-body" style={{ display: "grid", gap: 8 }}>
                            <button
                                type="button"
                                className="vp-btn vp-btn-primary"
                                onClick={onAddBook}
                            >
                                <i className="bi bi-plus-lg"></i>
                                Add a new book
                            </button>
                            <button
                                type="button"
                                className="vp-btn"
                                onClick={() => onNavigate("orders")}
                            >
                                <i className="bi bi-bag-check"></i>
                                Review orders
                            </button>
                            <button
                                type="button"
                                className="vp-btn"
                                onClick={() => onNavigate("earnings")}
                            >
                                <i className="bi bi-cash-coin"></i>
                                Check earnings
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
