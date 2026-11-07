// =============================================
// Footer.tsx — site-wide footer
// =============================================
import { Link } from "react-router-dom";
import { useLanguage } from "../../i18n/language-context";
import { useCallback } from "react";
import type { TranslationKey } from "../../i18n/translations";
import logoMark from "../../assets/logo-mark.svg";
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

const FEATURES: { icon: string; labelKey: TranslationKey }[] = [
    { icon: "bi-patch-check-fill", labelKey: "footer.genuine" },
    { icon: "bi-truck-front-fill", labelKey: "footer.delivery" },
    { icon: "bi-shield-lock-fill", labelKey: "footer.secure" },
    { icon: "bi-arrow-counterclockwise", labelKey: "footer.returns" },
];

const BADGES: { icon: string; labelKey: TranslationKey }[] = [
    { icon: "bi-cash-coin", labelKey: "footer.cod" },
    { icon: "bi-patch-check", labelKey: "footer.verifiedVendors" },
];

export default function Footer() {
    const year = new Date().getFullYear();
    const { t } = useLanguage();

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    return (
        <footer className="ft-root">
            <div className="ft-accent" aria-hidden="true" />
            <div className="ft-container ft-inner">
                <div className="ft-grid">
                    <div className="ft-brand">
                        <Link className="ft-logo" to="/">
                            <img src={logoMark} alt="" className="ft-logo-mark" />
                            <span className="ft-logo-text">
                                <span className="ft-logo-name">
                                    Sabbir Book<span>Mall</span>
                                </span>
                                <span className="ft-logo-tagline">{t("footer.tagline")}</span>
                            </span>
                        </Link>
                        <p className="ft-about">{t("footer.about")}</p>
                        <ul className="ft-badges">
                            {BADGES.map((badge) => (
                                <li key={badge.labelKey} className="ft-badge">
                                    <i className={`bi ${badge.icon}`} aria-hidden="true" />
                                    {t(badge.labelKey)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <nav className="ft-col" aria-labelledby="footer-quick-links">
                        <h2 id="footer-quick-links" className="ft-heading">
                            {t("footer.quickLinks")}
                        </h2>
                        <ul className="ft-list">
                            {QUICK_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link className="ft-link" to={link.to}>
                                        <span>{t(link.labelKey)}</span>
                                        <i className="bi bi-arrow-right" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav className="ft-col" aria-labelledby="footer-sell-links">
                        <h2 id="footer-sell-links" className="ft-heading">
                            {t("footer.sellOn")}
                        </h2>
                        <ul className="ft-list">
                            {SELL_LINKS.map((link) => (
                                <li key={link.to}>
                                    <Link className="ft-link" to={link.to}>
                                        <span>{t(link.labelKey)}</span>
                                        <i className="bi bi-arrow-right" aria-hidden="true" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <div className="ft-col ft-col--features">
                        <h2 className="ft-heading">{t("footer.why")}</h2>
                        <ul className="ft-features">
                            {FEATURES.map((feature) => (
                                <li key={feature.labelKey} className="ft-feature">
                                    <span className="ft-feature-icon" aria-hidden="true">
                                        <i className={`bi ${feature.icon}`} />
                                    </span>
                                    <span>{t(feature.labelKey)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="ft-bottom">
                    <p className="ft-copy">
                        &copy; {year} Sabbir BookMall. {t("footer.rights")}
                    </p>
                    <p className="ft-credit">{t("footer.developedBy")}</p>
                    <button type="button" className="ft-totop" onClick={scrollToTop}>
                        {t("footer.backToTop")}
                        <i className="bi bi-arrow-up" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </footer>
    );
}
