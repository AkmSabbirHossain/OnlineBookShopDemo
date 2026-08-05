// =============================================
// SalesAnalytics.tsx — Daily & Monthly Sales
// =============================================

import { useMemo, useState } from "react";
import type { OrderResponseDto } from "../../types/order.types";

interface Props {
    orders: OrderResponseDto[];
}

type Period = "7days" | "30days" | "12months";

// ── Helper: format date ──
const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const formatMonth = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });

// ── Bar Chart Component ──
function BarChart({
    data,
    color = "#6366f1",
}: {
    data: { label: string; value: number }[];
    color?: string;
}) {
    const max = Math.max(...data.map((d) => d.value), 1);

    return (
        <div className="d-flex align-items-end gap-1 w-100" style={{ height: "160px" }}>
            {data.map((d, i) => (
                <div
                    key={i}
                    className="d-flex flex-column align-items-center flex-fill"
                    style={{ minWidth: 0 }}
                >
                    {/* Value on top */}
                    {d.value > 0 && (
                        <span
                            style={{
                                fontSize: "9px",
                                color: "#64748b",
                                marginBottom: "2px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            ৳{d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}k` : d.value}
                        </span>
                    )}

                    {/* Bar */}
                    <div
                        style={{
                            width: "100%",
                            height: `${Math.max((d.value / max) * 130, d.value > 0 ? 4 : 0)}px`,
                            background: d.value > 0
                                ? `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`
                                : "#f1f5f9",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.4s ease",
                            cursor: "default",
                        }}
                        title={`${d.label}: ৳${d.value}`}
                    />

                    {/* Label */}
                    <span
                        style={{
                            fontSize: "9px",
                            color: "#94a3b8",
                            marginTop: "4px",
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

// ── Stat Card ──
function StatCard({
    icon,
    label,
    value,
    sub,
    color,
}: {
    icon: string;
    label: string;
    value: string;
    sub?: string;
    color: string;
}) {
    return (
        <div className="card border-0 rounded-3 h-100" style={{ background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="card-body p-3">
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "44px", height: "44px", background: `${color}18` }}
                    >
                        <i className={`bi ${icon}`} style={{ fontSize: "20px", color }}></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p className="text-muted mb-0" style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {label}
                        </p>
                        <h5 className="fw-bold mb-0" style={{ fontSize: "20px", color: "#1e293b" }}>{value}</h5>
                        {sub && <p className="mb-0 text-muted" style={{ fontSize: "11px" }}>{sub}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SalesAnalytics({ orders }: Props) {
    const [period, setPeriod] = useState<Period>("30days");

    // ── Only delivered/paid orders count as sales ──
    const salesOrders = useMemo(() =>
        orders.filter((o) =>
            o.status === "Delivered" ||
            o.status === "Paid" ||
            o.status === "Shipped" ||
            (o.status as unknown as number) === 3 || // Delivered
            (o.status as unknown as number) === 1 || // Paid
            (o.status as unknown as number) === 2    // Shipped
        ),
        [orders]
    );

    // ── Summary stats ──
    const totalRevenue = useMemo(() =>
        salesOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0),
        [salesOrders]
    );

    const totalOrders = orders.length;
    const completedOrders = salesOrders.length;

    const pendingOrders = useMemo(() =>
        orders.filter((o) =>
            o.status === "Pending" || (o.status as unknown as number) === 0
        ).length,
        [orders]
    );

    // ── Best selling book ──
    const bestBook = useMemo(() => {
        const bookCount: Record<string, { title: string; count: number }> = {};
        orders.forEach((o) => {
            o.items?.forEach((item) => {
                const key = item.bookId?.toString() ?? "";
                if (!bookCount[key]) bookCount[key] = { title: item.bookTitle ?? "Unknown", count: 0 };
                bookCount[key].count += item.quantity ?? 1;
            });
        });
        const sorted = Object.values(bookCount).sort((a, b) => b.count - a.count);
        return sorted[0] ?? null;
    }, [orders]);

    // ── Chart data ──
    const chartData = useMemo(() => {
        const now = new Date();

        if (period === "7days" || period === "30days") {
            const days = period === "7days" ? 7 : 30;
            const result: { label: string; value: number; date: Date }[] = [];

            for (let i = days - 1; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(now.getDate() - i);
                d.setHours(0, 0, 0, 0);
                result.push({ label: formatDate(d.toISOString()), value: 0, date: d });
            }

            orders.forEach((o) => {
                const orderDate = new Date(o.createdAt ?? o.orderDate ?? "");
                orderDate.setHours(0, 0, 0, 0);
                const found = result.find((r) => r.date.getTime() === orderDate.getTime());
                if (found) found.value += o.totalAmount ?? 0;
            });

            // For 30 days, show every 5th label to avoid crowding
            return result.map((r, i) => ({
                label: period === "30days" && i % 5 !== 0 ? "" : r.label,
                value: Math.round(r.value),
            }));
        }

        if (period === "12months") {
            const result: { label: string; value: number; year: number; month: number }[] = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                result.push({
                    label: formatMonth(d.toISOString()),
                    value: 0,
                    year: d.getFullYear(),
                    month: d.getMonth(),
                });
            }

            orders.forEach((o) => {
                const d = new Date(o.createdAt ?? o.orderDate ?? "");
                const found = result.find(
                    (r) => r.year === d.getFullYear() && r.month === d.getMonth()
                );
                if (found) found.value += o.totalAmount ?? 0;
            });

            return result.map((r) => ({ label: r.label, value: Math.round(r.value) }));
        }

        return [];
    }, [orders, period]);

    const chartRevenue = chartData.reduce((s, d) => s + d.value, 0);
    const chartLabel = period === "7days" ? "Last 7 Days" : period === "30days" ? "Last 30 Days" : "Last 12 Months";

    // ── Recent orders table ──
    const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt ?? b.orderDate ?? "").getTime() - new Date(a.createdAt ?? a.orderDate ?? "").getTime())
        .slice(0, 5);

    const getStatusBadge = (status: string | number) => {
        const s = typeof status === "number"
            ? ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"][status] ?? "Unknown"
            : status;
        const map: Record<string, string> = {
            Pending: "bg-warning text-dark",
            Paid: "bg-info text-white",
            Shipped: "bg-primary",
            Delivered: "bg-success",
            Cancelled: "bg-danger",
        };
        return { label: s, cls: map[s] ?? "bg-secondary" };
    };

    return (
        <div>

            {/* ── Stat Cards ── */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <StatCard
                        icon="bi-currency-dollar"
                        label="Total Revenue"
                        value={`৳${totalRevenue.toLocaleString()}`}
                        sub={`${completedOrders} completed`}
                        color="#10b981"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <StatCard
                        icon="bi-bag-check"
                        label="Total Orders"
                        value={totalOrders.toString()}
                        sub={`${pendingOrders} pending`}
                        color="#6366f1"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <StatCard
                        icon="bi-graph-up-arrow"
                        label="Avg. Order Value"
                        value={totalOrders > 0 ? `৳${Math.round(totalRevenue / totalOrders).toLocaleString()}` : "৳0"}
                        sub="per order"
                        color="#f59e0b"
                    />
                </div>
                <div className="col-6 col-lg-3">
                    <StatCard
                        icon="bi-trophy"
                        label="Best Seller"
                        value={bestBook ? `${bestBook.count} sold` : "—"}
                        sub={bestBook?.title ?? "No sales yet"}
                        color="#e8401c"
                    />
                </div>
            </div>

            {/* ── Revenue Chart ── */}
            <div className="card border-0 rounded-3 mb-4" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="card-body p-4">
                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
                        <div>
                            <h6 className="fw-bold mb-0">Revenue Overview</h6>
                            <p className="text-muted small mb-0">
                                {chartLabel}: <strong className="text-success">৳{chartRevenue.toLocaleString()}</strong>
                            </p>
                        </div>

                        {/* Period selector */}
                        <div className="btn-group btn-group-sm">
                            {(["7days", "30days", "12months"] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    className={`btn ${period === p ? "btn-primary" : "btn-outline-secondary"}`}
                                    onClick={() => setPeriod(p)}
                                    style={{ fontSize: "12px" }}
                                >
                                    {p === "7days" ? "7 Days" : p === "30days" ? "30 Days" : "12 Months"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {chartData.every((d) => d.value === 0) ? (
                        <div className="text-center py-4">
                            <i className="bi bi-bar-chart text-muted" style={{ fontSize: "40px" }}></i>
                            <p className="text-muted mt-2 mb-0">No sales data for this period</p>
                        </div>
                    ) : (
                        <BarChart data={chartData} color="#6366f1" />
                    )}
                </div>
            </div>

            {/* ── Recent Orders ── */}
            <div className="card border-0 rounded-3" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">Recent Orders</h6>

                    {recentOrders.length === 0 ? (
                        <div className="text-center py-4">
                            <i className="bi bi-inbox text-muted" style={{ fontSize: "36px" }}></i>
                            <p className="text-muted mt-2 mb-0">No orders yet</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                                <thead className="table-light">
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Date</th>
                                        <th>Items</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((o) => {
                                        const badge = getStatusBadge(o.status);
                                        return (
                                            <tr key={o.orderId}>
                                                <td>
                                                    <span className="badge bg-light text-dark border">
                                                        #{o.orderId}
                                                    </span>
                                                </td>
                                                <td className="text-muted">
                                                    {new Date(o.createdAt ?? o.orderDate ?? "").toLocaleDateString("en-GB", {
                                                        day: "2-digit", month: "short", year: "numeric"
                                                    })}
                                                </td>
                                                <td>
                                                    {o.items?.length ?? 0} item{(o.items?.length ?? 0) !== 1 ? "s" : ""}
                                                </td>
                                                <td className="fw-semibold text-success">
                                                    ৳{(o.totalAmount ?? 0).toLocaleString()}
                                                </td>
                                                <td>
                                                    <span className={`badge ${badge.cls}`} style={{ fontSize: "11px" }}>
                                                        {badge.label}
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
            </div>

        </div>
    );
}