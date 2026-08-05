// ============================
// CartItem.tsx 
// ============================

import { useState } from "react";
import { Link } from "react-router-dom";
import type { CartItemResponseDto } from "../../types/cart.types";

interface Props {
  item: CartItemResponseDto;
  onQuantityChange: (bookId: number, quantity: number) => Promise<void>;
  onRemove: (bookId: number) => Promise<void>;
}

const PLACEHOLDER_IMG = "https://placehold.co/80x100?text=Book";

export default function CartItem({ item, onQuantityChange, onRemove }: Props) {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1 || newQty > 100) return;
    setUpdating(true);
    await onQuantityChange(item.bookId, newQty);
    setUpdating(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    await onRemove(item.bookId); 
    setRemoving(false);
  };

  return (
    <div className="card border-0 shadow-sm rounded-3 mb-3">
      <div className="card-body p-3">
        <div className="row align-items-center g-3">

          {/* Book Image */}
          <div className="col-auto">
            <img
              src={item.imageUrl || PLACEHOLDER_IMG}
              alt={item.bookTitle}
              className="rounded-2"
              style={{ width: "70px", height: "90px", objectFit: "cover" }}
              onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
            />
          </div>

          {/* Book Info */}
          <div className="col">
            <Link
              to={`/books/${item.bookId}`}
              className="fw-bold text-dark text-decoration-none d-block mb-1"
              style={{ fontSize: "15px" }}
            >
              {item.bookTitle}
            </Link>
            <span className="text-success fw-semibold">
              ৳ {item.bookPrice.toFixed(2)} / piece
            </span>
          </div>

          {/* Quantity Control */}
          <div className="col-auto">
            <div className="input-group input-group-sm" style={{ width: "120px" }}>
              <button
                className="btn btn-outline-secondary"
                onClick={() => handleQtyChange(item.quantity - 1)}
                disabled={updating || item.quantity <= 1}
              >
                <i className="bi bi-dash"></i>
              </button>
              <input
                type="number"
                className="form-control text-center"
                value={item.quantity}
                min={1}
                max={100}
                onChange={(e) => handleQtyChange(parseInt(e.target.value) || 1)}
                disabled={updating}
                style={{ fontSize: "14px" }}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={() => handleQtyChange(item.quantity + 1)}
                disabled={updating || item.quantity >= 100}
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>
          </div>

          {/* Subtotal */}
          <div className="col-auto text-end" style={{ minWidth: "90px" }}>
            <div className="fw-bold text-dark">৳ {item.subtotal.toFixed(2)}</div>
            {updating && (
              <small className="text-muted">
                <span className="spinner-border spinner-border-sm me-1" />
                Updating...
              </small>
            )}
          </div>

          {/* Remove */}
          <div className="col-auto">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleRemove}
              disabled={removing}
              title="Remove from cart"
            >
              {removing
                ? <span className="spinner-border spinner-border-sm" />
                : <i className="bi bi-trash3"></i>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}