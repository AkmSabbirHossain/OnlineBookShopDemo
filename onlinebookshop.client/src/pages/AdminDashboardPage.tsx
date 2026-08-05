// =============================================
// AdminDashboardPage.tsx — Fixed Version
// =============================================
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import AdminStats from "../components/admin/AdminStats";
import VendorApprovalTable from "../components/admin/VendorApprovalTable";
import ActiveVendorTable from "../components/admin/ActiveVendorTable";
import CategoryManager from "../components/admin/CategoryManager";

import AdminService from "../services/admin.service";
import BookService from "../services/book.service";

import type { VendorResponseDto, CategoryResponseDto } from "../types/admin.types";
import type { BookResponseDto } from "../types/book.types";
import BroadcastNotificationForm from "../components/notifications/BroadcastNotificationForm";

type Tab = "pending" | "allVendors" | "categories" | "broadcast";

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>("pending");

    // Data States
    const [pendingVendors, setPendingVendors] = useState<VendorResponseDto[]>([]);
    const [allVendors, setAllVendors] = useState<VendorResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [processingVendorId, setProcessingVendorId] = useState<number | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);

    const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

    const showToast = (msg: string, type: "success" | "danger" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Fetch Data
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError("");
            try {
                const [pendingData, allVendorsData, catsData, booksData] = await Promise.all([
                    AdminService.getPendingVendors(),
                    AdminService.getAllVendors(),
                    AdminService.getCategories(),
                    BookService.getBooks(),
                ]);

                setPendingVendors(pendingData);
                setAllVendors(allVendorsData);
                setCategories(catsData);
                setAllBooks(booksData);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || "Data load e problem hoyeche");
                } else {
                    setError("Something went wrong.");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ==================== Vendor Handlers ====================

    const handleApprove = async (vendorId: number) => {
        setProcessingVendorId(vendorId);
        try {
            await AdminService.approveVendor(vendorId);
            setPendingVendors(prev => prev.filter(v => v.vendorId !== vendorId));
            showToast("Vendor approved successfully! ✅");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to approve vendor");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
      
    };

    const handleReject = async (vendorId: number) => {
        if (!window.confirm("Do you want to reject this vendor?")) return;
        setProcessingVendorId(vendorId);
        try {
            await AdminService.rejectVendor(vendorId);
            setPendingVendors(prev => prev.filter(v => v.vendorId !== vendorId));
            showToast("Vendor rejected successfully 🗑️");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(
                    err.response?.data?.message || "Failed to reject vendor", "danger"
                );
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setProcessingVendorId(null);
        }

    };

    const handleSuspend = async (vendorId: number) => {
        if (!window.confirm("Are you sure you want to suspend this vendor?")) return;
        setProcessingVendorId(vendorId);
        try {
            await AdminService.suspendVendor(vendorId);
            showToast("Vendor suspended successfully ⏸️");

            const updated = await AdminService.getAllVendors();
            setAllVendors(updated);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(
                    err.response?.data?.message || "Failed to reject vendor",
                    "danger"
                );
            } else {
                showToast("Failed to suspend vendor", "danger");
            }
        } finally {
            setProcessingVendorId(null);
        }

    };

    const handleActivate = async (vendorId: number) => {
        setProcessingVendorId(vendorId);
        try {
            await AdminService.activateVendor(vendorId);
            showToast("Vendor activated successfully ✅");

            const updated = await AdminService.getAllVendors();
            setAllVendors(updated);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(
                    err.response?.data?.message || "Failed to activate vendor", "danger"
                );
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setProcessingVendorId(null);
        }

    };

    const handleDelete = async (vendorId: number) => {
        if (!window.confirm("Are you sure you want to DELETE this vendor? This action cannot be undone!")) return;

        setProcessingVendorId(vendorId);
        try {
            await AdminService.deleteVendor(vendorId);
            showToast("Vendor deleted successfully 🗑️");

            const updated = await AdminService.getAllVendors();
            setAllVendors(updated);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(
                    err.response?.data?.message || "Failed to delete vendor", "danger"
                );
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setProcessingVendorId(null);
        }
     
    };

    // ==================== Category Handlers ====================

    // ── Add Category ──
    const handleAddCategory = async (name: string) => {
        setAddingCategory(true);
        try {
            const newCat = await AdminService.createCategory({ name });
            setCategories((prev) => [...prev, newCat]);
            showToast(`Category "${newCat.name}" added! 🏷️`);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.message || "There is problem to add category", "danger");
            } else {
                showToast("Something went wrong.", "danger");
            }
        }
    };


    // ── Delete Category ──
    const handleDeleteCategory = async (categoryId: number) => {
        setDeletingCategoryId(categoryId);
        try {
            await AdminService.deleteCategory(categoryId);
            setCategories((prev) => prev.filter((c) => c.categoryId !== categoryId));
            showToast("Category deleted 🗑️");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(
                    err.response?.data?.message || "There is problem to delete।",
                    "danger"
                );
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setProcessingVendorId(null);  // ← same fix
        }
    };
    return (
        <>
            <Navbar />
            <div className="bg-light min-vh-100 py-4">
                <div className="container-xl">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <h4 className="fw-bold mb-0">
                            <i className="bi bi-gear me-2"></i> Admin Dashboard
                        </h4>
                    </div>

                    {loading && <div className="text-center py-5">Loading admin panel...</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {!loading && !error && (
                        <>
                            <AdminStats
                                totalBooks={allBooks.length}
                                totalVendors={allVendors.length}
                                pendingVendors={pendingVendors.length}
                                totalCategories={categories.length}
                            />

                            {/* Tabs */}
                            <ul className="nav nav-tabs mb-4">
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "pending" ? "active" : ""}`}
                                        onClick={() => setActiveTab("pending")}>
                                        Pending Approvals ({pendingVendors.length})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "allVendors" ? "active" : ""}`}
                                        onClick={() => setActiveTab("allVendors")}>
                                        All Existing Vendors ({allVendors.length})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "categories" ? "active" : ""}`}
                                        onClick={() => setActiveTab("categories")}>
                                        Categories ({categories.length})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "broadcast" ? "active" : ""}`}
                                        onClick={() => setActiveTab("broadcast")}>
                                        <i className="bi bi-megaphone me-1" />
                                        Broadcast
                                    </button>
                                </li>
                            </ul>

                            {/* Tab Contents */}
                            {activeTab === "pending" && (
                                <VendorApprovalTable
                                    vendors={pendingVendors}
                                    allVendors={allVendors}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onSuspend={handleSuspend}
                                    onActivate={handleActivate}
                                    processingId={processingVendorId}
                                />
                            )}

                            {activeTab === "allVendors" && (
                                <ActiveVendorTable
                                    vendors={allVendors}
                                    onSuspend={handleSuspend}
                                    onActivate={handleActivate}
                                    onDelete={handleDelete}
                                    processingId={processingVendorId}
                                />
                            )}

                            {activeTab === "categories" && (
                                <CategoryManager
                                    categories={categories}
                                    onAdd={handleAddCategory}
                                    onDelete={handleDeleteCategory}
                                    deletingId={deletingCategoryId}
                                    adding={addingCategory}
                                />
                            )}
                            {activeTab === "broadcast" && (
                                <BroadcastNotificationForm />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type} shadow`}>
                    {toast.msg}
                </div>
            )}
        </>
    );
}
//// =============================================
//// AdminDashboardPage.tsx — Updated with Suspend & Activate
//// =============================================
//import { useState, useEffect } from "react";
//import axios from "axios";
//import Navbar from "../components/common/Navbar";
//import AdminStats from "../components/admin/AdminStats";
//import VendorApprovalTable from "../components/admin/VendorApprovalTable";
//import CategoryManager from "../components/admin/CategoryManager";
//import AdminService from "../services/admin.service";
//import BookService from "../services/book.service";
//import type { VendorResponseDto, CategoryResponseDto } from "../types/admin.types";
//import type { BookResponseDto } from "../types/book.types";

//type Tab = "vendors" | "categories";

//export default function AdminDashboardPage() {
//    const [activeTab, setActiveTab] = useState<Tab>("vendors");

//    // ── Data ──
//    const [pendingVendors, setPendingVendors] = useState<VendorResponseDto[]>([]);
//    const [allVendors, setAllVendors] = useState<VendorResponseDto[]>([]);
//    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
//    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);
//    const [loading, setLoading] = useState(true);
//    const [error, setError] = useState("");

//    // ── Action states ──
//    const [processingVendorId, setProcessingVendorId] = useState<number | null>(null);
//    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
//    const [addingCategory, setAddingCategory] = useState(false);

//    // ── Toast ──
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
//            try {
//                const [pendingData, allVendorsData, catsData, booksData] = await Promise.all([
//                    AdminService.getPendingVendors(),
//                    AdminService.getAllVendors(),        // New
//                    AdminService.getCategories(),
//                    BookService.getBooks(),
//                ]);

//                setPendingVendors(pendingData);
//                setAllVendors(allVendorsData);
//                setCategories(catsData);
//                setAllBooks(booksData);
//            } catch (err: unknown) {
//                if (axios.isAxiosError(err)) {
//                    setError(err.response?.data?.message || "Data load e problem hoyeche");
//                } else {
//                    setError("Something went wrong.");
//                }
//            } finally {
//                setLoading(false);
//            }
//        };
//        fetchAll();
//    }, []);

//    // ── Approve Vendor ──
//    const handleApprove = async (vendorId: number) => {
//        setProcessingVendorId(vendorId);
//        try {
//            await AdminService.approveVendor(vendorId);
//            setPendingVendors((prev) => prev.filter((v) => v.vendorId !== vendorId));
//            showToast("Vendor approved successfully! ✅");
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                showToast(err.response?.data?.message || "There is problem to approve vendor", "danger");
//            } else {
//                showToast("Something went wrong.", "danger");
//            }
//        } finally {
//            setAddingCategory(false);
//        }
//    };

//    // ── Reject Vendor ──
//    const handleReject = async (vendorId: number) => {
//        if (!window.confirm("Do you want to reject this vendor?")) return;
//        setProcessingVendorId(vendorId);
//        try {
//            await AdminService.rejectVendor(vendorId);
//            setPendingVendors((prev) => prev.filter((v) => v.vendorId !== vendorId));
//            showToast("Vendor rejected successfully 🗑️");
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                showToast(err.response?.data?.message || "There is problem rejecting vendor", "danger");
//            } else {
//                showToast("Something went wrong.", "danger");
//            }
//        } finally {
//            setProcessingVendorId(null);  // ← same fix
//        }

//    };

//    // ── Suspend Vendor (New) ──
//    const handleSuspend = async (vendorId: number) => {
//        if (!window.confirm("Are you sure you want to suspend this vendor?")) return;
//        setProcessingVendorId(vendorId);
//        try {
//            await AdminService.suspendVendor(vendorId);
//            showToast("Vendor suspended successfully ⏸️");
//            // Refresh all vendors list
//            const updated = await AdminService.getAllVendors();
//            setAllVendors(updated);
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                showToast(err.response?.data?.message || "There is problem to Suspended", "danger");
//            } else {
//                showToast("Something went wrong.", "danger");
//            }
//        } finally {
//            setAddingCategory(false);
//        }
//    };

//    // ── Activate Vendor (New) ──
//    const handleActivate = async (vendorId: number) => {
//        setProcessingVendorId(vendorId);
//        try {
//            await AdminService.activateVendor(vendorId);
//            showToast("Vendor activated successfully ✅");
//            // Refresh all vendors list
//            const updated = await AdminService.getAllVendors();
//            setAllVendors(updated);
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                showToast(err.response?.data?.message || "There is problen to activate vendor", "danger");
//            } else {
//                showToast("Something went wrong.", "danger");
//            }
//        } finally {
//            setProcessingVendorId(null);  // ← same fix
//        }

//    };

//    // ── Add Category ──
//    const handleAddCategory = async (name: string) => {
//        setAddingCategory(true);
//        try {
//            const newCat = await AdminService.createCategory({ name });
//            setCategories((prev) => [...prev, newCat]);
//            showToast(`Category "${newCat.name}" added! 🏷️`);
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                showToast(err.response?.data?.message || "There is problem to add category", "danger");
//            } else {
//                showToast("Something went wrong.", "danger");
//            }
//        }
//    };


//    // ── Delete Category ──
//    const handleDeleteCategory = async (categoryId: number) => {
//        setDeletingCategoryId(categoryId);
//        try {
//            await AdminService.deleteCategory(categoryId);
//            setCategories((prev) => prev.filter((c) => c.categoryId !== categoryId));
//            showToast("Category deleted 🗑️");
//        } catch (err: unknown) {
//            if (axios.isAxiosError(err)) {
//                showToast(
//                    err.response?.data?.message || "There is problem to delete।",
//                    "danger"
//                );
//            } else {
//                showToast("Something went wrong.", "danger");
//            }
//        } finally {
//            setProcessingVendorId(null);  // ← same fix
//        }
//    };

//    const uniqueVendorIds = new Set(allBooks.map((b) => b.vendorId));

//    return (
//        <>
//            <Navbar />
//            <div className="bg-light min-vh-100 py-4">
//                <div className="container-xl">
//                    {/* Header */}
//                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
//                        <div>
//                            <h4 className="fw-bold mb-0">
//                                <i className="bi bi-gear me-2 text-dark"></i>
//                                Admin Dashboard
//                            </h4>
//                            <p className="text-muted small mb-0">Manage vendors, categories & more</p>
//                        </div>
//                        {pendingVendors.length > 0 && (
//                            <div className="alert alert-warning py-2 px-3 mb-0 d-flex align-items-center gap-2">
//                                <i className="bi bi-bell-fill"></i>
//                                <strong>{pendingVendors.length}</strong> vendor approval pending!
//                            </div>
//                        )}
//                    </div>

//                    {loading && (
//                        <div className="text-center py-5">
//                            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
//                            <p className="text-muted mt-3">Loading admin panel...</p>
//                        </div>
//                    )}

//                    {!loading && error && (
//                        <div className="alert alert-danger d-flex align-items-center gap-2">
//                            <i className="bi bi-exclamation-triangle-fill"></i>
//                            {error}
//                        </div>
//                    )}

//                    {!loading && !error && (
//                        <>
//                            <AdminStats
//                                totalBooks={allBooks.length}
//                                totalVendors={uniqueVendorIds.size}
//                                pendingVendors={pendingVendors.length}
//                                totalCategories={categories.length}
//                            />

//                            {/* Tabs */}
//                            <ul className="nav nav-tabs mb-4">
//                                <li className="nav-item">
//                                    <button
//                                        className={`nav-link fw-semibold ${activeTab === "vendors" ? "active" : ""}`}
//                                        onClick={() => setActiveTab("vendors")}
//                                    >
//                                        <i className="bi bi-shop me-2"></i>
//                                        Vendor Management
//                                        {pendingVendors.length > 0 && (
//                                            <span className="badge bg-warning text-dark ms-2">
//                                                {pendingVendors.length}
//                                            </span>
//                                        )}
//                                    </button>
//                                </li>
//                                <li className="nav-item">
//                                    <button
//                                        className={`nav-link fw-semibold ${activeTab === "categories" ? "active" : ""}`}
//                                        onClick={() => setActiveTab("categories")}
//                                    >
//                                        <i className="bi bi-tags me-2"></i>
//                                        Categories
//                                        <span className="badge bg-info ms-2">{categories.length}</span>
//                                    </button>
//                                </li>
//                            </ul>

//                            {/* Tab Content */}
//                            {activeTab === "vendors" && (
//                                <VendorApprovalTable
//                                    vendors={pendingVendors}
//                                    allVendors={allVendors}
//                                    onApprove={handleApprove}
//                                    onReject={handleReject}
//                                    onSuspend={handleSuspend}
//                                    onActivate={handleActivate}
//                                    processingId={processingVendorId}
//                                />
//                            )}

//                            {activeTab === "categories" && (
//                                <CategoryManager
//                                    categories={categories}
//                                    onAdd={handleAddCategory}
//                                    onDelete={handleDeleteCategory}
//                                    deletingId={deletingCategoryId}
//                                    adding={addingCategory}
//                                />
//                            )}
//                        </>
//                    )}
//                </div>
//            </div>

//            {/* Toast Notification */}
//            {toast && (
//                <div
//                    className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type} shadow d-flex align-items-center gap-2`}
//                    style={{ zIndex: 9999, minWidth: "260px" }}
//                >
//                    <i className={`bi fs-5 ${toast.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}`}></i>
//                    {toast.msg}
//                </div>
//            )}
//        </>
//    );
//}

