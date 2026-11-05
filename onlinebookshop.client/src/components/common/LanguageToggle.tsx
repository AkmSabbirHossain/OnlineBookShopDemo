// =============================================
// LanguageToggle.tsx — EN / বাংলা switch
// =============================================
import { useLanguage } from "../../i18n/language-context";
import type { Language } from "../../i18n/language-context";
import "./language-toggle.css";

const OPTIONS: { value: Language; label: string; short: string }[] = [
    { value: "en", label: "English", short: "EN" },
    { value: "bn", label: "বাংলা", short: "বাংলা" },
];

export default function LanguageToggle({
    variant = "bar",
}: {
    variant?: "bar" | "drawer";
}) {
    const { language, setLanguage, t } = useLanguage();

    return (
        <div
            className={`lt-root lt-root--${variant}`}
            role="group"
            aria-label={t("nav.languageSwitch")}
        >
            {OPTIONS.map((option) => {
                const active = language === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        className={`lt-btn${active ? " is-active" : ""}`}
                        aria-pressed={active}
                        title={option.label}
                        onClick={() => setLanguage(option.value)}
                    >
                        {option.short}
                    </button>
                );
            })}
        </div>
    );
}
