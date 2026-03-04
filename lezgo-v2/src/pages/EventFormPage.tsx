import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getEventById, createEvent, updateEvent } from '../services/eventService';
import type { EventTier, EventPhase, EventMeta, EventVisibleSections } from '../lib/types';
import { toDate } from '../lib/helpers';
import { Timestamp } from 'firebase/firestore';
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
  return `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function EventFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        toast.error('Evento no encontrado');
        navigate('/organizer');
        return;
      }

      const dateStr = event.date ? toDate(event.date).toISOString().split('T')[0] : '';
      setFormData({
        name: event.name ?? '',
        subtitle: event.subtitle ?? '',
        date: dateStr,
        timeStart: event.dateLabel?.split(' ')[0] ?? '20:00',
        timeEnd: event.dateLabel?.split(' ')[1] ?? '23:00',
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
        status: (event.status as 'draft' | 'published' | 'sold-out' | 'past') ?? 'draft',
        featured: event.featured ?? false,
        visibleSections: event.visibleSections ? {
          lineup: event.visibleSections.lineup ?? true,
          venue: event.visibleSections.venue ?? true,
          prohibitedItems: event.visibleSections.prohibitedItems ?? true,
        } : { lineup: true, venue: true, prohibitedItems: true },
        meta: event.meta ? {
          crowdSize: event.meta.crowdSize ?? 'medium',
          multiStage: event.meta.multiStage ?? false,
          alcohol: event.meta.alcohol ?? false,
          reentry: event.meta.reentry ?? false,
          outdoor: event.meta.outdoor ?? false,
          ageRestriction: event.meta.ageRestriction ?? '18+',
        } : { crowdSize: 'medium', multiStage: false, alcohol: false, reentry: false, outdoor: false, ageRestriction: '18+' },
      });
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Error cargando el evento');
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
      tiers: prev.tiers.map((tier) =>
        tier.id === tierId ? { ...tier, ...updates } : tier
      ),
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
      toast.error('Debes estar autenticado');
      return;
    }

    if (!formData.name || !formData.date || !formData.venue || formData.tiers.length === 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      const dateObj = new Date(formData.date);
      const timestamp = Timestamp.fromDate(dateObj);

      const eventInput = {
        name: formData.name,
        subtitle: formData.subtitle,
        date: timestamp,
        dateLabel: `${formData.timeStart}`,
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
        status: formData.status,
        featured: formData.featured,
        slug: generateSlug(formData.name),
        visibleSections: formData.visibleSections,
        meta: formData.meta,
      };

      if (isEditMode && eventId) {
        await updateEvent(eventId, eventInput);
        toast.success('Evento actualizado exitosamente');
      } else {
        await createEvent(eventInput, user.uid);
        toast.success('Evento creado exitosamente');
      }

      navigate('/organizer');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Error al guardar el evento');
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
    <div className="event-form-page">
      <div className="form-container">
        <h1 className="form-title">{isEditMode ? 'Editar Evento' : 'Crear Nuevo Evento'}</h1>

        <form onSubmit={handleSubmit} className="event-form">
          {/* Basic Info Section */}
          <div className="form-section">
            <h2 className="section-title">Información Básica</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Nombre del Evento *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nombre del evento"
                />
              </div>
              <div className="form-group">
                <label htmlFor="subtitle">Subtítulo</label>
                <input
                  type="text"
                  id="subtitle"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleChange}
                  placeholder="Subtítulo opcional"
                />
              </div>
              <div className="form-group">
                <label htmlFor="date">Fecha *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="timeStart">Hora Inicio</label>
                <input
                  type="time"
                  id="timeStart"
                  name="timeStart"
                  value={formData.timeStart}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="timeEnd">Hora Fin</label>
                <input
                  type="time"
                  id="timeEnd"
                  name="timeEnd"
                  value={formData.timeEnd}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="genre">Género</label>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  placeholder="p.ej. Techno, House"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="venue">Lugar *</label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                required
                placeholder="Nombre del lugar"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="location">Ciudad</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="p.ej. Lima"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Dirección</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Dirección completa"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Descripción corta del evento"
                rows={3}
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="descriptionLong">Descripción Larga</label>
              <textarea
                id="descriptionLong"
                name="descriptionLong"
                value={formData.descriptionLong}
                onChange={handleChange}
                placeholder="Descripción detallada"
                rows={5}
              />
            </div>
          </div>

          {/* Media Section */}
          <div className="form-section">
            <h2 className="section-title">Medios</h2>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="image">URL de Imagen</label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="heroVideo">URL de Video Hero</label>
                <input
                  type="url"
                  id="heroVideo"
                  name="heroVideo"
                  value={formData.heroVideo}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/video.mp4"
                />
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div className="form-section">
            <h2 className="section-title">Etiquetas</h2>
            <div className="dynamic-list">
              {(formData.tags ?? []).map((tag, index) => (
                <div key={index} className="dynamic-item">
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => handleTagChange(index, e.target.value)}
                    placeholder="Etiqueta"
                  />
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeTag(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add" onClick={addTag}>
                + Agregar Etiqueta
              </button>
            </div>
          </div>

          {/* Ticket Tiers Section */}
          <div className="form-section">
            <h2 className="section-title">Tipos de Entrada *</h2>
            <div className="tiers-list">
              {(formData.tiers ?? []).map((tier) => (
                <div key={tier.id} className="tier-card">
                  <div className="tier-header">
                    <h3>Tipo de Entrada</h3>
                    <button
                      type="button"
                      className="btn-remove-tier"
                      onClick={() => removeTier(tier.id)}
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="tier-grid">
                    <div className="form-group">
                      <label>Nombre</label>
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                        placeholder="p.ej. General"
                      />
                    </div>
                    <div className="form-group">
                      <label>Capacidad</label>
                      <input
                        type="number"
                        value={tier.capacity}
                        onChange={(e) => updateTier(tier.id, { capacity: parseInt(e.target.value, 10) })}
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Phases */}
                  <div className="phases-section">
                    <h4>Fases de Venta</h4>
                    <div className="phases-list">
                      {(tier.phases ?? []).map((phase, phaseIndex) => (
                        <div key={phaseIndex} className="phase-row">
                          <div className="phase-grid">
                            <div className="form-group">
                              <label>Nombre de Fase</label>
                              <input
                                type="text"
                                value={phase.name}
                                onChange={(e) =>
                                  updatePhaseInTier(tier.id, phaseIndex, { name: e.target.value })
                                }
                              />
                            </div>
                            <div className="form-group">
                              <label>Precio (S/)</label>
                              <input
                                type="number"
                                value={phase.price}
                                onChange={(e) =>
                                  updatePhaseInTier(tier.id, phaseIndex, { price: parseFloat(e.target.value) })
                                }
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="form-group checkbox">
                              <label>
                                <input
                                  type="checkbox"
                                  checked={phase.active}
                                  onChange={(e) =>
                                    updatePhaseInTier(tier.id, phaseIndex, { active: e.target.checked })
                                  }
                                />
                                Activo
                              </label>
                            </div>
                          </div>
                          {(tier.phases ?? []).length > 1 && (
                            <button
                              type="button"
                              className="btn-remove-phase"
                              onClick={() => removePhaseFromTier(tier.id, phaseIndex)}
                            >
                              Quitar Fase
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-add-phase"
                      onClick={() => addPhaseToTier(tier.id)}
                    >
                      + Agregar Fase
                    </button>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-add-tier" onClick={addTier}>
                + Agregar Tipo de Entrada
              </button>
            </div>
          </div>

          {/* Lineup Section */}
          <div className="form-section">
            <h2 className="section-title">Alineación Artística</h2>
            <div className="dynamic-list">
              {(formData.lineup ?? []).map((artist, index) => (
                <div key={index} className="dynamic-item">
                  <input
                    type="text"
                    value={artist}
                    onChange={(e) => handleLineupChange(index, e.target.value)}
                    placeholder="Nombre del artista"
                  />
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeLineup(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add" onClick={addLineup}>
                + Agregar Artista
              </button>
            </div>
          </div>

          {/* Prohibited Items Section */}
          <div className="form-section">
            <h2 className="section-title">Artículos Prohibidos</h2>
            <div className="dynamic-list">
              {(formData.prohibitedItems ?? []).map((item, index) => (
                <div key={index} className="dynamic-item">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleProhibitedItemChange(index, e.target.value)}
                    placeholder="Artículo prohibido"
                  />
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeProhibitedItem(index)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
              <button type="button" className="btn-add" onClick={addProhibitedItem}>
                + Agregar Artículo
              </button>
            </div>
          </div>

          {/* Meta Options Section */}
          <div className="form-section">
            <h2 className="section-title">Opciones Adicionales</h2>
            <div className="checkboxes-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="multiStage"
                  checked={formData.meta.multiStage}
                  onChange={handleMetaChange}
                />
                Múltiples Escenarios
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="alcohol"
                  checked={formData.meta.alcohol}
                  onChange={handleMetaChange}
                />
                Se Vende Alcohol
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="reentry"
                  checked={formData.meta.reentry}
                  onChange={handleMetaChange}
                />
                Reentrada Permitida
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="outdoor"
                  checked={formData.meta.outdoor}
                  onChange={handleMetaChange}
                />
                Aire Libre
              </label>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="crowdSize">Tamaño Estimado de Público</label>
                <select
                  id="crowdSize"
                  name="crowdSize"
                  value={formData.meta.crowdSize}
                  onChange={handleMetaChange}
                >
                  <option value="small">{'Pequeño (< 500)'}</option>
                  <option value="medium">{'Medio (500 - 2000)'}</option>
                  <option value="large">{'Grande (2000 - 5000)'}</option>
                  <option value="mega">{'Mega (> 5000)'}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ageRestriction">Restricción de Edad</label>
                <select
                  id="ageRestriction"
                  name="ageRestriction"
                  value={formData.meta.ageRestriction}
                  onChange={handleMetaChange}
                >
                  <option value="all">Todas las edades</option>
                  <option value="16+">16+</option>
                  <option value="18+">18+</option>
                  <option value="21+">21+</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visible Sections */}
          <div className="form-section">
            <h2 className="section-title">Secciones Visibles</h2>
            <div className="checkboxes-grid">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="lineup"
                  checked={formData.visibleSections.lineup}
                  onChange={handleVisibleSectionsChange}
                />
                Mostrar Alineación
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="venue"
                  checked={formData.visibleSections.venue}
                  onChange={handleVisibleSectionsChange}
                />
                Mostrar Lugar
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="prohibitedItems"
                  checked={formData.visibleSections.prohibitedItems}
                  onChange={handleVisibleSectionsChange}
                />
                Mostrar Artículos Prohibidos
              </label>
            </div>
          </div>

          {/* Status */}
          <div className="form-section">
            <h2 className="section-title">Estado</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="status">Estado del Evento</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="draft">Borrador</option>
                  <option value="published">Publicado</option>
                  <option value="sold-out">Agotado</option>
                  <option value="past">Pasado</option>
                </select>
              </div>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                Destacado
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/organizer')}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Guardando...' : isEditMode ? 'Actualizar Evento' : 'Crear Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
