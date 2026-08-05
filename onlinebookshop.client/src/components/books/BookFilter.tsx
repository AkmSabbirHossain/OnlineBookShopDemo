// =============================================
// BookFilter.tsx — Search, Category, Price Filter
// =============================================

import type { CategoryResponseDto, BookFilterParams } from "../../types/book.types";

interface Props {
    categories: CategoryResponseDto[];
    filters: BookFilterParams;
    onFilterChange: (filters: BookFilterParams) => void;
    onReset: () => void;
    totalCount: number;
}

export default function BookFilter({
    categories,
    filters,
    onFilterChange,
    onReset,
    totalCount,
}: Props) {

    const handleCategoryChange = (categoryId: number | undefined) => {
        onFilterChange({ ...filters, categoryId, page: 1 });
    };

    const handleSortChange = (sortBy: BookFilterParams["sortBy"]) => {
        onFilterChange({ ...filters, sortBy, page: 1 });
    };

    const handlePriceChange = (field: "minPrice" | "maxPrice", value: string) => {
        const num = value === "" ? undefined : parseFloat(value);
        onFilterChange({ ...filters, [field]: num, page: 1 });
    };

    const hasActiveFilters =
        filters.categoryId !== undefined ||
        filters.minPrice !== undefined ||
        filters.maxPrice !== undefined ||
        filters.sortBy !== undefined;

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-body p-3">

                {/* Header */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="fw-bold mb-0">
                        <i className="bi bi-funnel me-2 text-primary"></i>
                        Filters
                    </h6>
                    {hasActiveFilters && (
                        <button
                            className="btn btn-link btn-sm text-danger p-0 text-decoration-none"
                            onClick={onReset}
                        >
                            <i className="bi bi-x-circle me-1"></i>
                            Clear All
                        </button>
                    )}
                </div>

                {/* Result Count */}
                <div className="alert alert-light py-2 px-3 mb-3 border">
                    <small className="text-muted">
                        <i className="bi bi-book me-1"></i>
                        <strong>{totalCount}</strong> books found
                    </small>
                </div>

                {/* Sort By */}
                <div className="mb-4">
                    <label className="form-label fw-semibold small text-uppercase text-muted">
                        Sort By
                    </label>
                    <select
                        className="form-select form-select-sm"
                        value={filters.sortBy || ""}
                        onChange={(e) => handleSortChange(e.target.value as BookFilterParams["sortBy"])}
                    >
                        <option value="">Default</option>
                        <option value="newest">Newest First</option>
                        <option value="priceAsc">Price: Low to High</option>
                        <option value="priceDesc">Price: High to Low</option>
                        <option value="titleAsc">Title: A to Z</option>
                        <option value="titleDesc">Title: Z to A</option>
                    </select>
                </div>

                {/* Categories */}
                <div className="mb-4">
                    <label className="form-label fw-semibold small text-uppercase text-muted">
                        Category
                    </label>
                    <div className="d-flex flex-column gap-1">
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="radio"
                                name="category"
                                id="cat-all"
                                checked={filters.categoryId === undefined}
                                onChange={() => handleCategoryChange(undefined)}
                            />
                            <label className="form-check-label small" htmlFor="cat-all">
                                All Categories
                            </label>
                        </div>
                        {categories.map((cat) => (
                            <div className="form-check" key={cat.categoryId}>
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="category"
                                    id={`cat-${cat.categoryId}`}
                                    checked={filters.categoryId === cat.categoryId}
                                    onChange={() => handleCategoryChange(cat.categoryId)}
                                />
                                <label className="form-check-label small" htmlFor={`cat-${cat.categoryId}`}>
                                    {cat.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Price Range */}
                <div className="mb-3">
                    <label className="form-label fw-semibold small text-uppercase text-muted">
                        Price Range (৳)
                    </label>
                    <div className="d-flex gap-2 align-items-center">
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Min"
                            min={0}
                            value={filters.minPrice ?? ""}
                            onChange={(e) => handlePriceChange("minPrice", e.target.value)}
                        />
                        <span className="text-muted small">—</span>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder="Max"
                            min={0}
                            value={filters.maxPrice ?? ""}
                            onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
