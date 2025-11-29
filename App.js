import { StatusBar } from 'expo-status-bar';
import * as TrackingTransparency from 'expo-tracking-transparency';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { LogLevel, OneSignal } from 'react-native-onesignal';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS, DEFAULT_LANGUAGE, getApiBaseUrl, LANGUAGES, setApiBaseUrl } from './src/config/constants';
import AppNavigator from './src/navigation/AppNavigator';
import LanguageSelectionScreen from './src/screens/LanguageSelectionScreen';
import OfflineScreen from './src/screens/OfflineScreen';
import { checkForUpdate } from './src/services/inAppUpdates';
import { isConnected, subscribeToNetworkChanges } from './src/services/networkService';
import { getOneSignalPlayerId, registerDeviceToken, saveNotificationLocally } from './src/services/notificationService';
import { markNotificationUrlAsHandled } from './src/utils/notificationNavigation';
import { storage } from './src/utils/storage';

export default function App() {
  const [showLanguageSelection, setShowLanguageSelection] = useState(null); // null = checking, true = show, false = hide
  const [isReady, setIsReady] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // Track network connectivity
  const [lastNavigationState, setLastNavigationState] = useState(null); // Track last navigation state before going offline
  const navigationRef = useRef(null);
  const handledNotificationRef = useRef(false); // Track if we already handled a notification
  const wasOfflineRef = useRef(false); // Track if we were offline
  const lastHandledNotificationUrl = useRef(null); // Track the URL of the last handled notification
  const lastHandledNotificationId = useRef(null); // Track last handled notification ID to prevent duplicates
  const isNavigatingFromNotification = useRef(false); // Track if we're currently navigating from a notification

  // Global error handler to prevent app crashes
  useEffect(() => {
    const errorHandler = (error, isFatal) => {
      console.error('═══════════════════════════════════════════════════════════');
      console.error('[App] 🚨 Global Error Caught:', error);
      console.error('[App] 🚨 Is Fatal:', isFatal);
      console.error('[App] 🚨 Error Name:', error.name);
      console.error('[App] 🚨 Error Message:', error.message);
      console.error('[App] 🚨 Error Stack:', error.stack);
      console.error('═══════════════════════════════════════════════════════════');
    };

    // Note: ErrorUtils is available in React Native
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        errorHandler(error, isFatal);
        // Call original handler
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }, []);

  // Monitor network connectivity
  useEffect(() => {
    console.log('[App] Setting up network monitoring...');
    
    // Check initial connection status
    isConnected().then(connected => {
      console.log('[App] Initial network status:', connected ? 'Online' : 'Offline');
      setIsOnline(connected);
    });

    // Subscribe to network changes
    const unsubscribe = subscribeToNetworkChanges((networkState) => {
      const connected = networkState.isConnected && networkState.isInternetReachable;
      const wasOffline = !isOnline;
      
      console.log('[App] Network status changed:', connected ? 'Online' : 'Offline', networkState);
      
      // Store navigation state when going offline
      if (!connected && navigationRef.current) {
        const currentState = navigationRef.current.getRootState();
        if (currentState) {
          console.log('[App] 📍 Saving navigation state before going offline');
          setLastNavigationState(currentState);
          wasOfflineRef.current = true;
        }
      }
      
      setIsOnline(connected);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [isOnline]);

  // Function to reload the last page
  const reloadLastPage = React.useCallback(() => {
    if (!navigationRef.current || !lastNavigationState) {
      console.log('[App] ⚠️  Cannot reload: navigation ref or state missing');
      return;
    }

    try {
      // Get the current route from the saved navigation state
      const getCurrentRoute = (state) => {
        if (!state || !state.routes) return null;
        
        const route = state.routes[state.index];
        if (route.state) {
          return getCurrentRoute(route.state);
        }
        return route;
      };

      const currentRoute = getCurrentRoute(lastNavigationState);
      
      if (!currentRoute) {
        console.log('[App] ⚠️  No current route found in saved state');
        return;
      }

      console.log('[App] 🔄 Reloading route:', currentRoute.name, currentRoute.params);

      // Navigate to the last route with a reload trigger (timestamp)
      const reloadParams = {
        ...currentRoute.params,
        reloadKey: Date.now(), // Add timestamp to force reload
      };

      // Navigate based on the route structure
      if (currentRoute.name === 'HomeTab' || currentRoute.name === 'StoriesTab' || 
          currentRoute.name === 'BookmarksTab' || currentRoute.name === 'NotificationsTab') {
        // Tab navigator - need to navigate to the nested screen
        const tabName = currentRoute.name;
        const nestedRoute = getCurrentRoute(currentRoute.state);
        
        if (nestedRoute) {
          console.log('[App] 🔄 Navigating to tab:', tabName, 'screen:', nestedRoute.name);
          navigationRef.current.navigate(tabName, {
            screen: nestedRoute.name,
            params: reloadParams,
          });
        } else {
          // Just navigate to the tab
          navigationRef.current.navigate(tabName);
        }
      } else {
        // Direct navigation
        navigationRef.current.navigate(currentRoute.name, reloadParams);
      }
    } catch (error) {
      console.error('[App] ❌ Error reloading last page:', error);
    }
  }, [lastNavigationState]);

  // Reload last page when connection is restored
  useEffect(() => {
    if (isOnline && wasOfflineRef.current && navigationRef.current && lastNavigationState) {
      console.log('[App] ✅ Connection restored, reloading last page...');
      // Small delay to ensure navigation is ready
      setTimeout(() => {
        reloadLastPage();
        wasOfflineRef.current = false;
      }, 500);
    }
  }, [isOnline, lastNavigationState, reloadLastPage]);

  useEffect(() => {
    const initializeAds = async () => {
      // Request App Tracking Transparency permission BEFORE initializing AdMob
      if (Platform.OS === 'ios') {
        try {
          console.log('[App] Requesting App Tracking Transparency permission...');
          const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
          console.log('[App] Tracking permission status:', status);
          
          if (status === 'granted') {
            console.log('[App] ✅ User granted tracking permission');
          } else {
            console.log('[App] ⚠️  User denied or restricted tracking permission');
          }
        } catch (error) {
          console.error('[App] Error requesting tracking permission:', error);
          // Continue with AdMob initialization even if permission request fails
        }
      }
      
      // Initialize Google AdMob (after requesting permission)
      console.log('[App] Initializing Google AdMob...');
      mobileAds()
        .initialize()
        .then(adapterStatuses => {
          console.log('[App] AdMob initialized successfully:', adapterStatuses);
        })
        .catch(error => {
          console.error('[App] AdMob initialization error:', error);
        });
    };
    
    initializeAds();
    
    // Initialize OneSignal
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[App] 🚀 Initializing OneSignal...');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Enable verbose logging for debugging (remove in production)
    OneSignal.Debug.setLogLevel(LogLevel.Debug);
    console.log('[App] ✅ OneSignal debug level set to VERBOSE');
    
    // Initialize with your OneSignal App ID
    OneSignal.initialize('4a5d4548-9579-4d5d-958c-5819a5ea1598');
    console.log('[App] ✅ OneSignal.initialize() called');
    
    // Request notification permission
    OneSignal.Notifications.requestPermission(true);
    console.log('[App] ✅ Notification permission requested');
    
    // Explicitly opt-in user to push notifications
    OneSignal.User.pushSubscription.optIn();
    console.log('[App] ✅ User opted in to push notifications');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Set up notification handlers
    OneSignal.Notifications.addEventListener('click', async (event) => {
      console.log('\n🔔 [App] OneSignal notification clicked');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Extract notification data
      const notification = event.notification;
      const data = notification.additionalData || {};
      const notificationId = notification.notificationId;
      
      // Check if notification has a launchURL that would open in browser
      // If it does, we'll handle navigation ourselves to prevent browser opening
      const launchURL = notification.launchURL;
      if (launchURL) {
        console.log('[App] ⚠️  Notification has launchURL:', launchURL);
        console.log('[App] ✅ Will handle navigation in-app to prevent browser opening');
      }
      
      // Prevent duplicate handling of the same notification
      if (lastHandledNotificationId.current === notificationId) {
        console.log('[App] ⚠️  This notification was already handled, ignoring duplicate click');
        return;
      }
      
      // Prevent handling if we're already navigating from a notification
      if (isNavigatingFromNotification.current) {
        console.log('[App] ⚠️  Already navigating from a notification, ignoring duplicate click');
        return;
      }
      
      console.log('📦 Full notification data:', JSON.stringify(data, null, 2));
      
      // Save notification to local storage (in case it wasn't saved before)
      saveNotificationLocally({
        title: notification.title || 'Notification',
        body: notification.body || '',
        data: data,
        notificationId: notificationId,
      }).catch(err => console.error('[App] Error saving notification on click:', err));
      
      // Extract slug from data or URL
      let slug = data.slug || data.slug_unique || data.shortSlug;
      const category = data.category;
      const url = data.url;
      const notificationLanguage = data.language; // Get language from notification data
      
      // Store the notification URL to prevent React Navigation from processing it
      if (url) {
        lastHandledNotificationUrl.current = url;
        markNotificationUrlAsHandled(url); // Also store in shared utility
        console.log('[App] 🔔 Stored notification URL to prevent re-processing:', url);
      }
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Extracted Fields:');
      console.log('  🏷️  Slug:', slug);
      console.log('  📂 Category:', category);
      console.log('  🔗 URL:', url);
      console.log('  🌍 Language:', notificationLanguage);
      console.log('  📌 handledNotificationRef before:', handledNotificationRef.current);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // If we have a URL but no slug, try to extract it
      if (!slug && url) {
        console.log('[App] Extracting slug from URL:', url);
        try {
          // Parse URL to extract slug
          // URL formats: 
          // - https://www.nationpress.com/category/slug
          // - https://www.rashtrapress.com/category/slug
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(p => p && p !== 'category');
          
          if (pathParts.length >= 2) {
            // category/slug format
            slug = pathParts[1];
          } else if (pathParts.length === 1) {
            // Just slug
            slug = pathParts[0];
          }
          
          console.log('[App] Extracted slug:', slug);
        } catch (error) {
          console.error('[App] Error parsing URL:', error);
        }
      }
      
      // Don't switch global API - pass language to the article instead
      if (notificationLanguage) {
        console.log('[App] 🌐 Article language detected:', notificationLanguage);
      }
      
      // Debug: Check navigation readiness
      console.log('[App] 🔍 Navigation check:');
      console.log('  slug:', slug);
      console.log('  navigationRef.current:', navigationRef.current ? 'READY' : 'NULL');
      console.log('  Condition result:', !!(slug && navigationRef.current));
      
      if (slug) {
        console.log('[App] Navigating to article:', { slug, category, language: notificationLanguage });
        
        // Mark that we're handling a notification
        handledNotificationRef.current = true;
        isNavigatingFromNotification.current = true;
        lastHandledNotificationId.current = notificationId;
        console.log('[App] 🔔 Set handledNotificationRef = true');
        console.log('[App] 🔔 Set isNavigatingFromNotification = true');
        console.log('[App] 🔔 Set lastHandledNotificationId =', notificationId);
        
        // Wait for navigation to be ready (longer delay)
        let retryCount = 0;
        const maxRetries = 20; // Maximum 4 seconds (20 * 200ms)
        
        const attemptNavigation = () => {
          if (navigationRef.current) {
            console.log('[App] ✅ NavigationRef is ready!');
            navigateToArticle();
          } else if (retryCount < maxRetries) {
            retryCount++;
            console.log(`[App] ⏳ NavigationRef not ready, retrying... (${retryCount}/${maxRetries})`);
            setTimeout(attemptNavigation, 200);
          } else {
            console.error('[App] ❌ NavigationRef failed to initialize after', maxRetries, 'attempts');
            // Reset flags on failure
            isNavigatingFromNotification.current = false;
            handledNotificationRef.current = false;
          }
        };
        
        const navigateToArticle = () => {
          try {
            if (!navigationRef.current) {
              console.error('[App] ❌ NavigationRef is null, cannot navigate');
              // Reset flags on failure
              isNavigatingFromNotification.current = false;
              handledNotificationRef.current = false;
              return;
            }
            
            const navParams = {
              slug: slug,
              language: notificationLanguage, // Pass language for API override
              ...(category && { category: category }),
            };
            
            console.log('[App] 🚀 Navigating with params:', JSON.stringify(navParams, null, 2));
            
            navigationRef.current.navigate('HomeTab', {
              screen: 'ArticleDetail',
              params: navParams,
            });
            
            console.log('[App] ✅ Navigation successful with language:', notificationLanguage);
            
            // Reset navigation flag immediately after navigation
            // This prevents the handler from being triggered again and allows normal navigation
            isNavigatingFromNotification.current = false;
            console.log('[App] 🔔 Reset isNavigatingFromNotification = false');
            
            // Reset handledNotificationRef immediately after navigation
            // This prevents deep link handler from re-processing the same URL
            // Use a small delay to ensure navigation completes, but not too long
            setTimeout(() => {
              handledNotificationRef.current = false;
              console.log('[App] 🔔 Reset handledNotificationRef = false');
            }, 500);
            
            // Clear last handled notification ID and URL after a delay
            // This allows the same notification to be handled again if clicked later
            setTimeout(() => {
              lastHandledNotificationId.current = null;
              lastHandledNotificationUrl.current = null;
              console.log('[App] 🔔 Cleared lastHandledNotificationId and URL');
            }, 10000); // Clear after 10 seconds
          } catch (error) {
            console.error('[App] ❌ Navigation error:', error);
            console.error('[App] ❌ Error stack:', error.stack);
            // Reset flags on error
            isNavigatingFromNotification.current = false;
            handledNotificationRef.current = false;
            // Don't let the error crash the app
          }
        };
        
        // Start attempting navigation with retry logic
        setTimeout(attemptNavigation, 500);
      } else {
        // No slug found, reset flags
        isNavigatingFromNotification.current = false;
        handledNotificationRef.current = false;
      }
    });
    
    // Handle notification received in foreground - SAVE IMMEDIATELY
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', async (event) => {
      console.log('[App] Notification received in foreground:', JSON.stringify(event));
      
      const notification = event.notification;
      const data = notification.additionalData || {};
      
      // Save notification to local storage immediately
      try {
        await saveNotificationLocally({
          title: notification.title || 'Notification',
          body: notification.body || '',
          data: data,
          notificationId: notification.notificationId,
        });
        console.log('[App] ✅ Notification saved to local storage');
      } catch (error) {
        console.error('[App] ❌ Error saving notification:', error);
      }
      
      // Display the notification
      event.notification.display();
    });
    
    console.log('[App] OneSignal initialized successfully');

    // Initialize app and check if language selection is needed
    const initializeApp = async () => {
      try {
        // Check for app updates (non-blocking, runs in background)
        // Delay significantly to ensure app is fully initialized and native modules are ready
        setTimeout(() => {
          try {
            checkForUpdate().catch(err => {
              console.error('[App] Error checking for updates:', err);
              // Don't let update errors affect app functionality
            });
          } catch (error) {
            console.error('[App] Error setting up update check:', error);
            // Silently fail - updates are optional
          }
        }, 5000); // Wait 5 seconds after app starts to ensure everything is ready
        
        // Check if user has selected language before
        const hasSelected = await storage.hasSelectedLanguage();
        
        if (!hasSelected) {
          // First launch - show language selection
          setShowLanguageSelection(true);
        } else {
          // Not first launch - load saved language
          const savedLanguage = await storage.getLanguage();
          const language = LANGUAGES[savedLanguage] || LANGUAGES[DEFAULT_LANGUAGE];
          console.log('[App] Setting API based on saved language:', savedLanguage);
          setApiBaseUrl(language.apiBaseUrl);
          setShowLanguageSelection(false);
          
          // Set OneSignal tags and register device with backend
          setTimeout(async () => {
            try {
              console.log('═══════════════════════════════════════════════════════════');
              console.log('[App] 🔧 Setting up OneSignal tags and registration...');
              console.log('[App] 📝 Saved language:', savedLanguage);
              console.log('═══════════════════════════════════════════════════════════');
              
              // Get current tags
              const tagsBefore = await OneSignal.User.getTags();
              console.log('[App] 📋 Tags BEFORE setting:', JSON.stringify(tagsBefore, null, 2));
              
              // Set only ONE tag to avoid tag limit errors
              const segmentTag = savedLanguage === 'english' ? 'English' : 'Hindi';
              console.log(`[App] 🏷️  Setting single segment tag: "${segmentTag}"`);
              console.log('[App] 📦 Tag to add: { segment: "' + segmentTag + '" }');
              
              OneSignal.User.addTag('segment', segmentTag);
              console.log('[App] ✅ OneSignal.User.addTag() called with segment:', segmentTag);
              
              // Verify tags were set
              console.log('[App] ⏳ Waiting 1 second for tags to sync...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              const tagsAfterAdd = await OneSignal.User.getTags();
              console.log('[App] 📋 Tags AFTER setting:', JSON.stringify(tagsAfterAdd, null, 2));
              console.log('═══════════════════════════════════════════════════════════');
              
              // Get Player ID and register with backend
              const playerId = await getOneSignalPlayerId();
              if (playerId) {
                // Check subscription status
                const isPushEnabled = OneSignal.User.pushSubscription.getOptedIn();
                console.log('[App] Push subscription status:', isPushEnabled);
                
                if (!isPushEnabled) {
                  console.warn('[App] ⚠️  User not opted in, attempting to opt in...');
                  OneSignal.User.pushSubscription.optIn();
                }
                
                console.log('[App] Registering Player ID with backend...');
                await registerDeviceToken(playerId, language.apiBaseUrl);
              } else {
                console.warn('[App] ⚠️  Could not obtain Player ID after retries');
              }
            } catch (error) {
              console.error('[App] ❌ Error during setup:', error);
            }
          }, 2000); // Wait 2 seconds for OneSignal to fully initialize
        }
        setIsReady(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        // On error, use default and show language selection
        const language = LANGUAGES[DEFAULT_LANGUAGE];
        setApiBaseUrl(language.apiBaseUrl);
        setShowLanguageSelection(true);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  const handleLanguageSelected = async (languageId) => {
    // Language is already saved, API URL is already set, and OneSignal tags are already set
    // in LanguageSelectionScreen - Just hide the language selection screen
    console.log('[App] Language selected:', languageId, '- LanguageSelectionScreen already handled OneSignal tags');
    setShowLanguageSelection(false);
    
    // Set OneSignal tags and register device with backend
    setTimeout(async () => {
      try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[App] 🆕 Setting up OneSignal after language selection...');
        console.log('[App] 📝 Selected language:', languageId);
        console.log('═══════════════════════════════════════════════════════════');
        
        // Add only ONE tag to avoid tag limit errors
        const segmentTag = languageId === 'english' ? 'English' : 'Hindi';
        console.log(`[App] 🏷️  Setting single segment tag: "${segmentTag}"`);
        console.log('[App] 📦 Tag to add: { segment: "' + segmentTag + '" }');
        
        OneSignal.User.addTag('segment', segmentTag);
        console.log('[App] ✅ OneSignal.User.addTag() called with segment:', segmentTag);
        
        // Wait for tags to sync
        console.log('[App] ⏳ Waiting 1 second for tags to sync...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const tagsAfter = await OneSignal.User.getTags();
        console.log('[App] 📋 Tags AFTER first selection:', JSON.stringify(tagsAfter, null, 2));
        
        // Get Player ID and register with backend
        const playerId = await getOneSignalPlayerId();
        const apiBaseUrl = getApiBaseUrl();
        console.log('[App] 🔑 Player ID:', playerId);
        console.log('[App] 🌐 API Base URL:', apiBaseUrl);
        
        if (playerId && apiBaseUrl) {
          console.log('[App] 📡 Registering Player ID with backend...');
          await registerDeviceToken(playerId, apiBaseUrl);
          console.log('[App] ✅ Device token registered successfully');
        } else {
          console.warn('[App] ⚠️  Could not obtain Player ID or API URL');
        }
        console.log('═══════════════════════════════════════════════════════════');
      } catch (error) {
        console.error('[App] ❌ Error during setup:', error);
      }
    }, 2000); // Wait 2 seconds for OneSignal to fully initialize
  };

  // Show loading while checking
  if (!isReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#6B2C1A" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  // Show language selection screen on first launch
  if (showLanguageSelection) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#6B2C1A" />
        <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />
      </SafeAreaProvider>
    );
  }

  // Track navigation state changes
  const handleNavigationStateChange = (state) => {
    if (state && isOnline) {
      // Only update navigation state when online
      setLastNavigationState(state);
    }
  };

  // Show offline screen when internet is down (only after app is ready and language is selected)
  if (!isOnline && isReady && !showLanguageSelection) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#6B2C1A" />
        <OfflineScreen 
          onConnectionRestored={() => {
            console.log('[App] ✅ Connection restored, resuming app...');
            // The state will automatically update via the network listener
            // reloadLastPage will be called automatically when isOnline becomes true
          }}
        />
      </SafeAreaProvider>
    );
  }

  // Show main app
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <AppNavigator 
        ref={navigationRef} 
        handledNotificationRef={handledNotificationRef}
        lastHandledNotificationUrl={lastHandledNotificationUrl}
        onNavigationStateChange={handleNavigationStateChange}
      />
    </SafeAreaProvider>
  );
}

