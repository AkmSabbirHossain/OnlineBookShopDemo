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

const PLACEHOLDER_IMG = "https://placehold.co/200x260/f1f5f9/94a3b8?text=Book";
const MAX_QUANTITY = 100;
const currency = new Intl.NumberFormat("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function CartItem({ item, onQuantityChange, onRemove }: Props) {
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1 || newQty > MAX_QUANTITY) return;
    setUpdating(true);
    try {
      await onQuantityChange(item.bookId, newQty);
    } finally {
      setUpdating(false);
    }
  };

  const handleQtyInput = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) return;
    handleQtyChange(Math.min(MAX_QUANTITY, Math.max(1, parsed)));
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(item.bookId);
    } finally {
      setRemoving(false);
    }
  };

  const busy = updating || removing;

  return (
    <article className={`cp-item${busy ? " is-updating" : ""}`} aria-busy={busy}>
      <div className="cp-thumb">
        <img
          src={item.imageUrl || PLACEHOLDER_IMG}
          alt={item.bookTitle}
          loading="lazy"
          onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
        />
      </div>

      <div className="cp-info">
        <Link to={`/books/${item.bookId}`} className="cp-item-title">
          {item.bookTitle}
        </Link>
        <div className="cp-unit">
          Unit price <b>৳ {currency.format(item.bookPrice)}</b>
        </div>
        {busy && (
          <span className="cp-updating" role="status">
            <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
            {removing ? "Removing…" : "Updating…"}
          </span>
        )}
      </div>

      <div className="cp-buy-row">
        <div className="cp-qty" role="group" aria-label={`Quantity for ${item.bookTitle}`}>
          <button
            type="button"
            className="cp-qty-btn"
            onClick={() => handleQtyChange(item.quantity - 1)}
            disabled={busy || item.quantity <= 1}
            aria-label={`Decrease quantity of ${item.bookTitle}`}
          >
            <i className="bi bi-dash" aria-hidden="true"></i>
          </button>
          <input
            type="number"
            className="cp-qty-input"
            value={item.quantity}
            min={1}
            max={MAX_QUANTITY}
            onChange={(e) => handleQtyInput(e.target.value)}
            disabled={busy}
            aria-label={`Quantity of ${item.bookTitle}`}
          />
          <button
            type="button"
            className="cp-qty-btn"
            onClick={() => handleQtyChange(item.quantity + 1)}
            disabled={busy || item.quantity >= MAX_QUANTITY}
            aria-label={`Increase quantity of ${item.bookTitle}`}
          >
            <i className="bi bi-plus" aria-hidden="true"></i>
          </button>
        </div>

        <div className="cp-line-total">
          ৳ {currency.format(item.subtotal)}
          <small>{item.quantity} × ৳ {currency.format(item.bookPrice)}</small>
        </div>
      </div>

      <button
        type="button"
        className="cp-remove"
        onClick={handleRemove}
        disabled={removing || updating}
        title="Remove from cart"
        aria-label={`Remove ${item.bookTitle} from cart`}
      >
        {removing
          ? <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
          : <i className="bi bi-trash3" aria-hidden="true"></i>
        }
      </button>
    </article>
  );
}
