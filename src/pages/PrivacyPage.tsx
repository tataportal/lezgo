import { useTranslation } from '../i18n';
import './LegalPage.css';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-badge">LEZGO.FANS</div>
        <h1 className="legal-title">{t.legal.privacyTitle}</h1>
        <p className="legal-updated">{t.legal.lastUpdated}: 2026-03-14</p>

        <section className="legal-section">
          <h2>{t.legal.dataControllerTitle}</h2>
          <p>{t.legal.dataControllerDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.dataCollectedTitle}</h2>
          <p>{t.legal.dataCollectedDesc}</p>
          <ul className="legal-list">
            <li>{t.legal.dataName}</li>
            <li>{t.legal.dataEmail}</li>
            <li>{t.legal.dataDni}</li>
            <li>{t.legal.dataDevice}</li>
            <li>{t.legal.dataPurchase}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.dataPurposeTitle}</h2>
          <ul className="legal-list">
            <li>{t.legal.purposeIdentity}</li>
            <li>{t.legal.purposeTickets}</li>
            <li>{t.legal.purposeFraud}</li>
            <li>{t.legal.purposeAnalytics}</li>
            <li>{t.legal.purposeComms}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.dataProtectionTitle}</h2>
          <p>{t.legal.dataProtectionDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.dataRetentionTitle}</h2>
          <p>{t.legal.dataRetentionDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.userRightsTitle}</h2>
          <p>{t.legal.userRightsDesc}</p>
          <ul className="legal-list">
            <li>{t.legal.rightAccess}</li>
            <li>{t.legal.rightRectify}</li>
            <li>{t.legal.rightDelete}</li>
            <li>{t.legal.rightObject}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.thirdPartyTitle}</h2>
          <p>{t.legal.thirdPartyDesc}</p>
          <ul className="legal-list">
            <li>Firebase (Google) — {t.legal.thirdPartyAuth}</li>
            <li>Cloudflare Pages — {t.legal.thirdPartyHosting}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.cookiesTitle}</h2>
          <p>{t.legal.cookiesDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.contactTitle}</h2>
          <p>{t.legal.contactDesc}</p>
          <p className="legal-email">contacto@lezgo.fans</p>
        </section>
      </div>
    </div>
  );
}
