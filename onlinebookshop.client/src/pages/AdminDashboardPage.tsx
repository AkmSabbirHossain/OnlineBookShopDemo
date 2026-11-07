// =============================================
// AdminDashboardPage.tsx
// =============================================
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import AdminSidebar, {
    type AdminNavCounts,
    type AdminTab,
} from "../components/admin/AdminSidebar";
import AdminStats from "../components/admin/AdminStats";
import VendorApprovalTable from "../components/admin/VendorApprovalTable";
import ActiveVendorTable from "../components/admin/ActiveVendorTable";
import CategoryManager from "../components/admin/CategoryManager";
import BannerManager from "../components/admin/BannerManager";
import CreatorManager, { type CreatorItem } from "../components/admin/CreatorManager";
import CouponManager from "../components/admin/CouponManager";
import ReviewModeration from "../components/admin/ReviewModeration";
import SalesReport from "../components/admin/SalesReport";

import AdminService from "../services/admin.service";
import BookService from "../services/book.service";
import BannerService from "../services/banner.service";
import CreatorService from "../services/creator.service";
import CouponService from "../services/coupon.service";
import VendorPayoutAdminPage from "./VendorPayoutAdminPage";

import type { VendorResponseDto, CategoryResponseDto } from "../types/admin.types";
import type { BookResponseDto } from "../types/book.types";
import type { BannerResponseDto, BannerCreateDto } from "../types/banner.types";
import type { CouponResponseDto, CouponUpsertDto } from "../types/coupon.types";
import type {
    AuthorResponseDto,
    PublisherResponseDto,
    CreatorUpsertDto,
} from "../types/creator.types";
import BroadcastNotificationForm from "../components/notifications/BroadcastNotificationForm";

const SECTION_META: Record<AdminTab, { title: string; subtitle: string }> = {
    overview: {
        title: "Overview",
        subtitle: "A live snapshot of your marketplace and everything that needs attention.",
    },
    pending: {
        title: "Vendor approvals",
        subtitle: "Review new stores before they can start selling on the platform.",
    },
    allVendors: {
        title: "Vendors",
        subtitle: "Suspend, reactivate or remove marketplace partners.",
    },
    categories: {
        title: "Categories",
        subtitle: "Structure how books are discovered across the storefront.",
    },
    authors: {
        title: "Writers",
        subtitle: "Manage author profiles shown across the store.",
    },
    publishers: {
        title: "Publishers",
        subtitle: "Manage publishing houses and their public profiles.",
    },
    banners: {
        title: "Banners",
        subtitle: "Control homepage promotions and hero slides.",
    },
    coupons: {
        title: "Coupons",
        subtitle: "Create promo codes with caps, limits and expiry rules.",
    },
    reviews: {
        title: "Review moderation",
        subtitle: "Approve, hide or re-queue customer reviews.",
    },
    sales: {
        title: "Sales report",
        subtitle: "Track revenue, top titles, vendors and order health.",
    },
    broadcast: {
        title: "Broadcast",
        subtitle: "Send an announcement to your customers.",
    },
    payouts: {
        title: "Vendor payouts",
        subtitle: "Settle pending vendor earnings.",
    },
};

const QUICK_ACTIONS: { tab: AdminTab; icon: string; title: string; desc: string; tone: string }[] = [
    {
        tab: "coupons",
        icon: "bi-ticket-perforated-fill",
        title: "Create a coupon",
        desc: "Launch a promo code for your next campaign.",
        tone: "adm-tone-rose",
    },
    {
        tab: "reviews",
        icon: "bi-chat-square-text-fill",
        title: "Moderate reviews",
        desc: "Approve or hide pending customer feedback.",
        tone: "adm-tone-violet",
    },
    {
        tab: "sales",
        icon: "bi-graph-up-arrow",
        title: "Sales report",
        desc: "Review revenue and best-selling titles.",
        tone: "adm-tone-green",
    },
    {
        tab: "broadcast",
        icon: "bi-megaphone-fill",
        title: "Send an announcement",
        desc: "Broadcast an update to your customers.",
        tone: "adm-tone-blue",
    },
];

const longDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
});
const shortDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
});

const formatDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : shortDate.format(date);
};

const toAuthorItem = (author: AuthorResponseDto): CreatorItem => ({
    id: author.authorId,
    name: author.name,
    bio: author.bio,
    imageUrl: author.imageUrl,
    isActive: author.isActive,
    bookCount: author.bookCount,
});

const toPublisherItem = (publisher: PublisherResponseDto): CreatorItem => ({
    id: publisher.publisherId,
    name: publisher.name,
    bio: publisher.bio,
    imageUrl: publisher.imageUrl,
    isActive: publisher.isActive,
    bookCount: publisher.bookCount,
});

