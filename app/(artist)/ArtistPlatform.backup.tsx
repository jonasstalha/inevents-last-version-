import React from 'react';
import SimpleDashboard from '../../src/components/artist/SimpleDashboard';
import { ArtistStoreProvider } from '../../src/components/artist/ArtistStore';

const ArtistPlatform = () => {
  console.log('🎨 ArtistPlatform component rendering - loading artist dashboard');
  
  return (
    <ArtistStoreProvider>
      <SimpleDashboard />
    </ArtistStoreProvider>
  );
};

export default ArtistPlatform;

export default ArtistPlatform;
