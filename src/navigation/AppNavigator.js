import React, { useState, useEffect } from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { COLORS, TAB_LABELS } from '../config/constants';
import { storage } from '../utils/storage';
import { isNotificationUrlHandled } from '../utils/notificationNavigation';

// Screens
import HomeScreen from '../screens/HomeScreen';
import CategoryScreen from '../screens/CategoryScreen';
import ArticleDetailScreen from '../screens/ArticleDetailScreen';
import WebStoriesScreen from '../screens/WebStoriesScreen';
import WebStoryDetailScreen from '../screens/WebStoryDetailScreen';
import SearchScreen from '../screens/SearchScreen';
import BookmarksScreen from '../screens/BookmarksScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AboutScreen from '../screens/AboutScreen';
import ContactScreen from '../screens/ContactScreen';
import PrivacyScreen from '../screens/PrivacyScreen';
import TermsScreen from '../screens/TermsScreen';
import DisclaimerScreen from '../screens/DisclaimerScreen';
import CookiePolicyScreen from '../screens/CookiePolicyScreen';
import AdvertiseScreen from '../screens/AdvertiseScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen
        name="Category"
        component={CategoryScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="WebStories"
        component={WebStoriesScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Disclaimer"
        component={DisclaimerScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CookiePolicy"
        component={CookiePolicyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Advertise"
        component={AdvertiseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

const StoriesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="StoriesMain" component={WebStoriesScreen} />
      <Stack.Screen
        name="WebStoryDetail"
        component={WebStoryDetailScreen}
        options={({ navigation }) => ({
          headerShown: false,
          animation: 'slide_from_right',
        })}
      />
      {/* Search screen removed to avoid conflict with HomeTab > Search */}
      {/* Users can navigate to HomeTab to access search functionality */}
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Disclaimer"
        component={DisclaimerScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CookiePolicy"
        component={CookiePolicyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Advertise"
        component={AdvertiseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

const BookmarksStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="BookmarksMain" component={BookmarksScreen} />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetailScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Disclaimer"
        component={DisclaimerScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CookiePolicy"
        component={CookiePolicyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Advertise"
        component={AdvertiseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

const NotificationsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NotificationsMain" component={NotificationsScreen} />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Contact"
        component={ContactScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Terms"
        component={TermsScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Disclaimer"
        component={DisclaimerScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="CookiePolicy"
        component={CookiePolicyScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="Advertise"
        component={AdvertiseScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = React.forwardRef(({ handledNotificationRef, lastHandledNotificationUrl, onNavigationStateChange }, ref) => {
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const internalNavigationRef = React.useRef(null);
  
  // Forward the ref to the NavigationContainer whenever it changes
  const updateRef = React.useCallback(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(internalNavigationRef.current);
      } else if (ref && typeof ref === 'object' && 'current' in ref) {
        ref.current = internalNavigationRef.current;
      }
    }
  }, [ref]);
  
  React.useEffect(() => {
    updateRef();
    // Also update when NavigationContainer ref changes
    const interval = setInterval(() => {
      if (internalNavigationRef.current) {
        updateRef();
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [updateRef]);
  
  const navigationRef = internalNavigationRef;

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(language || 'english');
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };
    loadLanguage();

    // Listen for language changes
    const interval = setInterval(async () => {
      const language = await storage.getLanguage();
      setCurrentLanguage(language || 'english');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Track if we've already processed the initial URL to prevent re-processing
  const processedInitialUrlRef = React.useRef(false);
  
  // Handle deep links manually as fallback
  useEffect(() => {
    const handleDeepLink = async () => {
      // Only process initial URL once
      if (processedInitialUrlRef.current) {
        console.log('AppNavigator - ⏭️  Initial URL already processed, skipping');
        return;
      }
      
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        // Check if this URL was already handled by a notification (check both ref and shared utility)
        if ((lastHandledNotificationUrl?.current && initialUrl === lastHandledNotificationUrl.current) ||
            isNotificationUrlHandled(initialUrl)) {
          console.log('AppNavigator - ⏭️  Skipping deep link - URL was already handled by notification:', initialUrl);
          processedInitialUrlRef.current = true;
          return;
        }
        
        // Mark as processed immediately to prevent re-processing
        processedInitialUrlRef.current = true;
        
        // Check if notification handler already navigated
        if (handledNotificationRef?.current) {
          console.log('AppNavigator - ⏭️  Skipping deep link - already handled by notification');
          return;
        }
        
        console.log('AppNavigator - Handling initial deep link:', initialUrl);
        
        // Detect language from URL domain
        let detectedLanguage = null;
        try {
          const urlObj = new URL(initialUrl);
          const hostname = urlObj.hostname;
          
          console.log('AppNavigator - URL hostname:', hostname);
          
          // Check if it's a Hindi site (rashtrapress)
          if (hostname.includes('rashtrapress')) {
            console.log('AppNavigator - Hindi article detected from URL');
            detectedLanguage = 'hindi';
          } else if (hostname.includes('nationpress')) {
            console.log('AppNavigator - English article detected from URL');
            detectedLanguage = 'english';
          }
        } catch (error) {
          console.error('AppNavigator - Error detecting language from URL:', error);
        }
        
        // Parse URL manually if needed
        const url = Linking.parse(initialUrl);
        console.log('AppNavigator - Parsed URL:', JSON.stringify(url, null, 2));
        
        // If path matches article pattern (category/slug), navigate after a delay
        if (url.path && url.path.includes('/')) {
          // Remove leading/trailing slashes and split
          const cleanPath = url.path.replace(/^\/+|\/+$/g, '');
          const parts = cleanPath.split('/').filter(p => p && p !== 'category');
          
          if (parts.length >= 2) {
            // Handle both formats: category/slug or just slug after category route
            let category, slug;
            
            // Check if first part is "category" (e.g., /category/news/article-slug)
            if (parts[0] === 'category' && parts.length >= 3) {
              category = decodeURIComponent(parts[1]);
              slug = decodeURIComponent(parts[2].split('?')[0].split('#')[0].trim());
            } else {
              // Standard format: category/slug
              category = decodeURIComponent(parts[0]);
              slug = decodeURIComponent(parts[1].split('?')[0].split('#')[0].trim());
            }
            
            console.log('AppNavigator - Extracted category:', category, 'slug:', slug, 'language:', detectedLanguage);
            
            // Wait for navigation to be ready, then navigate WITH language
            setTimeout(() => {
              // Double-check that this URL wasn't handled by a notification (check both ref and shared utility)
              if ((lastHandledNotificationUrl?.current && initialUrl === lastHandledNotificationUrl.current) ||
                  isNotificationUrlHandled(initialUrl)) {
                console.log('AppNavigator - ⏭️  Skipping navigation - URL was already handled by notification');
                return;
              }
              
              if (navigationRef.current) {
                console.log('AppNavigator - Navigating to ArticleDetail with category:', category, 'slug:', slug, 'language:', detectedLanguage);
                navigationRef.current.navigate('HomeTab', {
                  screen: 'ArticleDetail',
                  params: { 
                    category, 
                    slug,
                    language: detectedLanguage // Pass detected language
                  },
                });
              }
            }, 1500);
          } else if (parts.length === 1) {
            // Single part - might be just a slug, try to use it
            const slug = decodeURIComponent(parts[0].split('?')[0].split('#')[0].trim());
            console.log('AppNavigator - Single part detected, using as slug:', slug, 'language:', detectedLanguage);
            
            setTimeout(() => {
              // Double-check that this URL wasn't handled by a notification (check both ref and shared utility)
              if ((lastHandledNotificationUrl?.current && initialUrl === lastHandledNotificationUrl.current) ||
                  isNotificationUrlHandled(initialUrl)) {
                console.log('AppNavigator - ⏭️  Skipping navigation - URL was already handled by notification');
                return;
              }
              
              if (navigationRef.current) {
                navigationRef.current.navigate('HomeTab', {
                  screen: 'ArticleDetail',
                  params: { 
                    slug,
                    language: detectedLanguage // Pass detected language
                  },
                });
              }
            }, 1500);
          }
        }
      }
    };

    handleDeepLink();
  }, []);

  const getTabLabel = (tabKey) => {
    return TAB_LABELS[currentLanguage]?.[tabKey] || TAB_LABELS.english[tabKey];
  };

  // Deep link configuration
  const linking = {
    prefixes: [
      'nationpress://',
      'https://www.nationpress.com',
      'https://www.rashtrapress.com',
      'https://nationpress.com',
      'https://rashtrapress.com',
    ],
    config: {
      screens: {
        HomeTab: {
          screens: {
            HomeMain: {
              path: '',
              exact: true,
            },
            Category: {
              path: 'category/:category',
              parse: {
                category: (category) => decodeURIComponent(category),
              },
            },
            ArticleDetail: {
              path: ':category/:slug',
              parse: {
                category: (category) => decodeURIComponent(category),
                slug: (slug) => decodeURIComponent(slug),
              },
            },
            Search: {
              path: 'search',
            },
            WebStories: {
              path: 'web-stories',
              exact: true,
            },
            // WebStoryDetail removed from HomeTab deep linking to avoid conflict
            // It's still accessible via navigation, just not via deep links from HomeTab
            // Use StoriesTab > WebStoryDetail for deep link access
          },
        },
        StoriesTab: {
          screens: {
            StoriesMain: {
              path: 'stories',
              exact: true,
            },
            WebStoryDetail: {
              path: 'web-stories/:slug',
              parse: {
                slug: (slug) => decodeURIComponent(slug),
              },
            },
            // Search, About, etc. removed from deep linking to avoid conflicts
            // They're still accessible via navigation, just use HomeTab for deep links
          },
        },
        BookmarksTab: {
          screens: {
            BookmarksMain: {
              path: 'bookmarks',
              exact: true,
            },
            // ArticleDetail, About, etc. removed from deep linking to avoid conflicts
            // They're still accessible via navigation, just use HomeTab for deep links
          },
        },
        NotificationsTab: {
          screens: {
            NotificationsMain: {
              path: 'notifications',
              exact: true,
            },
          },
        },
      },
    },
    // Custom URL parsing function
    async getInitialURL() {
      // If we've already processed the initial URL or handled a notification, don't return it
      // This prevents React Navigation from re-processing the same URL
      if (processedInitialUrlRef.current || handledNotificationRef?.current) {
        console.log('Deep link - Skipping getInitialURL - already processed or notification handled');
        return null;
      }
      
      // Check if app was opened from a deep link
      const url = await Linking.getInitialURL();
      if (url != null) {
        // Check if this URL was already handled by a notification (check both ref and shared utility)
        if ((lastHandledNotificationUrl?.current && url === lastHandledNotificationUrl.current) || 
            isNotificationUrlHandled(url)) {
          console.log('Deep link - Skipping getInitialURL - URL was already handled by notification:', url);
          return null;
        }
        console.log('Deep link - Initial URL:', url);
        return url;
      }
    },
    subscribe(listener) {
      // Listen to incoming links from deep linking
      const onReceiveURL = ({ url }) => {
        // Check if this URL was already handled by a notification (check both ref and shared utility)
        if ((lastHandledNotificationUrl?.current && url === lastHandledNotificationUrl.current) ||
            isNotificationUrlHandled(url)) {
          console.log('Deep link - Skipping URL event - URL was already handled by notification:', url);
          return;
        }
        
        // Check if we're currently handling a notification
        if (handledNotificationRef?.current) {
          console.log('Deep link - Skipping URL event - notification being handled');
          return;
        }
        
        console.log('Deep link - Received URL:', url);
        listener(url);
      };

      // Listen to URL events
      const subscription = Linking.addEventListener('url', onReceiveURL);

      return () => {
        subscription.remove();
      };
    },
  };

  // Use NavigationIndependentTree to create a separate navigation tree
  // This allows React Navigation to work alongside Expo Router
  return (
    <NavigationIndependentTree>
      <NavigationContainer 
        ref={internalNavigationRef} 
        linking={linking}
        onStateChange={(state) => {
          // Notify parent component of navigation state changes
          if (onNavigationStateChange) {
            onNavigationStateChange(state);
          }
        }}
      >
        <Tab.Navigator
      key={currentLanguage} // Force re-render when language changes
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'StoriesTab') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'BookmarksTab') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else if (route.name === 'NotificationsTab') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: getTabLabel('home'),
        }}
      />
      <Tab.Screen
        name="StoriesTab"
        component={StoriesStack}
        options={{
          tabBarLabel: getTabLabel('stories'),
        }}
      />
      <Tab.Screen
        name="BookmarksTab"
        component={BookmarksStack}
        options={{
          tabBarLabel: getTabLabel('bookmarks'),
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStack}
        options={{
          tabBarLabel: getTabLabel('notifications'),
        }}
      />
        </Tab.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
});

export default AppNavigator;


