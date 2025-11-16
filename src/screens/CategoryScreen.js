import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { apiService } from '../services/api';
import { COLORS, SPACING } from '../config/constants';
import { getAdUnitId, AD_CONFIG } from '../config/adsConfig';
import NewsCard from '../components/NewsCard';
import Header from '../components/Header';

const CategoryScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { category } = params;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

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

  const loadPosts = async (pageNum = 0, append = false) => {
    try {
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 15;
      const start = pageNum * limit;
      const result = await apiService.fetchPostsByCategory(category, limit, start);

      if (result.success) {
        if (append) {
          setPosts(prev => [...prev, ...result.data]);
        } else {
          setPosts(result.data);
        }
        setHasMore(result.data.length === limit && result.total > start + limit);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadPosts(0, false);
    setPage(0);
    setHasMore(true);
  }, [category]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    loadPosts(0, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage, true);
    }
  };

  const handlePostPress = (post) => {
    const slug = post.shortSlug || post.slugUnique || post.slug;
    if (slug) {
      // Use Expo Router to navigate to article
      const articleCategory = (post.category || category || 'news').toLowerCase();
      if (router && typeof router.push === 'function') {
        try {
          router.push({
            pathname: '/article/[category]/[slug]',
            params: { category: articleCategory, slug, post: JSON.stringify(post) },
          });
        } catch (error) {
          console.error('Error navigating to article:', error);
        }
      } else {
        console.warn('handlePostPress: Router not available');
      }
    }
  };

  const renderItem = ({ item, index }) => {
    // Render ad
    if (item.isAd) {
      return (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={getAdUnitId('banner', index % 2 === 0 ? 'home' : 'stories')}
            size={BannerAdSize.LARGE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => {
              console.log(`[Category] Ad ${index} loaded`);
            }}
            onAdFailedToLoad={(error) => {
              console.log(`[Category] Ad ${index} failed:`, error);
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

  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title={categoryName}
          onBack={() => {
            if (router && typeof router.back === 'function') {
              router.back();
            } else if (router && typeof router.replace === 'function') {
              router.replace('/(tabs)');
            }
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={categoryName}
        onBack={() => navigation.goBack()}
      />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
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

export default CategoryScreen;

