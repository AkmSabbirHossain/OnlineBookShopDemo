// =============================================
// ActiveVendorTable.tsx — 
// =============================================
import type { VendorResponseDto } from "../../types/admin.types";

interface Props {
    vendors: VendorResponseDto[];
    onSuspend: (vendorId: number) => void;
    onActivate: (vendorId: number) => void;
    onDelete: (vendorId: number) => void;
    processingId: number | null;
}

export default function ActiveVendorTable({
    vendors,
    onSuspend,
    onActivate,
    onDelete,
    processingId,
}: Props) {
    if (vendors.length === 0) {
        return (
            <div className="alert alert-info text-center py-5">
                <i className="bi bi-shop fs-1 mb-3 text-info"></i>
                <h5>No Active Vendors Found</h5>
                <p className="mb-0">All approved vendors will appear here.</p>
            </div>
        );
    }

    return (
        <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3">
                <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 fw-semibold text-dark">
                        <i className="bi bi-shop me-2 text-success"></i>
                        All Active Vendors ({vendors.length})
                    </h5>
                    <span className="badge bg-success fs-6">
                        {vendors.filter(v => v.isActive).length} Active
                    </span>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                            <th style={{ width: "280px" }}>Vendor</th>
                            <th>Contact</th>
                            <th>Location</th>
                            <th>Joined</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.map((vendor) => {
                            const isProcessing = processingId === vendor.vendorId;

                            return (
                                <tr key={vendor.vendorId}>
                                    {/* Vendor Info with Logo */}
                                    <td>
                                        <div className="d-flex align-items-center gap-3">
                                            {vendor.logoUrl ? (
                                                <img
                                                    src={vendor.logoUrl}
                                                    alt={vendor.shopName}
                                                    className="rounded-circle border"
                                                    style={{ width: "48px", height: "48px", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div
                                                    className="rounded-circle bg-light border d-flex align-items-center justify-content-center fw-bold text-primary"
                                                    style={{ width: "48px", height: "48px", fontSize: "18px" }}
                                                >
                                                    {vendor.shopName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <div className="fw-semibold">{vendor.shopName}</div>
                                                {vendor.adminNote && (
                                                    <small className="text-muted">{vendor.adminNote}</small>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td>
                                        <div className="small">
                                            <div><i className="bi bi-telephone me-1"></i> {vendor.phoneNumber || "—"}</div>
                                  
                                        </div>
                                    </td>

                                    {/* Location */}
                                    <td className="small">
                                        {vendor.city && vendor.country
                                            ? `${vendor.city}, ${vendor.country}`
                                            : vendor.city || vendor.address || "—"}
                                    </td>

                                    {/* Joined Date */}
                                    <td className="small text-muted">
                                        {new Date(vendor.createdAt).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric"
                                        })}
                                    </td>

                                    {/* Status */}
                                    <td>
                                        <span
                                            className={`badge px-3 py-2 ${vendor.isActive
                                                    ? "bg-success"
                                                    : "bg-danger"
                                                }`}
                                        >
                                            {vendor.isActive ? "ACTIVE" : "SUSPENDED"}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="text-end">
                                        <div className="btn-group btn-group-sm" role="group">
                                            {vendor.isActive ? (
                                                <button
                                                    className="btn btn-warning"
                                                    onClick={() => onSuspend(vendor.vendorId)}
                                                    disabled={isProcessing}
                                                    title="Suspend Vendor"
                                                >
                                                    {isProcessing ? "Suspending..." : "Suspend"}
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-success"
                                                    onClick={() => onActivate(vendor.vendorId)}
                                                    disabled={isProcessing}
                                                    title="Activate Vendor"
                                                >
                                                    {isProcessing ? "Activating..." : "Activate"}
                                                </button>
                                            )}

                                            <button
                                                className="btn btn-danger"
                                                onClick={() => onDelete(vendor.vendorId)}
                                                disabled={isProcessing}
                                                title="Delete Vendor"
                                            >
                                                {isProcessing ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}