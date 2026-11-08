import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { useLanguage } from "../../i18n/language-context";
import "./creator.css";

interface Props {
    /** Accessible name of the strip (section title). */
    label: string;
    children: ReactNode;
}

export default function CreatorStrip({ label, children }: Props) {
    const { t } = useLanguage();
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [atStart, setAtStart] = useState(true);
    const [atEnd, setAtEnd] = useState(true);

    const sync = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const overflow = scrollWidth - clientWidth;
        setAtStart(scrollLeft <= 2);
        setAtEnd(overflow <= 2 || scrollLeft >= overflow - 2);
    }, []);

    useEffect(() => {
        sync();
        const el = trackRef.current;
        if (!el) return;
        el.addEventListener("scroll", sync, { passive: true });
        window.addEventListener("resize", sync);
        const observer = new ResizeObserver(sync);
        observer.observe(el);
        return () => {
            el.removeEventListener("scroll", sync);
            window.removeEventListener("resize", sync);
            observer.disconnect();
        };
    }, [sync]);

    const scrollBy = (direction: 1 | -1) => {
        const el = trackRef.current;
        if (!el) return;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollBy({
            left: direction * el.clientWidth * 0.8,
            behavior: reduce ? "auto" : "smooth",
        });
    };

    return (
        <div className="cr-strip-wrap">
            <div ref={trackRef} className="cr-strip" role="group" aria-label={label}>
                {children}
            </div>
            <button
                type="button"
                className="cr-strip-nav cr-strip-nav--prev"
                onClick={() => scrollBy(-1)}
                disabled={atStart}
                aria-label={t("home.creatorScrollPrev")}
            >
                <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
            <button
                type="button"
                className="cr-strip-nav cr-strip-nav--next"
                onClick={() => scrollBy(1)}
                disabled={atEnd}
                aria-label={t("home.creatorScrollNext")}
            >
                <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
        </div>
    );
}
