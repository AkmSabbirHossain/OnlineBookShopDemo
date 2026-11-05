// =============================================
// AdminStats.tsx — Summary stat cards
// =============================================

interface Props {
    totalBooks: number;
    totalVendors: number;
    pendingVendors: number;
    totalCategories: number;
    totalCoupons: number;
    totalBanners: number;
    totalCreators: number;
}

export default function AdminStats({
    totalBooks,
    totalVendors,
    pendingVendors,
    totalCategories,
    totalCoupons,
    totalBanners,
    totalCreators,
}: Props) {
    const stats = [
        {
            label: "Books in catalog",
            value: totalBooks,
            icon: "bi-book-half",
            tone: "adm-tone-blue",
        },
        {
            label: "Total vendors",
            value: totalVendors,
            icon: "bi-shop-window",
            tone: "adm-tone-green",
        },
        {
            label: "Pending approvals",
            value: pendingVendors,
            icon: "bi-hourglass-split",
            tone: "adm-tone-amber",
        },
        {
            label: "Categories",
            value: totalCategories,
            icon: "bi-tags-fill",
            tone: "adm-tone-violet",
        },
        {
            label: "Coupons",
            value: totalCoupons,
            icon: "bi-ticket-perforated-fill",
            tone: "adm-tone-rose",
        },
        {
            label: "Writers & publishers",
            value: totalCreators,
            icon: "bi-people-fill",
            tone: "adm-tone-sky",
        },
    ];

    return (
        <div className="row g-3 mb-4">
            {stats.map((s) => (
                <div key={s.label} className="col-6 col-lg-4">
                    <div className="adm-stat">
                        <span className={`adm-stat-icon ${s.tone}`}>
                            <i className={`bi ${s.icon}`} aria-hidden="true" />
                        </span>
                        <div className="adm-stat-info">
                            <p className="adm-stat-value mb-0">{s.value}</p>
                            <p className="adm-stat-label mb-0">{s.label}</p>
                        </div>
                    </div>
                </div>
            ))}
            <div className="col-12">
                <p className="adm-stat-note mb-0">
                    <i className="bi bi-images me-1" aria-hidden="true" />
                    {totalBanners} banner{totalBanners === 1 ? "" : "s"} currently configured
                </p>
            </div>
        </div>
    );
}
