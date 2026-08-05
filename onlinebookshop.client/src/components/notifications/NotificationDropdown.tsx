import { useNotifications } from "../../context/NotificationContext";
import type { NotificationDto } from "../../types/notification.types";

function timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

interface Props {
    onClose: () => void;
}

export default function NotificationDropdown({ onClose }: Props) {
    const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

    const handleMarkRead = async (n: NotificationDto) => {
        if (!n.isRead) await markAsRead(n.notificationId);
    };

    return (
        <div
            className="position-absolute end-0 mt-2 shadow-lg bg-white"
            style={{
                width: 360,
                borderRadius: 16,
                zIndex: 1050,
                maxHeight: 480,
                display: "flex",
                flexDirection: "column",
                border: "1px solid rgba(0,0,0,0.08)",
            }}
        >
            {/* Header */}
            <div
                className="d-flex align-items-center justify-content-between px-4 py-3"
                style={{
                    borderBottom: "1px solid #f0f0f0",
                    background: "linear-gradient(135deg, #534AB7, #1D9E75)",
                    borderRadius: "16px 16px 0 0",
                }}
            >
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-bell-fill text-white" />
                    <span className="fw-bold text-white" style={{ fontSize: 15 }}>Notifications</span>
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="badge rounded-pill" style={{ background: "rgba(255,255,255,0.25)", color: "#fff", fontSize: 11 }}>
                            {notifications.filter(n => !n.isRead).length} new
                        </span>
                    )}
                </div>
                <div className="d-flex align-items-center gap-2">
                    {notifications.some(n => !n.isRead) && (
                        <button
                            className="btn btn-sm border-0 fw-semibold"
                            style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "3px 10px" }}
                            onClick={markAllAsRead}
                        >
                            Mark all read
                        </button>
                    )}
                    <button className="btn btn-sm border-0 text-white" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
                {loading ? (
                    <div className="text-center py-5 text-muted">
                        <div className="spinner-border spinner-border-sm me-2" />
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-5">
                        <i className="bi bi-bell-slash fs-2 text-muted d-block mb-2" />
                        <span className="text-muted" style={{ fontSize: 14 }}>No notifications yet</span>
                    </div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.notificationId}
                            className="d-flex align-items-start gap-3 px-4 py-3 position-relative"
                            onClick={() => handleMarkRead(n)}
                            style={{
                                cursor: "pointer",
                                background: n.isRead ? "transparent" : "rgba(83,74,183,0.05)",
                                borderBottom: "1px solid #f5f5f5",
                                transition: "background 0.15s",
                            }}
                        >
                            {/* Unread dot */}
                            {!n.isRead && (
                                <span
                                    className="position-absolute"
                                    style={{
                                        left: 12, top: "50%", transform: "translateY(-50%)",
                                        width: 7, height: 7, borderRadius: "50%",
                                        background: "#534AB7",
                                    }}
                                />
                            )}

                            {/* Icon */}
                            <div
                                className="d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
                                style={{
                                    width: 38, height: 38, borderRadius: 10,
                                    background: n.isRead ? "#f0f0f0" : "rgba(83,74,183,0.12)",
                                    marginLeft: 8,
                                }}
                            >
                                <i
                                    className="bi bi-bell"
                                    style={{ fontSize: 16, color: n.isRead ? "#aaa" : "#534AB7" }}
                                />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    className="fw-semibold text-truncate"
                                    style={{ fontSize: 13.5, color: n.isRead ? "#555" : "#222" }}
                                >
                                    {n.title}
                                </div>
                                <div
                                    className="text-muted mt-1"
                                    style={{ fontSize: 12.5, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                                >
                                    {n.message}
                                </div>
                                <div className="mt-1" style={{ fontSize: 11, color: "#aaa" }}>
                                    {timeAgo(n.createdAt)}
                                </div>
                            </div>

                            {/* Delete */}
                            <button
                                className="btn btn-sm border-0 p-1 flex-shrink-0"
                                style={{ color: "#ccc", lineHeight: 1 }}
                                onClick={e => { e.stopPropagation(); deleteNotification(n.notificationId); }}
                                title="Delete"
                            >
                                <i className="bi bi-trash3" style={{ fontSize: 13 }} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}