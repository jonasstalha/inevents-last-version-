# Services Firebase Integration Guide

## Overview

This document explains how services are saved to Firebase Firestore and how images are uploaded to Firebase Storage in the InEvents application.

## Architecture

### 1. Service Form Component
**File:** [`src/components/artist/ServiceForm.tsx`](src/components/artist/ServiceForm.tsx)

The ServiceForm component handles:
- Collecting service information (title, description, base price, category)
- Managing service options (add/remove options with title, description, price)
- Image selection and preview
- Form validation
- Submitting data to Firebase

### 2. Firebase Service Layer
**File:** [`src/firebase/artistServices.ts`](src/firebase/artistServices.ts)

This file contains the core functions for service management:

#### `createServiceWithImages(artistId, serviceData, imageAssets)`
Creates a new service with images:
1. Creates a service document in Firestore at `users/{artistId}/services/{serviceId}`
2. Uploads images to Firebase Storage at `users/{artistId}/services/{serviceId}/images/`
3. Updates the service document with image download URLs
4. Returns the complete service object

#### `updateServiceWithImages(artistId, serviceId, serviceData, newImageAssets, imagesToDelete)`
Updates an existing service:
1. Retrieves current service data from Firestore
2. Deletes specified images from Firebase Storage
3. Uploads new images to Firebase Storage
4. Updates the service document with new image URLs
5. Returns the updated service object

#### `deleteServiceWithImages(artistId, serviceId)`
Deletes a service and all associated images:
1. Retrieves service data to get image URLs
2. Deletes all images from Firebase Storage
3. Deletes the service document from Firestore

#### `fetchServicesByArtistId(artistId)`
Fetches all services for a given artist from Firestore.

### 3. Firebase Storage Service
**File:** [`src/firebase/storageService.ts`](src/firebase/storageService.ts)

This file handles image operations:

#### `pickImages(multiple)`
Opens the device image picker and returns selected image assets.

#### `uploadServiceImages(images, artistId, serviceId)`
Uploads images to Firebase Storage:
1. Converts image URIs to blobs
2. Creates unique filenames using timestamps
3. Uploads to path: `users/{artistId}/services/{serviceId}/images/{filename}`
4. Returns download URLs for all uploaded images

#### `deleteServiceImage(url)`
Deletes an image from Firebase Storage using its download URL.

## Data Structure

### Firestore Document: `users/{userId}/services/{serviceId}`
```typescript
{
  id: string;                    // Document ID
  artistId: string;              // Artist's user ID
  title: string;                 // Service title
  description: string;           // Service description
  basePrice: number;             // Base price
  category: string;              // Service category
  options: GigOption[];          // Array of service options
  images: string[];              // Array of image download URLs
  rating: number;                // Average rating
  reviewCount: number;           // Number of reviews
  createdAt: Date;               // Creation timestamp
  orders: string[];              // Array of order IDs
}
```

### GigOption Structure
```typescript
{
  id: string;                    // Option ID
  title: string;                 // Option title
  description: string;           // Option description
  price: number;                 // Option price
}
```

### Firebase Storage Path
```
users/{artistId}/services/{serviceId}/images/{filename}
```

## Security Rules

### Firestore Rules
**File:** [`firestore.rules`](firestore.rules)

Services are stored under `users/{userId}/services/{serviceId}`:
```javascript
match /users/{userId} {
  // User's services/gigs subcollection
  match /services/{serviceId} {
    allow read: if true; // Public read for marketplace
    allow create, update: if isOwnerOrAdmin(userId);
    allow delete: if isOwnerOrAdmin(userId);
  }
}
```

### Storage Rules
**File:** [`storage.rules`](storage.rules)

Service images are stored at `users/{userId}/services/{serviceId}/images/{imageName}`:
```javascript
match /users/{userId}/services/{serviceId}/images/{imageName} {
  // Allow public read for marketplace display
  allow read: if true;
  
  // Allow authenticated users to upload images to their own services
  allow write: if isOwnerOrAdmin(userId);
  
  // Allow deletion by owner or admin
  allow delete: if isOwnerOrAdmin(userId);
}
```

## Deployment

### Deploy All Rules (Recommended)
Run the updated deployment scripts that now include both Firestore and Storage rules:

**Windows:**
```bash
deploy-rules.bat
```

**Linux/Mac:**
```bash
./deploy-rules.sh
```

### Deploy Storage Rules Only
If you only need to deploy Storage rules:

**Windows:**
```bash
deploy-storage-rules.bat
```

**Linux/Mac:**
```bash
./deploy-storage-rules.sh
```

### Manual Deployment
```bash
# Deploy both Firestore and Storage rules
firebase deploy --only firestore:rules,storage

# Deploy only Storage rules
firebase deploy --only storage
```

