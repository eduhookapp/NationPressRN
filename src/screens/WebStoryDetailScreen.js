import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { apiService } from '../services/api';
import { COLORS, SPACING, LANGUAGES } from '../config/constants';
import { storage } from '../utils/storage';
import Header from '../components/Header';

const WebStoryDetailScreen = ({ route }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug, story: initialStory } = route?.params || {};
  const [story, setStory] = useState(initialStory || null);
  const [loadingStory, setLoadingStory] = useState(!initialStory);
  const [currentLanguage, setCurrentLanguage] = useState('english');

  useEffect(() => {
    // Load current language
    const loadLanguage = async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(language || 'english');
      } catch (error) {
        console.error('[WebStoryDetail] Error loading language:', error);
      }
    };
    loadLanguage();

    // Poll for language changes
    const interval = setInterval(async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(prev => {
          if (prev !== language) {
            return language || 'english';
          }
          return prev;
        });
      } catch (error) {
        console.error('[WebStoryDetail] Error checking language:', error);
      }
    }, 500);

    if (!initialStory && slug) {
      loadStory();
    }

    return () => clearInterval(interval);
  }, [slug, initialStory]);

  const loadStory = async () => {
    try {
      setLoadingStory(true);
      const result = await apiService.fetchWebStoryBySlug(slug);
      
      if (result.success && result.story) {
        setStory(result.story);
      }
      // Note: Even if story not found, we can still open the URL using the slug
    } catch (error) {
      console.error('Error loading story:', error);
      // Continue anyway - we'll use the slug to construct the URL
    } finally {
      setLoadingStory(false);
    }
  };

  const handleBack = () => {
    if (!router) {
      console.error('[WebStoryDetail] Router not available');
      return;
    }
    
    // Try router.dismiss() first (for modals/presented screens)
    if (typeof router.dismiss === 'function') {
      try {
        router.dismiss();
        return;
      } catch (dismissError) {
        console.log('[WebStoryDetail] router.dismiss() failed, trying router.back()');
      }
    }
    
    // Try router.back()
    if (typeof router.back === 'function') {
      try {
        router.back();
        return;
      } catch (backError) {
        console.log('[WebStoryDetail] router.back() failed:', backError);
      }
    }
    
    // Fallback: navigate to stories tab
    console.log('[WebStoryDetail] Back methods failed, navigating to stories tab');
    if (typeof router.replace === 'function') {
      router.replace('/(tabs)/stories');
    } else if (typeof router.push === 'function') {
      router.push('/(tabs)/stories');
    }
  };

  // Build web story URL based on current language
  // Format: https://www.nationpress.com/web-stories/{slug} (English)
  // Format: https://www.rashtrapress.com/web-stories/{slug} (Hindi)
  // Even if story data is not found, we can still try to open the URL using the slug
  const getDomain = () => {
    const language = LANGUAGES[currentLanguage] || LANGUAGES.english;
    return language.domain;
  };

  const storyUrl = story?.url || 
                   story?.storyUrl || 
                   story?.webStoryUrl || 
                   (slug ? `${getDomain()}/web-stories/${slug}` : null);

  if (!storyUrl) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Story Not Found"
          onBack={handleBack}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Story not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Web Story"
        onBack={handleBack}
      />
      <WebView
        key={`webstory-${currentLanguage}-${slug}`}
        source={{ uri: storyUrl }}
        style={[styles.webView, { marginBottom: insets.bottom }]}
        startInLoadingState={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebStoryDetail] WebView error:', nativeEvent);
          console.error('[WebStoryDetail] Failed URL:', storyUrl);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('[WebStoryDetail] WebView HTTP error:', nativeEvent);
          console.error('[WebStoryDetail] Failed URL:', storyUrl);
        }}
        onLoadStart={() => {
          console.log('[WebStoryDetail] WebView loading URL:', storyUrl);
          console.log('[WebStoryDetail] Current language:', currentLanguage);
        }}
        onLoadEnd={() => {
          console.log('[WebStoryDetail] WebView loaded successfully');
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
});

export default WebStoryDetailScreen;

