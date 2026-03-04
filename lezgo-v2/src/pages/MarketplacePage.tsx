import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResaleListings } from '../services/resaleService';
import { toDate, formatPrice } from '../lib/helpers';
import type { Resale } from '../lib/types';
import ResaleCheckoutModal from '../components/checkout/ResaleCheckoutModal';
import './MarketplacePage.css';

type DateFilter = 'todas' | 'semana' | 'mes';
type SortBy = 'fecha' | 'precio';
type OfertaFilter = 'todos' | 'oferta';

const LIMA_DISTRICTS = [
  'Todos',
  'Barranco',
  'Miraflores',
  'San Isidro',
  'Surco',
  'Cercado de Lima',
  'Chorrillos',
];

export default function MarketplacePage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Resale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [locationFilter, setLocationFilter] = useState('Todos');
  const [dateFilter, setDateFilter] = useState<DateFilter>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [ofertaFilter, setOfertaFilter] = useState<OfertaFilter>('todos');
  const [sortBy, setSortBy] = useState<SortBy>('fecha');

  const [selectedResale, setSelectedResale] = useState<Resale | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch listings
  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getResaleListings({ status: 'listed' });
        setListings(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al cargar listados';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let result = [...listings];

    // Location filter
    if (locationFilter !== 'Todos') {
      result = result.filter((r) => {
        const eventLocation = r.eventVenue || '';
        return eventLocation.includes(locationFilter);
      });
    }

    // Date filter
    if (dateFilter !== 'todas') {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      result = result.filter((r) => {
        const eventDate = toDate(r.eventDate);
        if (dateFilter === 'semana') {
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return eventDate >= startOfWeek && eventDate <= endOfWeek;
        } else if (dateFilter === 'mes') {
          return (
            eventDate.getFullYear() === now.getFullYear() &&
            eventDate.getMonth() === now.getMonth()
          );
        }
        return true;
      });
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) =>
        r.eventName.toLowerCase().includes(query) ||
        r.ticketTier.toLowerCase().includes(query)
      );
    }

    // Oferta filter (show only discounted tickets)
    if (ofertaFilter === 'oferta') {
      result = result.filter((r) => r.askingPrice < r.originalPrice);
    }

    // Sorting
    if (sortBy === 'fecha') {
      result.sort(
        (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
      );
    } else if (sortBy === 'precio') {
      result.sort((a, b) => a.askingPrice - b.askingPrice);
    }

    return result;
  }, [listings, locationFilter, dateFilter, searchQuery, ofertaFilter, sortBy]);

  const handleListingClick = (resale: Resale) => {
    setSelectedResale(resale);
    setModalOpen(true);
  };

  return (
    <>
      <div className="marketplace-page">
        {/* Header */}
        <div className="mp-header">
          <div className="mp-label">// Marketplace</div>
          <h1 className="mp-title">Reventa entre fans verificados.</h1>
          <p className="mp-description">
            Compra y vende entradas de forma segura en nuestra plataforma. Todos los vendedores
            están verificados para garantizar transacciones confiables.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mp-search-bar">
          <select
            className="mp-select"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            {LIMA_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>

          <select
            className="mp-select"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          >
            <option value="todas">Todas</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
          </select>

          <input
            type="text"
            placeholder="Busca por evento o categoría..."
            className="mp-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Pills and Sort Buttons */}
        <div className="mp-filters">
          <div className="mp-filter-pills">
            <button
              className={`mp-pill ${ofertaFilter === 'todos' ? 'active' : ''}`}
              onClick={() => setOfertaFilter('todos')}
            >
              Todos
            </button>
            <button
              className={`mp-pill ${ofertaFilter === 'oferta' ? 'active' : ''}`}
              onClick={() => setOfertaFilter('oferta')}
            >
              Oferta
            </button>
          </div>

          <div className="mp-sort-buttons">
            <button
              className={`mp-sort-btn ${sortBy === 'fecha' ? 'active' : ''}`}
              onClick={() => setSortBy('fecha')}
            >
              Fecha
            </button>
            <button
              className={`mp-sort-btn ${sortBy === 'precio' ? 'active' : ''}`}
              onClick={() => setSortBy('precio')}
            >
              Precio
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="mp-content">
          {loading ? (
            <div className="mp-empty">
              <p>Cargando listados...</p>
            </div>
          ) : error ? (
            <div className="mp-empty">
              <p>Error: {error}</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-emoji">🎫</div>
              <h3>No hay entradas disponibles</h3>
              <p>Intenta cambiar tus filtros de búsqueda</p>
            </div>
          ) : (
            <div className="mp-listings-grid">
              {filteredListings.map((resale) => {
                const isDiscounted = resale.askingPrice < resale.originalPrice;
                const discount = Math.round(
                  ((resale.originalPrice - resale.askingPrice) / resale.originalPrice) * 100
                );

                return (
                  <div
                    key={resale.id}
                    className="mp-listing-card"
                    onClick={() => handleListingClick(resale)}
                  >
                    {isDiscounted && (
                      <div className="mp-card-badge">-{discount}%</div>
                    )}
                    <div className="mp-card-image">
                      <img src={resale.image} alt={resale.eventName} />
                    </div>
                    <div className="mp-card-content">
                      <h3 className="mp-card-event">{resale.eventName}</h3>
                      <p className="mp-card-tier">{resale.ticketTier}</p>
                      <p className="mp-card-date">
                        {toDate(resale.eventDate).toLocaleDateString('es-PE', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="mp-card-pricing">
                        <span className="mp-card-original">{formatPrice(resale.originalPrice)}</span>
                        <span className="mp-card-asking">{formatPrice(resale.askingPrice)}</span>
                      </div>
                      <div className="mp-card-seller">
                        <span className="mp-seller-name">{resale.sellerName}</span>
                        <span className="mp-seller-badge">✓</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="mp-cta-section">
          <h3>¿Tienes una entrada que ya no usarás?</h3>
          <button
            className="mp-cta-button"
            onClick={() => navigate('/mis-entradas')}
          >
            Vende tu entrada
          </button>
        </div>

        {/* Note Box */}
        <div className="mp-note-box">
          <h4>Cómo funciona la reventa</h4>
          <ul>
            <li>Todos los vendedores están verificados con DNI</li>
            <li>Las entradas se transfieren automáticamente después del pago</li>
            <li>Cobramos una comisión del 5% en cada venta</li>
            <li>Cada transacción está protegida por nuestra plataforma</li>
          </ul>
        </div>
      </div>

      {/* Resale Checkout Modal */}
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
