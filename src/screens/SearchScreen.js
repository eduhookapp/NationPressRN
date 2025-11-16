import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Keyboard,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import Header from '../components/Header';
import NewsCard from '../components/NewsCard';

const { width } = Dimensions.get('window');

const SearchScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  // Get initial search query from route params if provided
  const initialQuery = params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = async (query, pageNum = 0, append = false) => {
    if (!query || !query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    try {
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 10;
      const start = pageNum * limit;
      const result = await apiService.searchPosts(query, limit, start);

      if (result.success) {
        if (append) {
          setResults(prev => [...prev, ...result.data]);
        } else {
          setResults(result.data);
          setHasSearched(true);
        }
        setHasMore(result.data.length === limit && result.total > start + limit);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = useCallback(() => {
    Keyboard.dismiss();
    setPage(0);
    setHasMore(true);
    performSearch(searchQuery.trim(), 0, false);
  }, [searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    performSearch(searchQuery.trim(), 0, false);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && searchQuery.trim()) {
      const nextPage = page + 1;
      setPage(nextPage);
      performSearch(searchQuery.trim(), nextPage, true);
    }
  };

  // Perform search automatically if initial query is provided
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery.trim(), 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handlePostPress = (post) => {
    if (!post) {
      console.warn('handlePostPress: post is null or undefined');
      return;
    }
    
    const slug = post.shortSlug || post.slugUnique || post.slug;
    if (slug) {
      // Use Expo Router to navigate to article
      const category = (post.category || 'news').toLowerCase();
      if (router && typeof router.push === 'function') {
        try {
          router.push({
            pathname: '/article/[category]/[slug]',
            params: { category, slug, post: JSON.stringify(post) },
          });
        } catch (error) {
          console.error('Error navigating to article:', error);
        }
      } else {
        console.warn('handlePostPress: Router not available');
      }
    } else {
      console.warn('handlePostPress: No slug found for post:', post);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
    Keyboard.dismiss();
  };

  const renderItem = ({ item }) => {
    if (!item) return null;
    
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

  const renderEmpty = () => {
    if (loading) return null;
    
    if (hasSearched && searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyText}>No results found for</Text>
          <Text style={styles.emptyQuery}>"{searchQuery}"</Text>
          <Text style={styles.emptySubtext}>Try different keywords</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>Search for articles</Text>
        <Text style={styles.emptySubtext}>Enter keywords to find news articles</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header 
        title="Search" 
        onBack={() => {
          if (router && typeof router.back === 'function') {
            router.back();
          } else if (router && typeof router.replace === 'function') {
            router.replace('/(tabs)');
          }
        }} 
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleSearch}
            style={styles.searchButton}
            activeOpacity={0.7}
            disabled={!searchQuery.trim()}
          >
            <Ionicons name="arrow-forward" size={20} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      </View>

      {loading && !hasSearched ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item, index) => `search-result-${item?.id || item?.shortSlug || item?.slugUnique || item?.slug || index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              enabled={hasSearched}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          removeClippedSubviews={false}
          scrollEnabled={true}
          nestedScrollEnabled={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  searchContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    height: 50,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: SPACING.xs,
    marginRight: SPACING.xs,
  },
  searchButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl * 2,
    minHeight: 300,
  },
  emptyText: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyQuery: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default SearchScreen;

