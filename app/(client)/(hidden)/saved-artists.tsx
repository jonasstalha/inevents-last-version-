import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Theme } from '@/src/constants/theme';
import { Heart } from 'lucide-react-native';

// Dummy saved artists data (replace with real data from backend or context)
const savedArtists = [
  {
    id: '1',
    name: 'Emma Johnson',
    image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'Music',
  },
  {
    id: '2',
    name: 'James Wilson',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=600',
    category: 'Photography',
  },
];

export default function SavedArtistsScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Heart size={40} color={Theme.colors.primary} />
        <Text style={styles.title}>Saved Artists</Text>
      </View>
      <View style={styles.list}>
        {savedArtists.length === 0 ? (
          <Text style={styles.empty}>You have not saved any artists yet.</Text>
        ) : (
          savedArtists.map((artist) => (
            <View key={artist.id} style={styles.artistCard}>
              <Image source={{ uri: artist.image }} style={styles.artistImage} />
              <View style={styles.artistInfo}>
                <Text style={styles.artistName}>{artist.name}</Text>
                <Text style={styles.artistCategory}>{artist.category}</Text>
              </View>
            </View>
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
  empty: {
    fontSize: Theme.typography.fontSize.md,
    color: Theme.colors.textLight,
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
  },
});
