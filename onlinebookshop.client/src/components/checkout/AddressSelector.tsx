// =============================================
// AddressSelector.tsx 
// =============================================

import { useState } from "react";
import axios from "axios";
import AddressService from "../../services/address.service";
import type { AddressResponseDto, AddressCreateDto } from "../../types/address.types";

interface Props {
  addresses: AddressResponseDto[];
  selectedAddressId: number | null;
  onSelect: (addressId: number) => void;
  onAddressAdded: (address: AddressResponseDto) => void;
  canCreate?: boolean;
}

interface FormErrors {
  street?: string;
  city?: string;
  country?: string;
}

const EMPTY_FORM: AddressCreateDto = {
  street: "",
  city: "",
  stateOrDivision: "",
  postalCode: "",
  country: "Bangladesh",
  isDefault: false,
};

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAddressAdded,
  canCreate = true,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressCreateDto>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (field: keyof AddressCreateDto, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.street.trim()) errs.street = "Give Street address ";
    if (!form.city.trim()) errs.city = "Give City ";
    if (!form.country.trim()) errs.country = "Give Country ";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setServerError("");
    try {
      const newAddress = await AddressService.create(form);
      onAddressAdded(newAddress);
      onSelect(newAddress.addressId);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 403) {
          setServerError("Only can add with Customer account address ");
        } else {
          setServerError(err.response?.data?.message || "There is Problem to save Address");
        }
      } else {
        setServerError("Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h6 className="fw-bold mb-3">
        <span className="badge bg-primary rounded-circle me-2">1</span>
        Delivery Address
      </h6>

      {/* No addresses */}
      {addresses.length === 0 && !showForm && (
        <div className="alert alert-warning d-flex align-items-center gap-2">
          <i className="bi bi-geo-alt"></i>
          <span>No address here. Add new address below </span>
        </div>
      )}

      {/* Address Cards */}
      <div className="row g-3 mb-3">
        {addresses.map((addr) => (
          <div key={addr.addressId} className="col-md-6">
            <div
              className={`card h-100 border-2 ${
                selectedAddressId === addr.addressId
                  ? "border-primary bg-primary bg-opacity-10"
                  : "border-light"
              }`}
              style={{ cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => onSelect(addr.addressId)}
            >
              <div className="card-body p-3">
                <div className="d-flex align-items-start gap-2">
                  <input
                    type="radio"
                    className="form-check-input mt-1 flex-shrink-0"
                    checked={selectedAddressId === addr.addressId}
                    onChange={() => onSelect(addr.addressId)}
                  />
                  <div>
                    {addr.isDefault && (
                      <span className="badge bg-success mb-1">Default</span>
                    )}
                    <p className="mb-0 fw-semibold small">{addr.street}</p>
                    <p className="mb-0 text-muted small">
                      {addr.city}
                      {addr.stateOrDivision ? `, ${addr.stateOrDivision}` : ""}
                      {addr.postalCode ? ` - ${addr.postalCode}` : ""}
                    </p>
                    <p className="mb-0 text-muted small">{addr.country}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Button — Anly for Customer/Admin */}
      {canCreate && !showForm && (
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() => setShowForm(true)}
        >
          <i className="bi bi-plus-circle me-1"></i>
          Add New Address
        </button>
      )}

      {/* Not allowed message */}
      {!canCreate && (
        <div className="alert alert-info py-2 small">
          <i className="bi bi-info-circle me-2"></i>
         For adding address use customer account 
        </div>
      )}

      {/* New Address Form */}
      {showForm && canCreate && (
        <div className="card border-primary border-2 rounded-3 mt-2">
          <div className="card-header bg-primary bg-opacity-10 py-2">
            <span className="fw-semibold small">
              <i className="bi bi-geo-alt me-1"></i>New Address
            </span>
          </div>
          <div className="card-body p-3">

            {serverError && (
              <div className="alert alert-danger py-2 small">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {serverError}
              </div>
            )}

            <div className="row g-2">

              <div className="col-12">
                <label className="form-label small fw-semibold">Street Address *</label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.street ? "is-invalid" : ""}`}
                  placeholder="House no, Road no, Area"
                  value={form.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                  maxLength={300}
                />
                {errors.street && <div className="invalid-feedback">{errors.street}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">City *</label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.city ? "is-invalid" : ""}`}
                  placeholder="Dhaka"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  maxLength={100}
                />
                {errors.city && <div className="invalid-feedback">{errors.city}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Division</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Dhaka Division"
                  value={form.stateOrDivision ?? ""}
                  onChange={(e) => handleChange("stateOrDivision", e.target.value)}
                  maxLength={100}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Postal Code</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="1200"
                  value={form.postalCode ?? ""}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  maxLength={20}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold">Country *</label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.country ? "is-invalid" : ""}`}
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  maxLength={100}
                />
                {errors.country && <div className="invalid-feedback">{errors.country}</div>}
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="isDefault"
                    checked={form.isDefault}
                    onChange={(e) => handleChange("isDefault", e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="isDefault">
                    Set as default address
                  </label>
                </div>
              </div>

            </div>

            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-primary btn-sm fw-semibold"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
                  : <><i className="bi bi-check-lg me-1"></i>Save Address</>
                }
              </button>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => { setShowForm(false); setErrors({}); setServerError(""); }}
                disabled={saving}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}