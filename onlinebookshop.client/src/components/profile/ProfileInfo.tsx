// =============================================
// ProfileInfo.tsx —
// =============================================

import { useState, useEffect } from "react";
import axios from "axios";
import ProfileService from "../../services/profile.service";
import type { UserProfileDto } from "../../types/profile.types";

interface Props {
    profile: UserProfileDto;
    onUpdated: (updated: UserProfileDto) => void;
}

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: "linear-gradient(145deg, #ffffff 0%, #f8faff 100%)",
        borderRadius: "20px",
        border: "1px solid rgba(99, 120, 255, 0.1)",
        boxShadow: "0 4px 24px rgba(80, 100, 220, 0.08), 0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    },
    header: {
        background: "linear-gradient(135deg, #1a1f3c 0%, #2d3561 60%, #3a4080 100%)",
        padding: "28px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative" as const,
        overflow: "hidden",
    },
    headerBg: {
        position: "absolute" as const,
        top: "-40px",
        right: "-40px",
        width: "180px",
        height: "180px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
        pointerEvents: "none" as const,
    },
    headerBg2: {
        position: "absolute" as const,
        bottom: "-60px",
        right: "60px",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.03)",
        pointerEvents: "none" as const,
    },
    headerTitle: {
        color: "#ffffff",
        fontWeight: 700,
        fontSize: "16px",
        letterSpacing: "0.02em",
        margin: 0,
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    headerSubtitle: {
        color: "rgba(255,255,255,0.5)",
        fontSize: "12px",
        marginTop: "3px",
        letterSpacing: "0.04em",
        fontWeight: 500,
    },
    editBtn: {
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
        borderRadius: "10px",
        padding: "7px 16px",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "6px",
        backdropFilter: "blur(10px)",
        transition: "all 0.2s ease",
        letterSpacing: "0.02em",
    },
    body: {
        padding: "32px",
    },
    avatarWrapper: {
        display: "flex",
        alignItems: "center",
        gap: "20px",
        marginBottom: "32px",
        paddingBottom: "28px",
        borderBottom: "1px solid rgba(99, 120, 255, 0.1)",
    },
    avatarRing: {
        width: "88px",
        height: "88px",
        borderRadius: "50%",
        padding: "3px",
        background: "linear-gradient(135deg, #4f63d2, #7c3aed)",
        boxShadow: "0 8px 28px rgba(99,60,237,0.28)",
        flexShrink: 0,
    },
    avatarInner: {
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        background: "linear-gradient(135deg, #4f63d2 0%, #7c3aed 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        fontSize: "30px",
        border: "3px solid #fff",
        letterSpacing: "-0.02em",
        fontFamily: "DM Sans, sans-serif",
    },
    profileName: {
        fontWeight: 800,
        fontSize: "20px",
        color: "#1a1f3c",
        marginBottom: "6px",
        letterSpacing: "-0.02em",
    },
    roleBadge: {
        display: "inline-block",
        padding: "3px 12px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase" as const,
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
    },
    fieldGroup: {
        background: "#f8faff",
        borderRadius: "12px",
        padding: "16px 18px",
        border: "1px solid rgba(99, 120, 255, 0.07)",
        transition: "all 0.2s ease",
    },
    fieldLabel: {
        fontSize: "10px",
        fontWeight: 700,
        color: "#94a3b8",
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    fieldValue: {
        fontWeight: 700,
        color: "#1a1f3c",
        fontSize: "14px",
        margin: 0,
        letterSpacing: "-0.01em",
    },
    input: {
        width: "100%",
        border: "2px solid #4f63d2",
        borderRadius: "8px",
        padding: "8px 12px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#1a1f3c",
        outline: "none",
        background: "#fff",
        boxSizing: "border-box" as const,
        transition: "border-color 0.2s",
        fontFamily: "inherit",
    },
    errorText: {
        fontSize: "12px",
        color: "#ef4444",
        marginTop: "4px",
        fontWeight: 600,
    },
    actions: {
        display: "flex",
        gap: "10px",
        marginTop: "28px",
        paddingTop: "24px",
        borderTop: "1px solid rgba(99, 120, 255, 0.1)",
    },
    saveBtn: {
        background: "linear-gradient(135deg, #4f63d2 0%, #7c3aed 100%)",
        color: "#fff",
        border: "none",
        borderRadius: "10px",
        padding: "10px 22px",
        fontSize: "14px",
        fontWeight: 700,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 14px rgba(99, 60, 237, 0.3)",
        letterSpacing: "0.01em",
        transition: "all 0.2s ease",
    },
    cancelBtn: {
        background: "transparent",
        color: "#64748b",
        border: "1.5px solid #e2e8f0",
        borderRadius: "10px",
        padding: "10px 20px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s ease",
        letterSpacing: "0.01em",
        fontFamily: "inherit",
    },
    successAlert: {
        background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
        border: "1px solid #6ee7b7",
        borderRadius: "10px",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#065f46",
        marginBottom: "24px",
        animation: "slideIn 0.3s ease",
    },
    errorAlert: {
        background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
        border: "1px solid #fca5a5",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#991b1b",
        marginBottom: "24px",
    },
};

const roleConfig: Record<string, { bg: string; color: string; label: string }> = {
    Admin: { bg: "rgba(239,68,68,0.12)", color: "#dc2626", label: "Admin" },
    Vendor: { bg: "rgba(245,158,11,0.12)", color: "#b45309", label: "Vendor" },
    Customer: { bg: "rgba(79,99,210,0.12)", color: "#4f63d2", label: "Customer" },
};

// SVG Icons
const PersonIcon = () => (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
);
const PencilIcon = () => (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);
const CheckIcon = () => (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const CheckCircleIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);
const MailIcon = () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round">
        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" />
    </svg>
);
const ShieldIcon = () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round">
        <path d="M12 2L3 7v6c0 5 4 9.3 9 10 5-0.7 9-5 9-10V7l-9-5z" />
    </svg>
);
const CalendarIcon = () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);
const LockIcon = () => (
    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round">
        <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
);
const NameIcon = () => (
    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={2.5} strokeLinecap="round">
        <circle cx="12" cy="7" r="4" /><path d="M4 21v-2a6 6 0 0112 0v2" />
    </svg>
);

