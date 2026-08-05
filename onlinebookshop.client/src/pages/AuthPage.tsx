// =============================================
// AuthPage.tsx
// =============================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/Loginform";
import RegisterForm from "../components/auth/Registerform";

type Tab = "login" | "register";

export default function AuthPage() {
    const [activeTab, setActiveTab] = useState<Tab>("login");
    const [successMsg, setSuccessMsg] = useState("");
    const navigate = useNavigate();

    const handleSuccess = (userName: string, role: string) => {
        setSuccessMsg(`Welcome, ${userName}!`);

        if (role === "Admin") {
            navigate("/admin/dashboard", { replace: true });
        } else if (role === "Vendor") {
            navigate("/vendor/dashboard", { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    };

    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        setSuccessMsg("");
    };

    return (
        <div
            className="min-vh-100 d-flex align-items-center justify-content-center py-4 px-3"
            style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
        >
            <div className="w-100" style={{ maxWidth: "420px" }}>
                {/* Brand Header */}
                <div className="text-center mb-3">
                    <div
                        className="mx-auto mb-2 rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "56px", height: "56px" }}
                    >
                        <span style={{ fontSize: "28px" }}>📚</span>
                    </div>
                    <h1 className="text-white fw-bold mb-0" style={{ fontSize: "1.6rem" }}>
                        Sabbir BookMall
                    </h1>
                    <p className="text-white-50 mb-0" style={{ fontSize: "0.85rem" }}>
                        Your curated literary world
                    </p>
                </div>

                {/* Main Card */}
                <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                    <div className="card-body p-4">
                        {successMsg && (
                            <div
                                className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3"
                                role="alert"
                                style={{ fontSize: "0.9rem" }}
                            >
                                <i className="bi bi-check-circle-fill"></i>
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {/* Tabs */}
                        <ul className="nav nav-pills nav-fill mb-3 bg-light rounded-3 p-1">
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-3 fw-semibold py-2 ${activeTab === "login" ? "active shadow-sm" : "text-muted"
                                        }`}
                                    style={{ fontSize: "0.9rem" }}
                                    onClick={() => switchTab("login")}
                                >
                                    <i className="bi bi-box-arrow-in-right me-2"></i>
                                    Sign In
                                </button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link rounded-3 fw-semibold py-2 ${activeTab === "register" ? "active shadow-sm" : "text-muted"
                                        }`}
                                    style={{ fontSize: "0.9rem" }}
                                    onClick={() => switchTab("register")}
                                >
                                    <i className="bi bi-person-plus me-2"></i>
                                   Register
                                </button>
                            </li>
                        </ul>

                        {/* Form Container */}
                        <div>
                            {activeTab === "login" ? (
                                <LoginForm
                                    onSuccess={handleSuccess}
                                    onSwitchToRegister={() => switchTab("register")}
                                />
                            ) : (
                                <RegisterForm
                                    onSuccess={handleSuccess}
                                    onSwitchToLogin={() => switchTab("login")}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-3">
                    <p className="text-white-50 mb-0" style={{ fontSize: "12px" }}>
                        &copy; {new Date().getFullYear()} Sabbir BookMall • All Rights Reserved
                    </p>
                </div>
            </div>
        </div>
    );
}