////// =============================================
////// AdminDashboardPage.tsx — Fixed: real stats
////// =============================================

////import { useState, useEffect } from "react";
////import axios from "axios";
////import Navbar from "../components/common/Navbar";
////import AdminStats from "../components/admin/AdminStats";
////import VendorApprovalTable from "../components/admin/VendorApprovalTable";
////import CategoryManager from "../components/admin/CategoryManager";
////import AdminService from "../services/admin.service";
////import BookService from "../services/book.service";
////import type { VendorResponseDto, CategoryResponseDto } from "../types/admin.types";
////import type { BookResponseDto } from "../types/book.types";

////type Tab = "vendors" | "categories";

////export default function AdminDashboardPage() {
////    const [activeTab, setActiveTab] = useState<Tab>("vendors");

////    // ── Data ──
////    const [pendingVendors, setPendingVendors] = useState<VendorResponseDto[]>([]);
////    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
////    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);
////    const [loading, setLoading] = useState(true);
////    const [error, setError] = useState("");

////    // ── Action states ──
////    const [processingVendorId, setProcessingVendorId] = useState<number | null>(null);
////    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
////    const [addingCategory, setAddingCategory] = useState(false);

////    // ── Toast ──
////    const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

////    const showToast = (msg: string, type: "success" | "danger" = "success") => {
////        setToast({ msg, type });
////        setTimeout(() => setToast(null), 3000);
////    };

