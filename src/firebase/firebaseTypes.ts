/**
 * Types for Firebase services
 */

export interface TicketType {
  type: string;
  price: number | string;
  available?: boolean;
  limitedQuantity?: boolean;
  quantity?: number;
}

export interface ServiceItem {
  title: string;
  price: number | string;
  description?: string;
}

export interface TicketData {
  name: string;
  price: number | string;
  location: string;
  description?: string;
  flyer?: string;
  ticketTypes: TicketType[];
  category: string;
  categoryName?: string;
  categories?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
  artistId?: string;
  eventDate?: string | Date | null;
  status?: string;
  visibility?: string;
  searchKeywords?: string[];
  [key: string]: any; // For other dynamic fields
}

export interface ServiceData {
  title: string;
  city: string;
  description?: string;
  category: string;
  categoryName?: string;
  categories?: string[];
  items: ServiceItem[];
  images?: string[];
  basePrice?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  artistId?: string;
  status?: string;
  visibility?: string;
  searchKeywords?: string[];
  [key: string]: any; // For other dynamic fields
}
