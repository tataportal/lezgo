import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { toDate, formatDateES, getEventImage } from '../lib/helpers';
import { FhButton } from '../components/ui/FhButton';
import './EventsPage.css';

export default function EventsPage() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { events, loading } = useEvents({ status: 'published' });

  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [locOpen, setLocOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  const locRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setDateOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const featuredEvent = useMemo(() => {
    if (!events) return null;
    return events.find(e => e.featured && e.status !== 'sold-out') || null;
  }, [events]);

  const locationOptions = useMemo(() => {
    if (!events) return [];
    const locs = new Set<string>();
    events.forEach(e => { if (e.location) locs.add(e.location); });
    return Array.from(locs).sort();
  }, [events]);

  const monthOptions = useMemo(() => {
    if (!events) return [];
    const months = new Map<string, string>();
    events.forEach(e => {
      const d = toDate(e.date);
      if (d instanceof Date && !isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!months.has(key)) {
          const label = `${t.home.monthsFull[d.getMonth()]} ${d.getFullYear()}`;
          months.set(key, label);
        }
      }
    });
    return Array.from(months.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }));
  }, [events, t.home.monthsFull]);

  const filtered = useMemo(() => {
    if (!events) return [];
    return events
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .filter(e => {
        if (selectedLocation !== 'all' && e.location !== selectedLocation) return false;
        if (selectedMonth !== 'all') {
          const d = toDate(e.date);
          if (d instanceof Date && !isNaN(d.getTime())) {
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (key !== selectedMonth) return false;
          } else return false;
        }
        if (searchText.trim()) {
          const q = searchText.toLowerCase();
          return (
            e.name?.toLowerCase().includes(q) ||
            e.venue?.toLowerCase().includes(q) ||
            e.location?.toLowerCase().includes(q) ||
            e.genre?.toLowerCase().includes(q) ||
            e.lineup?.some((a: string) => a.toLowerCase().includes(q))
          );
        }
        return true;
      });
  }, [events, searchText, selectedLocation, selectedMonth]);

  const handleSearch = () => {
    const grid = document.getElementById('eventos-grid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="eventos-page">
      {/* Featured Event Hero */}
      {featuredEvent && (
        <section className="ev-hero" onClick={() => navigate(`/evento/${featuredEvent.slug || featuredEvent.id}`)}>
          <div className="ev-hero-img" style={{ backgroundImage: `url(${getEventImage(featuredEvent.id, featuredEvent.image, featuredEvent.genre)})` }} />
          <div className="ev-hero-overlay" />
          <div className="ev-hero-content">
            <span className="ev-hero-badge">{t.home.featured}</span>
            <h2 className="ev-hero-title">{featuredEvent.name}</h2>
            {featuredEvent.subtitle && <p className="ev-hero-subtitle">{featuredEvent.subtitle}</p>}
            <p className="ev-hero-meta">
              {formatDateES(toDate(featuredEvent.date), lang)}
              {featuredEvent.venue ? ` · ${featuredEvent.venue}` : ''}
              {featuredEvent.location ? `, ${featuredEvent.location}` : ''}
            </p>
          </div>
        </section>
      )}

      <div className="eventos-header">
        <h1 className="eventos-title">{t.organizer.allEvents}</h1>
        <p className="eventos-subtitle">{filtered.length} {filtered.length === 1 ? t.common.eventSingular : t.common.eventPlural}</p>
      </div>

      {/* ── Search Bar — same as HomePage ── */}
      <div className="search-section ev-search-section">
        <div className="search-bar">
          {/* Location dropdown */}
          <div
            className={`search-field${locOpen ? ' search-field--active' : ''}`}
            ref={locRef}
            onClick={() => { setLocOpen(!locOpen); setDateOpen(false); }}
          >
            <div className="search-field-label">{t.home.location}</div>
            <div className="search-field-value">
              {selectedLocation === 'all' ? t.home.locationDefault : selectedLocation}
              <svg className="search-field-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
            </div>
            {locOpen && (
              <div className="search-dropdown" onClick={e => e.stopPropagation()}>
                <div className={`search-dropdown-item${selectedLocation === 'all' ? ' active' : ''}`} onClick={() => { setSelectedLocation('all'); setLocOpen(false); }}>
                  {t.home.locationDefault}
                </div>
                {locationOptions.map(loc => (
                  <div key={loc} className={`search-dropdown-item${selectedLocation === loc ? ' active' : ''}`} onClick={() => { setSelectedLocation(loc); setLocOpen(false); }}>
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Month dropdown */}
          <div
            className={`search-field${dateOpen ? ' search-field--active' : ''}`}
            ref={dateRef}
            onClick={() => { setDateOpen(!dateOpen); setLocOpen(false); }}
          >
            <div className="search-field-label">{t.home.dates}</div>
            <div className="search-field-value">
              {selectedMonth === 'all' ? t.home.allDates : monthOptions.find(m => m.key === selectedMonth)?.label || t.home.allDates}
              <svg className="search-field-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
            </div>
            {dateOpen && (
              <div className="search-dropdown" onClick={e => e.stopPropagation()}>
                <div className={`search-dropdown-item${selectedMonth === 'all' ? ' active' : ''}`} onClick={() => { setSelectedMonth('all'); setDateOpen(false); }}>
                  {t.home.allDates}
                </div>
                {monthOptions.map(m => (
                  <div key={m.key} className={`search-dropdown-item${selectedMonth === m.key ? ' active' : ''}`} onClick={() => { setSelectedMonth(m.key); setDateOpen(false); }}>
                    {m.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search text */}
          <div className="search-field search-field--main">
            <div className="search-field-label">{t.home.search || t.common.search}</div>
            <input
              className="search-input"
              type="text"
              placeholder={t.home.searchPlaceholder}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <FhButton onClick={handleSearch} arrowLength={24}>
            {t.home.search || t.common.search}
          </FhButton>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="eventos-loading">
          <div className="eventos-loader">
            <div className="loader-logo">LEZGO</div>
            <div className="loader-bars">
              <span /><span /><span /><span /><span />
            </div>
            <div className="loader-text">{t.home.loadingEvents}</div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="eventos-empty">
          <span style={{ fontSize: '2rem', marginBottom: '0.75rem', display: 'block' }}>🔍</span>
          <p>{t.common.noSearchResults}</p>
        </div>
      ) : (
        <div className="eventos-grid" id="eventos-grid">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
