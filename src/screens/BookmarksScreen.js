import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import Header from '../components/Header';
import NewsCard from '../components/NewsCard';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { storage } from '../utils/storage';

const BookmarksScreen = () => {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBookmarks = async () => {
    try {
      const savedBookmarks = await storage.getBookmarks();
      setBookmarks(savedBookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookmarks();
  }, []);

  const handleRemoveBookmark = async (post) => {
    const slug = post.shortSlug || post.slugUnique || post.slug;
    await storage.removeBookmark(slug);
    loadBookmarks();
  };

  const handlePostPress = (post) => {
    try {
      const slug = post.shortSlug || post.slugUnique || post.slug;
      if (!slug) {
        console.error('No slug found for bookmarked post:', post);
        return;
      }
      // Use Expo Router to navigate to article
      const category = (post.category || 'news').toLowerCase();
      if (router && typeof router.push === 'function') {
        router.push({
          pathname: '/article/[category]/[slug]',
          params: { category, slug, post: JSON.stringify(post) },
        });
      } else {
        console.error('Error navigating to bookmarked post: Router not available');
      }
    } catch (error) {
      console.error('Error navigating to bookmarked post:', error);
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>No Bookmarks</Text>
      <Text style={styles.emptyText}>
        Articles you bookmark will appear here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Bookmarks"
          showLanguageSelector={true}
          onLanguageChange={() => {
            // Reload when language changes
            loadBookmarks();
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Bookmarks"
        showLanguageSelector={true}
        onLanguageChange={() => {
          loadBookmarks();
        }}
      />
      <FlatList
        data={bookmarks}
        keyExtractor={(item, index) => {
          const slug = item.shortSlug || item.slugUnique || item.slug || index.toString();
          return slug;
        }}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <NewsCard 
              post={item} 
              onPress={() => handlePostPress(item)}
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveBookmark(item)}
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          bookmarks.length === 0 ? styles.emptyList : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  listContent: {
    padding: SPACING.md,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    padding: SPACING.xs,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default BookmarksScreen;

