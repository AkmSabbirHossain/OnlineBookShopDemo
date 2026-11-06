// =============================================
// seo.ts — shared SEO constants and helpers
// =============================================

export const SITE_NAME = "Sabbir BookMall";
export const DEFAULT_OG_IMAGE = "/og-cover.png";

export function absoluteUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function truncate(text: string | null | undefined, max = 155): string | undefined {
    if (!text) return undefined;
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    return `${clean.slice(0, max - 1).trimEnd()}…`;
}
