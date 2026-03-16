import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserTickets } from '../hooks/useTickets';
import { useTranslation } from '../i18n';
import { LOCALE_MAP, getInitials } from '../lib/helpers';
import type { Ticket } from '../lib/types';
import toast from 'react-hot-toast';
import './ProfilePage.css';

/** Avatar with fallback: tries image → falls back to initials on acid bg */
function UserAvatar({ photoURL, displayName }: { photoURL?: string; displayName?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const handleError = useCallback(() => setImgFailed(true), []);
  useEffect(() => { setImgFailed(false); }, [photoURL]);

  if (photoURL && !imgFailed) {
    return <img src={photoURL} alt={displayName || ''} loading="lazy" onError={handleError} />;
  }
  return <span>{getInitials(displayName)}</span>;
}

/* ── Badge system ── */
interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  progress: number;
  maxProgress: number;
  calculateTier: (d: BadgeCalc) => 'none' | 'bronze' | 'silver' | 'gold';
  calculateProgress: (d: BadgeCalc) => { current: number; max: number };
}

interface BadgeCalc {
  totalTickets: number;
  totalSpent: number;
  completedResales: number;
  technoTickets: number;
  presaleTickets: number;
  vipTickets: number;
  uniqueDistricts: number;
  isEarlyAdopter: boolean;
}

const BADGE_KEY_MAP: Record<string, string> = {
  'party-animal': 'fiestero',
  'early-adopter': 'earlyAdopter',
  'bass-monster': 'bassMonster',
  'presale-hunter': 'preventaHunter',
  'lima-explorer': 'limaExplorer',
  'resale-pro': 'resalePro',
  'vip-status': 'vipStatus',
  'big-spender': 'bigSpender',
};

const BADGES: Badge[] = [
  { id:'party-animal', emoji:'🎧', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.totalTickets>=30?'gold':d.totalTickets>=15?'silver':d.totalTickets>=5?'bronze':'none',
    calculateProgress: d => d.totalTickets>=30?{current:30,max:30}:d.totalTickets>=15?{current:d.totalTickets,max:30}:{current:d.totalTickets,max:5}},
  { id:'early-adopter', emoji:'⚡', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.isEarlyAdopter?'gold':'none',
    calculateProgress: d => ({current:d.isEarlyAdopter?1:0,max:1})},
  { id:'bass-monster', emoji:'🔊', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.technoTickets>=30?'gold':d.technoTickets>=15?'silver':d.technoTickets>=5?'bronze':'none',
    calculateProgress: d => d.technoTickets>=30?{current:30,max:30}:d.technoTickets>=15?{current:d.technoTickets,max:30}:{current:d.technoTickets,max:5}},
  { id:'presale-hunter', emoji:'🎯', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.presaleTickets>=30?'gold':d.presaleTickets>=15?'silver':d.presaleTickets>=5?'bronze':'none',
    calculateProgress: d => d.presaleTickets>=30?{current:30,max:30}:d.presaleTickets>=15?{current:d.presaleTickets,max:30}:{current:d.presaleTickets,max:5}},
  { id:'lima-explorer', emoji:'🧭', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.uniqueDistricts>=10?'gold':d.uniqueDistricts>=6?'silver':d.uniqueDistricts>=3?'bronze':'none',
    calculateProgress: d => d.uniqueDistricts>=10?{current:10,max:10}:d.uniqueDistricts>=6?{current:d.uniqueDistricts,max:10}:{current:d.uniqueDistricts,max:3}},
  { id:'resale-pro', emoji:'🤝', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.completedResales>=25?'gold':d.completedResales>=10?'silver':d.completedResales>=3?'bronze':'none',
    calculateProgress: d => d.completedResales>=25?{current:25,max:25}:d.completedResales>=10?{current:d.completedResales,max:25}:{current:d.completedResales,max:3}},
  { id:'vip-status', emoji:'💎', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.vipTickets>=25?'gold':d.vipTickets>=10?'silver':d.vipTickets>=3?'bronze':'none',
    calculateProgress: d => d.vipTickets>=25?{current:25,max:25}:d.vipTickets>=10?{current:d.vipTickets,max:25}:{current:d.vipTickets,max:3}},
  { id:'big-spender', emoji:'💰', name:'', description:'', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.totalSpent>=5000?'gold':d.totalSpent>=2000?'silver':d.totalSpent>=500?'bronze':'none',
    calculateProgress: d => {const s=Math.floor(d.totalSpent);return s>=5000?{current:5000,max:5000}:s>=2000?{current:s,max:5000}:{current:s,max:500}}},
];

