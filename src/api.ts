// src/api.ts
// Replace these with real API calls to your backend

export async function fetchArtists() {
  // TODO: Replace with real API call
  return [
    {
      id: 1,
      name: 'Alex Morgan',
      description: 'Professional wedding & event photographer with 8+ years experience',
      specialty: 'Photography',
      rating: 4.8,
      image: 'https://via.placeholder.com/300'
    },
    {
      id: 2,
      name: 'DJ Maximus',
      description: 'Top-rated DJ specializing in weddings and corporate events',
      specialty: 'Music',
      rating: 4.9,
      image: 'https://via.placeholder.com/300'
    },
    {
      id: 3,
      name: 'Creative Caterers',
      description: 'Award-winning catering service with gourmet cuisine',
      specialty: 'Catering',
      rating: 4.7,
      image: 'https://via.placeholder.com/300'
    }
  ];
}

export async function fetchTickets() {
  // TODO: Replace with real API call
  return [
    {
      id: 1,
      title: 'Summer Wedding Expo',
      venue: 'Grand Hall',
      city: 'Casablanca',
      price: 45
    },
    {
      id: 2,
      title: 'Tech Conference 2025',
      venue: 'Convention Center',
      city: 'Rabat',
      price: 120
    },
    {
      id: 3,
      title: 'Portrait Photography Masterclass',
      venue: 'Art Studio',
      city: 'Marrakech',
      price: 85
    }
  ];
}

// Service type (adjust fields as needed to match your backend)
export type Service = {
  id: number | string;
  title: string;
  available: string;
  location: string;
  reviews: string;
  orders: string;
  price: string;
  image?: string;
};

// Fetch services from backend (replace URL with your real endpoint)
export async function fetchServices(): Promise<Service[]> {
  try {
    // TODO: Replace with your real API endpoint
    // const response = await fetch('https://your-backend.com/api/services');
    // if (!response.ok) throw new Error('Failed to fetch services');
    // const data = await response.json();
    // return data as Service[];
    
    // For now, return mock data
    return [
      {
        id: 1,
        title: 'Wedding Photography',
        available: 'Available',
        location: 'Casablanca',
        reviews: '4.8',
        orders: '150+ orders',
        price: '2500 MAD',
        image: 'https://via.placeholder.com/300'
      },
      {
        id: 2,
        title: 'Event DJ Services',
        available: 'Available',
        location: 'Rabat',
        reviews: '4.9',
        orders: '200+ orders',
        price: '1500 MAD',
        image: 'https://via.placeholder.com/300'
      },
      {
        id: 3,
        title: 'Catering Services',
        available: 'Booked',
        location: 'Marrakech',
        reviews: '4.7',
        orders: '100+ orders',
        price: '5000 MAD',
        image: 'https://via.placeholder.com/300'
      }
    ];
  } catch (error) {
    console.error('Error fetching services:', error);
    // Fallback: return empty array
    return [];
  }
}
