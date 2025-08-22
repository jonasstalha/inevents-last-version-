import { Theme } from '@/src/constants/theme';
import { useApp } from '@/src/context/AppContext';
import { useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SavedArtistsScreen() {
  const { getSavedArtists, unsaveArtist, savedArtists: savedArtistIds } = useApp();
  const router = useRouter();
  const [savedArtists, setSavedArtists] = React.useState<any[]>([]);
  
  // Debug output
  console.log('Saved Artist IDs:', savedArtistIds);
  
  // Update saved artists when component mounts and when savedArtistIds changes
  React.useEffect(() => {
    const artists = getSavedArtists();
    console.log('Retrieved saved artists:', artists);
    setSavedArtists(artists);
  }, [savedArtistIds, getSavedArtists]);
  
  const handleViewArtist = (artistId: string) => {
    router.push(`/(artist)/public-profile?id=${artistId}`);
  };
  
  const handleUnsaveArtist = (artistId: string) => {
    unsaveArtist(artistId);
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Heart size={40} color={Theme.colors.primary} />
        <Text style={styles.title}>Saved Artists</Text>
        <Text style={styles.subtitle}>Found {savedArtists.length} saved artists</Text>
      </View>
      <View style={styles.list}>
        {savedArtists.length === 0 ? (
          <Text style={styles.empty}>You have not saved any artists yet.</Text>
        ) : (
          savedArtists.map((artist: any) => (
            <TouchableOpacity 
              key={artist.id} 
              style={styles.artistCard}
              onPress={() => handleViewArtist(artist.id)}
            >
              <Image 
                source={{ uri: artist.profileImage || 'https://ui-avatars.com/api/?name=' + artist.name }} 
                style={styles.artistImage} 
              />
              <View style={styles.artistInfo}>
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistCategory}>
                  {artist.categories?.length > 0 ? artist.categories[0] : 'Artist'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.unsaveButton}
                onPress={() => handleUnsaveArtist(artist.id)}
              >
                <Heart size={20} color={Theme.colors.error} fill={Theme.colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl * 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.xl,
    color: Theme.colors.textDark,
    marginTop: Theme.spacing.md,
  },
  subtitle: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    marginTop: Theme.spacing.xs,
  },
  list: {
    marginTop: Theme.spacing.lg,
  },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.sm,
  },
  artistImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: Theme.spacing.md,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontFamily: Theme.typography.fontFamily.bold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
  },
  artistCategory: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
  },
  unsaveButton: {
    padding: 10,
  },
  empty: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
  },
});
