// =============================================
// CreatorProfilePage.tsx — writer / publisher profile
// =============================================

import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import BookCard from "../components/books/BookCard";
import { getInitials, type CreatorKind } from "../components/creators/CreatorCard";
import BookService from "../services/book.service";
import CartService from "../services/cart.service";
import CreatorService from "../services/creator.service";
import AuthService from "../services/auth.service";
import type { BookFilterParams, BookResponseDto } from "../types/book.types";
import type { AuthorResponseDto, PublisherResponseDto } from "../types/creator.types";
import "../components/creators/creator.css";

const PAGE_SIZE = 15;

interface Props {
    kind: CreatorKind;
}

interface ProfileData {
    name: string;
    bio?: string;
    imageUrl?: string;
    bookCount: number;
}

const COPY = {
    author: {
        directory: "/authors",
        directoryLabel: "Writers",
        role: "Writer",
        booksTitle: "Books by",
        emptyBooks: "This writer has no published books yet.",
        missing: "We could not find this writer.",
    },
    publisher: {
        directory: "/publishers",
        directoryLabel: "Publishers",
        role: "Publisher",
        booksTitle: "Books from",
        emptyBooks: "This publisher has no books in the catalogue yet.",
        missing: "We could not find this publisher.",
    },
} as const;

const SORT_OPTIONS: { value: NonNullable<BookFilterParams["sortBy"]>; label: string }[] = [
    { value: "newest", label: "Newest" },
    { value: "rating_desc", label: "Top rated" },
    { value: "popular", label: "Popular" },
    { value: "price_asc", label: "Price: low to high" },
    { value: "price_desc", label: "Price: high to low" },
    { value: "title_asc", label: "Title: A to Z" },
];

