import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES, getApiBaseUrl, LANGUAGES } from '../config/constants';
import { getAdUnitId, AD_CONFIG } from '../config/adsConfig';
import Header from '../components/Header';
import CategoryTab from '../components/CategoryTab';
import { formatRelativeTime, getImageUrl } from '../utils/dateUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.md * 3) / 2;

// Web story categories
const WEB_STORY_CATEGORIES = [
  { id: 'all', name: 'All', label: 'All', labelHindi: 'सभी' },
  { id: 'entertainment', name: 'Entertainment', label: 'Entertainment', labelHindi: 'मनोरंजन' },
  { id: 'sports', name: 'Sports', label: 'Sports', labelHindi: 'खेल' },
  { id: 'international', name: 'International', label: 'International', labelHindi: 'अंतर्राष्ट्रीय' },
  { id: 'national', name: 'India', label: 'India', labelHindi: 'भारत' },
];

const WebStoriesScreen = () => {
  const router = useRouter();
  const segments = useSegments();
  
  // Check if we're in a tab (don't show back button in tabs)
  const isInTab = segments.includes('(tabs)') && segments[segments.length - 1] === 'stories';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stories, setStories] = useState([]);
  const [categoryStories, setCategoryStories] = useState({}); // For 'all' tab - stores stories by category
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('english');

  // Load web stories for a specific category
  const loadStoriesByCategory = async (category, pageNum = 0, append = false) => {
    try {
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 12;
      const start = pageNum * limit;
      const result = await apiService.fetchWebStories(limit, category, start);

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

  // Load all web stories without category filter (for Hindi)
  const loadAllWebStories = async (pageNum = 0, append = false) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[WebStories] 🔄 Loading ALL web stories (no category filter)...');
      console.log('[WebStories] 📍 Current Language:', currentLanguage);
      console.log('[WebStories] 🌐 API Base URL:', apiBaseUrl);
      console.log('[WebStories] ✅ Expected URL for Hindi:', LANGUAGES.hindi.apiBaseUrl);
      console.log('[WebStories] 📄 Page:', pageNum);
      console.log('═══════════════════════════════════════════════════════════');
      
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 12;
      const start = pageNum * limit;
      const result = await apiService.fetchAllWebStories(limit, start);

      if (result.success) {
        if (append) {
          setStories(prev => [...prev, ...result.data]);
        } else {
          setStories(result.data);
        }
        setHasMore(result.data.length === limit && result.total > start + limit);
        console.log(`[WebStories] ✅ Loaded ${result.data.length} stories (Total: ${result.total})`);
      } else {
        console.error('[WebStories] ❌ Failed to load stories:', result.error);
      }
    } catch (error) {
      console.error('[WebStories] ❌ Error loading all web stories:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load all categories for 'all' tab (English only)
  const loadAllCategoryStories = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[WebStories] 🔄 Loading all category stories (English)...');
      console.log('[WebStories] 📍 Current Language:', currentLanguage);
      console.log('[WebStories] 🌐 API Base URL:', apiBaseUrl);
      console.log('═══════════════════════════════════════════════════════════');
      
      setLoading(true);
      setRefreshing(false);
      const categories = ['entertainment', 'sports', 'international', 'national'];
      const storiesByCategory = {};
      
      await Promise.all(
        categories.map(async (category) => {
          try {
            console.log(`[WebStories] 📥 Fetching stories for category: ${category}`);
            const result = await apiService.fetchWebStories(10, category);
            console.log(`[WebStories] 📊 Result for ${category}:`, {
              success: result.success,
              count: result.data?.length || 0,
              error: result.error
            });
            
            if (result.success && result.data) {
              storiesByCategory[category] = result.data;
              console.log(`[WebStories] ✅ Loaded ${result.data.length} stories for ${category}`);
            } else {
              console.log(`[WebStories] ⚠️ No stories found for ${category}`, result.error || '');
              storiesByCategory[category] = [];
            }
          } catch (error) {
            console.error(`[WebStories] ❌ Error loading ${category}:`, error);
            storiesByCategory[category] = [];
          }
        })
      );
      
      console.log('[WebStories] 📦 All category stories loaded:', Object.keys(storiesByCategory));
      console.log('[WebStories] 📊 Total categories with data:', Object.keys(storiesByCategory).filter(k => storiesByCategory[k].length > 0).length);
      setCategoryStories(storiesByCategory);
    } catch (error) {
      console.error('[WebStories] ❌ Error loading all category stories:', error);
      setCategoryStories({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStories = async (pageNum = 0, append = false) => {
    if (selectedCategory === 'all') {
      await loadAllCategoryStories();
    } else {
      await loadStoriesByCategory(selectedCategory, pageNum, append);
    }
  };

  // Load current language on mount and listen for changes
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const language = await storage.getLanguage();
        const lang = language || 'english';
        const apiBaseUrl = getApiBaseUrl();
        console.log('[WebStories] 🚀 Initial load - Language:', lang, 'API URL:', apiBaseUrl);
        setCurrentLanguage(lang);
      } catch (error) {
        console.error('[WebStories] Error loading language:', error);
      }
    };
    loadLanguage();

    // Poll for language changes every 500ms
    const interval = setInterval(async () => {
      try {
        const language = await storage.getLanguage();
        const apiBaseUrl = getApiBaseUrl();
        setCurrentLanguage(prev => {
          if (prev !== language) {
            console.log('═══════════════════════════════════════════════════════════');
            console.log('[WebStories] 🔄 Language changed from', prev, 'to', language);
            console.log('[WebStories] 🌐 API Base URL:', apiBaseUrl);
            console.log('═══════════════════════════════════════════════════════════');
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

  // Reload stories when category or language changes
  useEffect(() => {
    const apiBaseUrl = getApiBaseUrl();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[WebStories] 🔄 Category or language changed, reloading stories...');
    console.log('[WebStories] 📍 Category:', selectedCategory);
    console.log('[WebStories] 📍 Language:', currentLanguage);
    console.log('[WebStories] 🌐 API Base URL:', apiBaseUrl);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Clear stories immediately when category/language changes for smooth transition
    setStories([]);
    setCategoryStories({});
    setLoading(true);
    setPage(0);
    setHasMore(true);
    
    // Clear cache when language changes
    apiService.clearCache();
    
    // Small delay to ensure API base URL is updated for language change
    const timer = setTimeout(() => {
      const currentApiUrl = getApiBaseUrl();
      console.log('[WebStories] ⏱️ Timer fired - Current API URL:', currentApiUrl);
      
      // In Hindi, always load ALL stories without category filter
      if (currentLanguage === 'hindi') {
        console.log('[WebStories] 🇮🇳 Hindi detected - loading ALL web stories (no category filter)');
        loadAllWebStories(0, false);
      } else if (selectedCategory === 'all') {
        // Load all category stories for 'all' tab (English)
        console.log('[WebStories] 📂 All tab selected - loading all category stories');
        loadAllCategoryStories();
      } else {
        // Load new stories based on selected category (English)
        console.log('[WebStories] 📂 Category tab selected - loading stories for:', selectedCategory);
        loadStoriesByCategory(selectedCategory, 0, false);
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [selectedCategory, currentLanguage]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    // In Hindi, always refresh all stories (no category filter)
    if (currentLanguage === 'hindi') {
      loadAllWebStories(0, false);
    } else {
      loadStories(0, false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      // In Hindi, load more from all stories
      if (currentLanguage === 'hindi') {
        const nextPage = page + 1;
        setPage(nextPage);
        loadAllWebStories(nextPage, true);
      } else if (selectedCategory !== 'all') {
        // English: load more for specific category
        const nextPage = page + 1;
        setPage(nextPage);
        loadStoriesByCategory(selectedCategory, nextPage, true);
      }
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
    const title = item.title_unique || item.title || item.headline || 'Untitled Story';
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

  // Render category section for 'all' tab
  const renderCategorySection = (categoryId, categoryLabel) => {
    const categoryData = categoryStories[categoryId] || [];
    if (categoryData.length === 0) return null;

    return (
      <View key={categoryId} style={styles.categorySection}>
        <View style={styles.categorySectionHeader}>
          <Text style={styles.categorySectionTitle}>{categoryLabel}</Text>
          <TouchableOpacity
            onPress={() => setSelectedCategory(categoryId)}
            style={styles.readMoreButton}
          >
            <Text style={styles.readMoreText}>Read More →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {categoryData.map((item, index) => {
            const imageUrl = getImageUrl(item.featuredImage || item.featured_image);
            const title = item.title_unique || item.title || item.headline || 'Untitled Story';

            return (
              <TouchableOpacity
                key={`${categoryId}-${item.id || index}`}
                style={styles.horizontalCard}
                onPress={() => handleStoryPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.horizontalImageContainer}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.horizontalImage}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View style={[styles.horizontalImage, styles.placeholder]} />
                  )}
                  <View style={styles.horizontalPlayButton}>
                    <View style={styles.horizontalPlayIcon}>
                      <Text style={styles.horizontalPlayText}>▶</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.horizontalContent}>
                  <Text style={styles.horizontalTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.horizontalDate}>
                    {formatRelativeTime(item.storyAt || item.story_at || item.publishedAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Determine what to show based on language
  // In Hindi, always show grid view with all stories (no category sections)
  // In English, show category sections for 'all' tab, grid view for specific categories
  const isHindiView = currentLanguage === 'hindi';
  const showCategorySections = !isHindiView && selectedCategory === 'all';
  
  if (loading && isHindiView && stories.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Web Stories" onBack={!isInTab ? handleBack : undefined} />
        {currentLanguage !== 'hindi' && (
          <CategoryTab
            categories={WEB_STORY_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading && showCategorySections && Object.keys(categoryStories).length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Web Stories" onBack={!isInTab ? handleBack : undefined} />
        {currentLanguage !== 'hindi' && (
          <CategoryTab
            categories={WEB_STORY_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !showCategorySections && stories.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Web Stories" onBack={!isInTab ? handleBack : undefined} />
        {currentLanguage !== 'hindi' && (
          <CategoryTab
            categories={WEB_STORY_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        )}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Web Stories" onBack={!isInTab ? handleBack : undefined} />
      {currentLanguage !== 'hindi' && (
        <CategoryTab
          categories={WEB_STORY_CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      )}
      <View style={styles.contentWrapper}>
        {showCategorySections ? (
          // Show category-wise horizontal sections for 'all' tab
          <ScrollView
            contentContainerStyle={styles.allTabContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
          >
            {renderCategorySection('entertainment', currentLanguage === 'hindi' ? 'मनोरंजन' : 'Entertainment')}
            {renderCategorySection('sports', currentLanguage === 'hindi' ? 'खेल' : 'Sports')}
            {renderCategorySection('international', currentLanguage === 'hindi' ? 'अंतर्राष्ट्रीय' : 'International')}
            {renderCategorySection('national', currentLanguage === 'hindi' ? 'भारत' : 'India')}
            {Object.keys(categoryStories).length === 0 && !loading ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No stories found</Text>
              </View>
            ) : null}
          </ScrollView>
        ) : (
          // Show filtered grid view for specific category tabs
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
        )}
        {/* Banner Ad at bottom */}
        {AD_CONFIG.storiesBanner && selectedCategory !== 'all' && (
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
  allTabContent: {
    paddingBottom: SPACING.md,
  },
  categorySection: {
    marginBottom: SPACING.xl,
  },
  categorySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categorySectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.text,
  },
  readMoreButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  readMoreText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
  },
  horizontalScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  horizontalCard: {
    width: 160,
    marginRight: SPACING.md,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  horizontalImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  horizontalImage: {
    width: '100%',
    height: '100%',
  },
  horizontalPlayButton: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
  },
  horizontalPlayIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalPlayText: {
    color: COLORS.background,
    fontSize: 12,
    marginLeft: 2,
  },
  horizontalContent: {
    padding: SPACING.sm,
  },
  horizontalTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  horizontalDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
});

export default WebStoriesScreen;

