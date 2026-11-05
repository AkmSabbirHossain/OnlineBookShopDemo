// =============================================
// salesReport.service.ts
// =============================================

import axiosInstance from "./axiosInstance";
import type { SalesReportDto } from "../types/salesReport.types";

interface RangeParams {
    from?: string;
    to?: string;
}

const SalesReportService = {
    // GET /api/admin/sales-report
    getReport: async (params: RangeParams = {}): Promise<SalesReportDto> => {
        const res = await axiosInstance.get<SalesReportDto>("/admin/sales-report", { params });
        return res.data;
    },

    // GET /api/admin/sales-report/export
    downloadCsv: async (params: RangeParams = {}): Promise<void> => {
        const res = await axiosInstance.get<Blob>("/admin/sales-report/export", {
            params,
            responseType: "blob",
        });

        const url = URL.createObjectURL(res.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = `sales-report-${params.from ?? "start"}-${params.to ?? "today"}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    },
};

export default SalesReportService;
