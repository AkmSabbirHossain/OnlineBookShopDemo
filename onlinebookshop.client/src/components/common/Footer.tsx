// =============================================
// Footer.tsx — site-wide footer
// =============================================
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/language-context";
import type { TranslationKey } from "../../i18n/translations";
import "./footer.css";

const QUICK_LINKS: { labelKey: TranslationKey; to: string }[] = [
    { labelKey: "footer.home", to: "/" },
    { labelKey: "footer.myOrders", to: "/orders" },
    { labelKey: "footer.cart", to: "/cart" },
    { labelKey: "footer.myProfile", to: "/profile" },
];

const SELL_LINKS: { labelKey: TranslationKey; to: string }[] = [
    { labelKey: "footer.becomeVendor", to: "/vendor/register" },
    { labelKey: "footer.vendorDashboard", to: "/vendor/dashboard" },
    { labelKey: "footer.sellerLogin", to: "/auth" },
];

const FEATURES: { icon: string; labelKey: TranslationKey; color: string }[] = [
    { icon: "bi-patch-check-fill", labelKey: "footer.genuine", color: "#fbbf24" },
    { icon: "bi-truck-front-fill", labelKey: "footer.delivery", color: "#34d399" },
    { icon: "bi-shield-lock-fill", labelKey: "footer.secure", color: "#60a5fa" },
    { icon: "bi-arrow-counterclockwise", labelKey: "footer.returns", color: "#f87171" },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const { t } = useLanguage();

    return (
        <footer className="footer-root">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <div className="footer-brand-logo">
                            <span className="footer-brand-icon" aria-hidden="true">
                                <i className="bi bi-book-half" />
                            </span>
                            <span className="footer-brand-text">
                                <span className="footer-brand-name">Sabbir BookMall</span>
                                <span className="footer-brand-tagline">
                                    {t("footer.tagline")}
                                </span>
                            </span>
                        </div>
                        <p className="footer-about">{t("footer.about")}</p>
                    </div>

                    <nav className="footer-col" aria-labelledby="footer-quick-links">
                        <h2 id="footer-quick-links" className="footer-heading">
                            {t("footer.quickLinks")}
                        </h2>
                        <ul className="footer-list">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link className="footer-link" to={link.to}>
                                        {t(link.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav className="footer-col" aria-labelledby="footer-sell-links">
                        <h2 id="footer-sell-links" className="footer-heading">
                            {t("footer.sellOn")}
                        </h2>
                        <ul className="footer-list">
                            {SELL_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link className="footer-link" to={link.to}>
                                        {t(link.labelKey)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="footer-col">
                        <h2 className="footer-heading">{t("footer.why")}</h2>
                        <ul className="footer-features">
                            {FEATURES.map((feature) => (
                                <li key={feature.labelKey} className="footer-feature">
                                    <span className="footer-feature-icon" aria-hidden="true">
                                        <i
                                            className={`bi ${feature.icon}`}
                                            style={{ color: feature.color }}
                                        />
                                    </span>
                                    <span>{t(feature.labelKey)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <hr className="footer-rule" />

                <div className="footer-bottom">
                    <p>&copy; {year} Sabbir BookMall. {t("footer.rights")}</p>
                    <p>{t("footer.developedBy")}</p>
                </div>
            </div>
        </footer>
    );
}
