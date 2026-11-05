// =============================================
// HeroSlider.tsx — accessible, responsive banner carousel
// =============================================
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { BannerResponseDto } from "../../types/banner.types";
import "./hero-slider.css";

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 50;

function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(
        () =>
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );

    useEffect(() => {
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    return reduced;
}

function isInternalLink(url: string): boolean {
    return url.startsWith("/") && !url.startsWith("//");
}

export function HeroSkeleton() {
    return (
        <div className="hero-slider hero-slider--skeleton" aria-hidden="true">
            <div className="hero-skeleton-block" />
        </div>
    );
}

export default function HeroSlider({ banners }: { banners: BannerResponseDto[] }) {
    const [index, setIndex] = useState(0);
    const [userPaused, setUserPaused] = useState(false);
    const [interacting, setInteracting] = useState(false);
    const reducedMotion = usePrefersReducedMotion();
    const touchStart = useRef<{ x: number; y: number } | null>(null);

    const count = banners.length;

    const goTo = useCallback(
        (next: number) => {
            if (count === 0) return;
            setIndex(((next % count) + count) % count);
        },
        [count]
    );

    const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
    const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

    useEffect(() => {
        if (count <= 1 || userPaused || interacting || reducedMotion) return;
        const timer = window.setInterval(() => {
            setIndex((prev) => (prev + 1) % count);
        }, AUTOPLAY_MS);
        return () => window.clearInterval(timer);
    }, [count, userPaused, interacting, reducedMotion]);

    if (count === 0) return null;

    const activeIndex = index % count;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "ArrowRight") {
            event.preventDefault();
            goNext();
        } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goPrev();
        }
    };

    const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setInteracting(false);
        }
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) goNext();
            else goPrev();
        }
    };

    return (
        <section
            className="hero-slider"
            aria-roledescription="carousel"
            aria-label="Featured offers"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setInteracting(true)}
            onMouseLeave={() => setInteracting(false)}
            onFocus={() => setInteracting(true)}
            onBlur={handleBlur}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div
                className="hero-track"
                aria-live={userPaused || reducedMotion ? "polite" : "off"}
                aria-atomic="true"
            >
                {banners.map((banner, i) => {
                    const active = i === activeIndex;
                    return (
                        <figure
                            key={banner.bannerId}
                            className={`hero-slide${active ? " is-active" : ""}`}
                            role="group"
                            aria-roledescription="slide"
                            aria-label={`Slide ${i + 1} of ${count}`}
                            aria-hidden={!active}
                        >
                            <img
                                className="hero-slide-img"
                                src={banner.imageUrl}
                                alt=""
                                loading={i === 0 ? "eager" : "lazy"}
                                fetchPriority={i === 0 ? "high" : "auto"}
                                draggable={false}
                            />

                            <figcaption className="hero-caption">
                                <div className="hero-caption-inner">
                                    <p className="hero-eyebrow">Sabbir BookMall</p>
                                    <h2 className="hero-title">{banner.title}</h2>
                                    {banner.subtitle && (
                                        <p className="hero-subtitle">{banner.subtitle}</p>
                                    )}
                                    {banner.linkUrl && (
                                        <span className="hero-cta" aria-hidden="true">
                                            Shop now <i className="bi bi-arrow-right" />
                                        </span>
                                    )}
                                </div>
                            </figcaption>

                            {banner.linkUrl &&
                                (isInternalLink(banner.linkUrl) ? (
                                    <Link
                                        className="hero-slide-hit"
                                        to={banner.linkUrl}
                                        tabIndex={active ? 0 : -1}
                                        aria-label={`${banner.title} — view offer`}
                                    />
                                ) : (
                                    <a
                                        className="hero-slide-hit"
                                        href={banner.linkUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        tabIndex={active ? 0 : -1}
                                        aria-label={`${banner.title} — view offer`}
                                    />
                                ))}
                        </figure>
                    );
                })}
            </div>

            {count > 1 && (
                <div className="hero-controls">
                    <button
                        type="button"
                        className="hero-arrow hero-arrow--prev"
                        aria-label="Previous slide"
                        onClick={goPrev}
                    >
                        <i className="bi bi-chevron-left" aria-hidden="true" />
                    </button>

                    <div className="hero-dots">
                        {banners.map((banner, i) => (
                            <button
                                key={banner.bannerId}
                                type="button"
                                className={`hero-dot${i === activeIndex ? " is-active" : ""}`}
                                aria-label={`Show slide ${i + 1}: ${banner.title}`}
                                aria-current={i === activeIndex ? "true" : undefined}
                                onClick={() => goTo(i)}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        className="hero-arrow hero-arrow--next"
                        aria-label="Next slide"
                        onClick={goNext}
                    >
                        <i className="bi bi-chevron-right" aria-hidden="true" />
                    </button>

                    <button
                        type="button"
                        className="hero-playpause"
                        aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                        aria-pressed={userPaused}
                        onClick={() => setUserPaused((paused) => !paused)}
                    >
                        <i
                            className={`bi ${userPaused ? "bi-play-fill" : "bi-pause-fill"}`}
                            aria-hidden="true"
                        />
                    </button>
                </div>
            )}
        </section>
    );
}
