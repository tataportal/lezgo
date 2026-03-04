import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useUserTickets } from '../hooks/useTickets';
import toast from 'react-hot-toast';
import './ProfilePage.css';

interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  tier: 'none' | 'bronze' | 'silver' | 'gold';
  progress: number;
  maxProgress: number;
  calculateTier: (data: BadgeCalculationData) => 'none' | 'bronze' | 'silver' | 'gold';
  calculateProgress: (data: BadgeCalculationData) => { current: number; max: number };
}

interface BadgeCalculationData {
  totalTickets: number;
  totalSpent: number;
  completedResales: number;
  technoTickets: number;
  presaleTickets: number;
  vipTickets: number;
  uniqueDistricts: number;
  isEarlyAdopter: boolean;
}

const BADGES: Badge[] = [
  {
    id: 'party-animal',
    emoji: '🎧',
    name: 'Fiestero',
    description: 'Asiste a eventos',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.totalTickets >= 30) return 'gold';
      if (data.totalTickets >= 15) return 'silver';
      if (data.totalTickets >= 5) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      if (data.totalTickets >= 30) return { current: 30, max: 30 };
      if (data.totalTickets >= 15) return { current: data.totalTickets, max: 30 };
      return { current: data.totalTickets, max: 5 };
    },
  },
  {
    id: 'early-adopter',
    emoji: '⚡',
    name: 'Early Adopter',
    description: 'Primeros 1000 usuarios',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => (data.isEarlyAdopter ? 'gold' : 'none'),
    calculateProgress: (data) => ({ current: data.isEarlyAdopter ? 1 : 0, max: 1 }),
  },
  {
    id: 'bass-monster',
    emoji: '🔊',
    name: 'Bass Monster',
    description: 'Techno events attended',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.technoTickets >= 30) return 'gold';
      if (data.technoTickets >= 15) return 'silver';
      if (data.technoTickets >= 5) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      if (data.technoTickets >= 30) return { current: 30, max: 30 };
      if (data.technoTickets >= 15) return { current: data.technoTickets, max: 30 };
      return { current: data.technoTickets, max: 5 };
    },
  },
  {
    id: 'presale-hunter',
    emoji: '🎯',
    name: 'Preventa Hunter',
    description: 'Compras en preventa',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.presaleTickets >= 30) return 'gold';
      if (data.presaleTickets >= 15) return 'silver';
      if (data.presaleTickets >= 5) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      if (data.presaleTickets >= 30) return { current: 30, max: 30 };
      if (data.presaleTickets >= 15) return { current: data.presaleTickets, max: 30 };
      return { current: data.presaleTickets, max: 5 };
    },
  },
  {
    id: 'lima-explorer',
    emoji: '🧭',
    name: 'Lima Explorer',
    description: 'Distritos visitados',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.uniqueDistricts >= 10) return 'gold';
      if (data.uniqueDistricts >= 6) return 'silver';
      if (data.uniqueDistricts >= 3) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      if (data.uniqueDistricts >= 10) return { current: 10, max: 10 };
      if (data.uniqueDistricts >= 6) return { current: data.uniqueDistricts, max: 10 };
      return { current: data.uniqueDistricts, max: 3 };
    },
  },
  {
    id: 'resale-pro',
    emoji: '🤝',
    name: 'Resale Pro',
    description: 'Reventas completadas',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.completedResales >= 25) return 'gold';
      if (data.completedResales >= 10) return 'silver';
      if (data.completedResales >= 3) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      if (data.completedResales >= 25) return { current: 25, max: 25 };
      if (data.completedResales >= 10) return { current: data.completedResales, max: 25 };
      return { current: data.completedResales, max: 3 };
    },
  },
  {
    id: 'vip-status',
    emoji: '💎',
    name: 'VIP Status',
    description: 'Compras VIP',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.vipTickets >= 25) return 'gold';
      if (data.vipTickets >= 10) return 'silver';
      if (data.vipTickets >= 3) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      if (data.vipTickets >= 25) return { current: 25, max: 25 };
      if (data.vipTickets >= 10) return { current: data.vipTickets, max: 25 };
      return { current: data.vipTickets, max: 3 };
    },
  },
  {
    id: 'big-spender',
    emoji: '💰',
    name: 'Big Spender',
    description: 'Dinero gastado',
    tier: 'none',
    progress: 0,
    maxProgress: 0,
    calculateTier: (data) => {
      if (data.totalSpent >= 5000) return 'gold';
      if (data.totalSpent >= 2000) return 'silver';
      if (data.totalSpent >= 500) return 'bronze';
      return 'none';
    },
    calculateProgress: (data) => {
      const spent = Math.floor(data.totalSpent);
      if (spent >= 5000) return { current: 5000, max: 5000 };
      if (spent >= 2000) return { current: spent, max: 5000 };
      return { current: spent, max: 500 };
    },
  },
];

const getTierColor = (tier: 'none' | 'bronze' | 'silver' | 'gold'): string => {
  const colors: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    none: '#444444',
  };
  return colors[tier] || '#444444';
};

const getTierLabel = (tier: 'none' | 'bronze' | 'silver' | 'gold'): string => {
  const labels: Record<string, string> = {
    bronze: 'Bronce',
    silver: 'Plata',
    gold: 'Oro',
    none: 'Bloqueado',
  };
  return labels[tier] || 'Bloqueado';
};

