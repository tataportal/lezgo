import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getEventById, createEvent, updateEvent } from '../services/eventService';
import { useTranslation } from '../i18n';
import type { EventTier, EventPhase, EventMeta, EventVisibleSections } from '../lib/types';
import { toDate } from '../lib/helpers';
import { calculateBuyerFee, calculateOrganizerFee } from '../lib/constants';
import { Icon } from '../components/ui';
import { Timestamp } from 'firebase/firestore/lite';
import './EventFormPage.css';

interface FormEvent {
  name: string;
  subtitle: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  venue: string;
  location: string;
  address: string;
  image: string;
  heroVideo: string;
  description: string;
  descriptionLong: string;
  genre: string;
  lineup: string[];
  tags: string[];
  prohibitedItems: string[];
  tiers: EventTier[];
  maxTicketsPerBuyer: number;
  status: 'draft' | 'published' | 'sold-out' | 'past';
  featured: boolean;
  visibleSections: EventVisibleSections;
  meta: EventMeta;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

const generateTierId = (): string => {
  return `tier_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

export default function EventFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const isEditMode = Boolean(eventId);

  const [formData, setFormData] = useState<FormEvent>({
    name: '',
    subtitle: '',
    date: '',
    timeStart: '20:00',
    timeEnd: '23:00',
    venue: '',
    location: '',
    address: '',
    image: '',
    heroVideo: '',
    description: '',
    descriptionLong: '',
    genre: '',
    lineup: [],
    tags: [],
    prohibitedItems: [],
    tiers: [],
    maxTicketsPerBuyer: 1,
    status: 'draft',
    featured: false,
    visibleSections: {
      lineup: true,
      venue: true,
      prohibitedItems: true,
    },
    meta: {
      crowdSize: 'medium',
      multiStage: false,
      alcohol: false,
      reentry: false,
      outdoor: false,
      ageRestriction: '18+',
    },
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && eventId) {
      loadEvent(eventId);
    } else {
      setInitialLoading(false);
    }
  }, [eventId, isEditMode]);

  const loadEvent = async (id: string) => {
    try {
      const event = await getEventById(id);
      if (!event) {
        toast.error(t.eventForm.errorNotFound);
        navigate('/organizer');
        return;
      }

      const dateStr = event.date ? toDate(event.date).toISOString().split('T')[0] : '';
      setFormData({
        name: event.name ?? '',
        subtitle: event.subtitle ?? '',
        date: dateStr,
        timeStart: event.timeStart ?? event.dateLabel?.split(' ')[0] ?? '20:00',
        timeEnd: event.timeEnd ?? event.dateLabel?.split(' ')[1] ?? '23:00',
        venue: event.venue ?? '',
        location: event.location ?? '',
        address: event.address ?? '',
        image: event.image ?? '',
        heroVideo: event.heroVideo ?? '',
        description: event.description ?? '',
        descriptionLong: event.descriptionLong ?? '',
        genre: event.genre ?? '',
        lineup: Array.isArray(event.lineup) ? event.lineup : [],
        tags: Array.isArray(event.tags) ? event.tags : [],
        prohibitedItems: Array.isArray(event.prohibitedItems) ? event.prohibitedItems : [],
        tiers: Array.isArray(event.tiers) ? event.tiers : [],
        maxTicketsPerBuyer: Math.max(Number(event.maxTicketsPerBuyer ?? 1), 1),
        status: (event.status as 'draft' | 'published' | 'sold-out' | 'past') ?? 'draft',
        featured: event.featured ?? false,
        visibleSections: event.visibleSections
          ? {
              lineup: event.visibleSections.lineup ?? true,
              venue: event.visibleSections.venue ?? true,
              prohibitedItems: event.visibleSections.prohibitedItems ?? true,
            }
          : { lineup: true, venue: true, prohibitedItems: true },
        meta: event.meta
          ? {
              crowdSize: event.meta.crowdSize ?? 'medium',
              multiStage: event.meta.multiStage ?? false,
              alcohol: event.meta.alcohol ?? false,
              reentry: event.meta.reentry ?? false,
              outdoor: event.meta.outdoor ?? false,
              ageRestriction: event.meta.ageRestriction ?? '18+',
            }
          : {
              crowdSize: 'medium',
              multiStage: false,
              alcohol: false,
              reentry: false,
              outdoor: false,
              ageRestriction: '18+',
            },
      });
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error(t.eventForm.errorLoad);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;
    const checked = inputElement.checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputElement = e.target as HTMLInputElement;
    const checked = inputElement.checked;

    setFormData((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleVisibleSectionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [name]: checked,
      },
    }));
  };

  const addLineup = () => {
    setFormData((prev) => ({
      ...prev,
      lineup: [...prev.lineup, ''],
    }));
  };

  const removeLineup = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      lineup: prev.lineup.filter((_, i) => i !== index),
    }));
  };

  const handleLineupChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      lineup: prev.lineup.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addTag = () => {
    setFormData((prev) => ({
      ...prev,
      tags: [...prev.tags, ''],
    }));
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleTagChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addProhibitedItem = () => {
    setFormData((prev) => ({
      ...prev,
      prohibitedItems: [...prev.prohibitedItems, ''],
    }));
  };

  const removeProhibitedItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prohibitedItems: prev.prohibitedItems.filter((_, i) => i !== index),
    }));
  };

  const handleProhibitedItemChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      prohibitedItems: prev.prohibitedItems.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addTier = () => {
    const newTier: EventTier = {
      id: generateTierId(),
      name: '',
      capacity: 100,
      sold: 0,
      phases: [
        {
          name: 'Fase 1',
          price: 50,
          active: true,
        },
      ],
    };
    setFormData((prev) => ({
      ...prev,
      tiers: [...prev.tiers, newTier],
    }));
  };

  const removeTier = (tierId: string) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers.filter((t) => t.id !== tierId),
    }));
  };

  const updateTier = (tierId: string, updates: Partial<EventTier>) => {
    setFormData((prev) => ({
      ...prev,
      tiers: prev.tiers.map((tier) => (tier.id === tierId ? { ...tier, ...updates } : tier)),
    }));
  };

  const addPhaseToTier = (tierId: string) => {
    const tier = formData.tiers.find((t) => t.id === tierId);
    const phases = tier?.phases ?? [];
    const newPhase: EventPhase = {
      name: `Fase ${phases.length + 1}`,
      price: 60,
      active: false,
    };
    updateTier(tierId, {
      phases: [...phases, newPhase],
    });
  };

  const removePhaseFromTier = (tierId: string, phaseIndex: number) => {
    const tier = formData.tiers.find((t) => t.id === tierId);
    if (tier && tier.phases) {
      const newPhases = (tier.phases ?? []).filter((_, i) => i !== phaseIndex);
      updateTier(tierId, { phases: newPhases });
    }
  };

  const updatePhaseInTier = (tierId: string, phaseIndex: number, updates: Partial<EventPhase>) => {
    const tier = formData.tiers.find((t) => t.id === tierId);
    if (tier && tier.phases) {
      const newPhases = (tier.phases ?? []).map((phase, i) =>
        i === phaseIndex ? { ...phase, ...updates } : phase
      );
      updateTier(tierId, { phases: newPhases });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t.eventForm.errorAuth);
      return;
    }

    if (!formData.name || !formData.date || !formData.venue || formData.tiers.length === 0) {
      toast.error(t.eventForm.errorRequired);
      return;
    }

    setLoading(true);

    try {
      const dateObj = new Date(formData.date);
      if (isNaN(dateObj.getTime())) {
        toast.error(t.eventForm.errorDate);
        setLoading(false);
        return;
      }
      const timestamp = Timestamp.fromDate(dateObj);

      const eventInput = {
        name: formData.name,
        subtitle: formData.subtitle,
        date: timestamp,
        dateLabel: `${formData.timeStart} ${formData.timeEnd}`.trim(),
        timeStart: formData.timeStart,
        timeEnd: formData.timeEnd,
        venue: formData.venue,
        location: formData.location,
        address: formData.address,
        image: formData.image,
        heroVideo: formData.heroVideo,
        description: formData.description,
        descriptionLong: formData.descriptionLong,
        genre: formData.genre,
        lineup: formData.lineup.filter((item) => item.trim()),
        tags: formData.tags.filter((item) => item.trim()),
        prohibitedItems: formData.prohibitedItems.filter((item) => item.trim()),
        tiers: formData.tiers,
        maxTicketsPerBuyer: Math.max(Number(formData.maxTicketsPerBuyer || 1), 1),
        status: formData.status,
        featured: formData.featured,
        slug: generateSlug(formData.name),
        visibleSections: formData.visibleSections,
        meta: formData.meta,
      };

      if (isEditMode && eventId) {
        await updateEvent(eventId, eventInput);
        toast.success(t.eventForm.successUpdate);
      } else {
        await createEvent(eventInput, user.uid);
        toast.success(t.eventForm.successCreate);
      }

      navigate('/organizer');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(t.eventForm.errorSave);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="page-container">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="ef-view">
      <div className="ef-header">
        <h1>{isEditMode ? t.eventForm.editEvent : t.eventForm.newEvent}</h1>
        <button type="button" className="ef-back" onClick={() => navigate('/organizer')}>
          {t.eventForm.backDashboard}
        </button>
      </div>

      <div className="ef-preview-banner">
        <div className="ef-preview-banner-icon"><Icon name="analytics" size={20} /></div>
        <div className="ef-preview-banner-text">
          {t.eventForm.previewBanner} <a href="#preview">{t.eventForm.previewLink}</a>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ── Información Básica ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.basicInfo}</h2>

          <div className="ef-row">
            <div className="ef-field">
              <label htmlFor="name" className="ef-label">
                {t.eventForm.eventName}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="ef-input"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t.eventForm.eventNamePlaceholder}
              />
            </div>
            <div className="ef-field">
              <label htmlFor="subtitle" className="ef-label">
                {t.eventForm.subtitle}
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                className="ef-input"
                value={formData.subtitle}
                onChange={handleChange}
                placeholder={t.eventForm.subtitlePlaceholder}
              />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field">
              <label htmlFor="genre" className="ef-label">
                {t.eventForm.genre}
              </label>
              <input
                type="text"
                id="genre"
                name="genre"
                className="ef-input"
                value={formData.genre}
                onChange={handleChange}
                required
                placeholder={t.eventForm.genrePlaceholder}
              />
            </div>
            <div className="ef-field">
              <label htmlFor="status" className="ef-label">
                {t.eventForm.status}
              </label>
              <select id="status" name="status" className="ef-select" value={formData.status} onChange={handleChange}>
                <option value="draft">{t.common.draft}</option>
                <option value="published">{t.common.published}</option>
                <option value="sold-out">{t.common.soldOut}</option>
                <option value="past">{t.common.past}</option>
              </select>
            </div>
          </div>

          <div className="ef-field full">
            <label htmlFor="description" className="ef-label">
              {t.eventForm.shortDesc}
            </label>
            <textarea
              id="description"
              name="description"
              className="ef-textarea"
              value={formData.description}
              onChange={handleChange}
              required
              placeholder={t.eventForm.shortDescPlaceholder}
              rows={3}
            />
          </div>

          <div className="ef-field full">
            <label htmlFor="descriptionLong" className="ef-label">
              {t.eventForm.longDesc}
            </label>
            <textarea
              id="descriptionLong"
              name="descriptionLong"
              className="ef-textarea"
              value={formData.descriptionLong}
              onChange={handleChange}
              placeholder={t.eventForm.longDescPlaceholder}
              rows={5}
            />
          </div>
        </div>

        {/* ── Fecha y Lugar ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.dateAndVenue}</h2>

          <div className="ef-row-3">
            <div className="ef-field">
              <label htmlFor="date" className="ef-label">
                {t.eventForm.date}
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="ef-input"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="ef-field">
              <label htmlFor="timeStart" className="ef-label">
                {t.eventForm.timeStart}
              </label>
              <input
                type="time"
                id="timeStart"
                name="timeStart"
                className="ef-input"
                value={formData.timeStart}
                onChange={handleChange}
                required
              />
            </div>
            <div className="ef-field">
              <label htmlFor="timeEnd" className="ef-label">
                {t.eventForm.timeEnd}
              </label>
              <input
                type="time"
                id="timeEnd"
                name="timeEnd"
                className="ef-input"
                value={formData.timeEnd}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="ef-row">
            <div className="ef-field">
              <label htmlFor="venue" className="ef-label">
                {t.eventForm.venueName}
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                className="ef-input"
                value={formData.venue}
                onChange={handleChange}
                required
                placeholder={t.eventForm.venueNamePlaceholder}
              />
            </div>
            <div className="ef-field">
              <label htmlFor="location" className="ef-label">
                {t.eventForm.district}
              </label>
              <input
                type="text"
                id="location"
                name="location"
                className="ef-input"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder={t.eventForm.districtPlaceholder}
              />
            </div>
          </div>

          <div className="ef-field full">
            <label htmlFor="address" className="ef-label">
              {t.eventForm.address}
            </label>
            <input
              type="text"
              id="address"
              name="address"
              className="ef-input"
              value={formData.address}
              onChange={handleChange}
              placeholder={t.eventForm.addressPlaceholder}
            />
          </div>
        </div>

        {/* ── Media ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.media}</h2>

          <div className="ef-row">
            <div className="ef-field">
              <label htmlFor="image" className="ef-label">
                {t.eventForm.heroImageUrl}
              </label>
              <input
                type="url"
                id="image"
                name="image"
                className="ef-input"
                value={formData.image}
                onChange={handleChange}
                placeholder={t.eventForm.heroImagePlaceholder}
              />
            </div>
            <div className="ef-field">
              <label htmlFor="heroVideo" className="ef-label">
                {t.eventForm.youtubeId}
              </label>
              <input
                type="text"
                id="heroVideo"
                name="heroVideo"
                className="ef-input"
                value={formData.heroVideo}
                onChange={handleChange}
                placeholder="dQw4w9WgXcQ"
              />
            </div>
          </div>
        </div>

        {/* ── Lineup ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.lineupSection}</h2>

          {(formData.lineup ?? []).map((artist, index) => (
            <div key={index} className="ef-artist-row">
              <input
                type="text"
                className="ef-input"
                value={artist}
                onChange={(e) => handleLineupChange(index, e.target.value)}
                placeholder={t.eventForm.artistPlaceholder}
              />
              <button
                type="button"
                className="ef-remove-btn"
                onClick={() => removeLineup(index)}
                title={t.eventForm.removeArtist}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="ef-add-btn" onClick={addLineup}>
            {t.eventForm.addArtist}
          </button>
        </div>

        {/* ── Tags ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.tagsSection}</h2>

          {(formData.tags ?? []).map((tag, index) => (
            <div key={index} className="ef-artist-row">
              <input
                type="text"
                className="ef-input"
                value={tag}
                onChange={(e) => handleTagChange(index, e.target.value)}
                placeholder={t.eventForm.tagPlaceholder}
              />
              <button
                type="button"
                className="ef-remove-btn"
                onClick={() => removeTag(index)}
                title={t.eventForm.removeTag}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="ef-add-btn" onClick={addTag}>
            {t.eventForm.addTag}
          </button>
        </div>

        {/* ── Info del Evento ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.eventInfoSection}</h2>

          <div className="ef-row">
            <div className="ef-field">
              <label htmlFor="crowdSize" className="ef-label">
                {t.eventForm.crowdSize}
              </label>
              <select
                id="crowdSize"
                name="crowdSize"
                className="ef-select"
                value={formData.meta.crowdSize}
                onChange={handleMetaChange}
              >
                {t.eventForm.crowdSizes.map((size, idx) => (
                  <option key={idx} value={['small', 'medium', 'large', 'mega'][idx]}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="ef-field">
              <label htmlFor="ageRestriction" className="ef-label">
                {t.eventForm.minAge}
              </label>
              <select
                id="ageRestriction"
                name="ageRestriction"
                className="ef-select"
                value={formData.meta.ageRestriction}
                onChange={handleMetaChange}
              >
                {t.eventForm.ages.map((age, idx) => (
                  <option key={idx} value={['all', '16+', '18+', '21+'][idx]}>
                    {age}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ef-row">
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="multiStage"
                checked={formData.meta.multiStage}
                onChange={handleMetaChange}
              />
              {t.eventForm.multiStage}
            </label>
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="alcohol"
                checked={formData.meta.alcohol}
                onChange={handleMetaChange}
              />
              {t.eventForm.barAvailable}
            </label>
          </div>

          <div className="ef-row">
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="reentry"
                checked={formData.meta.reentry}
                onChange={handleMetaChange}
              />
              {t.eventForm.reentryAllowed}
            </label>
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="outdoor"
                checked={formData.meta.outdoor}
                onChange={handleMetaChange}
              />
              {t.eventForm.outdoor}
            </label>
          </div>
        </div>

        {/* ── No ingresan ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.prohibited}</h2>

          {(formData.prohibitedItems ?? []).map((item, index) => (
            <div key={index} className="ef-artist-row">
              <input
                type="text"
                className="ef-input"
                value={item}
                onChange={(e) => handleProhibitedItemChange(index, e.target.value)}
                placeholder={t.eventForm.prohibitedPlaceholder}
              />
              <button
                type="button"
                className="ef-remove-btn"
                onClick={() => removeProhibitedItem(index)}
                title={t.eventForm.removeProhibited}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className="ef-add-btn" onClick={addProhibitedItem}>
            {t.eventForm.addProhibited}
          </button>
        </div>

        {/* ── Tickets ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.ticketsSection}</h2>

          <div className="ef-row">
            <div className="ef-field">
              <label htmlFor="maxTicketsPerBuyer" className="ef-label">
                {t.eventForm.maxTicketsPerBuyer}
              </label>
              <input
                type="number"
                id="maxTicketsPerBuyer"
                name="maxTicketsPerBuyer"
                className="ef-input"
                value={formData.maxTicketsPerBuyer}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxTicketsPerBuyer: Math.max(parseInt(e.target.value || '1', 10), 1),
                  }))
                }
                min="1"
              />
              <p className="ef-help">{t.eventForm.maxTicketsPerBuyerHelp}</p>
            </div>
          </div>

          {(formData.tiers ?? []).map((tier, tierIndex) => (
            <div key={tier.id} className="ef-tier">
              <div className="ef-tier-header">
                <div className="ef-tier-num">{t.eventForm.tierLabel} {tierIndex + 1}</div>
                <button
                  type="button"
                  className="ef-remove-btn"
                  onClick={() => removeTier(tier.id)}
                  title={t.eventForm.removeTier}
                >
                  ×
                </button>
              </div>

              <div className="ef-row">
                <div className="ef-field">
                  <label className="ef-label">{t.eventForm.tierLabel}</label>
                  <input
                    type="text"
                    className="ef-input"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                    placeholder={t.eventForm.tierNamePlaceholder}
                  />
                </div>
                <div className="ef-field">
                  <label className="ef-label">{t.eventForm.capacityLabel}</label>
                  <input
                    type="number"
                    className="ef-input"
                    value={tier.capacity}
                    onChange={(e) => updateTier(tier.id, { capacity: parseInt(e.target.value, 10) })}
                    min="1"
                  />
                </div>
              </div>

              {/* ── Phases ── */}
              <div className="ef-phases-wrap">
                <div className="ef-phase-labels">
                  <span>{t.eventForm.phaseName}</span>
                  <span>{t.eventForm.phasePrice}</span>
                  <span>{t.eventForm.phaseActive}</span>
                  <span></span>
                  <span></span>
                </div>

                {(tier.phases ?? []).map((phase, phaseIndex) => (
                  <div key={phaseIndex} className="ef-phase-row">
                    <input
                      type="text"
                      className="ef-input"
                      value={phase.name}
                      onChange={(e) => updatePhaseInTier(tier.id, phaseIndex, { name: e.target.value })}
                      placeholder={t.eventForm.phaseNamePlaceholder}
                    />
                    <input
                      type="number"
                      className="ef-input"
                      value={phase.price}
                      onChange={(e) => updatePhaseInTier(tier.id, phaseIndex, { price: parseFloat(e.target.value) })}
                      min="0"
                      step="0.01"
                    />
                    <label className="ef-toggle-label ef-toggle-label--inline">
                      <input
                        type="checkbox"
                        checked={phase.active}
                        onChange={(e) => updatePhaseInTier(tier.id, phaseIndex, { active: e.target.checked })}
                      />
                    </label>
                    {(tier.phases ?? []).length > 1 && (
                      <button
                        type="button"
                        className="ef-remove-btn"
                        onClick={() => removePhaseFromTier(tier.id, phaseIndex)}
                        title={t.eventForm.removePhase}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addPhaseToTier(tier.id)}
                  className="ef-add-btn ef-add-btn--mt"
                >
                  {t.eventForm.addPhase}
                </button>
              </div>

              {/* ── Margin Breakdown ── */}
              <div className="ef-margin">
                <div className="ef-margin-title">{t.eventForm.revenueSummary}</div>
                {(tier.phases ?? [])
                  .filter((p) => p.active)
                  .map((phase, idx) => {
                    const revenue = phase.price * tier.capacity;
                    const organizerFeePerTicket = calculateOrganizerFee(phase.price);
                    const buyerFeePerTicket = calculateBuyerFee(phase.price);
                    const organizerFee = organizerFeePerTicket * tier.capacity;
                    const buyerTotal = phase.price + buyerFeePerTicket;
                    const net = revenue - organizerFee;
                    return (
                      <div key={idx}>
                        <div className="ef-margin-row">
                          <span className="label">{phase.name} (${phase.price} × {tier.capacity})</span>
                          <span className="value">S/ {revenue.toFixed(2)}</span>
                        </div>
                        <div className="ef-margin-row">
                          <span className="label">{t.eventForm.buyerPays}</span>
                          <span className="value">S/ {buyerTotal.toFixed(2)}</span>
                        </div>
                        <div className="ef-margin-row">
                          <span className="label">{t.eventForm.commission}</span>
                          <span className="value">S/ {organizerFee.toFixed(2)}</span>
                        </div>
                        <div className="ef-margin-row total">
                          <span className="label">{t.eventForm.net}</span>
                          <span className="value">S/ {net.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          <button type="button" className="ef-add-btn" onClick={addTier}>
            {t.eventForm.addTier}
          </button>
        </div>

        {/* ── Secciones Visibles ── */}
        <div className="ef-section">
          <h2 className="ef-section-title">{t.eventForm.visibleSections}</h2>

          <div className="ef-row">
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="lineup"
                checked={formData.visibleSections.lineup}
                onChange={handleVisibleSectionsChange}
              />
              {t.eventForm.showLineup}
            </label>
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="venue"
                checked={formData.visibleSections.venue}
                onChange={handleVisibleSectionsChange}
              />
              {t.eventForm.showVenue}
            </label>
          </div>

          <div className="ef-row">
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="prohibitedItems"
                checked={formData.visibleSections.prohibitedItems}
                onChange={handleVisibleSectionsChange}
              />
              {t.eventForm.showProhibited}
            </label>
            <label className="ef-toggle-label">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
              />
              {t.eventForm.featuredEvent}
            </label>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="ef-actions">
          <button type="button" className="ef-btn-cancel" onClick={() => navigate('/organizer')}>
            {t.common.cancel}
          </button>
          <button type="submit" className="ef-btn-save" disabled={loading}>
            {loading ? t.common.saving : isEditMode ? t.eventForm.updateEvent : t.eventForm.saveEvent}
          </button>
        </div>
      </form>
    </div>
  );
}
