// =============================================
// AddressManager.tsx — View, Add, Edit, Delete addresses
// =============================================

import { useState } from "react";
import axios from "axios";
import AddressService from "../../services/address.service";
import type { AddressResponseDto, AddressCreateDto } from "../../types/address.types";

interface Props {
    addresses: AddressResponseDto[];
    onAddressesChanged: (addresses: AddressResponseDto[]) => void;
}

interface FormState {
    street: string;
    city: string;
    stateOrDivision: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
}

interface FormErrors {
    street?: string;
    city?: string;
    country?: string;
}

const EMPTY_FORM: FormState = {
    street: "",
    city: "",
    stateOrDivision: "",
    postalCode: "",
    country: "Bangladesh",
    isDefault: false,
};

function AddressForm({
    initial,
    onSave,
    onCancel,
    saving,
    serverError,
}: {
    initial: FormState;
    onSave: (form: FormState) => void;
    onCancel: () => void;
    saving: boolean;
    serverError: string;
}) {
    const [form, setForm] = useState<FormState>(initial);
    const [errors, setErrors] = useState<FormErrors>({});

    const handleChange = (field: keyof FormState, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.street.trim()) errs.street = "Street address is required";
        if (!form.city.trim()) errs.city = "City is required";
        if (!form.country.trim()) errs.country = "Country is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave(form);
    };

    return (
        <div className="card border-primary border-2 rounded-3 mt-3">
            <div className="card-body p-3">
                {serverError && (
                    <div className="alert alert-danger py-2 small mb-3">{serverError}</div>
                )}
                <div className="row g-2">
                    <div className="col-12">
                        <label className="form-label small fw-semibold">Street Address *</label>
                        <input
                            type="text"
                            className={`form-control form-control-sm ${errors.street ? "is-invalid" : ""}`}
                            placeholder="House, Road, Area"
                            value={form.street}
                            onChange={(e) => handleChange("street", e.target.value)}
                            maxLength={300}
                            disabled={saving}
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
                            disabled={saving}
                        />
                        {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Division</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Dhaka Division"
                            value={form.stateOrDivision}
                            onChange={(e) => handleChange("stateOrDivision", e.target.value)}
                            maxLength={100}
                            disabled={saving}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-semibold">Postal Code</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="1200"
                            value={form.postalCode}
                            onChange={(e) => handleChange("postalCode", e.target.value)}
                            maxLength={20}
                            disabled={saving}
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
                            disabled={saving}
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
                                disabled={saving}
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
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
                        ) : (
                            <><i className="bi bi-check-lg me-1"></i>Save Address</>
                        )}
                    </button>
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AddressManager({ addresses, onAddressesChanged }: Props) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [serverError, setServerError] = useState("");

    const handleAdd = async (form: FormState) => {
        setSaving(true);
        setServerError("");
        try {
            const dto: AddressCreateDto = {
                street: form.street.trim(),
                city: form.city.trim(),
                stateOrDivision: form.stateOrDivision.trim() || undefined,
                postalCode: form.postalCode.trim() || undefined,
                country: form.country.trim(),
                isDefault: form.isDefault,
            };
            const newAddr = await AddressService.create(dto);
            onAddressesChanged([...addresses, newAddr]);
            setShowAddForm(false);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setServerError(err.response?.data?.message || "Failed to save address.");
            } else {
                setServerError("Something went wrong.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (addressId: number, form: FormState) => {
        setSaving(true);
        setServerError("");
        try {
            await AddressService.update(addressId, {
                street: form.street.trim(),
                city: form.city.trim(),
                stateOrDivision: form.stateOrDivision.trim() || undefined,
                postalCode: form.postalCode.trim() || undefined,
                country: form.country.trim(),
                isDefault: form.isDefault,
            });
            const updated = await AddressService.getMyAddresses();
            onAddressesChanged(updated);
            setEditingId(null);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setServerError(err.response?.data?.message || "Failed to update address.");
            } else {
                setServerError("Something went wrong.");
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (addressId: number) => {
        if (!window.confirm("Delete this address?")) return;
        setDeletingId(addressId);
        try {
            await AddressService.delete(addressId);
            onAddressesChanged(addresses.filter((a) => a.addressId !== addressId));
        } catch {
            // ignore
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="card border-0 shadow-sm rounded-3">
            <div className="card-header bg-white border-0 py-3 d-flex align-items-center justify-content-between">
                <h6 className="fw-bold mb-0">
                    <i className="bi bi-geo-alt me-2 text-primary"></i>
                    My Addresses
                    <span className="badge bg-primary ms-2 rounded-pill">{addresses.length}</span>
                </h6>
                {!showAddForm && (
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => { setShowAddForm(true); setServerError(""); }}
                    >
                        <i className="bi bi-plus-circle me-1"></i>Add New
                    </button>
                )}
            </div>

            <div className="card-body p-4">

                {/* Add Form */}
                {showAddForm && (
                    <AddressForm
                        initial={EMPTY_FORM}
                        onSave={handleAdd}
                        onCancel={() => { setShowAddForm(false); setServerError(""); }}
                        saving={saving}
                        serverError={serverError}
                    />
                )}

                {/* Empty */}
                {addresses.length === 0 && !showAddForm && (
                    <div className="text-center py-4 text-muted">
                        <i className="bi bi-geo-alt fs-2 d-block mb-2 opacity-25"></i>
                        No addresses saved yet.
                    </div>
                )}

                {/* Address Cards */}
                <div className="row g-3 mt-1">
                    {addresses.map((addr) => (
                        <div key={addr.addressId} className="col-md-6">
                            {editingId === addr.addressId ? (
                                <AddressForm
                                    initial={{
                                        street: addr.street,
                                        city: addr.city,
                                        stateOrDivision: addr.stateOrDivision ?? "",
                                        postalCode: addr.postalCode ?? "",
                                        country: addr.country,
                                        isDefault: addr.isDefault,
                                    }}
                                    onSave={(form) => handleUpdate(addr.addressId, form)}
                                    onCancel={() => { setEditingId(null); setServerError(""); }}
                                    saving={saving}
                                    serverError={serverError}
                                />
                            ) : (
                                <div
                                    className={`card h-100 rounded-3 border-2 ${addr.isDefault ? "border-primary" : "border-light"
                                        }`}
                                >
                                    <div className="card-body p-3">
                                        {addr.isDefault && (
                                            <span className="badge bg-primary mb-2">Default</span>
                                        )}
                                        <p className="fw-semibold mb-1 small">
                                            <i className="bi bi-house me-1 text-muted"></i>
                                            {addr.street}
                                        </p>
                                        <p className="text-muted small mb-0">
                                            {addr.city}
                                            {addr.stateOrDivision ? `, ${addr.stateOrDivision}` : ""}
                                            {addr.postalCode ? ` - ${addr.postalCode}` : ""}
                                        </p>
                                        <p className="text-muted small mb-3">{addr.country}</p>

                                        <div className="d-flex gap-2">
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() => { setEditingId(addr.addressId); setServerError(""); }}
                                            >
                                                <i className="bi bi-pencil me-1"></i>Edit
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => handleDelete(addr.addressId)}
                                                disabled={deletingId === addr.addressId}
                                            >
                                                {deletingId === addr.addressId ? (
                                                    <span className="spinner-border spinner-border-sm" />
                                                ) : (
                                                    <><i className="bi bi-trash3 me-1"></i>Delete</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}