const getInitials = (name: string | undefined): string => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (date: unknown): string => {
  if (!date) return 'N/A';
  try {
    const timestamp = date as { seconds?: number; toDate?: () => Date };
    const jsDate = timestamp.toDate?.() || new Date((timestamp.seconds ?? 0) * 1000);
    return jsDate.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, logout, updateProfile, isPromoter } = useAuth();
  const { tickets } = useUserTickets(user?.uid || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [badges, setBadges] = useState<Badge[]>(BADGES);

  // Calculate badges based on tickets
  useEffect(() => {
    const calculateBadgeData = (): BadgeCalculationData => {
      const uniqueDistricts = new Set(tickets.map((t) => t.eventLocation).filter(Boolean)).size;
      const technoTickets = tickets.filter((t) => t.ticketType === 'techno').length;
      const presaleTickets = tickets.filter((t) => t.couponCode === 'PRESALE').length;
      const vipTickets = tickets.filter((t) => t.ticketName?.includes('VIP')).length;
      const completedResales = tickets.filter((t) => t.status === 'transferred').length;
      const totalSpent = tickets.reduce((sum, t) => sum + (t.price || 0), 0);

      return {
        totalTickets: tickets.length,
        totalSpent,
        completedResales,
        technoTickets,
        presaleTickets,
        vipTickets,
        uniqueDistricts,
        isEarlyAdopter: false, // Would need to check from server
      };
    };

    const data = calculateBadgeData();
    const updatedBadges = BADGES.map((badge) => {
      const tier = badge.calculateTier(data);
      const progress = badge.calculateProgress(data);
      return {
        ...badge,
        tier,
        progress: progress.current,
        maxProgress: progress.max,
      };
    });

    setBadges(updatedBadges);
  }, [tickets]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
      toast.success('Sesión cerrada');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({ displayName: editedName });
      setIsEditing(false);
      toast.success('Nombre actualizado');
    } catch (error) {
      toast.error('Error al actualizar nombre');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">Cargando perfil...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const totalSpent = tickets.reduce((sum, t) => sum + (t.price || 0), 0);
  const completedResales = tickets.filter((t) => t.status === 'transferred').length;

  return (
    <div className="profile-container">
      <div className="profile-content">
        {/* Header Section */}
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} />
            ) : (
              <span className="profile-avatar-initials">{getInitials(profile.displayName)}</span>
            )}
          </div>

          <div className="profile-header-info">
            <div className="profile-name-section">
              {isEditing ? (
                <div className="profile-name-edit">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="profile-name-input"
                    disabled={isSaving}
                    autoFocus
                  />
                  <button
                    className="profile-name-save"
                    onClick={handleSaveName}
                    disabled={isSaving}
                  >
                    Guardar
                  </button>
                  <button
                    className="profile-name-cancel"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedName(profile.displayName);
                    }}
                    disabled={isSaving}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="profile-name-display">
                  <h1 className="profile-name">
                    {profile.displayName || 'Usuario'}
                  </h1>
                  <button
                    className="profile-name-edit-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            <div className="profile-status">
              {profile.dni && (
                <span className="profile-verified">
                  <span className="profile-verified-icon">✓</span>
                  Identidad verificada
                </span>
              )}
            </div>

            <p className="profile-email">{profile.email}</p>

            <p className="profile-member-since">
              Miembro desde {profile.createdAt ? formatDate(profile.createdAt) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-value">{tickets.length}</div>
            <div className="profile-stat-label">Eventos</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">S/ {totalSpent.toLocaleString('es-PE')}</div>
            <div className="profile-stat-label">Total gastado</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-value">{completedResales}</div>
            <div className="profile-stat-label">Reventas completadas</div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="profile-badges-section">
          <h2 className="profile-section-title">Insignias</h2>
          <div className="profile-badges-grid">
            {badges.map((badge) => (
              <div key={badge.id} className="profile-badge-card">
                <div className="profile-badge-emoji">{badge.emoji}</div>
                <h3 className="profile-badge-name">{badge.name}</h3>
                <p className="profile-badge-description">{badge.description}</p>

                {badge.tier !== 'none' && (
                  <div className="profile-badge-progress">
                    <div
                      className="profile-badge-progress-bar"
                      style={{
                        background: getTierColor(badge.tier),
                      }}
                    >
                      <div
                        className="profile-badge-progress-fill"
                        style={{
                          width: `${(badge.progress / badge.maxProgress) * 100}%`,
                          backgroundColor: getTierColor(badge.tier),
                        }}
                      />
                    </div>
                    <span
                      className="profile-badge-tier"
                      style={{
                        color: getTierColor(badge.tier),
                      }}
                    >
                      {getTierLabel(badge.tier)}
                    </span>
                  </div>
                )}

                {badge.tier === 'none' && (
                  <div className="profile-badge-locked">
                    <span>Bloqueado</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          {isPromoter && (
            <button
              className="profile-action-link"
              onClick={() => navigate('/organizador')}
            >
              Panel de Organizador →
            </button>
          )}
          <button
            className="profile-action-button profile-action-button--logout"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
