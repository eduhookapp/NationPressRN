import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  LANGUAGE: '@nationpress:language',
  BOOKMARKS: '@nationpress:bookmarks',
  HAS_SELECTED_LANGUAGE: '@nationpress:hasSelectedLanguage',
  NOTIFICATIONS: '@nationpress:notifications',
  REGISTERED_PLAYER_ID: '@nationpress:registeredPlayerId',
  FCM_TOKEN: '@nationpress:fcmToken',
  INTERSTITIAL_AD_TRACKING: '@nationpress:interstitialAdTracking',
};

export const storage = {
  // Language preference
  async getLanguage() {
    try {
      const language = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
      return language || 'english';
    } catch (error) {
      console.error('Error getting language:', error);
      return 'english';
    }
  },

  async setLanguage(language) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  },

  // Bookmarks
  async getBookmarks() {
    try {
      const bookmarks = await AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return bookmarks ? JSON.parse(bookmarks) : [];
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  },

  async saveBookmarks(bookmarks) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  },

  async addBookmark(post) {
    try {
      const bookmarks = await this.getBookmarks();
      const slug = post.shortSlug || post.slugUnique || post.slug;
      const exists = bookmarks.some(b => (b.shortSlug || b.slugUnique || b.slug) === slug);
      
      if (!exists) {
        bookmarks.push({
          ...post,
          bookmarkedAt: new Date().toISOString(),
        });
        await this.saveBookmarks(bookmarks);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }
  },

  async removeBookmark(slug) {
    try {
      const bookmarks = await this.getBookmarks();
      const filtered = bookmarks.filter(
        b => (b.shortSlug || b.slugUnique || b.slug) !== slug
      );
      await this.saveBookmarks(filtered);
      return true;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  },

  async isBookmarked(slug) {
    try {
      const bookmarks = await this.getBookmarks();
      return bookmarks.some(b => (b.shortSlug || b.slugUnique || b.slug) === slug);
    } catch (error) {
      console.error('Error checking bookmark:', error);
      return false;
    }
  },

  // First launch check
  async hasSelectedLanguage() {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SELECTED_LANGUAGE);
      return value === 'true';
    } catch (error) {
      console.error('Error checking language selection:', error);
      return false;
    }
  },

  async setHasSelectedLanguage(value = true) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SELECTED_LANGUAGE, String(value));
    } catch (error) {
      console.error('Error setting language selection flag:', error);
    }
  },

  // Notifications
  async getNotifications() {
    try {
      const notifications = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  },

  async saveNotifications(notifications) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  },

  async clearNotifications() {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  },

  // Device Token Registration Tracking
  async getRegisteredPlayerId() {
    try {
      const playerId = await AsyncStorage.getItem(STORAGE_KEYS.REGISTERED_PLAYER_ID);
      return playerId;
    } catch (error) {
      console.error('Error getting registered player ID:', error);
      return null;
    }
  },

  async saveRegisteredPlayerId(playerId) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REGISTERED_PLAYER_ID, playerId);
      console.log('[Storage] Saved registered player ID:', playerId);
    } catch (error) {
      console.error('Error saving registered player ID:', error);
    }
  },

  async clearRegisteredPlayerId() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.REGISTERED_PLAYER_ID);
      console.log('[Storage] Cleared registered player ID');
    } catch (error) {
      console.error('Error clearing registered player ID:', error);
    }
  },

  // Legacy FCM Token methods (kept for compatibility)
  async saveFCMToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, token);
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  },

  async getFCMToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Interstitial Ad Tracking (limit to 2 per day)
  async getInterstitialAdTracking() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INTERSTITIAL_AD_TRACKING);
      if (!data) {
        return { date: null, count: 0 };
      }
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting interstitial ad tracking:', error);
      return { date: null, count: 0 };
    }
  },

  async saveInterstitialAdTracking(tracking) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INTERSTITIAL_AD_TRACKING, JSON.stringify(tracking));
    } catch (error) {
      console.error('Error saving interstitial ad tracking:', error);
    }
  },

  async canShowInterstitialAd() {
    try {
      const tracking = await this.getInterstitialAdTracking();
      const today = new Date().toDateString(); // Get date string (e.g., "Mon Jan 01 2024")
      
      // If it's a new day, reset the count
      if (tracking.date !== today) {
        await this.saveInterstitialAdTracking({ date: today, count: 0 });
        return true; // Can show ad (count is 0, will be 1 after showing)
      }
      
      // Check if we've shown less than 2 ads today
      return tracking.count < 2;
    } catch (error) {
      console.error('Error checking if can show interstitial ad:', error);
      return true; // Default to allowing if there's an error
    }
  },

  async incrementInterstitialAdCount() {
    try {
      const tracking = await this.getInterstitialAdTracking();
      const today = new Date().toDateString();
      
      // If it's a new day, reset the count
      if (tracking.date !== today) {
        await this.saveInterstitialAdTracking({ date: today, count: 1 });
        return 1;
      }
      
      // Increment the count
      const newCount = tracking.count + 1;
      await this.saveInterstitialAdTracking({ date: today, count: newCount });
      return newCount;
    } catch (error) {
      console.error('Error incrementing interstitial ad count:', error);
      return 0;
    }
  },
};

