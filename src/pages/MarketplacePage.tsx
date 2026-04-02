import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { getResaleListings } from '../services/resaleService';
import { LOCALE_MAP, toDate } from '../lib/helpers';
import type { Resale } from '../lib/types';
import ResaleCheckoutModal from '../components/checkout/ResaleCheckoutModal';
import { Icon } from '../components/ui';
import './MarketplacePage.css';

type OfertaFilter = 'todos' | 'oferta';
type SortBy = 'fecha' | 'precio';

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { t, lang } = useTranslation();
  const [listings, setListings] = useState<Resale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limaDistricts = t.marketplace.districts;
  const [locationFilter, setLocationFilter] = useState(limaDistricts[0]);
  const [locDropdown, setLocDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ofertaFilter, setOfertaFilter] = useState<OfertaFilter>('todos');
  const [sortBy, setSortBy] = useState<SortBy>('fecha');

  const [selectedResale, setSelectedResale] = useState<Resale | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getResaleListings({ status: 'listed' });
        setListings(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.marketplace.errorLoading;
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setLocDropdown(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filteredListings = useMemo(() => {
    let result = [...listings];

    if (locationFilter !== limaDistricts[0]) {
      result = result.filter((r) => (r.eventVenue || '').includes(locationFilter));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          (r.eventName?.toLowerCase() || '').includes(q) ||
          (r.ticketTier?.toLowerCase() || '').includes(q) ||
          (r.eventVenue?.toLowerCase() || '').includes(q)
      );
    }

    if (ofertaFilter === 'oferta') {
      result = result.filter((r) => r.askingPrice < r.originalPrice);
    }

    if (sortBy === 'fecha') {
      result.sort((a, b) => {
        const aD = a.createdAt ? toDate(a.createdAt) : new Date(0);
        const bD = b.createdAt ? toDate(b.createdAt) : new Date(0);
        return bD.getTime() - aD.getTime();
      });
    } else {
      result.sort((a, b) => (a.askingPrice ?? 0) - (b.askingPrice ?? 0));
    }

    return result;
  }, [listings, locationFilter, searchQuery, ofertaFilter, sortBy]);

  const handleListingClick = (resale: Resale) => {
    setSelectedResale(resale);
    setModalOpen(true);
  };

  return (
    <>
      <div className="mp">
        {/* Header */}
        <div className="mp-top">
          <div className="mp-intro">
            <div className="mp-label">// Marketplace</div>
            <h2 className="mp-title">
              {t.marketplace.title}<br />fans <span className="text-acid">{t.marketplace.titleHighlight}</span>
            </h2>
            <p className="mp-text">
              {t.marketplace.desc1}
            </p>
            <p className="mp-text">
              {t.marketplace.desc2}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mp-search-bar">
          {/* Location Dropdown */}
          <div
            className="mp-search-field"
            onClick={(e) => {
              e.stopPropagation();
              setLocDropdown(!locDropdown);
            }}
          >
            <div className="search-field-label">{t.marketplace.location}</div>
            <div className="search-field-value">{locationFilter}</div>
            <div className={`mp-dropdown ${locDropdown ? 'open' : ''}`}>
              {limaDistricts.map((d) => (
                <div
                  key={d}
                  className={`mp-dropdown-item ${locationFilter === d ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLocationFilter(d);
                    setLocDropdown(false);
                  }}
                >
                  <span className="dot" />
                  {d}
                </div>
              ))}
            </div>
          </div>

          {/* Search text */}
          <div className="mp-search-field mp-search-field-main" style={{ borderRight: 'none' }}>
            <div className="search-field-label">{t.common.search}</div>
            <input
              className="mp-search-text-input"
              type="text"
              placeholder={t.marketplace.searchPlaceholder}
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            />
          </div>

          <button className="search-btn">{t.common.search}</button>
        </div>

        {/* Filters */}
        <div className="mp-filters-row">
          <div className="mp-filters-left">
            <button
              className={`mp-filter ${ofertaFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setOfertaFilter('todos')}
            >
              {t.marketplace.all}
            </button>
            <button
              className={`mp-filter ${ofertaFilter === 'oferta' ? 'active' : ''}`}
              onClick={() => setOfertaFilter('oferta')}
            >
              {t.marketplace.deals}
            </button>
          </div>
          <div className="mp-filters-right">
            <button
              className={`mp-sort ${sortBy === 'fecha' ? 'active' : ''}`}
              onClick={() => setSortBy('fecha')}
            >
              {t.marketplace.sortDate}
            </button>
            <button
              className={`mp-sort ${sortBy === 'precio' ? 'active' : ''}`}
              onClick={() => setSortBy('precio')}
            >
              {t.marketplace.sortPrice}
            </button>
          </div>
        </div>

        {/* Listings */}
        <div className="mp-listings">
          {loading ? (
            <div className="mp-empty">
              <p>{t.marketplace.loadingListings}</p>
            </div>
          ) : error ? (
            <div className="mp-empty">
              <p>{t.common.error}</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-emoji"><Icon name="ticket" size={28} /></div>
              <h3>{t.marketplace.noListings}</h3>
              <p>{t.marketplace.noListingsDesc}</p>
            </div>
          ) : (
            filteredListings.map((r) => {
              const eventDate = r.eventDate ? toDate(r.eventDate) : null;
              const dayNum = eventDate ? eventDate.getDate() : '';
              const monthStr = eventDate
                ? eventDate.toLocaleDateString(LOCALE_MAP[lang] || LOCALE_MAP.es, { month: 'short' }).toUpperCase()
                : '';
              const discount =
                r.originalPrice > r.askingPrice
                  ? Math.round((1 - r.askingPrice / r.originalPrice) * 100)
                  : 0;
              const priceDiff =
                r.askingPrice < r.originalPrice
                  ? 'below'
                  : r.askingPrice > r.originalPrice
                    ? 'above'
                    : '';

              return (
                <div
                  key={r.id}
                  className="mp-listing"
                  onClick={() => handleListingClick(r)}
                >
                  {/* Date */}
                  <div className="mp-listing-date">
                    <div className="mp-listing-date-day">{dayNum}</div>
                    <div className="mp-listing-date-month">{monthStr}</div>
                  </div>

                  {/* Image */}
                  <div
                    className="mp-listing-img"
                    style={
                      r.image
                        ? { backgroundImage: `url(${r.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                        : { background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }
                    }
                  >
                    {!r.image && <Icon name="headphones" size={24} />}
                  </div>

                  {/* Info */}
                  <div className="mp-listing-info">
                    <div className="mp-listing-event">{r.eventName || t.myTickets.defaultEventName}</div>
                    <div className="mp-listing-meta">
                      {r.eventDateLabel || ''} · {r.ticketTier || t.myTickets.defaultTicketType}
                    </div>
                    <div className="mp-listing-seller">
                      <span className="verified-dot">✓</span>
                      {r.sellerName || t.marketplace.anonymous} · {r.eventVenue || ''}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mp-listing-right">
                    <div className="mp-listing-prices">
                      {r.originalPrice !== r.askingPrice && (
                        <span className="mp-listing-original">S/{r.originalPrice}</span>
                      )}
                      <span className={`mp-listing-price ${priceDiff}`}>
                        S/{r.askingPrice}
                      </span>
                    </div>
                    {discount > 0 ? (
                      <span className="mp-listing-tag mp-tag-below">-{discount}%</span>
                    ) : r.askingPrice === r.originalPrice ? (
                      <span className="mp-listing-tag mp-tag-face">{t.marketplace.originalPrice}</span>
                    ) : null}
                    <button
                      className="mp-listing-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleListingClick(r);
                      }}
                    >
                      {t.common.view} →
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Note */}
        <div className="mp-note">
          <strong>{t.marketplace.howItWorks}</strong> {t.marketplace.howItWorksDesc}
        </div>

        {/* Sell CTA */}
        <div className="mp-sell-cta">
          <p>{t.marketplace.haveTicket}</p>
          <button className="btn-acid" onClick={() => navigate('/mis-entradas')}>
            {t.marketplace.sellMyTicket}
          </button>
        </div>

        {/* Footer */}
        <div className="mp-footer">
          <div className="mp-footer-logo">LEZGO</div>
          <div className="mp-footer-copy">{t.footer.copy}</div>
        </div>
      </div>

      <ResaleCheckoutModal
        resale={selectedResale}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedResale(null);
        }}
      />
    </>
  );
}
