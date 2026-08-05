// =============================================
// BookTable.tsx — Vendor books table
// =============================================

import type { BookResponseDto } from "../../types/book.types";
import type { CategoryResponseDto } from "../../types/admin.types";

interface Props {
    books: BookResponseDto[];
    onEdit: (book: BookResponseDto) => void;
    categories: CategoryResponseDto[];
    onDelete: (bookId: number) => void;
    deletingId: number | null;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}


const PLACEHOLDER_IMG = "https://placehold.co/50x65?text=Book";

export default function BookTable({
    books,
    onEdit,
    categories,
    onDelete,
    deletingId,
    searchQuery,
    onSearchChange,
}: Props) {
    const filtered = books.filter(
        (b) =>
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-book me-2 text-primary"></i>
                    My Books
                    <span className="badge bg-primary ms-2 rounded-pill">{books.length}</span>
                </h6>
                {/* Search */}
                <div className="input-group input-group-sm" style={{ maxWidth: "280px" }}>
                    <span className="input-group-text">
                        <i className="bi bi-search"></i>
                    </span>
                    <input
                        type="search"
                        className="form-control"
                        placeholder="Search books..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <div className="card-body p-0">
                {filtered.length === 0 ? (
                    <div className="text-center py-5">
                        <div style={{ fontSize: "50px" }}>📭</div>
                        <p className="text-muted mt-2">
                            {searchQuery ? "No books match your search." : "No books added yet."}
                        </p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th style={{ width: "60px" }}></th>
                                    <th>Title / Author</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Publication</th>
                                    <th>Edition</th>                                 
                                    <th>Stock</th>
                                    <th>Added</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((book) => (
                                    <tr key={book.bookId}>
                                        {/* Cover */}
                                        <td>
                                            <img
                                                src={book.imageUrl || PLACEHOLDER_IMG}
                                                alt={book.title}
                                                className="rounded"
                                                style={{ width: "40px", height: "52px", objectFit: "cover" }}
                                                onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                                            />
                                        </td>

                                        {/* Title / Author */}
                                        <td>
                                            <p className="fw-semibold mb-0 text-truncate" style={{ maxWidth: "200px" }}>
                                                {book.title}
                                            </p>
                                            <small className="text-muted">{book.author}</small>
                                        </td>

                                    
                                        {/* Category */}
                                        <td>
                                            <span className="badge bg-secondary-subtle text-secondary-emphasis">
                                                {categories.find((c) => c.categoryId === book.categoryId)?.name ?? `#${book.categoryId}`}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="fw-semibold text-dark">
                                            ৳ {book.price.toFixed(2)}
                                        </td>
                                        {/* publisher */}
                                        <td className="fw-semibold text-dark">
                                            {book.publisher}
                                        </td>
                                        {/* edition */}
                                        <td className="fw-semibold text-dark">
                                             {book.edition}
                                        </td>
                                    
                                        {/* Stock */}
                                        <td>
                                            <span
                                                className={`badge ${book.stock === 0
                                                        ? "bg-danger"
                                                        : book.stock <= 5
                                                            ? "bg-warning text-dark"
                                                            : "bg-success"
                                                    }`}
                                            >
                                                {book.stock === 0 ? "Out of Stock" : `${book.stock} pcs`}
                                            </span>
                                        </td>

                                        {/* Date */}
                                        <td>
                                            <small className="text-muted">
                                                {new Date(book.createdAt).toLocaleDateString("en-GB")}
                                            </small>
                                        </td>

                                        {/* Actions */}
                                        <td className="text-end">
                                            <div className="d-flex gap-1 justify-content-end">
                                                <button
                                                    className="btn btn-outline-primary btn-sm"
                                                    onClick={() => onEdit(book)}
                                                    title="Edit"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => onDelete(book.bookId)}
                                                    disabled={deletingId === book.bookId}
                                                    title="Delete"
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}