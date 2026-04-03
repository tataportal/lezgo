import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserTickets } from '../hooks/useTickets';
import { useTranslation } from '../i18n';
import { LOCALE_MAP, getInitials } from '../lib/helpers';
import { Icon, type IconName } from '../components/ui';
import type { Ticket } from '../lib/types';
import toast from 'react-hot-toast';
import './ProfilePage.css';

/** Avatar with fallback */
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
  icon: IconName;
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
  hasAccount: boolean;
  isVerified: boolean;
  isEarlySupporterr: boolean;
}

const BADGE_KEY_MAP: Record<string, string> = {
  'registered': 'registered',
  'verified': 'verified',
  'early-supporter': 'earlySupporterr',
  'party-animal': 'fiestero',
  'bass-monster': 'bassMonster',
  'presale-hunter': 'preventaHunter',
  'lima-explorer': 'limaExplorer',
  'resale-pro': 'resalePro',
  'vip-status': 'vipStatus',
  'big-spender': 'bigSpender',
};

const BADGES: Badge[] = [
  // New: account creation badge
  { id:'registered', icon:'ticket', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.hasAccount ? 'gold' : 'none',
    calculateProgress: d => ({ current: d.hasAccount ? 1 : 0, max: 1 }) },
  // New: verified DNI badge
  { id:'verified', icon:'check', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.isVerified ? 'gold' : 'none',
    calculateProgress: d => ({ current: d.isVerified ? 1 : 0, max: 1 }) },
  // Renamed: early supporter (has badge number)
  { id:'early-supporter', icon:'spark', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.isEarlySupporterr ? 'gold' : 'none',
    calculateProgress: d => ({ current: d.isEarlySupporterr ? 1 : 0, max: 1 }) },
  { id:'party-animal', icon:'headphones', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.totalTickets>=30?'gold':d.totalTickets>=15?'silver':d.totalTickets>=5?'bronze':'none',
    calculateProgress: d => d.totalTickets>=30?{current:30,max:30}:d.totalTickets>=15?{current:d.totalTickets,max:30}:{current:d.totalTickets,max:5}},
  { id:'bass-monster', icon:'speaker', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.technoTickets>=30?'gold':d.technoTickets>=15?'silver':d.technoTickets>=5?'bronze':'none',
    calculateProgress: d => d.technoTickets>=30?{current:30,max:30}:d.technoTickets>=15?{current:d.technoTickets,max:30}:{current:d.technoTickets,max:5}},
  { id:'presale-hunter', icon:'star', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.presaleTickets>=30?'gold':d.presaleTickets>=15?'silver':d.presaleTickets>=5?'bronze':'none',
    calculateProgress: d => d.presaleTickets>=30?{current:30,max:30}:d.presaleTickets>=15?{current:d.presaleTickets,max:30}:{current:d.presaleTickets,max:5}},
  { id:'lima-explorer', icon:'map-pin', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.uniqueDistricts>=10?'gold':d.uniqueDistricts>=6?'silver':d.uniqueDistricts>=3?'bronze':'none',
    calculateProgress: d => d.uniqueDistricts>=10?{current:10,max:10}:d.uniqueDistricts>=6?{current:d.uniqueDistricts,max:10}:{current:d.uniqueDistricts,max:3}},
  { id:'resale-pro', icon:'transfer', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.completedResales>=25?'gold':d.completedResales>=10?'silver':d.completedResales>=3?'bronze':'none',
    calculateProgress: d => d.completedResales>=25?{current:25,max:25}:d.completedResales>=10?{current:d.completedResales,max:25}:{current:d.completedResales,max:3}},
  { id:'vip-status', icon:'diamond', tier:'none', progress:0, maxProgress:0,
    calculateTier: d => d.vipTickets>=25?'gold':d.vipTickets>=10?'silver':d.vipTickets>=3?'bronze':'none',
    calculateProgress: d => d.vipTickets>=25?{current:25,max:25}:d.vipTickets>=10?{current:d.vipTickets,max:25}:{current:d.vipTickets,max:3}},
  { id:'big-spender', icon:'money', tier:'none', progress:0, maxProgress:0,
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

const statusIcon = (status: string): IconName => {
  switch (status) {
    case 'active': return 'check';
    case 'used': return 'check';
    case 'transferred': return 'transfer';
    case 'resale-listed': return 'money';
    default: return 'ticket';
  }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, logout, updateProfile, isPromoter } = useAuth();
  const { tickets } = useUserTickets(user?.uid || '');
  const { t, lang } = useTranslation();
  const [editedName, setEditedName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [badges, setBadges] = useState<Badge[]>(BADGES);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [badgeSort, setBadgeSort] = useState<'default' | 'rarity'>('default');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const data: BadgeCalc = {
      totalTickets: tickets.length,
      totalSpent: tickets.reduce((s, tk) => s + (tk.price || 0), 0),
      completedResales: tickets.filter(tk => tk.status === 'transferred').length,
      technoTickets: tickets.filter(tk => tk.ticketType === 'techno').length,
      presaleTickets: tickets.filter(tk => tk.couponCode === 'PRESALE').length,
      vipTickets: tickets.filter(tk => tk.ticketName?.includes('VIP')).length,
      uniqueDistricts: new Set(tickets.map(tk => tk.eventLocation).filter(Boolean)).size,
      hasAccount: true,
      isVerified: profile?.kycStatus === 'verified',
      isEarlySupporterr: tickets.some(tk => tk.badgeNumber != null),
    };
    setBadges(BADGES.map(b => ({
      ...b,
      tier: b.calculateTier(data),
      progress: b.calculateProgress(data).current,
      maxProgress: b.calculateProgress(data).max,
    })));
  }, [tickets, profile?.dni]);

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
      toast.success(t.profile.nameUpdated);
    } catch { toast.error(t.profile.errorUpdateName); }
    finally { setIsSaving(false); }
  };

  const handleTagChange = async (badgeId: string) => {
    try {
      await updateProfile({ selectedTag: badgeId });
      toast.success(t.profile.tagUpdated);
    } catch { toast.error(t.profile.errorUpdateTag); }
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

  const locale = LOCALE_MAP[lang] || LOCALE_MAP.es;

  // Tag logic
  const unlockedBadges = badges.filter(b => b.tier !== 'none');
  const selectedTagId = profile.selectedTag || unlockedBadges[0]?.id || '';
  const selectedBadge = unlockedBadges.find(b => b.id === selectedTagId) || unlockedBadges[0];
  const badgeTicket = tickets.find(tk => tk.badgeNumber);
  const badgeNum = badgeTicket ? `#${String(badgeTicket.badgeNumber).padStart(3, '0')}` : '';

  // Badge display: show 3 by default, all when expanded with sorting
  const sortedBadges = (() => {
    if (!showAllBadges) return badges.slice(0, 3);
    const sorted = [...badges];
    if (badgeSort === 'rarity') {
      // Unlocked first, then by tier rarity (gold > silver > bronze > none)
      const tierOrder: Record<string, number> = { gold: 0, silver: 1, bronze: 2, none: 3 };
      sorted.sort((a, b) => (tierOrder[a.tier] ?? 3) - (tierOrder[b.tier] ?? 3));
    }
    // default = original order (date obtained / definition order)
    return sorted;
  })();
  const visibleBadges = sortedBadges;

  const getTagLabel = (b: Badge) => {
    const key = BADGE_KEY_MAP[b.id] as keyof typeof t.profile.badgeNames;
    const name = t.profile.badgeNames[key] || b.id;
    if (b.id === 'early-supporter' && badgeNum) return `${name} ${badgeNum}`;
    return name;
  };

  const renderTicketCard = (ticket: Ticket) => (
    <div key={ticket.id} className="pf-ticket-card">
      <div className="pf-ticket-top">
        <div className="pf-ticket-status">
          <span className="pf-ticket-status-dot"><Icon name={statusIcon(ticket.status)} size={14} /></span>
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
        <span>{ticket.eventDateLabel || formatTicketDate(ticket.eventDate, locale) || ''}</span>
      </div>

      <div className="pf-ticket-details">
        <div className="pf-ticket-detail">
          <span className="pf-ticket-detail-label">{t.myTickets.ticketTypeLabel}</span>
          <span>{ticket.ticketName}</span>
        </div>
        <div className="pf-ticket-detail">
          <span className="pf-ticket-detail-label">{t.myTickets.priceLabel}</span>
          <span className="pf-ticket-price-val">
            {ticket.price === 0 ? t.common.free : `S/${ticket.price}`}
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
      <div className="pf-bg-grid" />

      {/* ── Header Card ── */}
      <div className="pf-header">
        <div className="pf-header-top">
          <div className="pf-avatar">
            <div className="pf-verified-ring" />
            <UserAvatar photoURL={profile.photoURL} displayName={profile.displayName} />
          </div>

          <div className="pf-header-info">
            <div className="pf-name-row">
              <h1>{profile.displayName || t.profile.user}</h1>
              {profile.kycStatus === 'verified' && <span className="pf-verified-badge"><Icon name="check" size={14} /> {t.common.verified}</span>}
            </div>

            {selectedBadge && (
              <div className="pf-tag-display">
                <span className="pf-tag-emoji"><Icon name={selectedBadge.icon} size={14} /></span>
                <span className="pf-tag-label">{getTagLabel(selectedBadge)}</span>
              </div>
            )}

            <div className="pf-member-since">
              {t.profile.memberSince} <span>{formatMemberDate(profile.createdAt, locale)}</span>
            </div>
          </div>

          <button className="pf-edit-btn" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? t.profile.settingsClose : t.profile.editProfile}
          </button>
        </div>
      </div>

      {/* ── Settings Panel (toggleable) ── */}
      {showSettings && (
        <div id="settings" className="pf-settings">
          {/* Account */}
          <div className="pf-settings-group">
            <div className="pf-settings-group-title">{t.profile.settingsAccount}</div>

            <div className="pf-settings-field">
              <label>{t.profile.settingsFullName}</label>
              <div className="pf-settings-value pf-settings-locked">
                {profile.displayName || '—'}
              </div>
            </div>

            <div className="pf-settings-field">
              <label>{t.profile.settingsAlias}</label>
              <div className="pf-settings-input-row">
                <input
                  className="pf-settings-input"
                  value={editedName}
                  onChange={e => setEditedName(e.target.value)}
                  disabled={isSaving}
                  placeholder={t.profile.settingsAliasPlaceholder}
                />
                <button className="pf-settings-save" onClick={handleSaveName} disabled={isSaving || editedName === profile.displayName}>
                  {t.profile.settingsSaveAlias}
                </button>
              </div>
            </div>

            <div className="pf-settings-field">
              <label>{t.profile.settingsEmail}</label>
              <div className="pf-settings-value">{profile.email}</div>
            </div>

            <div className="pf-settings-field">
              <label>{t.profile.settingsIdDoc}</label>
              <div className="pf-settings-value">
                {profile.kycStatus === 'verified' ? (
                  <span className="pf-settings-verified">{profile.dniType?.toUpperCase() || 'DNI'}: {profile.dni} ✓</span>
                ) : profile.dni ? (
                  <span className="pf-settings-pending">
                    {profile.dniType?.toUpperCase() || 'DNI'}: {profile.dni}
                    {' · '}
                    <a href="https://verificacion.lezgo.fans" className="pf-verify-link">{t.profile.verifyNow || 'Verificar'}</a>
                  </span>
                ) : (
                  <a href="https://verificacion.lezgo.fans" className="pf-verify-btn">{t.profile.verifyIdentity || 'Verificar identidad'}</a>
                )}
              </div>
            </div>

            <div className="pf-settings-field">
              <label>{t.profile.settingsProfileTag}</label>
              {unlockedBadges.length > 0 ? (
                <select
                  className="pf-settings-select"
                  value={selectedTagId}
                  onChange={e => handleTagChange(e.target.value)}
                >
                  {unlockedBadges.map(b => {
                    const k = BADGE_KEY_MAP[b.id] as keyof typeof t.profile.badgeNames;
                    return <option key={b.id} value={b.id}>{t.profile.badgeNames[k] || b.id}</option>;
                  })}
                </select>
              ) : (
                <div className="pf-settings-value pf-settings-empty">{t.profile.settingsNoBadges}</div>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div className="pf-settings-group">
            <div className="pf-settings-group-title">{t.profile.settingsNotifications}</div>
            <div className="pf-settings-toggle-row">
              <span>{t.profile.settingsNotifEvents}</span>
              <input type="checkbox" className="pf-toggle" defaultChecked />
            </div>
            <div className="pf-settings-toggle-row">
              <span>{t.profile.settingsNotifReminders}</span>
              <input type="checkbox" className="pf-toggle" defaultChecked />
            </div>
          </div>

          {/* Privacy */}
          <div className="pf-settings-group">
            <div className="pf-settings-group-title">{t.profile.settingsPrivacy}</div>
            <div className="pf-settings-toggle-row">
              <span>{t.profile.settingsProfileVisible}</span>
              <input type="checkbox" className="pf-toggle" defaultChecked />
            </div>
            <div className="pf-settings-toggle-row">
              <span>{t.profile.settingsShowBadges}</span>
              <input type="checkbox" className="pf-toggle" defaultChecked />
            </div>
            <div className="pf-settings-toggle-row">
              <span>{t.profile.settingsShowHistory}</span>
              <input type="checkbox" className="pf-toggle" />
            </div>
          </div>

          <div className="pf-settings-actions">
            <button className="pf-settings-action-save" onClick={() => { handleSaveName(); setShowSettings(false); }} disabled={isSaving}>
              {t.profile.settingsSave}
            </button>
            <button className="pf-settings-action-exit" onClick={() => { setEditedName(profile.displayName || ''); setShowSettings(false); }}>
              {t.profile.settingsDiscard}
            </button>
          </div>
        </div>
      )}

      {/* ── Badges ── */}
      <div id="badges" className="pf-section">
        <div className="pf-section-head">
          <div className="pf-section-title">{t.profile.badges}</div>
          <span className="pf-section-more" onClick={() => { setShowAllBadges(!showAllBadges); setBadgeSort('default'); }}>
            {showAllBadges ? t.profile.badgeLess : t.profile.viewAllBadges}
          </span>
        </div>
        {showAllBadges && (
          <div className="pf-badge-filters">
            <button
              className={`pf-badge-filter ${badgeSort === 'default' ? 'active' : ''}`}
              onClick={() => setBadgeSort('default')}
            >
              {t.profile.badgeFilterRecent}
            </button>
            <button
              className={`pf-badge-filter ${badgeSort === 'rarity' ? 'active' : ''}`}
              onClick={() => setBadgeSort('rarity')}
            >
              {t.profile.badgeFilterRarity}
            </button>
          </div>
        )}
        <div className="pf-badges">
          {visibleBadges.map(b => {
            const key = BADGE_KEY_MAP[b.id] as keyof typeof t.profile.badgeNames;
            const isOneTime = ['registered', 'verified', 'early-supporter'].includes(b.id);
            const isEarlySupporter = b.id === 'early-supporter';
            const earlyNum = isEarlySupporter && badgeTicket ? ` #${badgeTicket.badgeNumber}` : '';
            const isSelected = selectedTagId === b.id;
            const badgeName = (t.profile.badgeNames[key] || b.id) + earlyNum;
            return (
              <div
                key={b.id}
                className={`pf-badge ${b.tier === 'none' ? 'locked' : ''} ${isSelected ? 'pf-badge--selected' : ''}`}
                onClick={b.tier !== 'none' ? () => handleTagChange(b.id) : undefined}
              >
                <div className="pf-badge-icon"><Icon name={b.icon} size={20} /></div>
                <div className="pf-badge-name">{badgeName}</div>
                <div className="pf-badge-desc">{t.profile.badgeDescs[key] || ''}</div>
                {!isOneTime && (
                  <>
                    {b.tier !== 'none' && (
                      <div className={`pf-badge-tier ${tierClass(b.tier)}`}>{tierLabelHelper(b.tier, t.profile)}</div>
                    )}
                    <div className="pf-badge-progress">
                      <div
                        className={`pf-badge-progress-fill ${tierClass(b.tier)}`}
                        style={{ width: `${b.maxProgress > 0 ? (b.progress / b.maxProgress) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="pf-badge-count">{b.progress}/{b.maxProgress}</div>
                  </>
                )}
                {/* 1-time badges: no progress bar, no label — unlocked state is visible by color */}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mis Entradas ── */}
      {tickets.length > 0 && (
        <div className="pf-section">
          <div className="pf-section-head">
            <div className="pf-section-title">{t.myTickets.title} ({tickets.length})</div>
          </div>
          <div className="pf-tickets-grid">
            {tickets.map(renderTicketCard)}
          </div>
        </div>
      )}

      {tickets.length === 0 && (
        <div className="pf-empty">
          <div className="pf-empty-icon"><Icon name="ticket" size={28} /></div>
          <p>{t.myTickets.noTickets}</p>
          <button className="pf-empty-btn" onClick={() => navigate('/inicio')}>{t.myTickets.exploreBtn}</button>
        </div>
      )}

      {/* Organizer CTA */}
      {isPromoter && (
        <div className="pf-organizer-cta">
          <div className="pf-cta-label">{t.profile.organizerMode}</div>
          <button onClick={() => navigate('/organizer')}>{t.profile.dashboardBtn}</button>
        </div>
      )}

      {/* Logout (when settings not open) */}
      {!showSettings && (
        <button className="pf-logout-btn" onClick={handleLogout}>{t.profile.logoutBtn}</button>
      )}
    </div>
  );
}
