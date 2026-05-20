# InEvents App Architecture

## Overview
InEvents is a cross-platform mobile application built with Expo (React Native) that connects clients with event service providers (artists). The app uses Firebase as a backend-as-a-service for authentication, database, and storage.

## Technology Stack

### Frontend
- **Framework**: Expo SDK 53 with React Native 0.79
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand
- **UI Components**: React Native Paper, Custom Components
- **Icons**: Lucide React Native, React Native Vector Icons (Feather)
- **Fonts**: Poppins (via @expo-google-fonts/poppins)

### Backend (Firebase)
- **Authentication**: Firebase Auth (Phone, Email)
- **Database**: Cloud Firestore
- **Storage**: Firebase Storage
- **Analytics**: Firebase Analytics
- **Crash Reporting**: Firebase Crashlytics

---

## App Structure

```
app/                    # Expo Router pages
├── _layout.tsx         # Root layout with fonts & providers
├── (admin)/            # Admin routes
├── (artist)/           # Artist dashboard routes
├── (client)/           # Client app routes
├── (tabs)/             # Tab navigation routes
├── auth.tsx            # Authentication page
└── index.tsx           # Landing page
```

---

## User Roles & Flows

### 1. Authentication Flow
```
Landing Page → Auth Page → Role Selection → Dashboard
                    ↓
            Phone/Email Login
            WhatsApp Verification
```

### 2. Client User Flow
```
Client Dashboard
    ├── Search/Explore Artists
    ├── View Artist Profile
    ├── Book Services
    ├── Purchase Tickets
    ├── View Orders
    └── Manage Profile
```

### 3. Artist User Flow
```
Artist Dashboard
    ├── Analytics/Stats
    ├── Manage Services
    ├── Manage Orders
    ├── Manage Tickets
    ├── Calendar View
    ├── Coupon Management
    └── Settings
```

---

## Route Structure

### Public Routes
- `/` - Landing page
- `/auth` - Authentication (login/register)
- `/artist-profile` - Public artist profile

### Client Routes (app/(client)/)
- `/client/index` - Home/Dashboard
- `/client/search` - Marketplace/Search
- `/client/tickets` - My Tickets
- `/client/profile` - My Profile

### Artist Routes (app/(artist)/)
- `/artist/index` - Artist Dashboard
- `/artist/orders` - Order Management
- `/artist/public-profile` - Public Profile
- `/artist/chat/[clientId]` - Chat with clients
- `/artist/settings/` - Settings sub-pages

### Admin Routes (app/(admin)/)
- `/admin` - Admin Dashboard

---

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  phoneNumber: string;
  role: 'client' | 'artist' | 'admin';
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  // Artist-specific fields
  bio?: string;
  specialty?: string;
  rating?: number;
  isVerified?: boolean;
}
```

### Service
```typescript
{
  id: string;
  artistId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: number;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: Timestamp;
}
```

### Order
```typescript
{
  id: string;
  clientId: string;
  artistId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  scheduledDate: Timestamp;
  createdAt: Timestamp;
}
```

### Ticket
```typescript
{
  id: string;
  eventId: string;
  buyerId: string;
  ticketNumber: string;
  status: 'valid' | 'used' | 'expired';
  purchaseDate: Timestamp;
  eventDate: Timestamp;
}
```

---

## Key Services (src/firebase/)

| Service | Purpose |
|---------|---------|
| `firebaseAuth.ts` | Authentication utilities |
| `userService.ts` | User profile management |
| `artistServices.ts` | Artist-specific data |
| `orderService.ts` | Order CRUD operations |
| `clientTicketsService.ts` | Ticket management |
| `couponService.ts` | Coupon/discount management |
| `storageService.ts` | Image upload/download |
| `phoneVerificationService.ts` | Phone auth verification |
| `rewardsService.ts` | Loyalty/rewards program |

---

## State Management

### Context Providers
- **AuthContext** - User authentication state
- **AppContext** - Global app state
- **ArtistStore** - Artist-specific state (Zustand)

### Stores (Zustand)
- `useMarketplaceStore` - Marketplace data

---

## UI Components Structure

```
components/
├── ui/                    # Base UI components
│   ├── IconSymbol.tsx
│   ├── LucideIcon.tsx     # NEW: Feather-style icons
│   └── TabBarBackground.tsx
├── artist/                # Artist-specific components
│   ├── ArtistCard.tsx
│   ├── ArtistDashboard.tsx
│   ├── ServiceForm.tsx
│   └── Ticket.tsx
├── client/                # Client-specific components
│   ├── CategorySelector.tsx
│   ├── OrderCard.tsx
│   └── orders.tsx
└── common/                # Shared components
    ├── Button.tsx
    ├── Card.tsx
    └── Input.tsx
```

---

## Theme & Styling

### Colors (constants/Colors.ts)
- **Primary**: `#5B5BD6` (Soft Indigo)
- **Secondary**: `#1F3A5F` (Dark Navy)
- **Accent**: `#2ED47A` (Green)
- **Background**: `#F5F6FA`

### Typography
- **Font Family**: Poppins
- Weights: Regular, Medium, SemiBold, Bold

### UI Style
- Rounded corners (12-16px)
- Soft shadows
- Clean spacing
- Mobile-first design

---

## Firebase Collections

```
users/
├── {userId}
│   ├── profile
│   ├── artistProfile
│   └── rewards

services/
├── {serviceId}
├── {artistId}

orders/
├── {orderId}
├── {artistId}
└── {clientId}

tickets/
├── {ticketId}
└── {eventId}

coupons/
├── {couponId}

reviews/
├── {reviewId}
```

---

## Security Rules (firestore.rules)

- Users can only read/write their own data
- Artists can manage their own services/orders
- Clients can read artist profiles
- Admin has full access

---

## Build & Deployment

### Development
```bash
npm run dev          # Start Expo dev server
npm run android      # Build Android APK
npm run ios          # Build iOS
```

### Production
- Expo EAS Build for mobile apps
- Firebase Hosting for web

---

## Architecture Diagram

```mermaid
graph TD
    A[User] --> B[Expo Router]
    B --> C{Authentication}
    C -->|Not Authenticated| D[/auth]
    C -->|Authenticated| E{Role Check}
    E -->|Client| F[Client Routes]
    E -->|Artist| G[Artist Routes]
    E -->|Admin| H[Admin Routes]
    
    F --> I[Firebase Client SDK]
    G --> I
    H --> I
    
    I --> J[Firebase Auth]
    I --> K[Firestore]
    I --> L[Firebase Storage]
```

---

## Summary

InEvents follows a clean architecture with:
1. **Separation of concerns** - UI, Business Logic, Data layers
2. **Role-based routing** - Different flows for clients, artists, admins
3. **Firebase backend** - Serverless architecture
4. **Modern UI** - Poppins fonts, Feather icons, consistent color system
5. **TypeScript** - Type-safe development
6. **Zustand + Context** - Flexible state management
