// =============================================
// VendorOrders.tsx — Updated: address display added
// =============================================

import { useState } from "react";
import axios from "axios";
import OrderService from "../../services/order.service";
import type { OrderResponseDto, OrderStatus } from "../../types/order.types";

interface Props {
    orders: OrderResponseDto[];
    onStatusUpdated: (orderId: number, newStatus: OrderStatus) => void;
}

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

// ── Status config ──
const STATUS_CONFIG: Record<OrderStatus, { color: string; icon: string }> = {
    Pending: { color: "warning text-dark", icon: "bi-hourglass-split" },
    Paid: { color: "info text-dark", icon: "bi-credit-card" },
    Shipped: { color: "primary", icon: "bi-truck" },
    Delivered: { color: "success", icon: "bi-check-circle-fill" },
    Cancelled: { color: "danger", icon: "bi-x-circle" },
};

// ── Valid next statuses ──
const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
    Pending: ["Paid", "Shipped", "Cancelled"],
    Paid: ["Shipped", "Cancelled"],
    Shipped: ["Delivered"],
    Delivered: [],
    Cancelled: [],
};

function StatusBadge({ status }: { status: OrderStatus }) {
    const { color, icon } = STATUS_CONFIG[status];
    return (
        <span className={`badge bg-${color} d-inline-flex align-items-center gap-1`}>
            <i className={`bi ${icon}`}></i>
            {status}
        </span>
    );
}

// ── Single Order Row ──
function OrderRow({
    order,
    onStatusUpdated,
}: {
    order: OrderResponseDto;
    onStatusUpdated: (orderId: number, newStatus: OrderStatus) => void;
}) {
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState(false);

    const currentStatus = getStatus(order.status);
    const nextStatuses = NEXT_STATUSES[currentStatus] ?? [];

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (!window.confirm(`Change order #${order.orderId} status to "${newStatus}"?`)) return;
        setUpdating(true);
        setError("");
        try {
            await OrderService.updateStatus(order.orderId, newStatus);
            onStatusUpdated(order.orderId, newStatus);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.error || "Failed to update status.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setUpdating(false);
        }
    };

    return (
        <>
            <tr>
                {/* Order ID */}
                <td>
                    <span className="fw-bold">#{order.orderId}</span>
                </td>

                {/* Date */}
                <td>
                    <small className="text-muted">
                        {new Date(order.orderDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                        })}
                    </small>
                </td>

                {/* Delivery Address */}
                <td>
                    {order.address ? (
                        <div>
                            <p className="mb-0 small fw-semibold">
                                <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                                {order.address.street}
                            </p>
                            <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                {order.address.city}
                                {order.address.stateOrDivision ? `, ${order.address.stateOrDivision}` : ""}
                                {order.address.postalCode ? ` - ${order.address.postalCode}` : ""}
                            </p>
                            <p className="mb-0 text-muted" style={{ fontSize: "12px" }}>
                                {order.address.country}
                            </p>
                        </div>
                    ) : (
                        <span className="text-muted small">
                            <i className="bi bi-geo-alt me-1"></i>
                            Address #{order.addressId}
                        </span>
                    )}
                </td>

                {/* Items */}
                <td>
                    <button
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        onClick={() => setExpanded((p) => !p)}
                    >
                        {order.items.length} items
                        <i className={`bi ms-1 ${expanded ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                    </button>
                </td>

                {/* Total */}
                <td className="fw-bold text-success">
                    ৳ {order.totalAmount.toFixed(2)}
                </td>

                {/* Status */}
                <td>
                    <StatusBadge status={currentStatus} />
                </td>

                {/* Update Status */}
                <td>
                    {nextStatuses.length > 0 ? (
                        <div className="d-flex gap-1 flex-wrap">
                            {nextStatuses.map((s) => (
                                <button
                                    key={s}
                                    className={`btn btn-sm btn-outline-${STATUS_CONFIG[s].color.split(" ")[0]}`}
                                    onClick={() => handleStatusChange(s)}
                                    disabled={updating}
                                >
                                    {updating ? (
                                        <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                        <>
                                            <i className={`bi ${STATUS_CONFIG[s].icon} me-1`}></i>
                                            {s}
                                        </>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span className="text-muted small">
                            {currentStatus === "Delivered" ? "✅ Completed" : currentStatus === "Cancelled" ? "❌ Cancelled" : "—"}
                        </span>
                    )}
                    {error && <div className="text-danger small mt-1">{error}</div>}
                </td>
            </tr>

            {/* Expanded items */}
            {expanded && (
                <tr className="table-light">
                    <td colSpan={7} className="py-2 px-4">
                        <div className="d-flex flex-wrap gap-3">
                            {order.items.map((item) => (
                                <div
                                    key={item.orderItemId}
                                    className="d-flex align-items-center gap-2 bg-white rounded-3 px-3 py-2 border"
                                >
                                    <i className="bi bi-book text-primary"></i>
                                    <div>
                                        <small className="fw-semibold d-block">{item.title}</small>
                                        <small className="text-muted">
                                            Qty: {item.quantity} × ৳ {item.price.toFixed(2)}
                                        </small>
                                    </div>
                                    <span className="fw-bold text-success ms-2 small">
                                        ৳ {(item.quantity * item.price).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function VendorOrders({ orders, onStatusUpdated }: Props) {
    const [filterStatus, setFilterStatus] = useState<OrderStatus | "All">("All");

    const statuses: (OrderStatus | "All")[] = [
        "All", "Pending", "Paid", "Shipped", "Delivered", "Cancelled",
    ];

    const filtered =
        filterStatus === "All"
            ? orders
            : orders.filter((o) => getStatus(o.status) === filterStatus);

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-bag me-2 text-primary"></i>
                    Orders
                    <span className="badge bg-primary ms-2 rounded-pill">{orders.length}</span>
                </h6>

                {/* Status Filter */}
                <div className="d-flex gap-1 flex-wrap">
                    {statuses.map((s) => {
                        const count =
                            s === "All"
                                ? orders.length
                                : orders.filter((o) => getStatus(o.status) === s).length;
                        return (
                            <button
                                key={s}
                                className={`btn btn-sm ${filterStatus === s ? "btn-dark" : "btn-outline-secondary"}`}
                                onClick={() => setFilterStatus(s)}
                            >
                                {s}
                                {count > 0 && (
                                    <span className="ms-1 badge bg-white text-dark" style={{ fontSize: "10px" }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="card-body p-0">
                {filtered.length === 0 ? (
                    <div className="text-center py-5">
                        <div style={{ fontSize: "50px" }}>📦</div>
                        <p className="text-muted mt-2">No orders found.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Order ID</th>
                                    <th>Date</th>
                                    <th>Delivery Address</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Update Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => (
                                    <OrderRow
                                        key={order.orderId}
                                        order={order}
                                        onStatusUpdated={onStatusUpdated}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}