export default function ProfileInfo({ profile, onUpdated }: Props) {
    const [editMode, setEditMode] = useState(false);
    const [name, setName] = useState(profile.name);
    const [nameError, setNameError] = useState("");
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [serverError, setServerError] = useState("");

    
    useEffect(() => {
        setName(profile.name);
    }, [profile.name]);

    const handleSave = async () => {
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length < 2) {
            setNameError("Name must be at least 2 characters.");
            return;
        }
        setSaving(true);
        setServerError("");
        setSuccessMsg("");
        try {
            const updated = await ProfileService.updateProfile({ name: trimmedName });

          
            setName(updated.name);

            onUpdated(updated);

            const stored = localStorage.getItem("user");
            if (stored) {
                const user = JSON.parse(stored);
                user.name = updated.name;
                localStorage.setItem("user", JSON.stringify(user));
                window.dispatchEvent(new Event("authChanged"));
            }
            setSuccessMsg("Profile updated successfully!");
            setEditMode(false);
            setTimeout(() => setSuccessMsg(""), 3500);
        } catch (err: unknown) {
            setServerError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message || "Failed to update profile."
                    : "Something went wrong."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setName(profile.name); 
        setNameError("");
        setServerError("");
        setEditMode(false);
    };

    const role = roleConfig[profile.role] ?? {
        bg: "rgba(100,116,139,0.1)",
        color: "#64748b",
        label: profile.role,
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
                @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                .profile-edit-btn:hover   { background: rgba(255,255,255,0.18) !important; transform: translateY(-1px); }
                .profile-field-group:hover { background: #f0f4ff !important; border-color: rgba(99,120,255,0.15) !important; }
                .profile-save-btn:hover:not(:disabled)   { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,60,237,0.4) !important; }
                .profile-cancel-btn:hover:not(:disabled) { background: #f1f5f9 !important; border-color: #cbd5e1 !important; color: #475569 !important; }
                .profile-save-btn:disabled, .profile-cancel-btn:disabled { opacity: 0.7; cursor: not-allowed; }
                .profile-input:focus      { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.12) !important; }
                .profile-input.error-input { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }
                .spinner-ring {
                    width: 15px; height: 15px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: #fff;
                    border-radius: 50%;
                    animation: spin 0.7s linear infinite;
                    display: inline-block;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>

            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.headerBg} />
                    <div style={styles.headerBg2} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                        <h6 style={styles.headerTitle}>
                            <PersonIcon />
                            Profile Information
                        </h6>
                        <p style={styles.headerSubtitle}>Manage your personal account details</p>
                    </div>
                    {!editMode && (
                        <button
                            className="profile-edit-btn"
                            style={styles.editBtn}
                            onClick={() => setEditMode(true)}
                        >
                            <PencilIcon />
                            Edit Profile
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {successMsg && (
                        <div style={styles.successAlert}>
                            <CheckCircleIcon />
                            {successMsg}
                        </div>
                    )}
                    {serverError && (
                        <div style={styles.errorAlert}>{serverError}</div>
                    )}

                    {/* Avatar Row */}
                    <div style={styles.avatarWrapper}>
                        <div style={styles.avatarRing}>
                            <div style={styles.avatarInner}>
                                {profile.name ? profile.name.charAt(0).toUpperCase() : "?"}
                            </div>
                        </div>
                        <div>
                            <h5 style={styles.profileName}>{profile.name}</h5>
                            <span style={{ ...styles.roleBadge, background: role.bg, color: role.color }}>
                                {role.label}
                            </span>
                            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
                                {profile.email}
                            </p>
                        </div>
                    </div>

                    {/* Fields Grid */}
                    <div style={styles.grid}>
                        {/* Full Name */}
                        <div className="profile-field-group" style={styles.fieldGroup}>
                            <div style={styles.fieldLabel}>
                                <NameIcon />
                                Full Name
                            </div>
                            {editMode ? (
                                <>
                                    <input
                                        type="text"
                                        className={`profile-input${nameError ? " error-input" : ""}`}
                                        style={styles.input}
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setNameError(""); }}
                                        maxLength={100}
                                        disabled={saving}
                                        autoFocus
                                    />
                                    {nameError && <p style={styles.errorText}>{nameError}</p>}
                                </>
                            ) : (
                                <p style={styles.fieldValue}>{profile.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="profile-field-group" style={styles.fieldGroup}>
                            <div style={styles.fieldLabel}>
                                <MailIcon />
                                Email Address
                            </div>
                            <p style={{ ...styles.fieldValue, display: "flex", alignItems: "center", gap: "6px" }}>
                                <span>{profile.email}</span>
                                <span title="Cannot be changed" style={{ display: "flex", alignItems: "center" }}>
                                    <LockIcon />
                                </span>
                            </p>
                        </div>

                        {/* Role */}
                        <div className="profile-field-group" style={styles.fieldGroup}>
                            <div style={styles.fieldLabel}>
                                <ShieldIcon />
                                Account Role
                            </div>
                            <span style={{ ...styles.roleBadge, background: role.bg, color: role.color }}>
                                {role.label}
                            </span>
                        </div>

                        {/* Member Since */}
                        <div className="profile-field-group" style={styles.fieldGroup}>
                            <div style={styles.fieldLabel}>
                                <CalendarIcon />
                                Member Since
                            </div>
                            <p style={styles.fieldValue}>
                                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                }) : "N/A"}
                            </p>
                        </div>
                    </div>

                    {/* Edit Actions */}
                    {editMode && (
                        <div style={styles.actions}>
                            <button
                                className="profile-save-btn"
                                style={styles.saveBtn}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? <><span className="spinner-ring" />Saving...</> : <><CheckIcon />Save Changes</>}
                            </button>
                            <button
                                className="profile-cancel-btn"
                                style={styles.cancelBtn}
                                onClick={handleCancel}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}