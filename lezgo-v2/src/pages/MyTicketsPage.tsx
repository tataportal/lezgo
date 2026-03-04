import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserActiveTickets, useUserPastTickets } from '../hooks/useTickets';
import { getResaleListingsBySeller } from '../services/resaleService';
import type { Resale } from '../lib/types';
import toast from 'react-hot-toast';
import './MyTicketsPage.css';

type Tab = 'proximas' | 'pasadas' | 'reventa';

const formatPrice = (n: number) => `S/ ${n.toLocaleString('es-PE')}`;

const formatDate = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  const date = dateStr instanceof Date ? dateStr : dateStr.toDate?.() || new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatDateLong = (dateStr: any) => {
  if (!dateStr) return 'N/A';
  const date = dateStr instanceof Date ? dateStr : dateStr.toDate?.() || new Date(dateStr);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const maskDni = (dni: string) => {
  return dni.slice(0, 2) + '****' + dni.slice(-2);
};

interface TransferModalState {
  open: boolean;
  ticketId: string | null;
  recipientEmail: string;
  message: string;
  loading: boolean;
}

interface ResaleModalState {
  open: boolean;
  ticketId: string | null;
  originalPrice: number;
  askingPrice: number;
  loading: boolean;
}

export default function MyTicketsPage() {
  const { user, profile } = useAuth();
  const { tickets: activeTickets, loading: activeLoading } = useUserActiveTickets(user?.uid || '');
  const { tickets: pastTickets, loading: pastLoading } = useUserPastTickets(user?.uid || '');

  const [tab, setTab] = useState<Tab>('proximas');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [resaleListings, setResaleListings] = useState<Resale[]>([]);
  const [resaleLoading, setResaleLoading] = useState(false);

  const [transferModal, setTransferModal] = useState<TransferModalState>({
    open: false,
    ticketId: null,
    recipientEmail: '',
    message: '',
    loading: false,
  });

  const [resaleModal, setResaleModal] = useState<ResaleModalState>({
    open: false,
    ticketId: null,
    originalPrice: 0,
    askingPrice: 0,
    loading: false,
  });

  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'Usuario';

  // Load resale listings when tab changes
  const handleResaleTabClick = async () => {
    if (!user) return;
    setTab('reventa');
    setResaleLoading(true);
    try {
      const listings = await getResaleListingsBySeller(user.uid);
      setResaleListings(listings.filter((l) => l.status === 'listed'));
    } catch (error) {
      toast.error('Error al cargar listados en reventa');
    } finally {
      setResaleLoading(false);
    }
  };

  const openTransferModal = (ticketId: string) => {
    setTransferModal({
      open: true,
      ticketId,
      recipientEmail: '',
      message: '',
      loading: false,
    });
  };

  const openResaleModal = (ticketId: string, originalPrice: number) => {
    setResaleModal({
      open: true,
      ticketId,
      originalPrice,
      askingPrice: Math.round(originalPrice * 1.4 * 100) / 100,
      loading: false,
    });
  };

  const handleTransfer = async () => {
    if (!transferModal.ticketId || !transferModal.recipientEmail) {
      toast.error('Completa todos los campos');
      return;
    }

    setTransferModal({ ...transferModal, loading: true });
    try {
      // TODO: Implement transfer logic with ticketService.transferTicket
      toast.success('Entrada transferida exitosamente');
      setTransferModal({
        open: false,
        ticketId: null,
        recipientEmail: '',
        message: '',
        loading: false,
      });
    } catch (error) {
      toast.error('Error al transferir entrada');
    } finally {
      setTransferModal({ ...transferModal, loading: false });
    }
  };

  const handleResalePublish = async () => {
    if (!resaleModal.ticketId) {
      toast.error('Error: ticket no especificado');
      return;
    }

    setResaleModal({ ...resaleModal, loading: true });
    try {
      // TODO: Implement resale listing logic with resaleService.listForResale
      toast.success('Entrada publicada en reventa');
      setResaleModal({
        open: false,
        ticketId: null,
        originalPrice: 0,
        askingPrice: 0,
        loading: false,
      });
    } catch (error) {
      toast.error('Error al publicar en reventa');
    } finally {
      setResaleModal({ ...resaleModal, loading: false });
    }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="mt-empty">
          <p className="text-dim">Inicia sesión para ver tus entradas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mt-header">
        <div className="mt-greeting">
          <h1 className="mt-greeting-text">Hola, {displayName}</h1>
          <button className="mt-bell-icon">🔔</button>
        </div>
      </div>

      <div className="mt-tabs">
        <button
          className={`mt-tab ${tab === 'proximas' ? 'active' : ''}`}
          onClick={() => setTab('proximas')}
        >
          Próximas
          <span className="mt-tab-badge">{activeTickets.length}</span>
        </button>
        <button
          className={`mt-tab ${tab === 'pasadas' ? 'active' : ''}`}
          onClick={() => setTab('pasadas')}
        >
          Pasadas
          <span className="mt-tab-badge">{pastTickets.length}</span>
        </button>
        <button
          className={`mt-tab ${tab === 'reventa' ? 'active' : ''}`}
          onClick={handleResaleTabClick}
        >
          En Reventa
          <span className="mt-tab-badge">{resaleListings.length}</span>
        </button>
      </div>

      {/* Próximas Tab */}
      {tab === 'proximas' && (
        <div className="mt-tab-content">
          {activeLoading ? (
            <div className="mt-empty">
              <p className="text-dim">Cargando entradas...</p>
            </div>
          ) : activeTickets.length === 0 ? (
            <div className="mt-empty">
              <p className="text-dim">No tienes entradas próximas</p>
            </div>
          ) : (
            <div className="mt-tickets">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="mt-ticket-card">
                  <div className="mt-ticket-header">
                    <div className="mt-ticket-image">
                      <div className="mt-ticket-image-placeholder">🎵</div>
                    </div>
                    <div className="mt-ticket-info">
                      <h3 className="mt-ticket-event">{ticket.eventName || 'Evento'}</h3>
                      <p className="mt-ticket-date">{ticket.eventDate ? formatDate(ticket.eventDate) : 'N/A'}</p>
                      <p className="mt-ticket-tier">{ticket.ticketName || 'Entrada'}</p>
                    </div>
                    <div className="mt-ticket-status">
                      <span className={`mt-badge mt-badge--${ticket.status === 'resale-listed' ? 'orange' : 'green'}`}>
                        {ticket.status === 'resale-listed' ? 'En reventa' : 'Activa'}
                      </span>
                    </div>
                  </div>

                  {expandedTicketId === ticket.id && (
                    <div className="mt-ticket-details">
                      <div className="mt-detail">
                        <span className="mt-detail-label">Venue</span>
                        <span className="mt-detail-value">{ticket.eventVenue || 'N/A'}</span>
                      </div>
                      <div className="mt-detail">
                        <span className="mt-detail-label">Hora</span>
                        <span className="mt-detail-value">
                          {ticket.eventTimeStart || '—'} - {ticket.eventTimeEnd || '—'}
                        </span>
                      </div>
                      <div className="mt-detail">
                        <span className="mt-detail-label">DNI</span>
                        <span className="mt-detail-value">{ticket.userDni ? maskDni(ticket.userDni) : 'N/A'}</span>
                      </div>
                      <div className="mt-detail">
                        <span className="mt-detail-label">Precio</span>
                        <span className="mt-detail-value">{formatPrice(ticket.price)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-ticket-actions">
                    <button
                      className="mt-ticket-expand"
                      onClick={() =>
                        setExpandedTicketId(
                          expandedTicketId === ticket.id ? null : ticket.id
                        )
                      }
                    >
                      {expandedTicketId === ticket.id ? '▲' : '▼'}
                    </button>

                    <div className="mt-ticket-menu">
                      <button className="mt-menu-trigger">⋮</button>
                      <div className="mt-menu-items">
                        <button
                          className="mt-menu-item"
                          onClick={() => openTransferModal(ticket.id)}
                        >
                          🔄 Transferir entrada
                        </button>
                        <button
                          className="mt-menu-item"
                          onClick={() =>
                            openResaleModal(ticket.id, ticket.originalPrice ?? ticket.price ?? 0)
                          }
                        >
                          💰 Publicar en reventa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pasadas Tab */}
      {tab === 'pasadas' && (
        <div className="mt-tab-content">
          {pastLoading ? (
            <div className="mt-empty">
              <p className="text-dim">Cargando entradas...</p>
            </div>
          ) : pastTickets.length === 0 ? (
            <div className="mt-empty">
              <p className="text-dim">No tienes entradas usadas</p>
            </div>
          ) : (
            <div className="mt-tickets">
              {pastTickets.map((ticket) => (
                <div key={ticket.id} className="mt-ticket-card mt-ticket-card--past">
                  <div className="mt-ticket-header">
                    <div className="mt-ticket-image mt-ticket-image--past">
                      <div className="mt-ticket-image-placeholder">🎵</div>
                    </div>
                    <div className="mt-ticket-info">
                      <h3 className="mt-ticket-event">{ticket.eventName || 'Evento'}</h3>
                      <p className="mt-ticket-date">{ticket.eventDate ? formatDate(ticket.eventDate) : 'N/A'}</p>
                      <p className="mt-ticket-tier">{ticket.ticketName || 'Entrada'}</p>
                    </div>
                    <div className="mt-ticket-status">
                      <span className="mt-badge mt-badge--gray">
                        {ticket.status === 'transferred' ? 'Transferida' : 'Usada'}
                      </span>
                    </div>
                  </div>

                  {expandedTicketId === ticket.id && (
                    <div className="mt-ticket-details">
                      <div className="mt-detail">
                        <span className="mt-detail-label">Venue</span>
                        <span className="mt-detail-value">{ticket.eventVenue || 'N/A'}</span>
                      </div>
                      <div className="mt-detail">
                        <span className="mt-detail-label">Fecha del evento</span>
                        <span className="mt-detail-value">
                          {ticket.eventDate ? formatDateLong(ticket.eventDate) : 'N/A'}
                        </span>
                      </div>
                      <div className="mt-detail">
                        <span className="mt-detail-label">DNI</span>
                        <span className="mt-detail-value">{ticket.userDni ? maskDni(ticket.userDni) : 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-ticket-actions">
                    <button
                      className="mt-ticket-expand"
                      onClick={() =>
                        setExpandedTicketId(
                          expandedTicketId === ticket.id ? null : ticket.id
                        )
                      }
                    >
                      {expandedTicketId === ticket.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* En Reventa Tab */}
      {tab === 'reventa' && (
        <div className="mt-tab-content">
          {resaleLoading ? (
            <div className="mt-empty">
              <p className="text-dim">Cargando listados...</p>
            </div>
          ) : resaleListings.length === 0 ? (
            <div className="mt-empty">
              <p className="text-dim">No tienes entradas en reventa</p>
            </div>
          ) : (
            <div className="mt-resale-listings">
              {resaleListings.map((resale) => (
                <div key={resale.id} className="mt-resale-card">
                  <div className="mt-resale-header">
                    <div className="mt-resale-info">
                      <h3 className="mt-resale-event">{resale.eventName || 'Evento'}</h3>
                      <p className="mt-resale-tier">{resale.ticketTier || 'Entrada'}</p>
                      <p className="mt-resale-date">{resale.eventDate ? formatDate(resale.eventDate) : 'N/A'}</p>
                    </div>
                    <div className="mt-resale-price">
                      <span className="mt-resale-label">Precio</span>
                      <span className="mt-resale-amount">{formatPrice(resale.askingPrice)}</span>
                    </div>
                  </div>
                  <div className="mt-resale-footer">
                    <span className="mt-badge mt-badge--green">Listada</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfer Modal */}
      {transferModal.open && (
        <div className="mt-modal-overlay" onClick={() => setTransferModal({ ...transferModal, open: false })}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="mt-modal-close"
              onClick={() => setTransferModal({ ...transferModal, open: false })}
            >
              ✕
            </button>
            <h2 className="mt-modal-title">Transferir entrada</h2>
            <div className="mt-modal-form">
              <input
                type="email"
                placeholder="Email del destinatario"
                value={transferModal.recipientEmail}
                onChange={(e) =>
                  setTransferModal({ ...transferModal, recipientEmail: e.target.value })
                }
                className="mt-modal-input"
              />
              <textarea
                placeholder="Mensaje (opcional)"
                value={transferModal.message}
                onChange={(e) =>
                  setTransferModal({ ...transferModal, message: e.target.value })
                }
                className="mt-modal-textarea"
                rows={3}
              />
            </div>
            <div className="mt-modal-actions">
              <button
                className="mt-button mt-button--secondary"
                onClick={() => setTransferModal({ ...transferModal, open: false })}
              >
                Cancelar
              </button>
              <button
                className="mt-button mt-button--primary"
                onClick={handleTransfer}
                disabled={transferModal.loading}
              >
                {transferModal.loading ? 'Transferiendo...' : 'Transferir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resale Modal */}
      {resaleModal.open && (
        <div className="mt-modal-overlay" onClick={() => setResaleModal({ ...resaleModal, open: false })}>
          <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="mt-modal-close"
              onClick={() => setResaleModal({ ...resaleModal, open: false })}
            >
              ✕
            </button>
            <h2 className="mt-modal-title">Publicar en reventa</h2>
            <div className="mt-resale-modal-info">
              <div className="mt-modal-row">
                <span className="mt-modal-label">Precio original</span>
                <span className="mt-modal-value">{formatPrice(resaleModal.originalPrice)}</span>
              </div>
            </div>
            <div className="mt-modal-form">
              <input
                type="number"
                placeholder="Precio de venta"
                value={resaleModal.askingPrice}
                onChange={(e) =>
                  setResaleModal({ ...resaleModal, askingPrice: parseFloat(e.target.value) || 0 })
                }
                className="mt-modal-input"
                min={0}
                step={0.01}
              />
            </div>
            <div className="mt-resale-modal-fees">
              <div className="mt-modal-row">
                <span className="mt-modal-label">Comisión LEZGO (10%)</span>
                <span className="mt-modal-value">
                  {formatPrice(resaleModal.askingPrice * 0.1)}
                </span>
              </div>
              <div className="mt-modal-row mt-modal-row--total">
                <span className="mt-modal-label">Neto para ti</span>
                <span className="mt-modal-value mt-modal-value--highlight">
                  {formatPrice(resaleModal.askingPrice * 0.9)}
                </span>
              </div>
            </div>
            <div className="mt-modal-actions">
              <button
                className="mt-button mt-button--secondary"
                onClick={() => setResaleModal({ ...resaleModal, open: false })}
              >
                Cancelar
              </button>
              <button
                className="mt-button mt-button--primary"
                onClick={handleResalePublish}
                disabled={resaleModal.loading || resaleModal.askingPrice <= 0}
              >
                {resaleModal.loading ? 'Publicando...' : 'Publicar en reventa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
