import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useEvents } from '../hooks/useEvents';
import { EventCard } from '../components/events/EventCard';
import { toDate, formatDateES, getEventImage } from '../lib/helpers';
import './EventsPage.css';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(day: Date, from: Date | null, to: Date | null) {
  if (!from || !to) return false;
  const t = day.getTime();
  return t >= from.getTime() && t <= to.getTime();
}

export default function EventsPage() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const { events, loading } = useEvents({ status: 'published' });
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);
  const [locOpen, setLocOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [selectedDows, setSelectedDows] = useState<Set<number>>(new Set()); // 0=Sun..6=Sat
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

  // Event dates set for highlighting days with events
  const eventDatesSet = useMemo(() => {
    const set = new Set<string>();
    events?.forEach(e => {
      const d = toDate(e.date);
      if (d instanceof Date && !isNaN(d.getTime())) {
        set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return set;
  }, [events]);

  const handleDayClick = useCallback((day: Date) => {
    setSelectedDows(new Set()); // clear day-of-week filter when picking dates
    if (!dateFrom || (dateFrom && dateTo)) {
      setDateFrom(day);
      setDateTo(null);
    } else {
      if (day.getTime() < dateFrom.getTime()) {
        setDateTo(dateFrom);
        setDateFrom(day);
      } else {
        setDateTo(day);
      }
    }
  }, [dateFrom, dateTo]);

  const handleDowClick = useCallback((dowIndex: number) => {
    setSelectedDows(prev => {
      const next = new Set(prev);
      if (next.has(dowIndex)) next.delete(dowIndex);
      else next.add(dowIndex);
      return next;
    });
    setDateFrom(null);
    setDateTo(null);
  }, []);

  const handleSelectMonth = useCallback(() => {
    setSelectedDows(new Set());
    const first = new Date(calYear, calMonth, 1);
    const last = new Date(calYear, calMonth, getDaysInMonth(calYear, calMonth));
    setDateFrom(first);
    setDateTo(last);
  }, [calYear, calMonth]);

  const handleClearDates = useCallback(() => {
    setDateFrom(null);
    setDateTo(null);
    setSelectedDows(new Set());
  }, []);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Determine visual range end (hover preview or actual selection)
  const visualTo = dateTo || (dateFrom && hoverDate && hoverDate.getTime() >= dateFrom.getTime() ? hoverDate : null);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay = getFirstDayOfWeek(calYear, calMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(calYear, calMonth, d));
    return cells;
  }, [calYear, calMonth]);

  const dateLabel = useMemo(() => {
    if (selectedDows.size > 0) return Array.from(selectedDows).sort().map(d => t.home.days[d]).join(', ');
    if (!dateFrom) return t.home.allDates;
    const fmt = (d: Date) => `${d.getDate()} ${t.home.months[d.getMonth()]}`;
    if (!dateTo || isSameDay(dateFrom, dateTo)) return fmt(dateFrom);
    if (dateFrom.getDate() === 1 && dateTo.getDate() === getDaysInMonth(dateTo.getFullYear(), dateTo.getMonth())
      && dateFrom.getMonth() === dateTo.getMonth() && dateFrom.getFullYear() === dateTo.getFullYear()) {
      return `${t.home.monthsFull[dateFrom.getMonth()]} ${dateFrom.getFullYear()}`;
    }
    return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
  }, [dateFrom, dateTo, selectedDows, t.home.months, t.home.monthsFull, t.home.days]);

  const filtered = useMemo(() => {
    if (!events) return [];
    return events
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .filter(e => {
        if (selectedLocation !== 'all' && e.location !== selectedLocation) return false;
        if (selectedDows.size > 0) {
          const d = toDate(e.date);
          if (d instanceof Date && !isNaN(d.getTime())) {
            if (!selectedDows.has(d.getDay())) return false;
          } else return false;
        }
        if (dateFrom) {
          const d = toDate(e.date);
          if (d instanceof Date && !isNaN(d.getTime())) {
            const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            if (dayStart < new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate())) return false;
            if (dateTo && dayStart > new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate())) return false;
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
  }, [events, searchText, selectedLocation, dateFrom, dateTo, selectedDows]);

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

      <div className="eventos-filters">
        {/* Location dropdown */}
        <div className={`ef-field${locOpen ? ' ef-field--active' : ''}`} ref={locRef} onClick={() => { setLocOpen(!locOpen); setDateOpen(false); }}>
          <div className="ef-field-value">
            {selectedLocation === 'all' ? t.home.locationDefault : selectedLocation}
            <svg className="ef-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
          </div>
          {locOpen && (
            <div className="ef-dropdown" onClick={e => e.stopPropagation()}>
              <div className={`ef-dropdown-item${selectedLocation === 'all' ? ' active' : ''}`} onClick={() => { setSelectedLocation('all'); setLocOpen(false); }}>
                {t.home.locationDefault}
              </div>
              {locationOptions.map(loc => (
                <div key={loc} className={`ef-dropdown-item${selectedLocation === loc ? ' active' : ''}`} onClick={() => { setSelectedLocation(loc); setLocOpen(false); }}>
                  {loc}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Date range calendar */}
        <div className={`ef-field${dateOpen ? ' ef-field--active' : ''}${dateFrom || selectedDows.size > 0 ? ' ef-field--has-value' : ''}`} ref={dateRef} onClick={() => { setDateOpen(!dateOpen); setLocOpen(false); }}>
          <div className="ef-field-value">
            {dateLabel}
            <svg className="ef-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 4.5L6 7.5L9 4.5"/></svg>
          </div>
          {dateOpen && (
            <div className="ef-calendar" onClick={e => e.stopPropagation()}>
              <div className="ef-cal-header">
                <button className="ef-cal-nav" onClick={prevMonth}>‹</button>
                <span className="ef-cal-title">{t.home.monthsFull[calMonth]} {calYear}</span>
                <button className="ef-cal-nav" onClick={nextMonth}>›</button>
              </div>
              <div className="ef-cal-grid">
                {t.home.days.map((d: string, di: number) => (
                  <div
                    key={d}
                    className={`ef-cal-dayname${selectedDows.has(di) ? ' ef-cal-dayname--active' : ''}`}
                    onClick={() => handleDowClick(di)}
                  >
                    {d}
                  </div>
                ))}
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="ef-cal-cell ef-cal-empty" />;
                  const isStart = dateFrom && isSameDay(day, dateFrom);
                  const isEnd = dateTo && isSameDay(day, dateTo);
                  const inRange = isInRange(day, dateFrom, visualTo);
                  const hasEvent = eventDatesSet.has(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`);
                  const isDowSelected = selectedDows.has(day.getDay());
                  return (
                    <button
                      key={day.getDate()}
                      className={`ef-cal-cell${isStart ? ' ef-cal-start' : ''}${isEnd ? ' ef-cal-end' : ''}${inRange ? ' ef-cal-in-range' : ''}${isDowSelected ? ' ef-cal-dow-active' : ''}${hasEvent ? ' ef-cal-has-event' : ''}`}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => { if (dateFrom && !dateTo) setHoverDate(day); }}
                      onMouseLeave={() => setHoverDate(null)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="ef-cal-actions">
                <button className="ef-cal-action" onClick={handleSelectMonth}>
                  {t.home.monthsFull[calMonth]}
                </button>
                <button className="ef-cal-action" onClick={handleClearDates}>
                  {t.common.clear}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="ef-search">
          <input
            type="text"
            placeholder={t.home.searchPlaceholder}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
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
        <div className="eventos-grid">
          {filtered.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
