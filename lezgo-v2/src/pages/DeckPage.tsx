import { useState } from 'react';
import { useTranslation } from '../i18n';
import './DeckPage.css';

type Mode = 'web2' | 'web3';

export default function DeckPage() {
  const { t, lang, setLang } = useTranslation();
  const [mode, setMode] = useState<Mode>('web2');

  const d = t.deck;

  return (
    <div className="dk">
      {/* Marquee */}
      <div className="dk-marquee">
        <div className="dk-marquee-track">
          {Array(3).fill(null).map((_, i) => (
            <span key={i} className="dk-marquee-segment">
              LEZGO &middot; BUY &middot; SELL &middot; RESELL &middot; SAFE &middot;&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* Sticky Header with Toggles */}
      <header className="dk-header">
        <div className="dk-header-inner">
          <div className="dk-logo">LEZGO</div>
          <div className="dk-toggles">
            <div className="dk-toggle-group">
              <button className={`dk-tog ${lang === 'es' ? 'dk-tog--on' : ''}`} onClick={() => setLang('es')}>ES</button>
              <button className={`dk-tog ${lang === 'en' ? 'dk-tog--on' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>
            <div className="dk-toggle-group dk-toggle-mode">
              <button className={`dk-tog ${mode === 'web2' ? 'dk-tog--on' : ''}`} onClick={() => setMode('web2')}>Web2</button>
              <button className={`dk-tog ${mode === 'web3' ? 'dk-tog--on' : ''}`} onClick={() => setMode('web3')}>Web3</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="dk-hero">
        <div className="dk-hero-glow" />
        <div className="dk-hero-content">
          <div className="dk-hero-pill">{d.heroPill}</div>
          <h1 className="dk-hero-title">
            {d.heroTitle}
          </h1>
          <p className="dk-hero-sub">{mode === 'web2' ? d.heroDescW2 : d.heroDescW3}</p>
          <a href={`mailto:${d.contactEmail}`} className="dk-cta">
            {d.contactTeam} →
          </a>
        </div>
      </section>

      {/* The Problem */}
      <section className="dk-section">
        <div className="dk-section-inner">
          <div className="dk-label">{d.problemLabel}</div>
          <h2>{d.problemTitle}</h2>
          <p className="dk-section-desc">{mode === 'web2' ? d.problemDescW2 : d.problemDescW3}</p>
          <div className="dk-stats-row">
            <div className="dk-stat">
              <div className="dk-stat-val dk-stat-val--bad">$12B+</div>
              <div className="dk-stat-label">{d.statFraud}</div>
            </div>
            <div className="dk-stat">
              <div className="dk-stat-val dk-stat-val--bad">300%</div>
              <div className="dk-stat-label">{d.statMarkup}</div>
            </div>
            <div className="dk-stat">
              <div className="dk-stat-val dk-stat-val--bad">12%</div>
              <div className="dk-stat-label">{d.statFake}</div>
            </div>
            <div className="dk-stat">
              <div className="dk-stat-val dk-stat-val--bad">0%</div>
              <div className="dk-stat-label">{d.statTransparency}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="dk-section dk-section--alt">
        <div className="dk-section-inner">
          <div className="dk-label">{d.solutionLabel}</div>
          <h2>{mode === 'web2' ? d.solutionTitleW2 : d.solutionTitleW3}</h2>
          <p className="dk-section-desc">{mode === 'web2' ? d.solutionDescW2 : d.solutionDescW3}</p>

          <div className="dk-value-grid">
            <div className="dk-value-col">
              <h3>{d.forConsumers}</h3>
              <ul className="dk-value-list">
                {(mode === 'web2' ? d.consumerBenefitsW2 : d.consumerBenefitsW3).map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="dk-value-col">
              <h3>{d.forOrganizers}</h3>
              <ul className="dk-value-list">
                {(mode === 'web2' ? d.organizerBenefitsW2 : d.organizerBenefitsW3).map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="dk-section">
        <div className="dk-section-inner">
          <div className="dk-label">{d.howLabel}</div>
          <h2>{d.howTitle}</h2>

          {/* Attendee Flow */}
          <div className="dk-flow-block">
            <h3>{d.attendeeFlow}</h3>
            <div className="dk-flow">
              {(mode === 'web2' ? d.attendeeStepsW2 : d.attendeeStepsW3).map((step: string, i: number) => (
                <div key={i} className="dk-flow-item">
                  <div className="dk-flow-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="dk-flow-text">{step}</div>
                  {i < (mode === 'web2' ? d.attendeeStepsW2 : d.attendeeStepsW3).length - 1 && (
                    <div className="dk-flow-arrow">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Organizer Flow */}
          <div className="dk-flow-block">
            <h3>{d.organizerFlow}</h3>
            <div className="dk-flow">
              {(mode === 'web2' ? d.organizerStepsW2 : d.organizerStepsW3).map((step: string, i: number) => (
                <div key={i} className="dk-flow-item">
                  <div className="dk-flow-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="dk-flow-text">{step}</div>
                  {i < (mode === 'web2' ? d.organizerStepsW2 : d.organizerStepsW3).length - 1 && (
                    <div className="dk-flow-arrow">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Web3-only: Tech stack */}
          {mode === 'web3' && (
            <div className="dk-tech-stack">
              <h3>{d.techStackTitle}</h3>
              <div className="dk-tech-grid">
                {d.techFeatures.map((f: { title: string; desc: string }, i: number) => (
                  <div key={i} className="dk-tech-card">
                    <div className="dk-tech-title">{f.title}</div>
                    <div className="dk-tech-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Business Model */}
      <section className="dk-section dk-section--alt">
        <div className="dk-section-inner">
          <div className="dk-label">{d.bizLabel}</div>
          <h2>{d.bizTitle}</h2>
          <p className="dk-section-desc">{mode === 'web2' ? d.bizDescW2 : d.bizDescW3}</p>

          <div className="dk-revenue-grid">
            <div className="dk-rev-card">
              <div className="dk-rev-tag">REV 1 — B2B</div>
              <div className="dk-rev-pct">{mode === 'web2' ? '5-8%' : '< 15%'}</div>
              <div className="dk-rev-name">{mode === 'web2' ? d.revDirectSale : d.revMinting}</div>
              <p>{mode === 'web2' ? d.revDirectSaleDesc : d.revMintingDesc}</p>
            </div>
            <div className="dk-rev-card">
              <div className="dk-rev-tag">REV 2 — B2C</div>
              <div className="dk-rev-pct">{'< 10%'}</div>
              <div className="dk-rev-name">{d.revResale}</div>
              <p>{mode === 'web2' ? d.revResaleDescW2 : d.revResaleDescW3}</p>
            </div>
            <div className="dk-rev-card">
              <div className="dk-rev-tag">REV 3 — B2B</div>
              <div className="dk-rev-pct">TBD</div>
              <div className="dk-rev-name">{d.revData}</div>
              <p>{d.revDataDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Market */}
      <section className="dk-section">
        <div className="dk-section-inner">
          <div className="dk-label">{d.marketLabel}</div>
          <h2>{d.marketTitle}</h2>
          <div className="dk-market-row">
            <div className="dk-market-card">
              <div className="dk-market-year">2023</div>
              <div className="dk-market-val">USD $77.5B</div>
              <div className="dk-market-label">{d.marketCurrent}</div>
            </div>
            <div className="dk-market-arrow">→</div>
            <div className="dk-market-card dk-market-card--target">
              <div className="dk-market-year">2028</div>
              <div className="dk-market-val">USD $97.4B</div>
              <div className="dk-market-label">CAGR 4.67%</div>
            </div>
          </div>
          <div className="dk-market-sub">
            <p>{d.marketDesc}</p>
            {mode === 'web3' && <p>{d.marketDescW3}</p>}
          </div>
        </div>
      </section>

      {/* Traction */}
      <section className="dk-section dk-section--alt">
        <div className="dk-section-inner">
          <div className="dk-label">{d.tractionLabel}</div>
          <h2>{d.tractionTitle}</h2>
          <div className="dk-traction-grid">
            {d.tractionItems.map((item: { val: string; label: string }, i: number) => (
              <div key={i} className="dk-traction-card">
                <div className="dk-traction-val">{item.val}</div>
                <div className="dk-traction-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitive Edge */}
      <section className="dk-section">
        <div className="dk-section-inner">
          <div className="dk-label">{d.edgeLabel}</div>
          <h2>{d.edgeTitle}</h2>
          <div className="dk-edge-grid">
            {(mode === 'web2' ? d.edgeItemsW2 : d.edgeItemsW3).map((item: { title: string; desc: string }, i: number) => (
              <div key={i} className="dk-edge-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="dk-section dk-section--alt">
        <div className="dk-section-inner">
          <div className="dk-label">{d.teamLabel}</div>
          <h2>{d.teamTitle}</h2>
          <div className="dk-team-card">
            <div className="dk-team-avatar">T</div>
            <div>
              <div className="dk-team-name">{d.teamLead}</div>
              <div className="dk-team-role">{d.teamRole}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="dk-footer">
        <div className="dk-footer-inner">
          <h2>{d.ctaTitle}</h2>
          <p>{d.ctaDesc}</p>
          <a href={`mailto:${d.contactEmail}`} className="dk-cta dk-cta--lg">
            {d.contactEmail}
          </a>
          <div className="dk-footer-copy">LEZGO &middot; Lima, Peru &middot; {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
