// =============================================
// VendorStats.tsx — Summary cards
// =============================================

import type { BookResponseDto } from "../../types/book.types";

interface Props {
    books: BookResponseDto[];
}

export default function VendorStats({ books }: Props) {
    const totalBooks = books.length;
    const totalStock = books.reduce((sum, b) => sum + b.stock, 0);
    const outOfStock = books.filter((b) => b.stock === 0).length;
    const avgPrice =
        books.length > 0
            ? books.reduce((sum, b) => sum + b.price, 0) / books.length
            : 0;

    const stats = [
        {
            label: "Total Books",
            value: totalBooks,
            icon: "bi-book",
            color: "primary",
            suffix: "",
        },
        {
            label: "Total Stock",
            value: totalStock,
            icon: "bi-boxes",
            color: "success",
            suffix: " pcs",
        },
        {
            label: "Out of Stock",
            value: outOfStock,
            icon: "bi-exclamation-triangle",
            color: outOfStock > 0 ? "danger" : "secondary",
            suffix: "",
        },
        {
            label: "Avg. Price",
            value: `৳ ${avgPrice.toFixed(0)}`,
            icon: "bi-tag",
            color: "warning",
            suffix: "",
        },
    ];

    return (
        <div className="row g-3 mb-4">
            {stats.map((s) => (
                <div key={s.label} className="col-6 col-md-3">
                    <div className={`card border-0 shadow-sm rounded-3 border-start border-4 border-${s.color}`}>
                        <div className="card-body py-3 px-3">
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <p className="text-muted small mb-1">{s.label}</p>
                                    <h4 className="fw-bold mb-0">
                                        {s.value}
                                        {s.suffix}
                                    </h4>
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