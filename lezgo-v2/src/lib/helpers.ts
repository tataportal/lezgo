/**
 * Helper functions for date and currency formatting
 */

export function toDate(val: any): Date {
  if (!val) return new Date();
  if (val.toDate) return val.toDate(); // Firestore Timestamp
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

export function formatDateES(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const formatter = new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return formatter.format(date).replace(/^\w/, (c) => c.toUpperCase());
}

/** Short date: "03 Mayo 2026" — matches monolith formatDateLabel */
export function formatDateShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return 'Fecha inválida';
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const dd = date.getDate() < 10 ? '0' + date.getDate() : '' + date.getDate();
  return dd + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
}

/** Even shorter: "11 Marzo" — for promo cards */
export function formatDateVeryShort(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return '';
  const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return date.getDate() + ' ' + months[date.getMonth()];
}

export function formatPrice(price: number): string {
  if (price == null || isNaN(price)) return 'S/ 0.00';
  return `S/ ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatPriceShort(price: number): string {
  if (price == null || isNaN(price)) return 'S/ 0';
  return `S/ ${Math.round(price)}`;
}

/** Genre-based fallback images from Unsplash — matches monolith */
const genreImages: Record<string, string> = {
  'techno': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
  'industrial techno': 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80',
  'uk bass / techno': 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
  'techno / house / dnb': 'https://images.unsplash.com/photo-1598387993281-cecf8b71a8f8?w=800&q=80',
  'deep house / minimal': 'https://images.unsplash.com/photo-1563841930606-67e2bce48b78?w=800&q=80',
  'ecléctica': 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&q=80',
  'hard techno': 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=800&q=80',
  'multi-genre': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  'minimal / micro house': 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&q=80',
};
const defaultImg = 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800&q=80';

export function getEventImage(_eventId: string, image?: string, genre?: string): string {
  if (image && image.startsWith('http')) return image;
  if (image) return image;
  if (genre) return genreImages[genre.toLowerCase()] || defaultImg;
  return defaultImg;
}

export function getActivePhase(tier: any): { name: string; price: number } | null {
  if (!tier?.phases || tier.phases.length === 0) {
    return null;
  }

  // Find the first active phase with remaining capacity
  for (const phase of tier.phases) {
    if (phase.active) {
      return {
        name: phase.name || '',
        price: phase.price || 0,
      };
    }
  }

  // If no phase is marked active, return the first phase as fallback
  const firstPhase = tier.phases?.[0];
  if (!firstPhase) {
    return null;
  }
  return {
    name: firstPhase.name || '',
    price: firstPhase.price || 0,
  };
}
