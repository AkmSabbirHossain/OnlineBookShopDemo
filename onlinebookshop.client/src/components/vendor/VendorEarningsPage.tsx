import React, { useEffect, useState } from "react";
import VendorPayoutService from "../../services/VendorPayout.service";
import type { VendorEarning, VendorPayout } from "../../types/vendorPayout.types";
import VendorService from "../../services/vendor.service";

export default function VendorEarningsPage() {
    const [vendorId, setVendorId] = useState<number | null>(null);
    const [earnings, setEarnings] = useState<VendorEarning[]>([]);
    const [history, setHistory] = useState<VendorPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const vendor = await VendorService.getMyProfile();
                setVendorId(vendor.vendorId);
                const [earningsData, historyData] = await Promise.all([
                    VendorPayoutService.getVendorPendingEarnings(vendor.vendorId),
                    VendorPayoutService.getPayoutHistory(vendor.vendorId),
                ]);
                setEarnings(earningsData);
                setHistory(historyData);
            } catch {
                setError("তথ্য load করা যায়নি। আবার চেষ্টা করুন।");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const pendingTotal = earnings.reduce((sum, e) => sum + e.netAmount, 0);
    const paidTotal = history
        .filter((p) => p.status.toLowerCase() === "completed" || p.status.toLowerCase() === "success")
        .reduce((sum, p) => sum + p.amount, 0);

    if (loading)
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: "60vh" }}>
                <div
                    className="spinner-border"
                    role="status"
                    style={{ width: "3rem", height: "3rem", color: "#8b5cf6" }}
                />
                <h5 className="mt-3 text-muted">Loading...</h5>
            </div>
        );

    if (error)
        return (
            <div className="container mt-4">
                <div className="alert alert-danger shadow-sm rounded-4 border-0">{error}</div>
            </div>
        );

    if (!vendorId)
        return (
            <div className="text-center mt-5 text-muted">
                <h5>Vendor profile পাওয়া যায়নি।</h5>
            </div>
        );

    return (
        <div className="container mt-5 mb-5">
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
                        💰
                    </div>
                    <h2 className="mb-0 fw-bold" style={{ color: "#1e1b2e" }}>
                       My Earning
                    </h2>
                </div>

                {/* Summary Cards */}
                <div className="row g-3 mb-5">
                    <div className="col-12 col-md-6">
                        <div
                            className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
                                color: "#fff",
                            }}
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
                            <p
                                className="mb-1 text-uppercase fw-semibold"
                                style={{ letterSpacing: "1px", fontSize: "13px", opacity: 0.85 }}
                            >
                                Pending Balance
                            </p>
                            <h1 className="mb-0 fw-bold">৳{pendingTotal.toFixed(2)}</h1>
                        </div>
                    </div>
                    <div className="col-12 col-md-6">
                        <div
                            className="p-4 rounded-4 shadow-sm h-100 position-relative overflow-hidden"
                            style={{
                                background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                                color: "#fff",
                            }}
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
                            <p
                                className="mb-1 text-uppercase fw-semibold"
                                style={{ letterSpacing: "1px", fontSize: "13px", opacity: 0.85 }}
                            >
                                Total Paid
                            </p>
                            <h1 className="mb-0 fw-bold">৳{paidTotal.toFixed(2)}</h1>
                        </div>
                    </div>
                </div>

                {/* Pending Earnings Section */}
                <div className="d-flex align-items-center gap-2 mb-3">
                    <span
                        style={{
                            width: 6,
                            height: 22,
                            borderRadius: 4,
                            background: "linear-gradient(180deg, #8b5cf6, #14b8a6)",
                        }}
                    />
                    <h4 className="mb-0 fw-semibold" style={{ color: "#1e1b2e" }}>
                        Pending Earnings
                    </h4>
                </div>

                {earnings.length === 0 ? (
                    <div
                        className="text-center text-muted rounded-4 py-4 mb-5"
                        style={{ background: "rgba(139,92,246,0.05)" }}
                    >
                        <p className="mb-0 fst-italic">There is no pending earning</p>
                    </div>
                ) : (
                    <div className="table-responsive mb-5 rounded-4 shadow-sm" style={{ overflow: "hidden" }}>
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e6fffa 100%)" }}>
                                    <th scope="col" className="border-0 py-3 ps-4">Order Item</th>
                                    <th scope="col" className="border-0 py-3">Net Amount</th>
                                    <th scope="col" className="border-0 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map((e) => (
                                    <tr key={e.vendorEarningId}>
                                        <td className="fw-medium ps-4">#{e.orderItemId}</td>
                                        <td className="fw-bold" style={{ color: "#8b5cf6" }}>
                                            ৳{e.netAmount.toFixed(2)}
                                        </td>
                                        <td className="text-muted">{new Date(e.earnedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Payout History Section */}
                <div className="d-flex align-items-center gap-2 mb-3">
                    <span
                        style={{
                            width: 6,
                            height: 22,
                            borderRadius: 4,
                            background: "linear-gradient(180deg, #8b5cf6, #14b8a6)",
                        }}
                    />
                    <h4 className="mb-0 fw-semibold" style={{ color: "#1e1b2e" }}>
                        Payout History
                    </h4>
                </div>

                {history.length === 0 ? (
                    <div
                        className="text-center text-muted rounded-4 py-4"
                        style={{ background: "rgba(20,184,166,0.05)" }}
                    >
                        <p className="mb-0 fst-italic">No payout yet</p>
                    </div>
                ) : (
                    <div className="table-responsive rounded-4 shadow-sm" style={{ overflow: "hidden" }}>
                        <table className="table table-hover align-middle mb-0">
                            <thead>
                                <tr style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e6fffa 100%)" }}>
                                    <th scope="col" className="border-0 py-3 ps-4">Amount</th>
                                    <th scope="col" className="border-0 py-3">Status</th>
                                    <th scope="col" className="border-0 py-3">Paid At</th>
                                    <th scope="col" className="border-0 py-3 pe-4">Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((p) => {
                                    const statusLower = p.status.toLowerCase();
                                    let badgeStyle: React.CSSProperties = {
                                        fontSize: "12px",
                                        padding: "6px 14px",
                                        fontWeight: 600,
                                        letterSpacing: "0.3px",
                                    };
                                    if (statusLower === "completed" || statusLower === "success") {
                                        badgeStyle = {
                                            ...badgeStyle,
                                            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                                            color: "#fff",
                                        };
                                    } else if (statusLower === "pending") {
                                        badgeStyle = {
                                            ...badgeStyle,
                                            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                                            color: "#1e1b2e",
                                        };
                                    } else {
                                        badgeStyle = {
                                            ...badgeStyle,
                                            background: "linear-gradient(135deg, #f87171, #ef4444)",
                                            color: "#fff",
                                        };
                                    }
                                    return (
                                        <tr key={p.vendorPayoutId}>
                                            <td className="fw-bold ps-4">৳{p.amount.toFixed(2)}</td>
                                            <td>
                                                <span className="badge rounded-pill" style={badgeStyle}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="text-muted">{new Date(p.paidAt).toLocaleDateString()}</td>
                                            <td className="text-muted pe-4">{p.transactionReference || "-"}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}