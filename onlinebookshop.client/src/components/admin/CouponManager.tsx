// =============================================
// CouponManager.tsx — Create / edit / toggle coupons
// =============================================

import { useState } from "react";
import type {
    CouponDiscountType,
    CouponResponseDto,
    CouponUpsertDto,
} from "../../types/coupon.types";

interface Props {
    coupons: CouponResponseDto[];
    onSave: (dto: CouponUpsertDto, couponId?: number) => Promise<void>;
    onToggleStatus: (coupon: CouponResponseDto) => Promise<void>;
    saving: boolean;
    processingId: number | null;
}

const STATUS_BADGE: Record<CouponResponseDto["status"], string> = {
    Active: "bg-success",
    Scheduled: "bg-info text-dark",
    Expired: "bg-secondary",
    Exhausted: "bg-warning text-dark",
    Inactive: "bg-danger",
};

const formatDate = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "—";

const toLocalInput = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const emptyForm = {
    code: "",
    description: "",
    discountType: "Percentage" as CouponDiscountType,
    discountValue: "",
    minimumOrderAmount: "",
    maximumDiscountAmount: "",
    usageLimit: "",
    perUserLimit: "1",
    startsAt: "",
    expiresAt: "",
    isActive: true,
};

type FormState = typeof emptyForm;

