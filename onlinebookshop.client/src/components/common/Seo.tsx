// =============================================
// Seo.tsx — per-route document head manager
// =============================================
import { useEffect } from "react";
import { useLanguage } from "../../i18n/language-context";
import { absoluteUrl, DEFAULT_OG_IMAGE, SITE_NAME, truncate } from "../../utils/seo";

type JsonLd = Record<string, unknown>;

interface SeoProps {
    title: string;
    description?: string | null;
    path?: string;
    image?: string | null;
    type?: "website" | "book" | "profile" | "article";
    noindex?: boolean;
    jsonLd?: JsonLd | JsonLd[];
}

function setMeta(attribute: "name" | "property", key: string, content?: string) {
    const selector = `meta[${attribute}="${key}"]`;
    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!content) {
        element?.remove();
        return;
    }
    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.setAttribute("content", content);
}

function setCanonical(href: string) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
    }
    link.href = href;
}

export default function Seo({
    title,
    description,
    path,
    image,
    type = "website",
    noindex = false,
    jsonLd,
}: SeoProps) {
    const { language, t } = useLanguage();
    const resolvedDescription = truncate(description) ?? t("seo.defaultDescription");
    const resolvedImage = image ?? DEFAULT_OG_IMAGE;
    const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : "";

    useEffect(() => {
        const canonicalPath = path ?? window.location.pathname;
        const canonical = absoluteUrl(canonicalPath);
        const imageUrl = absoluteUrl(resolvedImage);
        const locale = language === "bn" ? "bn_BD" : "en_US";
        const alternateLocale = language === "bn" ? "en_US" : "bn_BD";

        document.title = title;

        setMeta("name", "description", resolvedDescription);
        setMeta(
            "name",
            "robots",
            noindex
                ? "noindex, nofollow"
                : "index, follow, max-image-preview:large"
        );

        setMeta("property", "og:site_name", SITE_NAME);
        setMeta("property", "og:type", type);
        setMeta("property", "og:title", title);
        setMeta("property", "og:description", resolvedDescription);
        setMeta("property", "og:url", canonical);
        setMeta("property", "og:image", imageUrl);
        setMeta("property", "og:image:alt", title);
        setMeta("property", "og:locale", locale);
        setMeta("property", "og:locale:alternate", alternateLocale);

        setMeta("name", "twitter:card", "summary_large_image");
        setMeta("name", "twitter:title", title);
        setMeta("name", "twitter:description", resolvedDescription);
        setMeta("name", "twitter:image", imageUrl);

        setCanonical(canonical);

        let script = document.getElementById("seo-json-ld") as HTMLScriptElement | null;
        if (jsonLdString) {
            if (!script) {
                script = document.createElement("script");
                script.id = "seo-json-ld";
                script.type = "application/ld+json";
                document.head.appendChild(script);
            }
            script.textContent = jsonLdString;
        } else if (script) {
            script.remove();
        }
    }, [
        title,
        resolvedDescription,
        path,
        resolvedImage,
        type,
        noindex,
        jsonLdString,
        language,
    ]);

    return null;
}
