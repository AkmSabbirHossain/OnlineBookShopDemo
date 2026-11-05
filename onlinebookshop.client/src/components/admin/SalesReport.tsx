// =============================================
// SalesReport.tsx — Admin sales analytics + CSV export
// =============================================

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import SalesReportService from "../../services/salesReport.service";
import type { SalesReportDto } from "../../types/salesReport.types";

const currency = new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const shortNumber = new Intl.NumberFormat("en-BD", { maximumFractionDigits: 1 });

const toInputDate = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const defaultRange = () => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { from: toInputDate(start), to: toInputDate(today) };
};

const formatDay = (value: string) =>
    new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

const STATUS_COLORS: Record<string, string> = {
    Pending: "bg-warning text-dark",
    Paid: "bg-info text-dark",
    Shipped: "bg-primary",
    Delivered: "bg-success",
    Cancelled: "bg-danger",
};

export default function SalesReport() {
    const [{ from, to }, setRange] = useState(defaultRange);
    const [report, setReport] = useState<SalesReportDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    const loadReport = useCallback(async (rangeFrom: string, rangeTo: string) => {
        setLoading(true);
        setError("");
        try {
            setReport(
                await SalesReportService.getReport({
                    from: rangeFrom || undefined,
                    to: rangeTo || undefined,
                })
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "There was a problem loading the sales report.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initial = defaultRange();
        loadReport(initial.from, initial.to);
    }, [loadReport]);

    const handleApply = () => {
        if (from && to && from > to) {
            setError("The start date must be before the end date.");
            return;
        }
        loadReport(from, to);
    };

    const handleExport = async () => {
        setExporting(true);
        setError("");
        try {
            await SalesReportService.downloadCsv({
                from: from || undefined,
                to: to || undefined,
            });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "There was a problem exporting the report.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setExporting(false);
        }
    };

    const maxDailyRevenue = useMemo(
        () => Math.max(1, ...(report?.daily.map((d) => d.revenue) ?? [0])),
        [report]
    );

    const labelEvery = report ? Math.max(1, Math.ceil(report.daily.length / 8)) : 1;

    return (
        <div className="d-flex flex-column gap-3">
            {/* Controls */}
            <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body">
                    <div className="d-flex flex-wrap align-items-end gap-2">
                        <div>
                            <label className="form-label small fw-semibold mb-1" htmlFor="report-from">
                                From
                            </label>
                            <input
                                id="report-from"
                                type="date"
                                className="form-control form-control-sm"
                                value={from}
                                max={to || undefined}
                                onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="form-label small fw-semibold mb-1" htmlFor="report-to">
                                To
                            </label>
                            <input
                                id="report-to"
                                type="date"
                                className="form-control form-control-sm"
                                value={to}
                                min={from || undefined}
                                onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
                            />
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-dark fw-semibold"
                            onClick={handleApply}
                            disabled={loading}
                        >
                            <i className="bi bi-funnel me-1"></i>
                            Apply
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-success fw-semibold ms-auto"
                            onClick={handleExport}
                            disabled={exporting || loading}
                        >
                            {exporting ? (
                                <span className="spinner-border spinner-border-sm me-1" />
                            ) : (
                                <i className="bi bi-download me-1"></i>
                            )}
                            Export CSV
                        </button>
                    </div>
                    {error && <div className="alert alert-danger py-2 small mt-3 mb-0">{error}</div>}
                </div>
            </div>

            {loading ? (
                <div className="card border-0 shadow-sm rounded-3">
                    <div className="card-body text-center py-5">
                        <div className="spinner-border text-dark" />
                        <p className="text-muted small mt-2 mb-0">Building your report…</p>
                    </div>
                </div>
            ) : report ? (
                <>
                    {/* Summary cards */}
                    <div className="row g-3">
                        {[
                            {
                                label: "Gross sales",
                                value: `৳ ${currency.format(report.grossSales)}`,
                                icon: "bi-cash-stack",
                                tone: "text-success",
                            },
                            {
                                label: "Orders",
                                value: shortNumber.format(report.ordersCount),
                                icon: "bi-bag-check",
                                tone: "text-primary",
                            },
                            {
                                label: "Items sold",
                                value: shortNumber.format(report.itemsSold),
                                icon: "bi-book",
                                tone: "text-info",
                            },
                            {
                                label: "Avg. order value",
                                value: `৳ ${currency.format(report.averageOrderValue)}`,
                                icon: "bi-graph-up-arrow",
                                tone: "text-warning",
                            },
                            {
                                label: "Coupon discounts",
                                value: `৳ ${currency.format(report.totalDiscount)}`,
                                icon: "bi-ticket-perforated",
                                tone: "text-danger",
                            },
                        ].map((card) => (
                            <div className="col-6 col-lg" key={card.label}>
                                <div className="card border-0 shadow-sm rounded-3 h-100">
                                    <div className="card-body py-3">
                                        <div className="d-flex align-items-center gap-2 text-muted small mb-1">
                                            <i className={`bi ${card.icon} ${card.tone}`}></i>
                                            {card.label}
                                        </div>
                                        <div className="fw-bold fs-5">{card.value}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Daily revenue chart */}
                    <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-0 py-3 d-flex flex-wrap gap-2 justify-content-between">
                            <h6 className="fw-bold mb-0">
                                <i className="bi bi-bar-chart-line me-2 text-primary"></i>
                                Daily revenue
                            </h6>
                            <span className="small text-muted">
                                {report.from.slice(0, 10)} → {report.to.slice(0, 10)}
                            </span>
                        </div>
                        <div className="card-body">
                            {report.daily.length === 0 ? (
                                <p className="text-muted small mb-0">No sales in this period.</p>
                            ) : (
                                <div className="table-responsive">
                                    <div style={{ minWidth: "560px" }}>
                                        <div
                                            className="d-flex align-items-end gap-1 border-bottom"
                                            style={{ height: "180px" }}
                                        >
                                            {report.daily.map((day) => (
                                                <div
                                                    key={day.date}
                                                    className="flex-fill d-flex flex-column justify-content-end"
                                                    style={{ minWidth: "6px" }}
                                                    title={`${formatDay(day.date)} — ৳ ${currency.format(
                                                        day.revenue
                                                    )}, ${day.orders} order(s), ${day.items} item(s)`}
                                                >
                                                    <div
                                                        className="rounded-top bg-primary bg-opacity-75"
                                                        style={{
                                                            height: `${
                                                                day.revenue > 0
                                                                    ? Math.max(
                                                                          3,
                                                                          (day.revenue / maxDailyRevenue) * 100
                                                                      )
                                                                    : 0
                                                            }%`,
                                                            transition: "height 0.3s",
                                                        }}
                                                    ></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="d-flex gap-1 mt-1">
                                            {report.daily.map((day, index) => (
                                                <div
                                                    key={day.date}
                                                    className="flex-fill text-center text-muted"
                                                    style={{ minWidth: "6px", fontSize: "10px" }}
                                                >
                                                    {index % labelEvery === 0 ? formatDay(day.date) : ""}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="row g-3">
                        {/* Top books */}
                        <div className="col-12 col-xl-7">
                            <div className="card border-0 shadow-sm rounded-3 h-100">
                                <div className="card-header bg-white border-0 py-3">
                                    <h6 className="fw-bold mb-0">
                                        <i className="bi bi-trophy me-2 text-warning"></i>
                                        Top books
                                    </h6>
                                </div>
                                <div className="card-body p-0">
                                    {report.topBooks.length === 0 ? (
                                        <p className="text-muted small p-3 mb-0">
                                            No book sales in this period.
                                        </p>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table align-middle mb-0">
                                                <thead>
                                                    <tr className="small text-muted">
                                                        <th className="ps-3">#</th>
                                                        <th>Book</th>
                                                        <th className="text-end">Qty</th>
                                                        <th className="text-end pe-3">Revenue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {report.topBooks.map((book, index) => (
                                                        <tr key={book.bookId}>
                                                            <td className="ps-3 text-muted small">
                                                                {index + 1}
                                                            </td>
                                                            <td>
                                                                <a
                                                                    href={`/books/${book.bookId}`}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-decoration-none fw-semibold small d-block text-truncate"
                                                                    style={{ maxWidth: "220px" }}
                                                                >
                                                                    {book.title}
                                                                </a>
                                                                <span
                                                                    className="text-muted d-block text-truncate"
                                                                    style={{ fontSize: "11px", maxWidth: "220px" }}
                                                                >
                                                                    {[book.author, book.vendor]
                                                                        .filter(Boolean)
                                                                        .join(" · ")}
                                                                </span>
                                                            </td>
                                                            <td className="text-end small">{book.quantitySold}</td>
                                                            <td className="text-end small fw-semibold pe-3">
                                                                ৳ {currency.format(book.revenue)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vendors + status */}
                        <div className="col-12 col-xl-5">
                            <div className="card border-0 shadow-sm rounded-3 mb-3">
                                <div className="card-header bg-white border-0 py-3">
                                    <h6 className="fw-bold mb-0">
                                        <i className="bi bi-shop me-2 text-info"></i>
                                        Top vendors
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {report.topVendors.length === 0 ? (
                                        <p className="text-muted small mb-0">
                                            No vendor sales in this period.
                                        </p>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {report.topVendors.map((vendor, index) => (
                                                <div
                                                    key={vendor.vendorId}
                                                    className="d-flex align-items-center gap-2"
                                                >
                                                    <span className="badge bg-light text-dark">
                                                        {index + 1}
                                                    </span>
                                                    <div className="flex-fill min-w-0">
                                                        <div
                                                            className="small fw-semibold text-truncate"
                                                            title={vendor.shopName}
                                                        >
                                                            {vendor.shopName}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: "11px" }}>
                                                            {vendor.quantitySold} item(s)
                                                        </div>
                                                    </div>
                                                    <span className="small fw-semibold">
                                                        ৳ {currency.format(vendor.revenue)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card border-0 shadow-sm rounded-3">
                                <div className="card-header bg-white border-0 py-3">
                                    <h6 className="fw-bold mb-0">
                                        <i className="bi bi-pie-chart me-2 text-secondary"></i>
                                        Status breakdown
                                    </h6>
                                </div>
                                <div className="card-body">
                                    {report.statusBreakdown.length === 0 ? (
                                        <p className="text-muted small mb-0">No orders in this period.</p>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {report.statusBreakdown.map((row) => (
                                                <div
                                                    key={row.status}
                                                    className="d-flex align-items-center gap-2"
                                                >
                                                    <span
                                                        className={`badge ${
                                                            STATUS_COLORS[row.status] ?? "bg-secondary"
                                                        }`}
                                                        style={{ minWidth: "76px" }}
                                                    >
                                                        {row.status}
                                                    </span>
                                                    <span className="small text-muted flex-fill">
                                                        {row.count} order(s)
                                                    </span>
                                                    <span className="small fw-semibold">
                                                        ৳ {currency.format(row.revenue)}
                                                    </span>
                                                </div>
                                            ))}
                                            {report.cancelledOrdersCount > 0 && (
                                                <p className="text-muted mb-0 mt-2" style={{ fontSize: "11px" }}>
                                                    {report.cancelledOrdersCount} cancelled order(s) are
                                                    excluded from sales totals.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="card border-0 shadow-sm rounded-3">
                    <div className="card-body text-center py-5 text-muted">
                        <i className="bi bi-graph-up fs-2 d-block mb-2 opacity-25"></i>
                        No report data. Pick a date range and apply.
                    </div>
                </div>
            )}
        </div>
    );
}
