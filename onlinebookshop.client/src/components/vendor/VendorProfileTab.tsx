// =============================================
// VendorProfileTab.tsx — Shop profile
// =============================================

import { useState } from "react";
import axios from "axios";
import type { VendorResponseDto } from "../../types/vendor.types";
import VendorService from "../../services/vendor.service";
import { formatDate, PLACEHOLDER_SHOP_LOGO } from "./vendorUtils";

interface Props {
    vendor: VendorResponseDto;
    onProfileUpdated: (updatedVendor: VendorResponseDto) => void;
    showToast: (msg: string, type: "success" | "danger") => void;
}

const PLACEHOLDER_BANNER = "https://placehold.co/1200x320/1b2a4a/ffffff?text=Shop+Banner";

export default function VendorProfileTab({ vendor, onProfileUpdated, showToast }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState("");
    const [form, setForm] = useState({
        shopName: vendor.shopName,
        description: vendor.description || "",
        logoUrl: vendor.logoUrl || "",
        bannerUrl: vendor.bannerUrl || "",
        phoneNumber: vendor.phoneNumber || "",
        address: vendor.address || "",
        city: vendor.city || "",
        businessRegistrationNumber: vendor.businessRegistrationNumber || "",
    });

    const startEdit = () => {
        setForm({
            shopName: vendor.shopName,
            description: vendor.description || "",
            logoUrl: vendor.logoUrl || "",
            bannerUrl: vendor.bannerUrl || "",
            phoneNumber: vendor.phoneNumber || "",
            address: vendor.address || "",
            city: vendor.city || "",
            businessRegistrationNumber: vendor.businessRegistrationNumber || "",
        });
        setFormError("");
        setIsEditing(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.shopName.trim()) {
            setFormError("Shop name is required.");
            return;
        }
        setLoading(true);
        setFormError("");
        try {
            const updated = await VendorService.updateMyProfile(form);
            onProfileUpdated(updated);
            setIsEditing(false);
            showToast("Shop profile updated.", "success");
        } catch (err: unknown) {
            const message = axios.isAxiosError(err)
                ? (err.response?.data?.error as string) ||
                  (err.response?.data?.Error as string) ||
                  "Could not save changes."
                : "Could not save changes.";
            setFormError(message);
            showToast("Profile update failed.", "danger");
        } finally {
            setLoading(false);
        }
    };

    const infoRows = [
        {
            label: "Phone",
            value: vendor.phoneNumber || "—",
            icon: "bi-telephone",
        },
        {
            label: "City / Region",
            value: vendor.city || "—",
            icon: "bi-building",
        },
        {
            label: "Trade license",
            value: vendor.businessRegistrationNumber || "—",
            icon: "bi-patch-check",
        },
        {
            label: "Country",
            value: vendor.country || "Bangladesh",
            icon: "bi-globe-asia-australia",
        },
        {
            label: "Full address",
            value: vendor.address || "—",
            icon: "bi-geo-alt",
        },
        {
            label: "Member since",
            value: formatDate(vendor.createdAt),
            icon: "bi-calendar-check",
        },
    ];

    return (
        <div className="vp-card" style={{ overflow: "hidden" }}>
            <div style={{ position: "relative", height: 190, background: "#1b2a4a" }}>
                <img
                    src={form.bannerUrl || PLACEHOLDER_BANNER}
                    alt="Shop banner"
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }}
                    onError={(e) => (e.currentTarget.src = PLACEHOLDER_BANNER)}
                />
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(180deg, rgba(15,23,42,0.05) 0%, rgba(15,23,42,0.55) 100%)",
                    }}
                ></div>
                <div
                    style={{
                        position: "absolute",
                        left: 24,
                        bottom: 16,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 16,
                    }}
                >
                    <img
                        src={form.logoUrl || PLACEHOLDER_SHOP_LOGO}
                        alt="Shop logo"
                        style={{
                            width: 88,
                            height: 88,
                            borderRadius: 18,
                            objectFit: "cover",
                            border: "3px solid #fff",
                            background: "#fff",
                            transform: "translateY(34%)",
                            boxShadow: "0 10px 24px rgba(15,23,42,0.25)",
                        }}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_SHOP_LOGO)}
                    />
                    <div style={{ paddingBottom: 6 }}>
                        <h3
                            style={{
                                color: "#fff",
                                fontSize: 20,
                                fontWeight: 800,
                                margin: 0,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {vendor.shopName}
                        </h3>
                        <span
                            className={`vp-pill ${vendor.isApproved ? "delivered" : "pending"}`}
                            style={{ marginTop: 6 }}
                        >
                            <i
                                className={`bi ${vendor.isApproved ? "bi-patch-check-fill" : "bi-hourglass-split"}`}
                            ></i>
                            {vendor.isApproved ? "Verified vendor" : "Pending approval"}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ height: 48 }}></div>

            <div className="vp-card-head" style={{ borderTop: "1px solid #e6ebf2" }}>
                <div>
                    <h3 className="vp-card-title">
                        <i className="bi bi-shop"></i>
                        Shop details
                    </h3>
                    <p className="vp-subtitle" style={{ marginTop: 4 }}>
                        This information is shown to customers on your storefront.
                    </p>
                </div>
                {!isEditing && (
                    <button type="button" className="vp-btn vp-btn-sm" onClick={startEdit}>
                        <i className="bi bi-pencil"></i>
                        Edit profile
                    </button>
                )}
            </div>

            <div className="vp-card-body">
                {!isEditing ? (
                    <>
                        <div
                            style={{
                                background: "#f8fafc",
                                borderRadius: 12,
                                padding: "14px 16px",
                                marginBottom: 18,
                            }}
                        >
                            <p className="vp-kpi-label" style={{ marginBottom: 6 }}>
                                About the shop
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: "#526078",
                                    lineHeight: 1.7,
                                }}
                            >
                                {vendor.description ||
                                    "No description yet. Add a short introduction so buyers know what you sell."}
                            </p>
                        </div>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {infoRows.map((row) => (
                                <div
                                    key={row.label}
                                    style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                                >
                                    <span className="vp-nav-icon" style={{ flexShrink: 0 }}>
                                        <i className={`bi ${row.icon}`}></i>
                                    </span>
                                    <div style={{ minWidth: 0 }}>
                                        <p className="vp-kpi-label" style={{ marginBottom: 3 }}>
                                            {row.label}
                                        </p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: "#16233d",
                                                wordBreak: "break-word",
                                            }}
                                        >
                                            {row.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {formError && (
                            <div className="vp-alert danger" role="alert">
                                <i className="bi bi-exclamation-octagon"></i>
                                <div>
                                    <strong>Could not save</strong>
                                    <p>{formError}</p>
                                </div>
                            </div>
                        )}

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                                gap: 14,
                            }}
                        >
                            <label>
                                <span className="vp-kpi-label">Shop name</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    value={form.shopName}
                                    onChange={(e) =>
                                        setForm({ ...form, shopName: e.target.value })
                                    }
                                    maxLength={150}
                                    required
                                />
                            </label>
                            <label>
                                <span className="vp-kpi-label">Phone number</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    value={form.phoneNumber}
                                    onChange={(e) =>
                                        setForm({ ...form, phoneNumber: e.target.value })
                                    }
                                    placeholder="01XXXXXXXXX"
                                />
                            </label>
                            <label>
                                <span className="vp-kpi-label">Logo URL</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    type="url"
                                    value={form.logoUrl}
                                    onChange={(e) =>
                                        setForm({ ...form, logoUrl: e.target.value })
                                    }
                                    placeholder="https://..."
                                />
                            </label>
                            <label>
                                <span className="vp-kpi-label">Banner URL</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    type="url"
                                    value={form.bannerUrl}
                                    onChange={(e) =>
                                        setForm({ ...form, bannerUrl: e.target.value })
                                    }
                                    placeholder="https://..."
                                />
                            </label>
                            <label>
                                <span className="vp-kpi-label">Address</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm({ ...form, address: e.target.value })
                                    }
                                />
                            </label>
                            <label>
                                <span className="vp-kpi-label">City</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    value={form.city}
                                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                                />
                            </label>
                            <label>
                                <span className="vp-kpi-label">Business registration no.</span>
                                <input
                                    className="vp-input"
                                    style={{ width: "100%" }}
                                    value={form.businessRegistrationNumber}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            businessRegistrationNumber: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <label
                                style={{ gridColumn: "1 / -1" }}
                            >
                                <span className="vp-kpi-label">Shop description</span>
                                <textarea
                                    className="vp-input"
                                    style={{
                                        width: "100%",
                                        height: 96,
                                        padding: "10px 12px",
                                        resize: "vertical",
                                    }}
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm({ ...form, description: e.target.value })
                                    }
                                    maxLength={2000}
                                ></textarea>
                            </label>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                marginTop: 20,
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                type="button"
                                className="vp-btn"
                                onClick={() => setIsEditing(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="vp-btn vp-btn-primary" disabled={loading}>
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm" />
                                ) : (
                                    <i className="bi bi-check2"></i>
                                )}
                                Save changes
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
