import { create } from 'zustand';

export interface Service {
  id: number;
  title: string;
  available: string;
  location: string;
  reviews: string;
  orders: string;
  price: string;
  image: string;
  rating?: number; // Optional, for top-rated filter
}

interface MarketplaceState {
  services: Service[];
  setServices: (services: Service[]) => void;
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  services: [],
  setServices: (services) => set({ services }),
}));
