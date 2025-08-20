import { Stack } from 'expo-router';
import React from 'react';

export default function ArtistLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Artist Dashboard' }} />
      <Stack.Screen name="marketplace" options={{ title: 'Marketplace' }} />
      <Stack.Screen name="ticket" options={{ title: 'Tickets' }} />
      <Stack.Screen name="public-profile" options={{ title: 'Public Profile' }} />
      <Stack.Screen name="example" options={{ title: 'Example' }} />
      <Stack.Screen name="ArtistPlatform" options={{ title: 'Artist Platform' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