const tierLabelHelper = (t: string, profileT: any) => ({bronze: profileT.levels.bronze, silver: profileT.levels.silver, gold: profileT.levels.gold, none: profileT.levels.locked}[t] || profileT.levels.locked);
const tierClass = (t: string) => ({bronze:'bronce',silver:'plata',gold:'oro',none:'locked'}[t] || 'locked');

const formatMemberDate = (date: unknown, locale: string) => {
  if (!date) return '';
  try {
    const ts = date as { seconds?: number; toDate?: () => Date };
    const d = ts.toDate?.() || new Date((ts.seconds ?? 0) * 1000);
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
  } catch { return ''; }
};

const formatTicketDate = (date: unknown, locale: string) => {
  if (!date) return '';
  try {
    const ts = date as { seconds?: number; toDate?: () => Date };
    const d = ts.toDate?.() || new Date((ts.seconds ?? 0) * 1000);
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'active': return '🟢';
    case 'used': return '✅';
    case 'transferred': return '🔄';
    case 'resale-listed': return '💰';
    default: return '🎟️';
  }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, logout, updateProfile, isPromoter } = useAuth();
  const { tickets } = useUserTickets(user?.uid || '');
  const { t, lang } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'tickets'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [badges, setBadges] = useState<Badge[]>(BADGES);

  useEffect(() => {
    const data: BadgeCalc = {
      totalTickets: tickets.length,
      totalSpent: tickets.reduce((s, t) => s + (t.price || 0), 0),
      completedResales: tickets.filter(t => t.status === 'transferred').length,
      technoTickets: tickets.filter(t => t.ticketType === 'techno').length,
      presaleTickets: tickets.filter(t => t.couponCode === 'PRESALE').length,
      vipTickets: tickets.filter(t => t.ticketName?.includes('VIP')).length,
      uniqueDistricts: new Set(tickets.map(t => t.eventLocation).filter(Boolean)).size,
      isEarlyAdopter: false,
    };
    setBadges(BADGES.map(b => ({
      ...b,
      tier: b.calculateTier(data),
      progress: b.calculateProgress(data).current,
      maxProgress: b.calculateProgress(data).max,
    })));
  }, [tickets]);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try { await logout(); navigate('/auth'); toast.success(t.profile.loggedOut); }
    catch { toast.error(t.profile.errorLogout); }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) { toast.error(t.profile.errorEmptyName); return; }
    try {
      setIsSaving(true);
      await updateProfile({ displayName: editedName });
      setIsEditing(false);
      toast.success(t.profile.nameUpdated);
    } catch { toast.error(t.profile.errorUpdateName); }
    finally { setIsSaving(false); }
  };

  if (loading) return (
    <div className="pf">
      <div className="branded-loader" style={{padding: '6rem 0', margin: '0 auto'}}>
        <div className="branded-loader-logo">LEZGO</div>
        <div className="branded-loader-bars"><span /><span /><span /><span /><span /></div>
      </div>
    </div>
  );
  if (!user || !profile) return null;

  const totalSpent = tickets.reduce((s, t) => s + (t.price || 0), 0);
  const completedResales = tickets.filter(t => t.status === 'transferred').length;
  const activeTickets = tickets.filter(t => t.status === 'active');
  const pastTickets = tickets.filter(t => t.status === 'used' || t.status === 'transferred');
  const listedTickets = tickets.filter(t => t.status === 'resale-listed');
  const locale = LOCALE_MAP[lang] || LOCALE_MAP.es;

  const renderTicketCard = (ticket: Ticket) => (
    <div key={ticket.id} className="pf-ticket-card">
      <div className="pf-ticket-top">
        <div className="pf-ticket-status">
          <span className="pf-ticket-status-dot">{statusIcon(ticket.status)}</span>
          <span className={`pf-ticket-status-label pf-ticket-status--${ticket.status}`}>
            {ticket.status === 'active' ? t.myTickets.statusActive :
             ticket.status === 'used' ? t.myTickets.statusUsed :
             ticket.status === 'transferred' ? t.myTickets.statusTransferred :
             t.myTickets.statusResale}
          </span>
        </div>
        {ticket.badgeNumber && (
          <div className="pf-ticket-badge-num">#{String(ticket.badgeNumber).padStart(3, '0')}</div>
        )}
      </div>

      <div className="pf-ticket-event-name">{ticket.eventName}</div>
      <div className="pf-ticket-meta">
        <span>{ticket.eventVenue}</span>
        <span>{formatTicketDate(ticket.eventDate, locale)}</span>
      </div>

      <div className="pf-ticket-details">
        <div className="pf-ticket-detail">
          <span className="pf-ticket-detail-label">{t.myTickets.ticketTypeLabel}</span>
          <span>{ticket.ticketName}</span>
        </div>
        <div className="pf-ticket-detail">
          <span className="pf-ticket-detail-label">{t.myTickets.priceLabel}</span>
          <span className="pf-ticket-price-val">
            {ticket.price === 0 ? 'GRATIS' : `S/${ticket.price}`}
          </span>
        </div>
      </div>

      {ticket.status === 'active' && (
        <div className="pf-ticket-actions">
          <button className="pf-ticket-action pf-ticket-action--view" onClick={() => navigate(`/evento/${ticket.eventId}`)}>
            {t.myTickets.viewEventBtn}
          </button>
          <button className="pf-ticket-action pf-ticket-action--resale" onClick={() => navigate(`/mis-entradas`)}>
            {t.myTickets.resaleBtn}
          </button>
          <button className="pf-ticket-action pf-ticket-action--transfer" onClick={() => navigate(`/mis-entradas`)}>
            {t.myTickets.transferBtn}
          </button>
        </div>
      )}

      {ticket.status === 'resale-listed' && (
        <div className="pf-ticket-actions">
          <button className="pf-ticket-action pf-ticket-action--view" onClick={() => navigate(`/evento/${ticket.eventId}`)}>
            {t.myTickets.viewEventBtn}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="pf">
      {/* Dot grid background */}
      <div className="pf-bg-grid" />

      {/* Tabs */}
      <div className="pf-tabs">
        <button className={`pf-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          {t.common.profile}
        </button>
        <button className={`pf-tab ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
          {t.myTickets.title} ({tickets.length})
        </button>
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === 'profile' && (
        <div className="pf-content">
          {/* Header Card */}
          <div className="pf-header">
            <div className="pf-avatar">
              <div className="pf-verified-ring" />
              <UserAvatar photoURL={profile.photoURL} displayName={profile.displayName} />
            </div>

            <div className="pf-info">
              {isEditing ? (
                <div className="pf-name-edit">
                  <input className="pf-name-input" value={editedName} onChange={e => setEditedName(e.target.value)} disabled={isSaving} autoFocus />
                  <button className="pf-name-save" onClick={handleSaveName} disabled={isSaving}>{t.common.save}</button>
                  <button className="pf-name-cancel" onClick={() => { setIsEditing(false); setEditedName(profile.displayName); }} disabled={isSaving}>{t.common.cancel}</button>
                </div>
              ) : (
                <h1>{profile.displayName || t.profile.user} {profile.dni && <span className="pf-verified-badge">☺ {t.common.verified}</span>}</h1>
              )}

              <div className="pf-meta">
                {profile.dni && <>{t.profile.identityVerified} <span>DNI</span> · </>}
                {t.profile.memberSince} <span>{formatMemberDate(profile.createdAt, locale)}</span>
              </div>

              <div className="pf-email">{profile.email}</div>

              <div className="pf-stats-row">
                <div className="pf-stat"><strong>{tickets.length}</strong> {t.profile.events}</div>
                <div className="pf-stat"><strong>S/{totalSpent.toLocaleString(locale)}</strong> {t.profile.spent}</div>
                <div className="pf-stat"><strong>{completedResales}</strong> {t.profile.resales}</div>
              </div>
            </div>

            {!isEditing && (
              <button className="pf-edit-btn" onClick={() => setIsEditing(true)}>{t.profile.editProfile}</button>
            )}
          </div>

          {/* Badges */}
          <div className="pf-section">
            <div className="pf-section-head">
              <div className="pf-section-title">{t.profile.badges}</div>
              <span className="pf-section-more" onClick={() => navigate('/badges')}>{t.profile.viewAllBadges}</span>
            </div>
            <div className="pf-badges">
              {badges.map(b => {
                const key = BADGE_KEY_MAP[b.id] as keyof typeof t.profile.badgeNames;
                return (
                <div key={b.id} className={`pf-badge ${b.tier === 'none' ? 'locked' : ''}`}>
                  <div className="pf-badge-icon">{b.emoji}</div>
                  <div className="pf-badge-name">{t.profile.badgeNames[key] || b.id}</div>
                  <div className="pf-badge-desc">{t.profile.badgeDescs[key] || ''}</div>
                  <div className={`pf-badge-tier ${tierClass(b.tier)}`}>{tierLabelHelper(b.tier, t.profile)}</div>
                  <div className="pf-badge-progress">
                    <div
                      className={`pf-badge-progress-fill ${tierClass(b.tier)}`}
                      style={{ width: `${b.maxProgress > 0 ? (b.progress / b.maxProgress) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="pf-badge-count">{b.progress}/{b.maxProgress}</div>
                </div>
              ); })}
            </div>
          </div>

          {/* Organizer CTA */}
          {isPromoter && (
            <div className="pf-organizer-cta">
              <div className="pf-cta-label">{t.profile.organizerMode}</div>
              <button onClick={() => navigate('/organizer')}>{t.profile.dashboardBtn}</button>
            </div>
          )}

          {/* Logout */}
          <button className="pf-logout-btn" onClick={handleLogout}>{t.profile.logoutBtn}</button>
        </div>
      )}

      {/* ── Tickets Tab ── */}
      {activeTab === 'tickets' && (
        <div className="pf-content">
          {/* Active Tickets */}
          {activeTickets.length > 0 && (
            <div className="pf-section">
              <div className="pf-section-head">
                <div className="pf-section-title">{t.myTickets.tabUpcoming} ({activeTickets.length})</div>
              </div>
              <div className="pf-tickets-grid">
                {activeTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {/* Listed in Resale */}
          {listedTickets.length > 0 && (
            <div className="pf-section">
              <div className="pf-section-head">
                <div className="pf-section-title">{t.myTickets.tabResale} ({listedTickets.length})</div>
              </div>
              <div className="pf-tickets-grid">
                {listedTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {/* Past Tickets */}
          {pastTickets.length > 0 && (
            <div className="pf-section">
              <div className="pf-section-head">
                <div className="pf-section-title">{t.myTickets.tabPast} ({pastTickets.length})</div>
              </div>
              <div className="pf-tickets-grid">
                {pastTickets.map(renderTicketCard)}
              </div>
            </div>
          )}

          {/* Empty state */}
          {tickets.length === 0 && (
            <div className="pf-empty">
              <div className="pf-empty-icon">🎟️</div>
              <p>{t.myTickets.noTickets}</p>
              <button className="pf-empty-btn" onClick={() => navigate('/inicio')}>{t.myTickets.exploreBtn}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