////    // ── Fetch all data ──
////    useEffect(() => {
////        const fetchAll = async () => {
////            setLoading(true);
////            setError("");
////            try {
////                const [vendorsData, catsData, booksData] = await Promise.all([
////                    AdminService.getPendingVendors(),
////                    AdminService.getCategories(),
////                    BookService.getBooks(),
////                ]);
////                setPendingVendors(vendorsData);
////                setCategories(catsData);
////                setAllBooks(booksData);
////            } catch (err: unknown) {
////                if (axios.isAxiosError(err)) {
////                    setError(err.response?.data?.message || "There is problem to data load ");
////                } else {
////                    setError("Something went wrong.");
////                }
////            } finally {
////                setLoading(false);
////            }
////        };
////        fetchAll();
////    }, []);

////    // ── Approve Vendor ──
////    const handleApprove = async (vendorId: number) => {
////        setProcessingVendorId(vendorId);
////        try {
////            await AdminService.approveVendor(vendorId);
////            setPendingVendors((prev) => prev.filter((v) => v.vendorId !== vendorId));
////            showToast("Vendor approved successfully! ✅");
////        } catch (err: unknown) {
////            if (axios.isAxiosError(err)) {
////                showToast(err.response?.data?.message || "There is problem to approve", "danger");
////            } else {
////                showToast("Something went wrong.", "danger");
////            }
////        } finally {
////            setProcessingVendorId(null);
////        }
////    };

