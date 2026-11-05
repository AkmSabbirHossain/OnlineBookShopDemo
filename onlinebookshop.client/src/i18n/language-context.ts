// =============================================
// language-context.ts — language contract + hook
// =============================================
import { createContext, useContext } from "react";
import type { TranslationKey } from "./translations";

export type Language = "en" | "bn";

export interface LanguageContextValue {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
    formatNumber: (value: number) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used inside LanguageProvider");
    }
    return context;
}
