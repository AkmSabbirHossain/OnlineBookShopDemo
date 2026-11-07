// =============================================
// VendorSidebar.tsx — Vendor portal navigation
// =============================================

import { Link } from "react-router-dom";
import type { VendorResponseDto } from "../../types/vendor.types";
import { PLACEHOLDER_SHOP_LOGO } from "./vendorUtils";

export type VendorTab =
    | "overview"
    | "books"
    | "orders"
    | "stockHistory"
    | "sales"
    | "earnings"
    | "profile"
    | "security";

interface SidebarProps {
    activeTab: VendorTab;
    setActiveTab: (tab: VendorTab) => void;
    vendor: VendorResponseDto;
    pendingOrders?: number;
    lowStock?: number;
}

interface MenuItem {
    id: VendorTab;
    label: string;
    icon: string;
    badge?: number;
    badgeTone?: "warn" | "orange";
}

export default function VendorSidebar({
    activeTab,
    setActiveTab,
    vendor,
    pendingOrders = 0,
    lowStock = 0,
}: SidebarProps) {
    const groups: { label: string; items: MenuItem[] }[] = [
        {
            label: "Workspace",
            items: [
                { id: "overview", label: "Overview", icon: "bi-grid-1x2" },
                {
                    id: "books",
                    label: "My Books",
                    icon: "bi-book-half",
                    badge: lowStock,
                    badgeTone: "warn",
                },
                {
                    id: "orders",
                    label: "Orders",
                    icon: "bi-bag-check",
                    badge: pendingOrders,
                    badgeTone: "orange",
                },
            ],
        },
        {
            label: "Insights",
            items: [
                { id: "sales", label: "Sales Analytics", icon: "bi-graph-up-arrow" },
                { id: "earnings", label: "Earnings", icon: "bi-cash-coin" },
                { id: "stockHistory", label: "Stock History", icon: "bi-journals" },
            ],
        },
        {
            label: "Account",
            items: [
                {
                    id: "profile",
                    label: "Shop Profile",
                    icon: "bi-shop",
                },
                {
                    id: "security",
                    label: "Security",
                    icon: "bi-shield-lock",
                },
            ],
        },
    ];

    return (
        <aside className="vp-sidebar">
            <div className="vp-shop">
                <div className="vp-shop-row">
                    <img
                        className="vp-shop-avatar"
                        src={vendor.logoUrl || PLACEHOLDER_SHOP_LOGO}
                        alt={vendor.shopName}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_SHOP_LOGO)}
                    />
                    <div style={{ minWidth: 0 }}>
                        <p className="vp-shop-name" title={vendor.shopName}>
                            {vendor.shopName}
                        </p>
                        <span className="vp-shop-badge">
                            <i className="bi bi-circle-fill"></i>
                            {vendor.isActive ? "Live store" : "Inactive"}
                        </span>
                    </div>
                </div>
            </div>

            <nav className="vp-nav" aria-label="Vendor sections">
                {groups.map((group) => (
                    <div key={group.label} style={{ display: "contents" }}>
                        <span className="vp-nav-label">{group.label}</span>
                        {group.items.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                className={`vp-nav-item ${activeTab === item.id ? "active" : ""}`}
                                onClick={() => setActiveTab(item.id)}
                                aria-current={activeTab === item.id ? "page" : undefined}
                            >
                                <span className="vp-nav-icon">
                                    <i className={`bi ${item.icon}`}></i>
                                </span>
                                <span className="vp-nav-text">{item.label}</span>
                                {!!item.badge && item.badge > 0 && (
                                    <span className={`vp-nav-badge ${item.badgeTone ?? ""}`}>
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="vp-side-foot">
                <Link to="/" className="vp-btn vp-btn-ghost vp-btn-sm" style={{ width: "100%" }}>
                    <i className="bi bi-box-arrow-up-right"></i>
                    View storefront
                </Link>
            </div>
        </aside>
    );
}
