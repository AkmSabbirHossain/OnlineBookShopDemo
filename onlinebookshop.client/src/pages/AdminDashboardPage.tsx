// =============================================
// AdminDashboardPage.tsx
// =============================================
import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import AdminStats from "../components/admin/AdminStats";
import VendorApprovalTable from "../components/admin/VendorApprovalTable";
import ActiveVendorTable from "../components/admin/ActiveVendorTable";
import CategoryManager from "../components/admin/CategoryManager";
import BannerManager from "../components/admin/BannerManager";

import AdminService from "../services/admin.service";
import BookService from "../services/book.service";
import BannerService from "../services/banner.service";
import VendorPayoutAdminPage from "./VendorPayoutAdminPage";

import type { VendorResponseDto, CategoryResponseDto } from "../types/admin.types";
import type { BookResponseDto } from "../types/book.types";
import type { BannerResponseDto, BannerCreateDto } from "../types/banner.types";
import BroadcastNotificationForm from "../components/notifications/BroadcastNotificationForm";

type Tab = "pending" | "allVendors" | "categories" | "banners" | "broadcast" | "payouts";

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<Tab>("pending");

    // Data States
    const [pendingVendors, setPendingVendors] = useState<VendorResponseDto[]>([]);
    const [allVendors, setAllVendors] = useState<VendorResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);
    const [banners, setBanners] = useState<BannerResponseDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [processingVendorId, setProcessingVendorId] = useState<number | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);
    const [addingBanner, setAddingBanner] = useState(false);

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
                const [pendingData, allVendorsData, catsData, booksData, bannersData] = await Promise.all([
                    AdminService.getPendingVendors(),
                    AdminService.getAllVendors(),
                    AdminService.getCategories(),
                    BookService.getBooks(),
                    BannerService.getAll(),
                ]);

                setPendingVendors(pendingData);
                setAllVendors(allVendorsData);
                setCategories(catsData);
                setAllBooks(booksData);
                setBanners(bannersData);
            } catch (err: unknown) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || "There is a problem loading data");
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
    const handleAddCategory = async (name: string, imageUrl?: string) => {
        setAddingCategory(true);
        try {
            const newCat = await AdminService.createCategory({ name, imageUrl });
            setCategories((prev) => [...prev, newCat]);
            showToast(`Category "${newCat.name}" added! 🏷️`);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.message || "There is problem to add category", "danger");
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setAddingCategory(false);
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
            setDeletingCategoryId(null);
        }
    };

    // ==================== Banner Handlers ====================

    // ── Add Banner ──
    const handleAddBanner = async (dto: BannerCreateDto) => {
        setAddingBanner(true);
        try {
            const newBanner = await BannerService.create(dto);
            setBanners((prev) => [...prev, newBanner]);
            showToast(`Banner "${newBanner.title}" added! 🖼️`);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.message || "There is problem to add banner", "danger");
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setAddingBanner(false);
        }
    };

    // ── Delete Banner ──
    const handleDeleteBanner = async (bannerId: number) => {
        setDeletingBannerId(bannerId);
        try {
            await BannerService.delete(bannerId);
            setBanners((prev) => prev.filter((b) => b.bannerId !== bannerId));
            showToast("Banner deleted 🗑️");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.message || "There is problem to delete banner", "danger");
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setDeletingBannerId(null);
        }
    };

    // ── Toggle Banner Active ──
    const handleToggleBannerActive = async (banner: BannerResponseDto) => {
        try {
            const updated = { ...banner, isActive: !banner.isActive };
            await BannerService.update(banner.bannerId, {
                title: updated.title,
                subtitle: updated.subtitle,
                imageUrl: updated.imageUrl,
                linkUrl: updated.linkUrl,
                displayOrder: updated.displayOrder,
                isActive: updated.isActive,
            });
            setBanners((prev) => prev.map((b) => (b.bannerId === banner.bannerId ? updated : b)));
            showToast(updated.isActive ? "Banner shown ✅" : "Banner hidden 🚫");
        } catch {
            showToast("Failed to update banner", "danger");
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
                                    <button className={`nav-link ${activeTab === "banners" ? "active" : ""}`}
                                        onClick={() => setActiveTab("banners")}>
                                        Banners ({banners.length})
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "broadcast" ? "active" : ""}`}
                                        onClick={() => setActiveTab("broadcast")}>
                                        <i className="bi bi-megaphone me-1" />
                                        Broadcast
                                    </button>
                                </li>

                                <li className="nav-item">
                                    <button className={`nav-link ${activeTab === "payouts" ? "active" : ""}`}
                                        onClick={() => setActiveTab("payouts")}>
                                        <i className="bi bi-bank me-1" />
                                        Vendor Payouts
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

                            {activeTab === "banners" && (
                                <BannerManager
                                    banners={banners}
                                    onAdd={handleAddBanner}
                                    onDelete={handleDeleteBanner}
                                    onToggleActive={handleToggleBannerActive}
                                    deletingId={deletingBannerId}
                                    adding={addingBanner}
                                />
                            )}

                            {activeTab === "broadcast" && (
                                <BroadcastNotificationForm />
                            )}

                            {activeTab === "payouts" && (
                                <VendorPayoutAdminPage />
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