export default function CreatorProfilePage({ kind }: Props) {
    const { id } = useParams<{ id: string }>();
    const creatorId = Number(id);
    const isValidId = Number.isInteger(creatorId) && creatorId > 0;
    const copy = COPY[kind];

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [profileError, setProfileError] = useState("");
    const [notFound, setNotFound] = useState(false);
    const [imageBroken, setImageBroken] = useState(false);

    const [books, setBooks] = useState<BookResponseDto[]>([]);
    const [bookTotal, setBookTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState<NonNullable<BookFilterParams["sortBy"]>>("newest");
    const [booksLoading, setBooksLoading] = useState(true);
    const [booksError, setBooksError] = useState("");
    const [booksReload, setBooksReload] = useState(0);

    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});
    const [cartError, setCartError] = useState("");

    const totalPages = Math.max(1, Math.ceil(bookTotal / PAGE_SIZE));

    useEffect(() => {
        if (!isValidId) {
            setNotFound(true);
            setProfileLoading(false);
            return;
        }

        let cancelled = false;
        setProfileLoading(true);
        setProfileError("");

        const request = kind === "author"
            ? CreatorService.getAuthor(creatorId)
            : CreatorService.getPublisher(creatorId);

        request
            .then((data: AuthorResponseDto | PublisherResponseDto) => {
                if (cancelled) return;
                setProfile({
                    name: data.name,
                    bio: data.bio,
                    imageUrl: data.imageUrl,
                    bookCount: data.bookCount,
                });
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                if (axios.isAxiosError(err) && err.response?.status === 404) {
                    setNotFound(true);
                    return;
                }
                setProfileError(
                    axios.isAxiosError(err)
                        ? err.response?.data?.message || "Failed to load this profile."
                        : "Something went wrong."
                );
            })
            .finally(() => {
                if (!cancelled) setProfileLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [kind, creatorId, isValidId]);

    useEffect(() => {
        if (!isValidId) return;

        let cancelled = false;
        setBooksLoading(true);
        setBooksError("");

        BookService.searchBooks(
            kind === "author"
                ? { authorId: creatorId, page, pageSize: PAGE_SIZE, sortBy }
                : { publisherId: creatorId, page, pageSize: PAGE_SIZE, sortBy }
        )
            .then((result) => {
                if (cancelled) return;
                setBooks(result.items);
                setBookTotal(result.totalCount);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setBooksError(
                    axios.isAxiosError(err)
                        ? err.response?.data?.message || "Failed to load books."
                        : "Something went wrong."
                );
            })
            .finally(() => {
                if (!cancelled) setBooksLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [kind, creatorId, isValidId, page, sortBy, booksReload]);

    useEffect(() => {
        if (!AuthService.isAuthenticated()) return;
        CartService.getMyCart()
            .then((cart) => {
                const quantities: Record<number, number> = {};
                cart.items.forEach((item) => {
                    quantities[item.bookId] = item.quantity;
                });
                setCartQuantities(quantities);
            })
            .catch(() => { /* cart badges are non-critical */ });
    }, []);

    const handleAddToCart = async (bookId: number) => {
        setAddingToCart(bookId);
        setCartError("");
        try {
            await CartService.addItem({ bookId, quantity: 1 });
            setCartQuantities((prev) => ({ ...prev, [bookId]: (prev[bookId] ?? 0) + 1 }));
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (err: unknown) {
            setCartError(
                axios.isAxiosError(err)
                    ? err.response?.data?.message || "Failed to add to cart."
                    : "Something went wrong."
            );
            setTimeout(() => setCartError(""), 3000);
        } finally {
            setAddingToCart(null);
        }
    };

    const pageTitle = profile ? `${profile.name} — ${copy.role}` : copy.role;

    return (
        <>
            <Navbar />
            <div className="cr-page">
                <div className="cr-body" style={{ paddingTop: 20 }}>
                    <nav className="cr-crumbs" aria-label="Breadcrumb">
                        <Link to="/">Home</Link>
                        <span className="sep" aria-hidden="true">/</span>
                        <Link to={copy.directory}>{copy.directoryLabel}</Link>
                        <span className="sep" aria-hidden="true">/</span>
                        <strong title={pageTitle}>{profile?.name ?? copy.role}</strong>
                    </nav>

                    {profileLoading ? (
                        <div className="cr-profile-hero" aria-hidden="true">
                            <div className="cr-skeleton-card" style={{ width: 120, height: 120, borderRadius: 22, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div className="cr-skeleton-card" style={{ height: 16, width: "40%", marginBottom: 10 }} />
                                <div className="cr-skeleton-card" style={{ height: 12, width: "90%", marginBottom: 8 }} />
                                <div className="cr-skeleton-card" style={{ height: 12, width: "70%" }} />
                            </div>
                        </div>
                    ) : notFound ? (
                        <div className="cr-state">
                            <div className="cr-state-icon"><i className="bi bi-person-x" aria-hidden="true" /></div>
                            <h3>{copy.missing}</h3>
                            <p>The profile may have been removed or is no longer available.</p>
                            <Link to={copy.directory} className="btn btn-primary px-4">
                                Browse {copy.directoryLabel}
                            </Link>
                        </div>
                    ) : profileError ? (
                        <div className="cr-state">
                            <div className="cr-state-icon"><i className="bi bi-wifi-off" aria-hidden="true" /></div>
                            <h3>Could not load this profile</h3>
                            <p>{profileError}</p>
                            <button
                                type="button"
                                className="btn btn-primary px-4"
                                onClick={() => setBooksReload((t) => t + 1)}
                            >
                                <i className="bi bi-arrow-clockwise me-1" /> Try again
                            </button>
                        </div>
                    ) : profile ? (
                        <>
                            <section className="cr-profile-hero">
                                <div className="cr-profile-avatar">
                                    {profile.imageUrl && !imageBroken ? (
                                        <img
                                            src={profile.imageUrl}
                                            alt={profile.name}
                                            onError={() => setImageBroken(true)}
                                        />
                                    ) : (
                                        <span aria-hidden="true">{getInitials(profile.name)}</span>
                                    )}
                                </div>
                                <div className="cr-profile-info">
                                    <span className="cr-profile-role">
                                        <i className="bi bi-patch-check-fill" aria-hidden="true" />
                                        {copy.role}
                                    </span>
                                    <h1 className="cr-profile-name">{profile.name}</h1>
                                    {profile.bio && <p className="cr-profile-bio">{profile.bio}</p>}
                                    <div className="cr-profile-stats">
                                        <div className="cr-profile-stat">
                                            <strong>{profile.bookCount}</strong>
                                            <span>{profile.bookCount === 1 ? "Book available" : "Books available"}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <div className="cr-section-head">
                                <h2 className="cr-section-title">
                                    <i className="bi bi-journals" aria-hidden="true" />
                                    {copy.booksTitle} {profile.name}
                                </h2>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: "auto", minWidth: 170, fontSize: 12.5 }}
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as NonNullable<BookFilterParams["sortBy"]>);
                                        setPage(1);
                                    }}
                                    aria-label="Sort books"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            {cartError && (
                                <div className="alert alert-danger py-2 small" role="alert">{cartError}</div>
                            )}

                            {booksError ? (
                                <div className="cr-state">
                                    <div className="cr-state-icon"><i className="bi bi-wifi-off" aria-hidden="true" /></div>
                                    <h3>Could not load books</h3>
                                    <p>{booksError}</p>
                                    <button
                                        type="button"
                                        className="btn btn-primary px-4"
                                        onClick={() => setBooksReload((t) => t + 1)}
                                    >
                                        <i className="bi bi-arrow-clockwise me-1" /> Try again
                                    </button>
                                </div>
                            ) : booksLoading ? (
                                <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2 g-sm-3" aria-hidden="true">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="col">
                                            <div className="cr-skeleton-card" style={{ height: 330 }} />
                                        </div>
                                    ))}
                                </div>
                            ) : books.length === 0 ? (
                                <div className="cr-state">
                                    <div className="cr-state-icon"><i className="bi bi-book" aria-hidden="true" /></div>
                                    <h3>No books yet</h3>
                                    <p>{copy.emptyBooks}</p>
                                    <Link to={copy.directory} className="btn btn-outline-primary px-4">
                                        Browse {copy.directoryLabel}
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-2 g-sm-3">
                                        {books.map((book) => (
                                            <div key={book.bookId} className="col">
                                                <BookCard
                                                    book={book}
                                                    onAddToCart={handleAddToCart}
                                                    onAddToWishlist={() => { /* handled elsewhere */ }}
                                                    addingToCart={addingToCart === book.bookId}
                                                    cartQuantity={cartQuantities[book.bookId] ?? 0}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {totalPages > 1 && (
                                        <nav className="cr-pager" aria-label="Book pages">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPage((p) => Math.max(1, p - 1));
                                                    window.scrollTo({ top: 260, behavior: "smooth" });
                                                }}
                                                disabled={page <= 1}
                                            >
                                                <i className="bi bi-chevron-left" aria-hidden="true" /> Previous
                                            </button>
                                            <span>Page {page} of {totalPages}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setPage((p) => Math.min(totalPages, p + 1));
                                                    window.scrollTo({ top: 260, behavior: "smooth" });
                                                }}
                                                disabled={page >= totalPages}
                                            >
                                                Next <i className="bi bi-chevron-right" aria-hidden="true" />
                                            </button>
                                        </nav>
                                    )}
                                </>
                            )}
                        </>
                    ) : null}
                </div>
            </div>
        </>
    );
}
