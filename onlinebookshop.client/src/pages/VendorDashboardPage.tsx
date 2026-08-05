// =============================================
// VendorDashboardPage.tsx — Fixed: StockHistoryTable with bookId filter
// =============================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import VendorStats from "../components/vendor/VendorStats";
import BookTable from "../components/vendor/BookTable";
import BookFormModal from "../components/vendor/BookFormModal";
import VendorOrders from "../components/vendor/VendorOrders";
import VendorProfileTab from "../components/vendor/VendorProfileTab";
import VendorSidebar from "../components/vendor/VendorSidebar";
import ChangePassword from "../components/profile/ChangePassword";
import { StockHistoryTable } from "../components/StockHistory/StockHistoryTable";
import SalesAnalytics from "../components/vendor/SalesAnalytics";

import VendorService from "../services/vendor.service";
import BookService from "../services/book.service";
import OrderService from "../services/order.service";

import type { VendorResponseDto } from "../types/vendor.types";
import type { BookResponseDto, BookCreateDto, BookUpdateDto, CategoryResponseDto } from "../types/book.types";
import type { OrderResponseDto, OrderStatus } from "../types/order.types";

type Tab = "books" | "orders" | "stockHistory" | "sales" | "profile" | "security";

export default function VendorDashboardPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<Tab>("books");
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
    const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

    // ── Stock History book filter ──
    const [selectedBookId, setSelectedBookId] = useState<number | undefined>(undefined);

    const showToast = (msg: string, type: "success" | "danger" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const fetchAll = async () => {
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
                    const message = err.response?.data?.message?.toLowerCase() || "";
                    if (status === 403 && (message.includes("suspended") || message.includes("suspend"))) {
                        setIsSuspended(true);
                    } else if (status === 404) {
                        setError("vendor_not_registered");
                    } else {
                        setError(err.response?.data?.message || "Data load failed.");
                    }
                } else {
                    setError("Something went wrong.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ── Suspended Screen ──
    if (isSuspended) {
        return (
            <>
                <Navbar />
                <div className="bg-light min-vh-100 d-flex align-items-center">
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-md-6 col-lg-5">
                                <div className="card border-0 shadow-lg text-center p-5 rounded-4 bg-white">
                                    <div className="bg-danger-subtle text-danger d-inline-flex p-4 rounded-circle mx-auto mb-4">
                                        <i className="bi bi-shield-slash fs-1"></i>
                                    </div>
                                    <h4 className="fw-bold text-dark">Account Suspended</h4>
                                    <p className="text-muted mt-2 small">
                                        Your vendor portal access has been temporarily revoked by the platform administrator.
                                    </p>
                                    <div className="mt-4 d-flex gap-2 justify-content-center">
                                        <button
                                            className="btn btn-primary px-4 btn-sm rounded-3 fw-semibold"
                                            onClick={() => navigate("/vendor/contact-admin")}
                                        >
                                            Contact Support
                                        </button>
                                        <button
                                            className="btn btn-light px-4 btn-sm rounded-3 text-muted"
                                            onClick={() => navigate("/auth")}
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="bg-light min-vh-100 py-4" style={{ backgroundColor: "#f8f9fa" }}>
                <div className="container-fluid px-md-5">

                    {/* Loading */}
                    {loading && (
                        <div className="text-center py-5 my-5">
                            <div
                                className="spinner-border text-primary"
                                role="status"
                                style={{ width: "2.5rem", height: "2.5rem", borderWidth: "3px" }}
                            />
                            <p className="text-muted mt-3 small fw-medium">Loading workspace data...</p>
                        </div>
                    )}

                    {/* Not registered */}
                    {!loading && error === "vendor_not_registered" && (
                        <div
                            className="text-center py-5 card border-0 shadow-sm p-5 bg-white rounded-4 mx-auto mt-4"
                            style={{ maxWidth: "500px" }}
                        >
                            <div className="display-4 mb-3">🏪</div>
                            <h4 className="fw-bold text-dark">Establish Vendor Store</h4>
                            <p className="text-muted small px-3">
                                You haven't initialized a bookstore merchant account under this login profile yet.
                            </p>
                            <button
                                className="btn btn-primary btn-md px-4 py-2 mt-2 rounded-3 shadow-sm fw-semibold mx-auto"
                                onClick={() => navigate("/vendor/register")}
                            >
                                <i className="bi bi-shop me-2"></i>Apply as Book Merchant
                            </button>
                        </div>
                    )}

                    {/* Pending approval */}
                    {!loading && vendor && !vendor.isApproved && (
                        <div className="alert bg-warning-subtle text-warning-emphasis border-0 shadow-sm d-flex align-items-center gap-3 mb-4 rounded-3 p-3">
                            <div
                                className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: "35px", height: "35px" }}
                            >
                                <i className="bi bi-hourglass-split fs-5"></i>
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold">Store Verification Pending</h6>
                                <p className="mb-0 small opacity-75">
                                    Full content generation capabilities will activate immediately upon administrative review.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Main Dashboard */}
                    {!loading && vendor && vendor.isApproved && (
                        <div className="row g-4">

                            {/* Sidebar */}
                            <div className="col-12 col-md-4 col-lg-3">
                                <VendorSidebar
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    vendor={vendor}
                                />
                            </div>

                            {/* Content */}
                            <div className="col-12 col-md-8 col-lg-9">

                                {/* Tab Header */}
                                {activeTab !== "profile" && activeTab !== "security" && (
                                    <div className="card border-0 shadow-sm p-4 bg-white rounded-4 mb-4">
                                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                                            <div>
                                                <h4 className="fw-bold mb-1 text-dark">
                                                    {activeTab === "books" && "Inventory Manager"}
                                                    {activeTab === "orders" && "Order Tracking"}
                                                    {activeTab === "stockHistory" && "Stock Audit Logs"}
                                                </h4>
                                                <p className="text-muted small mb-0">
                                                    Overview metrics and item specifications for your digital catalog.
                                                </p>
                                            </div>
                                            {activeTab === "books" && (
                                                <button
                                                    className="btn btn-primary btn-sm px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2"
                                                    style={{ borderRadius: "8px" }}
                                                    onClick={() => setShowModal(true)}
                                                >
                                                    <i className="bi bi-plus-circle-fill"></i> Add Book
                                                </button>
                                            )}
                                            {activeTab === "sales" && "Sales Analytics"}
                                        </div>
                                    </div>
                                )}

                                {/* ── Books Tab ── */}
                                {activeTab === "books" && (
                                    <>
                                        <VendorStats books={books} />
                                        <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mt-4">
                                            <BookTable
                                                books={books}
                                                categories={categories}
                                                onEdit={(book) => { setEditBook(book); setShowModal(true); }}
                                                onDelete={handleDelete}
                                                deletingId={deletingId}
                                                searchQuery={searchQuery}
                                                onSearchChange={setSearchQuery}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* ── Orders Tab ── */}
                                {activeTab === "orders" && (
                                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                                        <VendorOrders
                                            orders={orders}
                                            onStatusUpdated={handleStatusUpdated}
                                        />
                                    </div>
                                )}
                                {
                                    activeTab === "sales" && (
                                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                                            <SalesAnalytics orders={orders} />
                                        </div>
                                    )
                                }
                                {/* ── Stock History Tab ── */}
                                {activeTab === "stockHistory" && (
                                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">

                                        {/* Book filter */}
                                        <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="bi bi-funnel text-muted"></i>
                                                <span className="text-muted small fw-semibold">Filter by Book:</span>
                                            </div>
                                            <select
                                                className="form-select form-select-sm"
                                                style={{ maxWidth: "320px" }}
                                                value={selectedBookId ?? ""}
                                                onChange={(e) =>
                                                    setSelectedBookId(
                                                        e.target.value ? Number(e.target.value) : undefined
                                                    )
                                                }
                                            >
                                                <option value="">All Books (Recent 50)</option>
                                                {books.map((b) => (
                                                    <option key={b.bookId} value={b.bookId}>
                                                        {b.title}
                                                    </option>
                                                ))}
                                            </select>

                                            {selectedBookId && (
                                                <button
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={() => setSelectedBookId(undefined)}
                                                >
                                                    <i className="bi bi-x me-1"></i>Clear
                                                </button>
                                            )}
                                        </div>

                                        {/* ✅ bookId pass করো */}
                                        <StockHistoryTable bookId={selectedBookId} />
                                    </div>
                                )}

                                {/* ── Profile Tab ── */}
                                {activeTab === "profile" && (
                                    <VendorProfileTab
                                        vendor={vendor}
                                        onProfileUpdated={(updatedVendor) => setVendor(updatedVendor)}
                                        showToast={showToast}
                                    />
                                )}

                                {/* ── Security Tab ── */}
                                {activeTab === "security" && (
                                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                                        <ChangePassword />
                                    </div>
                                )}

                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Book Form Modal */}
            <BookFormModal
                show={showModal}
                editBook={editBook}
                categories={categories}
                onClose={() => { setShowModal(false); setEditBook(null); }}
                onSubmit={handleSubmit}
                saving={saving}
            />

            {/* Toast */}
            {toast && (
                <div
                    className="position-fixed bottom-0 end-0 m-4 shadow-lg d-flex align-items-center gap-2 py-3 px-4 text-white"
                    style={{
                        zIndex: 1060,
                        borderRadius: "12px",
                        backgroundColor: toast.type === "success" ? "#10b981" : "#ef4444",
                        minWidth: "260px",
                    }}
                >
                    <i className={`bi ${toast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-octagon-fill"} fs-5`}></i>
                    <span className="fw-medium small">{toast.msg}</span>
                </div>
            )}
        </>
    );

    async function handleSubmit(dto: BookCreateDto | BookUpdateDto) {
        setSaving(true);
        try {
            if (editBook) {
                await VendorService.updateBook(editBook.bookId, dto as BookUpdateDto);
                showToast("Book updated successfully!");
                setTimeout(() => window.location.reload(), 500);
            } else {
                const created = await VendorService.createBook(dto as BookCreateDto);
                setBooks((prev) => [created, ...prev]);
                showToast("Book added successfully!");
                setShowModal(false);
                setEditBook(null);
            }
        } catch (err: unknown) {
            console.error(err);
            showToast("Operation failed.", "danger");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(bookId: number) {
        if (!window.confirm("Delete this book?")) return;
        setDeletingId(bookId);
        try {
            await VendorService.deleteBook(bookId);
            setBooks((prev) => prev.filter((b) => b.bookId !== bookId));
            showToast("Book deleted successfully.");
        } catch (err: unknown) {
            console.error(err);
            showToast("Failed to delete book.", "danger");
        } finally {
            setDeletingId(null);
        }
    }

    function handleStatusUpdated(orderId: number, newStatus: OrderStatus) {
        setOrders((prev) =>
            prev.map((o) => (o.orderId === orderId ? { ...o, status: newStatus } : o))
        );
        showToast(`Order status updated to ${newStatus}`);
    }
}










//// =============================================
//// VendorDashboardPage.tsx
//// =============================================
//import { useState, useEffect } from "react";
//import { useNavigate } from "react-router-dom";
//import axios from "axios";
//import Navbar from "../components/common/Navbar";
//import VendorStats from "../components/vendor/VendorStats";
//import BookTable from "../components/vendor/BookTable";
//import BookFormModal from "../components/vendor/BookFormModal";
//import VendorOrders from "../components/vendor/VendorOrders";

//import VendorProfileTab from "../components/vendor/VendorProfileTab";
//import VendorSidebar from "../components/vendor/VendorSidebar";

//import VendorService from "../services/vendor.service";
//import BookService from "../services/book.service";
//import OrderService from "../services/order.service";

//import type { VendorResponseDto } from "../types/vendor.types";
//import type {
//    BookResponseDto,
//    BookCreateDto,
//    BookUpdateDto,
//    CategoryResponseDto,
//} from "../types/book.types";
//import type { OrderResponseDto, OrderStatus } from "../types/order.types";

//type Tab = "books" | "orders" | "profile";

//export default function VendorDashboardPage() {
//    const navigate = useNavigate();

//    const [activeTab, setActiveTab] = useState<Tab>("books");
//    const [vendor, setVendor] = useState<VendorResponseDto | null>(null);
//    const [books, setBooks] = useState<BookResponseDto[]>([]);
//    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
//    const [orders, setOrders] = useState<OrderResponseDto[]>([]);
//    const [loading, setLoading] = useState(true);
//    const [error, setError] = useState("");
//    const [isSuspended, setIsSuspended] = useState(false);
//    const [searchQuery, setSearchQuery] = useState("");
//    const [showModal, setShowModal] = useState(false);
//    const [editBook, setEditBook] = useState<BookResponseDto | null>(null);
//    const [saving, setSaving] = useState(false);
//    const [deletingId, setDeletingId] = useState<number | null>(null);
//    const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

//    const showToast = (msg: string, type: "success" | "danger" = "success") => {
//        setToast({ msg, type });
//        setTimeout(() => setToast(null), 3000);
//    };

//    // ── Fetch all data ──
//    useEffect(() => {
//        const fetchAll = async () => {
//            setLoading(true);
//            setError("");
//            setIsSuspended(false);
//            try {
//                const [vendorData, booksData, catsData] = await Promise.all([
//                    VendorService.getMyProfile(),
//                    VendorService.getMyBooks(),
//                    BookService.getCategories(),
//                ]);
//                setVendor(vendorData);
//                setBooks(booksData);
//                setCategories(catsData);

//                if (vendorData.isApproved && vendorData.isActive) {
//                    const ordersData = await OrderService.getVendorOrders();
//                    setOrders(ordersData);
//                }
//            } catch (err: unknown) {
//                if (axios.isAxiosError(err)) {
//                    const status = err.response?.status;
//                    const message = err.response?.data?.message?.toLowerCase() || "";
//                    if (status === 403 && (message.includes("suspended") || message.includes("suspend"))) {
//                        setIsSuspended(true);
//                    } else if (status === 404) {
//                        setError("vendor_not_registered");
//                    } else {
//                        setError(err.response?.data?.message || "Data load failed.");
//                    }
//                } else {
//                    setError("Something went wrong.");
//                }
//            } finally {
//                setLoading(false);
//            }
//        };
//        fetchAll();
//    }, []);

//    // ==================== Suspended Screen ====================
//    if (isSuspended) {
//        return (
//            <>
//                <Navbar />
//                <div className="bg-light min-vh-100 d-flex align-items-center">
//                    <div className="container">
//                        <div className="row justify-content-center">
//                            <div className="col-md-8 col-lg-6">
//                                <div className="card border-danger shadow">
//                                    <div className="card-body text-center p-5">
//                                        <i className="bi bi-exclamation-triangle-fill text-danger" style={{ fontSize: "4.5rem" }}></i>
//                                        <h3 className="mt-4 text-danger fw-bold">Your Account Has Been Suspended</h3>
//                                        <p className="lead text-muted mt-3">Your vendor account has been suspended by the admin.</p>
//                                        <p className="text-muted">Please contact the admin.</p>
//                                        <div className="mt-5 d-flex justify-content-center gap-3">
//                                            <button className="btn btn-outline-primary px-4" onClick={() => navigate('/vendor/contact-admin')}>
//                                                Contact Admin
//                                            </button>
//                                            <button className="btn btn-secondary px-4" onClick={() => navigate('/vendor/login')}>
//                                                Logout
//                                            </button>
//                                        </div>
//                                    </div>
//                                </div>
//                            </div>
//                        </div>
//                    </div>
//                </div>
//            </>
//        );
//    }

//    // ==================== Normal Dashboard ====================
//    return (
//        <>
//            <Navbar />
//            <div className="bg-light min-vh-100 py-4">
//                <div className="container-fluid px-md-5">

//                    {/* Loading */}
//                    {loading && (
//                        <div className="text-center py-5">
//                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
//                            <p className="text-muted mt-3">Loading dashboard...</p>
//                        </div>
//                    )}

//                    {/* Vendor Not Registered */}
//                    {!loading && error === "vendor_not_registered" && (
//                        <div className="text-center py-5">
//                            <div style={{ fontSize: "70px" }}>🏪</div>
//                            <h4 className="fw-bold mt-3">You are not registered as a Vendor</h4>
//                            <p className="text-muted mb-4">Register as a vendor to start selling books.</p>
//                            <button className="btn btn-primary btn-lg px-5" onClick={() => navigate("/vendor/register")}>
//                                <i className="bi bi-shop me-2"></i>Register as Vendor
//                            </button>
//                        </div>
//                    )}

//                    {/* Not Approved */}
//                    {!loading && vendor && !vendor.isApproved && (
//                        <div className="alert alert-warning d-flex align-items-center gap-3 mb-4">
//                            <i className="bi bi-hourglass-split fs-4"></i>
//                            <div>
//                                <strong>Your vendor account is pending approval.</strong>
//                                <p className="mb-0 small text-muted">You can add books after admin approval.</p>
//                            </div>
//                        </div>
//                    )}

//                    {/* General Error */}
//                    {!loading && error && error !== "vendor_not_registered" && (
//                        <div className="alert alert-danger d-flex align-items-center gap-2">
//                            <i className="bi bi-exclamation-triangle-fill"></i>
//                            {error}
//                        </div>
//                    )}

//                    {/* Main Content with Sidebar */}
//                    {!loading && vendor && vendor.isApproved && (
//                        <div className="row g-4">
//                            {/* LEFT SIDEBAR */}
//                            <div className="col-12 col-md-4 col-lg-3">
//                                <VendorSidebar
//                                    activeTab={activeTab}
//                                    setActiveTab={setActiveTab}
//                                    vendor={vendor}
//                                />
//                            </div>

//                            {/* RIGHT MAIN CONTENT */}
//                            <div className="col-12 col-md-8 col-lg-9">
//                                {activeTab !== "profile" && (
//                                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
//                                        <div>
//                                            <h4 className="fw-bold mb-0">
//                                                <i className="bi bi-shop me-2 text-primary"></i>
//                                                {vendor.shopName}
//                                            </h4>
//                                            <p className="text-muted small mb-0">Vendor Dashboard</p>
//                                        </div>
//                                        <button className="btn btn-success fw-semibold" onClick={() => setShowModal(true)}>
//                                            <i className="bi bi-plus-lg me-2"></i>Add Book
//                                        </button>
//                                    </div>
//                                )}

//                                {activeTab === "books" && (
//                                    <>
//                                        <VendorStats books={books} />
//                                        <BookTable
//                                            books={books}
//                                            onEdit={(book) => { setEditBook(book); setShowModal(true); }}
//                                            categories={categories}
//                                            onDelete={handleDelete}
//                                            deletingId={deletingId}
//                                            searchQuery={searchQuery}
//                                            onSearchChange={setSearchQuery}
//                                        />
//                                    </>
//                                )}

//                                {activeTab === "orders" && (
//                                    <VendorOrders orders={orders} onStatusUpdated={handleStatusUpdated} />
//                                )}

//                                {activeTab === "profile" && (
//                                    <VendorProfileTab
//                                        vendor={vendor}
//                                        onProfileUpdated={(updatedVendor) => setVendor(updatedVendor)}
//                                        showToast={showToast}
//                                    />
//                                )}
//                            </div>
//                        </div>
//                    )}
//                </div>
//            </div>

//            {/* Book Form Modal */}
//            <BookFormModal
//                show={showModal}
//                editBook={editBook}
//                categories={categories}
//                onClose={() => { setShowModal(false); setEditBook(null); }}
//                onSubmit={handleSubmit}
//                saving={saving}
//            />

//            {/* Toast */}
//            {toast && (
//                <div className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type} shadow`}>
//                    {toast.msg}
//                </div>
//            )}
//        </>
//    );

//    // ── Handlers ──
//    async function handleSubmit(dto: BookCreateDto | BookUpdateDto) {
//        setSaving(true);
//        try {
//            if (editBook) {
//                const updated = await VendorService.updateBook(editBook.bookId, dto as BookUpdateDto);
//                setBooks(prev => prev.map(b => b.bookId === editBook.bookId ? updated : b));
//                showToast("Book updated successfully!");
//            } else {
//                const created = await VendorService.createBook(dto as BookCreateDto);
//                setBooks(prev => [created, ...prev]);
//                showToast("Book added successfully!");
//            }
//            setShowModal(false);
//            setEditBook(null);
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                setError(err.response?.data?.message || "Operation failed.");
//            } else {
//                setError("Something went wrong.");
//            }
//        } finally {
//            setSaving(false);
//        }
//    }

//    async function handleDelete(bookId: number) {
//        if (!window.confirm("Delete this book?")) return;
//        setDeletingId(bookId);
//        try {
//            await VendorService.deleteBook(bookId);
//            setBooks(prev => prev.filter(b => b.bookId !== bookId));
//            showToast("Book deleted successfully.");
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                setError(err.response?.data?.message || "Failed to delete book.");
//            } else {
//                setError("Something went wrong.");
//            }
//        } finally {
//            setDeletingId(null);
//        }
//    }

//    function handleStatusUpdated(orderId: number, newStatus: OrderStatus) {
//        setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: newStatus } : o));
//        showToast(`Order status updated to ${newStatus}`);
//    }
//}