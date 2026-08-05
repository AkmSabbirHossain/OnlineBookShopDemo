// src/pages/admin/VendorPayoutAdminPage.tsx
import React, { useEffect, useState } from "react";
import VendorPayoutService from "../services/VendorPayout.service";
import type { VendorPayoutSummary, VendorEarning } from "../types/vendorPayout.types";

export default function VendorPayoutAdminPage() {
    const [summaries, setSummaries] = useState<VendorPayoutSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [expandedVendorId, setExpandedVendorId] = useState<number | null>(null);
    const [earnings, setEarnings] = useState<VendorEarning[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await VendorPayoutService.getPendingSummary();
            setSummaries(data);
        } catch {
            setError("Pending payout summary load করা যায়নি।");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSummary();
    }, []);

    const handleViewDetails = async (vendorId: number) => {
        if (expandedVendorId === vendorId) {
            setExpandedVendorId(null);
            return;
        }
        const data = await VendorPayoutService.getVendorPendingEarnings(vendorId);
        setEarnings(data);
        setExpandedVendorId(vendorId);
    };

    const handleProcessPayout = async (vendorId: number) => {
        if (!window.confirm("এই vendor এর জন্য payout process করবেন?")) return;

        setProcessingId(vendorId);
        setError(null);
        try {
            await VendorPayoutService.processPayout({ vendorId });
            await loadSummary();
            setExpandedVendorId(null);
        } catch {
            setError("Payout process করতে সমস্যা হয়েছে।");
        } finally {
            setProcessingId(null);
        }
    };

    const totalPending = summaries.reduce((sum, s) => sum + s.pendingAmount, 0);
    const totalEarningsCount = summaries.reduce((sum, s) => sum + s.pendingEarningsCount, 0);

    if (loading)
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "50vh" }}>
                <div
                    className="spinner-border"
                    role="status"
                    style={{ width: "3rem", height: "3rem", color: "#8b5cf6" }}
                />
                <h5 className="mt-3 text-muted">Loading...</h5>
            </div>
        );

    return (
        <div className="container-fluid mt-5 mb-5" style={{ maxWidth: "1200px" }}>
            <div
                className="p-4 p-md-5 rounded-4 shadow-lg"
                style={{
                    background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
                    border: "1px solid rgba(139, 92, 246, 0.1)",
                }}
            >
                {/* Header */}
                <div className="d-flex align-items-center gap-3 mb-4 pb-3" style={{ borderBottom: "2px solid rgba(139,92,246,0.15)" }}>
                    <div
                        className="d-flex align-items-center justify-content-center rounded-circle"
                        style={{
                            width: 48,
                            height: 48,
                            background: "linear-gradient(135deg, #8b5cf6 0%, #14b8a6 100%)",
                            fontSize: "22px",
                        }}
                    >
                        🏦
                    </div>
                    <h2 className="mb-0 fw-bold" style={{ color: "#1e1b2e" }}>
                        Vendor Payouts
                    </h2>
                </div>

                {error && (
                    <div
                        className="rounded-4 px-4 py-3 mb-4"
                        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
                    >
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="row g-3 mb-5">
                    <div className="col-12 col-md-6">
                        <div
                            className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", color: "#fff" }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: -30,
                                    right: -30,
                                    width: 120,
                                    height: 120,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.08)",
                                }}
                            />
                            <p className="mb-1 text-uppercase fw-semibold" style={{ letterSpacing: "1px", fontSize: "13px", opacity: 0.85 }}>
                                Total Pending Amount
                            </p>
                            <h1 className="mb-0 fw-bold">৳{totalPending.toFixed(2)}</h1>
                        </div>
                    </div>
                    <div className="col-12 col-md-6">
                        <div
                            className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden"
                            style={{ background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)", color: "#fff" }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: -30,
                                    right: -30,
                                    width: 120,
                                    height: 120,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.08)",
                                }}
                            />
                            <p className="mb-1 text-uppercase fw-semibold" style={{ letterSpacing: "1px", fontSize: "13px", opacity: 0.85 }}>
                                Vendors With Pending Earnings
                            </p>
                            <h1 className="mb-0 fw-bold">
                                {summaries.length}{" "}
                                <span style={{ fontSize: "16px", fontWeight: 500, opacity: 0.85 }}>
                                    ({totalEarningsCount} earnings)
                                </span>
                            </h1>
                        </div>
                    </div>
                </div>

                {summaries.length === 0 ? (
                    <div className="text-center text-muted rounded-4 py-5" style={{ background: "rgba(139,92,246,0.05)" }}>
                        <p className="mb-0 fst-italic">এই মুহূর্তে কোনো pending payout নেই।</p>
                    </div>
                ) : (
                    <div className="rounded-4 shadow-sm" style={{ overflow: "hidden" }}>
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e6fffa 100%)" }}>
                                        <th className="border-0 py-3 ps-4">Vendor</th>
                                        <th className="border-0 py-3">Pending Amount</th>
                                        <th className="border-0 py-3">Earnings Count</th>
                                        <th className="border-0 py-3 pe-4 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summaries.map((s) => (
                                        <React.Fragment key={s.vendorId}>
                                            <tr>
                                                <td className="fw-semibold ps-4" style={{ color: "#1e1b2e" }}>
                                                    {s.vendorName}
                                                </td>
                                                <td className="fw-bold" style={{ color: "#8b5cf6" }}>
                                                    ৳{s.pendingAmount.toFixed(2)}
                                                </td>
                                                <td className="text-muted">{s.pendingEarningsCount}</td>
                                                <td className="pe-4">
                                                    <div className="d-flex justify-content-end gap-2">
                                                        <button
                                                            onClick={() => handleViewDetails(s.vendorId)}
                                                            className="btn btn-sm rounded-pill px-3"
                                                            style={{
                                                                border: "1.5px solid #8b5cf6",
                                                                color: "#8b5cf6",
                                                                background: "transparent",
                                                                fontWeight: 600,
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {expandedVendorId === s.vendorId ? "Hide" : "Details"}
                                                        </button>
                                                        <button
                                                            disabled={processingId === s.vendorId}
                                                            onClick={() => handleProcessPayout(s.vendorId)}
                                                            className="btn btn-sm rounded-pill px-3 text-white"
                                                            style={{
                                                                background:
                                                                    processingId === s.vendorId
                                                                        ? "#a3a3a3"
                                                                        : "linear-gradient(135deg, #8b5cf6 0%, #14b8a6 100%)",
                                                                border: "none",
                                                                fontWeight: 600,
                                                                fontSize: "13px",
                                                            }}
                                                        >
                                                            {processingId === s.vendorId ? "Processing..." : "Pay Now"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedVendorId === s.vendorId && (
                                                <tr>
                                                    <td colSpan={4} className="p-0">
                                                        <div className="p-4" style={{ background: "rgba(139,92,246,0.04)" }}>
                                                            <div className="rounded-4 shadow-sm bg-white" style={{ overflow: "hidden" }}>
                                                                <table className="table table-sm mb-0 align-middle">
                                                                    <thead>
                                                                        <tr style={{ background: "rgba(139,92,246,0.08)" }}>
                                                                            <th className="border-0 py-2 ps-3" style={{ fontSize: "12px" }}>Order Item</th>
                                                                            <th className="border-0 py-2" style={{ fontSize: "12px" }}>Gross</th>
                                                                            <th className="border-0 py-2" style={{ fontSize: "12px" }}>Commission</th>
                                                                            <th className="border-0 py-2" style={{ fontSize: "12px" }}>Net</th>
                                                                            <th className="border-0 py-2 pe-3" style={{ fontSize: "12px" }}>Earned At</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {earnings.map((e) => (
                                                                            <tr key={e.vendorEarningId}>
                                                                                <td className="ps-3 text-muted" style={{ fontSize: "13px" }}>
                                                                                    #{e.orderItemId}
                                                                                </td>
                                                                                <td className="text-muted" style={{ fontSize: "13px" }}>
                                                                                    ৳{e.grossAmount.toFixed(2)}
                                                                                </td>
                                                                                <td className="text-muted" style={{ fontSize: "13px" }}>
                                                                                    ৳{e.commissionAmount.toFixed(2)}
                                                                                </td>
                                                                                <td className="fw-bold" style={{ fontSize: "13px", color: "#0d9488" }}>
                                                                                    ৳{e.netAmount.toFixed(2)}
                                                                                </td>
                                                                                <td className="pe-3 text-muted" style={{ fontSize: "13px" }}>
                                                                                    {new Date(e.earnedAt).toLocaleDateString()}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}