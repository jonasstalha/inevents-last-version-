export interface User {
  id: string;
  email: string;
  role: 'artist' | 'client' | 'admin';
  name: string;
  password?: string; // Added password field
  profileImage?: string;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  createdAt: Date;
}

export interface Artist extends User {
  bio: string;
  storeId: string;
  rating: number;
  categories: string[];
  location: string;
  featured: boolean;
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
  category: string;
  options: GigOption[];
  rating: number;
  reviewCount: number;
  createdAt: Date;
  orders?: Order[]; // Added orders property for analytics/stat grid
  // Enhanced UI properties
  image?: string; // Single image path for search screen
  providerName?: string; // Name of the service provider
  ordersCount?: number; // Number of orders
}

// Input type for creating or updating a gig/service
export interface GigInput {
  title: string;
  description: string;
  basePrice: number;
  category: string;
  options: GigOption[];
}

export interface GigOption {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface Order {
  id: string;
  clientId: string;
  gigId: string;
  artistId: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'completed';
  totalPrice: number;
  selectedOptions: string[];
  specialRequests?: string;
  createdAt: Date;
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
  // Added fields for compatibility with Ticket.tsx
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