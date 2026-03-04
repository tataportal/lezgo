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

export function formatPrice(price: number): string {
  return `S/ ${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export function formatPriceShort(price: number): string {
  return `S/ ${Math.round(price)}`;
}

export function getActivePhase(tier: any): { name: string; price: number } | null {
  if (!tier.phases || tier.phases.length === 0) {
    return null;
  }

  let cumulativeSold = 0;

  for (const phase of tier.phases) {
    if (phase.active) {
      const remainingCapacity = tier.capacity - cumulativeSold;
      if (remainingCapacity > 0) {
        return {
          name: phase.name,
          price: phase.price,
        };
      }
    }
    cumulativeSold += phase.price; // Note: this might need adjustment based on actual phase structure
  }

  return null;
}
