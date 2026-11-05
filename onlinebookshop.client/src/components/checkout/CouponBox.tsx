// =============================================
// CouponBox.tsx — Apply a promo code at checkout
// =============================================

import { useState } from "react";
import axios from "axios";
import CouponService from "../../services/coupon.service";
import type { CouponValidationDto } from "../../types/coupon.types";

interface Props {
    applied: CouponValidationDto | null;
    onApplied: (coupon: CouponValidationDto) => void;
    onRemove: () => void;
    disabled?: boolean;
}

export default function CouponBox({ applied, onApplied, onRemove, disabled = false }: Props) {
    const [code, setCode] = useState("");
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState("");

    const handleApply = async () => {
        const trimmed = code.trim();
        if (!trimmed) {
            setError("Enter a promo code.");
            return;
        }

        setChecking(true);
        setError("");
        try {
            const result = await CouponService.validate({ code: trimmed });
            onApplied(result);
            setCode("");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "This promo code can't be applied.");
            } else {
                setError("Something went wrong. Please try again.");
            }
        } finally {
            setChecking(false);
        }
    };

    if (applied) {
        return (
            <div className="alert alert-success d-flex align-items-center gap-2 flex-wrap mb-4 py-2 px-3">
                <i className="bi bi-ticket-perforated-fill fs-5"></i>
                <div className="me-auto small">
                    <strong>{applied.code}</strong> applied — you save ৳ {applied.discountAmount.toFixed(2)}
                    {applied.description && <span className="d-block text-muted">{applied.description}</span>}
                </div>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-success"
                    onClick={onRemove}
                    disabled={disabled}
                >
                    <i className="bi bi-x-lg me-1"></i>Remove
                </button>
            </div>
        );
    }

    return (
        <div className="mb-4">
            <label className="form-label small fw-semibold mb-1">
                <i className="bi bi-ticket-perforated me-1 text-success"></i>
                Promo code
            </label>
            <div className="input-group">
                <input
                    type="text"
                    className={`form-control text-uppercase ${error ? "is-invalid" : ""}`}
                    placeholder="e.g. EID25"
                    value={code}
                    maxLength={40}
                    autoComplete="off"
                    disabled={checking || disabled}
                    onChange={(e) => {
                        setCode(e.target.value);
                        setError("");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleApply();
                        }
                    }}
                />
                <button
                    type="button"
                    className="btn btn-outline-success fw-semibold"
                    onClick={handleApply}
                    disabled={checking || disabled || !code.trim()}
                >
                    {checking ? (
                        <span className="spinner-border spinner-border-sm" />
                    ) : (
                        "Apply"
                    )}
                </button>
                {error && <div className="invalid-feedback d-block">{error}</div>}
            </div>
        </div>
    );
}
