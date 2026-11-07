// =============================================
// VendorStats.tsx — Inventory KPI cards
// =============================================

import type { BookResponseDto } from "../../types/book.types";
import { formatTaka } from "./vendorUtils";

interface Props {
    books: BookResponseDto[];
}

export default function VendorStats({ books }: Props) {
    const totalBooks = books.length;
    const liveBooks = books.filter((b) => b.isActive).length;
    const lowStock = books.filter(
        (b) => b.stock > 0 && b.stock <= (b.lowStockThreshold ?? 5)
    ).length;
    const outOfStock = books.filter((b) => b.stock === 0).length;
    const inventoryValue = books.reduce((sum, b) => {
        const unit = b.discountPrice && b.discountPrice < b.price ? b.discountPrice : b.price;
        return sum + unit * b.stock;
    }, 0);

    const stats = [
        {
            label: "Total titles",
            value: totalBooks.toString(),
            sub: `${liveBooks} live on storefront`,
            icon: "bi-book-half",
            tone: "tone-navy",
        },
        {
            label: "Inventory value",
            value: formatTaka(inventoryValue),
            sub: "At current selling price",
            icon: "bi-box-seam",
            tone: "tone-green",
        },
        {
            label: "Low stock",
            value: lowStock.toString(),
            sub: lowStock > 0 ? "Restock to keep selling" : "All titles healthy",
            icon: "bi-exclamation-triangle",
            tone: lowStock > 0 ? "tone-amber" : "tone-slate",
        },
        {
            label: "Out of stock",
            value: outOfStock.toString(),
            sub: outOfStock > 0 ? "Hidden from buyers" : "Nothing sold out",
            icon: "bi-slash-circle",
            tone: outOfStock > 0 ? "tone-red" : "tone-slate",
        },
    ];

    return (
        <div className="vp-kpi-grid">
            {stats.map((s) => (
                <div className="vp-kpi" key={s.label}>
                    <div className="vp-kpi-top">
                        <span className={`vp-kpi-icon ${s.tone}`}>
                            <i className={`bi ${s.icon}`}></i>
                        </span>
                    </div>
                    <p className="vp-kpi-label">{s.label}</p>
                    <p className="vp-kpi-value">{s.value}</p>
                    <p className="vp-kpi-sub">{s.sub}</p>
                </div>
            ))}
        </div>
    );
}
