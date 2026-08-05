// =============================================
// VendorSidebar.tsx — Updated: Sales Analytics added
// =============================================

import type { VendorResponseDto } from "../../types/vendor.types";

type Tab = "books" | "orders" | "stockHistory" | "sales" | "profile" | "security";

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    vendor: VendorResponseDto | null;
}

const menuItems = [
    {
        id: "books" as Tab,
        label: "My Books",
        icon: "bi-book-half",
        colors: {
            bg: "#EEEDFE",
            iconBg: "#534AB7",
            text: "#3C3489",
            bar: "#534AB7",
        },
    },
    {
        id: "orders" as Tab,
        label: "Orders",
        icon: "bi-bag-check-fill",
        colors: {
            bg: "#FAEEDA",
            iconBg: "#EF9F27",
            text: "#854F0B",
            bar: "#EF9F27",
        },
    },
    // ── Sales Analytics ──
    {
        id: "sales" as Tab,
        label: "Sales Analytics",
        icon: "bi-graph-up-arrow",
        colors: {
            bg: "#FEF3C7",
            iconBg: "#F59E0B",
            text: "#92400E",
            bar: "#F59E0B",
        },
    },
    {
        id: "stockHistory" as Tab,
        label: "Stock History",
        icon: "bi-journals",
        colors: {
            bg: "#E6F4EA",
            iconBg: "#34A853",
            text: "#137333",
            bar: "#34A853",
        },
    },
    {
        id: "profile" as Tab,
        label: "Shop Profile",
        icon: "bi-gear-fill",
        colors: {
            bg: "#E1F5EE",
            iconBg: "#1D9E75",
            text: "#0F6E56",
            bar: "#1D9E75",
        },
    },
    {
        id: "security" as Tab,
        label: "Change Password",
        icon: "bi-shield-lock-fill",
        colors: {
            bg: "#FBEAF0",
            iconBg: "#D4537E",
            text: "#993556",
            bar: "#D4537E",
        },
    },
];

const PLACEHOLDER_LOGO = "https://placehold.co/150?text=Shop+Logo";

export default function VendorSidebar({ activeTab, setActiveTab, vendor }: SidebarProps) {
    return (
        <div
            className="card border-0 shadow-sm p-3 h-100"
            style={{ minHeight: "80vh", borderRadius: "20px", background: "white" }}
        >
            {/* Vendor Header with gradient */}
            {vendor && (
                <div
                    className="text-center mb-4 p-3 position-relative overflow-hidden"
                    style={{
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #534AB7 0%, #7F77DD 60%, #5DCAA5 100%)",
                    }}
                >
                    {/* Decorative circles */}
                    <div
                        className="position-absolute"
                        style={{
                            top: -20, right: -20, width: 80, height: 80,
                            borderRadius: "50%", background: "rgba(255,255,255,0.12)",
                        }}
                    />
                    <div
                        className="position-absolute"
                        style={{
                            bottom: -10, left: 30, width: 50, height: 50,
                            borderRadius: "50%", background: "rgba(255,255,255,0.07)",
                        }}
                    />

                    <div className="position-relative d-inline-block mb-2">
                        <img
                            src={vendor.logoUrl || PLACEHOLDER_LOGO}
                            alt={vendor.shopName}
                            className="rounded-circle"
                            style={{
                                width: 72, height: 72, objectFit: "cover",
                                border: "3px solid rgba(255,255,255,0.85)",
                            }}
                        />
                        <span
                            className="position-absolute bottom-0 end-0"
                            style={{
                                width: 13, height: 13, borderRadius: "50%",
                                background: vendor.isActive ? "#5DCAA5" : "#888",
                                border: "2px solid white",
                            }}
                        />
                    </div>

                    <h5
                        className="fw-bold mb-2 text-truncate px-2"
                        style={{ color: "#fff", letterSpacing: "-0.3px", fontSize: 15 }}
                    >
                        {vendor.shopName}
                    </h5>
                    <span
                        className="text-uppercase fw-bold"
                        style={{
                            fontSize: 10, letterSpacing: "0.8px", color: "#fff",
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: 20, padding: "3px 12px",
                        }}
                    >
                        Vendor Portal
                    </span>
                </div>
            )}

            {/* Navigation Menu */}
            <div className="d-flex flex-column gap-2">
                {menuItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const { bg, iconBg, text, bar } = item.colors;

                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className="border-0 d-flex align-items-center gap-3 position-relative overflow-hidden w-100 text-start"
                            style={{
                                borderRadius: 12,
                                padding: "10px 14px",
                                background: isActive ? bg : "var(--bs-gray-100, #f8f9fa)",
                                color: isActive ? text : "#6c757d",
                                fontWeight: 500,
                                fontSize: 13.5,
                                transition: "all 0.2s ease",
                                transform: isActive ? "translateX(2px)" : "none",
                                cursor: "pointer",
                            }}
                        >
                            {/* Left color bar */}
                            {isActive && (
                                <span
                                    className="position-absolute start-0 top-0 bottom-0"
                                    style={{
                                        width: 3, borderRadius: "0 3px 3px 0",
                                        background: bar,
                                        top: 6, bottom: 6, height: "calc(100% - 12px)",
                                    }}
                                />
                            )}

                            {/* Icon box */}
                            <span
                                className="d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{
                                    width: 34, height: 34, borderRadius: 9,
                                    background: isActive ? iconBg : "#e9ecef",
                                    transition: "background 0.2s",
                                }}
                            >
                                <i
                                    className={`bi ${item.icon} fs-6`}
                                    style={{ color: isActive ? "#fff" : "#adb5bd" }}
                                />
                            </span>

                            <span style={{ flex: 1 }}>{item.label}</span>

                            {/* Chevron */}
                            <i
                                className="bi bi-chevron-right"
                                style={{
                                    fontSize: 12, color: isActive ? bar : "transparent",
                                    transition: "color 0.2s",
                                }}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}