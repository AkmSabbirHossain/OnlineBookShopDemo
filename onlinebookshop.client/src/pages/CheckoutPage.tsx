// =============================================
// CheckoutPage.tsx
// =============================================

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import AddressSelector from "../components/checkout/AddressSelector";
import OrderReview from "../components/checkout/OrderReview";
import CartService from "../services/cart.service";
import AddressService from "../services/address.service";
import OrderService from "../services/order.service";
import AuthService from "../services/auth.service";
import type { CartResponseDto } from "../types/cart.types";
import type { AddressResponseDto } from "../types/address.types";
import type { OrderResponseDto } from "../types/order.types";

type Step = "address" | "review" | "success";

const DELIVERY_CHARGE = 60;
const FREE_DELIVERY_THRESHOLD = 500;

export default function CheckoutPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("address");
  const [cart, setCart] = useState<CartResponseDto | null>(null);
  const [addresses, setAddresses] = useState<AddressResponseDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [placedOrder, setPlacedOrder] = useState<OrderResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

  // ── Current user role ──
  const user = AuthService.getCurrentUser();
  const isCustomer = user?.role === "Customer" || user?.role === "Admin";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const [cartData, addressData] = await Promise.all([
          CartService.getMyCart(),
          AddressService.getMyAddresses(),
        ]);

        setCart(cartData);
        setAddresses(addressData);

        // Default address auto select
        const defaultAddr = addressData.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.addressId);
        else if (addressData.length > 0) setSelectedAddressId(addressData[0].addressId);

        // Redirect for Empty cart
        if (cartData.items.length === 0) navigate("/cart");

      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "There is problem to loading data  ");
        } else {
          setError("Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // ── Place Order ──
  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !cart) return;
    setPlacing(true);
    setError("");
    try {
        const order = await OrderService.placeOrder({
            addressId: selectedAddressId,
            items: cart.items.map((i) => ({ bookId: i.bookId, quantity: i.quantity })),
        });

        // ── If Order success  cart will be clear  
        await CartService.clearCart();
        window.dispatchEvent(new Event("cartUpdated"));

        setPlacedOrder(order);
        setStep("success");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "There is problem to place order ");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setPlacing(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.addressId === selectedAddressId) ?? null;
  const isFreeDelivery = (cart?.totalAmount ?? 0) >= FREE_DELIVERY_THRESHOLD;
  const deliveryCharge = isFreeDelivery ? 0 : DELIVERY_CHARGE;

  const steps = [
    { key: "address", label: "Address", icon: "bi-geo-alt" },
    { key: "review", label: "Review", icon: "bi-list-check" },
    { key: "success", label: "Done", icon: "bi-check-circle" },
  ];

  return (
    <>
      <Navbar />

      <div className="bg-light min-vh-100 py-4">
        <div className="container" style={{ maxWidth: "860px" }}>

          <h4 className="fw-bold mb-4">
            <i className="bi bi-bag-check me-2 text-success"></i>
            Checkout
          </h4>

          {/* ── Role Warning: Vendor checkout  ── */}
          {!isCustomer && user?.role === "Vendor" && (
            <div className="alert alert-warning d-flex align-items-center gap-3 mb-4">
              <i className="bi bi-exclamation-triangle-fill fs-5"></i>
              <div>
                <strong>Can not be order by using vendor account </strong>
                <p className="mb-0 small text-muted">
                  Use Customer account for order
                </p>
              </div>
            </div>
          )}

          {/* Step Indicator */}
          {step !== "success" && (
            <div className="d-flex align-items-center justify-content-center mb-4 gap-0">
              {steps.filter((s) => s.key !== "success").map((s, i) => (
                <div key={s.key} className="d-flex align-items-center">
                  <div className="d-flex flex-column align-items-center">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                      style={{
                        width: "38px", height: "38px", fontSize: "15px",
                        background: step === s.key
                          ? "var(--bs-primary)"
                          : step === "review" && s.key === "address"
                          ? "var(--bs-success)" : "#dee2e6",
                        color: step === s.key || (step === "review" && s.key === "address")
                          ? "white" : "#6c757d",
                        transition: "all 0.3s",
                      }}
                    >
                      {step === "review" && s.key === "address"
                        ? <i className="bi bi-check-lg"></i>
                        : <i className={`bi ${s.icon}`}></i>
                      }
                    </div>
                    <small
                      className={`mt-1 ${step === s.key ? "fw-bold text-primary" : "text-muted"}`}
                      style={{ fontSize: "11px" }}
                    >
                      {s.label}
                    </small>
                  </div>
                  {i < 1 && (
                    <div className="mx-2 mb-3" style={{
                      width: "80px", height: "2px",
                      background: step === "review" ? "var(--bs-success)" : "#dee2e6",
                      transition: "background 0.3s",
                    }} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
              <p className="text-muted mt-3">Loading checkout...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert alert-danger d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-exclamation-triangle-fill"></i>
              {error}
              <button className="btn btn-link btn-sm ms-auto p-0" onClick={() => setError("")}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          )}

          {/* ── STEP 1: Address ── */}
          {!loading && step === "address" && (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4">

                {/* Address create sudhu Customer/Admin korte parbe */}
                {!isCustomer && (
                  <div className="alert alert-info d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-info-circle-fill"></i>
                    <span>
                      Customer account needed to adding address
                      Backend  <code>AddressController</code> এর POST endpoint এ
                      <code> [Authorize(Roles = "Customer,Admin")]</code>
                    </span>
                  </div>
                )}

                <AddressSelector
                  addresses={addresses}
                  selectedAddressId={selectedAddressId}
                  onSelect={setSelectedAddressId}
                  onAddressAdded={(addr) => setAddresses((prev) => [...prev, addr])}
                  canCreate={isCustomer} 
                />
                <hr className="mt-4" />
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-primary fw-bold px-4"
                    onClick={() => setStep("review")}
                    disabled={!selectedAddressId}
                  >
                    Continue to Review
                    <i className="bi bi-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Review ── */}
          {!loading && step === "review" && cart && (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-4">
                <OrderReview
                  items={cart.items}
                  selectedAddress={selectedAddress}
                  totalAmount={cart.totalAmount}
                  deliveryCharge={deliveryCharge}
                  placing={placing}
                  onPlaceOrder={handlePlaceOrder}
                  onBack={() => setStep("address")}
                />
              </div>
            </div>
          )}

          {/* ── STEP 3: Success ── */}
          {step === "success" && placedOrder && (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-body p-5 text-center">
                <div
                  className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4"
                  style={{ width: "100px", height: "100px" }}
                >
                  <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "50px" }}></i>
                </div>
                <h4 className="fw-bold mb-2">Order Placed Successfully!</h4>
                <p className="text-muted mb-4">
                  Your is confirm order .। Delivery will be soon
                </p>
                <div className="card bg-light border-0 rounded-3 mb-4 mx-auto" style={{ maxWidth: "320px" }}>
                  <div className="card-body py-3">
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Order ID</span>
                      <strong>#{placedOrder.orderId}</strong>
                    </div>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted">Total</span>
                      <strong className="text-success">
                        ৳ {(placedOrder.totalAmount + deliveryCharge).toFixed(2)}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between small">
                      <span className="text-muted">Payment</span>
                      <span className="badge bg-warning text-dark">Cash on Delivery</span>
                    </div>
                  </div>
                </div>
                <div className="d-flex gap-3 justify-content-center">
                  <Link to="/orders" className="btn btn-primary px-4">
                    <i className="bi bi-bag me-2"></i>My Orders
                  </Link>
                  <Link to="/" className="btn btn-outline-secondary px-4">
                    <i className="bi bi-house me-2"></i>Home
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}