// =============================================
// CategoryManager.tsx — Add / Delete categories
// =============================================

import { useState } from "react";
import type { CategoryResponseDto } from "../../types/admin.types";

interface Props {
    categories: CategoryResponseDto[];
    onAdd: (name: string, imageUrl?: string) => Promise<void>;
    onUpdate: (categoryId: number, name: string, imageUrl?: string) => Promise<void>;
    onDelete: (categoryId: number) => Promise<void>;
    deletingId: number | null;
    updatingId: number | null;
    adding: boolean;
}

export default function CategoryManager({
    categories,
    onAdd,
    onUpdate,
    onDelete,
    deletingId,
    updatingId,
    adding,
}: Props) {
    const [newName, setNewName] = useState("");
    const [newImageUrl, setNewImageUrl] = useState("");
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editImageUrl, setEditImageUrl] = useState("");
    const [editError, setEditError] = useState("");

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
        await onAdd(newName.trim(), newImageUrl.trim() || undefined);
        setNewName("");
        setNewImageUrl("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
    };

    const startEdit = (cat: CategoryResponseDto) => {
        setEditingId(cat.categoryId);
        setEditName(cat.name);
        setEditImageUrl(cat.imageUrl ?? "");
        setEditError("");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName("");
        setEditImageUrl("");
        setEditError("");
    };

    const saveEdit = async () => {
        if (editingId == null) return;
        if (!editName.trim()) {
            setEditError("Give Category name ");
            return;
        }
        if (editName.trim().length > 150) {
            setEditError("Not more 150 character ");
            return;
        }
        setEditError("");
        try {
            await onUpdate(editingId, editName.trim(), editImageUrl.trim() || undefined);
            cancelEdit();
        } catch {
            // Dashboard already shows the error toast — keep edit form open
        }
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
                    <div className="input-group mb-2">
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
                        {error && <div className="invalid-feedback">{error}</div>}
                    </div>
                    <div className="input-group">
                        <span className="input-group-text bg-white">
                            <i className="bi bi-image"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Image URL (optional)"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
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
                        {categories.map((cat) =>
                            editingId === cat.categoryId ? (
                                <div key={cat.categoryId} className="col-12">
                                    <div className="bg-light rounded-3 px-3 py-2">
                                        <div className="input-group mb-2">
                                            <span className="input-group-text bg-white">
                                                <i className="bi bi-pencil"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className={`form-control ${editError ? "is-invalid" : ""}`}
                                                placeholder="Category name"
                                                value={editName}
                                                onChange={(e) => { setEditName(e.target.value); setEditError(""); }}
                                                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }}
                                                maxLength={150}
                                                disabled={updatingId === cat.categoryId}
                                                autoFocus
                                            />
                                            {editError && <div className="invalid-feedback">{editError}</div>}
                                        </div>
                                        <div className="input-group mb-2">
                                            <span className="input-group-text bg-white">
                                                <i className="bi bi-image"></i>
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Image URL (optional)"
                                                value={editImageUrl}
                                                onChange={(e) => setEditImageUrl(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }}
                                                disabled={updatingId === cat.categoryId}
                                            />
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-primary btn-sm fw-semibold"
                                                onClick={saveEdit}
                                                disabled={updatingId === cat.categoryId || !editName.trim()}
                                            >
                                                {updatingId === cat.categoryId ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : (
                                                    <><i className="bi bi-check-lg me-1"></i>Save</>
                                                )}
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={cancelEdit}
                                                disabled={updatingId === cat.categoryId}
                                            >
                                                <i className="bi bi-x-lg me-1"></i>Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div key={cat.categoryId} className="col-md-6 col-lg-4">
                                    <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2">
                                        <div className="d-flex align-items-center gap-2">
                                            {cat.imageUrl ? (
                                                <img
                                                    src={cat.imageUrl}
                                                    alt={cat.name}
                                                    style={{
                                                        width: "24px",
                                                        height: "24px",
                                                        objectFit: "cover",
                                                        borderRadius: "4px",
                                                    }}
                                                />
                                            ) : (
                                                <span className="badge bg-info bg-opacity-10 text-info rounded-pill small">
                                                    #{cat.categoryId}
                                                </span>
                                            )}
                                            <span className="fw-semibold small">{cat.name}</span>
                                        </div>
                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-outline-primary btn-sm py-0 px-2"
                                                onClick={() => startEdit(cat)}
                                                title="Edit"
                                            >
                                                <i className="bi bi-pencil" style={{ fontSize: "12px" }}></i>
                                            </button>
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
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


//// =============================================
//// CategoryManager.tsx — Add / Delete categories
//// =============================================

//import { useState } from "react";
//import type { CategoryResponseDto } from "../../types/admin.types";

//interface Props {
//    categories: CategoryResponseDto[];
//    onAdd: (name: string) => Promise<void>;
//    onDelete: (categoryId: number) => Promise<void>;
//    deletingId: number | null;
//    adding: boolean;
//}

//export default function CategoryManager({
//    categories,
//    onAdd,
//    onDelete,
//    deletingId,
//    adding,
//}: Props) {
//    const [newName, setNewName] = useState("");
//    const [error, setError] = useState("");

//    const handleAdd = async () => {
//        if (!newName.trim()) {
//            setError("Give Category name ");
//            return;
//        }
//        if (newName.trim().length > 150) {
//            setError("Not more 150 character ");
//            return;
//        }
//        setError("");
//        await onAdd(newName.trim());
//        setNewName("");
//    };

//    const handleKeyDown = (e: React.KeyboardEvent) => {
//        if (e.key === "Enter") handleAdd();
//    };

//    return (
//        <div className="card border-0 shadow-sm rounded-3">
//            <div className="card-header bg-white border-0 py-3">
//                <h6 className="fw-bold mb-0">
//                    <i className="bi bi-tags me-2 text-info"></i>
//                    Category Management
//                    <span className="badge bg-info ms-2 rounded-pill">{categories.length}</span>
//                </h6>
//            </div>

//            <div className="card-body">

//                {/* Add Category Form */}
//                <div className="mb-4">
//                    <label className="form-label fw-semibold small">New Category</label>
//                    <div className="input-group">
//                        <input
//                            type="text"
//                            className={`form-control ${error ? "is-invalid" : ""}`}
//                            placeholder="Category name (e.g. Science Fiction)"
//                            value={newName}
//                            onChange={(e) => { setNewName(e.target.value); setError(""); }}
//                            onKeyDown={handleKeyDown}
//                            maxLength={150}
//                            disabled={adding}
//                        />
//                        <button
//                            className="btn btn-primary fw-semibold"
//                            onClick={handleAdd}
//                            disabled={adding || !newName.trim()}
//                        >
//                            {adding ? (
//                                <span className="spinner-border spinner-border-sm" />
//                            ) : (
//                                <><i className="bi bi-plus-lg me-1"></i>Add</>
//                            )}
//                        </button>
//                        {error && <div className="invalid-feedback">{error}</div>}
//                    </div>
//                </div>

//                {/* Category List */}
//                {categories.length === 0 ? (
//                    <div className="text-center py-4 text-muted">
//                        <i className="bi bi-tags fs-2 d-block mb-2 opacity-25"></i>
//                        There is no category.Add categoty.
//                    </div>
//                ) : (
//                    <div className="row g-2">
//                        {categories.map((cat) => (
//                            <div key={cat.categoryId} className="col-md-6 col-lg-4">
//                                <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2">
//                                    <div className="d-flex align-items-center gap-2">
//                                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill small">
//                                            #{cat.categoryId}
//                                        </span>
//                                        <span className="fw-semibold small">{cat.name}</span>
//                                    </div>
//                                    <button
//                                        className="btn btn-outline-danger btn-sm py-0 px-2"
//                                        onClick={() => {
//                                            if (window.confirm(`"Do you want to delete ${cat.name}"?`))
//                                                onDelete(cat.categoryId);
//                                        }}
//                                        disabled={deletingId === cat.categoryId}
//                                        title="Delete"
//                                    >
//                                        {deletingId === cat.categoryId ? (
//                                            <span className="spinner-border spinner-border-sm" />
//                                        ) : (
//                                            <i className="bi bi-trash3" style={{ fontSize: "12px" }}></i>
//                                        )}
//                                    </button>
//                                </div>
//                            </div>
//                        ))}
//                    </div>
//                )}
//            </div>
//        </div>
//    );
//}