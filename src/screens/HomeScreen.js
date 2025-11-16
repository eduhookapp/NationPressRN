import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { BannerAd, BannerAdSize, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { apiService } from '../services/api';
import { CATEGORIES, CATEGORY_SUBMENU_ITEMS, COLORS, SPACING } from '../config/constants';
import { getAdUnitId, AD_CONFIG } from '../config/adsConfig';
import { storage } from '../utils/storage';
import NewsCard from '../components/NewsCard';
import CategoryTab from '../components/CategoryTab';
import Header from '../components/Header';
import TagChips from '../components/TagChips';

const logo = require('../../assets/images/logo.png');
const logoHindi = require('../../assets/images/logo-hindi.png');

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('english');
  // Track which ads have loaded successfully
  const [adsLoaded, setAdsLoaded] = useState({});
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const logoTranslateY = React.useRef(new Animated.Value(0)).current;
  const logoHeight = React.useRef(new Animated.Value(70)).current;
  
  // Interstitial ad ref
  const interstitialAdRef = useRef(null);

  // Load and setup interstitial ad
  useEffect(() => {
    const adUnitId = getAdUnitId('interstitial', 'homeNavigation');
    if (!adUnitId) {
      console.log('[HomeScreen] No interstitial ad unit ID configured');
      return;
    }

    // Create interstitial ad
    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Set up event listeners
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('[HomeScreen] Interstitial ad loaded');
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[HomeScreen] Interstitial ad closed');
      // Reload ad for next time
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('[HomeScreen] Interstitial ad error:', error);
    });

    // Load the ad
    interstitial.load();
    interstitialAdRef.current = interstitial;

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  // Load current language on mount and listen for changes
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const language = await storage.getLanguage();
        console.log('[HomeScreen] Language loaded:', language);
        setCurrentLanguage(language || 'english');
      } catch (error) {
        console.error('[HomeScreen] Error loading language:', error);
      }
    };
    loadLanguage();

    // Poll for language changes every 500ms
    const interval = setInterval(async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(prev => {
          if (prev !== language) {
            console.log('[HomeScreen] Language changed from', prev, 'to', language);
            return language || 'english';
          }
          return prev;
        });
      } catch (error) {
        console.error('[HomeScreen] Error checking language:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Get submenu items for selected category
  const getSubmenuItems = () => {
    return CATEGORY_SUBMENU_ITEMS[selectedCategory] || [];
  };

  // Insert ads into posts array after every 2 items
  const getDataWithAds = (postsArray) => {
    if (!AD_CONFIG.storiesBanner) return postsArray;
    
    const result = [];
    postsArray.forEach((post, index) => {
      result.push(post);
      // Add ad after every 2nd item
      if ((index + 1) % 2 === 0) {
        result.push({ isAd: true, id: `ad-${index}` });
      }
    });
    return result;
  };

  const loadPosts = async (category, pageNum = 0, append = false) => {
    try {
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 12;
      const start = pageNum * limit;
      const result = await apiService.fetchPostsByCategory(category, limit, start);

      if (result.success) {
        if (append) {
          setPosts(prev => [...prev, ...result.data]);
        } else {
          setPosts(result.data);
        }
        setHasMore(result.data.length === limit && result.total > start + limit);
      } else {
        console.error('Error loading posts:', result.error);
      }
    } catch (error) {
      console.error('Error in loadPosts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Reload posts when category OR language changes
  useEffect(() => {
    console.log('[HomeScreen] Category or language changed, reloading posts...');
    console.log('[HomeScreen] Category:', selectedCategory, 'Language:', currentLanguage);
    
    // Clear posts immediately when category/language changes for smooth transition
    setPosts([]);
    setLoading(true);
    setPage(0);
    setHasMore(true);
    
    // Reset ad loaded states for new category/language
    setAdsLoaded({});
    
    // Reset fade animation to show loader immediately
    fadeAnim.setValue(1);
    
    // Clear cache when language changes
    apiService.clearCache();
    
    // Load new posts
    const loadData = async () => {
      await loadPosts(selectedCategory, 0, false);
      // Fade in new content when loaded
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
    
    loadData();
  }, [selectedCategory, currentLanguage]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    loadPosts(selectedCategory, 0, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(selectedCategory, nextPage, true);
    }
  };

  const handlePostPress = async (post) => {
    const slug = post.shortSlug || post.slugUnique || post.slug;
    if (slug) {
      // Check if we can show interstitial ad (limit 2 per day)
      const canShowAd = await storage.canShowInterstitialAd();
      
      // Show interstitial ad before navigation (only if we haven't exceeded daily limit)
      if (interstitialAdRef.current && canShowAd) {
        const interstitial = interstitialAdRef.current;
        let hasNavigated = false;
        let adShown = false;
        
        const navigateToArticle = () => {
          if (!hasNavigated) {
            hasNavigated = true;
            const category = (post.category || 'news').toLowerCase();
            try {
              router.push({
                pathname: '/article/[category]/[slug]',
                params: { category, slug, post: JSON.stringify(post) },
              });
            } catch (error) {
              console.error('[HomeScreen] Error navigating to article:', error);
              // Fallback: try again with the same format
              try {
                router.push({
                  pathname: '/article/[category]/[slug]',
                  params: { category, slug },
                });
              } catch (fallbackError) {
                console.error('[HomeScreen] Fallback navigation also failed:', fallbackError);
              }
            }
          }
        };

        // Navigate after ad is closed
        const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          unsubscribeClosed();
          navigateToArticle();
          // Reload ad for next time
          interstitial.load();
        });

        // Navigate even if ad fails to load
        const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
          unsubscribeError();
          navigateToArticle();
        });

        // Track when ad is shown
        const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, async () => {
          unsubscribeOpened();
          if (!adShown) {
            adShown = true;
            // Increment the daily count
            const newCount = await storage.incrementInterstitialAdCount();
            console.log('[HomeScreen] Interstitial ad shown. Daily count:', newCount);
          }
        });

        // Try to show ad (if already loaded, it will show immediately)
        if (interstitial.loaded) {
          interstitial.show();
        } else {
          // If not loaded, wait a bit for it to load, then navigate if it doesn't
          setTimeout(() => {
            if (interstitial.loaded) {
              interstitial.show();
            } else {
              // Ad not loaded, navigate anyway
              unsubscribeClosed();
              unsubscribeError();
              unsubscribeOpened();
              navigateToArticle();
            }
          }, 500);
        }
      } else {
        // No ad available or daily limit reached, navigate directly
        if (!canShowAd) {
          console.log('[HomeScreen] Daily interstitial ad limit reached (2 ads), navigating directly');
        }
        const category = (post.category || 'news').toLowerCase();
        try {
          router.push({
            pathname: '/article/[category]/[slug]',
            params: { category, slug, post: JSON.stringify(post) },
          });
        } catch (error) {
          console.error('[HomeScreen] Error navigating to article:', error);
          // Fallback: try again with the same format (without post data)
          try {
            router.push({
              pathname: '/article/[category]/[slug]',
              params: { category, slug },
            });
          } catch (fallbackError) {
            console.error('[HomeScreen] Fallback navigation also failed:', fallbackError);
          }
        }
      }
    }
  };

  const handleTagPress = (tag) => {
    router.push({
      pathname: '/search',
      params: { query: tag },
    });
  };

  const renderItem = ({ item, index }) => {
    // Render ad
    if (item.isAd) {
      const adId = item.id;
      const isAdLoaded = adsLoaded[adId] || false;
      
      return (
        <View style={isAdLoaded ? styles.adContainer : { height: 0, overflow: 'hidden' }}>
          <BannerAd
            unitId={getAdUnitId('banner', index % 2 === 0 ? 'home' : 'stories')}
            size={BannerAdSize.LARGE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => {
              console.log(`[Home] Ad ${index} loaded`);
              setAdsLoaded(prev => ({ ...prev, [adId]: true }));
            }}
            onAdFailedToLoad={(error) => {
              console.log(`[Home] Ad ${index} failed:`, error);
              setAdsLoaded(prev => ({ ...prev, [adId]: false }));
            }}
          />
        </View>
      );
    }
    
    // Render post
    return (
      <NewsCard
        post={item}
        onPress={() => handlePostPress(item)}
      />
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

  // Handle scroll to animate logo
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Hide logo when scrolling down, show when at top or scrolling up
        if (offsetY > 50) {
          // Scrolling down - hide logo and collapse wrapper
          Animated.parallel([
            Animated.timing(logoTranslateY, {
              toValue: -100,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(logoHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          // At top or scrolling up - show logo and expand wrapper
          Animated.parallel([
            Animated.timing(logoTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(logoHeight, {
              toValue: 70,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    }
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Logo above header - only on HomeScreen */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            height: logoHeight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={currentLanguage === 'hindi' ? logoHindi : logo}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </Animated.View>
      <View style={styles.headerSection}>
        <Header
          onSearch={() => router.push('/search')}
          showLanguageSelector={true}
          onLanguageChange={async (languageId) => {
            // Update current language state
            if (languageId) {
              setCurrentLanguage(languageId);
            } else {
              // Fallback: reload language from storage
              const language = await storage.getLanguage();
              setCurrentLanguage(language || 'english');
            }
            // Clear cache when language changes
            apiService.clearCache();
            // Reset state and reload data
            setPage(0);
            setHasMore(true);
            setPosts([]);
            setLoading(true);
            await loadPosts(selectedCategory, 0, false);
          }}
        />
        <CategoryTab
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <TagChips tags={getSubmenuItems()} onTagPress={handleTagPress} />
      </View>
      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={getDataWithAds(posts)}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.isAd ? item.id : `post-${item.id || item.shortSlug || index}`}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts found</Text>
                </View>
              ) : null
            }
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  logoWrapper: {
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    // No margin needed as logo is in normal flow
  },
  logo: {
    height: 50,
    width: 200,
  },
  listContent: {
    padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  adContainer: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: 8,
  },
});

export default HomeScreen;

