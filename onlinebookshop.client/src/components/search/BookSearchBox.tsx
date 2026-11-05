// =============================================
// BookSearchBox.tsx — Header search with live suggestions
// =============================================

import { useEffect, useRef, useState } from "react";
import type { FocusEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import axios from "axios";
import BookService from "../../services/book.service";
import { useLanguage } from "../../i18n/language-context";
import type { BookResponseDto } from "../../types/book.types";

interface Props {
    idPrefix: string;
    variant: "desktop" | "mobile";
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    onSearch: (term: string) => void;
    onSelectBook: (book: BookResponseDto) => void;
}

const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 6;
const DEBOUNCE_MS = 250;
const FALLBACK_IMG = "https://placehold.co/80x104/f1f5f9/94a3b8?text=Book";

const SearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const XIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const CLASSES = {
    desktop: {
        root: "nb-search",
        form: "nb-search-form",
        inputWrap: "nb-search-input-wrap",
        input: "nb-search-input",
        clear: "nb-search-clear",
        button: "nb-search-btn",
    },
    mobile: {
        root: "nb-mobile-search",
        form: "nb-mobile-search-form",
        inputWrap: "nb-mobile-search-input-wrap",
        input: "nb-mobile-search-input",
        clear: "nb-mobile-search-clear",
        button: "nb-mobile-search-btn",
    },
} as const;

function priceOf(book: BookResponseDto) {
    return book.discountPrice != null && book.discountPrice < book.price
        ? book.discountPrice
        : book.price;
}

function highlight(text: string, term: string): ReactNode {
    if (!term) return text;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escaped})`, "ig"));
    return parts.map((part, index) =>
        part.toLowerCase() === term.toLowerCase()
            ? <mark key={index} className="bsb-mark">{part}</mark>
            : part
    );
}

export default function BookSearchBox({
    idPrefix,
    variant,
    value,
    placeholder,
    onChange,
    onSearch,
    onSelectBook,
}: Props) {
    const { t, formatNumber } = useLanguage();
    const classes = CLASSES[variant];
    const rootRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dismissedRef = useRef(false);

    const [focused, setFocused] = useState(false);
    const [open, setOpen] = useState(false);
    const [debounced, setDebounced] = useState(value);
    const [suggestions, setSuggestions] = useState<BookResponseDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const term = debounced.trim();
    const typedTerm = value.trim();
    const hasValue = value.length > 0;

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [value]);

    useEffect(() => {
        if (!focused || term.length < MIN_QUERY_LENGTH) {
            const timer = setTimeout(() => {
                setSuggestions([]);
                setError("");
                setLoading(false);
                setOpen(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const controller = new AbortController();
        let cancelled = false;

        const run = async () => {
            setLoading(true);
            setError("");
            try {
                const result = await BookService.searchBooks(
                    { search: term, page: 1, pageSize: SUGGESTION_LIMIT, sortBy: "popular" },
                    controller.signal
                );
                if (cancelled) return;
                setSuggestions(result.items);
                setActiveIndex(-1);
                setOpen(!dismissedRef.current);
            } catch (err: unknown) {
                if (cancelled || axios.isCancel(err)) return;
                setSuggestions([]);
                setError(t("search.unavailable"));
                setOpen(!dismissedRef.current);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        void run();

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [term, focused, t]);

    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(event.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const handleInputChange = (next: string) => {
        dismissedRef.current = false;
        onChange(next);
        setOpen(next.trim().length >= MIN_QUERY_LENGTH);
    };

    const handleFocus = () => {
        setFocused(true);
        if (value.trim().length >= MIN_QUERY_LENGTH) {
            dismissedRef.current = false;
            setOpen(true);
        }
    };

    const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setFocused(false);
            setOpen(false);
        }
    };

    const submitSearch = () => {
        dismissedRef.current = true;
        setOpen(false);
        setActiveIndex(-1);
        onSearch(value);
        inputRef.current?.blur();
    };

    const selectBook = (book: BookResponseDto) => {
        dismissedRef.current = true;
        setOpen(false);
        setActiveIndex(-1);
        onSelectBook(book);
    };

    const handleClear = () => {
        dismissedRef.current = true;
        setOpen(false);
        setSuggestions([]);
        onChange("");
        inputRef.current?.focus();
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        submitSearch();
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Escape") {
            if (open) {
                event.preventDefault();
                dismissedRef.current = true;
                setOpen(false);
            }
            return;
        }

        if (!open) {
            if (event.key === "ArrowDown" && typedTerm.length >= MIN_QUERY_LENGTH) {
                setOpen(true);
            }
            return;
        }

        if (event.key === "ArrowDown" && suggestions.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % suggestions.length);
        } else if (event.key === "ArrowUp" && suggestions.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
        } else if (event.key === "Enter" && activeIndex >= 0 && suggestions[activeIndex]) {
            event.preventDefault();
            selectBook(suggestions[activeIndex]);
        }
    };

    const listboxId = `${idPrefix}-suggestions`;
    const activeOptionId = activeIndex >= 0 ? `${idPrefix}-option-${activeIndex}` : undefined;

    return (
        <div className={classes.root} ref={rootRef} onBlur={handleBlur}>
            <form className={classes.form} onSubmit={handleSubmit} role="search">
                <div className={classes.inputWrap}>
                    <input
                        ref={inputRef}
                        id={`${idPrefix}-input`}
                        type="text"
                        className={`${classes.input}${hasValue ? " has-value" : ""}`}
                        placeholder={placeholder}
                        value={value}
                        onChange={(event) => handleInputChange(event.target.value)}
                        onFocus={handleFocus}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        role="combobox"
                        aria-label={t("search.label")}
                        aria-autocomplete="list"
                        aria-expanded={open}
                        aria-controls={listboxId}
                        aria-activedescendant={activeOptionId}
                    />
                    {loading ? (
                        <span className="bsb-spinner floating" aria-hidden="true" />
                    ) : hasValue ? (
                        <button
                            type="button"
                            className={classes.clear}
                            onClick={handleClear}
                            tabIndex={-1}
                            aria-label={t("search.clear")}
                        >
                            <XIcon />
                        </button>
                    ) : null}
                </div>
                <button className={classes.button} type="submit" aria-label={t("search.action")}>
                    <SearchIcon />
                    {variant === "desktop" && <span>{t("search.action")}</span>}
                </button>

                {open && (
                    <div className="bsb-panel" id={listboxId} role="listbox" aria-label={t("search.suggestions")}>
                        {loading && suggestions.length === 0 ? (
                            <div className="bsb-state">
                                <span className="bsb-spinner" aria-hidden="true" />
                                {t("search.searching")}
                            </div>
                        ) : error ? (
                            <div className="bsb-state bsb-error">
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        ) : suggestions.length === 0 ? (
                            <div className="bsb-state bsb-empty">
                                <i className="bi bi-search"></i>
                                <span>{t("search.none", { query: typedTerm })}</span>
                                <button
                                    type="button"
                                    className="bsb-inline-action"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={submitSearch}
                                >
                                    {t("search.searchAnyway")}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bsb-head">{t("search.heading")}</div>
                                <ul className="bsb-list">
                                    {suggestions.map((book, index) => {
                                        const price = priceOf(book);
                                        const discounted = price < book.price;
                                        return (
                                            <li
                                                key={book.bookId}
                                                id={`${idPrefix}-option-${index}`}
                                                role="option"
                                                aria-selected={activeIndex === index}
                                                className={`bsb-item${activeIndex === index ? " is-active" : ""}`}
                                                onMouseDown={(event) => event.preventDefault()}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                onClick={() => selectBook(book)}
                                            >
                                                <img
                                                    className="bsb-thumb"
                                                    src={book.imageUrl || FALLBACK_IMG}
                                                    alt=""
                                                    loading="lazy"
                                                    onError={(event) => { event.currentTarget.src = FALLBACK_IMG; }}
                                                />
                                                <div className="bsb-text">
                                                    <span className="bsb-title">{highlight(book.title, term)}</span>
                                                    <span className="bsb-meta">
                                                        {highlight(book.author, term)}
                                                        {book.reviewCount > 0 && (
                                                            <>
                                                                <span className="bsb-dot">·</span>
                                                                <i className="bi bi-star-fill"></i>
                                                                <span className="bsb-rating">{book.averageRating.toFixed(1)}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="bsb-side">
                                                    <span className="bsb-price">৳{formatNumber(price)}</span>
                                                    {discounted && <span className="bsb-old">৳{formatNumber(book.price)}</span>}
                                                    {book.stock === 0 && <span className="bsb-out">{t("search.outOfStock")}</span>}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <button
                                    type="button"
                                    className="bsb-viewall"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={submitSearch}
                                >
                                    <span>{t("search.viewAll", { query: typedTerm })}</span>
                                    <i className="bi bi-arrow-right"></i>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