////    // ── Reject Vendor ──
////    const handleReject = async (vendorId: number) => {
////        if (!window.confirm("Do you want to reject this vendor? It will be delete")) return;
////        setProcessingVendorId(vendorId);
////        try {
////            await AdminService.rejectVendor(vendorId);
////            setPendingVendors((prev) => prev.filter((v) => v.vendorId !== vendorId));
////            showToast("Vendor rejected. 🗑️");
////        } catch (err: unknown) {
////            if (axios.isAxiosError(err)) {
////                showToast(err.response?.data?.message || "There is problem to reject।", "danger");
////            } else {
////                showToast("Something went wrong.", "danger");
////            }
////        } finally {
////            setProcessingVendorId(null);
////        }
////    };

////    // ── Add Category ──
////    const handleAddCategory = async (name: string) => {
////        setAddingCategory(true);
////        try {
////            const newCat = await AdminService.createCategory({ name });
////            setCategories((prev) => [...prev, newCat]);
////            showToast(`"${newCat.name}" category added! 🏷️`);
////        } catch (err: unknown) {
////            if (axios.isAxiosError(err)) {
////                showToast(err.response?.data?.message || "There is problem to add category", "danger");
////            } else {
////                showToast("Something went wrong.", "danger");
////            }
////        } finally {
////            setAddingCategory(false);
////        }
////    };

