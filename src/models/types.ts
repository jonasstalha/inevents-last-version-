export interface User {
  id: string;
  email: string;
  role: 'artist' | 'client' | 'admin';
  name: string;
  storeName?: string;
  password?: string;
  profileImage?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  createdAt: Date;
}

export interface Artist extends User {
  bio: string;
  storeId: string;
  storeName?: string;
  rating: number;
  categories: string[];
  location: string;
  featured: boolean;
  specialization?: string;
  activeCustomers?: number;
  conversionRate?: string;
}

export interface Client extends User {
  savedArtists: string[];
  points: number;
  purchaseHistory: string[];
}

export interface Admin extends User {
  permissions: string[];
}

export interface Gig {
  id: string;
  artistId: string;
  title: string;
  description: string;
  basePrice: number;
  images: string[];
  video?: string;
  category: string;
  options: GigOption[];
  extras?: GigOption[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  orders?: Order[];
  image?: string;
  providerName?: string;
  ordersCount?: number;
  sales?: number;
  revenue?: number;
  type?: 'service' | 'ticket' | 'event';
}

export interface GigInput {
  title: string;
  description: string;
  basePrice: number;
  category: string;
  options: GigOption[];
  extras?: GigOption[];
  locationName?: string;
  radius?: number;
}

export interface GigOption {
  id: string;
  title: string;
  description: string;
  price: number;
  maxQuantity?: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'completed';
export type OrderType = 'ticket' | 'service';
export type PaymentStatus = 'unpaid' | 'paid';

export interface Order {
  id: string;
  clientId: string;
  clientName?: string;
  clientPhoto?: string;
  artistId: string;
  artistName?: string;
  artistPhoto?: string;
  gigId?: string;
  gigTitle?: string;
  ticketName?: string;
  serviceId?: string;
  serviceTitle?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceImage?: string;
  description?: string;
  notes?: string;
  attachments?: string[];
  type: OrderType;
  status: OrderStatus;
  totalPrice: number;
  budget?: number;
  selectedPackage?: string;
  currency?: string;
  paymentStatus?: PaymentStatus;
  invoiceId?: string;
  invoiceUrl?: string;
  selectedOptions?: string[];
  specialRequests?: string;
  items?: Array<{ id: string; title: string; quantity: number; price: number }>;
  ticketQuantities?: Array<{ type: string; price: number; quantity: number }>;
  personalInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    additionalNotes?: string;
  };
  clientInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  customization?: {
    eventDate?: string;
    eventTime?: string;
    duration?: string;
    location?: string;
    guestCount?: string;
    specificRequests?: string;
    latitude?: number;
    longitude?: number;
    locationCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  priceProposal?: {
    proposedPrice?: string;
    budgetRange?: string;
    priceJustification?: string;
  };
  orderReference?: string;
  totalQuantity?: number;
  createdAt: string;
  updatedAt?: string;
  completedAt?: string;
}

export interface Invoice {
  id: string;
  orderId: string;
  clientId: string;
  artistId: string;
  invoiceNumber: string;
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  pdfUrl: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Ticket {
  id: string;
  eventName?: string;
  eventDate?: Date;
  artistId: string;
  clientId?: string;
  price: number;
  qrCode?: string;
  status?: 'available' | 'sold' | 'used';
  createdAt: Date;
  location?: string;
  description?: string;
  flyer?: string;
  ticketTypes?: { type: string; price: string }[];
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'purchase' | 'sale' | 'refund' | 'payout';
  amount: number;
  description: string;
  createdAt: Date;
}

export interface Points {
  userId: string;
  currentPoints: number;
  history: PointsHistory[];
}

export interface PointsHistory {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
}
