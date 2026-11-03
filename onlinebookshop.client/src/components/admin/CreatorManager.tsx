// =============================================
// CreatorManager.tsx — Manage writers & publishers
// =============================================

import { useMemo, useState } from "react";
import { getInitials, type CreatorKind } from "../creators/CreatorCard";
import type { CreatorUpsertDto } from "../../types/creator.types";

export interface CreatorItem {
    id: number;
    name: string;
    bio?: string;
    imageUrl?: string;
    isActive: boolean;
    bookCount: number;
}

interface Props {
    kind: CreatorKind;
    creators: CreatorItem[];
    onAdd: (dto: CreatorUpsertDto) => Promise<void>;
    onUpdate: (id: number, dto: CreatorUpsertDto) => Promise<void>;
    onToggleStatus: (id: number, isActive: boolean) => Promise<void>;
    saving: boolean;
    processingId: number | null;
}

const EMPTY_FORM: CreatorUpsertDto = { name: "", bio: "", imageUrl: "", isActive: true };

const COPY = {
    author: {
        singular: "Writer",
        plural: "Writers",
        icon: "bi-person-lines-fill",
        accent: "primary",
        nameMaxLength: 150,
    },
    publisher: {
        singular: "Publisher",
        plural: "Publishers",
        icon: "bi-building",
        accent: "warning",
        nameMaxLength: 100,
    },
} as const;

function isValidHttpUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export default function CreatorManager({
    kind,
    creators,
    onAdd,
    onUpdate,
    onToggleStatus,
    saving,
    processingId,
}: Props) {
    const copy = COPY[kind];
    const [form, setForm] = useState<CreatorUpsertDto>(EMPTY_FORM);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formError, setFormError] = useState("");
    const [search, setSearch] = useState("");
    const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});

    const editingCreator = creators.find((c) => c.id === editingId) ?? null;

    const visibleCreators = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return creators;
        return creators.filter((c) => c.name.toLowerCase().includes(term));
    }, [creators, search]);

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setFormError("");
    };

    const startEdit = (creator: CreatorItem) => {
        setEditingId(creator.id);
        setFormError("");
        setForm({
            name: creator.name,
            bio: creator.bio ?? "",
            imageUrl: creator.imageUrl ?? "",
            isActive: creator.isActive,
        });
    };

    const validate = (): string => {
        const name = form.name.trim();
        if (!name) return `${copy.singular} name is required.`;
        if (name.length > copy.nameMaxLength) {
            return `Name cannot exceed ${copy.nameMaxLength} characters.`;
        }
        if (form.bio && form.bio.length > 2000) {
            return "Bio cannot exceed 2000 characters.";
        }
        const imageUrl = form.imageUrl?.trim();
        if (imageUrl && !isValidHttpUrl(imageUrl)) {
            return "Image URL must be a valid http(s) URL.";
        }
        return "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validate();
        if (error) {
            setFormError(error);
            return;
        }

        const dto: CreatorUpsertDto = {
            name: form.name.trim(),
            bio: form.bio?.trim() || undefined,
            imageUrl: form.imageUrl?.trim() || undefined,
            isActive: form.isActive,
        };

        try {
            if (editingId !== null) {
                await onUpdate(editingId, dto);
            } else {
                await onAdd(dto);
            }
            resetForm();
        } catch {
            // The parent reports the error via toast; keep the form so it can be corrected.
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <h6 className="fw-bold mb-0">
                        <i className={`bi ${copy.icon} me-2 text-${copy.accent}`}></i>
                        {copy.plural} Management
                        <span className={`badge bg-${copy.accent} ms-2 rounded-pill`}>
                            {creators.length}
                        </span>
                    </h6>
                    <div className="input-group input-group-sm" style={{ maxWidth: "280px" }}>
                        <span className="input-group-text bg-white">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="search"
                            className="form-control"
                            placeholder={`Search ${copy.plural.toLowerCase()}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            aria-label={`Search ${copy.plural.toLowerCase()}`}
                        />
                    </div>
                </div>
            </div>

            <div className="card-body">
                {/* Add / Edit form */}
                <form className="mb-4" onSubmit={handleSubmit}>
                    {editingCreator && (
                        <div className="alert alert-info d-flex flex-wrap align-items-center justify-content-between gap-2 py-2">
                            <span className="small mb-0">
                                <i className="bi bi-pencil-square me-1"></i>
                                Editing <strong>{editingCreator.name}</strong>
                            </span>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary py-0"
                                onClick={resetForm}
                                disabled={saving}
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    <div className="row g-2">
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold small" htmlFor={`creator-${kind}-name`}>
                                Name
                            </label>
                            <input
                                id={`creator-${kind}-name`}
                                type="text"
                                className={`form-control ${formError ? "is-invalid" : ""}`}
                                placeholder={`${copy.singular} name`}
                                value={form.name}
                                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormError(""); }}
                                maxLength={copy.nameMaxLength}
                                disabled={saving}
                                required
                            />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold small" htmlFor={`creator-${kind}-image`}>
                                Image URL <span className="text-muted fw-normal">(optional)</span>
                            </label>
                            <input
                                id={`creator-${kind}-image`}
                                type="url"
                                className="form-control"
                                placeholder="https://example.com/photo.jpg"
                                value={form.imageUrl}
                                onChange={(e) => { setForm((f) => ({ ...f, imageUrl: e.target.value })); setFormError(""); }}
                                disabled={saving}
                            />
                        </div>
                        <div className="col-12">
                            <label className="form-label fw-semibold small" htmlFor={`creator-${kind}-bio`}>
                                Bio <span className="text-muted fw-normal">(optional)</span>
                            </label>
                            <textarea
                                id={`creator-${kind}-bio`}
                                className="form-control"
                                rows={2}
                                placeholder={`Short biography of the ${copy.singular.toLowerCase()}`}
                                value={form.bio}
                                onChange={(e) => { setForm((f) => ({ ...f, bio: e.target.value })); setFormError(""); }}
                                maxLength={2000}
                                disabled={saving}
                            />
                        </div>
                    </div>

                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3">
                        <div className="form-check form-switch mb-0">
                            <input
                                id={`creator-${kind}-active`}
                                className="form-check-input"
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                                disabled={saving}
                            />
                            <label className="form-check-label small" htmlFor={`creator-${kind}-active`}>
                                Visible on the storefront
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary fw-semibold"
                            disabled={saving || !form.name.trim()}
                        >
                            {saving ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : editingId !== null ? (
                                <><i className="bi bi-check-lg me-1"></i>Save Changes</>
                            ) : (
                                <><i className="bi bi-plus-lg me-1"></i>Add {copy.singular}</>
                            )}
                        </button>
                    </div>

                    {formError && <div className="invalid-feedback d-block mt-2">{formError}</div>}
                </form>

                {/* List */}
                {creators.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className={`bi ${copy.icon} fs-2 d-block mb-2 opacity-25`}></i>
                        No {copy.plural.toLowerCase()} yet. Add the first one above.
                    </div>
                ) : visibleCreators.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-search fs-2 d-block mb-2 opacity-25"></i>
                        No {copy.plural.toLowerCase()} match “{search.trim()}”.
                    </div>
                ) : (
                    <ul className="list-group list-group-flush">
                        {visibleCreators.map((creator) => {
                            const showInitials = !creator.imageUrl || brokenImages[creator.id];
                            const isProcessing = processingId === creator.id;
                            return (
                                <li
                                    key={creator.id}
                                    className="list-group-item px-0 py-3 d-flex flex-wrap align-items-center gap-2 gap-sm-3"
                                >
                                    {showInitials ? (
                                        <span
                                            className={`d-inline-flex align-items-center justify-content-center rounded-circle bg-${copy.accent} bg-opacity-10 text-${copy.accent} fw-bold flex-shrink-0`}
                                            style={{ width: "44px", height: "44px", fontSize: "15px" }}
                                            aria-hidden="true"
                                        >
                                            {getInitials(creator.name)}
                                        </span>
                                    ) : (
                                        <img
                                            src={creator.imageUrl}
                                            alt=""
                                            className="rounded-circle flex-shrink-0"
                                            style={{ width: "44px", height: "44px", objectFit: "cover" }}
                                            onError={() => setBrokenImages((prev) => ({ ...prev, [creator.id]: true }))}
                                        />
                                    )}

                                    <div className="flex-grow-1 min-w-0" style={{ flexBasis: "180px" }}>
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <span className="fw-semibold small">{creator.name}</span>
                                            <span className={`badge ${creator.isActive ? "bg-success" : "bg-secondary"} bg-opacity-75`}>
                                                {creator.isActive ? "Visible" : "Hidden"}
                                            </span>
                                            <span className="badge bg-light text-dark border">
                                                {creator.bookCount} {creator.bookCount === 1 ? "book" : "books"}
                                            </span>
                                        </div>
                                        {creator.bio && (
                                            <div className="text-muted small text-truncate mt-1" title={creator.bio}>
                                                {creator.bio}
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex align-items-center gap-2 ms-auto">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => startEdit(creator)}
                                            disabled={saving || isProcessing}
                                            title={`Edit ${creator.name}`}
                                        >
                                            <i className="bi bi-pencil-square"></i>
                                            <span className="d-none d-lg-inline ms-1">Edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${creator.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
                                            onClick={() => onToggleStatus(creator.id, !creator.isActive)}
                                            disabled={saving || isProcessing}
                                            title={creator.isActive ? "Hide from storefront" : "Show on storefront"}
                                        >
                                            {isProcessing ? (
                                                <span className="spinner-border spinner-border-sm" />
                                            ) : creator.isActive ? (
                                                <>
                                                    <i className="bi bi-eye-slash"></i>
                                                    <span className="d-none d-lg-inline ms-1">Hide</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="bi bi-eye"></i>
                                                    <span className="d-none d-lg-inline ms-1">Show</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
