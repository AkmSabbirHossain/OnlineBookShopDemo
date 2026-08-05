// =============================================
// CategoryManager.tsx — Add / Delete categories
// =============================================

import { useState } from "react";
import type { CategoryResponseDto } from "../../types/admin.types";

interface Props {
    categories: CategoryResponseDto[];
    onAdd: (name: string) => Promise<void>;
    onDelete: (categoryId: number) => Promise<void>;
    deletingId: number | null;
    adding: boolean;
}

export default function CategoryManager({
    categories,
    onAdd,
    onDelete,
    deletingId,
    adding,
}: Props) {
    const [newName, setNewName] = useState("");
    const [error, setError] = useState("");

    const handleAdd = async () => {
        if (!newName.trim()) {
            setError("Give Category name ");
            return;
        }
        if (newName.trim().length > 150) {
            setError("Not more 150 character ");
            return;
        }
        setError("");
        await onAdd(newName.trim());
        setNewName("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
    };

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-tags me-2 text-info"></i>
                    Category Management
                    <span className="badge bg-info ms-2 rounded-pill">{categories.length}</span>
                </h6>
            </div>

            <div className="card-body">

                {/* Add Category Form */}
                <div className="mb-4">
                    <label className="form-label fw-semibold small">New Category</label>
                    <div className="input-group">
                        <input
                            type="text"
                            className={`form-control ${error ? "is-invalid" : ""}`}
                            placeholder="Category name (e.g. Science Fiction)"
                            value={newName}
                            onChange={(e) => { setNewName(e.target.value); setError(""); }}
                            onKeyDown={handleKeyDown}
                            maxLength={150}
                            disabled={adding}
                        />
                        <button
                            className="btn btn-primary fw-semibold"
                            onClick={handleAdd}
                            disabled={adding || !newName.trim()}
                        >
                            {adding ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : (
                                <><i className="bi bi-plus-lg me-1"></i>Add</>
                            )}
                        </button>
                        {error && <div className="invalid-feedback">{error}</div>}
                    </div>
                </div>

                {/* Category List */}
                {categories.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-tags fs-2 d-block mb-2 opacity-25"></i>
                        There is no category.Add categoty.
                    </div>
                ) : (
                    <div className="row g-2">
                        {categories.map((cat) => (
                            <div key={cat.categoryId} className="col-md-6 col-lg-4">
                                <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill small">
                                            #{cat.categoryId}
                                        </span>
                                        <span className="fw-semibold small">{cat.name}</span>
                                    </div>
                                    <button
                                        className="btn btn-outline-danger btn-sm py-0 px-2"
                                        onClick={() => {
                                            if (window.confirm(`"Do you want to delete ${cat.name}"?`))
                                                onDelete(cat.categoryId);
                                        }}
                                        disabled={deletingId === cat.categoryId}
                                        title="Delete"
                                    >
                                        {deletingId === cat.categoryId ? (
                                            <span className="spinner-border spinner-border-sm" />
                                        ) : (
                                            <i className="bi bi-trash3" style={{ fontSize: "12px" }}></i>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}