// =============================================
// VendorOrders.tsx — Vendor order management
// =============================================

import { Fragment, useMemo, useState } from "react";
import axios from "axios";
import OrderService from "../../services/order.service";
import type { OrderResponseDto, OrderStatus } from "../../types/order.types";
import {
    formatDate,
    formatTaka2,
    NEXT_VENDOR_STATUSES,
    normalizeStatus,
    orderOwnTotal,
    PLACEHOLDER_COVER,
    STATUS_META,
} from "./vendorUtils";

interface Props {
    orders: OrderResponseDto[];
    onStatusUpdated: (orderId: number, newStatus: OrderStatus) => void;
}

const STATUS_FILTERS: ("All" | OrderStatus)[] = [
    "All",
    "Pending",
    "Paid",
    "Shipped",
    "Delivered",
    "Cancelled",
];

const ACTION_LABEL: Record<OrderStatus, string> = {
    Pending: "Mark pending",
    Paid: "Confirm payment",
    Shipped: "Mark shipped",
    Delivered: "Mark delivered",
    Cancelled: "Cancel order",
};

function StatusPill({ status }: { status: OrderStatus }) {
    const meta = STATUS_META[status];
    return (
        <span className={`vp-pill ${meta.cls}`}>
            <i className={`bi ${meta.icon}`}></i>
            {meta.label}
        </span>
    );
}

