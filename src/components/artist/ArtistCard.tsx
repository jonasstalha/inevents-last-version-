
import { Heart, MapPin, Star, Award } from 'lucide-react-native';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';
import { Artist } from '../../models/types';
import { Card } from '../common/Card';

interface ArtistCardProps {
  artist: Artist;
  onPress: (artistId: string) => void;
  onSave: (artistId: string) => void;
  isSaved?: boolean;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onPress, onSave, isSaved = false }) => {
  return (
    <TouchableOpacity onPress={() => onPress(artist.id)} activeOpacity={0.9}>
      <Card variant="elevated" style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: artist.profileImage || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
              style={styles.avatar}
            />
            {artist.featured && (
              <View style={styles.verifiedBadge}>
                <Award size={12} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={14} color="#fbbf24" fill="#fbbf24" />
              <Text style={styles.rating}>{artist.rating.toFixed(1)}</Text>
              <Text style={styles.ratingCount}>(4.2k)</Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={() => onSave(artist.id)} 
            style={[styles.saveButton, isSaved && styles.savedButton]}
            activeOpacity={0.7}
          >
            <Heart 
              size={16} 
              color={isSaved ? '#fff' : '#ef4444'} 
              fill={isSaved ? '#fff' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.categoryContainer}>
          {artist.categories.slice(0, 3).map((category, index) => (
            <View key={index} style={styles.category}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          ))}
          {artist.categories.length > 3 && (
            <View style={styles.category}>
              <Text style={styles.categoryText}>+{artist.categories.length - 3}</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.bio} numberOfLines={2}>
          {artist.bio}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.location}>
            <MapPin size={14} color="#6b7280" />
            <Text style={styles.locationText} numberOfLines={1}>{artist.location}</Text>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statsText}>12 orders</Text>
          </View>
        </View>
        
        {artist.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured Artist</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#10b981',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerRight: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 4,
  },
  ratingCount: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  savedButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  category: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500',
    color: '#4b5563',
  },
  bio: {
    fontFamily: 'System',
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontFamily: 'System',
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  stats: {
    backgroundColor: '#f9fafb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statsText: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    fontFamily: 'System',
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
});