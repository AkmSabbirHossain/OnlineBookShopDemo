// =============================================
// VendorDashboardPage.tsx — Vendor workspace
// =============================================

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import VendorStats from "../components/vendor/VendorStats";
import VendorOverview from "../components/vendor/VendorOverview";
import BookTable from "../components/vendor/BookTable";
import BookFormModal from "../components/vendor/BookFormModal";
import VendorOrders from "../components/vendor/VendorOrders";
import VendorProfileTab from "../components/vendor/VendorProfileTab";
import VendorSidebar from "../components/vendor/VendorSidebar";
import type { VendorTab } from "../components/vendor/VendorSidebar";
import ChangePassword from "../components/profile/ChangePassword";
import { StockHistoryTable } from "../components/StockHistory/StockHistoryTable";
import SalesAnalytics from "../components/vendor/SalesAnalytics";
import VendorEarningsPage from "../components/vendor/VendorEarningsPage";
import VendorService from "../services/vendor.service";
import BookService from "../services/book.service";
import OrderService from "../services/order.service";
import type { VendorResponseDto } from "../types/vendor.types";
import type {
    BookResponseDto,
    BookCreateDto,
    BookUpdateDto,
    CategoryResponseDto,
} from "../types/book.types";
import type { OrderResponseDto, OrderStatus } from "../types/order.types";
import { normalizeStatus } from "../components/vendor/vendorUtils";
import "../components/vendor/vendor-ui.css";

const TAB_HEADINGS: Record<VendorTab, { title: string; subtitle: string }> = {
    overview: {
        title: "Overview",
        subtitle: "A quick look at how your shop is performing.",
    },
    books: {
        title: "Inventory",
        subtitle: "Manage titles, pricing and storefront visibility.",
    },
    orders: {
        title: "Orders",
        subtitle: "Confirm payments, ship and deliver customer orders.",
    },
    sales: {
        title: "Sales analytics",
        subtitle: "Revenue trends and your best-selling titles.",
    },
    earnings: {
        title: "Earnings",
        subtitle: "Pending balance and payout history.",
    },
    stockHistory: {
        title: "Stock history",
        subtitle: "Every stock movement across your titles.",
    },
    profile: {
        title: "Shop profile",
        subtitle: "Store identity shown to customers.",
    },
    security: {
        title: "Security",
        subtitle: "Keep your vendor account protected.",
    },
};