## How It Works

### Creating a New Service

1. **User fills out the form** in ServiceForm component
2. **User selects images** using the image picker
3. **User clicks "Create Service"**
4. **Form validation** checks all required fields
5. **`createServiceWithImages()` is called:**
   - Creates Firestore document with service data
   - Uploads images to Firebase Storage
   - Updates Firestore document with image URLs
6. **Success callback** is triggered
7. **User sees success message**

### Updating an Existing Service

1. **User modifies the form** with new data
2. **User adds/removes images** as needed
3. **User clicks "Update Service"**
4. **Form validation** checks all required fields
5. **`updateServiceWithImages()` is called:**
   - Retrieves current service data
   - Deletes marked images from Storage
   - Uploads new images to Storage
   - Updates Firestore document with new data and image URLs
6. **Success callback** is triggered
7. **User sees success message**

### Deleting a Service

1. **User initiates deletion** (from another component)
2. **`deleteServiceWithImages()` is called:**
   - Retrieves service data to get image URLs
   - Deletes all images from Firebase Storage
   - Deletes the service document from Firestore
3. **Service is completely removed** from both Firestore and Storage

## Troubleshooting

### Images Not Uploading

**Problem:** Images fail to upload to Firebase Storage

**Solutions:**
1. Check that Storage rules are deployed:
   ```bash
   firebase deploy --only storage
   ```

2. Verify Firebase Storage is enabled in Firebase Console:
   - Go to Firebase Console → Storage
   - Ensure Storage is initialized

3. Check browser/app console for errors:
   - Look for CORS errors
   - Check for permission denied errors

4. Verify user is authenticated:
   - The user must be logged in to upload images
   - Check that `request.auth != null` in Storage rules

### Services Not Saving

**Problem:** Services fail to save to Firestore

**Solutions:**
1. Check that Firestore rules are deployed:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Verify Firestore is enabled in Firebase Console:
   - Go to Firebase Console → Firestore Database
   - Ensure Firestore is initialized

3. Check browser/app console for errors:
   - Look for permission denied errors
   - Verify user authentication

4. Verify the user ID matches:
   - The `artistId` must match the authenticated user's ID
   - Check that `request.auth.uid == userId` in Firestore rules

### Permission Denied Errors

**Problem:** "Permission denied" errors when saving services or uploading images

**Solutions:**
1. Ensure user is authenticated:
   - Check that user is logged in
   - Verify auth token is valid

2. Check that rules are correctly deployed:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

3. Verify user ID matches:
   - The user can only create/update their own services
   - Check that `artistId` matches `request.auth.uid`

4. For admin access:
   - Ensure admin email is configured in rules
   - Check that user has admin role in Firestore

## Best Practices

### Image Optimization
- Images are automatically compressed to 80% quality during upload
- Use appropriate image formats (JPEG for photos, PNG for graphics)
- Consider implementing image resizing on the server side

### Error Handling
- All Firebase operations include try-catch blocks
- Errors are logged to console for debugging
- User-friendly error messages are displayed

### Data Validation
- Form validation occurs before submission
- Required fields are checked
- Price values are converted to numbers

### Security
- Users can only modify their own services
- Admins can modify any service
- Public read access for marketplace display
- Authenticated write access for service creation

## Testing

### Test Service Creation
1. Log in as an artist user
2. Navigate to service creation form
3. Fill in all required fields
4. Select at least one image
5. Click "Create Service"
6. Verify success message appears
7. Check Firebase Console:
   - Firestore: Document exists at `users/{userId}/services/{serviceId}`
   - Storage: Images exist at `users/{userId}/services/{serviceId}/images/`

### Test Service Update
1. Log in as an artist user
2. Navigate to existing service
3. Modify some fields
4. Add or remove images
5. Click "Update Service"
6. Verify success message appears
7. Check Firebase Console:
   - Firestore: Document is updated
   - Storage: New images added, deleted images removed

### Test Service Deletion
1. Log in as an artist user or admin
2. Delete a service
3. Verify service is removed from UI
4. Check Firebase Console:
   - Firestore: Document is deleted
   - Storage: All images are deleted

## Summary

The service saving implementation is complete and properly integrated with Firebase:

✅ **Services are saved to Firestore** at `users/{userId}/services/{serviceId}`
✅ **Images are uploaded to Firebase Storage** at `users/{userId}/services/{serviceId}/images/`
✅ **Security rules are configured** for both Firestore and Storage
✅ **Error handling is implemented** throughout the flow
✅ **User feedback is provided** via alerts and loading states

To ensure everything works correctly, deploy the rules using:
```bash
firebase deploy --only firestore:rules,storage
```
