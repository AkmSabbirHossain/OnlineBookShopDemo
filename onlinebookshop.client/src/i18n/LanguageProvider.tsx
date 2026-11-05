// =============================================
// LanguageProvider.tsx — EN / BN language state
// =============================================
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { LanguageContext } from "./language-context";
import type { Language } from "./language-context";
import { translations } from "./translations";
import type { TranslationKey } from "./translations";

const STORAGE_KEY = "sabbir-bookmall.language";

const numberFormatters: Record<Language, Intl.NumberFormat> = {
    en: new Intl.NumberFormat("en-BD", { maximumFractionDigits: 0 }),
    bn: new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 }),
};

function readStoredLanguage(): Language {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "bn") return stored;
    } catch {
        // Storage can be blocked by the browser; fall back to the default.
    }
    return "en";
}

function interpolate(
    template: string,
    vars?: Record<string, string | number>
): string {
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in vars ? String(vars[key]) : match
    );
}

export default function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(readStoredLanguage);

    const setLanguage = useCallback((next: Language) => {
        setLanguageState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Non-fatal: the choice simply won't persist.
        }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.setAttribute("data-language", language);
    }, [language]);

    const t = useCallback(
        (key: TranslationKey, vars?: Record<string, string | number>) => {
            const dictionary = translations[language] ?? translations.en;
            return interpolate(dictionary[key] ?? translations.en[key] ?? key, vars);
        },
        [language]
    );

    const formatNumber = useCallback(
        (value: number) => numberFormatters[language].format(value),
        [language]
    );

    const value = useMemo(
        () => ({ language, setLanguage, t, formatNumber }),
        [language, setLanguage, t, formatNumber]
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}
