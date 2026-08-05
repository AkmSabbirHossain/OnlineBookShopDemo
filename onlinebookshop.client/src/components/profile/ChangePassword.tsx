// =============================================
// ChangePassword.tsx
// =============================================

import { useState } from "react";
import axios from "axios";
import ProfileService from "../../services/profile.service";

export default function ChangePassword() {
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState("");
    const [serverError, setServerError] = useState("");

    const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
        const missing = [];
        if (password.length < 8) missing.push(1);
        if (!/[A-Z]/.test(password)) missing.push(1);
        if (!/[a-z]/.test(password)) missing.push(1);
        if (!/\d/.test(password)) missing.push(1);
        if (!/[^\da-zA-Z]/.test(password)) missing.push(1);
        const score = 5 - missing.length;
        const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
        const colors = ["", "danger", "danger", "warning", "info", "success"];
        return { score, label: labels[score] || "", color: colors[score] || "secondary" };
    };

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
        setServerError("");
        setSuccess("");
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!form.currentPassword) errs.currentPassword = "Current password is required";
        const strength = getPasswordStrength(form.newPassword);
        if (strength.score < 5) errs.newPassword = "Password does not meet requirements";
        if (form.newPassword !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        setServerError("");
        setSuccess("");
        try {
            await ProfileService.changePassword({
                currentPassword: form.currentPassword,
                newPassword: form.newPassword,
            });
            setSuccess("Password changed successfully!");
            setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setServerError(err.response?.data?.message || "Failed to change password.");
            } else {
                setServerError("Something went wrong.");
            }
        } finally {
            setSaving(false);
        }
    };

    const strength = getPasswordStrength(form.newPassword);

    const PasswordInput = ({
        field,
        label,
        placeholder,
        showKey,
    }: {
        field: keyof typeof form;
        label: string;
        placeholder: string;
        showKey: keyof typeof showPasswords;
    }) => (
        <div className="mb-3">
            <label className="form-label fw-semibold small">{label}</label>
            <div className="input-group">
                <span className="input-group-text"><i className="bi bi-lock"></i></span>
                <input
                    type={showPasswords[showKey] ? "text" : "password"}
                    className={`form-control ${errors[field] ? "is-invalid" : ""}`}
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    disabled={saving}
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPasswords((prev) => ({ ...prev, [showKey]: !prev[showKey] }))}
                    tabIndex={-1}
                >
                    <i className={`bi ${showPasswords[showKey] ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
                {errors[field] && <div className="invalid-feedback">{errors[field]}</div>}
            </div>
        </div>
    );

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-shield-lock me-2 text-primary"></i>
                    Change Password
                </h6>
            </div>

            <div className="card-body p-4">

                {success && (
                    <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3">
                        <i className="bi bi-check-circle-fill"></i>
                        {success}
                    </div>
                )}
                {serverError && (
                    <div className="alert alert-danger py-2 mb-3 small">{serverError}</div>
                )}

                <PasswordInput
                    field="currentPassword"
                    label="Current Password"
                    placeholder="Enter current password"
                    showKey="current"
                />

                <PasswordInput
                    field="newPassword"
                    label="New Password"
                    placeholder="Enter new password"
                    showKey="new"
                />

                {/* Strength Bar */}
                {form.newPassword && (
                    <div className="mb-3 mt-n2">
                        <div className="d-flex gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className={`flex-fill rounded`}
                                    style={{
                                        height: "4px",
                                        backgroundColor: i <= strength.score
                                            ? `var(--bs-${strength.color})`
                                            : "#e9ecef",
                                        transition: "background-color 0.3s",
                                    }}
                                />
                            ))}
                        </div>
                        <small className={`text-${strength.color}`}>{strength.label}</small>
                    </div>
                )}

                <PasswordInput
                    field="confirmPassword"
                    label="Confirm New Password"
                    placeholder="Repeat new password"
                    showKey="confirm"
                />

                {/* Requirements */}
                <div className="alert alert-light border small mb-4">
                    <strong>Password requirements:</strong>
                    <ul className="mb-0 mt-1 ps-3">
                        {[
                            "At least 8 characters",
                            "One uppercase letter (A-Z)",
                            "One lowercase letter (a-z)",
                            "One number (0-9)",
                            "One special character (!@#$...)",
                        ].map((req) => (
                            <li key={req} className="text-muted">{req}</li>
                        ))}
                    </ul>
                </div>

                <button
                    className="btn btn-primary fw-semibold"
                    onClick={handleSubmit}
                    disabled={saving}
                >
                    {saving ? (
                        <><span className="spinner-border spinner-border-sm me-2" />Changing...</>
                    ) : (
                        <><i className="bi bi-shield-check me-2"></i>Change Password</>
                    )}
                </button>

            </div>
        </div>
    );
}