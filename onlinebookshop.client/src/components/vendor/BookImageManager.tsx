// =============================================
// BookImageManager.tsx — Vendor book gallery
// =============================================

import { useRef, useState } from "react";
import axios from "axios";
import VendorService from "../../services/vendor.service";
import BookService from "../../services/book.service";
import type { BookResponseDto } from "../../types/book.types";

const MAX_IMAGES = 8;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface Props {
    book: BookResponseDto;
    onBookUpdated: (book: BookResponseDto) => void;
}

function getErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        return err.response?.data?.message || fallback;
    }
    return fallback;
}

export default function BookImageManager({ book, onBookUpdated }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [busyImageId, setBusyImageId] = useState<number | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const images = book.images ?? [];
    const remaining = MAX_IMAGES - images.length;

    const refreshBook = async () => {
        const updated = await BookService.getBookById(book.bookId);
        onBookUpdated(updated);
    };

    const handleFiles = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        setError("");
        setSuccess("");

        const files = Array.from(fileList);

        if (files.length > remaining) {
            setError(`You can add up to ${MAX_IMAGES} images. ${remaining} slot(s) left.`);
            return;
        }

        const invalidType = files.find((file) => !ACCEPTED_TYPES.includes(file.type));
        if (invalidType) {
            setError("Only JPG, PNG, WEBP or GIF images are allowed.");
            return;
        }

        const tooLarge = files.find((file) => file.size > MAX_FILE_SIZE);
        if (tooLarge) {
            setError(`"${tooLarge.name}" is larger than 5 MB.`);
            return;
        }

        setUploading(true);
        try {
            for (let i = 0; i < files.length; i++) {
                setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
                await VendorService.uploadBookImage(book.bookId, files[i]);
            }
            await refreshBook();
            setSuccess(files.length === 1 ? "Image added." : `${files.length} images added.`);
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to upload image."));
        } finally {
            setUploading(false);
            setUploadProgress("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleDelete = async (imageId: number) => {
        if (!window.confirm("Remove this image from the gallery?")) return;
        setError("");
        setSuccess("");
        setBusyImageId(imageId);
        try {
            await VendorService.deleteBookImage(book.bookId, imageId);
            await refreshBook();
            setSuccess("Image removed.");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to remove image."));
        } finally {
            setBusyImageId(null);
        }
    };

    const handleSetPrimary = async (imageId: number) => {
        setError("");
        setSuccess("");
        setBusyImageId(imageId);
        try {
            await VendorService.setPrimaryBookImage(book.bookId, imageId);
            await refreshBook();
            setSuccess("Cover image updated.");
        } catch (err: unknown) {
            setError(getErrorMessage(err, "Failed to set cover image."));
        } finally {
            setBusyImageId(null);
        }
    };

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                <label className="form-label fw-semibold small mb-0">
                    Gallery Images
                    <span className="text-muted fw-normal ms-2">
                        {images.length}/{MAX_IMAGES}
                    </span>
                </label>
                <small className="text-muted">
                    First image or the one marked as cover is used on cards.
                </small>
            </div>

            {error && (
                <div className="alert alert-danger py-2 small mb-2" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success py-2 small mb-2" role="status">
                    <i className="bi bi-check-circle me-2"></i>
                    {success}
                </div>
            )}

            <div className="row g-2">
                {images.map((image, index) => {
                    const busy = busyImageId === image.bookImageId;
                    return (
                        <div key={image.bookImageId} className="col-6 col-sm-4 col-md-3">
                            <div className="border rounded-3 overflow-hidden bg-white h-100 d-flex flex-column">
                                <div className="position-relative bg-light" style={{ aspectRatio: "3 / 4" }}>
                                    <img
                                        src={image.imageUrl}
                                        alt={`${book.title} gallery image ${index + 1}`}
                                        className="w-100 h-100"
                                        style={{ objectFit: "cover" }}
                                    />
                                    {image.isPrimary && (
                                        <span
                                            className="badge bg-success position-absolute"
                                            style={{ top: "6px", left: "6px", fontSize: "10px" }}
                                        >
                                            Cover
                                        </span>
                                    )}
                                    {busy && (
                                        <div
                                            className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                                            style={{ background: "rgba(255,255,255,0.72)" }}
                                        >
                                            <span className="spinner-border spinner-border-sm text-primary" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-1 d-flex gap-1">
                                    {!image.isPrimary && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm flex-fill py-0"
                                            style={{ fontSize: "11px" }}
                                            onClick={() => handleSetPrimary(image.bookImageId)}
                                            disabled={busy || uploading}
                                            aria-label={`Set image ${index + 1} as cover`}
                                            title="Set as cover"
                                        >
                                            <i className="bi bi-star me-1"></i>Cover
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={`btn btn-outline-danger btn-sm py-0 ${image.isPrimary ? "flex-fill" : ""}`}
                                        style={{ fontSize: "11px" }}
                                        onClick={() => handleDelete(image.bookImageId)}
                                        disabled={busy || uploading}
                                        aria-label={`Delete image ${index + 1}`}
                                        title="Delete image"
                                    >
                                        <i className="bi bi-trash3 me-1"></i>Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {remaining > 0 && (
                    <div className="col-6 col-sm-4 col-md-3">
                        <button
                            type="button"
                            className="btn btn-outline-primary w-100 h-100 d-flex flex-column align-items-center justify-content-center gap-1 rounded-3 py-4"
                            style={{ borderStyle: "dashed", minHeight: "150px" }}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            aria-label="Add gallery images"
                        >
                            {uploading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" />
                                    <span style={{ fontSize: "11px" }}>{uploadProgress}</span>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cloud-arrow-up fs-4"></i>
                                    <span className="fw-semibold" style={{ fontSize: "12px" }}>Add images</span>
                                    <span className="text-muted" style={{ fontSize: "10px" }}>
                                        JPG, PNG, WEBP, GIF · max 5 MB
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {images.length === 0 && !uploading && (
                <p className="text-muted small mb-0 mt-2">
                    <i className="bi bi-info-circle me-1"></i>
                    No gallery images yet. The cover image URL below will be used until you upload one.
                </p>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                multiple
                className="d-none"
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
            />
        </div>
    );
}
