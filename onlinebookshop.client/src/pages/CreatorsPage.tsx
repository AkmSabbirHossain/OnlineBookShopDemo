// =============================================
// CreatorsPage.tsx — writers / publishers directory
// =============================================

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import CreatorCard, { type CreatorKind } from "../components/creators/CreatorCard";
import CreatorService from "../services/creator.service";
import "../components/creators/creator.css";

const PAGE_SIZE = 24;

interface Props {
    kind: CreatorKind;
}

interface CreatorItem {
    id: number;
    name: string;
    bio?: string;
    imageUrl?: string;
    bookCount: number;
}

const COPY = {
    author: {
        eyebrow: "Voices worth reading",
        title: "Writers",
        subtitle: "Meet the authors behind your favourite books and explore everything they have written.",
        icon: "bi-feather",
        placeholder: "Search writers by name…",
        emptyTitle: "No writers found",
        emptyText: "Try a different name or browse the full directory.",
        group: "writer",
    },
    publisher: {
        eyebrow: "Houses behind the books",
        title: "Publishers",
        subtitle: "Browse the publishing houses that bring these books to readers across the country.",
        icon: "bi-building",
        placeholder: "Search publishers by name…",
        emptyTitle: "No publishers found",
        emptyText: "Try a different name or browse the full directory.",
        group: "publisher",
    },
} as const;

export default function CreatorsPage({ kind }: Props) {
    const copy = COPY[kind];

    const [items, setItems] = useState<CreatorItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadToken, setReloadToken] = useState(0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    // Debounced search — resets to the first page.
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError("");

        const load = async (): Promise<{ items: CreatorItem[]; total: number }> => {
            const params = { search: search || undefined, page, pageSize: PAGE_SIZE };

            if (kind === "author") {
                const res = await CreatorService.getAuthors(params);
                return {
                    items: res.items.map((a) => ({
                        id: a.authorId,
                        name: a.name,
                        bio: a.bio,
                        imageUrl: a.imageUrl,
                        bookCount: a.bookCount,
                    })),
                    total: res.totalCount,
                };
            }

            const res = await CreatorService.getPublishers(params);
            return {
                items: res.items.map((p) => ({
                    id: p.publisherId,
                    name: p.name,
                    bio: p.bio,
                    imageUrl: p.imageUrl,
                    bookCount: p.bookCount,
                })),
                total: res.totalCount,
            };
        };

        load()
            .then((result) => {
                if (cancelled) return;
                setItems(result.items);
                setTotal(result.total);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                setError(
                    axios.isAxiosError(err)
                        ? err.response?.data?.message || `Failed to load ${copy.group}s.`
                        : "Something went wrong."
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [kind, search, page, reloadToken, copy.group]);

    const countText = useMemo(
        () => `${total} ${copy.group}${total === 1 ? "" : "s"}`,
        [total, copy.group]
    );

    return (
        <>
            <Navbar />
            <div className="cr-page">
                <header className="cr-hero">
                    <div className="cr-hero-inner">
                        <span className="cr-eyebrow">
                            <i className={`bi ${copy.icon}`} aria-hidden="true" />
                            {copy.eyebrow}
                        </span>
                        <h1 className="cr-title">{copy.title}</h1>
                        <p className="cr-sub">{copy.subtitle}</p>

                        <div className="cr-toolbar">
                            <form
                                className="cr-search"
                                role="search"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    setSearch(searchInput.trim());
                                    setPage(1);
                                }}
                            >
                                <i className="bi bi-search" aria-hidden="true" />
                                <input
                                    type="search"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder={copy.placeholder}
                                    aria-label={copy.placeholder}
                                />
                                <button type="submit">
                                    Search
                                </button>
                            </form>

                            {!loading && !error && (
                                <span className="cr-count-pill" aria-live="polite">{countText}</span>
                            )}
                        </div>
                    </div>
                </header>

                <main className="cr-body">
                    <span className="visually-hidden" role="status" aria-live="polite">
                        {loading ? `Loading ${copy.group}s…` : countText}
                    </span>

                    {error ? (
                        <div className="cr-state">
                            <div className="cr-state-icon"><i className="bi bi-wifi-off" aria-hidden="true" /></div>
                            <h3>Could not load {copy.group}s</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                className="btn btn-primary px-4"
                                onClick={() => setReloadToken((t) => t + 1)}
                            >
                                <i className="bi bi-arrow-clockwise me-1" /> Try again
                            </button>
                        </div>
                    ) : loading ? (
                        <div className="cr-grid cr-grid--skeleton" aria-hidden="true">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="cr-skeleton-card" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <div className="cr-state">
                            <div className="cr-state-icon"><i className={`bi ${copy.icon}`} aria-hidden="true" /></div>
                            <h3>{copy.emptyTitle}</h3>
                            <p>{copy.emptyText}</p>
                            {search && (
                                <button
                                    type="button"
                                    className="btn btn-outline-primary px-4"
                                    onClick={() => {
                                        setSearchInput("");
                                        setSearch("");
                                        setPage(1);
                                    }}
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="cr-grid">
                                {items.map((item) => (
                                    <CreatorCard
                                        key={item.id}
                                        kind={kind}
                                        id={item.id}
                                        name={item.name}
                                        imageUrl={item.imageUrl}
                                        bio={item.bio}
                                        bookCount={item.bookCount}
                                    />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <nav className="cr-pager" aria-label={`${copy.title} pages`}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPage((p) => Math.max(1, p - 1));
                                            window.scrollTo({ top: 0, behavior: "smooth" });
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
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        disabled={page >= totalPages}
                                    >
                                        Next <i className="bi bi-chevron-right" aria-hidden="true" />
                                    </button>
                                </nav>
                            )}
                        </>
                    )}
                </main>
            </div>
        </>
    );
}
