import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { NotificationDto } from "../types/notification.types";
import { notificationService } from "../services/notification.service";

interface NotificationContextType {
    notifications: NotificationDto[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const data = await notificationService.getAll();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    const markAsRead = async (id: number) => {
        await notificationService.markAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        await notificationService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    const deleteNotification = async (id: number) => {
        const target = notifications.find(n => n.notificationId === id);
        await notificationService.delete(id);
        setNotifications(prev => prev.filter(n => n.notificationId !== id));
        if (target && !target.isRead) setUnreadCount(prev => Math.max(0, prev - 1));
    };

    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchNotifications]);

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, loading,
            fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
    return ctx;
}