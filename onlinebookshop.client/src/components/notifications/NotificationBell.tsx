import { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";

export default function NotificationBell() {
    const { unreadCount, fetchNotifications } = useNotifications(); 
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ✅ Bell click করলে fresh data আনো
    const handleOpen = () => {
        const isOpening = !open;
        setOpen(isOpening);
        if (isOpening) fetchNotifications();
    };

    return (
        <div className="position-relative" ref={ref}>
            <button
                className="btn btn-link p-0 border-0 position-relative"
                onClick={handleOpen}
                aria-label="Notifications"
                style={{ color: "inherit" }}
            >
                <i className="bi bi-bell-fill fs-5" />
                {unreadCount > 0 && (
                    <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: "10px", minWidth: "18px", padding: "2px 5px" }}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && <NotificationDropdown onClose={() => setOpen(false)} />}
        </div>
    );
}