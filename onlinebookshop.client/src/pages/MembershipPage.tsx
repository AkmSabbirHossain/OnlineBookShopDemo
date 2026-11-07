// =============================================
// MembershipPage.tsx — membership info + join CTA
// =============================================

import { Link } from "react-router-dom";
import Seo from "../components/common/Seo";
import { useLanguage } from "../i18n/language-context";

const BENEFIT_ICONS = ["bi-percent", "bi-lightning-charge", "bi-truck", "bi-headset"];

export default function MembershipPage() {
    const { t } = useLanguage();

    const benefits = [
        { titleKey: "membership.b1Title", descKey: "membership.b1Desc" },
        { titleKey: "membership.b2Title", descKey: "membership.b2Desc" },
        { titleKey: "membership.b3Title", descKey: "membership.b3Desc" },
        { titleKey: "membership.b4Title", descKey: "membership.b4Desc" },
    ] as const;

    return (
        <>
            <Seo title={t("membership.title")} description={t("membership.subtitle")} />

            <div className="mp-root">
                <style>{`
                    .mp-root * { box-sizing: border-box; margin: 0; padding: 0; }
                    .mp-hero {
                        background: linear-gradient(135deg, #1b2a4a 0%, #24365e 100%);
                        color: #fff; padding: 64px 20px; text-align: center;
                    }
                    .mp-hero-badge {
                        display: inline-block; padding: 5px 14px; border-radius: 20px;
                        background: rgba(232,64,28,0.2); border: 1px solid rgba(232,64,28,0.5);
                        color: #ffb4a0; font-size: 11.5px; font-weight: 700;
                        letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 18px;
                    }
                    .mp-hero h1 { font-size: 34px; font-weight: 800; letter-spacing: -0.02em; }
                    .mp-hero p {
                        max-width: 560px; margin: 14px auto 0; font-size: 15px;
                        color: rgba(255,255,255,0.75); line-height: 1.7;
                    }
                    .mp-body { max-width: 960px; margin: 0 auto; padding: 48px 20px 64px; }
                    .mp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
                    .mp-card {
                        background: #fff; border: 1px solid #e8edf3; border-radius: 16px;
                        padding: 24px; transition: transform 0.15s ease, box-shadow 0.15s ease;
                    }
                    .mp-card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(15,23,42,0.08); }
                    .mp-card-icon {
                        width: 44px; height: 44px; border-radius: 12px;
                        background: #fff4f1; color: #e8401c;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 19px; margin-bottom: 14px;
                    }
                    .mp-card h3 { font-size: 15px; font-weight: 700; color: #1b2a4a; margin-bottom: 7px; }
                    .mp-card p { font-size: 13px; color: #64748b; line-height: 1.65; }
                    .mp-cta {
                        margin-top: 40px; background: #fff4f1; border: 1px solid #ffd9cf;
                        border-radius: 16px; padding: 32px; text-align: center;
                    }
                    .mp-cta h2 { font-size: 21px; font-weight: 800; color: #1b2a4a; }
                    .mp-cta p { font-size: 13.5px; color: #64748b; margin: 8px 0 20px; }
                    .mp-cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
                    .mp-join-btn {
                        display: inline-flex; align-items: center; gap: 8px;
                        background: #e8401c; color: #fff; border: none; border-radius: 10px;
                        padding: 0 22px; height: 44px; font-size: 14px; font-weight: 700;
                        text-decoration: none; transition: background 0.2s;
                    }
                    .mp-join-btn:hover { background: #c2340f; }
                    .mp-signin-link {
                        display: inline-flex; align-items: center; height: 44px;
                        font-size: 13.5px; font-weight: 600; color: #1b2a4a; text-decoration: none;
                    }
                    .mp-signin-link:hover { color: #e8401c; text-decoration: underline; }
                    @media (max-width: 600px) {
                        .mp-hero { padding: 44px 16px; }
                        .mp-hero h1 { font-size: 26px; }
                    }
                `}</style>

                <section className="mp-hero">
                    <div className="mp-hero-badge">
                        <i className="bi bi-stars me-1"></i>
                        {t("membership.badge")}
                    </div>
                    <h1>{t("membership.title")}</h1>
                    <p>{t("membership.subtitle")}</p>
                </section>

                <section className="mp-body">
                    <div className="mp-grid">
                        {benefits.map((b, i) => (
                            <div className="mp-card" key={b.titleKey}>
                                <div className="mp-card-icon">
                                    <i className={`bi ${BENEFIT_ICONS[i]}`}></i>
                                </div>
                                <h3>{t(b.titleKey)}</h3>
                                <p>{t(b.descKey)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mp-cta">
                        <h2>{t("membership.ctaTitle")}</h2>
                        <p>{t("membership.ctaDesc")}</p>
                        <div className="mp-cta-actions">
                            <Link className="mp-join-btn" to="/auth">
                                <i className="bi bi-person-plus"></i>
                                {t("membership.joinNow")}
                            </Link>
                            <Link className="mp-signin-link" to="/auth">
                                {t("membership.alreadyMember")} {t("membership.signIn")} →
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
