import { Timestamp } from 'firebase/firestore';

// Event Types
export interface EventPhase {
  name: string;
  price: number;
  active: boolean;
}

export interface EventTier {
  id: string;
  name: string;
  capacity: number;
  sold: number;
  phases: EventPhase[];
}

export interface EventMeta {
  crowdSize: string;
  multiStage: boolean;
  alcohol: boolean;
  reentry: boolean;
  outdoor: boolean;
  ageRestriction: string;
}

export interface EventVisibleSections {
  lineup: boolean;
  venue: boolean;
  prohibitedItems: boolean;
}

export type EventStatus = 'draft' | 'published' | 'sold-out' | 'past';

export interface Event {
  id: string;
  name: string;
  subtitle: string;
  date: Timestamp;
  dateLabel: string;
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
  status: EventStatus;
  featured: boolean;
  organizer: string;
  slug: string;
  visibleSections: EventVisibleSections;
  meta: EventMeta;
  createdAt: Timestamp;
}

export interface CreateEventInput {
  name: string;
  subtitle: string;
  date: Timestamp;
  dateLabel: string;
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
  status: EventStatus;
  featured: boolean;
  slug: string;
  visibleSections: EventVisibleSections;
  meta: EventMeta;
}

// Ticket Types
export type TicketStatus = 'active' | 'used' | 'transferred' | 'resale-listed';

export interface Ticket {
  id: string;
  ticketId: string;
  eventId: string;
  eventName: string;
  eventDate: Timestamp;
  eventDateLabel: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventVenue: string;
  eventLocation: string;
  ticketType: string;
  ticketName: string;
  originalPrice: number;
  price: number;
  couponCode: string;
  couponDiscount: number;
  userId: string;
  userEmail: string;
  userDni: string;
  userName: string;
  status: TicketStatus;
  usedAt: Timestamp | null;
  purchasedAt: Timestamp;
  transferredAt: Timestamp | null;
  transferredFrom: string | null;
  boughtInResale: boolean;
}

export interface PurchaseTicketInput {
  eventId: string;
  eventName: string;
  eventDate: Timestamp;
  eventDateLabel: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  eventVenue: string;
  eventLocation: string;
  userId: string;
  userEmail: string;
  userDni: string;
  userName: string;
  quantities: {
    tierId: string;
    tierName: string;
    quantity: number;
  }[];
  couponCode?: string;
}

// Resale Types
export type ResaleStatus = 'listed' | 'sold';

export interface Resale {
  id: string;
  ticketId: string;
  eventId: string;
  eventName: string;
  eventDate: Timestamp;
  eventDateLabel: string;
  eventVenue: string;
  ticketTier: string;
  originalPrice: number;
  askingPrice: number;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  image: string;
  status: ResaleStatus;
  fee: number;
  netToSeller: number;
  createdAt: Timestamp;
  buyerId: string | null;
}

export interface ListForResaleInput {
  ticketId: string;
  askingPrice: number;
  image: string;
}

export interface PurchaseResaleInput {
  resaleId: string;
  buyerId: string;
  buyerEmail: string;
}

// Coupon Types
export interface Coupon {
  code: string;
  discount: number;
  active: boolean;
  expiresAt: Timestamp;
  maxUses: number;
  usedCount: number;
}

export interface CouponValidationResult {
  valid: boolean;
  discount?: number;
  error?: string;
}

// Transfer Types
export interface Transfer {
  id: string;
  ticketId: string;
  fromUserId: string;
  fromEmail: string;
  toEmail: string;
  message: string;
  createdAt: Timestamp;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PurchaseResponse {
  ticketIds: string[];
  totalPrice: number;
  discountApplied: number;
}
