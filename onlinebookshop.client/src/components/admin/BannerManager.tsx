// =============================================
// BannerManager.tsx — Add / Delete / Toggle hero banners
// =============================================

import { useState } from "react";
import type { BannerResponseDto, BannerCreateDto } from "../../types/banner.types";

interface Props {
    banners: BannerResponseDto[];
    onAdd: (dto: BannerCreateDto) => Promise<void>;
    onDelete: (bannerId: number) => Promise<void>;
    onToggleActive: (banner: BannerResponseDto) => Promise<void>;
    deletingId: number | null;
    adding: boolean;
}

export default function BannerManager({
    banners,
    onAdd,
    onDelete,
    onToggleActive,
    deletingId,
    adding,
}: Props) {
    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [displayOrder, setDisplayOrder] = useState(0);
    const [error, setError] = useState("");

    const handleAdd = async () => {
        if (!title.trim()) {
            setError("Give banner title");
            return;
        }
        if (!imageUrl.trim()) {
            setError("Give image URL");
            return;
        }
        setError("");
        await onAdd({
            title: title.trim(),
            subtitle: subtitle.trim() || undefined,
            imageUrl: imageUrl.trim(),
            linkUrl: linkUrl.trim() || undefined,
            displayOrder,
            isActive: true,
        });
        setTitle("");
        setSubtitle("");
        setImageUrl("");
        setLinkUrl("");
        setDisplayOrder(0);
    };

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-images me-2 text-info"></i>
                    Hero Banner Management
                    <span className="badge bg-info ms-2 rounded-pill">{banners.length}</span>
                </h6>
            </div>

            <div className="card-body">
                {/* Add Banner Form */}
                <div className="mb-4">
                    <label className="form-label fw-semibold small">New Banner</label>
                    <input
                        type="text"
                        className={`form-control mb-2 ${error && !title.trim() ? "is-invalid" : ""}`}
                        placeholder="Banner title (e.g. Eid Book Fest)"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setError(""); }}
                        maxLength={150}
                        disabled={adding}
                    />
                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Subtitle (optional)"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        maxLength={200}
                        disabled={adding}
                    />
                    <input
                        type="text"
                        className={`form-control mb-2 ${error && !imageUrl.trim() ? "is-invalid" : ""}`}
                        placeholder="Image URL (required)"
                        value={imageUrl}
                        onChange={(e) => { setImageUrl(e.target.value); setError(""); }}
                        disabled={adding}
                    />
                    <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Link URL (optional — click e kothay jabe)"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        disabled={adding}
                    />
                    <div className="d-flex gap-2 align-items-center">
                        <input
                            type="number"
                            className="form-control"
                            style={{ maxWidth: "120px" }}
                            placeholder="Order"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(Number(e.target.value))}
                            disabled={adding}
                        />
                        <button
                            className="btn btn-primary fw-semibold flex-shrink-0"
                            onClick={handleAdd}
                            disabled={adding || !title.trim() || !imageUrl.trim()}
                        >
                            {adding ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : (
                                <><i className="bi bi-plus-lg me-1"></i>Add Banner</>
                            )}
                        </button>
                        {error && <span className="text-danger small">{error}</span>}
                    </div>
                </div>

                {/* Banner List */}
                {banners.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-images fs-2 d-block mb-2 opacity-25"></i>
                        There is no banner. Add banner.
                    </div>
                ) : (
                    <div className="row g-2">
                        {banners.map((b) => (
                            <div key={b.bannerId} className="col-md-6">
                                <div className="d-flex align-items-center justify-content-between bg-light rounded-3 px-3 py-2">
                                    <div className="d-flex align-items-center gap-2 overflow-hidden">
                                        <img
                                            src={b.imageUrl}
                                            alt={b.title}
                                            style={{
                                                width: "48px",
                                                height: "32px",
                                                objectFit: "cover",
                                                borderRadius: "4px",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div className="overflow-hidden">
                                            <div className="fw-semibold small text-truncate">{b.title}</div>
                                            <div className="text-muted" style={{ fontSize: "11px" }}>
                                                Order: {b.displayOrder}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-1 flex-shrink-0">
                                        <button
                                            className={`btn btn-sm py-0 px-2 ${b.isActive ? "btn-outline-success" : "btn-outline-secondary"}`}
                                            onClick={() => onToggleActive(b)}
                                            title={b.isActive ? "Active — click to hide" : "Inactive — click to show"}
                                        >
                                            <i className={`bi ${b.isActive ? "bi-eye" : "bi-eye-slash"}`} style={{ fontSize: "12px" }}></i>
                                        </button>
                                        <button
                                            className="btn btn-outline-danger btn-sm py-0 px-2"
                                            onClick={() => {
                                                if (window.confirm(`Delete "${b.title}"?`))
                                                    onDelete(b.bannerId);
                                            }}
                                            disabled={deletingId === b.bannerId}
                                        >
                                            {deletingId === b.bannerId ? (
                                                <span className="spinner-border spinner-border-sm" />
                                            ) : (
                                                <i className="bi bi-trash3" style={{ fontSize: "12px" }}></i>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}