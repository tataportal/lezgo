import { useTranslation } from '../i18n';
import './LegalPage.css';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-badge">LEZGO.FANS</div>
        <h1 className="legal-title">{t.legal.termsTitle}</h1>
        <p className="legal-updated">{t.legal.lastUpdated}: 2026-03-14</p>

        <section className="legal-section">
          <h2>{t.legal.acceptanceTitle}</h2>
          <p>{t.legal.acceptanceDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.serviceDescTitle}</h2>
          <p>{t.legal.serviceDescDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.accountTitle}</h2>
          <ul className="legal-list">
            <li>{t.legal.accountAge}</li>
            <li>{t.legal.accountAccurate}</li>
            <li>{t.legal.accountSecurity}</li>
            <li>{t.legal.accountResponsible}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.purchaseTitle}</h2>
          <ul className="legal-list">
            <li>{t.legal.purchaseBinding}</li>
            <li>{t.legal.purchaseIdentity}</li>
            <li>{t.legal.purchaseLimit}</li>
            <li>{t.legal.purchasePrice}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.resaleTitle}</h2>
          <ul className="legal-list">
            <li>{t.legal.resaleCap}</li>
            <li>{t.legal.resaleFee}</li>
            <li>{t.legal.resaleIdentity}</li>
            <li>{t.legal.resaleRight}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.transferTitle}</h2>
          <p>{t.legal.transferDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.organizerTitle}</h2>
          <ul className="legal-list">
            <li>{t.legal.organizerAccurate}</li>
            <li>{t.legal.organizerResponsible}</li>
            <li>{t.legal.organizerFees}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.prohibitedTitle}</h2>
          <ul className="legal-list">
            <li>{t.legal.prohibitedFraud}</li>
            <li>{t.legal.prohibitedAbuse}</li>
            <li>{t.legal.prohibitedCopy}</li>
            <li>{t.legal.prohibitedBot}</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>{t.legal.liabilityTitle}</h2>
          <p>{t.legal.liabilityDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.modifyTitle}</h2>
          <p>{t.legal.modifyDesc}</p>
        </section>

        <section className="legal-section">
          <h2>{t.legal.governingTitle}</h2>
          <p>{t.legal.governingDesc}</p>
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
