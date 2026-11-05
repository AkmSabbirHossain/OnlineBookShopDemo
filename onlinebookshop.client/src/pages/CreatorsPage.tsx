// =============================================
// CreatorsPage.tsx — writers / publishers directory
// =============================================

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Navbar from "../components/common/Navbar";
import Seo from "../components/common/Seo";
import CreatorCard, { type CreatorKind } from "../components/creators/CreatorCard";
import CreatorService from "../services/creator.service";
import { useLanguage } from "../i18n/language-context";
import type { TranslationKey } from "../i18n/translations";
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

interface DirectoryCopy {
    eyebrow: TranslationKey;
    title: TranslationKey;
    subtitle: TranslationKey;
    icon: string;
    placeholder: TranslationKey;
    emptyTitle: TranslationKey;
    emptyText: TranslationKey;
    count: TranslationKey;
    countOne: TranslationKey;
    seoTitle: TranslationKey;
}

const COPY: Record<CreatorKind, DirectoryCopy> = {
    author: {
        eyebrow: "creators.writersEyebrow",
        title: "nav.writers",
        subtitle: "creators.writersSubtitle",
        icon: "bi-feather",
        placeholder: "creators.writersPlaceholder",
        emptyTitle: "creators.noWriters",
        emptyText: "creators.noWritersText",
        count: "creators.countWriters",
        countOne: "creators.countWriterOne",
        seoTitle: "seo.writersTitle",
    },
    publisher: {
        eyebrow: "creators.publishersEyebrow",
        title: "nav.publishers",
        subtitle: "creators.publishersSubtitle",
        icon: "bi-building",
        placeholder: "creators.publishersPlaceholder",
        emptyTitle: "creators.noPublishers",
        emptyText: "creators.noPublishersText",
        count: "creators.countPublishers",
        countOne: "creators.countPublisherOne",
        seoTitle: "seo.publishersTitle",
    },
};

export default function CreatorsPage({ kind }: Props) {
    const copy = COPY[kind];
    const { t, formatNumber } = useLanguage();

    const [items, setItems] = useState<CreatorItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reloadToken, setReloadToken] = useState(0);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const groupLabel = t(copy.title);

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

        const load = async (): Promise<{ items: CreatorItem[]; total: number }> => {
            setLoading(true);
            setError("");
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
                        ? err.response?.data?.message ||
                              t("creators.loadFailed", { group: groupLabel })
                        : t("detail.somethingWrong")
                );
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [kind, search, page, reloadToken, t, groupLabel]);

    const countText = useMemo(
        () =>
            total === 1
                ? t(copy.countOne)
                : t(copy.count, { count: formatNumber(total) }),
        [total, t, copy.count, copy.countOne, formatNumber]
    );

    return (
        <>
            <Navbar />
            <Seo
                title={t(copy.seoTitle)}
                description={t(copy.subtitle)}
                path={kind === "author" ? "/authors" : "/publishers"}
            />
            <div className="cr-page">
                <header className="cr-hero">
                    <div className="cr-hero-inner">
                        <span className="cr-eyebrow">
                            <i className={`bi ${copy.icon}`} aria-hidden="true" />
                            {t(copy.eyebrow)}
                        </span>
                        <h1 className="cr-title">{t(copy.title)}</h1>
                        <p className="cr-sub">{t(copy.subtitle)}</p>

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
                                    placeholder={t(copy.placeholder)}
                                    aria-label={t(copy.placeholder)}
                                />
                                <button type="submit">{t("creators.search")}</button>
                            </form>

                            {!loading && !error && (
                                <span className="cr-count-pill" aria-live="polite">
                                    {countText}
                                </span>
                            )}
                        </div>
                    </div>
                </header>

                <main className="cr-body">
                    <span className="visually-hidden" role="status" aria-live="polite">
                        {loading
                            ? t("creators.loading", { group: groupLabel })
                            : countText}
                    </span>

                    {error ? (
                        <div className="cr-state">
                            <div className="cr-state-icon">
                                <i className="bi bi-wifi-off" aria-hidden="true" />
                            </div>
                            <h3>{t("creators.couldNotLoad", { group: groupLabel })}</h3>
                            <p>{error}</p>
                            <button
                                type="button"
                                className="btn btn-primary px-4"
                                onClick={() => setReloadToken((token) => token + 1)}
                            >
                                <i className="bi bi-arrow-clockwise me-1" />{" "}
                                {t("common.tryAgain")}
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
                            <div className="cr-state-icon">
                                <i className={`bi ${copy.icon}`} aria-hidden="true" />
                            </div>
                            <h3>{t(copy.emptyTitle)}</h3>
                            <p>{t(copy.emptyText)}</p>
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
                                    {t("creators.clearSearch")}
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
                                <nav
                                    className="cr-pager"
                                    aria-label={t("creators.pagesAria", {
                                        title: groupLabel,
                                    })}
                                >
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPage((p) => Math.max(1, p - 1));
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        disabled={page <= 1}
                                    >
                                        <i className="bi bi-chevron-left" aria-hidden="true" />{" "}
                                        {t("creators.previous")}
                                    </button>
                                    <span>
                                        {t("creators.pageOf", {
                                            page: formatNumber(page),
                                            total: formatNumber(totalPages),
                                        })}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPage((p) => Math.min(totalPages, p + 1));
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        disabled={page >= totalPages}
                                    >
                                        {t("creators.next")}{" "}
                                        <i className="bi bi-chevron-right" aria-hidden="true" />
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
