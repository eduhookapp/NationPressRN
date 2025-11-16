import React, { useEffect, useRef, createContext, useContext } from 'react';
import { OneSignal, LogLevel } from 'react-native-onesignal';
import mobileAds from 'react-native-google-mobile-ads';
import * as Linking from 'expo-linking';
import { getOneSignalPlayerId, registerDeviceToken, saveNotificationLocally } from '../services/notificationService';
import { subscribeToNetworkChanges, isConnected } from '../services/networkService';
import { markNotificationUrlAsHandled } from '../utils/notificationNavigation';
import { checkForUpdate } from '../services/inAppUpdates';
import { LANGUAGES, DEFAULT_LANGUAGE, setApiBaseUrl, getApiBaseUrl } from '../config/constants';
import { storage } from '../utils/storage';
import crashLogger from '../utils/crashLogger';

interface AppContextType {
  isOnline: boolean;
  handledNotificationRef: React.MutableRefObject<boolean>;
  lastHandledNotificationUrl: React.MutableRefObject<string | null>;
  navigateToArticle: (params: { slug: string; category?: string; language?: string }) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(true);
  const handledNotificationRef = useRef(false);
  const lastHandledNotificationUrl = useRef<string | null>(null);
  const lastHandledNotificationId = useRef<string | null>(null);
  const isNavigatingFromNotification = useRef(false);

  // Initialize crash logger (do this first, before any other initialization)
  useEffect(() => {
    try {
      crashLogger.initialize();
      console.log('[AppProvider] ✅ Crash logger initialized');
    } catch (error) {
      console.error('[AppProvider] ❌ Failed to initialize crash logger:', error);
    }
  }, []);

