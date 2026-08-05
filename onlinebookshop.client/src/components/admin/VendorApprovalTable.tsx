// =============================================
// VendorApprovalTable.tsx — Detailed Version
// =============================================
import React from "react";
import type { VendorResponseDto } from "../../types/admin.types";

interface Props {
    vendors: VendorResponseDto[];
    allVendors: VendorResponseDto[];
    onApprove: (vendorId: number) => void;
    onReject: (vendorId: number) => void;
    onSuspend: (vendorId: number) => void;
    onActivate: (vendorId: number) => void;
    processingId: number | null;
}

const VendorApprovalTable: React.FC<Props> = ({
    vendors,
    allVendors,
    onApprove,
    onReject,
    onSuspend,
    onActivate,
    processingId,
}) => {
    return (
        <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom">
                <h5 className="mb-0 fw-semibold">
                    <i className="bi bi-people me-2"></i>
                    Vendor Approval & Management
                </h5>
            </div>
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Shop Name</th>
                                <th>Contact Info</th>
                                <th>Details</th>
                                <th>Applied On</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-5 text-muted">
                                        No pending vendor requests at the moment.
                                    </td>
                                </tr>
                            ) : (
                                vendors.map((vendor) => {
                                    const isProcessing = processingId === vendor.vendorId;
                                    const fullVendor = allVendors.find(v => v.vendorId === vendor.vendorId);
                                    const isActive = fullVendor?.isActive ?? true;

                                    return (
                                        <tr key={vendor.vendorId}>
                                            {/* Shop Name */}
                                            <td className="fw-semibold">
                                                {vendor.shopName}
                                                {vendor.adminNote && (
                                                    <small className="text-muted d-block">{vendor.adminNote}</small>
                                                )}
                                            </td>

                                            {/* Contact Info */}
                                            <td>
                                                <div className="small">
                                                    <div><strong>Phone:</strong> {vendor.phoneNumber || "—"}</div>
                                                    <div><strong>City:</strong> {vendor.city || "—"}</div>
                                                    <div><strong>Address:</strong> {vendor.address || "—"}</div>
                                                </div>
                                            </td>

                                            {/* Details */}
                                            <td className="small text-muted">
                                                {vendor.description
                                                    ? vendor.description.substring(0, 80) + "..."
                                                    : "No description provided"}
                                            </td>

                                            {/* Applied Date */}
                                            <td>
                                                {new Date(vendor.createdAt).toLocaleDateString("en-GB", {
                                                    day: "numeric",
                                                    month: "short",
                                                    year: "numeric"
                                                })}
                                            </td>

                                            {/* Status */}
                                            <td>
                                                <span className="badge bg-warning me-1">Pending Approval</span>
                                                {!isActive && <span className="badge bg-danger">Suspended</span>}
                                                {vendor.isApproved && (
                                                    <span className="badge bg-success">Approved</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td>
                                                <div className="btn-group btn-group-sm" role="group">
                                                    <button
                                                        className="btn btn-success"
                                                        onClick={() => onApprove(vendor.vendorId)}
                                                        disabled={isProcessing}
                                                    >
                                                        {isProcessing ? "..." : "Approve"}
                                                    </button>
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => onReject(vendor.vendorId)}
                                                        disabled={isProcessing}
                                                    >
                                                        Reject
                                                    </button>

                                                    {vendor.isApproved && (
                                                        isActive ? (
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => onSuspend(vendor.vendorId)}
                                                                disabled={isProcessing}
                                                            >
                                                                Suspend
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() => onActivate(vendor.vendorId)}
                                                                disabled={isProcessing}
                                                            >
                                                                Activate
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorApprovalTable;