import axiosInstance from "./axiosInstance"; 
import type { NotificationDto, BroadcastNotificationDto } from "../types/notification.types";
const BASE = "/notification"; //

export const notificationService = {
    getAll: () =>
        axiosInstance.get<NotificationDto[]>(BASE).then(r => r.data),

    getUnreadCount: () =>
        axiosInstance.get<number>(`${BASE}/unread-count`).then(r => r.data),

    markAsRead: (id: number) =>
        axiosInstance.put(`${BASE}/${id}/read`),

    markAllAsRead: () =>
        axiosInstance.put(`${BASE}/mark-all-read`),

    delete: (id: number) =>
        axiosInstance.delete(`${BASE}/${id}`),

    broadcast: (dto: BroadcastNotificationDto) =>
        axiosInstance.post(`${BASE}/broadcast`, dto).then(r => r.data),
};