// =============================================
// ResetPasswordPage.tsx
// =============================================

import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../services/axiosInstance";

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^\da-zA-Z]/.test(password)) score++;
  const labels = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "danger", "danger", "warning", "info", "success"];
  return { score, label: labels[score] || "", color: colors[score] || "secondary" };
};

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
 

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  // Invalid link check
  const isValidLink = !!(email && token);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const strength = getPasswordStrength(newPassword);
    if (strength.score < 5) {
      errs.newPassword = "Password does not meet all requirements";
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await axiosInstance.post("/Auth/reset-password", {
        email,
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(
          err.response?.data?.message || "Password reset failed. The link may have expired."
        );
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(newPassword);

  // ?? Invalid link ??
  if (!isValidLink) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{ maxWidth: "440px", width: "100%" }}>
          <i className="bi bi-exclamation-triangle-fill text-warning display-4 mb-3"></i>
          <h4 className="fw-bold mb-2">Invalid Reset Link</h4>
          <p className="text-muted mb-4">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password" className="btn btn-primary px-4">
            <i className="bi bi-arrow-repeat me-2"></i>Request New Link
          </Link>
        </div>
      </div>
    );
  }

  // ?? Success ??
  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{ maxWidth: "440px", width: "100%" }}>
          <div
            className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{ width: "80px", height: "80px" }}
          >
            <i className="bi bi-shield-check-fill text-success" style={{ fontSize: "36px" }}></i>
          </div>
          <h4 className="fw-bold mb-2">Password Reset Successful!</h4>
          <p className="text-muted mb-4">
            Your password has been updated. You can now sign in with your new password.
          </p>
          <Link to="/auth" className="btn btn-primary px-5 fw-bold">
            <i className="bi bi-box-arrow-in-right me-2"></i>Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  // ?? Form ??
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5" style={{ maxWidth: "440px", width: "100%" }}>

        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-lock text-success" style={{ fontSize: "28px" }}></i>
          </div>
          <h4 className="fw-bold mb-1">Create New Password</h4>
          <p className="text-muted small">
            Resetting password for <strong>{email}</strong>
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="alert alert-danger d-flex align-items-start gap-2 py-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill mt-1 flex-shrink-0"></i>
            <small>{serverError}</small>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* New Password */}
          <div className="mb-2">
            <label className="form-label fw-semibold">New Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock"></i></span>
              <input
                type={showNew ? "text" : "password"}
                className={`form-control ${errors.newPassword ? "is-invalid" : newPassword && strength.score === 5 ? "is-valid" : ""}`}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setErrors((p) => ({ ...p, newPassword: "" })); }}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowNew((p) => !p)}
                tabIndex={-1}
              >
                <i className={`bi ${showNew ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
              {errors.newPassword && <div className="invalid-feedback">{errors.newPassword}</div>}
            </div>
          </div>

          {/* Strength Bar */}
          {newPassword && (
            <div className="mb-3">
              <div className="d-flex gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex-fill rounded"
                    style={{
                      height: "4px",
                      backgroundColor: i <= strength.score ? `var(--bs-${strength.color})` : "#e9ecef",
                      transition: "background-color 0.3s",
                    }}
                  />
                ))}
              </div>
              <small className={`text-${strength.color}`}>{strength.label}</small>
            </div>
          )}

          {/* Confirm Password */}
          <div className="mb-3">
            <label className="form-label fw-semibold">Confirm Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
              <input
                type={showConfirm ? "text" : "password"}
                className={`form-control ${errors.confirmPassword ? "is-invalid" : confirmPassword && confirmPassword === newPassword ? "is-valid" : ""}`}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: "" })); }}
                disabled={loading}
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowConfirm((p) => !p)}
                tabIndex={-1}
              >
                <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`}></i>
              </button>
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          {/* Requirements */}
          <div className="alert alert-light border small mb-4 p-3">
            <p className="fw-semibold mb-2">Password must have:</p>
            {[
              { check: newPassword.length >= 8, text: "At least 8 characters" },
              { check: /[A-Z]/.test(newPassword), text: "One uppercase letter (A-Z)" },
              { check: /[a-z]/.test(newPassword), text: "One lowercase letter (a-z)" },
              { check: /\d/.test(newPassword), text: "One number (0-9)" },
              { check: /[^\da-zA-Z]/.test(newPassword), text: "One special character (!@#$...)" },
            ].map((req) => (
              <div key={req.text} className="d-flex align-items-center gap-2">
                <i className={`bi ${req.check ? "bi-check-circle-fill text-success" : "bi-circle text-muted"}`} style={{ fontSize: "12px" }}></i>
                <span className={req.check ? "text-success" : "text-muted"}>{req.text}</span>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-success w-100 fw-bold py-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Resetting Password...</>
            ) : (
              <><i className="bi bi-shield-check me-2"></i>Reset Password</>
            )}
          </button>

          <div className="text-center">
            <Link to="/auth" className="text-decoration-none text-muted small">
              <i className="bi bi-arrow-left me-1"></i>Back to Sign In
            </Link>
          </div>

        </form>
      </div>
    </div>
  );
}