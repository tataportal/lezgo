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
