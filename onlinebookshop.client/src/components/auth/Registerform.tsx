// =============================================
// RegisterForm.tsx 
// =============================================
import { useState, useMemo } from "react";
import axios from "axios";
import AuthService from "../../services/auth.service";
import type { UserRegisterDto } from "../../types/auth.types";

interface Props {
    onSuccess: (userName: string, role: string) => void;
    onSwitchToLogin: () => void;
}

interface FormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}

function getPasswordStrength(password: string): {
    score: number;
    label: string;
    colorClass: string;
    missing: string[];
} {
    const missing: string[] = [];
    if (password.length < 8) missing.push("8+ chars");
    if (!/[A-Z]/.test(password)) missing.push("Uppercase");
    if (!/[a-z]/.test(password)) missing.push("Lowercase");
    if (!/\d/.test(password)) missing.push("Number");
    if (!/[^\da-zA-Z]/.test(password)) missing.push("Special char");

    const score = 5 - missing.length;

    const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
    const colors = ["", "danger", "danger", "warning", "info", "success"];

    return {
        score,
        label: score > 0 ? labels[score] : "",
        colorClass: score > 0 ? colors[score] : "secondary",
        missing,
    };
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: Props) {
    const [form, setForm] = useState<UserRegisterDto & { confirmPassword: string }>({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

    const handleChange = (field: keyof typeof form, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError("");
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};

        if (!form.name || form.name.trim().length < 2) {
            errs.name = "Name must be at least 2 characters";
        } else if (form.name.length > 100) {
            errs.name = "Name must be under 100 characters";
        }

        if (!form.email) {
            errs.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            errs.email = "Please enter a valid email";
        }

        if (strength.score < 5) {
            errs.password = "Password does not meet requirements";
        }

        if (!form.confirmPassword) {
            errs.confirmPassword = "Please confirm your password";
        } else if (form.password !== form.confirmPassword) {
            errs.confirmPassword = "Passwords do not match";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        setServerError("");

        try {
            const dto: UserRegisterDto = {
                name: form.name.trim(),
                email: form.email,
                password: form.password,
            };
            const data = await AuthService.register(dto);
            AuthService.saveSession(data);
            onSuccess(data.user.name, data.user.role);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const msg = err.response?.data?.message;
                const fieldErrors = err.response?.data?.errors;
                if (fieldErrors) {
                    const mapped: FormErrors = {};
                    if (fieldErrors["Name"]) mapped.name = fieldErrors["Name"][0];
                    if (fieldErrors["Email"]) mapped.email = fieldErrors["Email"][0];
                    if (fieldErrors["Password"]) mapped.password = fieldErrors["Password"][0];
                    setErrors(mapped);
                } else {
                    setServerError(msg || "Registration failed. Try again.");
                }
            } else {
                setServerError("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            {/* Server Error */}
            {serverError && (
                <div
                    className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-2"
                    role="alert"
                    style={{ fontSize: "0.85rem" }}
                >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{serverError}</span>
                </div>
            )}

            {/* Name */}
            <div className="mb-2">
                <label htmlFor="reg-name" className="form-label fw-semibold mb-1" style={{ fontSize: "0.8rem" }}>
                    Full Name
                </label>
                <div className="input-group input-group-sm">
                    <span className="input-group-text">
                        <i className="bi bi-person"></i>
                    </span>
                    <input
                        id="reg-name"
                        type="text"
                        className={`form-control ${errors.name ? "is-invalid" : form.name ? "is-valid" : ""}`}
                        placeholder="Your full name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        autoComplete="name"
                        maxLength={100}
                    />
                </div>
                {errors.name && (
                    <div className="invalid-feedback d-block" style={{ fontSize: "0.75rem" }}>
                        {errors.name}
                    </div>
                )}
            </div>

            {/* Email */}
            <div className="mb-2">
                <label htmlFor="reg-email" className="form-label fw-semibold mb-1" style={{ fontSize: "0.8rem" }}>
                    Email Address
                </label>
                <div className="input-group input-group-sm">
                    <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                    </span>
                    <input
                        id="reg-email"
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : form.email ? "is-valid" : ""}`}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        autoComplete="email"
                    />
                </div>
                {errors.email && (
                    <div className="invalid-feedback d-block" style={{ fontSize: "0.75rem" }}>
                        {errors.email}
                    </div>
                )}
            </div>

            {/* Password */}
            <div className="mb-1">
                <label htmlFor="reg-password" className="form-label fw-semibold mb-1" style={{ fontSize: "0.8rem" }}>
                    Password
                </label>
                <div className="input-group input-group-sm">
                    <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                    </span>
                    <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        className={`form-control ${errors.password
                                ? "is-invalid"
                                : form.password && strength.score === 5
                                    ? "is-valid"
                                    : ""
                            }`}
                        placeholder="Create a strong password"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                    >
                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                </div>
                {errors.password && (
                    <div className="invalid-feedback d-block" style={{ fontSize: "0.75rem" }}>
                        {errors.password}
                    </div>
                )}
            </div>

            {/* Password Strength - Compact */}
            {form.password.length > 0 && (
                <div className="mb-2 mt-1">
                    <div className="d-flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="flex-fill rounded"
                                style={{
                                    height: "3px",
                                    backgroundColor:
                                        i <= strength.score ? `var(--bs-${strength.colorClass})` : "#e9ecef",
                                    transition: "background-color 0.3s",
                                }}
                            />
                        ))}
                    </div>
                    {strength.score < 5 ? (
                        <div className="d-flex flex-wrap gap-1">
                            {strength.missing.map((m) => (
                                <span
                                    key={m}
                                    className="badge bg-danger-subtle text-danger-emphasis"
                                    style={{ fontSize: "9px", fontWeight: 500 }}
                                >
                                    {m}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <span
                            className="badge bg-success-subtle text-success-emphasis"
                            style={{ fontSize: "9px" }}
                        >
                            ✓ Strong password
                        </span>
                    )}
                </div>
            )}

            {/* Confirm Password */}
            <div className="mb-2">
                <label htmlFor="reg-confirm" className="form-label fw-semibold mb-1" style={{ fontSize: "0.8rem" }}>
                    Confirm Password
                </label>
                <div className="input-group input-group-sm">
                    <span className="input-group-text">
                        <i className="bi bi-shield-lock"></i>
                    </span>
                    <input
                        id="reg-confirm"
                        type={showConfirm ? "text" : "password"}
                        className={`form-control ${errors.confirmPassword
                                ? "is-invalid"
                                : form.confirmPassword && form.password === form.confirmPassword
                                    ? "is-valid"
                                    : ""
                            }`}
                        placeholder="Repeat your password"
                        value={form.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        autoComplete="new-password"
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirm((p) => !p)}
                        tabIndex={-1}
                    >
                        <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                </div>
                {errors.confirmPassword && (
                    <div className="invalid-feedback d-block" style={{ fontSize: "0.75rem" }}>
                        {errors.confirmPassword}
                    </div>
                )}
            </div>

            {/* Submit */}
            <button
                type="submit"
                className="btn btn-success w-100 fw-bold mb-2"
                disabled={loading}
                style={{ height: "40px", fontSize: "0.9rem" }}
            >
                {loading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Creating account...
                    </>
                ) : (
                    <>
                        <i className="bi bi-person-plus me-2"></i>
                        Create Account
                    </>
                )}
            </button>

            {/* Switch to Login */}
            <p className="text-center text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                Already have an account?{" "}
                <button type="button" className="btn btn-link p-0 fw-semibold" onClick={onSwitchToLogin}>
                    Sign in
                </button>
            </p>
        </form>
    );
}