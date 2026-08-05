// =============================================
// ReviewSection.tsx — Book reviews + add review
// =============================================

import { useState } from "react";
import axios from "axios";
import ReviewService from "../../services/review.service";
import AuthService from "../../services/auth.service";
import type { ReviewResponseDto } from "../../types/review.types";

interface Props {
    bookId: number;
    reviews: ReviewResponseDto[];
    onReviewAdded: (review: ReviewResponseDto) => void;
    onReviewDeleted: (reviewId: number) => void;
}

// ── Star Rating Component ──
function StarRating({
    rating,
    onRate,
    readonly = false,
}: {
    rating: number;
    onRate?: (r: number) => void;
    readonly?: boolean;
}) {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="d-flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <i
                    key={star}
                    className={`bi ${star <= (readonly ? rating : hovered || rating)
                            ? "bi-star-fill text-warning"
                            : "bi-star text-muted"
                        }`}
                    style={{
                        fontSize: readonly ? "14px" : "22px",
                        cursor: readonly ? "default" : "pointer",
                        transition: "transform 0.1s",
                    }}
                    onClick={() => !readonly && onRate?.(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                />
            ))}
        </div>
    );
}

// ── Average rating display ──
function RatingSummary({ reviews }: { reviews: ReviewResponseDto[] }) {
    if (reviews.length === 0) return null;

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const counts = [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: reviews.filter((r) => r.rating === star).length,
    }));

    return (
        <div className="card border-0 bg-light rounded-3 p-4 mb-4">
            <div className="row align-items-center g-4">

                {/* Average */}
                <div className="col-auto text-center">
                    <div className="display-4 fw-bold text-warning">{avg.toFixed(1)}</div>
                    <StarRating rating={Math.round(avg)} readonly />
                    <small className="text-muted">{reviews.length} reviews</small>
                </div>

                {/* Bar chart */}
                <div className="col">
                    {counts.map(({ star, count }) => (
                        <div key={star} className="d-flex align-items-center gap-2 mb-1">
                            <small className="text-muted" style={{ width: "12px" }}>{star}</small>
                            <i className="bi bi-star-fill text-warning" style={{ fontSize: "11px" }}></i>
                            <div className="flex-fill bg-white rounded" style={{ height: "8px" }}>
                                <div
                                    className="bg-warning rounded"
                                    style={{
                                        height: "100%",
                                        width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%`,
                                        transition: "width 0.5s",
                                    }}
                                />
                            </div>
                            <small className="text-muted" style={{ width: "20px" }}>{count}</small>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ── Single Review Card ──
function ReviewCard({
    review,
    onDelete,
    deleting,
}: {
    review: ReviewResponseDto;
    onDelete: (reviewId: number) => void;
    deleting: number | null;
}) {
    const currentUser = AuthService.getCurrentUser();
    const isOwner = currentUser?.userId === review.userId;

    return (
        <div className="card border-0 shadow-sm rounded-3 mb-3">
            <div className="card-body p-3">
                <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <div
                            className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                            style={{ width: "38px", height: "38px", fontSize: "15px" }}
                        >
                            {review.userName?.charAt(0)?.toUpperCase() ?? "U"}
                        </div>
                        <div>
                            <p className="fw-semibold mb-0 small">{review.userName}</p>
                            <small className="text-muted">
                                {new Date(review.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}
                            </small>
                        </div>
                    </div>

                    {isOwner && (
                        <button
                            className="btn btn-outline-danger btn-sm py-0 px-2"
                            onClick={() => onDelete(review.reviewId)}
                            disabled={deleting === review.reviewId}
                        >
                            {deleting === review.reviewId ? (
                                <span className="spinner-border spinner-border-sm" />
                            ) : (
                                <i className="bi bi-trash3" style={{ fontSize: "12px" }}></i>
                            )}
                        </button>
                    )}
                </div>

                <StarRating rating={review.rating} readonly />

                {review.comment && (
                    <p className="mb-0 mt-2 small text-dark">{review.comment}</p>
                )}
            </div>
        </div>
    );
}

// =============================================
// MAIN COMPONENT
// =============================================
export default function ReviewSection({
    bookId,
    reviews,
    onReviewAdded,
    onReviewDeleted,
}: Props) {
    const currentUser = AuthService.getCurrentUser();
    const isLoggedIn = AuthService.isAuthenticated();
    const hasReviewed = reviews.some((r) => r.userId === currentUser?.userId);

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [deleting, setDeleting] = useState<number | null>(null);

    const handleSubmit = async () => {
        if (rating === 0) {
            setSubmitError("Please select a rating.");
            return;
        }
        setSubmitting(true);
        setSubmitError("");
        try {
            const review = await ReviewService.create({
                bookId,
                rating,
                comment: comment.trim() || undefined,
            });
            onReviewAdded(review);
            setRating(0);
            setComment("");
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setSubmitError(err.response?.data?.message || "Failed to submit review.");
            } else {
                setSubmitError("Something went wrong.");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (reviewId: number) => {
        if (!window.confirm("Delete this review?")) return;
        setDeleting(reviewId);
        try {
            await ReviewService.delete(reviewId);
            onReviewDeleted(reviewId);
        } catch {
            // ignore
        } finally {
            setDeleting(null);
        }
    };

    return (
        <div>
            <h5 className="fw-bold mb-4">
                <i className="bi bi-star me-2 text-warning"></i>
                Reviews & Ratings
            </h5>

            {/* Rating Summary */}
            <RatingSummary reviews={reviews} />

            {/* Add Review Form */}
            {isLoggedIn && !hasReviewed && (
                <div className="card border-0 shadow-sm rounded-3 mb-4">
                    <div className="card-header bg-white border-0 pt-3 pb-0">
                        <h6 className="fw-bold mb-0">Write a Review</h6>
                    </div>
                    <div className="card-body">
                        {submitError && (
                            <div className="alert alert-danger py-2 small">{submitError}</div>
                        )}

                        {/* Star selector */}
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">Your Rating *</label>
                            <div>
                                <StarRating rating={rating} onRate={setRating} />
                                {rating > 0 && (
                                    <small className="text-muted ms-1">
                                        {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                                    </small>
                                )}
                            </div>
                        </div>

                        {/* Comment */}
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">
                                Comment <span className="text-muted fw-normal">(optional)</span>
                            </label>
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Share your thoughts about this book..."
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={1000}
                                disabled={submitting}
                            />
                            <small className="text-muted">{comment.length}/1000</small>
                        </div>

                        <button
                            className="btn btn-primary fw-semibold"
                            onClick={handleSubmit}
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? (
                                <><span className="spinner-border spinner-border-sm me-2" />Submitting...</>
                            ) : (
                                <><i className="bi bi-send me-2"></i>Submit Review</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Already reviewed */}
            {isLoggedIn && hasReviewed && (
                <div className="alert alert-success d-flex align-items-center gap-2 mb-4">
                    <i className="bi bi-check-circle-fill"></i>
                    You have already reviewed this book.
                </div>
            )}

            {/* Not logged in */}
            {!isLoggedIn && (
                <div className="alert alert-light border mb-4 d-flex align-items-center gap-2">
                    <i className="bi bi-person-circle text-primary fs-5"></i>
                    <span>
                        <a href="/auth" className="text-decoration-none fw-semibold">Sign in</a>
                        {" "}to write a review.
                    </span>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    <i className="bi bi-chat-square-text fs-2 d-block mb-2 opacity-25"></i>
                    No reviews yet. Be the first to review!
                </div>
            ) : (
                reviews.map((review) => (
                    <ReviewCard
                        key={review.reviewId}
                        review={review}
                        onDelete={handleDelete}
                        deleting={deleting}
                    />
                ))
            )}
        </div>
    );
}