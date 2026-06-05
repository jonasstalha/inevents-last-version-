import React from 'react';
import ArtistDashboard from '../../src/components/artist/ArtistDashboard';
import { ArtistStoreProvider } from '../../src/components/artist/ArtistStore';

const ArtistPlatform = () => {
  console.log('🎨 ArtistPlatform component rendering - loading artist dashboard');
  
  return (
    <ArtistStoreProvider>
      <ArtistDashboard />
    </ArtistStoreProvider>
  );
};

export default ArtistPlatform;
