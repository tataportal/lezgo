import { useState } from 'react';
import { useTranslation } from '../i18n';
import './DeckPage.css';

type Mode = 'web2' | 'web3';

export default function DeckPage() {
  const { t, lang, setLang } = useTranslation();
  const [mode, setMode] = useState<Mode>('web2');
  const marqueeItems = ['LEZGO', 'Identity-based ticketing', 'Buy safer', 'Resell safer', 'No QR', 'Door trust'];

  const d = t.deck;
  const attendeeSteps = (mode === 'web2' ? d.attendeeProcessW2 : d.attendeeProcessW3).slice(0, 4);
  const organizerSteps = (mode === 'web2' ? d.organizerProcessW2 : d.organizerProcessW3).slice(0, 4);
  const organizerBenefits = (mode === 'web2' ? d.organizerBenefitsW2 : d.organizerBenefitsW3).slice(0, 3);
  const consumerBenefits = (mode === 'web2' ? d.consumerBenefitsW2 : d.consumerBenefitsW3).slice(0, 3);
  const organizerPillars = d.solutionPillarsOrg?.slice(0, 2) ?? [];
  const consumerPillars = d.solutionPillarsCon?.slice(0, 2) ?? [];
  const problemCases = d.problemCases ?? [];
  const tractionItems = d.tractionItems.slice(0, 2);
  const competitors = d.competitors?.slice(0, 2) ?? [];

  return (
    <div className="dk">
      {/* Marquee */}
      <div className="dk-marquee">
        <div className="dk-marquee-track">
          {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={`${item}-${i}`} className="dk-marquee-item">
              {item}
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
              <button className={`dk-tog ${lang === 'zh' ? 'dk-tog--on' : ''}`} onClick={() => setLang('zh')}>中文</button>
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

      {/* Vision */}
      <section className="dk-section dk-vision-section">
        <div className="dk-section-inner dk-vision-inner">
          <div className="dk-vision-copy">
            <div className="dk-agnostic-callout">
              <div className="dk-label">{d.agnosticLabel}</div>
              <h2>{d.agnosticTitle}</h2>
              <p className="dk-section-desc">{d.agnosticDesc}</p>
            </div>
          </div>
          <div className="dk-vision-lines">
            {d.visionItems.map((item: string, i: number) => (
              <div key={i} className="dk-vision-line">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="dk-section dk-section--problem">
        <div className="dk-section-inner">
          <div className="dk-problem-copy">
            <div className="dk-label">{d.problemLabel}</div>
            <h2>{d.problemTitle}</h2>
          </div>

          {problemCases.length > 0 && (
            <div className="dk-cases-grid">
              {problemCases.map((item: { source: string; title: string; detail: string }, i: number) => (
                <div key={i} className="dk-case-card">
                  <div className="dk-case-source">{item.source}</div>
                  <div className="dk-case-title">{item.title}</div>
                  <div className="dk-case-detail">{item.detail}</div>
                </div>
              ))}
            </div>
          )}

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
          <div className="dk-solution-copy">
            <div className="dk-label">{d.solutionLabel}</div>
            <h2>{mode === 'web2' ? d.solutionTitleW2 : d.solutionTitleW3}</h2>
            <p className="dk-section-desc">{mode === 'web2' ? d.solutionDescW2 : d.solutionDescW3}</p>
          </div>

          {/* Solution Pillars */}
          {organizerPillars.length > 0 && consumerPillars.length > 0 && (
            <div className="dk-pillars-row">
              <div className="dk-pillar-group dk-pillar-group--org">
                <h3>{d.forOrganizers}</h3>
                <div className="dk-pillars">
                  {organizerPillars.map((p: string, i: number) => (
                    <div key={i} className="dk-pillar">{p}</div>
                  ))}
                </div>
              </div>
              <div className="dk-pillar-group dk-pillar-group--con">
                <h3>{d.forConsumers}</h3>
                <div className="dk-pillars">
                  {consumerPillars.map((p: string, i: number) => (
                    <div key={i} className="dk-pillar">{p}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="dk-value-grid">
            <div className="dk-value-col">
              <h3>{d.forOrganizers}</h3>
              <ul className="dk-value-list">
                {organizerBenefits.map((b: string, i: number) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
            <div className="dk-value-col">
              <h3>{d.forConsumers}</h3>
              <ul className="dk-value-list">
                {consumerBenefits.map((b: string, i: number) => (
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
          {d.howSubtitleW2 && (
            <p className="dk-section-desc dk-how-subtitle">
              {mode === 'web2' ? d.howSubtitleW2 : d.howSubtitleW3}
            </p>
          )}

          {/* Attendee Flow */}
          <div className="dk-flow-block">
            <h3>{d.attendeeFlow}</h3>
            <div className="dk-flow">
              {attendeeSteps.map((step: { title: string; benefit: string }, i: number) => (
                <div key={i} className="dk-flow-item">
                  <div className="dk-flow-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="dk-flow-copy">
                    <div className="dk-flow-text">{step.title}</div>
                    <div className="dk-flow-benefit">{step.benefit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organizer Flow */}
          <div className="dk-flow-block">
            <h3>{d.organizerFlow}</h3>
            <div className="dk-flow">
              {organizerSteps.map((step: { title: string; benefit: string }, i: number) => (
                <div key={i} className="dk-flow-item">
                  <div className="dk-flow-num">{String(i + 1).padStart(2, '0')}</div>
                  <div className="dk-flow-copy">
                    <div className="dk-flow-text">{step.title}</div>
                    <div className="dk-flow-benefit">{step.benefit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Web3-only: Tech stack */}
          {mode === 'web3' && (
            <div className="dk-tech-stack">
              <h3>{d.techStackTitle}</h3>
              {d.techStackDesc && <p className="dk-tech-desc">{d.techStackDesc}</p>}
              <div className="dk-tech-grid">
                {d.techFeatures.map((f: { title: string; desc: string }, i: number) => (
                  <div key={i} className="dk-tech-card">
                    <div className="dk-tech-title">{f.title}</div>
                    <div className="dk-tech-desc-text">{f.desc}</div>
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
              <div className="dk-rev-tag">{d.rev1Tag}</div>
              <div className="dk-rev-pct">{d.rev1Pct}</div>
              <div className="dk-rev-name">{mode === 'web2' ? d.revDirectSale : d.revMinting}</div>
              <p>{mode === 'web2' ? d.revDirectSaleDesc : d.revMintingDesc}</p>
            </div>
            <div className="dk-rev-card">
              <div className="dk-rev-tag">{d.rev2Tag}</div>
              <div className="dk-rev-pct">{d.rev2Pct}</div>
              <div className="dk-rev-name">{d.revResale}</div>
              <p>{mode === 'web2' ? d.revResaleDescW2 : d.revResaleDescW3}</p>
            </div>
            <div className="dk-rev-card">
              <div className="dk-rev-tag">{d.rev3Tag}</div>
              <div className="dk-rev-pct">{d.rev3Pct}</div>
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
            {tractionItems.map((item: { val: string; label: string }, i: number) => (
              <div key={i} className="dk-traction-card">
                <div className="dk-traction-val">{item.val}</div>
                <div className="dk-traction-label">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitors */}
      {competitors.length > 0 && (
        <section className="dk-section">
          <div className="dk-section-inner">
            <div className="dk-label">{d.competitorsLabel}</div>
            <h2>{d.competitorsTitle}</h2>
            <p className="dk-section-desc">{d.competitorsDesc}</p>
            <div className="dk-competitors-grid">
              {competitors.map((c: { name: string; weakness: string }, i: number) => (
                <div key={i} className="dk-competitor-card">
                  <div className="dk-competitor-name">{c.name}</div>
                  <div className="dk-competitor-weakness">{c.weakness}</div>
                </div>
              ))}
            </div>
            <div className="dk-competitors-edge">
              {d.competitorsEdge}
            </div>
          </div>
        </section>
      )}

      {/* Competitive Edge */}
      <section className="dk-section dk-section--alt">
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

      {/* Roadmap */}
      {d.roadmapPhases && (
        <section className="dk-section">
          <div className="dk-section-inner">
            <div className="dk-label">{d.roadmapLabel}</div>
            <h2>{d.roadmapTitle}</h2>
            <div className="dk-roadmap">
              {d.roadmapPhases.map((p: { phase: string; title: string; items: string[] }, i: number) => (
                <div key={i} className={`dk-roadmap-card ${i === 0 ? 'dk-roadmap-card--active' : ''}`}>
                  <div className="dk-roadmap-card-header">
                    <div className="dk-roadmap-dot" />
                    <div className="dk-roadmap-time">{p.phase}</div>
                  </div>
                  {i < d.roadmapPhases.length - 1 && <div className="dk-roadmap-arrow">→</div>}
                  <div className="dk-roadmap-title">{p.title}</div>
                  <ul className="dk-roadmap-items">
                    {p.items.map((item: string, j: number) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Team */}
      <section className="dk-section dk-section--alt">
        <div className="dk-section-inner">
          <div className="dk-label">{d.teamLabel}</div>
          <div className="dk-team-layout">
            <div className="dk-team-copy">
              <h2>{d.teamTitle}</h2>
              <p className="dk-section-desc dk-team-desc">{d.teamDesc}</p>
            </div>
            <div className="dk-team-card">
              <div className="dk-team-avatar">T</div>
              <div className="dk-team-content">
                <div className="dk-team-eyebrow">{d.teamLead}</div>
                <div className="dk-team-name">{d.teamFounderName}</div>
                <div className="dk-team-role">{d.teamRole}</div>
              </div>
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
