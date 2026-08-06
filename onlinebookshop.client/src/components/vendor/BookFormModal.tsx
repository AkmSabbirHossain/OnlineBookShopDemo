// =============================================
// BookFormModal.tsx — 
// =============================================
import { useState } from "react";
import type {
    BookResponseDto,
    BookCreateDto,
    BookUpdateDto,
    CategoryResponseDto,
} from "../../types/book.types";

interface Props {
    show: boolean;
    editBook: BookResponseDto | null;
    categories: CategoryResponseDto[];
    onClose: () => void;
    onSubmit: (dto: BookCreateDto | BookUpdateDto) => Promise<void>;
    saving: boolean;
}

interface FormState {
    title: string;
    author: string;
    price: string;
    stock: string;
    description: string;
    imageUrl: string;
    categoryId: string;
    discountPrice: string;
    publisher: string;
    edition: string;
    //new
    language: string;
    isbn: string;
    pageCount: string;

}

interface FormErrors {
    title?: string;
    author?: string;
    price?: string;
    stock?: string;
    categoryId?: string;
}

function buildInitialForm(editBook: BookResponseDto | null): FormState {
    if (editBook) {
        return {
            title: editBook.title,
            author: editBook.author,        
            price: editBook.price.toString(),
            stock: editBook.stock.toString(),
            description: editBook.description ?? "",
            imageUrl: editBook.imageUrl ?? "",
            categoryId: editBook.categoryId.toString(),
            // New fields
            discountPrice: editBook.discountPrice?.toString() ?? "",
            publisher: editBook.publisher ?? "",
            edition: editBook.edition ?? "",
            language: editBook.language ?? "",
            isbn: editBook.isbn ?? "",
            pageCount: editBook.pageCount?.toString() ?? "",
        };
    }
    return {
        title: "",
        author: "",
        price: "",
        stock: "",
        description: "",
        imageUrl: "",
        categoryId: "",
        // New fields
        discountPrice: "",
        publisher: "",
        edition: "",
        language:"",
        isbn: "",
        pageCount: ""
    };
}

