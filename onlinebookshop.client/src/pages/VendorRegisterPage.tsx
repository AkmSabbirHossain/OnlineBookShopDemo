// VendorRegisterPage.tsx — Professional Version
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import VendorService from "../services/vendor.service";

interface FormState {
    shopName: string;
    description: string;
    logoUrl: string;
    bannerUrl: string;
    phoneNumber: string;
    address: string;
    city: string;
    businessRegistrationNumber: string;
}

interface FormErrors {
    shopName?: string;
    phoneNumber?: string;
    logoUrl?: string;
    bannerUrl?: string;
}

const EMPTY_FORM: FormState = {
    shopName: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
    phoneNumber: "",
    address: "",
    city: "",
    businessRegistrationNumber: "",
};

// Step indicator component
const StepIndicator = ({ current }: { current: number }) => {
    const steps = ["Shop info", "Contact", "Branding", "Review"];
    return (
        <div className="d-flex align-items-center justify-content-center gap-0 mb-4">
            {steps.map((label, i) => {
                const num = i + 1;
                const isDone = num < current;
                const isActive = num === current;
                return (
                    <div key={label} className="d-flex align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <div
                                className={`d-flex align-items-center justify-content-center rounded-circle fw-semibold`}
                                style={{
                                    width: 28,
                                    height: 28,
                                    fontSize: 12,
                                    backgroundColor: isDone
                                        ? "var(--bs-success-bg-subtle)"
                                        : isActive
                                        ? "var(--bs-primary-bg-subtle)"
                                        : "var(--bs-secondary-bg)",
                                    color: isDone
                                        ? "var(--bs-success-text-emphasis)"
                                        : isActive
                                        ? "var(--bs-primary-text-emphasis)"
                                        : "var(--bs-secondary-color)",
                                    border: "1px solid",
                                    borderColor: isDone
                                        ? "var(--bs-success-border-subtle)"
                                        : isActive
                                        ? "var(--bs-primary-border-subtle)"
                                        : "var(--bs-border-color)",
                                }}
                            >
                                {isDone ? <i className="bi bi-check" style={{ fontSize: 13 }} /> : num}
                            </div>
                            <span
                                className="small d-none d-sm-inline"
                                style={{
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive
                                        ? "var(--bs-body-color)"
                                        : "var(--bs-secondary-color)",
                                }}
                            >
                                {label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div
                                className="mx-2 mx-sm-3"
                                style={{ width: 32, height: 1, backgroundColor: "var(--bs-border-color)" }}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// Section card wrapper
const Section = ({
    icon,
    title,
    children,
}: {
    icon: string;
    title: string;
    children: React.ReactNode;
}) => (
    <div className="card border rounded-3 mb-3">
        <div className="card-body p-4">
            <p className="text-uppercase text-muted fw-semibold mb-3" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
                <i className={`bi ${icon} me-2`}></i>
                {title}
            </p>
            {children}
        </div>
    </div>
);

// Field wrapper
const Field = ({
    label,
    required,
    hint,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    hint?: string;
    error?: string;
    children: React.ReactNode;
}) => (
    <div className="mb-0">
        <label className="form-label small text-secondary mb-1">
            {label}
            {required && <span className="text-danger ms-1">*</span>}
        </label>
        {children}
        {hint && !error && <div className="form-text">{hint}</div>}
        {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
);

export default function VendorRegisterPage() {
    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [errors, setErrors] = useState<FormErrors>({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [step] = useState(1); // Extend to multi-step later if needed

    const handleChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setServerError("");
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.shopName.trim()) {
            errs.shopName = "Shop name is required";
        } else if (form.shopName.trim().length < 3) {
            errs.shopName = "Must be at least 3 characters";
        }
        if (!form.phoneNumber.trim()) {
            errs.phoneNumber = "Phone number is required";
        }
        if (form.logoUrl && !/^https?:\/\/.+/.test(form.logoUrl)) {
            errs.logoUrl = "Enter a valid URL (must start with https://)";
        }
        if (form.bannerUrl && !/^https?:\/\/.+/.test(form.bannerUrl)) {
            errs.bannerUrl = "Enter a valid URL (must start with https://)";
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
            await VendorService.registerVendor({
                shopName: form.shopName.trim(),
                description: form.description.trim() || undefined,
                logoUrl: form.logoUrl.trim() || undefined,
                phoneNumber: form.phoneNumber.trim(),
                address: form.address.trim() || undefined,
                city: form.city.trim() || undefined,
                businessRegistrationNumber: form.businessRegistrationNumber.trim() || undefined,
            });
            setSuccess(true);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setServerError(
                    err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Registration failed. Please try again."
                );
            } else {
                setServerError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // ── Success Screen ──
    if (success) {
        return (
            <>
                <Navbar />
                <div className="bg-light min-vh-100 d-flex align-items-center py-5">
                    <div className="container" style={{ maxWidth: 520 }}>
                        <div className="card border rounded-4 text-center p-5">
                            <div
                                className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4"
                                style={{ width: 80, height: 80 }}
                            >
                                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: 36 }} />
                            </div>
                            <h4 className="fw-bold mb-2">Application submitted!</h4>
                            <p className="text-muted mb-1">
                                Your vendor application is under review.
                            </p>
                            <p className="text-muted small mb-4">
                                Our admin team typically responds within 1–2 business days.
                            </p>
                            <div className="d-flex justify-content-center gap-2">
                                <Link to="/" className="btn btn-primary px-4">
                                    Go to home
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ── Main Form ──
    return (
        <>
            <Navbar />
            <div className="bg-light min-vh-100 py-5">
                <div className="container" style={{ maxWidth: 680 }}>

                    {/* Page header */}
                    <div className="text-center mb-4">
                        <h3 className="fw-bold mb-1">Become a vendor</h3>
                        <p className="text-muted small">
                            Set up your shop and start selling books on our platform
                        </p>
                    </div>

                    <StepIndicator current={step} />

                    {/* Info notice */}
                    <div
                        className="d-flex gap-2 align-items-start rounded-3 p-3 mb-3"
                        style={{
                            backgroundColor: "var(--bs-warning-bg-subtle)",
                            border: "1px solid var(--bs-warning-border-subtle)",
                            color: "var(--bs-warning-text-emphasis)",
                            fontSize: 13,
                        }}
                    >
                        <i className="bi bi-info-circle-fill mt-1" style={{ fontSize: 15, flexShrink: 0 }} />
                        <span>
                            Your application will be reviewed by our admin team before your shop goes live.
                        </span>
                    </div>

                    {serverError && (
                        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3" style={{ fontSize: 14 }}>
                            <i className="bi bi-exclamation-triangle-fill" />
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>

                        {/* ── Section 1: Shop Details ── */}
                        <Section icon="bi-building-fill-check" title="Shop details">
                            <div className="d-flex flex-column gap-3">
                                <Field
                                    label="Shop name"
                                    required
                                    error={errors.shopName}
                                >
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="bi bi-shop text-muted" />
                                        </span>
                                        <input
                                            type="text"
                                            className={`form-control border-start-0 ps-0 ${errors.shopName ? "is-invalid" : ""}`}
                                            placeholder="e.g. Book Haven BD"
                                            value={form.shopName}
                                            onChange={(e) => handleChange("shopName", e.target.value)}
                                            maxLength={150}
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="text-end form-text">{form.shopName.length} / 150</div>
                                </Field>

                                <Field
                                    label="Shop description"
                                  
                                >
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        placeholder="Tell something about your shop ............"
                                        value={form.description}
                                        onChange={(e) => handleChange("description", e.target.value)}
                                        maxLength={500}
                                        disabled={loading}
                                        style={{ resize: "none" }}
                                    />
                                    <div className="text-end form-text">{form.description.length} / 500</div>
                                </Field>
                            </div>
                        </Section>

                        {/* ── Section 2: Contact & Location ── */}
                        <Section icon="bi-geo-alt-fill" title="Contact & location">
                            <div className="d-flex flex-column gap-3">
                                <Field label="Phone number" required error={errors.phoneNumber}>
                                    <div className="input-group">
                                        <span className="input-group-text bg-white border-end-0">
                                            <i className="bi bi-telephone text-muted" />
                                        </span>
                                        <input
                                            type="tel"
                                            className={`form-control border-start-0 ps-0 ${errors.phoneNumber ? "is-invalid" : ""}`}
                                            placeholder="01XXXXXXXXX"
                                            value={form.phoneNumber}
                                            onChange={(e) => handleChange("phoneNumber", e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </Field>

                                <div className="row g-3">
                                    <div className="col-md-8">
                                        <Field label="Address">
                                            <div className="input-group">
                                                <span className="input-group-text bg-white border-end-0">
                                                    <i className="bi bi-map text-muted" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0 ps-0"
                                                    placeholder="House, Road, Area"
                                                    value={form.address}
                                                    onChange={(e) => handleChange("address", e.target.value)}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                    <div className="col-md-4">
                                        <Field label="City">
                                            <div className="input-group">
                                                <span className="input-group-text bg-white border-end-0">
                                                    <i className="bi bi-building text-muted" />
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control border-start-0 ps-0"
                                                    placeholder="Dhaka"
                                                    value={form.city}
                                                    onChange={(e) => handleChange("city", e.target.value)}
                                                    disabled={loading}
                                                />
                                            </div>
                                        </Field>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* ── Section 3: Branding ── */}
                        <Section icon="bi-image-fill" title="Branding">
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <Field
                                        label="Logo URL"
                                      
                                        error={errors.logoUrl}
                                    >
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0">
                                                <i className="bi bi-link-45deg text-muted" />
                                            </span>
                                            <input
                                                type="url"
                                                className={`form-control border-start-0 ps-0 ${errors.logoUrl ? "is-invalid" : ""}`}
                                                placeholder="https://…/logo.png"
                                                value={form.logoUrl}
                                                onChange={(e) => handleChange("logoUrl", e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                    </Field>
                                </div>
                                <div className="col-md-6">
                                    <Field
                                        label="Banner URL"
                                     
                                        error={errors.bannerUrl}
                                    >
                                        <div className="input-group">
                                            <span className="input-group-text bg-white border-end-0">
                                                <i className="bi bi-link-45deg text-muted" />
                                            </span>
                                            <input
                                                type="url"
                                                className={`form-control border-start-0 ps-0 ${errors.bannerUrl ? "is-invalid" : ""}`}
                                                placeholder="https://…/banner.jpg"
                                                value={form.bannerUrl}
                                                onChange={(e) => handleChange("bannerUrl", e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                    </Field>
                                </div>
                            </div>
                        </Section>

                        {/* ── Section 4: Business Registration ── */}
                        <Section icon="bi-award-fill" title="Business registration">
                            <Field
                                label="Registration number"
                              
                            >
                                <div className="input-group">
                                    <span className="input-group-text bg-white border-end-0">
                                        <i className="bi bi-patch-check text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0 ps-0"
                                        placeholder="TRAD/XXXXXXXXX"
                                        value={form.businessRegistrationNumber}
                                        onChange={(e) => handleChange("businessRegistrationNumber", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                            </Field>
                        </Section>

                        {/* ── Submit ── */}
                        <div className="d-flex gap-2 mt-2">
                            <Link to="/" className="btn btn-outline-secondary px-4" tabIndex={-1}>
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary flex-grow-1 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-send-fill" />
                                        Submit application
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}