const sortCreators = (items: CreatorItem[]) =>
    [...items].sort((a, b) => a.name.localeCompare(b.name));

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<AdminTab>("overview");
    const [navOpen, setNavOpen] = useState(false);
    const mainRef = useRef<HTMLElement>(null);

    // Data States
    const [pendingVendors, setPendingVendors] = useState<VendorResponseDto[]>([]);
    const [allVendors, setAllVendors] = useState<VendorResponseDto[]>([]);
    const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
    const [allBooks, setAllBooks] = useState<BookResponseDto[]>([]);
    const [banners, setBanners] = useState<BannerResponseDto[]>([]);
    const [authors, setAuthors] = useState<CreatorItem[]>([]);
    const [publishers, setPublishers] = useState<CreatorItem[]>([]);
    const [coupons, setCoupons] = useState<CouponResponseDto[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [processingVendorId, setProcessingVendorId] = useState<number | null>(null);
    const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
    const [addingCategory, setAddingCategory] = useState(false);
    const [updatingCategoryId, setUpdatingCategoryId] = useState<number | null>(null);
    const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);
    const [addingBanner, setAddingBanner] = useState(false);
    const [savingAuthor, setSavingAuthor] = useState(false);
    const [savingPublisher, setSavingPublisher] = useState(false);
    const [processingAuthorId, setProcessingAuthorId] = useState<number | null>(null);
    const [processingPublisherId, setProcessingPublisherId] = useState<number | null>(null);
    const [savingCoupon, setSavingCoupon] = useState(false);
    const [processingCouponId, setProcessingCouponId] = useState<number | null>(null);

    const [toast, setToast] = useState<{ msg: string; type: "success" | "danger" } | null>(null);

    const closeNav = useCallback(() => setNavOpen(false), []);

    const showToast = (msg: string, type: "success" | "danger" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const creatorErrorMessage = (err: unknown, fallback: string) =>
        axios.isAxiosError(err) ? err.response?.data?.message || fallback : "Something went wrong.";

    useEffect(() => {
        if (!navOpen) return;
        const mobile = window.matchMedia("(max-width: 991.98px)");
        if (!mobile.matches) {
            setNavOpen(false);
            return;
        }

        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        const closeOnDesktop = (event: MediaQueryListEvent) => {
            if (!event.matches) setNavOpen(false);
        };
        mobile.addEventListener("change", closeOnDesktop);

        return () => {
            mobile.removeEventListener("change", closeOnDesktop);
            document.body.style.overflow = previous;
        };
    }, [navOpen]);

    // Fit the admin shell under the real site header (top-bar + navbar).
    useEffect(() => {
        const navbar = document.querySelector<HTMLElement>(".nb-root");
        const topbar = document.querySelector<HTMLElement>(".nb-topbar");
        const apply = () => {
            const height = (navbar?.offsetHeight ?? 107) + (topbar?.offsetHeight ?? 0);
            document.documentElement.style.setProperty("--adm-header-h", `${height}px`);
        };

        apply();
        const observer = new ResizeObserver(apply);
        if (navbar) observer.observe(navbar);
        if (topbar) observer.observe(topbar);
        window.addEventListener("resize", apply);

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", apply);
            document.documentElement.style.removeProperty("--adm-header-h");
        };
    }, []);

    // Fetch Data
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            setError("");
            try {
                const [
                    pendingData,
                    allVendorsData,
                    catsData,
                    booksData,
                    bannersData,
                    authorsData,
                    publishersData,
                    couponsData,
                ] = await Promise.all([
                    AdminService.getPendingVendors(),
                    AdminService.getAllVendors(),
                    AdminService.getCategories(),
                    BookService.getBooks(),
                    BannerService.getAll(),
                    CreatorService.getAuthorsForAdmin(),
                    CreatorService.getPublishersForAdmin(),
                    CouponService.getAllForAdmin(),
                ]);

                setPendingVendors(pendingData);
                setAllVendors(allVendorsData);
                setCategories(catsData);
                setAllBooks(booksData);
                setBanners(bannersData);
                setAuthors(sortCreators(authorsData.map(toAuthorItem)));
                setPublishers(sortCreators(publishersData.map(toPublisherItem)));
                setCoupons(couponsData);
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


    // ── Update Category ──
    const handleUpdateCategory = async (categoryId: number, name: string, imageUrl?: string) => {
        setUpdatingCategoryId(categoryId);
        try {
            await AdminService.updateCategory(categoryId, { name, imageUrl });
            setCategories((prev) =>
                prev.map((c) => (c.categoryId === categoryId ? { ...c, name, imageUrl } : c))
            );
            showToast(`Category "${name}" updated! ✏️`);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(
                    err.response?.data?.message || "There is problem to update category",
                    "danger"
                );
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setUpdatingCategoryId(null);
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

    // ==================== Writer Handlers ====================

    const handleAddAuthor = async (dto: CreatorUpsertDto) => {
        setSavingAuthor(true);
        try {
            const created = await CreatorService.createAuthor(dto);
            setAuthors((prev) => sortCreators([...prev, toAuthorItem(created)]));
            showToast(`Writer "${created.name}" added! ✍️`);
        } catch (err: unknown) {
            showToast(creatorErrorMessage(err, "There was a problem adding the writer."), "danger");
            throw err;
        } finally {
            setSavingAuthor(false);
        }
    };

    const handleUpdateAuthor = async (authorId: number, dto: CreatorUpsertDto) => {
        setSavingAuthor(true);
        try {
            const updated = await CreatorService.updateAuthor(authorId, dto);
            setAuthors((prev) =>
                sortCreators(prev.map((a) => (a.id === authorId ? toAuthorItem(updated) : a)))
            );
            showToast(`Writer "${updated.name}" updated ✅`);
        } catch (err: unknown) {
            showToast(creatorErrorMessage(err, "There was a problem updating the writer."), "danger");
            throw err;
        } finally {
            setSavingAuthor(false);
        }
    };

    const handleToggleAuthorStatus = async (authorId: number, isActive: boolean) => {
        setProcessingAuthorId(authorId);
        try {
            const updated = await CreatorService.setAuthorStatus(authorId, isActive);
            setAuthors((prev) =>
                prev.map((a) => (a.id === authorId ? toAuthorItem(updated) : a))
            );
            showToast(updated.isActive ? "Writer is now visible ✅" : "Writer hidden 🚫");
        } catch (err: unknown) {
            showToast(creatorErrorMessage(err, "Failed to update the writer."), "danger");
        } finally {
            setProcessingAuthorId(null);
        }
    };

    // ==================== Publisher Handlers ====================

    const handleAddPublisher = async (dto: CreatorUpsertDto) => {
        setSavingPublisher(true);
        try {
            const created = await CreatorService.createPublisher(dto);
            setPublishers((prev) => sortCreators([...prev, toPublisherItem(created)]));
            showToast(`Publisher "${created.name}" added! 🏢`);
        } catch (err: unknown) {
            showToast(creatorErrorMessage(err, "There was a problem adding the publisher."), "danger");
            throw err;
        } finally {
            setSavingPublisher(false);
        }
    };

    const handleUpdatePublisher = async (publisherId: number, dto: CreatorUpsertDto) => {
        setSavingPublisher(true);
        try {
            const updated = await CreatorService.updatePublisher(publisherId, dto);
            setPublishers((prev) =>
                sortCreators(prev.map((p) => (p.id === publisherId ? toPublisherItem(updated) : p)))
            );
            showToast(`Publisher "${updated.name}" updated ✅`);
        } catch (err: unknown) {
            showToast(creatorErrorMessage(err, "There was a problem updating the publisher."), "danger");
            throw err;
        } finally {
            setSavingPublisher(false);
        }
    };

    const handleTogglePublisherStatus = async (publisherId: number, isActive: boolean) => {
        setProcessingPublisherId(publisherId);
        try {
            const updated = await CreatorService.setPublisherStatus(publisherId, isActive);
            setPublishers((prev) =>
                prev.map((p) => (p.id === publisherId ? toPublisherItem(updated) : p))
            );
            showToast(updated.isActive ? "Publisher is now visible ✅" : "Publisher hidden 🚫");
        } catch (err: unknown) {
            showToast(creatorErrorMessage(err, "Failed to update the publisher."), "danger");
        } finally {
            setProcessingPublisherId(null);
        }
    };

    // ==================== Coupon Handlers ====================

    const handleSaveCoupon = async (dto: CouponUpsertDto, couponId?: number) => {
        setSavingCoupon(true);
        try {
            if (couponId) {
                const updated = await CouponService.update(couponId, dto);
                setCoupons((prev) =>
                    prev.map((c) => (c.couponId === updated.couponId ? updated : c))
                );
                showToast(`Coupon "${updated.code}" updated ✅`);
            } else {
                const created = await CouponService.create(dto);
                setCoupons((prev) => [created, ...prev]);
                showToast(`Coupon "${created.code}" created 🎫`);
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.message || "There was a problem saving the coupon.", "danger");
            } else {
                showToast("Something went wrong.", "danger");
            }
            throw err;
        } finally {
            setSavingCoupon(false);
        }
    };

    const handleToggleCouponStatus = async (coupon: CouponResponseDto) => {
        setProcessingCouponId(coupon.couponId);
        try {
            const updated = await CouponService.setStatus(coupon.couponId, !coupon.isActive);
            setCoupons((prev) =>
                prev.map((c) => (c.couponId === updated.couponId ? updated : c))
            );
            showToast(updated.isActive ? "Coupon activated ✅" : "Coupon deactivated 🚫");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                showToast(err.response?.data?.message || "Failed to update coupon", "danger");
            } else {
                showToast("Something went wrong.", "danger");
            }
        } finally {
            setProcessingCouponId(null);
        }
    };

    const selectTab = (tab: AdminTab) => {
        setActiveTab(tab);
        setNavOpen(false);
        mainRef.current?.scrollTo({ top: 0 });
    };

    const meta = SECTION_META[activeTab];
    const activeCoupons = coupons.filter((c) => c.isActive).length;
    const navCounts: AdminNavCounts = {
        pendingVendors: pendingVendors.length,
        vendors: allVendors.length,
        categories: categories.length,
        authors: authors.length,
        publishers: publishers.length,
        banners: banners.length,
        coupons: coupons.length,
    };

    return (
        <>
            <Navbar />

            <style>{`
                .adm-shell {
                    --adm-ink: #0f172a;
                    --adm-text: #334155;
                    --adm-muted: #64748b;
                    --adm-border: #e5eaf2;
                    --adm-brand: #e8401c;
                    display: flex;
                    align-items: stretch;
                    height: calc(100dvh - var(--adm-header-h, 135px));
                    min-height: 540px;
                    overflow: hidden;
                    background: #f4f6fa;
                    font-family: 'Sora', 'Hind Siliguri', sans-serif;
                    color: var(--adm-text);
                }
                .adm-shell *, .adm-shell *::before, .adm-shell *::after { box-sizing: border-box; }
                .adm-shell p { margin: 0; }

                /* ── Sidebar ── */
                .adm-sidebar {
                    position: relative;
                    width: 274px;
                    flex: 0 0 274px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background:
                        radial-gradient(140% 70% at 0% 0%, rgba(232, 64, 28, 0.16) 0%, transparent 55%),
                        linear-gradient(180deg, #0b1424 0%, #101b30 100%);
                    border-right: 1px solid rgba(255, 255, 255, 0.06);
                }
                .adm-brand {
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    padding: 18px 16px 16px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
                }
                .adm-brand-logo {
                    width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
                    display: grid; place-items: center;
                    background: linear-gradient(135deg, #f97316, #e8401c);
                    color: #fff; font-size: 18px;
                    box-shadow: 0 10px 22px -10px rgba(232, 64, 28, 0.9);
                }
                .adm-brand-text { display: flex; flex-direction: column; min-width: 0; }
                .adm-brand-text strong {
                    font-size: 13.5px; font-weight: 800; color: #f8fafc;
                    letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .adm-brand-text span {
                    font-size: 10px; font-weight: 700; letter-spacing: 0.14em;
                    text-transform: uppercase; color: #7d90ad; margin-top: 2px;
                }
                .adm-sidebar-close {
                    margin-left: auto; width: 34px; height: 34px; border-radius: 9px;
                    border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06);
                    color: #cbd5e1; display: grid; place-items: center; font-size: 13px; cursor: pointer;
                }
                .adm-nav {
                    flex: 1; overflow-y: auto; padding: 10px 12px 18px;
                    scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.14) transparent;
                }
                .adm-nav::-webkit-scrollbar { width: 6px; }
                .adm-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 999px; }
                .adm-nav-section + .adm-nav-section { margin-top: 16px; }
                .adm-nav-label {
                    padding: 0 10px; margin: 0 0 7px;
                    font-size: 9.5px; font-weight: 800; letter-spacing: 0.14em;
                    text-transform: uppercase; color: #5f7391;
                }
                .adm-nav-item {
                    position: relative; display: flex; align-items: center; gap: 10px;
                    width: 100%; padding: 7px 10px; margin-bottom: 2px;
                    border: 0; border-radius: 10px; background: transparent;
                    color: #93a4bd; font: inherit; font-size: 12.8px; font-weight: 600;
                    text-align: left; cursor: pointer;
                    transition: background 0.16s ease, color 0.16s ease;
                }
                .adm-nav-item:hover { background: rgba(255, 255, 255, 0.055); color: #e2e8f0; }
                .adm-nav-item.is-active {
                    background: linear-gradient(90deg, rgba(232, 64, 28, 0.24), rgba(232, 64, 28, 0.05));
                    color: #fff;
                    box-shadow: inset 0 0 0 1px rgba(232, 64, 28, 0.3);
                }
                .adm-nav-item.is-active::before {
                    content: ""; position: absolute; left: -12px; top: 8px; bottom: 8px;
                    width: 3px; border-radius: 0 3px 3px 0; background: #f97316;
                }
                .adm-nav-icon {
                    width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
                    display: inline-flex; align-items: center; justify-content: center;
                    background: rgba(255, 255, 255, 0.06); color: #8fa3c0; font-size: 13.5px;
                    transition: background 0.16s ease, color 0.16s ease;
                }
                .adm-nav-item.is-active .adm-nav-icon {
                    background: linear-gradient(135deg, #f97316, #e8401c);
                    color: #fff;
                    box-shadow: 0 8px 16px -8px rgba(232, 64, 28, 0.9);
                }
                .adm-nav-text { flex: 1; min-width: 0; }
                .adm-nav-badge {
                    min-width: 21px; padding: 2px 7px; border-radius: 999px;
                    background: rgba(255, 255, 255, 0.08); color: #cbd5e1;
                    font-size: 10.5px; font-weight: 800; text-align: center;
                }
                .adm-nav-badge.is-alert {
                    background: #e8401c; color: #fff;
                    box-shadow: 0 4px 12px -4px rgba(232, 64, 28, 0.9);
                }
                .adm-sidebar-foot {
                    padding: 13px 14px 16px;
                    border-top: 1px solid rgba(255, 255, 255, 0.07);
                    background: rgba(255, 255, 255, 0.02);
                }
                .adm-user { display: flex; align-items: center; gap: 10px; }
                .adm-avatar {
                    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
                    display: grid; place-items: center;
                    background: linear-gradient(135deg, #f97316, #e8401c);
                    color: #fff; font-size: 13px; font-weight: 800;
                }
                .adm-user-meta { flex: 1; min-width: 0; }
                .adm-user-meta strong {
                    display: block; font-size: 12.5px; font-weight: 700; color: #f1f5f9;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .adm-user-meta span {
                    display: block; margin-top: 1px; font-size: 11px; color: #7c8ea9;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .adm-logout {
                    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
                    border: 1px solid rgba(255, 255, 255, 0.1); background: transparent;
                    color: #94a3b8; display: grid; place-items: center; cursor: pointer;
                    transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
                }
                .adm-logout:hover {
                    background: rgba(239, 68, 68, 0.16);
                    border-color: rgba(239, 68, 68, 0.4);
                    color: #fca5a5;
                }
                .adm-store-link-foot {
                    display: flex; align-items: center; justify-content: space-between;
                    margin-top: 11px; font-size: 11.5px;
                }
                .adm-store-link-foot a {
                    display: inline-flex; align-items: center; gap: 6px;
                    color: #93a4bd; font-weight: 600; text-decoration: none;
                    transition: color 0.15s ease;
                }
                .adm-store-link-foot a:hover { color: #f97316; }
                .adm-version { font-size: 10.5px; color: #5f7391; }
                .adm-backdrop { display: none; }

                /* ── Main / topbar ── */
                .adm-main {
                    flex: 1; min-width: 0; height: 100%; overflow-y: auto;
                    padding: 22px 26px 46px;
                    scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
                }
                .adm-main::-webkit-scrollbar { width: 10px; }
                .adm-main::-webkit-scrollbar-thumb {
                    background: #cbd5e1; border-radius: 999px; border: 2px solid #f4f6fa;
                }
                .adm-topbar {
                    display: flex; align-items: flex-start; justify-content: space-between;
                    gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
                }
                .adm-topbar-left {
                    display: flex; align-items: flex-start; gap: 12px; min-width: 0;
                }
                .adm-menu-btn {
                    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
                    border: 1px solid var(--adm-border); background: #fff;
                    color: var(--adm-ink); font-size: 18px; cursor: pointer;
                    display: inline-flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 12px -8px rgba(15, 23, 42, 0.4);
                }
                .adm-eyebrow {
                    margin: 0 0 3px; font-size: 10px; font-weight: 800;
                    letter-spacing: 0.14em; text-transform: uppercase; color: var(--adm-brand);
                }
                .adm-title {
                    margin: 0; font-size: 23px; font-weight: 800;
                    letter-spacing: -0.02em; color: var(--adm-ink); line-height: 1.2;
                }
                .adm-subtitle { margin: 4px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--adm-muted); }
                .adm-topbar-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
                .adm-date {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 8px 12px; border-radius: 10px;
                    background: #fff; border: 1px solid var(--adm-border);
                    font-size: 11.5px; font-weight: 600; color: var(--adm-muted);
                }
                .adm-store-link {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 9px 14px; border-radius: 10px;
                    background: var(--adm-ink); color: #fff;
                    font-size: 12px; font-weight: 700; text-decoration: none;
                    transition: background 0.16s ease, transform 0.16s ease;
                }
                .adm-store-link:hover { background: #1e293b; color: #fff; transform: translateY(-1px); }

                /* ── Content ── */
                .adm-content { animation: admFade 0.28s ease both; }
                @keyframes admFade {
                    from { opacity: 0; transform: translateY(6px); }
                    to { opacity: 1; transform: none; }
                }
                .adm-loading {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    gap: 14px; padding: 80px 20px; color: var(--adm-muted); font-size: 12.5px;
                }
                .adm-loading .spinner-border { color: var(--adm-brand); }
                .adm-error {
                    display: flex; align-items: center; gap: 10px;
                    padding: 14px 16px; border-radius: 12px;
                    background: #fef2f2; border: 1px solid #fecaca;
                    color: #b91c1c; font-size: 12.5px; font-weight: 600;
                }

                /* ── Hero ── */
                .adm-hero {
                    position: relative; overflow: hidden;
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 26px; flex-wrap: wrap;
                    padding: 26px 28px; margin-bottom: 20px;
                    border-radius: 20px;
                    background: radial-gradient(120% 190% at 0% 0%, #1e2a45 0%, #0b1424 58%);
                    color: #e2e8f0;
                    box-shadow: 0 26px 60px -42px rgba(15, 23, 42, 0.8);
                }
                .adm-hero::before {
                    content: ""; position: absolute; right: -90px; top: -110px;
                    width: 300px; height: 300px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(232, 64, 28, 0.34), transparent 62%);
                    pointer-events: none;
                }
                .adm-hero::after {
                    content: ""; position: absolute; left: 32%; bottom: -160px;
                    width: 320px; height: 320px; border-radius: 50%;
                    background: radial-gradient(circle, rgba(59, 130, 246, 0.2), transparent 60%);
                    pointer-events: none;
                }
                .adm-hero-body { position: relative; z-index: 1; max-width: 560px; }
                .adm-hero-eyebrow {
                    display: inline-flex; align-items: center; gap: 7px;
                    padding: 4px 11px; border-radius: 999px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.13);
                    color: #c7d2e4; font-size: 10px; font-weight: 800;
                    letter-spacing: 0.09em; text-transform: uppercase;
                }
                .adm-hero h2 {
                    margin: 12px 0 6px; font-size: 25px; font-weight: 800;
                    letter-spacing: -0.02em; color: #fff;
                }
                .adm-hero p { margin: 0; font-size: 12.8px; line-height: 1.6; color: #9fb0c9; }
                .adm-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
                .adm-btn {
                    display: inline-flex; align-items: center; gap: 8px;
                    padding: 10px 15px; border-radius: 10px; border: 1px solid transparent;
                    font: inherit; font-size: 12px; font-weight: 700;
                    cursor: pointer; text-decoration: none;
                    transition: transform 0.16s ease, background 0.16s ease, color 0.16s ease;
                }
                .adm-btn-primary {
                    background: linear-gradient(135deg, #f97316, #e8401c);
                    color: #fff;
                    box-shadow: 0 12px 24px -14px rgba(232, 64, 28, 0.9);
                }
                .adm-btn-primary:hover { transform: translateY(-1px); color: #fff; }
                .adm-btn-ghost {
                    background: rgba(255, 255, 255, 0.07); color: #e2e8f0;
                    border-color: rgba(255, 255, 255, 0.15);
                }
                .adm-btn-ghost:hover { background: rgba(255, 255, 255, 0.13); color: #fff; }
                .adm-btn-count {
                    padding: 1px 7px; border-radius: 999px;
                    background: rgba(255, 255, 255, 0.24); font-size: 10.5px; font-weight: 800;
                }
                .adm-hero-side {
                    position: relative; z-index: 1;
                    display: grid; grid-template-columns: repeat(3, minmax(104px, 1fr));
                    gap: 10px;
                }
                .adm-metric {
                    padding: 12px 14px; border-radius: 13px; min-width: 0;
                    background: rgba(255, 255, 255, 0.055);
                    border: 1px solid rgba(255, 255, 255, 0.09);
                    backdrop-filter: blur(4px);
                }
                .adm-metric span {
                    display: block; font-size: 9.5px; font-weight: 700;
                    letter-spacing: 0.06em; text-transform: uppercase; color: #8fa3c0;
                }
                .adm-metric strong {
                    display: block; margin-top: 4px; font-size: 21px; font-weight: 800;
                    letter-spacing: -0.02em; color: #fff; line-height: 1.1;
                }

                /* ── Stat cards ── */
                .adm-stat {
                    display: flex; align-items: center; gap: 13px;
                    height: 100%; padding: 15px 16px;
                    background: #fff; border: 1px solid var(--adm-border);
                    border-radius: 15px;
                    box-shadow: 0 14px 32px -30px rgba(15, 23, 42, 0.5);
                    transition: transform 0.16s ease, box-shadow 0.16s ease;
                }
                .adm-stat:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 20px 38px -30px rgba(15, 23, 42, 0.6);
                }
                .adm-stat-icon {
                    width: 43px; height: 43px; border-radius: 12px; flex-shrink: 0;
                    display: grid; place-items: center; font-size: 17px;
                }
                .adm-stat-info { min-width: 0; }
                .adm-stat-value {
                    font-size: 22px; font-weight: 800; line-height: 1.15;
                    letter-spacing: -0.02em; color: var(--adm-ink);
                }
                .adm-stat-label {
                    margin-top: 1px; font-size: 11.5px; font-weight: 600;
                    color: var(--adm-muted);
                }
                .adm-stat-note {
                    margin-top: 2px; font-size: 11px; font-weight: 600; color: #94a3b8;
                }
                .adm-tone-blue { background: #eff6ff; color: #2563eb; }
                .adm-tone-green { background: #ecfdf5; color: #059669; }
                .adm-tone-amber { background: #fffbeb; color: #d97706; }
                .adm-tone-violet { background: #f5f3ff; color: #7c3aed; }
                .adm-tone-rose { background: #fff1f2; color: #e11d48; }
                .adm-tone-sky { background: #f0f9ff; color: #0284c7; }

                /* ── Panels ── */
                .adm-panel {
                    height: 100%; overflow: hidden;
                    background: #fff; border: 1px solid var(--adm-border);
                    border-radius: 16px;
                    box-shadow: 0 14px 32px -32px rgba(15, 23, 42, 0.45);
                }
                .adm-panel-head {
                    display: flex; align-items: center; justify-content: space-between;
                    gap: 12px; padding: 15px 18px; border-bottom: 1px solid #eef2f7;
                }
                .adm-panel-head h2 {
                    margin: 0; display: flex; align-items: center; gap: 8px;
                    font-size: 13.5px; font-weight: 800; color: var(--adm-ink);
                }
                .adm-panel-head h2 i { color: var(--adm-brand); }
                .adm-panel-link {
                    border: 0; background: none; padding: 0;
                    color: var(--adm-brand); font: inherit; font-size: 11.5px;
                    font-weight: 700; cursor: pointer;
                }
                .adm-panel-link:hover { text-decoration: underline; }
                .adm-panel-body { padding: 8px 10px 10px; }
                .adm-vendor-row {
                    display: flex; align-items: center; gap: 11px;
                    padding: 9px 8px; border-radius: 10px;
                    transition: background 0.15s ease;
                }
                .adm-vendor-row:hover { background: #f8fafc; }
                .adm-vendor-logo {
                    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
                    display: grid; place-items: center; overflow: hidden;
                    background: #f1f5f9; color: #94a3b8;
                    font-size: 13px; font-weight: 800; object-fit: cover;
                }
                .adm-vendor-info { flex: 1; min-width: 0; }
                .adm-vendor-info strong {
                    display: block; font-size: 12.5px; font-weight: 700; color: var(--adm-ink);
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .adm-vendor-info span {
                    display: block; margin-top: 1px; font-size: 10.5px; color: var(--adm-muted);
                }
                .adm-row-actions { display: flex; gap: 6px; flex-shrink: 0; }
                .adm-icon-btn {
                    width: 30px; height: 30px; border-radius: 8px;
                    display: grid; place-items: center;
                    border: 1px solid transparent; font-size: 11px;
                    cursor: pointer; transition: background 0.15s ease;
                }
                .adm-icon-btn:disabled { opacity: 0.55; cursor: not-allowed; }
                .adm-icon-btn.approve { background: #ecfdf5; color: #059669; border-color: #bbf7d0; }
                .adm-icon-btn.approve:hover:not(:disabled) { background: #d1fae5; }
                .adm-icon-btn.reject { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
                .adm-icon-btn.reject:hover:not(:disabled) { background: #fee2e2; }
                .adm-empty {
                    padding: 28px 18px; text-align: center;
                    font-size: 12px; color: var(--adm-muted);
                }
                .adm-empty i { display: block; font-size: 25px; color: #cbd5e1; margin-bottom: 8px; }

                /* ── Quick actions ── */
                .adm-quick-grid {
                    display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px; padding: 12px;
                }
                .adm-quick {
                    display: flex; align-items: flex-start; gap: 10px;
                    padding: 12px; border-radius: 12px;
                    border: 1px solid var(--adm-border); background: #fff;
                    font: inherit; text-align: left; cursor: pointer;
                    transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
                }
                .adm-quick:hover {
                    transform: translateY(-1px);
                    border-color: #cbd5e1;
                    box-shadow: 0 12px 24px -20px rgba(15, 23, 42, 0.5);
                }
                .adm-quick-icon {
                    width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
                    display: grid; place-items: center; font-size: 15px;
                }
                .adm-quick strong {
                    display: block; font-size: 12.3px; font-weight: 700; color: var(--adm-ink);
                }
                .adm-quick span {
                    display: block; margin-top: 2px;
                    font-size: 10.8px; line-height: 1.45; color: var(--adm-muted);
                }

                :is(.adm-nav-item, .adm-menu-btn, .adm-quick, .adm-icon-btn, .adm-logout, .adm-btn, .adm-store-link):focus-visible {
                    outline: 2px solid #f97316;
                    outline-offset: 2px;
                }

                /* ── Toast ── */
                .adm-toast {
                    position: fixed; right: 20px; bottom: 20px; z-index: 1080;
                    display: flex; align-items: center; gap: 10px;
                    max-width: min(92vw, 360px); padding: 13px 16px;
                    border-radius: 12px; background: #0f172a; color: #f1f5f9;
                    font-size: 12.5px; font-weight: 600;
                    box-shadow: 0 24px 48px -20px rgba(15, 23, 42, 0.7);
                    animation: admToastIn 0.22s ease both;
                }
                .adm-toast i { font-size: 16px; }
                .adm-toast.is-success i { color: #34d399; }
                .adm-toast.is-danger i { color: #f87171; }
                @keyframes admToastIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: none; }
                }

                /* ── Responsive ── */
                @media (max-width: 1199.98px) {
                    .adm-hero { align-items: flex-start; }
                    .adm-hero-side { width: 100%; }
                }
                @media (max-width: 991.98px) {
                    .adm-shell {
                        height: auto; overflow: visible;
                        min-height: calc(100dvh - var(--adm-header-h, 116px));
                    }
                    .adm-sidebar {
                        position: fixed; top: 0; left: 0; height: 100dvh;
                        width: min(288px, 86vw); flex-basis: auto;
                        z-index: 1050; transform: translateX(-102%);
                        transition: transform 0.28s ease;
                        box-shadow: 0 30px 80px rgba(2, 6, 23, 0.55);
                    }
                    .adm-sidebar.is-open { transform: none; }
                    .adm-backdrop {
                        display: block; position: fixed; inset: 0; z-index: 1049;
                        background: rgba(8, 15, 30, 0.55);
                        backdrop-filter: blur(2px);
                        opacity: 0; pointer-events: none;
                        transition: opacity 0.25s ease;
                    }
                    .adm-backdrop.is-open { opacity: 1; pointer-events: auto; }
                    .adm-main { height: auto; overflow: visible; padding: 18px 16px 42px; }
                    .adm-title { font-size: 21px; }
                }
                @media (max-width: 767.98px) {
                    .adm-hero { padding: 22px; border-radius: 18px; }
                    .adm-hero h2 { font-size: 21px; }
                    .adm-hero-side { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
                    .adm-metric { padding: 10px 11px; }
                    .adm-metric strong { font-size: 18px; }
                }
                @media (max-width: 575.98px) {
                    .adm-topbar-right .adm-date { display: none; }
                    .adm-topbar { margin-bottom: 16px; }
                    .adm-quick-grid { grid-template-columns: 1fr; }
                    .adm-stat { padding: 13px; gap: 10px; }
                    .adm-stat-icon { width: 38px; height: 38px; font-size: 15px; }
                    .adm-stat-value { font-size: 19px; }
                    .adm-stat-label { font-size: 10.8px; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .adm-content, .adm-toast { animation: none; }
                    .adm-stat, .adm-quick, .adm-btn, .adm-store-link { transition: none; }
                }
            `}</style>

            <div className="adm-shell">
                <AdminSidebar
                    activeTab={activeTab}
                    onNavigate={selectTab}
                    counts={navCounts}
                    open={navOpen}
                    onClose={closeNav}
                />

                <main className="adm-main" ref={mainRef}>
                    <header className="adm-topbar">
                        <div className="adm-topbar-left">
                            <button
                                type="button"
                                className="adm-menu-btn d-lg-none"
                                onClick={() => setNavOpen(true)}
                                aria-label="Open admin navigation"
                                aria-expanded={navOpen}
                            >
                                <i className="bi bi-list" aria-hidden="true" />
                            </button>
                            <div>
                                <p className="adm-eyebrow">Admin console</p>
                                <h1 className="adm-title">{meta.title}</h1>
                                <p className="adm-subtitle">{meta.subtitle}</p>
                            </div>
                        </div>
                        <div className="adm-topbar-right">
                            <span className="adm-date">
                                <i className="bi bi-calendar3" aria-hidden="true" />
                                {longDate.format(new Date())}
                            </span>
                            <Link to="/" className="adm-store-link">
                                <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                                View store
                            </Link>
                        </div>
                    </header>

                    {loading && (
                        <div className="adm-loading">
                            <div className="spinner-border" role="status" aria-hidden="true" />
                            <span>Loading admin workspace…</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="adm-error" role="alert">
                            <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="adm-content" key={activeTab}>
                            {activeTab === "overview" && (
                                <>
                                    <section className="adm-hero">
                                        <div className="adm-hero-body">
                                            <span className="adm-hero-eyebrow">
                                                <i className="bi bi-shield-check" aria-hidden="true" />
                                                Marketplace control
                                            </span>
                                            <h2>Everything in one place.</h2>
                                            <p>
                                                Approve new stores, curate the catalog and keep the
                                                storefront running smoothly.
                                            </p>
                                            <div className="adm-hero-actions">
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn-primary"
                                                    onClick={() => selectTab("pending")}
                                                >
                                                    <i className="bi bi-hourglass-split" aria-hidden="true" />
                                                    Review approvals
                                                    {pendingVendors.length > 0 && (
                                                        <span className="adm-btn-count">
                                                            {pendingVendors.length}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="adm-btn adm-btn-ghost"
                                                    onClick={() => selectTab("sales")}
                                                >
                                                    <i className="bi bi-graph-up-arrow" aria-hidden="true" />
                                                    Sales report
                                                </button>
                                            </div>
                                        </div>

                                        <div className="adm-hero-side">
                                            <div className="adm-metric">
                                                <span>Pending stores</span>
                                                <strong>{pendingVendors.length}</strong>
                                            </div>
                                            <div className="adm-metric">
                                                <span>Active coupons</span>
                                                <strong>{activeCoupons}</strong>
                                            </div>
                                            <div className="adm-metric">
                                                <span>Catalog titles</span>
                                                <strong>{allBooks.length}</strong>
                                            </div>
                                        </div>
                                    </section>

                                    <AdminStats
                                        totalBooks={allBooks.length}
                                        totalVendors={allVendors.length}
                                        pendingVendors={pendingVendors.length}
                                        totalCategories={categories.length}
                                        totalCoupons={coupons.length}
                                        totalBanners={banners.length}
                                        totalCreators={authors.length + publishers.length}
                                    />

                                    <div className="row g-4">
                                        <div className="col-12 col-xl-7">
                                            <div className="adm-panel">
                                                <div className="adm-panel-head">
                                                    <h2>
                                                        <i className="bi bi-shop-window" aria-hidden="true" />
                                                        Pending vendor approvals
                                                    </h2>
                                                    <button
                                                        type="button"
                                                        className="adm-panel-link"
                                                        onClick={() => selectTab("pending")}
                                                    >
                                                        View all
                                                    </button>
                                                </div>
                                                <div className="adm-panel-body">
                                                    {pendingVendors.length === 0 ? (
                                                        <div className="adm-empty">
                                                            <i className="bi bi-check2-circle" aria-hidden="true" />
                                                            No stores are waiting for approval.
                                                        </div>
                                                    ) : (
                                                        pendingVendors.slice(0, 4).map((vendor) => (
                                                            <div className="adm-vendor-row" key={vendor.vendorId}>
                                                                {vendor.logoUrl ? (
                                                                    <img
                                                                        src={vendor.logoUrl}
                                                                        alt=""
                                                                        className="adm-vendor-logo"
                                                                    />
                                                                ) : (
                                                                    <span className="adm-vendor-logo">
                                                                        {vendor.shopName.charAt(0).toUpperCase()}
                                                                    </span>
                                                                )}
                                                                <div className="adm-vendor-info">
                                                                    <strong>{vendor.shopName}</strong>
                                                                    <span>
                                                                        Applied {formatDate(vendor.createdAt)}
                                                                        {vendor.city ? ` · ${vendor.city}` : ""}
                                                                    </span>
                                                                </div>
                                                                <div className="adm-row-actions">
                                                                    <button
                                                                        type="button"
                                                                        className="adm-icon-btn approve"
                                                                        onClick={() => handleApprove(vendor.vendorId)}
                                                                        disabled={processingVendorId === vendor.vendorId}
                                                                        aria-label={`Approve ${vendor.shopName}`}
                                                                        title="Approve"
                                                                    >
                                                                        <i className="bi bi-check-lg" aria-hidden="true" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="adm-icon-btn reject"
                                                                        onClick={() => handleReject(vendor.vendorId)}
                                                                        disabled={processingVendorId === vendor.vendorId}
                                                                        aria-label={`Reject ${vendor.shopName}`}
                                                                        title="Reject"
                                                                    >
                                                                        <i className="bi bi-x-lg" aria-hidden="true" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-12 col-xl-5">
                                            <div className="adm-panel">
                                                <div className="adm-panel-head">
                                                    <h2>
                                                        <i className="bi bi-lightning-charge-fill" aria-hidden="true" />
                                                        Quick actions
                                                    </h2>
                                                </div>
                                                <div className="adm-panel-body p-0">
                                                    <div className="adm-quick-grid">
                                                        {QUICK_ACTIONS.map((action) => (
                                                            <button
                                                                type="button"
                                                                className="adm-quick"
                                                                key={action.tab}
                                                                onClick={() => selectTab(action.tab)}
                                                            >
                                                                <span className={`adm-quick-icon ${action.tone}`}>
                                                                    <i className={`bi ${action.icon}`} aria-hidden="true" />
                                                                </span>
                                                                <span>
                                                                    <strong>{action.title}</strong>
                                                                    <span>{action.desc}</span>
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

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
                                    onUpdate={handleUpdateCategory}
                                    onDelete={handleDeleteCategory}
                                    deletingId={deletingCategoryId}
                                    updatingId={updatingCategoryId}
                                    adding={addingCategory}
                                />
                            )}

                            {activeTab === "authors" && (
                                <CreatorManager
                                    kind="author"
                                    creators={authors}
                                    onAdd={handleAddAuthor}
                                    onUpdate={handleUpdateAuthor}
                                    onToggleStatus={handleToggleAuthorStatus}
                                    saving={savingAuthor}
                                    processingId={processingAuthorId}
                                />
                            )}

                            {activeTab === "publishers" && (
                                <CreatorManager
                                    kind="publisher"
                                    creators={publishers}
                                    onAdd={handleAddPublisher}
                                    onUpdate={handleUpdatePublisher}
                                    onToggleStatus={handleTogglePublisherStatus}
                                    saving={savingPublisher}
                                    processingId={processingPublisherId}
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

                            {activeTab === "coupons" && (
                                <CouponManager
                                    coupons={coupons}
                                    onSave={handleSaveCoupon}
                                    onToggleStatus={handleToggleCouponStatus}
                                    saving={savingCoupon}
                                    processingId={processingCouponId}
                                />
                            )}

                            {activeTab === "reviews" && <ReviewModeration />}

                            {activeTab === "sales" && <SalesReport />}

                            {activeTab === "broadcast" && <BroadcastNotificationForm />}

                            {activeTab === "payouts" && <VendorPayoutAdminPage />}
                        </div>
                    )}
                </main>
            </div>

            {toast && (
                <div
                    className={`adm-toast ${toast.type === "success" ? "is-success" : "is-danger"}`}
                    role="status"
                >
                    <i
                        className={`bi ${
                            toast.type === "success"
                                ? "bi-check-circle-fill"
                                : "bi-exclamation-octagon-fill"
                        }`}
                        aria-hidden="true"
                    />
                    <span>{toast.msg}</span>
                </div>
            )}
        </>
    );
}
