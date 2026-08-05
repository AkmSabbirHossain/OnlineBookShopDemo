// =============================================
// CartSummary.tsx — Price breakdown sidebar
// =============================================

import { useNavigate } from "react-router-dom";

interface Props {
    totalAmount: number;
    itemCount: number;
    onClearCart: () => void;
    clearing: boolean;
}

const DELIVERY_CHARGE = 60;
const FREE_DELIVERY_THRESHOLD = 500;

export default function CartSummary({ totalAmount, itemCount, onClearCart, clearing }: Props) {
    const navigate = useNavigate();
    const isFreeDelivery = totalAmount >= FREE_DELIVERY_THRESHOLD;
    const deliveryCharge = isFreeDelivery ? 0 : DELIVERY_CHARGE;
    const grandTotal = totalAmount + deliveryCharge;

    return (
        <div className="card border-0 shadow-sm rounded-3 sticky-top" style={{ top: "80px" }}>
            <div className="card-header bg-dark text-white rounded-top-3 py-3">
                <h6 className="mb-0 fw-bold">
                    <i className="bi bi-receipt me-2"></i>
                    Order Summary
                </h6>
            </div>

            <div className="card-body p-4">

                {/* Price Breakdown */}
                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Subtotal ({itemCount} items)</span>
                    <span className="fw-semibold">৳ {totalAmount.toFixed(2)}</span>
                </div>

                <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Delivery Charge</span>
                    {isFreeDelivery ? (
                        <span className="text-success fw-semibold">FREE</span>
                    ) : (
                        <span className="fw-semibold">৳ {DELIVERY_CHARGE.toFixed(2)}</span>
                    )}
                </div>

                {/* Free delivery progress */}
                {!isFreeDelivery && (
                    <div className="mb-3">
                        <div className="progress" style={{ height: "5px" }}>
                            <div
                                className="progress-bar bg-success"
                                style={{ width: `${Math.min((totalAmount / FREE_DELIVERY_THRESHOLD) * 100, 100)}%` }}
                            />
                        </div>
                        <small className="text-muted d-block mt-1">
                            Add ৳ {(FREE_DELIVERY_THRESHOLD - totalAmount).toFixed(2)} more for free delivery
                        </small>
                    </div>
                )}

                <hr />

                {/* Grand Total */}
                <div className="d-flex justify-content-between mb-4">
                    <span className="fw-bold fs-5">Total</span>
                    <span className="fw-bold fs-5 text-success">৳ {grandTotal.toFixed(2)}</span>
                </div>

                {/* COD Badge */}
                <div className="alert alert-light border d-flex align-items-center gap-2 py-2 mb-4">
                    <i className="bi bi-cash-coin text-success fs-5"></i>
                    <div>
                        <small className="fw-semibold d-block">Cash on Delivery</small>
                        <small className="text-muted">Pay when you receive</small>
                    </div>
                </div>

                {/* Proceed to Checkout */}
                <button
                    className="btn btn-success w-100 py-2 fw-bold mb-2"
                    onClick={() => navigate("/checkout")}
                    disabled={itemCount === 0}
                >
                    <i className="bi bi-shield-lock me-2"></i>
                    Proceed to Checkout
                </button>

                {/* Continue Shopping */}
                <button
                    className="btn btn-outline-secondary w-100 btn-sm mb-3"
                    onClick={() => navigate("/")}
                >
                    <i className="bi bi-arrow-left me-1"></i>
                    Continue Shopping
                </button>

                {/* Clear Cart */}
                {itemCount > 0 && (
                    <button
                        className="btn btn-link text-danger btn-sm w-100"
                        onClick={onClearCart}
                        disabled={clearing}
                    >
                        {clearing
                            ? <><span className="spinner-border spinner-border-sm me-1" />Clearing...</>
                            : <><i className="bi bi-trash3 me-1"></i>Clear Cart</>
                        }
                    </button>
                )}
            </div>
        </div>
    );
}