function BookFormInner({
    editBook,
    categories,
    onClose,
    onSubmit,
    saving,
}: Omit<Props, "show">) {
    const isEditMode = editBook !== null;
    const [form, setForm] = useState<FormState>(() => buildInitialForm(editBook));
    const [errors, setErrors] = useState<FormErrors>({});
    const [modalError, setModalError] = useState("");

    const handleChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
        setModalError("");
    };

    // ── Validation ──
    const validate = (): boolean => {
        const errs: FormErrors = {};
        if (!form.title.trim()) errs.title = "Give Title ";
        if (!form.author.trim()) errs.author = "Give the name of Author ";
        const price = parseFloat(form.price);
        if (!form.price || isNaN(price) || price <= 0) errs.price = "Give valid price ";
        const stock = parseInt(form.stock);
        if (form.stock === "" || isNaN(stock) || stock < 0) errs.stock = "Give valid stock ";
        if (!form.categoryId) errs.categoryId = "Select category ";

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ── Submit ──
    //const handleSubmit = async () => {
    //    if (!validate()) return;
    //    setModalError("");

    //    const dto = {
    //        title: form.title.trim(),
    //        author: form.author.trim(),
    //        price: parseFloat(form.price),
    //        stock: parseInt(form.stock),
    //        description: form.description.trim() || undefined,
    //        imageUrl: form.imageUrl.trim() || undefined,
    //        categoryId: parseInt(form.categoryId),
    //        // New fields added
    //        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
    //        publisher: form.publisher.trim() || undefined,
    //        edition: form.edition.trim() || undefined,
    //        language: form.language.trim() || undefined,
    //        isbn: form.isbn.trim() || undefined,
    //        pageCount: form.pageCount ? parseInt(form.pageCount) : undefined,
    //    };
    //    console.log(dto);

    //    await onSubmit(dto);

    //    try {
    //        await onSubmit(dto);
    //    } catch {
    //        setModalError("There is a problem, Try again");
    //    }
    //};
    const handleSubmit = async () => {
        if (!validate()) return;
        setModalError("");

        const dto = {
            title: form.title.trim(),
            author: form.author.trim(),
            price: parseFloat(form.price),
            stock: parseInt(form.stock),
            description: form.description.trim() || undefined,
            imageUrl: form.imageUrl.trim() || undefined,
            categoryId: parseInt(form.categoryId),
            discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : undefined,
            publisher: form.publisher.trim() || undefined,
            edition: form.edition.trim() || undefined,
            language: form.language.trim() || undefined,
            isbn: form.isbn.trim() || undefined,
            pageCount: form.pageCount ? parseInt(form.pageCount) : undefined,
        };

        try {
            await onSubmit(dto);    
        } catch {
            setModalError("There is a problem, Try again");
        }
    };

    return (
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content border-0 shadow-lg rounded-3">
                {/* Header */}
                <div className="modal-header border-0 pb-0">
                    <h5 className="modal-title fw-bold">
                        {isEditMode ? (
                            <><i className="bi bi-pencil-square me-2 text-primary"></i>Edit Book</>
                        ) : (
                            <><i className="bi bi-plus-circle me-2 text-success"></i>Add New Book</>
                        )}
                    </h5>
                    <button className="btn-close" onClick={onClose} disabled={saving} />
                </div>

                {/* Body */}
                <div className="modal-body px-4 py-3">
                    {modalError && (
                        <div className="alert alert-danger py-2 small">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {modalError}
                        </div>
                    )}

                    <div className="row g-3">
                        {/* Title */}
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small">
                                Title <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.title ? "is-invalid" : ""}`}
                                placeholder="Book title"
                                value={form.title}
                                onChange={(e) => handleChange("title", e.target.value)}
                                maxLength={300}
                            />
                            {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                        </div>

                        {/* Author */}
                        <div className="col-md-6">
                            <label className="form-label fw-semibold small">
                                Author <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                className={`form-control ${errors.author ? "is-invalid" : ""}`}
                                placeholder="Author name"
                                value={form.author}
                                onChange={(e) => handleChange("author", e.target.value)}
                                maxLength={150}
                            />
                            {errors.author && <div className="invalid-feedback">{errors.author}</div>}
                        </div>

                        {/* Price */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">
                                Price (৳) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                                <span className="input-group-text">৳</span>
                                <input
                                    type="number"
                                    className={`form-control ${errors.price ? "is-invalid" : ""}`}
                                    placeholder="0.00"
                                    min={0.01}
                                    step={0.01}
                                    value={form.price}
                                    onChange={(e) => handleChange("price", e.target.value)}
                                />
                                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                            </div>
                        </div>

                        {/* Discount Price */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">Discount Price (৳)</label>
                            <div className="input-group">
                                <span className="input-group-text">৳</span>
                                <input
                                    type="number"
                                    className="form-control"
                                    placeholder="0.00"
                                    min={0}
                                    step={0.01}
                                    value={form.discountPrice}
                                    onChange={(e) => handleChange("discountPrice", e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Stock */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">
                                Stock <span className="text-danger">*</span>
                            </label>
                            <input
                                type="number"
                                className={`form-control ${errors.stock ? "is-invalid" : ""}`}
                                placeholder="0"
                                min={0}
                                value={form.stock}
                                onChange={(e) => handleChange("stock", e.target.value)}
                            />
                            {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
                        </div>

                        {/* Publisher */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">Publisher</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Publisher name"
                                value={form.publisher}
                                onChange={(e) => handleChange("publisher", e.target.value)}
                                maxLength={100}
                            />
                        </div>
                        {/* Category */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">
                                Category <span className="text-danger">*</span>
                            </label>
                            <select
                                className={`form-select ${errors.categoryId ? "is-invalid" : ""}`}
                                value={form.categoryId}
                                onChange={(e) => handleChange("categoryId", e.target.value)}
                            >
                                <option value="">Select category</option>
                                {categories.map((cat) => (
                                    <option key={cat.categoryId} value={cat.categoryId}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            {errors.categoryId && (
                                <div className="invalid-feedback">{errors.categoryId}</div>
                            )}
                        </div>
                        {/* Edition */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">Edition</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g June 2026...."
                                value={form.edition}
                                onChange={(e) => handleChange("edition", e.target.value)}
                                maxLength={30}
                            />
                        </div>
                        {/* language */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">Language</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="e.g Bangla...."
                                value={form.language}
                                onChange={(e) => handleChange("language", e.target.value)}
                                maxLength={20}
                            />
                        </div>
                        {/* Isbn */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">ISBN</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder=""
                                value={form.isbn}
                                onChange={(e) => handleChange("isbn", e.target.value)}
                                maxLength={30}
                            />
                        </div>
                        {/* Isbn */}
                        <div className="col-md-4">
                            <label className="form-label fw-semibold small">Page</label>
                            <input
                                type="number"
                                className="form-control"
                                placeholder=""
                                value={form.pageCount}
                                onChange={(e) => handleChange("pageCount", e.target.value)}
                             
                            />
                        </div>

                

                        {/* Image URL */}
                        <div className="col-12">
                            <label className="form-label fw-semibold small">Cover Image URL</label>
                            <input
                                type="url"
                                className="form-control"
                                placeholder="https://example.com/cover.jpg"
                                value={form.imageUrl}
                                onChange={(e) => handleChange("imageUrl", e.target.value)}
                            />
                            {form.imageUrl && (
                                <img
                                    src={form.imageUrl}
                                    alt="Preview"
                                    className="mt-2 rounded border"
                                    style={{ height: "80px", objectFit: "cover" }}
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            )}
                        </div>

                        {/* Description */}
                        <div className="col-12">
                            <label className="form-label fw-semibold small">Description</label>
                            <textarea
                                className="form-control"
                                placeholder="Book description..."
                                rows={3}
                                value={form.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                maxLength={2000}
                            />
                            <small className="text-muted">{form.description.length}/2000</small>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer border-0 pt-0">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        className={`btn ${isEditMode ? "btn-primary" : "btn-success"} fw-semibold px-4`}
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? (
                            <><span className="spinner-border spinner-border-sm me-2" />Saving...</>
                        ) : isEditMode ? (
                            <><i className="bi bi-check-lg me-2"></i>Update Book</>
                        ) : (
                            <><i className="bi bi-plus-lg me-2"></i>Add Book</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================
// MAIN EXPORT
// =============================================
export default function BookFormModal(props: Props) {
    if (!props.show) return null;
    return (
        <>
            <div
                className="modal-backdrop fade show"
                onClick={props.onClose}
                style={{ zIndex: 1040 }}
            />
            <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                <BookFormInner
                    key={`${props.editBook?.bookId ?? "new"}-${props.show}`}
                    editBook={props.editBook}
                    categories={props.categories}
                    onClose={props.onClose}
                    onSubmit={props.onSubmit}
                    saving={props.saving}
                />
            </div>
        </>
    );
}