  // Global error handler
  useEffect(() => {
    const errorHandler = (error: Error, isFatal: boolean) => {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[AppProvider] 🚨 Global Error Caught:', error);
      console.error('[AppProvider] 🚨 Is Fatal:', isFatal);
      console.error('[AppProvider] 🚨 Error Name:', error.name);
      console.error('[AppProvider] 🚨 Error Message:', error.message);
      console.error('[AppProvider] 🚨 Error Stack:', error.stack);
      console.error('═══════════════════════════════════════════════════════════');
      
      // Log to crash logger if available
      if ((global as any).crashLogger) {
        try {
          (global as any).crashLogger.logError(error, `Global Error Handler - Fatal: ${isFatal}`);
        } catch (logError) {
          console.error('[AppProvider] Failed to log error to crash logger:', logError);
        }
      }
    };

    if (typeof (global as any).ErrorUtils !== 'undefined') {
      const ErrorUtils = (global as any).ErrorUtils;
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
        errorHandler(error, isFatal);
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    console.log('[AppProvider] Setting up network monitoring...');
    
    isConnected().then(connected => {
      console.log('[AppProvider] Initial network status:', connected ? 'Online' : 'Offline');
      setIsOnline(connected);
    });

    const unsubscribe = subscribeToNetworkChanges((networkState: any) => {
      const connected = networkState.isConnected && networkState.isInternetReachable;
      console.log('[AppProvider] Network status changed:', connected ? 'Online' : 'Offline', networkState);
      setIsOnline(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Navigate to article helper - using Expo Router via Linking
  // Note: We use Linking.openURL() which will be handled by Expo Router's deep link handler
  const navigateToArticle = React.useCallback((params: { slug: string; category?: string; language?: string }) => {
    try {
      const category = params.category || 'news';
      const articlePath = `/article/${category}/${params.slug}`;
      
      console.log('[AppProvider] 🚀 Navigating with Expo Router:', articlePath);
      console.log('[AppProvider] 📋 Params:', JSON.stringify(params, null, 2));
      
      // Use a small delay to ensure the app is ready to handle navigation
      // This prevents crashes when navigating immediately after app launch from notification
      setTimeout(() => {
        try {
          // Build URL with query params - use the app scheme directly
          const url = `nationpress://${articlePath}?slug=${encodeURIComponent(params.slug)}${params.category ? `&category=${encodeURIComponent(params.category)}` : ''}${params.language ? `&language=${encodeURIComponent(params.language)}` : ''}`;
          
          console.log('[AppProvider] 🔗 Opening URL:', url);
          
          // Use expo-linking to navigate (Expo Router will handle it via catch-all route)
          Linking.openURL(url).catch((error) => {
            console.error('[AppProvider] ❌ Error opening URL:', error);
            // Fallback: try without query params
            try {
              Linking.openURL(`nationpress://${articlePath}`).catch((fallbackError) => {
                console.error('[AppProvider] ❌ Fallback navigation also failed:', fallbackError);
              });
            } catch (fallbackError) {
              console.error('[AppProvider] ❌ Fallback navigation error:', fallbackError);
            }
          });
          
          console.log('[AppProvider] ✅ Navigation initiated');
        } catch (error) {
          console.error('[AppProvider] ❌ Navigation error in setTimeout:', error);
        }
      }, 300); // Small delay to ensure app is ready
    } catch (error) {
      console.error('[AppProvider] ❌ Navigation error:', error);
    }
  }, []);

  // Initialize AdMob and OneSignal
  useEffect(() => {
    // Initialize Google AdMob
    console.log('[AppProvider] Initializing Google AdMob...');
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('[AppProvider] AdMob initialized successfully:', adapterStatuses);
      })
      .catch(error => {
        console.error('[AppProvider] AdMob initialization error:', error);
      });
    
    // Initialize OneSignal
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[AppProvider] 🚀 Initializing OneSignal...');
    console.log('═══════════════════════════════════════════════════════════');
    
    OneSignal.Debug.setLogLevel(LogLevel.Debug);
    console.log('[AppProvider] ✅ OneSignal debug level set to VERBOSE');
    
    OneSignal.initialize('4a5d4548-9579-4d5d-958c-5819a5ea1598');
    console.log('[AppProvider] ✅ OneSignal.initialize() called');
    
    OneSignal.Notifications.requestPermission(true);
    console.log('[AppProvider] ✅ Notification permission requested');
    
    OneSignal.User.pushSubscription.optIn();
    console.log('[AppProvider] ✅ User opted in to push notifications');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Set up notification handlers
    OneSignal.Notifications.addEventListener('click', async (event) => {
      console.log('\n🔔 [AppProvider] OneSignal notification clicked');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const notification = event.notification;
      const data: any = notification.additionalData || {};
      const notificationId = notification.notificationId;
      
      if (lastHandledNotificationId.current === notificationId) {
        console.log('[AppProvider] ⚠️  This notification was already handled, ignoring duplicate click');
        return;
      }
      
      if (isNavigatingFromNotification.current) {
        console.log('[AppProvider] ⚠️  Already navigating from a notification, ignoring duplicate click');
        return;
      }
      
      console.log('📦 Full notification data:', JSON.stringify(data, null, 2));
      
      saveNotificationLocally({
        title: notification.title || 'Notification',
        body: notification.body || '',
        data: data,
        notificationId: notificationId,
      }).catch(err => console.error('[AppProvider] Error saving notification on click:', err));
      
      let slug = data.slug || data.slug_unique || data.shortSlug;
      let category = data.category;
      const url = data.url;
      const notificationLanguage = data.language;
      
      if (url) {
        lastHandledNotificationUrl.current = url;
        markNotificationUrlAsHandled(url);
        console.log('[AppProvider] 🔔 Stored notification URL to prevent re-processing:', url);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Extracted Fields:');
      console.log('  🏷️  Slug:', slug);
      console.log('  📂 Category:', category);
      console.log('  🔗 URL:', url);
      console.log('  🌍 Language:', notificationLanguage);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (!slug && url) {
        console.log('[AppProvider] Extracting slug from URL:', url);
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(p => p && p !== '' && p !== 'category');
          
          console.log('[AppProvider] URL path parts:', pathParts);
          
          if (pathParts.length >= 2) {
            // Format: /category/slug or /category/subcategory/slug
            // Take the last part as slug
            slug = decodeURIComponent(pathParts[pathParts.length - 1]);
            // If we have category info, use the second-to-last part
            if (pathParts.length >= 2 && !category) {
              category = decodeURIComponent(pathParts[pathParts.length - 2]);
            }
          } else if (pathParts.length === 1) {
            // Format: /slug
            slug = decodeURIComponent(pathParts[0]);
          }
          
          // Clean slug - remove query parameters and hash
          if (slug) {
            slug = slug.split('?')[0].split('#')[0].trim();
          }
          
          console.log('[AppProvider] Extracted slug:', slug, 'category:', category);
        } catch (error) {
          console.error('[AppProvider] Error parsing URL:', error);
        }
      }
      
      if (slug) {
        console.log('[AppProvider] Navigating to article:', { slug, category, language: notificationLanguage });
        
        handledNotificationRef.current = true;
        isNavigatingFromNotification.current = true;
        lastHandledNotificationId.current = notificationId;
        console.log('[AppProvider] 🔔 Set handledNotificationRef = true');
        console.log('[AppProvider] 🔔 Set isNavigatingFromNotification = true');
        console.log('[AppProvider] 🔔 Set lastHandledNotificationId =', notificationId);
        
        // Use Expo Router directly - no need to wait for navigation ref
        console.log('[AppProvider] ✅ Navigating with Expo Router');
        try {
          navigateToArticle({
            slug,
            category,
            language: notificationLanguage,
          });
          isNavigatingFromNotification.current = false;
          setTimeout(() => {
            handledNotificationRef.current = false;
            console.log('[AppProvider] 🔔 Reset handledNotificationRef = false');
          }, 500);
          setTimeout(() => {
            lastHandledNotificationId.current = null;
            lastHandledNotificationUrl.current = null;
            console.log('[AppProvider] 🔔 Cleared lastHandledNotificationId and URL');
          }, 10000);
        } catch (error) {
          console.error('[AppProvider] ❌ Error during navigation:', error);
          isNavigatingFromNotification.current = false;
          handledNotificationRef.current = false;
        }
      } else {
        isNavigatingFromNotification.current = false;
        handledNotificationRef.current = false;
      }
    });
    
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', async (event) => {
      console.log('[AppProvider] Notification received in foreground:', JSON.stringify(event));
      
      const notification = event.notification;
      const data = notification.additionalData || {};
      
      try {
        await saveNotificationLocally({
          title: notification.title || 'Notification',
          body: notification.body || '',
          data: data,
          notificationId: notification.notificationId,
        });
        console.log('[AppProvider] ✅ Notification saved to local storage');
      } catch (error) {
        console.error('[AppProvider] ❌ Error saving notification:', error);
      }
      
      event.notification.display();
    });
    
    console.log('[AppProvider] OneSignal initialized successfully');

    // Initialize app
    const initializeApp = async () => {
      try {
        setTimeout(() => {
          try {
            checkForUpdate().catch(err => {
              console.error('[AppProvider] Error checking for updates:', err);
            });
          } catch (error) {
            console.error('[AppProvider] Error setting up update check:', error);
          }
        }, 5000);
        
        const hasSelected = await storage.hasSelectedLanguage();
        
        if (!hasSelected) {
          // Language selection will be handled by root layout
        } else {
          const savedLanguage = await storage.getLanguage();
          const language = (savedLanguage && savedLanguage in LANGUAGES) ? LANGUAGES[savedLanguage as keyof typeof LANGUAGES] : LANGUAGES[DEFAULT_LANGUAGE];
          console.log('[AppProvider] Setting API based on saved language:', savedLanguage);
          setApiBaseUrl(language.apiBaseUrl);
          
          setTimeout(async () => {
            try {
              console.log('═══════════════════════════════════════════════════════════');
              console.log('[AppProvider] 🔧 Setting up OneSignal tags and registration...');
              console.log('[AppProvider] 📝 Saved language:', savedLanguage);
              console.log('═══════════════════════════════════════════════════════════');
              
              const tagsBefore = await OneSignal.User.getTags();
              console.log('[AppProvider] 📋 Tags BEFORE setting:', JSON.stringify(tagsBefore, null, 2));
              
              const segmentTag = savedLanguage === 'english' ? 'English' : 'Hindi';
              console.log(`[AppProvider] 🏷️  Setting single segment tag: "${segmentTag}"`);
              
              OneSignal.User.addTag('segment', segmentTag);
              console.log('[AppProvider] ✅ OneSignal.User.addTag() called with segment:', segmentTag);
              
              await new Promise(resolve => setTimeout(resolve, 1000));
              const tagsAfterAdd = await OneSignal.User.getTags();
              console.log('[AppProvider] 📋 Tags AFTER setting:', JSON.stringify(tagsAfterAdd, null, 2));
              console.log('═══════════════════════════════════════════════════════════');
              
              const playerId = await getOneSignalPlayerId();
              if (playerId) {
                const isPushEnabled = OneSignal.User.pushSubscription.getOptedIn();
                console.log('[AppProvider] Push subscription status:', isPushEnabled);
                
                if (!isPushEnabled) {
                  console.warn('[AppProvider] ⚠️  User not opted in, attempting to opt in...');
                  OneSignal.User.pushSubscription.optIn();
                }
                
                console.log('[AppProvider] Registering Player ID with backend...');
                await registerDeviceToken(playerId, language.apiBaseUrl);
              } else {
                console.warn('[AppProvider] ⚠️  Could not obtain Player ID after retries');
              }
            } catch (error) {
              console.error('[AppProvider] ❌ Error during setup:', error);
            }
          }, 2000);
        }
      } catch (error) {
        console.error('[AppProvider] Error initializing app:', error);
        const language = LANGUAGES[DEFAULT_LANGUAGE];
        setApiBaseUrl(language.apiBaseUrl);
      }
    };

    initializeApp();
  }, [navigateToArticle]);

  const value: AppContextType = {
    isOnline,
    handledNotificationRef,
    lastHandledNotificationUrl,
    navigateToArticle,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

