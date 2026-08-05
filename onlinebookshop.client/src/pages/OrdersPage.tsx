// =============================================
// OrdersPage.tsx — 
// =============================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import OrderService from "../services/order.service";
import type { OrderResponseDto, OrderStatus } from "../types/order.types";

// ── Numeric enum → string ──
const STATUS_MAP: Record<number, OrderStatus> = {
    0: "Pending",
    1: "Paid",
    2: "Shipped",
    3: "Delivered",
    4: "Cancelled",
};

function getStatus(status: OrderStatus | number): OrderStatus {
    if (typeof status === "number") return STATUS_MAP[status] ?? "Pending";
    return status;
}

// ── Status badge ──
function StatusBadge({ status }: { status: OrderStatus }) {
    const config: Record<OrderStatus, { color: string; icon: string }> = {
        Pending: { color: "warning text-dark", icon: "bi-hourglass-split" },
        Paid: { color: "info text-dark", icon: "bi-credit-card" },
        Shipped: { color: "primary", icon: "bi-truck" },
        Delivered: { color: "success", icon: "bi-check-circle-fill" },
        Cancelled: { color: "danger", icon: "bi-x-circle" },
    };
    const { color, icon } = config[status] ?? { color: "secondary", icon: "bi-question" };
    return (
        <span className={`badge bg-${color} d-inline-flex align-items-center gap-1`}>
            <i className={`bi ${icon}`}></i>
            {status}
        </span>
    );
}

