# Firebase Storage for Artist Services

This part of the app enables artists to upload and manage images for their services using Firebase Storage.

## Features

- Upload multiple images for artist services
- Store image URLs in Firestore with service data
- Delete images when services are removed
- Preview images in service forms and cards

## Components

### `storageService.ts`

Provides utility functions for interacting with Firebase Storage:

```typescript
// Import the storage service
import { pickImages, uploadServiceImages, deleteServiceImage } from '../firebase/storageService';

// Pick images from device gallery
const images = await pickImages(true); // true for multiple selection

// Upload images to Firebase Storage
const imageUrls = await uploadServiceImages(images, artistId, serviceId);

// Delete an image from Firebase Storage
await deleteServiceImage(imageUrl);
```

### `artistServices.ts`

Extended with functions to handle services with images:

```typescript
// Import the service functions
import { createServiceWithImages, updateServiceWithImages, deleteServiceWithImages } from '../firebase/artistServices';

// Create a new service with images
const newService = await createServiceWithImages(artistId, serviceData, imageAssets);

// Update an existing service with images
const updatedService = await updateServiceWithImages(
  artistId,
  serviceId,
  updatedData,
  newImageAssets,
  imagesToDelete
);

// Delete a service and all its images
await deleteServiceWithImages(artistId, serviceId);
```

### `ServiceForm.tsx`

A form component for creating and editing services with image uploads:

```tsx
import { ServiceForm } from '../components/artist/ServiceForm';

// In your component
return (
  <ServiceForm
    artistId={currentUserId}
    initialValues={existingService} // Optional, for editing
    onSuccess={() => {
      // Handle success
    }}
    onCancel={() => {
      // Handle cancel
    }}
  />
);
```

### `GigCard.tsx`

Display service cards with image carousel support:

```tsx
import { GigCard } from '../components/artist/GigCard';

// In your component
return (
  <GigCard
    gig={gigData}
    onPress={(id) => {
      // Handle press
    }}
    onBuy={(id) => {
      // Handle buy
    }}
    onEdit={(id) => {
      // Handle edit (for artist view)
    }}
  />
);
```

## Implementation Details

- Images are stored in Firebase Storage under `users/{artistId}/services/{serviceId}/images/`
- Image references are stored as URLs in the service document in Firestore
- The components handle optimistic UI updates for a smooth user experience

## Dependencies

- firebase/storage
- expo-image-picker
- expo-file-system