////    // ── Delete Category ──
////    const handleDeleteCategory = async (categoryId: number) => {
////        setDeletingCategoryId(categoryId);
////        try {
////            await AdminService.deleteCategory(categoryId);
////            setCategories((prev) => prev.filter((c) => c.categoryId !== categoryId));
////            showToast("Category deleted. 🗑️");
////        } catch (err: unknown) {
////            if (axios.isAxiosError(err)) {
////                showToast(
////                    err.response?.data?.message || "There is problem to delete।",
////                    "danger"
////                );
////            } else {
////                showToast("Something went wrong.", "danger");
////            }
////        } finally {
////            setDeletingCategoryId(null);
////        }
////    };

////    // ── Unique vendors from books ──
////    const uniqueVendorIds = new Set(allBooks.map((b) => b.vendorId));

////    return (
////        <>
////            <Navbar />

////            <div className="bg-light min-vh-100 py-4">
////                <div className="container-xl">

////                    {/* Header */}
////                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
////                        <div>
////                            <h4 className="fw-bold mb-0">
////                                <i className="bi bi-gear me-2 text-dark"></i>
////                                Admin Dashboard
////                            </h4>
////                            <p className="text-muted small mb-0">Manage vendors, categories & more</p>
////                        </div>
////                        {pendingVendors.length > 0 && (
////                            <div className="alert alert-warning py-2 px-3 mb-0 d-flex align-items-center gap-2">
////                                <i className="bi bi-bell-fill"></i>
////                                <strong>{pendingVendors.length}</strong> vendor approval pending!
////                            </div>
////                        )}
////                    </div>

