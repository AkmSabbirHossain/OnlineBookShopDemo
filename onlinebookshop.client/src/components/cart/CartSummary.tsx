// =============================================
// CartSummary.tsx — Price breakdown sidebar
// =============================================

import { useNavigate } from "react-router-dom";
import { DELIVERY_CHARGE, FREE_DELIVERY_THRESHOLD, getDeliveryCharge } from "../../utils/pricing";

interface Props {
    totalAmount: number;
    itemCount: number;
    onClearCart: () => void;
    clearing: boolean;
}

const currency = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CartSummary({ totalAmount, itemCount, onClearCart, clearing }: Props) {
    const navigate = useNavigate();
    const isFreeDelivery = totalAmount >= FREE_DELIVERY_THRESHOLD;
    const deliveryCharge = getDeliveryCharge(totalAmount);
    const grandTotal = totalAmount + deliveryCharge;
    const remainingForFree = Math.max(0, FREE_DELIVERY_THRESHOLD - totalAmount);
    const progress = Math.min(100, Math.round((totalAmount / FREE_DELIVERY_THRESHOLD) * 100));

    return (
        <div className="cp-summary">
            <div className="cp-summary-head">
                <h2>
                    <i className="bi bi-receipt" aria-hidden="true"></i>
                    Order Summary
                </h2>
                <span className="cp-summary-count">
                    {itemCount} item{itemCount !== 1 ? "s" : ""}
                </span>
            </div>

            <div className="cp-summary-body">
                <div className="cp-row">
                    <span>Subtotal</span>
                    <b>৳ {currency.format(totalAmount)}</b>
                </div>

                <div className="cp-row">
                    <span>Delivery charge</span>
                    {isFreeDelivery ? (
                        <b className="cp-free-tag">FREE</b>
                    ) : (
                        <b>৳ {currency.format(DELIVERY_CHARGE)}</b>
                    )}
                </div>

                <div className={`cp-free${isFreeDelivery ? " done" : ""}`}>
                    <div className="cp-free-top">
                        <span>{isFreeDelivery ? "Free delivery unlocked" : "Free delivery progress"}</span>
                        <span>{progress}%</span>
                    </div>
                    <div
                        className="cp-progress"
                        role="progressbar"
                        aria-label="Progress toward free delivery"
                        aria-valuemin={0}
                        aria-valuemax={FREE_DELIVERY_THRESHOLD}
                        aria-valuenow={Math.min(totalAmount, FREE_DELIVERY_THRESHOLD)}
                        aria-valuetext={`${progress}% toward free delivery`}
                    >
                        <span style={{ width: `${progress}%` }}></span>
                    </div>
                    <p className="cp-free-hint">
                        {isFreeDelivery
                            ? "Delivery on this order is on us."
                            : `Add ৳ ${currency.format(remainingForFree)} more to get free delivery.`}
                    </p>
                </div>

                <div className="cp-total-row">
                    <span className="cp-total-label">Total</span>
                    <span className="cp-total-value">৳ {currency.format(grandTotal)}</span>
                </div>

                <div className="cp-cod">
                    <i className="bi bi-cash-coin" aria-hidden="true"></i>
                    <div>
                        <strong>Cash on Delivery</strong>
                        <span>Pay when you receive your order.</span>
                    </div>
                </div>

                {itemCount > 0 && (
                    <p className="cp-free-hint mb-2">
                        <i className="bi bi-ticket-perforated me-1" aria-hidden="true"></i>
                        Have a promo code? Apply it at checkout.
                    </p>
                )}

                <button
                    type="button"
                    className="cp-cta"
                    onClick={() => navigate("/checkout")}
                    disabled={itemCount === 0 || clearing}
                >
                    <i className="bi bi-shield-lock" aria-hidden="true"></i>
                    Proceed to Checkout
                </button>

                <button type="button" className="cp-secondary" onClick={() => navigate("/")}>
                    <i className="bi bi-arrow-left" aria-hidden="true"></i>
                    Continue shopping
                </button>

                {itemCount > 0 && (
                    <button
                        type="button"
                        className="cp-clear"
                        onClick={onClearCart}
                        disabled={clearing}
                    >
                        {clearing ? (
                            <>
                                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                Clearing…
                            </>
                        ) : (
                            <>
                                <i className="bi bi-trash3" aria-hidden="true"></i>
                                Clear cart
                            </>
                        )}
                    </button>
                )}

                <div className="cp-perks">
                    <div className="cp-perk"><i className="bi bi-truck" aria-hidden="true"></i>Fast home delivery</div>
                    <div className="cp-perk"><i className="bi bi-arrow-repeat" aria-hidden="true"></i>Easy returns</div>
                    <div className="cp-perk"><i className="bi bi-shield-check" aria-hidden="true"></i>Secure payment</div>
                </div>
            </div>
        </div>
    );
}
