// =============================================
// VendorEarningsPage.tsx — Earnings & payouts
// =============================================

import { useCallback, useEffect, useState } from "react";
import VendorPayoutService from "../../services/VendorPayout.service";
import VendorService from "../../services/vendor.service";
import type { VendorEarning, VendorPayout } from "../../types/vendorPayout.types";
import { formatDate, formatTaka2 } from "./vendorUtils";

interface Props {
    vendorId?: number;
}

function payoutTone(status: string) {
    const value = status.toLowerCase();
    if (value === "completed" || value === "success" || value === "paid") return "delivered";
    if (value === "pending") return "pending";
    return "cancelled";
}

export default function VendorEarningsPage({ vendorId }: Props) {
    const [earnings, setEarnings] = useState<VendorEarning[]>([]);
    const [history, setHistory] = useState<VendorPayout[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const id = vendorId ?? (await VendorService.getMyProfile()).vendorId;
            const [earningsData, historyData] = await Promise.all([
                VendorPayoutService.getVendorPendingEarnings(id),
                VendorPayoutService.getPayoutHistory(id),
            ]);
            setEarnings(earningsData);
            setHistory(historyData);
        } catch {
            setError("Could not load earnings. Please retry.");
        } finally {
            setLoading(false);
        }
    }, [vendorId]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) {
        return (
            <div className="vp-kpi-grid">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="vp-skeleton" style={{ height: 116 }}></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="vp-alert danger">
                <i className="bi bi-exclamation-octagon"></i>
                <div>
                    <strong>Earnings unavailable</strong>
                    <p>{error}</p>
                </div>
                <button type="button" className="vp-btn vp-btn-sm" onClick={load}>
                    Retry
                </button>
            </div>
        );
    }

    const pendingTotal = earnings.reduce((sum, e) => sum + e.netAmount, 0);
    const paidPayouts = history.filter((p) => {
        const status = p.status.toLowerCase();
        return status === "completed" || status === "success" || status === "paid";
    });
    const paidTotal = paidPayouts.reduce((sum, p) => sum + p.amount, 0);

    const kpis = [
        {
            label: "Pending balance",
            value: formatTaka2(pendingTotal),
            sub: `${earnings.length} unsettled line${earnings.length !== 1 ? "s" : ""}`,
            icon: "bi-hourglass-split",
            tone: "tone-amber",
        },
        {
            label: "Total paid out",
            value: formatTaka2(paidTotal),
            sub: `${paidPayouts.length} completed payout${paidPayouts.length !== 1 ? "s" : ""}`,
            icon: "bi-cash-coin",
            tone: "tone-green",
        },
        {
            label: "Commission rate",
            value: "10%",
            sub: "Deducted per item sold",
            icon: "bi-percent",
            tone: "tone-navy",
        },
        {
            label: "Payout history",
            value: history.length.toString(),
            sub: "All requests",
            icon: "bi-receipt",
            tone: "tone-slate",
        },
    ];

    return (
        <>
            <div className="vp-kpi-grid">
                {kpis.map((k) => (
                    <div className="vp-kpi" key={k.label}>
                        <div className="vp-kpi-top">
                            <span className={`vp-kpi-icon ${k.tone}`}>
                                <i className={`bi ${k.icon}`}></i>
                            </span>
                        </div>
                        <p className="vp-kpi-label">{k.label}</p>
                        <p className="vp-kpi-value">{k.value}</p>
                        <p className="vp-kpi-sub">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="vp-card" style={{ marginBottom: 16 }}>
                <div className="vp-card-head">
                    <h3 className="vp-card-title">
                        <i className="bi bi-wallet2"></i>
                        Pending earnings
                        <span className="vp-count">{earnings.length}</span>
                    </h3>
                    <button
                        type="button"
                        className="vp-btn vp-btn-sm"
                        onClick={load}
                        title="Refresh earnings"
                    >
                        <i className="bi bi-arrow-clockwise"></i>
                        Refresh
                    </button>
                </div>

                {earnings.length === 0 ? (
                    <div className="vp-empty">
                        <div className="vp-empty-icon">
                            <i className="bi bi-wallet2"></i>
                        </div>
                        <h4>No pending earnings</h4>
                        <p>Earnings appear after a delivered order is settled.</p>
                    </div>
                ) : (
                    <div className="vp-table-wrap">
                        <table className="vp-table" style={{ minWidth: 520 }}>
                            <thead>
                                <tr>
                                    <th>Order item</th>
                                    <th>Net amount</th>
                                    <th>Earned on</th>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map((earning) => (
                                    <tr key={earning.vendorEarningId}>
                                        <td>
                                            <span style={{ fontWeight: 700, color: "#16233d" }}>
                                                #{earning.orderItemId}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: 800, color: "#0f9d58" }}>
                                                {formatTaka2(earning.netAmount)}
                                            </span>
                                        </td>
                                        <td>{formatDate(earning.earnedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="vp-card">
                <div className="vp-card-head">
                    <h3 className="vp-card-title">
                        <i className="bi bi-clock-history"></i>
                        Payout history
                        <span className="vp-count">{history.length}</span>
                    </h3>
                </div>

                {history.length === 0 ? (
                    <div className="vp-empty">
                        <div className="vp-empty-icon">
                            <i className="bi bi-receipt"></i>
                        </div>
                        <h4>No payouts yet</h4>
                        <p>Payouts issued by the platform will be listed here.</p>
                    </div>
                ) : (
                    <div className="vp-table-wrap">
                        <table className="vp-table" style={{ minWidth: 620 }}>
                            <thead>
                                <tr>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Paid at</th>
                                    <th>Reference</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((payout) => (
                                    <tr key={payout.vendorPayoutId}>
                                        <td>
                                            <span style={{ fontWeight: 800, color: "#16233d" }}>
                                                {formatTaka2(payout.amount)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`vp-pill ${payoutTone(payout.status)}`}>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td>{formatDate(payout.paidAt)}</td>
                                        <td className="vp-cell-sub">
                                            {payout.transactionReference || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}