////                    {/* Loading */}
////                    {loading && (
////                        <div className="text-center py-5">
////                            <div
////                                className="spinner-border text-primary"
////                                style={{ width: "3rem", height: "3rem" }}
////                            />
////                            <p className="text-muted mt-3">Loading admin panel...</p>
////                        </div>
////                    )}

////                    {/* Error */}
////                    {!loading && error && (
////                        <div className="alert alert-danger d-flex align-items-center gap-2">
////                            <i className="bi bi-exclamation-triangle-fill"></i>
////                            {error}
////                        </div>
////                    )}

////                    {!loading && !error && (
////                        <>
////                            {/* Stats — real data */}
////                            <AdminStats
////                                totalBooks={allBooks.length}
////                                totalVendors={uniqueVendorIds.size}
////                                pendingVendors={pendingVendors.length}
////                                totalCategories={categories.length}
////                            />

////                            {/* Tabs */}
////                            <ul className="nav nav-tabs mb-4">
////                                <li className="nav-item">
////                                    <button
////                                        className={`nav-link fw-semibold ${activeTab === "vendors" ? "active" : ""}`}
////                                        onClick={() => setActiveTab("vendors")}
////                                    >
////                                        <i className="bi bi-shop me-2"></i>
////                                        Vendor Approvals
////                                        {pendingVendors.length > 0 && (
////                                            <span className="badge bg-warning text-dark ms-2">
////                                                {pendingVendors.length}
////                                            </span>
////                                        )}
////                                    </button>
////                                </li>
////                                <li className="nav-item">
////                                    <button
////                                        className={`nav-link fw-semibold ${activeTab === "categories" ? "active" : ""}`}
////                                        onClick={() => setActiveTab("categories")}
////                                    >
////                                        <i className="bi bi-tags me-2"></i>
////                                        Categories
////                                        <span className="badge bg-info ms-2">{categories.length}</span>
////                                    </button>
////                                </li>
////                            </ul>

////                            {/* Tab Content */}
////                            {activeTab === "vendors" && (
////                                <VendorApprovalTable
////                                    vendors={pendingVendors}
////                                    onApprove={handleApprove}
////                                    onReject={handleReject}
////                                    processingId={processingVendorId}
////                                />
////                            )}

////                            {activeTab === "categories" && (
////                                <CategoryManager
////                                    categories={categories}
////                                    onAdd={handleAddCategory}
////                                    onDelete={handleDeleteCategory}
////                                    deletingId={deletingCategoryId}
////                                    adding={addingCategory}
////                                />
////                            )}
////                        </>
////                    )}

////                </div>
////            </div>

////            {/* Toast */}
////            {toast && (
////                <div
////                    className={`position-fixed bottom-0 end-0 m-4 alert alert-${toast.type} shadow d-flex align-items-center gap-2`}
////                    style={{ zIndex: 9999, minWidth: "260px" }}
////                >
////                    <i
////                        className={`bi fs-5 ${toast.type === "success"
////                                ? "bi-check-circle-fill"
////                                : "bi-exclamation-triangle-fill"
////                            }`}
////                    ></i>
////                    {toast.msg}
////                </div>
////            )}
////        </>
////    );
////}