export default function VendorDashboardPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<VendorTab>("overview");
    const [vendor, setVendor] = useState<VendorResponseDto | null>(null);
    const [books, setBooks] = useState<BookResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [orders, setOrders] = useState<OrderResponseDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isSuspended, setIsSuspended] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editBook, setEditBook] = useState<BookResponseDto | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<BookResponseDto | null>(null);
    const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
    const [selectedBookId, setSelectedBookId] = useState<number | undefined>(undefined);
    const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

    const showToast = useCallback((msg: string, type: "success" | "danger" = "success") => {
        setToast({ msg, type });
        window.setTimeout(() => setToast(null), 3200);
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");
        setIsSuspended(false);
        try {
            const [vendorData, booksData, catsData] = await Promise.all([
                VendorService.getMyProfile(),
                VendorService.getMyBooks(),
                BookService.getCategories(),
            ]);
            setVendor(vendorData);
            setBooks(booksData);
            setCategories(catsData);

            if (vendorData.isApproved && vendorData.isActive) {
                const ordersData = await OrderService.getVendorOrders();
                setOrders(ordersData);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const status = err.response?.status;
                const message = (err.response?.data?.message as string)?.toLowerCase() || "";
                if (status === 403 && message.includes("suspend")) {
                    setIsSuspended(true);
                } else if (status === 404) {
                    setError("vendor_not_registered");
                } else if (status === 403) {
                    setError("vendor_pending");
                } else {
                    setError(
                        (err.response?.data?.message as string) ||
                            (err.response?.data?.Error as string) ||
                            "Could not load your workspace."
                    );
                }
            } else {
                setError("Something went wrong while loading your workspace.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const pendingOrders = orders.filter((o) => normalizeStatus(o.status) === "Pending").length;
    const lowStockCount = books.filter((b) => b.stock <= (b.lowStockThreshold ?? 5)).length;

    async function handleSubmit(dto: BookCreateDto | BookUpdateDto) {
        setSaving(true);
        try {
            if (editBook) {
                const updated = await VendorService.updateBook(editBook.bookId, dto as BookUpdateDto);
                setBooks((prev) => prev.map((b) => (b.bookId === updated.bookId ? updated : b)));
                showToast("Book updated.");
            } else {
                const created = await VendorService.createBook(dto as BookCreateDto);
                setBooks((prev) => [created, ...prev]);
                showToast("Book added to your catalogue.");
            }
            setShowModal(false);
            setEditBook(null);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err)
                ? (err.response?.data?.message as string) ||
                  (err.response?.data?.Error as string) ||
                  "Operation failed."
                : "Operation failed.";
            showToast(message, "danger");
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        const bookId = deleteTarget.bookId;
        setDeletingId(bookId);
        try {
            await VendorService.deleteBook(bookId);
            setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
            showToast("Book deleted.");
        } catch {
            showToast("Could not delete this book.", "danger");
        } finally {
            setDeletingId(null);
            setDeleteTarget(null);
        }
    }

    async function handleToggleStatus(
        book: BookResponseDto,
        patch: { isActive?: boolean; isFeatured?: boolean }
    ) {
        setStatusUpdatingId(book.bookId);
        try {
            const updated = await VendorService.setBookStatus(book.bookId, patch);
            setBooks((prev) => prev.map((b) => (b.bookId === updated.bookId ? updated : b)));
            showToast(
                patch.isFeatured !== undefined
                    ? updated.isFeatured
                        ? "Marked as featured."
                        : "Removed from featured."
                    : updated.isActive
                      ? "Book is now live on the storefront."
                      : "Book hidden from the storefront."
            );
        } catch {
            showToast("Could not update book status.", "danger");
        } finally {
            setStatusUpdatingId(null);
        }
    }

    function handleStatusUpdated(orderId: number, newStatus: OrderStatus) {
        setOrders((prev) =>
            prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
        );
        showToast(`Order #${orderId} marked as ${newStatus}.`);
    }

    if (isSuspended) {
        return (
            <>
                <Navbar />
                <div className="vp-shell" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="vp-card vp-empty" style={{ padding: "56px 24px" }}>
                        <div className="vp-empty-icon" style={{ background: "#fdecec", color: "#dc2626" }}>
                            <i className="bi bi-shield-slash"></i>
                        </div>
                        <h4>Vendor access suspended</h4>
                        <p>
                            The platform administrator has temporarily suspended your shop. Contact
                            support to resolve this.
                        </p>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <button
                                type="button"
                                className="vp-btn vp-btn-primary"
                                onClick={() => navigate("/vendor/contact-admin")}
                            >
                                Contact support
                            </button>
                            <button
                                type="button"
                                className="vp-btn"
                                onClick={() => navigate("/auth")}
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="vp-shell">
                {loading && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <div className="vp-skeleton" style={{ height: 40, width: 220, marginBottom: 22 }}></div>
                        <div className="vp-kpi-grid">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="vp-skeleton" style={{ height: 118 }}></div>
                            ))}
                        </div>
                        <div className="vp-skeleton" style={{ height: 320 }}></div>
                    </div>
                )}

                {!loading && error === "vendor_not_registered" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <div className="vp-card vp-empty" style={{ padding: "56px 24px" }}>
                            <div className="vp-empty-icon">
                                <i className="bi bi-shop"></i>
                            </div>
                            <h4>Open your vendor store</h4>
                            <p>
                                You don't have a merchant account yet. Apply once and start
                                listing your books after approval.
                            </p>
                            <button
                                type="button"
                                className="vp-btn vp-btn-primary"
                                onClick={() => navigate("/vendor/register")}
                            >
                                <i className="bi bi-shop-window"></i>
                                Apply as a book merchant
                            </button>
                        </div>
                    </div>
                )}

                {!loading && error && error !== "vendor_not_registered" && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <div className="vp-alert danger" role="alert">
                            <i className="bi bi-exclamation-octagon"></i>
                            <div>
                                <strong>Workspace unavailable</strong>
                                <p>
                                    {error === "vendor_pending"
                                        ? "Your vendor account is awaiting administrator approval."
                                        : error}
                                </p>
                            </div>
                            <button type="button" className="vp-btn vp-btn-sm" onClick={loadData}>
                                <i className="bi bi-arrow-clockwise"></i>
                                Retry
                            </button>
                        </div>
                    </div>
                )}

                {!loading && vendor && !vendor.isApproved && (
                    <div style={{ gridColumn: "1 / -1" }}>
                        <div className="vp-card">
                            <div className="vp-card-body" style={{ padding: 32 }}>
                                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                                    <div
                                        className="vp-empty-icon"
                                        style={{ marginBottom: 0, background: "#fef6e7", color: "#b45309" }}
                                    >
                                        <i className="bi bi-hourglass-split"></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 className="vp-title" style={{ fontSize: 19 }}>
                                            Shop verification in progress
                                        </h3>
                                        <p className="vp-subtitle" style={{ marginTop: 6 }}>
                                            Hi {vendor.shopName} — your application is with our team.
                                            You'll unlock inventory, orders and analytics as soon as
                                            it's approved.
                                        </p>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 10,
                                                flexWrap: "wrap",
                                                marginTop: 20,
                                            }}
                                        >
                                            {[
                                                { label: "Application submitted", done: true },
                                                { label: "Admin review", done: false },
                                                { label: "Store goes live", done: false },
                                            ].map((step, i) => (
                                                <div
                                                    key={step.label}
                                                    className="vp-item"
                                                    style={{ flex: "1 1 180px" }}
                                                >
                                                    <span
                                                        className="vp-nav-icon"
                                                        style={{
                                                            background: step.done
                                                                ? "#e9f8f0"
                                                                : "#f1f5f9",
                                                            color: step.done
                                                                ? "#0f8a4e"
                                                                : "#94a3b8",
                                                        }}
                                                    >
                                                        <i
                                                            className={`bi ${
                                                                step.done
                                                                    ? "bi-check-lg"
                                                                    : "bi-circle"
                                                            }`}
                                                        ></i>
                                                    </span>
                                                    <div>
                                                        <p className="vp-list-title">{step.label}</p>
                                                        <p className="vp-list-sub">Step {i + 1}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {!loading && vendor && vendor.isApproved && (
                    <>
                        <VendorSidebar
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            vendor={vendor}
                            pendingOrders={pendingOrders}
                            lowStock={lowStockCount}
                        />

                        <main className="vp-main">
                            <div className="vp-topbar">
                                <div>
                                    <p className="vp-eyebrow">Vendor portal</p>
                                    <h1 className="vp-title">{TAB_HEADINGS[activeTab].title}</h1>
                                    <p className="vp-subtitle">{TAB_HEADINGS[activeTab].subtitle}</p>
                                </div>
                                <div className="vp-actions">
                                    <button
                                        type="button"
                                        className="vp-btn"
                                        onClick={loadData}
                                        title="Refresh workspace data"
                                    >
                                        <i className="bi bi-arrow-clockwise"></i>
                                        Refresh
                                    </button>
                                    {(activeTab === "books" || activeTab === "overview") && (
                                        <button
                                            type="button"
                                            className="vp-btn vp-btn-primary"
                                            onClick={() => {
                                                setEditBook(null);
                                                setShowModal(true);
                                            }}
                                        >
                                            <i className="bi bi-plus-lg"></i>
                                            Add book
                                        </button>
                                    )}
                                </div>
                            </div>

                            {activeTab === "overview" && (
                                <VendorOverview
                                    vendor={vendor}
                                    books={books}
                                    orders={orders}
                                    onNavigate={setActiveTab}
                                    onAddBook={() => {
                                        setEditBook(null);
                                        setShowModal(true);
                                    }}
                                />
                            )}

                            {activeTab === "books" && (
                                <>
                                    <VendorStats books={books} />
                                    <BookTable
                                        books={books}
                                        categories={categories}
                                        onEdit={(book) => {
                                            setEditBook(book);
                                            setShowModal(true);
                                        }}
                                        onDelete={(bookId) =>
                                            setDeleteTarget(
                                                books.find((b) => b.bookId === bookId) ?? null
                                            )
                                        }
                                        deletingId={deletingId}
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        onToggleStatus={handleToggleStatus}
                                        statusUpdatingId={statusUpdatingId}
                                    />
                                </>
                            )}

                            {activeTab === "orders" && (
                                <VendorOrders orders={orders} onStatusUpdated={handleStatusUpdated} />
                            )}

                            {activeTab === "sales" && <SalesAnalytics orders={orders} />}

                            {activeTab === "earnings" && (
                                <VendorEarningsPage vendorId={vendor.vendorId} />
                            )}

                            {activeTab === "stockHistory" && (
                                <div className="vp-card">
                                    <div className="vp-card-head">
                                        <h3 className="vp-card-title">
                                            <i className="bi bi-journals"></i>
                                            Stock movements
                                        </h3>
                                        <div className="vp-filters">
                                            <select
                                                className="vp-select"
                                                value={selectedBookId ?? ""}
                                                onChange={(e) =>
                                                    setSelectedBookId(
                                                        e.target.value
                                                            ? Number(e.target.value)
                                                            : undefined
                                                    )
                                                }
                                                aria-label="Filter stock history by book"
                                            >
                                                <option value="">All books (recent 50)</option>
                                                {books.map((b) => (
                                                    <option key={b.bookId} value={b.bookId}>
                                                        {b.title}
                                                    </option>
                                                ))}
                                            </select>
                                            {selectedBookId && (
                                                <button
                                                    type="button"
                                                    className="vp-btn vp-btn-sm"
                                                    onClick={() => setSelectedBookId(undefined)}
                                                >
                                                    <i className="bi bi-x"></i>
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="vp-card-body">
                                        <StockHistoryTable bookId={selectedBookId} />
                                    </div>
                                </div>
                            )}

                            {activeTab === "profile" && (
                                <VendorProfileTab
                                    vendor={vendor}
                                    onProfileUpdated={setVendor}
                                    showToast={showToast}
                                />
                            )}

                            {activeTab === "security" && (
                                <div className="vp-card">
                                    <div className="vp-card-head">
                                        <h3 className="vp-card-title">
                                            <i className="bi bi-shield-lock"></i>
                                            Change password
                                        </h3>
                                    </div>
                                    <div className="vp-card-body">
                                        <ChangePassword />
                                    </div>
                                </div>
                            )}
                        </main>
                    </>
                )}
            </div>

            <BookFormModal
                show={showModal}
                editBook={editBook}
                categories={categories}
                onClose={() => {
                    setShowModal(false);
                    setEditBook(null);
                }}
                onSubmit={handleSubmit}
                saving={saving}
                onBookUpdated={(updated) => {
                    setBooks((prev) => prev.map((b) => (b.bookId === updated.bookId ? updated : b)));
                    setEditBook(updated);
                }}
            />

            {deleteTarget && (
                <div
                    className="vp-modal-backdrop"
                    role="presentation"
                    onClick={() => !deletingId && setDeleteTarget(null)}
                >
                    <div
                        className="vp-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Delete book confirmation"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4>Delete “{deleteTarget.title}”?</h4>
                        <p>
                            The title is removed from your catalogue and storefront. Existing
                            orders keep their records.
                        </p>
                        <div className="vp-modal-actions">
                            <button
                                type="button"
                                className="vp-btn"
                                onClick={() => setDeleteTarget(null)}
                                disabled={!!deletingId}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="vp-btn vp-btn-danger"
                                onClick={confirmDelete}
                                disabled={!!deletingId}
                            >
                                {deletingId ? (
                                    <span className="spinner-border spinner-border-sm" />
                                ) : (
                                    <i className="bi bi-trash3"></i>
                                )}
                                Delete book
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className={`vp-toast ${toast.type}`} role="status" aria-live="polite">
                    <i
                        className={`bi ${
                            toast.type === "success"
                                ? "bi-check-circle-fill"
                                : "bi-exclamation-octagon-fill"
                        }`}
                    ></i>
                    {toast.msg}
                </div>
            )}
        </>
    );
}
