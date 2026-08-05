// =============================================
// LoginForm.tsx 
// =============================================
import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import AuthService from "../../services/auth.service";
import type { UserLoginDto } from "../../types/auth.types";

interface Props {
    onSuccess: (userName: string, role: string) => void;
    onSwitchToRegister: () => void;
}

interface FormErrors {
    email?: string;
    password?: string;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: Props) {
    const [form, setForm] = useState<UserLoginDto>({ email: "", password: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (field: keyof UserLoginDto, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError("");
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.email) {
            errs.email = "Email address is required";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            errs.email = "Please enter a valid email";
        }
        if (!form.password) {
            errs.password = "Password is required";
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
            const data = await AuthService.login(form);
            AuthService.saveSession(data);
            onSuccess(data.user.name, data.user.role);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setServerError(err.response?.data?.message || "Invalid email or password");
            } else {
                setServerError("Something went wrong. Please try again.");
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
                    className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3"
                    role="alert"
                    style={{ fontSize: "0.9rem" }}
                >
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <span>{serverError}</span>
                </div>
            )}

            {/* Email */}
            <div className="mb-3">
                <label htmlFor="login-email" className="form-label fw-semibold mb-1" style={{ fontSize: "0.875rem" }}>
                    Email Address
                </label>
                <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                        id="login-email"
                        type="email"
                        className={`form-control border-start-0 ps-0 ${errors.email ? "is-invalid" : form.email ? "is-valid" : ""
                            }`}
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        autoComplete="email"
                    />
                </div>
                {errors.email && <div className="invalid-feedback d-block mt-1">{errors.email}</div>}
            </div>

            {/* Password */}
            <div className="mb-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <label htmlFor="login-password" className="form-label fw-semibold mb-0" style={{ fontSize: "0.875rem" }}>
                        Password
                    </label>
                    <Link to="/forgot-password" className="text-decoration-none small fw-medium text-primary">
                        Forgot password?
                    </Link>
                </div>
                <div className="input-group">
                    <span className="input-group-text bg-light border-end-0">
                        <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        className={`form-control border-start-0 ps-0 ${errors.password ? "is-invalid" : ""}`}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        autoComplete="current-password"
                    />
                    <button
                        type="button"
                        className="btn btn-light border"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                    >
                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                </div>
                {errors.password && <div className="invalid-feedback d-block mt-1">{errors.password}</div>}
            </div>

            {/* Remember Me */}
            <div className="mb-3 form-check">
                <input type="checkbox" className="form-check-input" id="rememberMe" />
                <label className="form-check-label text-muted" htmlFor="rememberMe" style={{ fontSize: "0.875rem" }}>
                    Keep me signed in
                </label>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="btn btn-primary w-100 fw-bold shadow-sm mb-3"
                disabled={loading}
                style={{ height: "44px" }}
            >
                {loading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Signing in...
                    </>
                ) : (
                    "Sign In"
                )}
            </button>

            {/* Divider */}
            <div className="d-flex align-items-center gap-3 my-3">
                <hr className="flex-grow-1 m-0" />
                <span className="text-muted small">OR</span>
                <hr className="flex-grow-1 m-0" />
            </div>

            {/* Switch to Register */}
            <p className="text-center text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                Don't have an account?{" "}
                <button
                    type="button"
                    className="btn btn-link p-0 fw-semibold text-primary"
                    onClick={onSwitchToRegister}
                >
                    Create account
                </button>
            </p>
        </form>
    );
}
