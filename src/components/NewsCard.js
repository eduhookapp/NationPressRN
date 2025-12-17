import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { formatRelativeTime, getImageUrl, truncateText } from '../utils/dateUtils';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';

const IMAGE_HEIGHT = 200;
const FALLBACK_IMAGE = require('../../assets/images/nation-press.webp');

const NewsCard = ({ post, onPress, variant = 'default' }) => {
  const imageUrl = getImageUrl(post.banner || post.featuredImage || post.featured_image);
  const title = post.title || post.headline || '';
  const description = truncateText(post.description || post.excerpt || '', 120);
  const date = formatRelativeTime(post.storyAt || post.story_at || post.publishedAt);
  const category = post.category || 'News';
  const [imageLoadError, setImageLoadError] = useState(false);

  // Reset image error state when imageUrl changes
  useEffect(() => {
    setImageLoadError(false);
  }, [imageUrl]);

  // Ensure onPress is always a function
  const handlePress = onPress || (() => {});

  if (variant === 'horizontal') {
    return (
      <TouchableOpacity
        style={styles.horizontalCard}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.horizontalImageContainer}>
          {imageUrl && !imageLoadError ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.horizontalImage}
              contentFit="cover"
              contentPosition="top"
              transition={200}
              cachePolicy="memory-disk"
              recyclingKey={imageUrl}
              priority="low"
              onError={() => {
                setImageLoadError(true);
              }}
            />
          ) : (
            <Image
              source={FALLBACK_IMAGE}
              style={styles.horizontalImage}
              contentFit="cover"
              transition={200}
            />
          )}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
        </View>
        <View style={styles.horizontalContent}>
          <Text style={styles.horizontalTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.horizontalDescription} numberOfLines={2}>
            {description}
          </Text>
          <Text style={styles.horizontalDate}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {imageUrl && !imageLoadError ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            contentPosition="top"
            transition={200}
            cachePolicy="memory-disk"
            recyclingKey={imageUrl}
            priority="low"
            onError={() => {
              setImageLoadError(true);
            }}
          />
        ) : (
          <Image
            source={FALLBACK_IMAGE}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{category}</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 22,
  },
  description: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  // Horizontal variant
  horizontalCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalImageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalContent: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  horizontalTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  horizontalDescription: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    lineHeight: 16,
  },
  horizontalDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
});

export default NewsCard;

