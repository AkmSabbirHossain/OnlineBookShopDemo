import { useState } from "react";
import type { VendorResponseDto } from "../../types/vendor.types";
import VendorService from "../../services/vendor.service";

interface Props {
    vendor: VendorResponseDto;
    onProfileUpdated: (updatedVendor: VendorResponseDto) => void;
    showToast: (msg: string, type: "success" | "danger") => void;
}

export default function VendorProfileTab({ vendor, onProfileUpdated, showToast }: Props) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
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

    const PLACEHOLDER_BANNER = "https://placehold.co/800x250?text=No+Banner+Image";
    const PLACEHOLDER_LOGO = "https://placehold.co/150?text=No+Logo";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updated = await VendorService.updateMyProfile(form);
            onProfileUpdated(updated);
            setIsEditing(false);
            showToast("Profile updated successfully!", "success");
        } catch {
            showToast("Failed to update profile.", "danger");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
            {/* Banner Section */}
            <div className="position-relative bg-dark" style={{ height: "200px" }}>
                <img
                    src={form.bannerUrl || PLACEHOLDER_BANNER}
                    alt="Shop Banner"
                    className="w-100 h-100"
                    style={{ objectFit: "cover", opacity: "0.85" }}
                    onError={(e) => (e.currentTarget.src = PLACEHOLDER_BANNER)}
                />
                {/* Logo Section Overlay */}
                <div className="position-absolute start-0 bottom-0 ms-4 mb-3 d-flex align-items-end gap-3" style={{ transform: "translateY(35%)", zIndex: 2 }}>
                    <img
                        src={form.logoUrl || PLACEHOLDER_LOGO}
                        alt="Shop Logo"
                        className="rounded-circle border border-4 border-white shadow bg-white"
                        style={{ width: "110px", height: "110px", objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.src = PLACEHOLDER_LOGO)}
                    />
                    <div className="mb-4 d-none d-sm-block">
                        <h4 className="fw-bold text-white mb-0 text-shadow" style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.8)" }}>
                            {vendor.shopName}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Spacer for Floating Logo */}
            <div style={{ height: "55px" }}></div>

            <div className="card-body p-4 pt-2">
                <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                    <div>
                        <h5 className="fw-bold mb-1 d-block d-sm-none">{vendor.shopName}</h5>
                        <p className="text-muted small mb-0">Manage your store identity and public settings.</p>
                    </div>
                    {!isEditing && (
                        <button className="btn btn-outline-primary btn-sm px-3" onClick={() => setIsEditing(true)}>
                            <i className="bi bi-pencil me-1"></i> Edit Profile
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    /* ── Read Only View ── */
                    <div className="row g-4">
                        <div className="col-md-12">
                            <h6 className="fw-semibold text-secondary small text-uppercase">Shop Description</h6>
                            <p className="bg-light p-3 rounded-3 text-muted">{vendor.description || "No description provided yet."}</p>
                        </div>
                        <div className="col-sm-6 col-md-4">
                            <h6 className="fw-semibold text-secondary small text-uppercase">Phone Number</h6>
                            <p className="fw-medium"><i className="bi bi-telephone me-2 text-primary"></i>{vendor.phoneNumber || "—"}</p>
                        </div>
                        <div className="col-sm-6 col-md-4">
                            <h6 className="fw-semibold text-secondary small text-uppercase">City / Region</h6>
                            <p className="fw-medium"><i className="bi bi-building me-2 text-primary"></i>{vendor.city || "—"}</p>
                        </div>
                        <div className="col-sm-12 col-md-4">
                            <h6 className="fw-semibold text-secondary small text-uppercase">Trade License / Reg No</h6>
                            <p className="fw-medium"><i className="bi bi-patch-check me-2 text-success"></i>{vendor.businessRegistrationNumber || "—"}</p>
                        </div>
                        <div className="col-md-12">
                            <h6 className="fw-semibold text-secondary small text-uppercase">Full Address</h6>
                            <p className="fw-medium"><i className="bi bi-geo-alt me-2 text-danger"></i>{vendor.address || "—"}</p>
                        </div>
                    </div>
                ) : (
                    /* ── Edit Form Mode ── */
                    <form onSubmit={handleSubmit}>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Shop Name</label>
                                <input type="text" className="form-control" value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} required />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Phone Number</label>
                                <input type="text" className="form-control" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Logo URL</label>
                                <input type="url" className="form-control" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Banner URL</label>
                                <input type="url" className="form-control" value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="col-md-8">
                                <label className="form-label small fw-semibold">Address</label>
                                <input type="text" className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small fw-semibold">City</label>
                                <input type="text" className="form-control" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-semibold">Business Registration Number</label>
                                <input type="text" className="form-control" value={form.businessRegistrationNumber} onChange={(e) => setForm({ ...form, businessRegistrationNumber: e.target.value })} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-semibold">Shop Description</label>
                                <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}></textarea>
                            </div>
                            <div className="col-12 d-flex gap-2 mt-4">
                                <button type="submit" className="btn btn-primary px-4 btn-sm" disabled={loading}>
                                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : null} Save Changes
                                </button>
                                <button type="button" className="btn btn-outline-secondary px-4 btn-sm" onClick={() => setIsEditing(false)} disabled={loading}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}