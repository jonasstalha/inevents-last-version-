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
  maxQuantity?: number | string;
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
  locationName: string;
  description?: string;
  category: string;
  categoryName?: string;
  categories?: string[];
  items: ServiceItem[];
  images?: string[];
  video?: string;
  basePrice?: number;
  serviceRadius?: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  artistId?: string;
  status?: string;
  visibility?: string;
  searchKeywords?: string[];
  [key: string]: any; // For other dynamic fields
}