export default function VendorOrders({ orders, onStatusUpdated }: Props) {
    const [filterStatus, setFilterStatus] = useState<"All" | OrderStatus>("All");
    const [query, setQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [rowError, setRowError] = useState<{ id: number; message: string } | null>(null);
    const [confirm, setConfirm] = useState<{ order: OrderResponseDto; next: OrderStatus } | null>(
        null
    );

    const counts = useMemo(() => {
        const map: Record<string, number> = { All: orders.length };
        for (const order of orders) {
            const status = normalizeStatus(order.status);
            map[status] = (map[status] ?? 0) + 1;
        }
        return map;
    }, [orders]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return orders.filter((order) => {
            const status = normalizeStatus(order.status);
            const matchesStatus = filterStatus === "All" || status === filterStatus;
            const matchesQuery =
                !q ||
                order.orderId.toString().includes(q) ||
                order.items.some((i) => i.title.toLowerCase().includes(q));
            return matchesStatus && matchesQuery;
        });
    }, [orders, filterStatus, query]);

    const applyStatus = async (order: OrderResponseDto, next: OrderStatus) => {
        setUpdatingId(order.orderId);
        setRowError(null);
        try {
            await OrderService.updateStatus(order.orderId, next);
            onStatusUpdated(order.orderId, next);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setRowError({
                    id: order.orderId,
                    message:
                        err.response?.data?.error ||
                        err.response?.data?.Error ||
                        "Could not update this order.",
                });
            } else {
                setRowError({ id: order.orderId, message: "Something went wrong." });
            }
        } finally {
            setUpdatingId(null);
            setConfirm(null);
        }
    };

    return (
        <>
            <div className="vp-card">
                <div className="vp-card-head">
                    <h3 className="vp-card-title">
                        <i className="bi bi-bag-check"></i>
                        Orders
                        <span className="vp-count">{orders.length}</span>
                    </h3>
                    <div className="vp-search" style={{ width: 230 }}>
                        <i className="bi bi-search"></i>
                        <input
                            className="vp-input"
                            type="search"
                            placeholder="Search order # or book"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search orders"
                        />
                    </div>
                </div>

                <div
                    className="vp-filters"
                    style={{ padding: "12px 18px", borderBottom: "1px solid #e6ebf2" }}
                >
                    {STATUS_FILTERS.map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`vp-chip ${filterStatus === status ? "active" : ""}`}
                            onClick={() => setFilterStatus(status)}
                        >
                            {status}
                            <span className="count">{counts[status] ?? 0}</span>
                        </button>
                    ))}
                </div>

                {filtered.length === 0 ? (
                    <div className="vp-empty">
                        <div className="vp-empty-icon">
                            <i className="bi bi-box-seam"></i>
                        </div>
                        <h4>{orders.length === 0 ? "No orders yet" : "No matching orders"}</h4>
                        <p>
                            {orders.length === 0
                                ? "When customers buy your books, their orders show up here."
                                : "Try another status filter or search term."}
                        </p>
                    </div>
                ) : (
                    <div className="vp-table-wrap">
                        <table className="vp-table">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Your total</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((order) => {
                                    const status = normalizeStatus(order.status);
                                    const nextStatuses = NEXT_VENDOR_STATUSES[status] ?? [];
                                    const isExpanded = expandedId === order.orderId;
                                    const isUpdating = updatingId === order.orderId;

                                    return (
                                        <Fragment key={order.orderId}>
                                            <tr>
                                                <td>
                                                    <p
                                                        className="vp-cell-title"
                                                        style={{ marginBottom: 2 }}
                                                    >
                                                        #{order.orderId}
                                                    </p>
                                                    {order.address && (
                                                        <p className="vp-cell-sub">
                                                            <i className="bi bi-geo-alt"></i>{" "}
                                                            {order.address.city}
                                                        </p>
                                                    )}
                                                </td>
                                                <td>{formatDate(order.orderDate)}</td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="vp-btn vp-btn-sm vp-btn-ghost"
                                                        onClick={() =>
                                                            setExpandedId(
                                                                isExpanded ? null : order.orderId
                                                            )
                                                        }
                                                        aria-expanded={isExpanded}
                                                    >
                                                        {order.items.length} item
                                                        {order.items.length !== 1 ? "s" : ""}
                                                        <i
                                                            className={`bi ${isExpanded ? "bi-chevron-up" : "bi-chevron-down"}`}
                                                        ></i>
                                                    </button>
                                                </td>
                                                <td>
                                                    <span
                                                        style={{
                                                            fontWeight: 800,
                                                            color: "#16233d",
                                                        }}
                                                    >
                                                        {formatTaka2(orderOwnTotal(order))}
                                                    </span>
                                                </td>
                                                <td>
                                                    <StatusPill status={status} />
                                                </td>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: 6,
                                                            justifyContent: "flex-end",
                                                            flexWrap: "wrap",
                                                        }}
                                                    >
                                                        {nextStatuses.length === 0 ? (
                                                            <span className="vp-cell-sub">
                                                                {status === "Delivered"
                                                                    ? "Completed"
                                                                    : "No action needed"}
                                                            </span>
                                                        ) : (
                                                            nextStatuses.map((next) => (
                                                                <button
                                                                    key={next}
                                                                    type="button"
                                                                    className={`vp-btn vp-btn-sm ${
                                                                        next === "Delivered"
                                                                            ? "vp-btn-primary"
                                                                            : next === "Cancelled"
                                                                              ? "vp-btn-danger"
                                                                              : ""
                                                                    }`}
                                                                    disabled={isUpdating}
                                                                    onClick={() =>
                                                                        setConfirm({
                                                                            order,
                                                                            next,
                                                                        })
                                                                    }
                                                                >
                                                                    {isUpdating ? (
                                                                        <span className="spinner-border spinner-border-sm" />
                                                                    ) : (
                                                                        <i
                                                                            className={`bi ${STATUS_META[next].icon}`}
                                                                        ></i>
                                                                    )}
                                                                    {ACTION_LABEL[next]}
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                    {rowError?.id === order.orderId && (
                                                        <p
                                                            style={{
                                                                color: "#dc2626",
                                                                fontSize: 11.5,
                                                                margin: "6px 0 0",
                                                                textAlign: "right",
                                                            }}
                                                        >
                                                            {rowError.message}
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>

                                            {isExpanded && (
                                                <tr key={`${order.orderId}-items`}>
                                                    <td colSpan={6} style={{ padding: 0 }}>
                                                        <div className="vp-items">
                                                            {order.items.map((item) => (
                                                                <div
                                                                    className="vp-item"
                                                                    key={item.orderItemId}
                                                                >
                                                                    <img
                                                                        src={
                                                                            item.imageUrl ||
                                                                            PLACEHOLDER_COVER
                                                                        }
                                                                        alt={item.title}
                                                                        onError={(e) =>
                                                                            (e.currentTarget.src =
                                                                                PLACEHOLDER_COVER)
                                                                        }
                                                                    />
                                                                    <div>
                                                                        <p
                                                                            className="vp-list-title"
                                                                            style={{ maxWidth: 240 }}
                                                                        >
                                                                            {item.title}
                                                                        </p>
                                                                        <p className="vp-list-sub">
                                                                            Qty {item.quantity} ×{" "}
                                                                            {formatTaka2(item.price)}
                                                                        </p>
                                                                    </div>
                                                                    <span className="vp-list-amount">
                                                                        {formatTaka2(
                                                                            item.price * item.quantity
                                                                        )}
                                                                    </span>
                                                                </div>
                                                            ))}

                                                            {order.address && (
                                                                <div
                                                                    className="vp-item"
                                                                    style={{ flex: "1 1 240px" }}
                                                                >
                                                                    <i
                                                                        className="bi bi-geo-alt-fill"
                                                                        style={{
                                                                            color: "#e8401c",
                                                                            fontSize: 16,
                                                                        }}
                                                                    ></i>
                                                                    <div>
                                                                        <p className="vp-list-title">
                                                                            Delivery address
                                                                        </p>
                                                                        <p className="vp-list-sub">
                                                                            {order.address.street},{" "}
                                                                            {order.address.city}
                                                                            {order.address
                                                                                .stateOrDivision
                                                                                ? `, ${order.address.stateOrDivision}`
                                                                                : ""}
                                                                            {order.address.postalCode
                                                                                ? ` - ${order.address.postalCode}`
                                                                                : ""}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {confirm && (
                <div
                    className="vp-modal-backdrop"
                    role="presentation"
                    onClick={() => !updatingId && setConfirm(null)}
                >
                    <div
                        className="vp-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Confirm order status change"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4>
                            {ACTION_LABEL[confirm.next]} for order #{confirm.order.orderId}?
                        </h4>
                        <p>
                            The customer receives a notification and an email about this status
                            change. This cannot be undone.
                        </p>
                        <div className="vp-modal-actions">
                            <button
                                type="button"
                                className="vp-btn"
                                onClick={() => setConfirm(null)}
                                disabled={!!updatingId}
                            >
                                Keep as is
                            </button>
                            <button
                                type="button"
                                className={confirm.next === "Cancelled" ? "vp-btn vp-btn-danger" : "vp-btn vp-btn-primary"}
                                onClick={() => applyStatus(confirm.order, confirm.next)}
                                disabled={!!updatingId}
                            >
                                {updatingId ? (
                                    <span className="spinner-border spinner-border-sm" />
                                ) : (
                                    <i className={`bi ${STATUS_META[confirm.next].icon}`}></i>
                                )}
                                Yes, {STATUS_META[confirm.next].label.toLowerCase()}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
