// =============================================
// salesReport.types.ts
// =============================================

export interface DailySalesDto {
    date: string;
    orders: number;
    items: number;
    revenue: number;
    discount: number;
}

export interface TopBookSalesDto {
    bookId: number;
    title: string;
    author?: string;
    vendor?: string;
    quantitySold: number;
    ordersCount: number;
    revenue: number;
}

export interface TopVendorSalesDto {
    vendorId: number;
    shopName: string;
    quantitySold: number;
    revenue: number;
}

export interface OrderStatusBreakdownDto {
    status: string;
    count: number;
    revenue: number;
}

export interface SalesReportDto {
    from: string;
    to: string;
    ordersCount: number;
    cancelledOrdersCount: number;
    itemsSold: number;
    subtotalSales: number;
    totalDiscount: number;
    grossSales: number;
    averageOrderValue: number;
    daily: DailySalesDto[];
    topBooks: TopBookSalesDto[];
    topVendors: TopVendorSalesDto[];
    statusBreakdown: OrderStatusBreakdownDto[];
}
