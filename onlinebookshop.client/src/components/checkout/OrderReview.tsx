// =============================================
// OrderReview.tsx — 
// =============================================

import type { CartItemResponseDto } from "../../types/cart.types";
import type { AddressResponseDto } from "../../types/address.types";

interface Props {
    items: CartItemResponseDto[];
    selectedAddress: AddressResponseDto | null;
    totalAmount: number;
    deliveryCharge: number;
    placing: boolean;
    onPlaceOrder: () => void;
    onBack: () => void;
}

export default function OrderReview({
    items,
    selectedAddress,
    totalAmount,
    deliveryCharge,
    placing,
    onPlaceOrder,
    onBack,
}: Props) {
    const grandTotal = totalAmount + deliveryCharge;

    return (
        <div>
            <h6 className="fw-bold mb-3">
                <span className="badge bg-primary rounded-circle me-2">2</span>
                Review Your Order
            </h6>

            {/* Delivery Address Summary */}
            {selectedAddress && (
                <div className="alert alert-light border d-flex align-items-start gap-3 mb-4">
                    <i className="bi bi-geo-alt-fill text-primary fs-5 mt-1"></i>
                    <div>
                        <strong className="d-block small">Delivering to:</strong>
                        <span className="text-muted small">
                            {selectedAddress.street}, {selectedAddress.city}
                            {selectedAddress.stateOrDivision ? `, ${selectedAddress.stateOrDivision}` : ""}
                            {selectedAddress.postalCode ? ` - ${selectedAddress.postalCode}` : ""}
                            , {selectedAddress.country}
                        </span>
                    </div>
                    <button className="btn btn-link btn-sm ms-auto p-0 text-decoration-none" onClick={onBack}>
                        Change
                    </button>
                </div>
            )}

            {/* Items List */}
            <div className="card border-0 bg-light rounded-3 mb-4">
                <div className="card-body p-3">
                    <h6 className="fw-semibold mb-3 small text-uppercase text-muted">
                        Items ({items.length})
                    </h6>
                    {items.map((item) => (
                        <div key={item.cartItemId} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom last-child-no-border">
                            <img
                                src={item.imageUrl || "https://placehold.co/50x65?text=Book"}
                                alt={item.bookTitle}
                                className="rounded"
                                style={{ width: "45px", height: "58px", objectFit: "cover" }}
                                onError={(e) => (e.currentTarget.src = "https://placehold.co/50x65?text=Book")}
                            />
                            <div className="flex-fill">
                                <p className="mb-0 fw-semibold small text-truncate" style={{ maxWidth: "200px" }}>
                                    {item.bookTitle}
                                </p>
                                <small className="text-muted">
                                    ৳ {item.bookPrice.toFixed(2)} × {item.quantity}
                                </small>
                            </div>
                            <span className="fw-bold small">৳ {item.subtotal.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price Summary */}
            <div className="card border-0 shadow-sm rounded-3 mb-4">
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between mb-2 small">
                        <span className="text-muted">Subtotal</span>
                        <span>৳ {totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2 small">
                        <span className="text-muted">Delivery</span>
                        {deliveryCharge === 0
                            ? <span className="text-success fw-semibold">FREE</span>
                            : <span>৳ {deliveryCharge.toFixed(2)}</span>
                        }
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between fw-bold">
                        <span>Grand Total</span>
                        <span className="text-success fs-5">৳ {grandTotal.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <div className="alert alert-success d-flex align-items-center gap-3 mb-4">
                <i className="bi bi-cash-stack fs-4"></i>
                <div>
                    <strong className="d-block">Cash on Delivery (COD)</strong>
                    <small className="text-muted">Pay when your order arrives at your door</small>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-2">
                <button
                    className="btn btn-outline-secondary"
                    onClick={onBack}
                    disabled={placing}
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Back
                </button>
                <button
                    className="btn btn-success flex-fill fw-bold py-2"
                    onClick={onPlaceOrder}
                    disabled={placing || !selectedAddress}
                >
                    {placing ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Placing Order...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-bag-check me-2"></i>
                            Place Order — ৳ {grandTotal.toFixed(2)}
                        </>
                    )}
                </button>
            </div>

            {!selectedAddress && (
                <p className="text-danger small mt-2 text-center">
                    <i className="bi bi-exclamation-circle me-1"></i>
                    Please select a delivery address first.
                </p>
            )}
        </div>
    );
}