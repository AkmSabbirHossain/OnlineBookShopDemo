// =============================================
// ForgotPasswordPage.tsx
// =============================================

import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import axiosInstance from "../services/axiosInstance";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = (): boolean => {
    if (!email.trim()) {
      setEmailError("Email address is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await axiosInstance.post("/Auth/forgot-password", { email: email.trim() });
      setSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ?? Success State ??
  if (success) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center" style={{ maxWidth: "440px", width: "100%" }}>
          <div
            className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4"
            style={{ width: "80px", height: "80px" }}
          >
            <i className="bi bi-envelope-check-fill text-success" style={{ fontSize: "36px" }}></i>
          </div>
          <h4 className="fw-bold mb-2">Check Your Email</h4>
          <p className="text-muted mb-4">
                    If <strong>{email}</strong> is registered, a password reset link has been sent to this address.
                    Please check your inbox and spam folder.
          </p>
          <div className="alert alert-light border d-flex align-items-start gap-2 text-start mb-4">
            <i className="bi bi-info-circle text-primary mt-1 flex-shrink-0"></i>
            <small className="text-muted">
              The link will expire in <strong>1 hour</strong>. If you don't receive the email,
              you can request a new one.
            </small>
          </div>
          <div className="d-flex gap-3 justify-content-center">
            <button
              className="btn btn-outline-primary"
              onClick={() => { setSuccess(false); setEmail(""); }}
            >
              <i className="bi bi-arrow-repeat me-2"></i>Resend Email
            </button>
            <Link to="/auth" className="btn btn-primary">
              <i className="bi bi-box-arrow-in-right me-2"></i>Back to Login
            </Link>
          </div>
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
            className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: "64px", height: "64px" }}
          >
            <i className="bi bi-key text-primary" style={{ fontSize: "28px" }}></i>
          </div>
          <h4 className="fw-bold mb-1">Forgot Password?</h4>
          <p className="text-muted small">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <small>{serverError}</small>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Email */}
          <div className="mb-4">
            <label className="form-label fw-semibold">Email Address</label>
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                className={`form-control ${emailError ? "is-invalid" : email ? "is-valid" : ""}`}
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); setServerError(""); }}
                disabled={loading}
                autoFocus
              />
              {emailError && <div className="invalid-feedback">{emailError}</div>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary w-100 fw-bold py-2 mb-3"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-2" />Sending Reset Link...</>
            ) : (
              <><i className="bi bi-send me-2"></i>Send Reset Link</>
            )}
          </button>

          {/* Back to login */}
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