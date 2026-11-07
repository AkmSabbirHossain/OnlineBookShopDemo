// =============================================
// BookTable.tsx — Vendor inventory table
// =============================================

import { useMemo, useState } from "react";
import type { BookResponseDto, CategoryResponseDto } from "../../types/book.types";
import { formatDate, formatTaka2, PLACEHOLDER_COVER } from "./vendorUtils";

interface Props {
    books: BookResponseDto[];
    onEdit: (book: BookResponseDto) => void;
    categories: CategoryResponseDto[];
    onDelete: (bookId: number) => void;
    deletingId: number | null;
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onToggleStatus: (book: BookResponseDto, patch: { isActive?: boolean; isFeatured?: boolean }) => void;
    statusUpdatingId: number | null;
}

type StockFilter = "all" | "active" | "hidden" | "low";

export default function BookTable({
    books,
    onEdit,
    categories,
    onDelete,
    deletingId,
    searchQuery,
    onSearchChange,
    onToggleStatus,
    statusUpdatingId,
}: Props) {
    const [stockFilter, setStockFilter] = useState<StockFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    const counts = useMemo(
        () => ({
            all: books.length,
            active: books.filter((b) => b.isActive).length,
            hidden: books.filter((b) => !b.isActive).length,
            low: books.filter((b) => b.stock <= (b.lowStockThreshold ?? 5)).length,
        }),
        [books]
    );

    const filtered = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return books.filter((b) => {
            const matchesQuery =
                !query ||
                b.title.toLowerCase().includes(query) ||
                b.author.toLowerCase().includes(query);
            const matchesCategory =
                categoryFilter === "all" || b.categoryId === Number(categoryFilter);
            const matchesStock =
                stockFilter === "all" ||
                (stockFilter === "active" && b.isActive) ||
                (stockFilter === "hidden" && !b.isActive) ||
                (stockFilter === "low" && b.stock <= (b.lowStockThreshold ?? 5));
            return matchesQuery && matchesCategory && matchesStock;
        });
    }, [books, searchQuery, categoryFilter, stockFilter]);

    const chips: { id: StockFilter; label: string }[] = [
        { id: "all", label: "All" },
        { id: "active", label: "Live" },
        { id: "hidden", label: "Hidden" },
        { id: "low", label: "Low stock" },
    ];

    return (
        <div className="vp-card">
            <div className="vp-card-head">
                <h3 className="vp-card-title">
                    <i className="bi bi-book-half"></i>
                    My books
                    <span className="vp-count">{books.length}</span>
                </h3>

                <div className="vp-filters">
                    <div className="vp-search" style={{ width: 220 }}>
                        <i className="bi bi-search"></i>
                        <input
                            className="vp-input"
                            type="search"
                            placeholder="Search title or author"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            aria-label="Search books"
                        />
                    </div>
                    <select
                        className="vp-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        aria-label="Filter by category"
                    >
                        <option value="all">All categories</option>
                        {categories.map((c) => (
                            <option key={c.categoryId} value={c.categoryId}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div
                className="vp-filters"
                style={{ padding: "12px 18px", borderBottom: "1px solid #e6ebf2" }}
            >
                {chips.map((chip) => (
                    <button
                        key={chip.id}
                        type="button"
                        className={`vp-chip ${stockFilter === chip.id ? "active" : ""}`}
                        onClick={() => setStockFilter(chip.id)}
                    >
                        {chip.label}
                        <span className="count">{counts[chip.id]}</span>
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="vp-empty">
                    <div className="vp-empty-icon">
                        <i className="bi bi-journal-x"></i>
                    </div>
                    <h4>{books.length === 0 ? "No books yet" : "No matches"}</h4>
                    <p>
                        {books.length === 0
                            ? "Add your first title to start selling."
                            : "Try a different search, category or filter."}
                    </p>
                </div>
            ) : (
                <div className="vp-table-wrap">
                    <table className="vp-table">
                        <thead>
                            <tr>
                                <th style={{ width: 56 }}></th>
                                <th>Title / Author</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Visibility</th>
                                <th>Added</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((book) => {
                                const threshold = book.lowStockThreshold ?? 5;
                                const hasDiscount =
                                    book.discountPrice != null && book.discountPrice < book.price;
                                const stockPct = Math.min(
                                    100,
                                    Math.round((book.stock / Math.max(threshold * 4, 1)) * 100)
                                );
                                const stockColor =
                                    book.stock === 0
                                        ? "#dc2626"
                                        : book.stock <= threshold
                                          ? "#f59e0b"
                                          : "#0f9d58";

                                return (
                                    <tr key={book.bookId}>
                                        <td>
                                            <img
                                                className="vp-cover"
                                                src={book.imageUrl || PLACEHOLDER_COVER}
                                                alt={book.title}
                                                loading="lazy"
                                                onError={(e) =>
                                                    (e.currentTarget.src = PLACEHOLDER_COVER)
                                                }
                                            />
                                        </td>
                                        <td>
                                            <p className="vp-cell-title" title={book.title}>
                                                {book.title}
                                            </p>
                                            <p className="vp-cell-sub">
                                                {book.author}
                                                {book.isFeatured && (
                                                    <span
                                                        className="vp-pill delivered"
                                                        style={{ marginLeft: 6 }}
                                                    >
                                                        <i className="bi bi-star-fill"></i>
                                                        Featured
                                                    </span>
                                                )}
                                            </p>
                                        </td>
                                        <td>
                                            <span className="vp-pill neutral">
                                                {categories.find(
                                                    (c) => c.categoryId === book.categoryId
                                                )?.name ?? `#${book.categoryId}`}
                                            </span>
                                        </td>
                                        <td>
                                            {hasDiscount ? (
                                                <div>
                                                    <p
                                                        style={{
                                                            margin: 0,
                                                            fontWeight: 700,
                                                            color: "#16233d",
                                                        }}
                                                    >
                                                        {formatTaka2(book.discountPrice!)}
                                                    </p>
                                                    <p
                                                        className="vp-cell-sub"
                                                        style={{
                                                            textDecoration: "line-through",
                                                        }}
                                                    >
                                                        {formatTaka2(book.price)}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span style={{ fontWeight: 700, color: "#16233d" }}>
                                                    {formatTaka2(book.price)}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="vp-stock">
                                                <div className="vp-stock-bar">
                                                    <span
                                                        style={{
                                                            width: `${stockPct}%`,
                                                            background: stockColor,
                                                        }}
                                                    ></span>
                                                </div>
                                                <span className="vp-stock-num">
                                                    {book.stock === 0
                                                        ? "Out"
                                                        : `${book.stock} pcs`}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "flex-start",
                                                    gap: 5,
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className={`vp-pill ${book.isActive ? "delivered" : "neutral"}`}
                                                    style={{ border: 0, cursor: "pointer" }}
                                                    onClick={() =>
                                                        onToggleStatus(book, {
                                                            isActive: !book.isActive,
                                                        })
                                                    }
                                                    disabled={statusUpdatingId === book.bookId}
                                                    title={
                                                        book.isActive
                                                            ? "Hide from storefront"
                                                            : "Show in storefront"
                                                    }
                                                >
                                                    {statusUpdatingId === book.bookId ? (
                                                        <span className="spinner-border spinner-border-sm" />
                                                    ) : (
                                                        <i
                                                            className={`bi ${book.isActive ? "bi-eye" : "bi-eye-slash"}`}
                                                        ></i>
                                                    )}
                                                    {book.isActive ? "Live" : "Hidden"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`vp-pill ${book.isFeatured ? "pending" : "neutral"}`}
                                                    style={{
                                                        border: 0,
                                                        cursor: "pointer",
                                                        padding: "2px 8px",
                                                        fontSize: 10,
                                                    }}
                                                    onClick={() =>
                                                        onToggleStatus(book, {
                                                            isFeatured: !book.isFeatured,
                                                        })
                                                    }
                                                    disabled={statusUpdatingId === book.bookId}
                                                    title={
                                                        book.isFeatured
                                                            ? "Remove from featured"
                                                            : "Mark as featured"
                                                    }
                                                >
                                                    <i
                                                        className={`bi ${book.isFeatured ? "bi-star-fill" : "bi-star"}`}
                                                    ></i>
                                                    {book.isFeatured ? "Featured" : "Regular"}
                                                </button>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="vp-cell-sub">
                                                {formatDate(book.createdAt)}
                                            </span>
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: 6,
                                                    justifyContent: "flex-end",
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className="vp-btn vp-btn-sm"
                                                    onClick={() => onEdit(book)}
                                                    title="Edit book"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="vp-btn vp-btn-sm vp-btn-danger"
                                                    onClick={() => onDelete(book.bookId)}
                                                    disabled={deletingId === book.bookId}
                                                    title="Delete book"
                                                >
                                                    {deletingId === book.bookId ? (
                                                        <span className="spinner-border spinner-border-sm" />
                                                    ) : (
                                                        <i className="bi bi-trash3"></i>
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
