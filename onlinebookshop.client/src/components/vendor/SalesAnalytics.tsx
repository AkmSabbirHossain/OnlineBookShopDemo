// =============================================
// SalesAnalytics.tsx — Vendor sales insights
// =============================================

import { useMemo, useState } from "react";
import type { OrderResponseDto } from "../../types/order.types";
import {
    formatDate,
    formatTaka,
    normalizeStatus,
    orderOwnTotal,
    STATUS_META,
} from "./vendorUtils";

interface Props {
    orders: OrderResponseDto[];
}

type Period = "7days" | "30days" | "12months";

const SALE_STATUSES = ["Paid", "Shipped", "Delivered"];

function BarChart({ data, color = "#e8401c" }: { data: { label: string; value: number }[]; color?: string }) {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 170 }}>
            {data.map((d, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        flex: 1,
                        minWidth: 0,
                    }}
                >
                    {d.value > 0 && (
                        <span
                            style={{
                                fontSize: 9,
                                color: "#64748b",
                                marginBottom: 3,
                                whiteSpace: "nowrap",
                            }}
                        >
                            ৳{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                        </span>
                    )}
                    <div
                        style={{
                            width: "100%",
                            height: `${Math.max((d.value / max) * 130, d.value > 0 ? 4 : 0)}px`,
                            background: d.value > 0
                                ? `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
                                : "#f1f5f9",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.35s ease",
                        }}
                        title={`${d.label}: ৳${d.value}`}
                    />
                    <span
                        style={{
                            fontSize: 9,
                            color: "#94a3b8",
                            marginTop: 5,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "100%",
                            textAlign: "center",
                        }}
                    >
                        {d.label}
                    </span>
                </div>
            ))}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    sub,
    tone,
}: {
    icon: string;
    label: string;
    value: string;
    sub?: string;
    tone: string;
}) {
    return (
        <div className="vp-kpi">
            <div className="vp-kpi-top">
                <span className={`vp-kpi-icon ${tone}`}>
                    <i className={`bi ${icon}`}></i>
                </span>
            </div>
            <p className="vp-kpi-label">{label}</p>
            <p className="vp-kpi-value">{value}</p>
            {sub && <p className="vp-kpi-sub">{sub}</p>}
        </div>
    );
}

export default function SalesAnalytics({ orders }: Props) {
    const [period, setPeriod] = useState<Period>("30days");

    const salesOrders = useMemo(
        () => orders.filter((o) => SALE_STATUSES.includes(normalizeStatus(o.status))),
        [orders]
    );

    const totalRevenue = useMemo(
        () => salesOrders.reduce((sum, o) => sum + orderOwnTotal(o), 0),
        [salesOrders]
    );

    const pendingOrders = useMemo(
        () => orders.filter((o) => normalizeStatus(o.status) === "Pending").length,
        [orders]
    );

    const bestBook = useMemo(() => {
        const tally: Record<string, { title: string; count: number; revenue: number }> = {};
        salesOrders.forEach((order) => {
            order.items.forEach((item) => {
                const key = item.bookId?.toString() ?? item.title;
                if (!tally[key]) tally[key] = { title: item.title, count: 0, revenue: 0 };
                tally[key].count += item.quantity;
                tally[key].revenue += item.quantity * item.price;
            });
        });
        return Object.values(tally).sort((a, b) => b.count - a.count)[0] ?? null;
    }, [salesOrders]);

    const chartData = useMemo(() => {
        const now = new Date();

        if (period === "7days" || period === "30days") {
            const days = period === "7days" ? 7 : 30;
            const buckets: { label: string; value: number; date: Date }[] = [];

            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                d.setHours(0, 0, 0, 0);
                buckets.push({
                    label: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
                    value: 0,
                    date: d,
                });
            }

            salesOrders.forEach((order) => {
                const d = new Date(order.orderDate);
                d.setHours(0, 0, 0, 0);
                const bucket = buckets.find((b) => b.date.getTime() === d.getTime());
                if (bucket) bucket.value += orderOwnTotal(order);
            });

            return buckets.map((b, i) => ({
                label: period === "30days" && i % 5 !== 0 ? "" : b.label,
                value: Math.round(b.value),
            }));
        }

        const buckets: { label: string; value: number; year: number; month: number }[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            buckets.push({
                label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
                value: 0,
                year: d.getFullYear(),
                month: d.getMonth(),
            });
        }

        salesOrders.forEach((order) => {
            const d = new Date(order.orderDate);
            const bucket = buckets.find(
                (b) => b.year === d.getFullYear() && b.month === d.getMonth()
            );
            if (bucket) bucket.value += orderOwnTotal(order);
        });

        return buckets.map((b) => ({ label: b.label, value: Math.round(b.value) }));
    }, [salesOrders, period]);

    const chartRevenue = chartData.reduce((sum, d) => sum + d.value, 0);
    const chartLabel =
        period === "7days" ? "Last 7 days" : period === "30days" ? "Last 30 days" : "Last 12 months";

    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, 5);

    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return (
        <>
            <div className="vp-kpi-grid">
                <StatCard
                    icon="bi-cash-stack"
                    label="Revenue"
                    value={formatTaka(totalRevenue)}
                    sub={`${salesOrders.length} paid / shipped`}
                    tone="tone-green"
                />
                <StatCard
                    icon="bi-bag-check"
                    label="Orders"
                    value={orders.length.toString()}
                    sub={`${pendingOrders} pending`}
                    tone="tone-navy"
                />
                <StatCard
                    icon="bi-graph-up-arrow"
                    label="Avg. order value"
                    value={formatTaka(avgOrderValue)}
                    sub="Per order"
                    tone="tone-orange"
                />
                <StatCard
                    icon="bi-trophy"
                    label="Best seller"
                    value={bestBook ? `${bestBook.count} sold` : "—"}
                    sub={bestBook?.title ?? "No sales yet"}
                    tone="tone-amber"
                />
            </div>

            <div className="vp-card" style={{ marginBottom: 16 }}>
                <div className="vp-card-head">
                    <div>
                        <h3 className="vp-card-title">
                            <i className="bi bi-bar-chart-line"></i>
                            Revenue overview
                        </h3>
                        <p className="vp-card-title" style={{ fontWeight: 500, marginTop: 4, fontSize: 12.5 }}>
                            {chartLabel}: <strong style={{ color: "#0f9d58" }}>{formatTaka(chartRevenue)}</strong>
                        </p>
                    </div>
                    <div className="vp-filters">
                        {(["7days", "30days", "12months"] as Period[]).map((p) => (
                            <button
                                key={p}
                                type="button"
                                className={`vp-chip ${period === p ? "active" : ""}`}
                                onClick={() => setPeriod(p)}
                            >
                                {p === "7days" ? "7 days" : p === "30days" ? "30 days" : "12 months"}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="vp-card-body">
                    {chartData.every((d) => d.value === 0) ? (
                        <div className="vp-empty" style={{ padding: "28px 16px" }}>
                            <div className="vp-empty-icon">
                                <i className="bi bi-bar-chart"></i>
                            </div>
                            <h4>No sales in this period</h4>
                            <p>Delivered or paid orders will appear in this chart.</p>
                        </div>
                    ) : (
                        <BarChart data={chartData} />
                    )}
                </div>
            </div>

            <div className="vp-card">
                <div className="vp-card-head">
                    <h3 className="vp-card-title">
                        <i className="bi bi-clock-history"></i>
                        Recent orders
                    </h3>
                </div>
                {recentOrders.length === 0 ? (
                    <div className="vp-empty">
                        <div className="vp-empty-icon">
                            <i className="bi bi-inbox"></i>
                        </div>
                        <h4>No orders yet</h4>
                        <p>Your latest orders will be listed here.</p>
                    </div>
                ) : (
                    <div className="vp-table-wrap">
                        <table className="vp-table" style={{ minWidth: 560 }}>
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => {
                                    const status = normalizeStatus(order.status);
                                    const meta = STATUS_META[status];
                                    return (
                                        <tr key={order.orderId}>
                                            <td>
                                                <span style={{ fontWeight: 700, color: "#16233d" }}>
                                                    #{order.orderId}
                                                </span>
                                            </td>
                                            <td>{formatDate(order.orderDate)}</td>
                                            <td>{order.items.length}</td>
                                            <td>
                                                <span style={{ fontWeight: 700 }}>
                                                    {formatTaka(orderOwnTotal(order))}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`vp-pill ${meta.cls}`}>
                                                    <i className={`bi ${meta.icon}`}></i>
                                                    {meta.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
