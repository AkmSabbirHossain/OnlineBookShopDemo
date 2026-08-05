// =============================================
// AdminStats.tsx — Summary stat cards
// =============================================

interface Props {
    totalBooks: number;
    totalVendors: number;
    pendingVendors: number;
    totalCategories: number;
}

export default function AdminStats({
    totalBooks,
    totalVendors,
    pendingVendors,
    totalCategories,
}: Props) {
    const stats = [
        {
            label: "Total Books",
            value: totalBooks,
            icon: "bi-book",
            color: "primary",
        },
        {
            label: "Total Vendors",
            value: totalVendors,
            icon: "bi-shop",
            color: "success",
        },
        {
            label: "Pending Approval",
            value: pendingVendors,
            icon: "bi-hourglass-split",
            color: pendingVendors > 0 ? "warning" : "secondary",
        },
        {
            label: "Categories",
            value: totalCategories,
            icon: "bi-tags",
            color: "info",
        },
    ];

    return (
        <div className="row g-3 mb-4">
            {stats.map((s) => (
                <div key={s.label} className="col-6 col-md-3">
                    <div
                        className={`card border-0 shadow-sm rounded-3 border-start border-4 border-${s.color}`}
                    >
                        <div className="card-body py-3 px-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">{s.label}</p>
                                    <h4 className="fw-bold mb-0">{s.value}</h4>
                                </div>
                                <div
                                    className={`rounded-circle bg-${s.color} bg-opacity-10 d-flex align-items-center justify-content-center`}
                                    style={{ width: "46px", height: "46px" }}
                                >
                                    <i className={`bi ${s.icon} text-${s.color} fs-5`}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}