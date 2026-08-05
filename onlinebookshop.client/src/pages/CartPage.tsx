// =============================================
// CartPage.tsx
// =============================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import CartItemComponent from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import CartService from "../services/cart.service";
import type { CartResponseDto } from "../types/cart.types";

export default function CartPage() {
    const [cart, setCart] = useState<CartResponseDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [clearing, setClearing] = useState(false);

    // ── Fetch Cart (শুধু প্রথমবার / manual retry এর জন্য loading spinner দেখাবে) ──
    const fetchCart = async (showSpinner = false) => {
        if (showSpinner) setLoading(true);
        setError("");
        try {
            const data = await CartService.getMyCart();
            setCart(data);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "There is problem to loading cart.");
            } else {
                setError("Something went wrong.");
            }
        } finally {
            if (showSpinner) setLoading(false);
        }
    };

    useEffect(() => { fetchCart(true); }, []);

    // ── Quantity Update (Optimistic) ──
    const handleQuantityChange = async (bookId: number, quantity: number) => {
        if (!cart) return;

        // আগের state রাখো, error হলে rollback করার জন্য
        const prevCart = cart;

        // সাথে সাথে UI update করে দাও, spinner ছাড়াই
        const updatedItems = cart.items.map((item) =>
            item.bookId === bookId
                ? { ...item, quantity, subtotal: item.bookPrice * quantity }
                : item
        );
        const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
        setCart({ ...cart, items: updatedItems, totalAmount: newTotal });

        try {
            await CartService.updateItem({ bookId, quantity });
            // background এ silently sync করে নাও (server-calculated total এর জন্য), spinner ছাড়া
            fetchCart(false);
        } catch {
            setCart(prevCart); // fail করলে আগের state এ ফিরিয়ে দাও
        }
    };

    // ── Remove Item (Optimistic) ──
    const handleRemove = async (bookId: number) => {
        if (!cart) return;
        const prevCart = cart;

        const updatedItems = cart.items.filter((item) => item.bookId !== bookId);
        const newTotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);
        setCart({ ...cart, items: updatedItems, totalAmount: newTotal });

        try {
            await CartService.removeItem(bookId);
            fetchCart(false);
        } catch {
            setCart(prevCart);
        }
    };

    // ── Clear Cart ──
    const handleClearCart = async () => {
        if (!window.confirm("Do you want remove items ?")) return;
        setClearing(true);
        try {
            await CartService.clearCart();
            await fetchCart(false);
        } catch {
            fetchCart(false);
        } finally {
            setClearing(false);
        }
    };

    const itemCount = cart?.items.length ?? 0;

  return (
    <>
      <Navbar />

      <div className="bg-light min-vh-100 py-4">
        <div className="container">

          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <h4 className="fw-bold mb-0">
              <i className="bi bi-cart3 me-2 text-primary"></i>
              My Cart
            </h4>
            {!loading && itemCount > 0 && (
              <span className="badge bg-primary rounded-pill">{itemCount} items</span>
            )}
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} />
              <p className="text-muted mt-3">Loading your cart...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="alert alert-danger d-flex align-items-center gap-2">
              <i className="bi bi-exclamation-triangle-fill"></i>
              {error}
                          <button className="btn btn-link btn-sm ms-auto p-0" onClick={() => fetchCart(true)}>
                              Retry
                          </button>
            </div>
          )}

          {/* Empty Cart */}
          {!loading && !error && itemCount === 0 && (
            <div className="text-center py-5">
              <div style={{ fontSize: "80px" }}>🛒</div>
              <h5 className="mt-3 fw-bold">Your cart is empty</h5>
              <p className="text-muted">Add to cart by browse books. </p>
              <Link to="/" className="btn btn-primary px-4">
                <i className="bi bi-book me-2"></i>Browse Books
              </Link>
            </div>
          )}

          {/* Cart Content */}
          {!loading && !error && cart && itemCount > 0 && (
            <div className="row g-4">

              {/* Items */}
              <div className="col-lg-8">
                {cart.items.map((item) => (
                  <CartItemComponent
                    key={item.cartItemId}
                    item={item}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemove}
                  />
                ))}
              </div>

              {/* Summary */}
              <div className="col-lg-4">
                <CartSummary
                  totalAmount={cart.totalAmount}
                  itemCount={itemCount}
                  onClearCart={handleClearCart}
                  clearing={clearing}
                />
              </div>

            </div>
          )}

        </div>
      </div>
    </>
  );
}