// ── Single Order Card ──
function OrderCard({
    order,
    onCancel,
    cancelling,
}: {
    order: OrderResponseDto;
    onCancel: (orderId: number) => void;
    cancelling: number | null;
}) {
    const [expanded, setExpanded] = useState(false);
    const currentStatus = getStatus(order.status);
    const canCancel = currentStatus === "Pending"; 

    return (
        <div className="card border-0 shadow-sm rounded-3 mb-3">
            <div className="card-body p-4">

                {/* Order Header */}
                <div className="row align-items-center g-2">
                    <div className="col-sm-auto">
                        <p className="text-muted small mb-0">Order ID</p>
                        <p className="fw-bold mb-0">#{order.orderId}</p>
                    </div>

                    <div className="col-sm-auto">
                        <p className="text-muted small mb-0">Date</p>
                        <p className="fw-semibold mb-0 small">
                            {new Date(order.orderDate).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })}
                        </p>
                    </div>

                    <div className="col-sm-auto">
                        <p className="text-muted small mb-0">Total</p>
                        <p className="fw-bold text-success mb-0">
                            ৳ {order.totalAmount.toFixed(2)}
                        </p>
                    </div>

                    <div className="col-sm-auto">
                        <p className="text-muted small mb-0">Items</p>
                        <p className="fw-semibold mb-0">{order.items.length} books</p>
                    </div>

                    <div className="col-sm-auto ms-sm-auto">
                        <StatusBadge status={currentStatus} />
                    </div>
                </div>

                <hr className="my-3" />

                {/* Items toggle */}
                <button
                    className="btn btn-link btn-sm p-0 text-decoration-none text-muted"
                    onClick={() => setExpanded((p) => !p)}
                >
                    <i className={`bi me-1 ${expanded ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                    {expanded ? "Hide items" : "Show items"}
                </button>

                {expanded && (
                    <div className="mt-3">
                        {order.items.map((item) => (
                            <div
                                key={item.orderItemId}
                                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                            >
                                <div>
                                    <Link
                                        to={`/books/${item.bookId}`}
                                        className="text-dark text-decoration-none fw-semibold small"
                                    >
                                        Book #{item.bookId}
                                    </Link>
                                    <span className="text-muted small ms-2">× {item.quantity}</span>
                                </div>
                                <span className="fw-semibold small text-success">
                                    ৳ {(item.price * item.quantity).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Cancel Button — only for Pending  */}
                {canCancel && (
                    <div className="mt-3">
                        <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => onCancel(order.orderId)}
                            disabled={cancelling === order.orderId}
                        >
                            {cancelling === order.orderId ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" />
                                    Cancelling...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-x-circle me-1"></i>
                                    Cancel Order
                                </>
                            )}
                        </button>
                        <small className="text-muted ms-2">
                            Only pending orders can be cancelled
                        </small>
                    </div>
                )}

            </div>
        </div>
    );
}

// =============================================
// MAIN PAGE
// =============================================
export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cancelling, setCancelling] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | "All">("All");

    const fetchOrders = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await OrderService.getMyOrders();
            // newest first
            setOrders(
                data.sort(
                    (a, b) =>
                        new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
                )
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to load orders.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancel = async (orderId: number) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        setCancelling(orderId);
        try {
            await OrderService.cancelOrder(orderId);
            // local state update — re-fetch 
            setOrders((prev) =>
                prev.map((o) =>
                    o.orderId === orderId ? { ...o, status: "Cancelled" as OrderStatus } : o
                )
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                alert(err.response?.data?.message || "Failed to cancel order.");
            } else {
                alert("Something went wrong.");
            }
        } finally {
            setCancelling(null);
        }
    };

    // ── Filter tabs ──
    const statuses: (OrderStatus | "All")[] = [
        "All", "Pending", "Paid", "Shipped", "Delivered", "Cancelled",
    ];

    const filtered =
        filterStatus === "All"
            ? orders
            : orders.filter((o) => getStatus(o.status) === filterStatus);

    return (
        <>
            <Navbar />

            <div className="bg-light min-vh-100 py-4">
                <div className="container" style={{ maxWidth: "860px" }}>

                    {/* Header */}
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                        <h4 className="fw-bold mb-0">
                            <i className="bi bi-bag me-2 text-primary"></i>
                            My Orders
                        </h4>
                        {!loading && orders.length > 0 && (
                            <span className="badge bg-primary rounded-pill fs-6">
                                {orders.length} total
                            </span>
                        )}
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-5">
                            <div
                                className="spinner-border text-primary"
                                style={{ width: "3rem", height: "3rem" }}
                            />
                            <p className="text-muted mt-3">Loading orders...</p>
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="alert alert-danger d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-triangle-fill"></i>
                            {error}
                            <button
                                className="btn btn-link btn-sm ms-auto p-0"
                                onClick={fetchOrders}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && orders.length === 0 && (
                        <div className="text-center py-5">
                            <div style={{ fontSize: "70px" }}>📦</div>
                            <h5 className="mt-3 fw-bold">No orders yet</h5>
                            <p className="text-muted">You haven't placed any orders yet.</p>
                            <Link to="/" className="btn btn-primary px-4">
                                <i className="bi bi-book me-2"></i>Browse Books
                            </Link>
                        </div>
                    )}

                    {/* Filter Tabs + Orders */}
                    {!loading && orders.length > 0 && (
                        <>
                            {/* Filter tabs */}
                            <div className="d-flex gap-2 flex-wrap mb-4">
                                {statuses.map((s) => {
                                    const count =
                                        s === "All"
                                            ? orders.length
                                            : orders.filter((o) => getStatus(o.status) === s).length;
                                    return (
                                        <button
                                            key={s}
                                            className={`btn btn-sm ${filterStatus === s ? "btn-dark" : "btn-outline-secondary"
                                                }`}
                                            onClick={() => setFilterStatus(s)}
                                        >
                                            {s}
                                            {count > 0 && (
                                                <span className="ms-1 badge bg-white text-dark">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Orders list */}
                            {filtered.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">No orders with this status.</p>
                                </div>
                            ) : (
                                filtered.map((order) => (
                                    <OrderCard
                                        key={order.orderId}
                                        order={order}
                                        onCancel={handleCancel}
                                        cancelling={cancelling}
                                    />
                                ))
                            )}
                        </>
                    )}

                </div>
            </div>
        </>
    );
}