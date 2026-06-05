import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme } from '../../constants/theme';


interface GigCardProps {
  gig: {
    id: string;
    title: string;
    description: string;
    image?: string;
    cover?: string;
    category?: string;
    providerName?: string;
    city?: string;
    location?: string;
    // ...other props
  };
  onPress: (gigId: string) => void;
  onBuy: (gigId: string) => void;
}

export const GigCard: React.FC<GigCardProps> = ({ gig, onPress, onBuy }) => {
  const displayImage = gig.cover || gig.image;
  return (
    <TouchableOpacity onPress={() => onPress(gig.id)} style={styles.container} activeOpacity={0.93}>
      {displayImage ? (
        <Image source={{ uri: displayImage }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{gig.title}</Text>
        <View style={styles.metaRow}>
          {gig.category && (
            <View style={styles.chip}><Text style={styles.chipText}>{gig.category}</Text></View>
          )}
          {gig.providerName && (
            <Text style={styles.metaText}>{gig.providerName}</Text>
          )}
          {(gig.city || gig.location) && (
            <Text style={styles.metaText}>
              {gig.city || gig.location}
            </Text>
          )}
        </View>
        {gig.description ? (
          <Text style={styles.description} numberOfLines={2}>{gig.description}</Text>
        ) : null}
        {/* No price shown as requested */}
        <TouchableOpacity onPress={() => onBuy(gig.id)} style={styles.buyButtonContainer}>
          <Text style={styles.buyButton}>View Details</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.card,
    marginBottom: Theme.spacing.md,
    shadowColor: Theme.colors.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
  },
  imagePlaceholder: {
    backgroundColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: Theme.spacing.md,
  },
  title: {
    fontFamily: Theme.typography.fontFamily.semiBold,
    fontSize: Theme.typography.fontSize.lg,
    color: Theme.colors.textDark,
    marginBottom: Theme.spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
    gap: 8,
  },
  chip: {
    backgroundColor: Theme.colors.primaryLight,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 2,
    marginRight: 6,
  },
  chipText: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.xs,
    color: Theme.colors.primary,
  },
  metaText: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.textLight,
    marginRight: 8,
  },
  description: {
    fontFamily: Theme.typography.fontFamily.regular,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  buyButtonContainer: {
    alignSelf: 'flex-end',
    marginTop: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.sm,
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: 6,
  },
  buyButton: {
    fontFamily: Theme.typography.fontFamily.medium,
    fontSize: Theme.typography.fontSize.sm,
    color: Theme.colors.secondary,
  },
});