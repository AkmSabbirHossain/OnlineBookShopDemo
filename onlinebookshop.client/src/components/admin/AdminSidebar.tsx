// =============================================
// AdminSidebar.tsx — Admin console navigation
// =============================================

import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthService from "../../services/auth.service";
import type { UserResponseDto } from "../../types/auth.types";

export type AdminTab =
    | "overview"
    | "pending"
    | "allVendors"
    | "categories"
    | "authors"
    | "publishers"
    | "banners"
    | "coupons"
    | "reviews"
    | "sales"
    | "broadcast"
    | "payouts";

export interface AdminNavCounts {
    pendingVendors: number;
    vendors: number;
    categories: number;
    authors: number;
    publishers: number;
    banners: number;
    coupons: number;
}

interface NavItem {
    id: AdminTab;
    label: string;
    icon: string;
    count?: number;
    alert?: boolean;
}

interface NavSection {
    label: string;
    items: NavItem[];
}

interface Props {
    activeTab: AdminTab;
    onNavigate: (tab: AdminTab) => void;
    counts: AdminNavCounts;
    open: boolean;
    onClose: () => void;
}

function initialsOf(name?: string): string {
    if (!name) return "AD";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "AD";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminSidebar({
    activeTab,
    onNavigate,
    counts,
    open,
    onClose,
}: Props) {
    const navigate = useNavigate();
    const user = AuthService.getCurrentUser() as UserResponseDto | null;

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    const sections: NavSection[] = [
        {
            label: "Workspace",
            items: [
                { id: "overview", label: "Overview", icon: "bi-grid-1x2-fill" },
                { id: "sales", label: "Sales Report", icon: "bi-graph-up-arrow" },
            ],
        },
        {
            label: "Marketplace",
            items: [
                {
                    id: "pending",
                    label: "Pending Approvals",
                    icon: "bi-hourglass-split",
                    count: counts.pendingVendors,
                    alert: true,
                },
                { id: "allVendors", label: "Vendors", icon: "bi-shop-window", count: counts.vendors },
                { id: "payouts", label: "Vendor Payouts", icon: "bi-bank" },
            ],
        },
        {
            label: "Catalog",
            items: [
                { id: "categories", label: "Categories", icon: "bi-tags-fill", count: counts.categories },
                { id: "authors", label: "Writers", icon: "bi-person-lines-fill", count: counts.authors },
                { id: "publishers", label: "Publishers", icon: "bi-building", count: counts.publishers },
                { id: "banners", label: "Banners", icon: "bi-images", count: counts.banners },
                { id: "coupons", label: "Coupons", icon: "bi-ticket-perforated-fill", count: counts.coupons },
            ],
        },
        {
            label: "Engagement",
            items: [
                { id: "reviews", label: "Review Moderation", icon: "bi-chat-square-text-fill" },
                { id: "broadcast", label: "Broadcast", icon: "bi-megaphone-fill" },
            ],
        },
    ];

    return (
        <>
            <div
                className={`adm-backdrop ${open ? "is-open" : ""}`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`adm-sidebar ${open ? "is-open" : ""}`}
                aria-label="Admin navigation"
            >
                <div className="adm-brand">
                    <span className="adm-brand-logo">
                        <i className="bi bi-shield-lock-fill" aria-hidden="true" />
                    </span>
                    <div className="adm-brand-text">
                        <strong>Sabbir Book Mall</strong>
                        <span>Admin Console</span>
                    </div>
                    <button
                        type="button"
                        className="adm-sidebar-close d-lg-none"
                        onClick={onClose}
                        aria-label="Close navigation"
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </div>

                <nav className="adm-nav">
                    {sections.map((section) => (
                        <div className="adm-nav-section" key={section.label}>
                            <p className="adm-nav-label">{section.label}</p>
                            {section.items.map((item) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`adm-nav-item ${isActive ? "is-active" : ""}`}
                                        onClick={() => onNavigate(item.id)}
                                        aria-current={isActive ? "page" : undefined}
                                    >
                                        <span className="adm-nav-icon">
                                            <i className={`bi ${item.icon}`} aria-hidden="true" />
                                        </span>
                                        <span className="adm-nav-text">{item.label}</span>
                                        {item.count !== undefined && item.count > 0 && (
                                            <span
                                                className={`adm-nav-badge ${item.alert ? "is-alert" : ""}`}
                                            >
                                                {item.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className="adm-sidebar-foot">
                    <div className="adm-user">
                        <span className="adm-avatar">{initialsOf(user?.name)}</span>
                        <div className="adm-user-meta">
                            <strong>{user?.name ?? "Administrator"}</strong>
                            <span>{user?.email ?? "admin@bookshop.com"}</span>
                        </div>
                        <button
                            type="button"
                            className="adm-logout"
                            onClick={() => navigate("/logout")}
                            aria-label="Log out"
                            title="Log out"
                        >
                            <i className="bi bi-box-arrow-right" aria-hidden="true" />
                        </button>
                    </div>

                    <div className="adm-store-link-foot">
                        <Link to="/">
                            <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                            View storefront
                        </Link>
                        <span className="adm-version">v1.0</span>
                    </div>
                </div>
            </aside>
        </>
    );
}
