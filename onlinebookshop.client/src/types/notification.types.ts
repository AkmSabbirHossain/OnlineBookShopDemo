export interface NotificationDto {
    notificationId: number;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}
export interface BroadcastNotificationDto {
    title: string;
    message: string;
    target: "All" | "Customer" | "Vendor";
}