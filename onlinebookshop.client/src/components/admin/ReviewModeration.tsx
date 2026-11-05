// =============================================
// ReviewModeration.tsx — Approve or hide customer reviews
// =============================================

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ReviewService from "../../services/review.service";
import type { ReviewModerationDto, ReviewStatus } from "../../types/review.types";

type Filter = "Pending" | "Approved" | "Hidden" | "All";

const FILTERS: Filter[] = ["Pending", "Approved", "Hidden", "All"];

const STATUS_BADGE: Record<ReviewStatus, string> = {
    Pending: "bg-warning text-dark",
    Approved: "bg-success",
    Hidden: "bg-secondary",
};

function Stars({ rating }: { rating: number }) {
    return (
        <span className="text-warning" aria-label={`${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <i
                    key={star}
                    className={`bi ${star <= rating ? "bi-star-fill" : "bi-star"}`}
                    style={{ fontSize: "12px" }}
                ></i>
            ))}
        </span>
    );
}

export default function ReviewModeration() {
    const [reviews, setReviews] = useState<ReviewModerationDto[]>([]);
    const [filter, setFilter] = useState<Filter>("Pending");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setReviews(await ReviewService.getForAdmin());
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "There was a problem loading reviews.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const counts = useMemo(
        () => ({
            Pending: reviews.filter((r) => r.status === "Pending").length,
            Approved: reviews.filter((r) => r.status === "Approved").length,
            Hidden: reviews.filter((r) => r.status === "Hidden").length,
            All: reviews.length,
        }),
        [reviews]
    );

    const visible = useMemo(
        () => (filter === "All" ? reviews : reviews.filter((r) => r.status === filter)),
        [reviews, filter]
    );

    const handleSetStatus = async (review: ReviewModerationDto, status: ReviewStatus) => {
        setProcessingId(review.reviewId);
        setError("");
        try {
            const updated = await ReviewService.setStatus(review.reviewId, status);
            setReviews((prev) =>
                prev.map((r) => (r.reviewId === updated.reviewId ? updated : r))
            );
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to update this review.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3 d-flex flex-wrap align-items-center gap-2">
                <h6 className="fw-bold mb-0 me-auto">
                    <i className="bi bi-chat-square-text me-2 text-warning"></i>
                    Review Moderation
                </h6>
                {FILTERS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        className={`btn btn-sm ${filter === key ? "btn-dark" : "btn-outline-secondary"}`}
                        onClick={() => setFilter(key)}
                    >
                        {key}
                        <span
                            className={`badge ms-1 ${
                                key === "Pending" && counts.Pending > 0 ? "bg-danger" : "bg-light text-dark"
                            }`}
                        >
                            {counts[key]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="card-body">
                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2 py-2 small">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {error}
                        <button
                            type="button"
                            className="btn btn-link btn-sm ms-auto p-0"
                            onClick={fetchReviews}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-warning" />
                        <p className="text-muted small mt-2 mb-0">Loading reviews…</p>
                    </div>
                ) : visible.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <i className="bi bi-check2-circle fs-2 d-block mb-2 opacity-25"></i>
                        {filter === "Pending"
                            ? "No reviews waiting for approval."
                            : "No reviews in this list."}
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {visible.map((review) => (
                            <div key={review.reviewId} className="border rounded-3 p-3">
                                <div className="d-flex flex-wrap align-items-start gap-2 mb-2">
                                    <div className="me-auto">
                                        <div className="d-flex align-items-center flex-wrap gap-2">
                                            <strong className="small">{review.userName}</strong>
                                            <span className={`badge ${STATUS_BADGE[review.status]}`}>
                                                {review.status}
                                            </span>
                                            {review.isVerifiedPurchase && (
                                                <span className="badge bg-success-subtle text-success-emphasis">
                                                    <i className="bi bi-patch-check-fill me-1"></i>
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center flex-wrap gap-2 mt-1 text-muted small">
                                            <Stars rating={review.rating} />
                                            <span>
                                                on{" "}
                                                <a
                                                    href={`/books/${review.bookId}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-decoration-none"
                                                >
                                                    {review.bookTitle}
                                                </a>
                                            </span>
                                            <span>
                                                ·{" "}
                                                {new Date(review.createdAt).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="d-flex gap-1 flex-shrink-0">
                                        {review.status !== "Approved" && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-success"
                                                onClick={() => handleSetStatus(review, "Approved")}
                                                disabled={processingId === review.reviewId}
                                            >
                                                {processingId === review.reviewId ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : (
                                                    <>
                                                        <i className="bi bi-check-lg me-1"></i>
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {review.status !== "Hidden" && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => handleSetStatus(review, "Hidden")}
                                                disabled={processingId === review.reviewId}
                                            >
                                                <i className="bi bi-eye-slash me-1"></i>
                                                Hide
                                            </button>
                                        )}
                                        {review.status === "Hidden" && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-warning"
                                                onClick={() => handleSetStatus(review, "Pending")}
                                                disabled={processingId === review.reviewId}
                                            >
                                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                                Re-queue
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {review.comment ? (
                                    <p className="mb-0 small text-dark">{review.comment}</p>
                                ) : (
                                    <p className="mb-0 small text-muted fst-italic">
                                        No written comment.
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
