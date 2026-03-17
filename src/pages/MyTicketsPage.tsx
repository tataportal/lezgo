import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserActiveTickets, useUserPastTickets } from '../hooks/useTickets';
import { getResaleListingsBySeller, listForResale } from '../services/resaleService';
import { transferTicket } from '../services/ticketService';
import { useTranslation } from '../i18n';
import { getInitials, toDate, LOCALE_MAP } from '../lib/helpers';
import { FEES } from '../lib/constants';
import type { Resale } from '../lib/types';
import toast from 'react-hot-toast';
import './MyTicketsPage.css';

type Tab = 'proximas' | 'pasadas' | 'reventas';

const formatPrice = (n: number, locale = 'es-PE') => `S/${n.toLocaleString(locale)}`;

const formatDate = (dateStr: unknown, locale = 'es-PE') => {
  if (!dateStr) return '';
  const date = toDate(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });
};

const maskDni = (dni: string) => dni.slice(0, 2) + '****' + dni.slice(-2);

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
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t, lang } = useTranslation();
  const locale = LOCALE_MAP[lang] || 'es-PE';
  const fmtPrice = (n: number) => formatPrice(n, locale);
  const fmtDate = (d: unknown) => formatDate(d, locale);
  const { tickets: activeTickets, loading: activeLoading } = useUserActiveTickets(user?.uid || '');
  const { tickets: pastTickets, loading: pastLoading } = useUserPastTickets(user?.uid || '');

  const [tab, setTab] = useState<Tab>('proximas');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [resaleListings, setResaleListings] = useState<Resale[]>([]);
  const [resaleLoading, setResaleLoading] = useState(false);

  const [transferModal, setTransferModal] = useState<TransferModalState>({
    open: false, ticketId: null, recipientEmail: '', message: '', loading: false,
  });

  const [resaleModal, setResaleModal] = useState<ResaleModalState>({
    open: false, ticketId: null, originalPrice: 0, askingPrice: 0, loading: false,
  });

  const displayName = profile?.displayName || user?.email?.split('@')[0] || (t.myTickets.userFallback || 'Usuario');

  // Notification panel
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const demoNotifications = [
    { id: '1', icon: '🎟️', title: 'Ticket confirmado', desc: 'Tu entrada para LEZGO v2 Launch fue confirmada.', time: 'Hace 2h', unread: true },
    { id: '2', icon: '⚡', title: 'Badge desbloqueado', desc: 'Early Supporter — eres uno de los primeros.', time: 'Hace 1d', unread: true },
    { id: '3', icon: '🎉', title: 'Nuevo evento disponible', desc: 'Un nuevo evento ha sido publicado en tu zona.', time: 'Hace 3d', unread: true },
  ];

  const handleResaleTabClick = async () => {
    if (!user) return;
    setTab('reventas');
    setResaleLoading(true);
    try {
      const listings = await getResaleListingsBySeller(user.uid);
      setResaleListings(listings.filter(l => l.status === 'listed'));
    } catch { toast.error(t.myTickets.errorResale); }
    finally { setResaleLoading(false); }
  };

  const openTransferModal = (ticketId: string) => {
    setMenuOpenId(null);
    setTransferModal({ open: true, ticketId, recipientEmail: '', message: '', loading: false });
  };

  const openResaleModal = (ticketId: string, originalPrice: number) => {
    setMenuOpenId(null);
    setResaleModal({
      open: true, ticketId, originalPrice,
      askingPrice: Math.round(originalPrice * 1.4 * 100) / 100, loading: false,
    });
  };

  const handleTransfer = async () => {
    if (!transferModal.ticketId || !transferModal.recipientEmail) {
      toast.error(t.myTickets.errorFields); return;
    }
    setTransferModal({ ...transferModal, loading: true });
    try {
      await transferTicket(transferModal.ticketId, transferModal.recipientEmail, transferModal.recipientEmail);
      toast.success(t.myTickets.transferSuccess);
      setTransferModal({ open: false, ticketId: null, recipientEmail: '', message: '', loading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : t.myTickets.errorTransfer;
      toast.error(msg);
      setTransferModal({ ...transferModal, loading: false });
    }
  };

  const handleResalePublish = async () => {
    if (!resaleModal.ticketId || !user) { toast.error(t.myTickets.errorNoTicket); return; }
    if (resaleModal.askingPrice <= 0) { toast.error(t.myTickets.errorPrice); return; }
    setResaleModal({ ...resaleModal, loading: true });
    try {
      await listForResale(resaleModal.ticketId, { ticketId: resaleModal.ticketId, askingPrice: resaleModal.askingPrice, image: '' }, user.uid);
      toast.success(t.myTickets.resaleSuccess);
      setResaleModal({ open: false, ticketId: null, originalPrice: 0, askingPrice: 0, loading: false });
    } catch (error) {
      const msg = error instanceof Error ? error.message : t.myTickets.errorResale;
      toast.error(msg);
      setResaleModal({ ...resaleModal, loading: false });
    }
  };

  if (!user) {
    return (
      <div className="mt-view">
        <div className="mt-empty">
          <div className="mt-empty-icon">🎫</div>
          <div className="mt-empty-text">{t.myTickets.loginRequired}</div>
          <button className="mt-empty-btn" onClick={() => navigate('/auth')}>{t.myTickets.loginBtn}</button>
        </div>
      </div>
    );
  }

  const subtitleText = activeTickets.length > 0
    ? `${activeTickets.length} ${activeTickets.length !== 1 ? t.myTickets.tickets : t.myTickets.ticket} ${activeTickets.length !== 1 ? t.myTickets.actives : t.myTickets.active} · ${t.myTickets.dniVerified || 'DNI verificado'} ✓`
    : t.myTickets.noTickets;

  const renderTicketCard = (ticket: any, isPast = false) => {
    const isActive = ticket.status === 'active';
    const isUsed = ticket.status === 'used';
    const isTransferred = ticket.status === 'transferred';
    const isResale = ticket.status === 'resale-listed';

    const statusBadge = () => {
      if (isActive && ticket.boughtInResale) return <span className="mt-ticket-status-badge mt-ticket-status-resale-purchase"><span className="mt-status-dot">●</span> {t.myTickets.boughtInResale}</span>;
      if (isActive) return <span className="mt-ticket-status-badge mt-ticket-status-active"><span className="mt-status-dot">●</span> {t.myTickets.statusActive}</span>;
      if (isUsed) return <span className="mt-ticket-status-badge mt-ticket-status-used"><span className="mt-status-dot">●</span> {t.myTickets.statusUsed}</span>;
      if (isTransferred) return <span className="mt-ticket-status-badge mt-ticket-status-transferred"><span className="mt-status-dot">●</span> {t.myTickets.statusTransferred}</span>;
      if (isResale) return <span className="mt-ticket-status-badge mt-ticket-status-resale"><span className="mt-status-dot">●</span> {t.myTickets.statusResale}</span>;
      return null;
    };

    const imgStyle = ticket.image
      ? { backgroundImage: `url(${ticket.image})` }
      : {} as React.CSSProperties;

    return (
      <div key={ticket.id} className={`mt-ticket ${isUsed ? 'used' : ''}`}>
        <div className="mt-ticket-head" onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}>
          <div className={`mt-ticket-img${!ticket.image ? ' mt-ticket-img--placeholder' : ''}`} style={imgStyle}>
            {!ticket.image && '🎧'}
          </div>
          <div className="mt-ticket-info">
            <div className="mt-ticket-event">{ticket.eventName || (t.myTickets.eventFallback || 'Evento')}</div>
            <div className="mt-ticket-meta">
              <div>{ticket.eventDateLabel || (ticket.eventDate ? fmtDate(ticket.eventDate) : '')} · {ticket.ticketName || (t.myTickets.ticketFallback || 'Entrada')}</div>
              {statusBadge()}
            </div>
            {ticket.badgeNumber && (
              <div className="mt-ticket-badge-collectible">
                <span className="mt-badge-emoji">⚡</span>
                <span className="mt-badge-label">Early Adopter</span>
                <span className="mt-badge-number">#{String(ticket.badgeNumber).padStart(3, '0')}</span>
              </div>
            )}
          </div>
          {!isPast && (
            <button
              className="mt-ticket-dots"
              onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === ticket.id ? null : ticket.id); }}
            >⋮</button>
          )}
        </div>

        {/* Menu */}
        {menuOpenId === ticket.id && (
          <div className="mt-ticket-menu-popup">
            {isActive && (
              <>
                <button className="mt-ticket-menu-item" onClick={() => openTransferModal(ticket.id)}>{t.myTickets.transferBtn}</button>
                <button className="mt-ticket-menu-item" onClick={() => openResaleModal(ticket.id, ticket.originalPrice ?? ticket.price ?? 0)}>{t.myTickets.resaleBtn}</button>
              </>
            )}
            <button className="mt-ticket-menu-item" onClick={() => { setMenuOpenId(null); navigate(`/evento/${ticket.eventSlug || ticket.eventId}`); }}>{t.myTickets.viewEventBtn}</button>
          </div>
        )}

        {/* Expanded detail */}
        {expandedTicketId === ticket.id && (
          <div className="mt-ticket-expand">
            <div className="mt-ticket-detail-row">
              <span className="mt-ticket-detail-label">{t.myTickets.venueLabel}</span>
              <span className="mt-ticket-detail-value">{ticket.eventVenue || '—'}{ticket.eventLocation ? `, ${ticket.eventLocation}` : ''}</span>
            </div>
            <div className="mt-ticket-detail-row">
              <span className="mt-ticket-detail-label">{t.myTickets.scheduleLabel}</span>
              <span className="mt-ticket-detail-value">{ticket.eventTimeStart || '—'} – {ticket.eventTimeEnd || '—'}</span>
            </div>
            <div className="mt-ticket-detail-row">
              <span className="mt-ticket-detail-label">{t.myTickets.ticketTypeLabel}</span>
              <span className="mt-ticket-detail-value">{ticket.ticketName || (t.myTickets.ticketFallback || 'Entrada')}</span>
            </div>
            <div className="mt-ticket-detail-row">
              <span className="mt-ticket-detail-label">{t.myTickets.priceLabel}</span>
              <span className="mt-ticket-detail-value">{ticket.price > 0 ? fmtPrice(ticket.price) : t.common.free}</span>
            </div>
            <div className="mt-ticket-detail-row">
              <span className="mt-ticket-detail-label">{t.myTickets.dniLinked}</span>
              <span className="mt-ticket-detail-value">{ticket.userDni ? maskDni(ticket.userDni) : '—'}</span>
            </div>
            <div className="mt-ticket-detail-row">
              <span className="mt-ticket-detail-label">{t.myTickets.verification}</span>
              <span className="mt-ticket-detail-value mt-ticket-detail-value--verified">{t.myTickets.verifiedWithLezgo}</span>
            </div>
            {ticket.badgeNumber && (
              <div className="mt-ticket-detail-row">
                <span className="mt-ticket-detail-label">Collectible Badge</span>
                <span className="mt-ticket-detail-value mt-ticket-detail-value--badge">⚡ Early Adopter #{String(ticket.badgeNumber).padStart(3, '0')} / 100</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-view">
      {/* Header */}
      <div className="mt-header">
        <div className="mt-header-left">
          <h1>{t.myTickets.title}</h1>
          <p>{subtitleText}</p>
        </div>
        <div className="mt-header-right">
          <div className="notif-wrapper" ref={notifRef}>
            <button className="notif-bell" onClick={() => setNotifOpen(!notifOpen)}>
              🔔<span className="notif-badge">{demoNotifications.length}</span>
            </button>
            {notifOpen && (
              <div className="notif-panel">
                <div className="notif-panel-header">
                  <span className="notif-panel-title">Notificaciones</span>
                  <button className="notif-mark-all" onClick={() => { toast.success('Marcadas como leídas'); setNotifOpen(false); }}>
                    Marcar todo
                  </button>
                </div>
                <div className="notif-panel-list">
                  {demoNotifications.map(n => (
                    <div key={n.id} className={`notif-item ${n.unread ? 'notif-item--unread' : ''}`}>
                      <span className="notif-item-icon">{n.icon}</span>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{n.title}</div>
                        <div className="notif-item-desc">{n.desc}</div>
                        <div className="notif-item-time">{n.time}</div>
                      </div>
                      {n.unread && <span className="notif-item-dot" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="mt-avatar-mini" onClick={() => navigate('/perfil')}>
            {getInitials(displayName)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-filter-tabs">
        <button className={`mt-tab ${tab === 'proximas' ? 'active' : ''}`} onClick={() => setTab('proximas')}>
          {t.myTickets.tabUpcoming} <span className="mt-tab-count">{activeTickets.length}</span>
        </button>
        <button className={`mt-tab ${tab === 'pasadas' ? 'active' : ''}`} onClick={() => setTab('pasadas')}>
          {t.myTickets.tabPast} <span className="mt-tab-count">{pastTickets.length}</span>
        </button>
        <button className={`mt-tab ${tab === 'reventas' ? 'active' : ''}`} onClick={handleResaleTabClick}>
          {t.myTickets.tabResale} <span className="mt-tab-count">{resaleListings.length}</span>
        </button>
      </div>

      {/* Próximas Panel */}
      {tab === 'proximas' && (
        <div className="mt-panel">
          {activeLoading ? (
            <div className="mt-empty"><p className="u-text-dim">{t.myTickets.loadingTickets}</p></div>
          ) : activeTickets.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">🎫</div>
              <div className="mt-empty-text">{t.myTickets.noUpcoming}</div>
              <div className="mt-empty-sub">{t.myTickets.noUpcomingDesc}</div>
              <button className="mt-empty-btn" onClick={() => navigate('/inicio')}>{t.myTickets.exploreBtn}</button>
            </div>
          ) : (
            activeTickets.map(ticket => renderTicketCard(ticket))
          )}
        </div>
      )}

      {/* Pasadas Panel */}
      {tab === 'pasadas' && (
        <div className="mt-panel">
          {pastLoading ? (
            <div className="mt-empty"><p className="u-text-dim">{t.myTickets.loadingTickets}</p></div>
          ) : pastTickets.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">📊</div>
              <div className="mt-empty-text">{t.myTickets.noPastDesc}</div>
              <div className="mt-empty-sub">{t.myTickets.noPastSubDesc}</div>
            </div>
          ) : (
            pastTickets.map(ticket => renderTicketCard(ticket, true))
          )}
        </div>
      )}

      {/* En Reventa Panel */}
      {tab === 'reventas' && (
        <div className="mt-panel">
          {resaleLoading ? (
            <div className="mt-empty"><p className="u-text-dim">{t.myTickets.loadingTickets}</p></div>
          ) : resaleListings.length === 0 ? (
            <div className="mt-empty">
              <div className="mt-empty-icon">💸</div>
              <div className="mt-empty-text">{t.myTickets.noResaleDesc}</div>
              <div className="mt-empty-sub">{t.myTickets.noResaleSubDesc}</div>
            </div>
          ) : (
            resaleListings.map(resale => (
              <div key={resale.id} className="mt-ticket">
                <div className="mt-ticket-head">
                  <div className="mt-ticket-img mt-ticket-img--placeholder">🎧</div>
                  <div className="mt-ticket-info">
                    <div className="mt-ticket-event">{resale.eventName || (t.myTickets.eventFallback || 'Evento')}</div>
                    <div className="mt-ticket-meta">
                      <div>{resale.ticketTier || (t.myTickets.ticketFallback || 'Entrada')} · {fmtPrice(resale.askingPrice)}</div>
                      <span className="mt-ticket-status-badge mt-ticket-status-resale"><span className="mt-status-dot">●</span> {t.myTickets.statusResale}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-footer">
        <div className="mt-footer-logo">LEZGO</div>
        <div className="mt-footer-copy">{t.footer.copy}</div>
      </div>

      {/* Transfer Modal */}
      {transferModal.open && (
        <div className="mt-modal-overlay" onClick={() => setTransferModal({ ...transferModal, open: false })}>
          <div className="mt-modal" onClick={e => e.stopPropagation()}>
            <button className="mt-modal-close" onClick={() => setTransferModal({ ...transferModal, open: false })}>✕</button>
            <h2 className="mt-modal-title">{t.myTickets.transferTitle}</h2>
            <div className="mt-modal-form">
              <input
                type="email"
                placeholder={t.myTickets.recipientEmail}
                value={transferModal.recipientEmail}
                onChange={e => setTransferModal({ ...transferModal, recipientEmail: e.target.value })}
                className="mt-modal-input"
              />
              <textarea
                placeholder={t.myTickets.messageOptional}
                value={transferModal.message}
                onChange={e => setTransferModal({ ...transferModal, message: e.target.value })}
                className="mt-modal-textarea"
                rows={3}
              />
            </div>
            <div className="mt-modal-actions">
              <button className="mt-button mt-button--secondary" onClick={() => setTransferModal({ ...transferModal, open: false })}>{t.common.cancel}</button>
              <button className="mt-button mt-button--primary" onClick={handleTransfer} disabled={transferModal.loading}>
                {transferModal.loading ? t.myTickets.transferring : t.myTickets.transferAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resale Modal */}
      {resaleModal.open && (
        <div className="mt-modal-overlay" onClick={() => setResaleModal({ ...resaleModal, open: false })}>
          <div className="mt-modal" onClick={e => e.stopPropagation()}>
            <button className="mt-modal-close" onClick={() => setResaleModal({ ...resaleModal, open: false })}>✕</button>
            <h2 className="mt-modal-title">{t.myTickets.resaleTitle}</h2>
            <div className="mt-resale-modal-info">
              <div className="mt-modal-row">
                <span className="mt-modal-label">{t.myTickets.salePrice}</span>
                <span className="mt-modal-value">{fmtPrice(resaleModal.originalPrice)}</span>
              </div>
            </div>
            <div className="mt-modal-form">
              <input
                type="number"
                placeholder={t.myTickets.salePrice}
                value={resaleModal.askingPrice}
                onChange={e => setResaleModal({ ...resaleModal, askingPrice: parseFloat(e.target.value) || 0 })}
                className="mt-modal-input"
                min={0} step={0.01}
              />
            </div>
            <div className="mt-resale-modal-fees">
              <div className="mt-modal-row">
                <span className="mt-modal-label">{t.myTickets.lezgoFee}</span>
                <span className="mt-modal-value">{fmtPrice(resaleModal.askingPrice * FEES.RESALE_SELLER)}</span>
              </div>
              <div className="mt-modal-row mt-modal-row--total">
                <span className="mt-modal-label">{t.myTickets.netToYou}</span>
                <span className="mt-modal-value mt-modal-value--highlight">{fmtPrice(resaleModal.askingPrice * (1 - FEES.RESALE_SELLER))}</span>
              </div>
            </div>
            <div className="mt-modal-actions">
              <button className="mt-button mt-button--secondary" onClick={() => setResaleModal({ ...resaleModal, open: false })}>{t.common.cancel}</button>
              <button className="mt-button mt-button--primary" onClick={handleResalePublish} disabled={resaleModal.loading || resaleModal.askingPrice <= 0}>
                {resaleModal.loading ? t.myTickets.publishing : t.myTickets.publishAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
