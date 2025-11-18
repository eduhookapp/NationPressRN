import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { getAdUnitId, AD_CONFIG } from '../config/adsConfig';
import Header from '../components/Header';
import { formatRelativeTime, getImageUrl } from '../utils/dateUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

const WebStoriesScreen = () => {
  const router = useRouter();
  const segments = useSegments();
  
  // Check if we're in a tab (don't show back button in tabs)
  const isInTab = segments.includes('(tabs)') && segments[segments.length - 1] === 'stories';
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('english');

  const loadStories = async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 12;
      const start = pageNum * limit;
      const result = await apiService.fetchPostsByCategory('web-stories', limit, start);

      if (result.success) {
        if (append) {
          setStories(prev => [...prev, ...result.data]);
        } else {
          setStories(result.data);
        }
        setHasMore(result.data.length === limit && result.total > start + limit);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load current language on mount and listen for changes
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(language || 'english');
      } catch (error) {
        console.error('[WebStories] Error loading language:', error);
      }
    };
    loadLanguage();

    // Poll for language changes every 500ms
    const interval = setInterval(async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(prev => {
          if (prev !== language) {
            console.log('[WebStories] Language changed from', prev, 'to', language);
            return language || 'english';
          }
          return prev;
        });
      } catch (error) {
        console.error('[WebStories] Error checking language:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Reload stories when language changes
  useEffect(() => {
    console.log('[WebStories] Language changed, reloading stories...');
    console.log('[WebStories] Language:', currentLanguage);
    
    // Clear stories immediately when language changes for smooth transition
    setStories([]);
    setLoading(true);
    setPage(0);
    setHasMore(true);
    
    // Clear cache when language changes
    apiService.clearCache();
    
    // Load new stories
    loadStories(0, false);
  }, [currentLanguage]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    loadStories(0, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadStories(nextPage, true);
    }
  };

  const handleStoryPress = (story) => {
    const slug = story.slug || story.shortSlug || story.slugUnique;
    if (slug && router) {
      console.log('[WebStories] Navigating to story:', slug);
      try {
        router.push({
          pathname: '/web-story/[slug]',
          params: { slug, story: JSON.stringify(story) },
        });
      } catch (error) {
        console.error('[WebStories] Error navigating to story:', error);
        // Fallback: try with string interpolation
        try {
          router.push(`/web-story/${slug}`);
        } catch (fallbackError) {
          console.error('[WebStories] Fallback navigation also failed:', fallbackError);
        }
      }
    }
  };

  const handleBack = () => {
    if (router) {
      if (typeof router.back === 'function') {
        router.back();
      } else if (typeof router.replace === 'function') {
        router.replace('/(tabs)/stories');
      } else if (typeof router.push === 'function') {
        router.push('/(tabs)/stories');
      }
    }
  };

  const renderItem = ({ item }) => {
    const imageUrl = getImageUrl(item.featuredImage || item.featured_image);
    const title = item.title || item.headline || 'Untitled Story';
    const date = formatRelativeTime(item.storyAt || item.story_at || item.publishedAt);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleStoryPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          <View style={styles.playButton}>
            <View style={styles.playIcon}>
              <Text style={styles.playText}>▶</Text>
            </View>
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  if (loading && stories.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Web Stories" onBack={!isInTab ? handleBack : undefined} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Web Stories" onBack={!isInTab ? handleBack : undefined} />
      <View style={styles.contentWrapper}>
        <FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item, index) => `story-${item.id || item.slug || index}`}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No stories found</Text>
              </View>
            ) : null
          }
        />
        {/* Banner Ad at bottom */}
        {AD_CONFIG.storiesBanner && (
          <View style={styles.adContainer}>
            <BannerAd
              unitId={getAdUnitId('banner', 'stories')}
              size={BannerAdSize.BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: false,
              }}
              onAdLoaded={() => {
                console.log('[Stories] Banner ad loaded');
              }}
              onAdFailedToLoad={(error) => {
                console.log('[Stories] Banner ad failed to load:', error);
              }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  contentWrapper: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adContainer: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.xs,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginBottom: SPACING.md,
    marginRight: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.2,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: COLORS.surface,
  },
  playButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
  },
  playIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    color: COLORS.background,
    fontSize: 12,
    marginLeft: 2,
  },
  content: {
    padding: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    width: '100%',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
});

export default WebStoriesScreen;

