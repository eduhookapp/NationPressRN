import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

/**
 * Catch-all route for deep links
 * Handles URLs like:
 * - nationpress://category/slug
 * - nationpress://national/slug
 * - https://www.nationpress.com/category/slug
 */
export default function DeepLinkHandler() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [handled, setHandled] = useState(false);

  useEffect(() => {
    if (handled) return;
    
    console.log('[DeepLinkHandler] Received params:', JSON.stringify(params, null, 2));
    
    // Extract path from params
    // Expo Router passes the path segments as an array or single value
    const path = params.path;
    let pathArray: string[] = [];
    
    if (Array.isArray(path)) {
      pathArray = path;
    } else if (typeof path === 'string') {
      // Split by '/' in case it's a single string
      pathArray = path.split('/').filter(p => p && p !== '');
    }
    
    console.log('[DeepLinkHandler] Path array:', pathArray);
    
    if (pathArray.length === 0) {
      console.log('[DeepLinkHandler] No path, redirecting to home');
      setHandled(true);
      router.replace('/(tabs)');
      return;
    }
    
    // Extract query params if they exist (from URL like nationpress://article/category/slug?slug=...&category=...&language=...)
    const slugFromQuery = params.slug as string | undefined;
    const categoryFromQuery = params.category as string | undefined;
    const languageFromQuery = params.language as string | undefined;
    
    // Handle different URL formats
    // Format 1: nationpress://category/slug -> ['category', 'slug']
    // Format 2: nationpress://national/slug -> ['national', 'slug'] (national is category)
    // Format 3: nationpress://article/category/slug?slug=...&category=...&language=... (from navigateToArticle)
    if (pathArray.length >= 2) {
      // Check if this is the /article/category/slug format
      if (pathArray[0] === 'article' && pathArray.length >= 3) {
        // Format: /article/category/slug
        const category = slugFromQuery || decodeURIComponent(pathArray[pathArray.length - 2]);
        const slug = slugFromQuery || decodeURIComponent(pathArray[pathArray.length - 1]);
        
        console.log('[DeepLinkHandler] Navigating to article (article path format):', { category, slug, language: languageFromQuery });
        
        try {
          router.push({
            pathname: `/article/${category}/${slug}`,
            params: {
              slug,
              category,
              ...(languageFromQuery && { language: languageFromQuery }),
            },
          });
          setHandled(true);
        } catch (error) {
          console.error('[DeepLinkHandler] Error navigating:', error);
          setHandled(true);
          router.replace('/(tabs)');
        }
      } else {
        // Format: /category/slug
        const category = categoryFromQuery || decodeURIComponent(pathArray[0]);
        const slug = slugFromQuery || decodeURIComponent(pathArray[1]);
        
        console.log('[DeepLinkHandler] Navigating to article:', { category, slug, language: languageFromQuery });
        
        try {
          router.push({
            pathname: `/article/${category}/${slug}`,
            params: {
              slug,
              category,
              ...(languageFromQuery && { language: languageFromQuery }),
            },
          });
          setHandled(true);
        } catch (error) {
          console.error('[DeepLinkHandler] Error navigating:', error);
          setHandled(true);
          router.replace('/(tabs)');
        }
      }
    } else if (pathArray.length === 1) {
      // Just a slug, no category - use default category
      const slug = slugFromQuery || decodeURIComponent(pathArray[0]);
      
      console.log('[DeepLinkHandler] Navigating to article with slug only:', slug);
      
      try {
        router.push({
          pathname: `/article/news/${slug}`,
          params: {
            slug,
            category: 'news',
            ...(languageFromQuery && { language: languageFromQuery }),
          },
        });
        setHandled(true);
      } catch (error) {
        console.error('[DeepLinkHandler] Error navigating:', error);
        setHandled(true);
        router.replace('/(tabs)');
      }
    } else {
      // Unknown format, redirect to home
      console.log('[DeepLinkHandler] Unknown path format, redirecting to home');
      setHandled(true);
      router.replace('/(tabs)');
    }
  }, [params, router, handled]);

  // Show loading while handling
  if (!handled) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

