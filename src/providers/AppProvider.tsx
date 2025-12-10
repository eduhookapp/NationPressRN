import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as TrackingTransparency from 'expo-tracking-transparency';
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import { DEFAULT_LANGUAGE, LANGUAGES, setApiBaseUrl } from '../config/constants';
import { checkForUpdate } from '../services/inAppUpdates';
import { isConnected, subscribeToNetworkChanges } from '../services/networkService';
import { getOneSignalPlayerId, registerDeviceToken, saveNotificationLocally } from '../services/notificationService';
import crashLogger from '../utils/crashLogger';
import { markNotificationUrlAsHandled } from '../utils/notificationNavigation';
import { storage } from '../utils/storage';

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
  const router = useRouter();
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

  // Navigate to article helper - using Expo Router directly
  // This ensures navigation happens within the app, not in browser
  const navigateToArticle = React.useCallback((params: { slug: string; category?: string; language?: string }) => {
    try {
      const category = params.category || 'news';
      const slug = params.slug;
      
      if (!slug) {
        console.error('[AppProvider] ❌ No slug provided for navigation');
        return;
      }
      
      console.log('[AppProvider] 🚀 Navigating with Expo Router directly');
      console.log('[AppProvider] 📋 Params:', JSON.stringify(params, null, 2));
      
      // Use a small delay to ensure the app is ready to handle navigation
      // This prevents crashes when navigating immediately after app launch from notification
      setTimeout(() => {
        try {
          if (!router) {
            console.error('[AppProvider] ❌ Router not available');
            return;
          }
          
          // Use router.push() directly - this navigates within the app, not browser
          const articlePath = `/article/${category}/${slug}`;
          
          console.log('[AppProvider] 🔗 Navigating to:', articlePath);
          
          // Use type assertion for dynamic pathname
          router.push({
            pathname: articlePath as any,
            params: {
              slug,
              category,
              ...(params.language && { language: params.language }),
            },
          });
          
          console.log('[AppProvider] ✅ Navigation initiated within app');
        } catch (error) {
          console.error('[AppProvider] ❌ Navigation error:', error);
          // Fallback: try with string path
          try {
            if (router) {
              router.push(`/article/${category}/${slug}`);
            }
          } catch (fallbackError) {
            console.error('[AppProvider] ❌ Fallback navigation also failed:', fallbackError);
          }
        }
      }, 300); // Small delay to ensure app is ready
    } catch (error) {
      console.error('[AppProvider] ❌ Navigation error:', error);
    }
  }, [router]);

  // Intercept URL opening to prevent browser from opening when handling notifications
  useEffect(() => {
    const handleURL = (event: { url: string }) => {
      const url = event.url;
      console.log('[AppProvider] 🔗 URL intercepted:', url);
      
      // Check if we're currently handling a notification
      if (handledNotificationRef.current || isNavigatingFromNotification.current) {
        console.log('[AppProvider] 🚫 Preventing URL from opening in browser (notification being handled)');
        // Don't open the URL - we're handling navigation in-app
        return;
      }
      
      // Check if this URL was already handled by a notification
      if (lastHandledNotificationUrl.current && url === lastHandledNotificationUrl.current) {
        console.log('[AppProvider] 🚫 Preventing URL from opening in browser (already handled by notification)');
        return;
      }
      
      // Check if URL is from our domain (nationpress.com or rashtrapress.com)
      // If it is and we have a slug, we should handle it in-app
      if (url.includes('nationpress.com') || url.includes('rashtrapress.com')) {
        console.log('[AppProvider] 🔗 URL is from our domain, will handle in-app if needed');
        // Let it through - Expo Router will handle it via deep link handler
      }
    };

    // Listen for URL events
    const subscription = Linking.addEventListener('url', handleURL);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize AdMob and OneSignal
  useEffect(() => {
    const initializeAds = async () => {
      // Request App Tracking Transparency permission BEFORE initializing AdMob
      if (Platform.OS === 'ios') {
        try {
          console.log('[AppProvider] Requesting App Tracking Transparency permission...');
          const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
          console.log('[AppProvider] Tracking permission status:', status);
          
          if (status === 'granted') {
            console.log('[AppProvider] ✅ User granted tracking permission');
          } else {
            console.log('[AppProvider] ⚠️  User denied or restricted tracking permission');
          }
        } catch (error) {
          console.error('[AppProvider] Error requesting tracking permission:', error);
          // Continue with AdMob initialization even if permission request fails
        }
      }
      
      // Initialize Google AdMob (after requesting permission)
      console.log('[AppProvider] Initializing Google AdMob...');
      mobileAds()
        .initialize()
        .then(adapterStatuses => {
          console.log('[AppProvider] AdMob initialized successfully:', adapterStatuses);
        })
        .catch(error => {
          console.error('[AppProvider] AdMob initialization error:', error);
        });
    };
    
    initializeAds();
    
    // Initialize OneSignal
    const initializeOneSignal = async () => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[AppProvider] 🚀 Initializing OneSignal...');
      console.log('═══════════════════════════════════════════════════════════');
      
      OneSignal.Debug.setLogLevel(LogLevel.Debug);
      console.log('[AppProvider] ✅ OneSignal debug level set to VERBOSE');
      
      OneSignal.initialize('4a5d4548-9579-4d5d-958c-5819a5ea1598');
      console.log('[AppProvider] ✅ OneSignal.initialize() called');
      
      // Check permission status first before requesting
      try {
        const hasPermission = await OneSignal.Notifications.hasPermission();
        console.log('[AppProvider] Current notification permission status:', hasPermission);
        
        if (!hasPermission) {
          // Only request permission if not already granted
          // Use false to prevent OneSignal from showing "Open Settings" dialog automatically
          const permissionResult = await OneSignal.Notifications.requestPermission(false);
          console.log('[AppProvider] Permission request result:', permissionResult);
        } else {
          console.log('[AppProvider] ✅ Notification permission already granted');
        }
      } catch (error) {
        console.error('[AppProvider] Error checking/requesting notification permission:', error);
        // Fallback: try requesting without checking (but still use false to prevent auto dialog)
        try {
          await OneSignal.Notifications.requestPermission(false);
        } catch (fallbackError) {
          console.error('[AppProvider] Fallback permission request also failed:', fallbackError);
        }
      }
      
      // Opt in to push subscription
      try {
        const isOptedIn = OneSignal.User.pushSubscription.getOptedIn();
        if (!isOptedIn) {
          OneSignal.User.pushSubscription.optIn();
          console.log('[AppProvider] ✅ User opted in to push notifications');
        } else {
          console.log('[AppProvider] ✅ User already opted in to push notifications');
        }
      } catch (error) {
        console.error('[AppProvider] Error opting in to push subscription:', error);
      }
      
      console.log('═══════════════════════════════════════════════════════════');
    };
    
    initializeOneSignal();
    
    // Set up notification handlers
    OneSignal.Notifications.addEventListener('click', async (event) => {
      console.log('\n🔔 [AppProvider] OneSignal notification clicked');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const notification = event.notification;
      const data: any = notification.additionalData || {};
      const notificationId = notification.notificationId;
      
      // Check if notification has a launchURL that would open in browser
      // If it does, we'll handle navigation ourselves to prevent browser opening
      const launchURL = (notification as any).launchURL;
      if (launchURL) {
        console.log('[AppProvider] ⚠️  Notification has launchURL:', launchURL);
        console.log('[AppProvider] ✅ Will handle navigation in-app to prevent browser opening');
        // Mark URL as handled immediately to prevent browser opening
        lastHandledNotificationUrl.current = launchURL;
        markNotificationUrlAsHandled(launchURL);
      }
      
      if (lastHandledNotificationId.current === notificationId) {
        console.log('[AppProvider] ⚠️  This notification was already handled, ignoring duplicate click');
        return;
      }
      
      if (isNavigatingFromNotification.current) {
        console.log('[AppProvider] ⚠️  Already navigating from a notification, ignoring duplicate click');
        return;
      }
      
      // Set flags IMMEDIATELY to prevent URL opening
      handledNotificationRef.current = true;
      isNavigatingFromNotification.current = true;
      lastHandledNotificationId.current = notificationId;
      
      console.log('📦 Full notification data:', JSON.stringify(data, null, 2));
      
      saveNotificationLocally({
        title: notification.title || 'Notification',
        body: notification.body || '',
        data: data,
        notificationId: notificationId,
      }).catch(err => console.error('[AppProvider] Error saving notification on click:', err));
      
      let slug = data.slug || data.slug_unique || data.shortSlug;
      let category = data.category;
      const url = data.url || launchURL;
      const notificationLanguage = data.language;
      
      // Mark URL as handled IMMEDIATELY to prevent browser opening
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
        console.log('[AppProvider] 🔔 Flags already set to prevent browser opening');
        
        // Navigate immediately to prevent OneSignal from opening URL in browser
        // Use Expo Router directly - navigate synchronously
        console.log('[AppProvider] ✅ Navigating with Expo Router immediately');
        try {
          // Navigate immediately without delay to prevent browser opening
          const articleCategory = category || 'news';
          if (router) {
            // Use type assertion for dynamic pathname
            router.push({
              pathname: `/article/${articleCategory}/${slug}` as any,
              params: {
                slug,
                category: articleCategory,
                ...(notificationLanguage && { language: notificationLanguage }),
              },
            });
            console.log('[AppProvider] ✅ Navigation initiated immediately within app');
          } else {
            // Fallback to navigateToArticle if router not ready
            navigateToArticle({
              slug,
              category,
              language: notificationLanguage,
            });
          }
          
          // Reset flags after a short delay to allow navigation to complete
          setTimeout(() => {
            isNavigatingFromNotification.current = false;
            console.log('[AppProvider] 🔔 Reset isNavigatingFromNotification = false');
          }, 100);
          
          setTimeout(() => {
            handledNotificationRef.current = false;
            console.log('[AppProvider] 🔔 Reset handledNotificationRef = false');
          }, 2000); // Keep flag longer to prevent browser opening
          
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

