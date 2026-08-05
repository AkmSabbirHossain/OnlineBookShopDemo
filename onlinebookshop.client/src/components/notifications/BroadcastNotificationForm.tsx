import { useState } from "react";
import { notificationService } from "../../services/notification.service";
import type { BroadcastNotificationDto } from "../../types/notification.types";

export default function BroadcastNotificationForm() {
    const [form, setForm] = useState<BroadcastNotificationDto>({
        title: "",
        message: "",
        target: "All",
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.message.trim()) return;

        try {
            setLoading(true);
            setSuccess(false);
            await notificationService.broadcast(form);
            setSuccess(true);
            setForm({ title: "", message: "", target: "All" });
        } catch {
            alert("Failed to send notification");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="card border-0 shadow-sm p-4"
            style={{ borderRadius: 16, maxWidth: 580 }}
        >
            {/* Header */}
            <div
                className="d-flex align-items-center gap-2 mb-4 p-3"
                style={{
                    background: "linear-gradient(135deg, #534AB7, #1D9E75)",
                    borderRadius: 12,
                }}
            >
                <i className="bi bi-megaphone-fill text-white fs-5" />
                <h5 className="mb-0 text-white fw-bold">Broadcast Notification</h5>
            </div>

            {/* Success Alert */}
            {success && (
                <div
                    className="d-flex align-items-center gap-2 mb-3 p-3"
                    style={{ background: "#E1F5EE", borderRadius: 10, color: "#0F6E56" }}
                >
                    <i className="bi bi-check-circle-fill" />
                    <span className="fw-semibold">Notification সফলভাবে পাঠানো হয়েছে!</span>
                </div>
            )}

            {/* Target */}
            <div className="mb-3">
                <label className="fw-semibold mb-2 d-block" style={{ fontSize: 13 }}>
                    পাঠাবে কাকে?
                </label>
                <div className="d-flex gap-2">
                    {(["All", "Customer", "Vendor"] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setForm(prev => ({ ...prev, target: t }))}
                            className="btn btn-sm fw-semibold"
                            style={{
                                borderRadius: 8,
                                padding: "6px 16px",
                                background: form.target === t ? "#534AB7" : "#f0f0f0",
                                color: form.target === t ? "#fff" : "#555",
                                border: "none",
                                fontSize: 13,
                            }}
                        >
                            {t === "All" ? "সবাই" : t === "Customer" ? "Customer" : "Vendor"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div className="mb-3">
                <label className="fw-semibold mb-1 d-block" style={{ fontSize: 13 }}>
                    Title
                </label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="যেমন: ঈদ স্পেশাল অফার 🎉"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    style={{ borderRadius: 10, fontSize: 14 }}
                />
            </div>

            {/* Message */}
            <div className="mb-4">
                <label className="fw-semibold mb-1 d-block" style={{ fontSize: 13 }}>
                    Message
                </label>
                <textarea
                    className="form-control"
                    placeholder="যেমন: ঈদ উপলক্ষে সব বইয়ে ১৫% ছাড়! আজই অর্ডার করুন।"
                    rows={3}
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                    style={{ borderRadius: 10, fontSize: 14, resize: "none" }}
                />
            </div>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                disabled={loading || !form.title.trim() || !form.message.trim()}
                className="btn w-100 fw-bold text-white"
                style={{
                    background: "linear-gradient(135deg, #534AB7, #1D9E75)",
                    borderRadius: 10,
                    padding: "10px",
                    border: "none",
                    fontSize: 14,
                    opacity: loading || !form.title.trim() || !form.message.trim() ? 0.7 : 1,
                }}
            >
                {loading ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        পাঠানো হচ্ছে...
                    </>
                ) : (
                    <>
                        <i className="bi bi-send-fill me-2" />
                        Notification পাঠাও
                    </>
                )}
            </button>
        </div>
    );
}