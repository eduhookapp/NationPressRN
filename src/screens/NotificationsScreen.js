import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { COLORS, SPACING, FONT_SIZES, LANGUAGES, setApiBaseUrl } from '../config/constants';
import { formatRelativeTime } from '../utils/dateUtils';
import { storage } from '../utils/storage';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  clearAllNotifications 
} from '../services/notificationService';
import { markNotificationUrlAsHandled } from '../utils/notificationNavigation';

const NotificationsScreen = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notifications from storage
  const loadNotifications = useCallback(async () => {
    try {
      console.log('[NotificationsScreen] Loading notifications from storage...');
      const storedNotifications = await getNotifications();
      console.log('[NotificationsScreen] Loaded', storedNotifications.length, 'notifications');
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('[NotificationsScreen] Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[NotificationsScreen] Screen focused, reloading notifications...');
      loadNotifications();
    }, [loadNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, [loadNotifications]);

  const handleNotificationPress = async (notification) => {
    try {
      // Mark as read in storage
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        )
      );

      console.log('[NotificationsScreen] Notification marked as read:', notification.id);

      // Extract slug from data or URL
      let slug = notification.data?.slug || notification.data?.slug_unique || notification.data?.shortSlug;
      const category = notification.data?.category;
      const url = notification.data?.url;

      // If we have a URL but no slug, try to extract it
      if (!slug && url) {
        console.log('[NotificationsScreen] Extracting slug from URL:', url);
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(p => p && p !== 'category');
          
          if (pathParts.length >= 2) {
            // category/slug format
            slug = pathParts[1];
          } else if (pathParts.length === 1) {
            // Just slug
            slug = pathParts[0];
          }
          
          console.log('[NotificationsScreen] Extracted slug:', slug);
        } catch (error) {
          console.error('[NotificationsScreen] Error parsing URL:', error);
        }
      }

      // Detect language from URL domain and switch API if needed
      if (url) {
        try {
          const urlObj = new URL(url);
          const hostname = urlObj.hostname;
          
          console.log('[NotificationsScreen] URL hostname:', hostname);
          
          // Check if it's a Hindi site (rashtrapress)
          if (hostname.includes('rashtrapress')) {
            console.log('[NotificationsScreen] Hindi article detected, switching to Hindi API');
            setApiBaseUrl(LANGUAGES.hindi.apiBaseUrl);
            // Save language preference
            await storage.saveLanguage('hindi');
          } else if (hostname.includes('nationpress')) {
            console.log('[NotificationsScreen] English article detected, switching to English API');
            setApiBaseUrl(LANGUAGES.english.apiBaseUrl);
            // Save language preference
            await storage.saveLanguage('english');
          }
        } catch (error) {
          console.error('[NotificationsScreen] Error detecting language from URL:', error);
        }
      }

      // Mark the notification URL as handled to prevent React Navigation from re-processing it
      if (url) {
        markNotificationUrlAsHandled(url);
        console.log('[NotificationsScreen] Marked notification URL as handled:', url);
      }

      if (slug) {
        console.log('[NotificationsScreen] Navigating to article:', { slug, category });
        // Use Expo Router to navigate to article
        const articleCategory = (category || 'news').toLowerCase();
        if (router && typeof router.push === 'function') {
          try {
            router.push({
              pathname: '/article/[category]/[slug]',
              params: {
                category: articleCategory,
                slug: slug,
                ...(category && { category: articleCategory }),
              },
            });
          } catch (error) {
            console.error('[NotificationsScreen] Error navigating to article:', error);
            // Fallback: navigate to home
            router.replace('/(tabs)');
          }
        } else {
          console.error('[NotificationsScreen] Router not available');
        }
      } else {
        console.log('[NotificationsScreen] No slug found, navigating to home');
        if (router && typeof router.replace === 'function') {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('[NotificationsScreen] Error handling notification press:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadNotifications();
      console.log('[NotificationsScreen] All notifications marked as read');
    } catch (error) {
      console.error('[NotificationsScreen] Error marking all as read:', error);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              await loadNotifications();
              console.log('[NotificationsScreen] All notifications cleared');
            } catch (error) {
              console.error('[NotificationsScreen] Error clearing notifications:', error);
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'news':
        return 'newspaper-outline';
      case 'update':
        return 'megaphone-outline';
      default:
        return 'notifications-outline';
    }
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={item.read ? COLORS.textLight : COLORS.primary}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.timestamp}>
          {formatRelativeTime(item.timestamp)}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={COLORS.textLight}
      />
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>Loading...</Text>
          <Text style={styles.emptyText}>
            Loading your notifications
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>No Notifications</Text>
        <Text style={styles.emptyText}>
          You'll receive notifications here when new articles are published
        </Text>
      </View>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Notifications"
        showLanguageSelector={true}
        onLanguageChange={() => {
          // Reload when language changes if needed
        }}
        rightAction={unreadCount > 0 ? markAllAsRead : undefined}
        rightIcon={unreadCount > 0 ? 'checkmark-done' : undefined}
      />
      {notifications.length > 0 && (
        <View style={styles.headerAction}>
          <View style={styles.actionRow}>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={markAllAsRead}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearAll}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
              <Text style={[styles.actionText, { color: COLORS.error }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyList : styles.listContent
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
  headerAction: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  unreadItem: {
    backgroundColor: COLORS.surface,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textLight,
    flex: 1,
  },
  unreadTitle: {
    color: COLORS.text,
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  message: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyList: {
    flex: 1,
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

export default NotificationsScreen;