export default function CouponManager({
    coupons,
    onSave,
    onToggleStatus,
    saving,
    processingId,
}: Props) {
    const [form, setForm] = useState<FormState>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [error, setError] = useState("");

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError("");
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
        setError("");
    };

    const startEdit = (coupon: CouponResponseDto) => {
        setEditingId(coupon.couponId);
        setForm({
            code: coupon.code,
            description: coupon.description ?? "",
            discountType: coupon.discountType,
            discountValue: String(coupon.discountValue),
            minimumOrderAmount: String(coupon.minimumOrderAmount),
            maximumDiscountAmount:
                coupon.maximumDiscountAmount != null ? String(coupon.maximumDiscountAmount) : "",
            usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
            perUserLimit: String(coupon.perUserLimit),
            startsAt: toLocalInput(coupon.startsAt),
            expiresAt: toLocalInput(coupon.expiresAt),
            isActive: coupon.isActive,
        });
        setError("");
    };

    const handleSubmit = async () => {
        const code = form.code.trim();
        if (!code) {
            setError("Coupon code is required.");
            return;
        }
        const discountValue = Number(form.discountValue);
        if (!Number.isFinite(discountValue) || discountValue <= 0) {
            setError("Discount value must be greater than 0.");
            return;
        }
        if (form.discountType === "Percentage" && discountValue > 100) {
            setError("Percentage discount can't be more than 100.");
            return;
        }
        if (form.startsAt && form.expiresAt && form.startsAt >= form.expiresAt) {
            setError("Expiry must be after the start date.");
            return;
        }
        const perUserLimit = Number(form.perUserLimit || "1");
        if (!Number.isInteger(perUserLimit) || perUserLimit < 1) {
            setError("Per-user limit must be at least 1.");
            return;
        }
        const usageLimit = form.usageLimit.trim() ? Number(form.usageLimit) : undefined;
        if (usageLimit !== undefined && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
            setError("Usage limit must be at least 1.");
            return;
        }

        const maxDiscount =
            form.discountType === "Percentage" && form.maximumDiscountAmount.trim()
                ? Number(form.maximumDiscountAmount)
                : undefined;
        if (maxDiscount !== undefined && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) {
            setError("Maximum discount must be greater than 0.");
            return;
        }

        try {
            await onSave(
                {
                    code,
                    description: form.description.trim() || undefined,
                    discountType: form.discountType,
                    discountValue,
                    minimumOrderAmount: Number(form.minimumOrderAmount || "0"),
                    maximumDiscountAmount: maxDiscount,
                    usageLimit,
                    perUserLimit,
                    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
                    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
                    isActive: form.isActive,
                },
                editingId ?? undefined
            );
            resetForm();
        } catch {
            // The parent reports the API error through its toast.
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-ticket-perforated me-2 text-success"></i>
                    Coupon Management
                    <span className="badge bg-success ms-2 rounded-pill">{coupons.length}</span>
                </h6>
            </div>

            <div className="card-body">
                {/* Form */}
                <div className="bg-light rounded-3 p-3 mb-4">
                    <label className="form-label fw-semibold small">
                        {editingId ? `Edit coupon #${editingId}` : "New coupon"}
                    </label>
                    <div className="row g-2">
                        <div className="col-12 col-md-6 col-lg-3">
                            <input
                                type="text"
                                className="form-control text-uppercase"
                                placeholder="Code (e.g. EID25)"
                                value={form.code}
                                maxLength={40}
                                disabled={saving}
                                onChange={(e) => set("code", e.target.value.toUpperCase())}
                            />
                        </div>
                        <div className="col-12 col-md-6 col-lg-3">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Description (optional)"
                                value={form.description}
                                maxLength={200}
                                disabled={saving}
                                onChange={(e) => set("description", e.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-3">
                            <select
                                className="form-select"
                                value={form.discountType}
                                disabled={saving}
                                onChange={(e) =>
                                    set("discountType", e.target.value as CouponDiscountType)
                                }
                            >
                                <option value="Percentage">Percentage (%)</option>
                                <option value="FixedAmount">Fixed amount (৳)</option>
                            </select>
                        </div>
                        <div className="col-6 col-lg-3">
                            <input
                                type="number"
                                className="form-control"
                                placeholder={
                                    form.discountType === "Percentage" ? "Discount %" : "Discount ৳"
                                }
                                min="0.01"
                                step="0.01"
                                value={form.discountValue}
                                disabled={saving}
                                onChange={(e) => set("discountValue", e.target.value)}
                            />
                        </div>

                        <div className="col-6 col-lg-3">
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Min order ৳"
                                min="0"
                                step="0.01"
                                value={form.minimumOrderAmount}
                                disabled={saving}
                                onChange={(e) => set("minimumOrderAmount", e.target.value)}
                            />
                        </div>
                        {form.discountType === "Percentage" && (
                            <div className="col-6 col-lg-3">
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="Max discount ৳ (optional)"
                                    min="0.01"
                                    step="0.01"
                                    value={form.maximumDiscountAmount}
                                    disabled={saving}
                                    onChange={(e) => set("maximumDiscountAmount", e.target.value)}
                                />
                            </div>
                        )}
                        <div className="col-6 col-lg-2">
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Total uses (∞)"
                                min="1"
                                step="1"
                                value={form.usageLimit}
                                disabled={saving}
                                onChange={(e) => set("usageLimit", e.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Per user"
                                min="1"
                                step="1"
                                value={form.perUserLimit}
                                disabled={saving}
                                onChange={(e) => set("perUserLimit", e.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <input
                                type="datetime-local"
                                className="form-control"
                                title="Starts at (optional)"
                                value={form.startsAt}
                                disabled={saving}
                                onChange={(e) => set("startsAt", e.target.value)}
                            />
                        </div>
                        <div className="col-6 col-lg-2">
                            <input
                                type="datetime-local"
                                className="form-control"
                                title="Expires at (optional)"
                                value={form.expiresAt}
                                disabled={saving}
                                onChange={(e) => set("expiresAt", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                        <div className="form-check form-switch mb-0 me-auto">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="coupon-active"
                                checked={form.isActive}
                                disabled={saving}
                                onChange={(e) => set("isActive", e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="coupon-active">
                                Active
                            </label>
                        </div>
                        {editingId && (
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary btn-sm fw-semibold px-3"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : (
                                <>
                                    <i className={`bi ${editingId ? "bi-check-lg" : "bi-plus-lg"} me-1`}></i>
                                    {editingId ? "Save changes" : "Create coupon"}
                                </>
                            )}
                        </button>
                    </div>
                    {error && <div className="text-danger small mt-2">{error}</div>}
                </div>

                {/* List */}
                {coupons.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-ticket-perforated fs-2 d-block mb-2 opacity-25"></i>
                        No coupons yet. Create your first promo code.
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                                <tr className="small text-muted">
                                    <th>Code</th>
                                    <th>Discount</th>
                                    <th className="d-none d-md-table-cell">Min order</th>
                                    <th>Used</th>
                                    <th className="d-none d-lg-table-cell">Validity</th>
                                    <th>Status</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon.couponId}>
                                        <td>
                                            <span className="fw-bold small">{coupon.code}</span>
                                            {coupon.description && (
                                                <div
                                                    className="text-muted text-truncate"
                                                    style={{ maxWidth: "190px", fontSize: "11px" }}
                                                    title={coupon.description}
                                                >
                                                    {coupon.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="small">
                                            {coupon.discountType === "Percentage"
                                                ? `${coupon.discountValue}%`
                                                : `৳ ${coupon.discountValue.toFixed(2)}`}
                                            {coupon.maximumDiscountAmount != null && (
                                                <span className="text-muted d-block" style={{ fontSize: "11px" }}>
                                                    max ৳ {coupon.maximumDiscountAmount.toFixed(2)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="small d-none d-md-table-cell">
                                            ৳ {coupon.minimumOrderAmount.toFixed(2)}
                                        </td>
                                        <td className="small">
                                            {coupon.redeemedCount}
                                            {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}
                                            <span className="text-muted d-block" style={{ fontSize: "11px" }}>
                                                {coupon.perUserLimit}/user
                                            </span>
                                        </td>
                                        <td className="small d-none d-lg-table-cell">
                                            {formatDate(coupon.startsAt)} – {formatDate(coupon.expiresAt)}
                                        </td>
                                        <td>
                                            <span className={`badge ${STATUS_BADGE[coupon.status]}`}>
                                                {coupon.status}
                                            </span>
                                        </td>
                                        <td className="text-end text-nowrap">
                                            <button
                                                type="button"
                                                className="btn btn-outline-primary btn-sm py-0 px-2 me-1"
                                                title="Edit"
                                                onClick={() => startEdit(coupon)}
                                                disabled={saving}
                                            >
                                                <i className="bi bi-pencil" style={{ fontSize: "12px" }}></i>
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn btn-sm py-0 px-2 ${
                                                    coupon.isActive ? "btn-outline-danger" : "btn-outline-success"
                                                }`}
                                                title={coupon.isActive ? "Deactivate" : "Activate"}
                                                onClick={() => onToggleStatus(coupon)}
                                                disabled={processingId === coupon.couponId}
                                            >
                                                {processingId === coupon.couponId ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : (
                                                    <i
                                                        className={`bi ${coupon.isActive ? "bi-pause" : "bi-play"}`}
                                                        style={{ fontSize: "12px" }}
                                                    ></i>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
