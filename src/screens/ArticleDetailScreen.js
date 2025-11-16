import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Dimensions,
  Share,
  Platform,
  FlatList,
  BackHandler
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useRouter } from 'expo-router';
import Tts from 'react-native-tts';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES, ARTICLE_SECTIONS, LANGUAGES } from '../config/constants';
import { getAdUnitId, AD_CONFIG } from '../config/adsConfig';
import Header from '../components/Header';
import NewsCard from '../components/NewsCard';
import { formatIndianDate, getImageUrl, stripHtml } from '../utils/dateUtils';

// Helper to strip HTML but preserve spaces (doesn't trim)
const stripHtmlPreserveSpaces = (html) => {
  if (!html) return '';
  if (typeof html !== 'string') return String(html);
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
    // Note: No .trim() here to preserve spaces
};

const { width, height } = Dimensions.get('window');

// Helper function to parse HTML <ul><li> structure
const parseHtmlList = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return [];
  
  // Extract all <li>...</li> content
  const liMatches = htmlString.match(/<li[^>]*>(.*?)<\/li>/gis);
  if (!liMatches) return [];
  
  return liMatches.map(match => {
    // Extract content between <li> and </li>
    const contentMatch = match.match(/<li[^>]*>(.*?)<\/li>/is);
    if (!contentMatch) return '';
    
    // Get the inner content
    let content = contentMatch[1].trim();
    
    // Clean up any nested tags but preserve <strong> and <b>
    // We'll handle these in rendering
    return content;
  }).filter(item => item.trim().length > 0);
};

// Helper function to render text with bold formatting (supports HTML <strong> and markdown **)
const renderBoldText = (text, textStyle) => {
  if (!text) return null;
  
  // Check if text has HTML <strong> or <b> tags
  const hasHtmlBold = text.includes('<strong>') || text.includes('</strong>') || text.includes('<b>') || text.includes('</b>');
  
  if (hasHtmlBold) {
    // Parse HTML bold tags and render with nested Text components
    // Use a more careful approach to preserve all spaces
    const parts = [];
    let lastIndex = 0;
    const regex = /(<strong>.*?<\/strong>|<b>.*?<\/b>)/gi;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before the match (including ALL characters, even if just spaces)
      if (match.index > lastIndex) {
        const beforeText = text.substring(lastIndex, match.index);
        // Always add, even if it's just spaces
        parts.push({ type: 'text', content: beforeText });
      }
      // Add the matched bold tag
      parts.push({ type: 'bold', content: match[0] });
      lastIndex = regex.lastIndex;
    }
    // Add remaining text after last match (including spaces)
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex);
      parts.push({ type: 'text', content: afterText });
    }
    
    // If no matches found, return original text
    if (parts.length === 0) {
      return <Text style={textStyle}>{stripHtml(text)}</Text>;
    }
    
    return (
      <Text style={textStyle}>
        {parts.map((part, index) => {
          if (part.type === 'bold') {
            if (part.content.match(/<strong>(.*?)<\/strong>/i)) {
              const boldText = part.content.replace(/<strong>(.*?)<\/strong>/i, '$1');
              return <Text key={index} style={[textStyle, { fontWeight: '700' }]}>{boldText}</Text>;
            } else if (part.content.match(/<b>(.*?)<\/b>/i)) {
              const boldText = part.content.replace(/<b>(.*?)<\/b>/i, '$1');
              return <Text key={index} style={[textStyle, { fontWeight: '700' }]}>{boldText}</Text>;
            }
          } else if (part.type === 'text') {
            // Preserve all text including spaces - only strip HTML tags, keep spaces
            const cleaned = stripHtmlPreserveSpaces(part.content);
            // Always render, even if it's just spaces (React Native will preserve them)
            return <Text key={index} style={textStyle}>{cleaned}</Text>;
          }
          return null;
        })}
      </Text>
    );
  }
  
  // Check if text has markdown bold markers
  const hasBold = text.includes('**') || text.includes('*');
  
  if (!hasBold) {
    return <Text style={textStyle}>{stripHtml(text)}</Text>;
  }
  
  // Split text by bold markers and render with nested Text components
  // Use manual parsing to preserve spaces
  const parts = [];
  let lastIndex = 0;
  const markdownRegex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let match;
  
  while ((match = markdownRegex.exec(text)) !== null) {
    // Add text before the match (including ALL characters, even if just spaces)
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      // Always add, even if it's just spaces
      parts.push({ type: 'text', content: beforeText });
    }
    // Add the matched bold marker
    parts.push({ type: 'bold', content: match[0] });
    lastIndex = markdownRegex.lastIndex;
  }
  // Add remaining text after last match (including spaces)
  if (lastIndex < text.length) {
    const afterText = text.substring(lastIndex);
    parts.push({ type: 'text', content: afterText });
  }
  
  // If no matches found, return original text
  if (parts.length === 0) {
    return <Text style={textStyle}>{stripHtml(text)}</Text>;
  }
  
  return (
    <Text style={textStyle}>
      {parts.map((part, index) => {
        if (part.type === 'bold') {
          if (part.content.startsWith('**') && part.content.endsWith('**')) {
            const boldText = part.content.slice(2, -2);
            return <Text key={index} style={[textStyle, { fontWeight: '700' }]}>{boldText}</Text>;
          } else if (part.content.startsWith('*') && part.content.endsWith('*') && !part.content.startsWith('**')) {
            const boldText = part.content.slice(1, -1);
            return <Text key={index} style={[textStyle, { fontWeight: '700' }]}>{boldText}</Text>;
          }
        } else if (part.type === 'text') {
          // Preserve all text including spaces - only strip HTML tags, keep spaces
          const cleaned = stripHtml(part.content);
          // Always render, even if it's just spaces (React Native will preserve them)
          return <Text key={index} style={textStyle}>{cleaned}</Text>;
        }
        return null;
      })}
    </Text>
  );
};

const ArticleDetailScreen = ({ route }) => {
  // Use Expo Router navigation
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Get params from route or useLocalSearchParams for Expo Router
  const { slug, post: initialPost, language: articleLanguage } = route?.params || {};
  const [post, setPost] = useState(initialPost || null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(!initialPost);
  const [webViewHeight, setWebViewHeight] = useState(500);
  const [synopsisHeight, setSynopsisHeight] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9);
  const [webViewReady, setWebViewReady] = useState({ synopsis: false, content: false, youtube: false });
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('english');
  // Track which ads have loaded successfully
  const [adsLoaded, setAdsLoaded] = useState({
    afterImage: false,
    afterSynopsis: false,
    afterKeyTakeaways: false,
    afterContent: false,
    afterPointOfView: false,
    afterFAQs: false,
    inline: false,
    sticky: false,
  });
  
  // All refs
  const isNavigatingRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Extract YouTube video ID helper function (defined early to avoid hook ordering issues)
  const getYouTubeVideoId = React.useCallback((url) => {
    if (!url || !url.includes('youtube.com')) return null;
    if (url.includes('v=')) {
      return url.split('v=')[1].split('&')[0];
    }
    return url.split('/').pop();
  }, []);
  
  // Compute youtubeVideoId early (before useEffect hooks that use it)
  const liveMedia = post?.liveMedia || post?.live_media || null;
  const youtubeVideoId = React.useMemo(() => {
    return getYouTubeVideoId(liveMedia);
  }, [liveMedia, getYouTubeVideoId]);
  
  // Log route params for debugging deep links
  useEffect(() => {
    console.log('ArticleDetailScreen - Route params:', route?.params);
    console.log('ArticleDetailScreen - Slug:', slug);
    console.log('ArticleDetailScreen - Router available:', !!router);
  }, [route?.params, slug, router]);

  // Load current language on mount
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
      setCurrentLanguage(prev => {
        if (prev !== language) {
          return language || 'english';
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reset all states when slug changes (new article) or reloadKey changes (force reload)
    const reloadKey = route.params?.reloadKey;
    setWebViewReady({ synopsis: false, content: false, youtube: false });
    setWebViewHeight(500);
    setSynopsisHeight(100);
    setRelatedPosts([]);
    isNavigatingRef.current = false; // Reset navigation flag
    // Reset ad loaded states for new article
    setAdsLoaded({
      afterImage: false,
      afterSynopsis: false,
      afterKeyTakeaways: false,
      afterContent: false,
      afterPointOfView: false,
      afterFAQs: false,
      inline: false,
      sticky: false,
    });
    
    // Stop TTS if playing when navigating to new article
    Tts.stop();
    setIsTTSPlaying(false);
    
    // Ensure we have a slug before trying to load
    if (!slug) {
      console.warn('ArticleDetailScreen: No slug provided in route params');
      return;
    }
    
    // If reloadKey is present, force reload even if we have initialPost
    if (reloadKey || !initialPost) {
      console.log('[ArticleDetailScreen] Reloading post, reloadKey:', reloadKey);
      loadPost();
    } else {
      loadRelatedPosts();
    }
  }, [slug, initialPost, route.params?.reloadKey]);
  
  // Track if component is mounted to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Cleanup WebViews and TTS when component unmounts
  useEffect(() => {
    return () => {
      // Reset states on unmount to prevent memory leaks
      if (isMountedRef.current) {
        setWebViewReady({ synopsis: false, content: false, youtube: false });
        setWebViewHeight(500);
        setSynopsisHeight(100);
      }
      // Stop TTS if playing
      try {
        if (isTTSPlaying) {
          Tts.stop();
          if (isMountedRef.current) {
            setIsTTSPlaying(false);
          }
        }
      } catch (error) {
        // Ignore errors during cleanup
        console.log('[ArticleDetail] Error during TTS cleanup:', error);
      }
    };
  }, [isTTSPlaying]);
  
  // Render WebViews sequentially to prevent native crash
  useEffect(() => {
    if (post && youtubeVideoId && !webViewReady.youtube) {
      // Delay YouTube WebView rendering
      const timer = setTimeout(() => {
        setWebViewReady(prev => ({ ...prev, youtube: true }));
      }, 100);
      return () => clearTimeout(timer);
    }
    // Always return a cleanup function (even if it's a no-op) to maintain hook consistency
    return () => {};
  }, [post, youtubeVideoId, webViewReady.youtube]);
  
  useEffect(() => {
    if (post && synopsis && !webViewReady.synopsis) {
      // Delay Synopsis WebView rendering (after YouTube if present)
      const delay = youtubeVideoId ? 500 : 100;
      const timer = setTimeout(() => {
        setWebViewReady(prev => ({ ...prev, synopsis: true }));
      }, delay);
      return () => clearTimeout(timer);
    }
    // Always return a cleanup function (even if it's a no-op) to maintain hook consistency
    return () => {};
  }, [post, synopsis, webViewReady.synopsis, youtubeVideoId]);
  
  // Reset webViewReady when post ID changes (new article loaded)
  useEffect(() => {
    if (post?.id) {
      console.log('ArticleDetailScreen: Post loaded, resetting WebView ready states. Post ID:', post.id);
      const postContent = post.contentUnique || post.content || post.body || '';
      console.log('ArticleDetailScreen: Post content length:', postContent.length);
      setWebViewReady({ synopsis: false, content: false, youtube: false });
    }
  }, [post?.id]);

  useEffect(() => {
    if (!post) {
      // Always return a cleanup function to maintain hook consistency
      return () => {};
    }
    
    // Compute content directly from post object instead of using computed variable
    const postContent = post.contentUnique || post.content || post.body || '';
    const postSynopsis = post.synopsisUnique || post.synopsis || '';
    const postYoutubeId = post.youtubeVideoId || post.youtube_video_id || '';
    
    if (postContent && !webViewReady.content) {
      console.log('ArticleDetailScreen: Setting content WebView ready, delay calculation:', {
        hasSynopsis: !!postSynopsis,
        hasYoutube: !!postYoutubeId,
        delay: postSynopsis ? 1000 : (postYoutubeId ? 500 : 100)
      });
      // Delay Content WebView rendering (after Synopsis)
      const delay = postSynopsis ? 1000 : (postYoutubeId ? 500 : 100);
      const timer = setTimeout(() => {
        console.log('ArticleDetailScreen: Content WebView ready, setting state');
        setWebViewReady(prev => ({ ...prev, content: true }));
      }, delay);
      return () => clearTimeout(timer);
    } else if (post && !postContent) {
      // If post is loaded but content is empty, mark as ready anyway to avoid infinite loading
      console.log('ArticleDetailScreen: Post loaded but no content, marking WebView as ready');
      setWebViewReady(prev => ({ ...prev, content: true }));
      return () => {};
    }
    
    // Always return a cleanup function to maintain hook consistency
    return () => {};
  }, [post, webViewReady.content]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [post]);

  const checkBookmarkStatus = async () => {
    if (!post) return;
    const postSlug = post.shortSlug || post.slugUnique || post.slug;
    if (postSlug) {
      const bookmarked = await storage.isBookmarked(postSlug);
      setIsBookmarked(bookmarked);
    }
  };

  // Define handleBack BEFORE any early returns to ensure hooks are always called in the same order
  const handleBack = React.useCallback(() => {
    try {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('[ArticleDetail] Component unmounted, skipping back navigation');
        return true; // Return true to prevent default back behavior
      }
      
      if (!router) {
        console.error('[ArticleDetail] Router not available');
        return true; // Return true to prevent default back behavior
      }
      
      // Always navigate to home tab - this is more reliable than router.back()
      console.log('[ArticleDetail] Navigating to home tab');
      if (typeof router.replace === 'function') {
        router.replace('/(tabs)');
      } else if (typeof router.push === 'function') {
        router.push('/(tabs)');
      } else {
        console.error('[ArticleDetail] No navigation method available');
        return true; // Return true to prevent default back behavior
      }
      return true; // Return true to prevent default back behavior
    } catch (error) {
      console.error('[ArticleDetail] Error in handleBack:', error);
      // Final fallback: try to navigate to home
      try {
        if (router) {
          if (typeof router.replace === 'function') {
            router.replace('/(tabs)');
          } else if (typeof router.push === 'function') {
            router.push('/(tabs)');
          }
        }
      } catch (fallbackError) {
        console.error('[ArticleDetail] Fallback navigation also failed:', fallbackError);
      }
      return true; // Return true to prevent default back behavior
    }
  }, [router]);

  // Handle hardware back button on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        console.log('[ArticleDetail] Hardware back button pressed');
        handleBack();
        return true; // Prevent default back behavior
      });

      return () => {
        backHandler.remove();
      };
    }
    return () => {}; // Always return a cleanup function
  }, [handleBack]);

  const loadPost = async () => {
    if (!slug) {
      console.error('loadPost: No slug provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Clean slug - remove query parameters, URL decode, trim
      const cleanSlug = slug.split('?')[0].split('#')[0].trim();
      
      // 🐛 DEBUG - Log slug processing
      console.log('\n🔍 [ArticleDetail DEBUG] loadPost');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 Raw slug from params:', slug);
      console.log('🧹 Cleaned slug:', cleanSlug);
      console.log('🌍 Article language:', articleLanguage || 'default');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      const result = await apiService.fetchPostBySlug(cleanSlug, articleLanguage);
      
      if (result.success && result.post) {
        console.log('loadPost: Post loaded successfully');
        setPost(result.post);
        setRelatedPosts(result.relatedPosts || []);
      } else {
        // Handle error - show error message
        console.error('loadPost: Post not found for slug:', cleanSlug);
        console.error('loadPost: API result:', result);
        // Set post to null to show error state
        setPost(null);
      }
    } catch (error) {
      console.error('loadPost: Error loading post:', error);
      console.error('loadPost: Error stack:', error.stack);
      // Set post to null to show error state
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedPosts = async () => {
    try {
      if (initialPost?.category) {
        const result = await apiService.fetchPostsByCategory(
          initialPost.category.toLowerCase(),
          4,
          0
        );
        if (result.success) {
          const filtered = result.data.filter(
            item => (item.shortSlug || item.slugUnique || item.slug) !== slug
          );
          // Limit to 3 related posts to reduce memory pressure
          setRelatedPosts(filtered.slice(0, 3));
        }
      }
    } catch (error) {
      console.error('Error loading related posts:', error);
      // Log to crash logger if available
      if (global.crashLogger) {
        global.crashLogger.logError('Error loading related posts', error.stack || error.message);
      }
    }
  };

  const handleRelatedPostPress = (relatedPost) => {
    // Prevent multiple simultaneous navigations
    if (isNavigatingRef.current) {
      console.log('Navigation already in progress, ignoring tap');
      return;
    }
    
    try {
      const relatedSlug = relatedPost.shortSlug || relatedPost.slugUnique || relatedPost.slug;
      if (!relatedSlug) {
        console.error('No slug found for related post:', relatedPost);
        return;
      }
      
      // Mark navigation as in progress
      isNavigatingRef.current = true;
      
      // Use Expo Router
      const category = (relatedPost.category || 'news').toLowerCase();
      if (router && typeof router.push === 'function') {
        console.log('[ArticleDetail] Navigating to related article via Expo Router');
        try {
          router.push({
            pathname: '/article/[category]/[slug]',
            params: { category, slug: relatedSlug, post: JSON.stringify(relatedPost) },
          });
        } catch (error) {
          console.error('[ArticleDetail] Error navigating to related article:', error);
          // Fallback: try with string interpolation
          try {
            router.push(`/article/${category}/${relatedSlug}`);
          } catch (fallbackError) {
            console.error('[ArticleDetail] Fallback navigation also failed:', fallbackError);
            isNavigatingRef.current = false;
            return;
          }
        }
      } else {
        console.error('[ArticleDetail] Router not available for related post');
        isNavigatingRef.current = false;
        return;
      }
      
      // Reset navigation flag after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
    } catch (error) {
      console.error('Error navigating to related post:', error);
      isNavigatingRef.current = false;
      // Log to crash logger if available
      if (global.crashLogger) {
        global.crashLogger.logError('Error navigating to related post', error.stack || error.message);
      }
    }
  };

  const handleBookmark = async () => {
    if (!post) return;
    try {
      const postSlug = post.shortSlug || post.slugUnique || post.slug;
      if (!postSlug) return;

      if (isBookmarked) {
        await storage.removeBookmark(postSlug);
        setIsBookmarked(false);
      } else {
        await storage.addBookmark(post);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleShare = async () => {
    try {
      if (!post) return;
      
      const slug = post.shortSlug || post.slugUnique || post.slug;
      const category = (post.category || 'news').toLowerCase();
      
      // Get domain based on current language
      const languageConfig = LANGUAGES[currentLanguage] || LANGUAGES.english;
      const domain = languageConfig.domain;
      
      const url = slug 
        ? `${domain}/${category}/${slug}`
        : domain;
      
      const title = post.titleUnique || post.title || post.headline || 'Check out this article';
      const message = `${title}\n\n${url}`;

      const shareOptions = Platform.select({
        ios: {
          message: message,
          url: url,
        },
        android: {
          message: message,
          title: title,
          subject: title,
        },
        default: {
          message: message,
          url: url,
          title: title,
        },
      });

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          console.log('Shared with', result.activityType);
        } else {
          // Shared
          console.log('Article shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // User dismissed the share dialog
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing article:', error);
      // Show user-friendly error message
      if (error.message && !error.message.includes('User did not share')) {
        alert('Unable to share article. Please try again.');
      }
    }
  };

  // Extract clean text from HTML content for TTS
  const getTextForTTS = () => {
    if (!post) return '';
    
    const title = post.titleUnique || post.title || post.headline || '';
    const synopsis = post.synopsis || '';
    const content = post.contentUnique || post.content || post.body || '';
    
    // Combine title, synopsis, and content
    let fullText = '';
    
    if (title) {
      fullText += title + '. ';
    }
    
    if (synopsis) {
      // Strip HTML from synopsis
      const cleanSynopsis = stripHtml(synopsis);
      fullText += cleanSynopsis + '. ';
    }
    
    if (content) {
      // Strip HTML from content
      const cleanContent = stripHtml(content);
      // Remove common unwanted patterns
      const cleaned = cleanContent
        .replace(/(--|-|—)\s*IANS/g, '')
        .replace(/na\//g, '')
        .replace(/pk\//g, '')
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .trim();
      fullText += cleaned;
    }
    
    return fullText.trim();
  };

  // Setup TTS event listeners (only once on mount)
  useEffect(() => {
    // Check if Tts is available before using it
    if (!Tts) {
      console.warn('[ArticleDetail] TTS module not available');
      return;
    }

    const onTtsFinish = () => {
      if (isMountedRef.current) {
        setIsTTSPlaying(false);
      }
    };
    
    const onTtsStart = () => {
      if (isMountedRef.current) {
        setIsTTSPlaying(true);
      }
    };
    
    const onTtsError = (error) => {
      console.error('TTS Error:', error);
      if (isMountedRef.current) {
        setIsTTSPlaying(false);
      }
      // Don't show alert during cleanup/unmount
      if (isMountedRef.current) {
        alert('Unable to read article. Please try again.');
      }
    };

    // Only add listeners if Tts.addEventListener exists
    if (Tts.addEventListener && typeof Tts.addEventListener === 'function') {
      try {
        Tts.addEventListener('tts-finish', onTtsFinish);
        Tts.addEventListener('tts-start', onTtsStart);
        Tts.addEventListener('tts-cancel', onTtsFinish);
        Tts.addEventListener('tts-error', onTtsError);
      } catch (error) {
        console.error('[ArticleDetail] Error adding TTS event listeners:', error);
      }
    } else {
      console.warn('[ArticleDetail] TTS addEventListener not available');
    }

    // Set default TTS settings (rate and pitch)
    try {
      if (Tts.setDefaultRate && typeof Tts.setDefaultRate === 'function') {
        Tts.setDefaultRate(0.45);
      }
      if (Tts.setDefaultPitch && typeof Tts.setDefaultPitch === 'function') {
        Tts.setDefaultPitch(1.0);
      }
    } catch (error) {
      console.error('Error setting TTS defaults:', error);
    }

    return () => {
      // Safely remove event listeners if the method exists
      // Only cleanup if component is still mounted or during unmount
      try {
        // Stop TTS first to prevent any ongoing operations
        if (Tts.stop && typeof Tts.stop === 'function') {
          try {
            Tts.stop();
          } catch (stopError) {
            // Ignore stop errors during cleanup
            console.log('[ArticleDetail] Error stopping TTS during cleanup (non-fatal):', stopError);
          }
        }

        // Then remove listeners if available
        if (Tts.removeEventListener && typeof Tts.removeEventListener === 'function') {
          try {
            Tts.removeEventListener('tts-finish', onTtsFinish);
            Tts.removeEventListener('tts-start', onTtsStart);
            Tts.removeEventListener('tts-cancel', onTtsFinish);
            Tts.removeEventListener('tts-error', onTtsError);
          } catch (removeError) {
            // Ignore remove listener errors - they're not critical
            console.log('[ArticleDetail] Error removing TTS event listeners (non-fatal):', removeError);
          }
        }
      } catch (error) {
        // Catch any unexpected errors during cleanup
        console.log('[ArticleDetail] Unexpected error during TTS cleanup (non-fatal):', error);
      }
    };
  }, []);

  // Update TTS language when currentLanguage changes
  useEffect(() => {
    if (!currentLanguage) return; // Wait for language to be loaded
    
    try {
      // Set TTS language based on current language selection
      // Use 'hi' for Hindi and 'en-IN' for English (Indian English voice to match Hindi voice)
      const ttsLanguage = currentLanguage === 'hindi' ? 'hi' : 'en-IN';
      Tts.setDefaultLanguage(ttsLanguage);
    } catch (langError) {
      console.warn('TTS language not supported, using fallback:', langError);
      // Fallback to en-US if Indian English is not available
      try {
        const fallbackLanguage = currentLanguage === 'hindi' ? 'hi' : 'en-US';
        Tts.setDefaultLanguage(fallbackLanguage);
      } catch (fallbackError) {
        console.error('Error setting fallback TTS language:', fallbackError);
      }
    }
  }, [currentLanguage]);

  const handleTTS = () => {
    if (isTTSPlaying) {
      // Stop TTS
      Tts.stop();
      setIsTTSPlaying(false);
    } else {
      // Start TTS
      const textToSpeak = getTextForTTS();
      
      if (!textToSpeak || textToSpeak.length === 0) {
        alert('No content available to read.');
        return;
      }
      
      try {
        // Language is already set in useEffect, just speak
        Tts.speak(textToSpeak);
      } catch (error) {
        console.error('Error starting TTS:', error);
        alert('Unable to read article. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Article"
          onBack={handleBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post && !loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header
          title="Article Not Found"
          onBack={handleBack}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.errorText}>Article not found</Text>
          <Text style={styles.errorSubtext}>
            {slug ? `Unable to load article: ${slug}` : 'No article specified'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              if (slug) {
                loadPost();
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Extract post data
  const imageUrl = getImageUrl(post.banner || post.featuredImage || post.featured_image);
  const title = post.titleUnique || post.title || post.headline || '';
  const content = post.contentUnique || post.content || post.body || '';
  const synopsis = post.synopsis || null;
  const keyTakeaways = post.keyTakeaways || post.key_takeaways || null;
  const pointOfView = post.pointOfView || post.point_of_view || null;
  const faqs = post.faqs || null;
  const metaKeywords = post.metaKeywords || post.meta_keywords || null;
  // liveMedia is already computed earlier in the component
  const author = post.author || 'NationPress';
  const storyAt = post.storyAt || post.story_at || post.publishedAt || null;
  const updatedAt = post.updatedAt || post.updated_at || null;
  const publishedDate = storyAt ? formatIndianDate(storyAt) : 'Recent';
  const updatedDate = updatedAt && updatedAt !== storyAt 
    ? formatIndianDate(updatedAt) 
    : null;
  const category = post.category || 'News';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={category}
        onBack={handleBack}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        overScrollMode="never"
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{category}</Text>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          
          {/* Author and Date Info with Bookmark and Share */}
          <View style={styles.metaInfo}>
            <View style={styles.metaLeft}>
              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>By {author}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                <Text style={styles.metaText}>{publishedDate}</Text>
              </View>
            </View>
            <View style={styles.metaRight}>
              <TouchableOpacity
                style={styles.metaActionButton}
                onPress={handleBookmark}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                  size={20} 
                  color={isBookmarked ? COLORS.primary : COLORS.textLight} 
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.metaActionButton}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="share-outline" 
                  size={20} 
                  color={COLORS.textLight} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* YouTube Video or Featured Image */}
        {youtubeVideoId ? (
          webViewReady.youtube ? (
            <View style={styles.videoContainer}>
              <WebView
              key={`youtube-${youtubeVideoId}`}
              source={{ html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                      body {
                        margin: 0;
                        padding: 0;
                        background: #000;
                      }
                      iframe {
                        width: 100%;
                        height: 100%;
                      }
                    </style>
                  </head>
                  <body>
                    <iframe
                      src="https://www.youtube.com/embed/${youtubeVideoId}?rel=0&modestbranding=1"
                      frameborder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowfullscreen
                    ></iframe>
                  </body>
                </html>
              ` }}
              style={styles.youtubeWebView}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={false}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('YouTube WebView error:', nativeEvent);
                // Log to crash logger if available
                if (global.crashLogger) {
                  global.crashLogger.logError('YouTube WebView error', JSON.stringify(nativeEvent));
                }
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('YouTube WebView HTTP error:', nativeEvent);
              }}
              onRenderProcessGone={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('YouTube WebView render process crashed:', nativeEvent);
                if (global.crashLogger) {
                  global.crashLogger.logError('YouTube WebView render process crashed', JSON.stringify(nativeEvent));
                }
              }}
            />
            </View>
          ) : (
            <View style={styles.videoContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          )
        ) : imageUrl ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { aspectRatio: imageAspectRatio }]}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onLoad={(event) => {
                const { width: imgWidth, height: imgHeight } = event.source;
                if (imgWidth && imgHeight) {
                  const calculatedAspectRatio = imgWidth / imgHeight;
                  // Set aspect ratio between 0.75 (portrait) and 2.5 (landscape)
                  const clampedRatio = Math.max(0.75, Math.min(2.5, calculatedAspectRatio));
                  setImageAspectRatio(clampedRatio);
                }
              }}
            />
          </View>
        ) : null}

        {/* Ad After Image */}
        {AD_CONFIG.storiesBanner && imageUrl && (
          <View style={adsLoaded.afterImage ? styles.contentAdContainer : { height: 0, overflow: 'hidden' }}>
            <BannerAd
              unitId={getAdUnitId('banner', 'home')}
              size={BannerAdSize.BANNER}
              requestOptions={{
                requestNonPersonalizedAdsOnly: false,
              }}
              onAdLoaded={() => {
                console.log('[ArticleDetail] Ad after image loaded');
                setAdsLoaded(prev => ({ ...prev, afterImage: true }));
              }}
              onAdFailedToLoad={(error) => {
                console.log('[ArticleDetail] Ad after image failed:', error);
                setAdsLoaded(prev => ({ ...prev, afterImage: false }));
              }}
            />
          </View>
        )}

        <View style={styles.content}>
          {/* Synopsis Section */}
          {synopsis && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {ARTICLE_SECTIONS[currentLanguage]?.synopsis || ARTICLE_SECTIONS.english.synopsis}
              </Text>
              <View style={styles.synopsisContainer}>
                {synopsis.includes('<') ? (
                  webViewReady.synopsis ? (
                    <WebView
                    key={`synopsis-${post?.id || 'unknown'}`}
                    originWhitelist={['*']}
                    source={{ html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <style>
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                              font-size: 15px;
                              line-height: 1.6;
                              color: #333;
                              margin: 0;
                              padding: 0;
                            }
                            b, strong {
                              font-weight: 700;
                              color: #333;
                            }
                          </style>
                        </head>
                        <body>${(synopsis || '').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<b>$1</b>')}</body>
                      </html>
                    ` }}
                  style={[styles.webView, { height: Math.max(100, synopsisHeight) }]}
                  scrollEnabled={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={false}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('Synopsis WebView error:', nativeEvent);
                    if (global.crashLogger) {
                      global.crashLogger.logError('Synopsis WebView error', JSON.stringify(nativeEvent));
                    }
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('Synopsis WebView HTTP error:', nativeEvent);
                  }}
                  onRenderProcessGone={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('Synopsis WebView render process crashed:', nativeEvent);
                    if (global.crashLogger) {
                      global.crashLogger.logError('Synopsis WebView render process crashed', JSON.stringify(nativeEvent));
                    }
                  }}
                  onMessage={(event) => {
                    try {
                      const height = parseInt(event.nativeEvent.data);
                      if (height > 0 && !isNaN(height)) setSynopsisHeight(height + 20);
                    } catch (error) {
                      console.error('Error parsing synopsis height:', error);
                    }
                  }}
                  injectedJavaScript={`
                    setTimeout(() => {
                      try {
                        window.ReactNativeWebView.postMessage(document.body.scrollHeight);
                      } catch(e) {
                        window.ReactNativeWebView.postMessage('0');
                      }
                    }, 100);
                    true;
                  `}
                  />
                  ) : (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                  )
                ) : (
                  <Text style={styles.synopsisText}>{stripHtml(synopsis)}</Text>
                )}
              </View>
            </View>
          )}

          {/* Ad After Synopsis */}
          {AD_CONFIG.storiesBanner && synopsis && (
            <View style={adsLoaded.afterSynopsis ? styles.contentAdContainer : { height: 0, overflow: 'hidden' }}>
              <BannerAd
                unitId={getAdUnitId('banner', 'stories')}
                size={BannerAdSize.BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                  console.log('[ArticleDetail] Ad after synopsis loaded');
                  setAdsLoaded(prev => ({ ...prev, afterSynopsis: true }));
                }}
                onAdFailedToLoad={(error) => {
                  console.log('[ArticleDetail] Ad after synopsis failed:', error);
                  setAdsLoaded(prev => ({ ...prev, afterSynopsis: false }));
                }}
              />
            </View>
          )}

          {/* Key Takeaways Section */}
          {keyTakeaways && (Array.isArray(keyTakeaways) ? keyTakeaways.length > 0 : (typeof keyTakeaways === 'string' && keyTakeaways.trim())) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {ARTICLE_SECTIONS[currentLanguage]?.keyTakeaways || ARTICLE_SECTIONS.english.keyTakeaways}
              </Text>
              <View style={styles.takeawaysContainer}>
                {(() => {
                  // Check if keyTakeaways is a string with HTML <ul><li> structure
                  const isHtmlList = typeof keyTakeaways === 'string' && keyTakeaways.includes('<ul>') && keyTakeaways.includes('<li>');
                  
                  // Parse HTML list if needed
                  let items = [];
                  if (isHtmlList) {
                    items = parseHtmlList(keyTakeaways);
                  } else if (Array.isArray(keyTakeaways)) {
                    items = keyTakeaways.map(item => typeof item === 'string' ? item : (item?.text || item?.trim() || ''));
                  } else if (typeof keyTakeaways === 'string') {
                    // Split by newlines for plain text
                    items = keyTakeaways.split('\n').filter(line => line.trim());
                  }
                  
                  return items.map((item, index) => {
                    if (!item || !item.trim()) return null;
                    
                    let text = item.trim();
                    
                    // Remove any existing bullets/list markers from the text (only if not from HTML parsing)
                    if (!isHtmlList) {
                      text = text
                        .replace(/^[•\-\*]\s*/, '') // Remove bullet points
                        .replace(/^\d+[\.\)]\s*/, '') // Remove numbered lists (1. or 1))
                        .replace(/^<li>|<\/li>$/g, '') // Remove HTML list tags
                        .trim();
                    }
                    
                    // Check if text contains HTML (other than just <strong> or <b>)
                    const hasComplexHtml = text.includes('<') && !text.match(/^[^<]*(<(strong|b)>.*?<\/(strong|b)>[^<]*)*$/);
                    
                    return (
                      <View key={index} style={styles.takeawayItem}>
                        <View style={styles.takeawayBullet} />
                        {hasComplexHtml ? (
                          <View style={styles.takeawayContent}>
                            <WebView
                              key={`takeaway-${index}`}
                              originWhitelist={['*']}
                              source={{ html: `
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <style>
                                      body {
                                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                        font-size: 15px;
                                        line-height: 1.6;
                                        color: #333;
                                        margin: 0;
                                        padding: 0;
                                      }
                                      b, strong {
                                        font-weight: 700;
                                      }
                                    </style>
                                  </head>
                                  <body>${text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\*(.*?)\*/g, '<b>$1</b>')}</body>
                                </html>
                              ` }}
                              style={styles.takeawayWebView}
                              scrollEnabled={false}
                              javaScriptEnabled={true}
                              domStorageEnabled={false}
                            />
                          </View>
                        ) : (
                          <View style={styles.takeawayContent}>
                            {renderBoldText(text, styles.takeawayText)}
                          </View>
                        )}
                      </View>
                    );
                  });
                })()}
              </View>
            </View>
          )}

          {/* Ad After Key Takeaways */}
          {AD_CONFIG.storiesBanner && keyTakeaways && (
            <View style={adsLoaded.afterKeyTakeaways ? styles.contentAdContainer : { height: 0, overflow: 'hidden' }}>
              <BannerAd
                unitId={getAdUnitId('banner', 'home')}
                size={BannerAdSize.LARGE_BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                  console.log('[ArticleDetail] Ad after key takeaways loaded');
                  setAdsLoaded(prev => ({ ...prev, afterKeyTakeaways: true }));
                }}
                onAdFailedToLoad={(error) => {
                  console.log('[ArticleDetail] Ad after key takeaways failed:', error);
                  setAdsLoaded(prev => ({ ...prev, afterKeyTakeaways: false }));
                }}
              />
            </View>
          )}

          {/* Main Article Content */}
          {content && (
            <View style={styles.section}>
              {content.includes('<') ? (
                webViewReady.content ? (
                  <WebView
                  key={`content-${post?.id || slug || 'unknown'}`}
                  originWhitelist={['*']}
                  source={{ html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 16px;
                            line-height: 1.6;
                            color: #333;
                            padding: 0;
                            margin: 0;
                          }
                          img {
                            max-width: 100%;
                            height: auto;
                            border-radius: 8px;
                          }
                          p {
                            margin-bottom: 16px;
                          }
                          h1, h2, h3, h4, h5, h6 {
                            margin-top: 20px;
                            margin-bottom: 10px;
                          }
                          b, strong {
                            font-weight: 700;
                            color: #333;
                          }
                          ul, ol {
                            margin: 16px 0;
                            padding-left: 24px;
                          }
                          li {
                            margin-bottom: 8px;
                          }
                        </style>
                      </head>
                      <body>${(content || '')
                        .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                        .replace(/\*(.*?)\*/g, '<b>$1</b>')
                        .replace(/<b><b>(.*?)<\/b><\/b>/g, '<b>$1</b>')
                        .replace(/(--|-|—)\s*IANS/g, '')
                        .replace(/na\//g, '')
                        .replace(/pk\//g, '')}</body>
                    </html>
                  ` }}
                  style={[styles.webView, { height: Math.max(500, webViewHeight) }]}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={false}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('Content WebView error:', nativeEvent);
                    if (global.crashLogger) {
                      global.crashLogger.logError('Content WebView error', JSON.stringify(nativeEvent));
                    }
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('Content WebView HTTP error:', nativeEvent);
                  }}
                  onRenderProcessGone={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('Content WebView render process crashed:', nativeEvent);
                    if (global.crashLogger) {
                      global.crashLogger.logError('Content WebView render process crashed', JSON.stringify(nativeEvent));
                    }
                  }}
                  onMessage={(event) => {
                    try {
                      const height = parseInt(event.nativeEvent.data);
                      if (height > 0 && !isNaN(height)) setWebViewHeight(height + 30);
                    } catch (error) {
                      console.error('Error parsing content height:', error);
                    }
                  }}
                  injectedJavaScript={`
                    setTimeout(() => {
                      try {
                        window.ReactNativeWebView.postMessage(document.body.scrollHeight);
                      } catch(e) {
                        window.ReactNativeWebView.postMessage('0');
                      }
                    }, 100);
                    true;
                  `}
                />
                ) : (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                )
              ) : (
                <Text style={styles.textContent}>
                  {content
                    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove ** for now (Text component doesn't support bold easily)
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/(--|-|—)\s*IANS/g, '')
                    .replace(/na\//g, '')
                    .replace(/pk\//g, '')}
                </Text>
              )}
            </View>
          )}

          {/* Spacing after content and before Point of View */}
          {pointOfView && <View style={{ height: SPACING.xl }} />}

          {/* Ad After Content */}
          {AD_CONFIG.storiesBanner && content && (
            <View style={adsLoaded.afterContent ? styles.contentAdContainer : { height: 0, overflow: 'hidden' }}>
              <BannerAd
                unitId={getAdUnitId('banner', 'stories')}
                size={BannerAdSize.MEDIUM_RECTANGLE}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                  console.log('[ArticleDetail] Ad after content loaded');
                  setAdsLoaded(prev => ({ ...prev, afterContent: true }));
                }}
                onAdFailedToLoad={(error) => {
                  console.log('[ArticleDetail] Ad after content failed:', error);
                  setAdsLoaded(prev => ({ ...prev, afterContent: false }));
                }}
              />
            </View>
          )}

     

          {/* Point of View Section */}
          {pointOfView && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Point of View</Text>
              <View style={styles.povContainer}>
                {renderBoldText(
                  pointOfView.split(',').slice(1).join(',').trim().charAt(0).toUpperCase() + 
                  pointOfView.split(',').slice(1).join(',').trim().slice(1),
                  styles.povText
                )}
                <View style={styles.stampContainer}>
                  <View style={styles.stampCircle}>
                    <Text style={styles.stampText}>NationPress</Text>
                    <Text style={styles.stampDate}>{formatIndianDate(new Date().toISOString())}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Ad After Point of View */}
          {AD_CONFIG.storiesBanner && pointOfView && (
            <View style={adsLoaded.afterPointOfView ? styles.contentAdContainer : { height: 0, overflow: 'hidden' }}>
              <BannerAd
                unitId={getAdUnitId('banner', 'home')}
                size={BannerAdSize.BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                  console.log('[ArticleDetail] Ad after point of view loaded');
                  setAdsLoaded(prev => ({ ...prev, afterPointOfView: true }));
                }}
                onAdFailedToLoad={(error) => {
                  console.log('[ArticleDetail] Ad after point of view failed:', error);
                  setAdsLoaded(prev => ({ ...prev, afterPointOfView: false }));
                }}
              />
            </View>
          )}

          {/* FAQs Section */}
          {faqs && Array.isArray(faqs) && faqs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {ARTICLE_SECTIONS[currentLanguage]?.frequentlyAskedQuestions || ARTICLE_SECTIONS.english.frequentlyAskedQuestions}
              </Text>
              <View style={styles.faqsContainer}>
                {faqs.map((faq, index) => (
                  <View key={index} style={styles.faqItem}>
                    <Text style={styles.faqQuestion}>
                      {typeof faq === 'object' ? faq.question : faq.split('?')[0] + '?'}
                    </Text>
                    <Text style={styles.faqAnswer}>
                      {typeof faq === 'object' ? stripHtml(faq.answer) : stripHtml(faq.split('?')[1] || '')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Ad After FAQs */}
          {AD_CONFIG.storiesBanner && faqs && Array.isArray(faqs) && faqs.length > 0 && (
            <View style={adsLoaded.afterFAQs ? styles.contentAdContainer : { height: 0, overflow: 'hidden' }}>
              <BannerAd
                unitId={getAdUnitId('banner', 'stories')}
                size={BannerAdSize.LARGE_BANNER}
                requestOptions={{
                  requestNonPersonalizedAdsOnly: false,
                }}
                onAdLoaded={() => {
                  console.log('[ArticleDetail] Ad after FAQs loaded');
                  setAdsLoaded(prev => ({ ...prev, afterFAQs: true }));
                }}
                onAdFailedToLoad={(error) => {
                  console.log('[ArticleDetail] Ad after FAQs failed:', error);
                  setAdsLoaded(prev => ({ ...prev, afterFAQs: false }));
                }}
              />
            </View>
          )}

          {/* Tags Section */}
          {metaKeywords && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>
                {ARTICLE_SECTIONS[currentLanguage]?.tags || ARTICLE_SECTIONS.english.tags}: 
              </Text>
              <View style={styles.tagsList}>
                {metaKeywords.split(',').map((tag, index) => {
                  const trimmedTag = tag.trim();
                  return trimmedTag ? (
                    <TouchableOpacity
                      key={index}
                      style={styles.tag}
                      onPress={() => {
                        try {
                          // Use Expo Router
                          if (router && typeof router.push === 'function') {
                            router.push({
                              pathname: '/search',
                              params: { query: trimmedTag },
                            });
                          } else {
                            console.error('[ArticleDetail] Router not available for tag search');
                          }
                        } catch (error) {
                          console.error('[ArticleDetail] Error navigating to search:', error);
                        }
                      }}
                    >
                      <Text style={styles.tagText}>{trimmedTag}</Text>
                    </TouchableOpacity>
                  ) : null;
                })}
              </View>
            </View>
          )}
        </View>

        {/* Inline Banner Ad before Related Articles */}
        {AD_CONFIG.storiesBanner && (
          <View style={adsLoaded.inline ? styles.inlineAdContainer : { height: 0, overflow: 'hidden' }}>
            <BannerAd
              unitId={getAdUnitId('banner', 'home')}
              size={BannerAdSize.MEDIUM_RECTANGLE}
              requestOptions={{
                requestNonPersonalizedAdsOnly: false,
              }}
              onAdLoaded={() => {
                console.log('[ArticleDetail] Inline banner ad loaded');
                setAdsLoaded(prev => ({ ...prev, inline: true }));
              }}
              onAdFailedToLoad={(error) => {
                console.log('[ArticleDetail] Inline banner ad failed to load:', error);
                setAdsLoaded(prev => ({ ...prev, inline: false }));
              }}
            />
          </View>
        )}

        {relatedPosts && relatedPosts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>
              {ARTICLE_SECTIONS[currentLanguage]?.relatedArticles || ARTICLE_SECTIONS.english.relatedArticles}
            </Text>
            <FlatList
              data={relatedPosts.slice(0, 3)}
              keyExtractor={(item, index) => `related-${item?.id || item?.shortSlug || item?.slugUnique || item?.slug || index}`}
              renderItem={({ item, index }) => {
                if (!item) return null;
                return (
                  <NewsCard
                    key={`related-${item.id || item.shortSlug || item.slugUnique || item.slug || index}`}
                    post={item}
                    onPress={() => handleRelatedPostPress(item)}
                    variant="horizontal"
                  />
                );
              }}
              scrollEnabled={false}
              nestedScrollEnabled={true}
              removeClippedSubviews={false}
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={1}
            />
          </View>
        )}
        
        {/* Extra padding at bottom to prevent crash when scrolling past related posts */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Floating TTS Button */}
      <TouchableOpacity
        style={[styles.floatingTTSButton, { bottom: 80 + insets.bottom }]}
        onPress={handleTTS}
        activeOpacity={0.8}
      >
        <Ionicons 
          name={isTTSPlaying ? "stop-circle" : "volume-high-outline"} 
          size={28} 
          color={COLORS.background} 
        />
      </TouchableOpacity>

      {/* Sticky Bottom Banner Ad */}
      {AD_CONFIG.storiesBanner && (
        <View style={adsLoaded.sticky ? [styles.stickyAdContainer, { bottom: insets.bottom }] : { height: 0, overflow: 'hidden' }}>
          <BannerAd
            unitId={getAdUnitId('banner', 'home')}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => {
              console.log('[ArticleDetail] Sticky bottom ad loaded');
              setAdsLoaded(prev => ({ ...prev, sticky: true }));
            }}
            onAdFailedToLoad={(error) => {
              console.log('[ArticleDetail] Sticky bottom ad failed:', error);
              setAdsLoaded(prev => ({ ...prev, sticky: false }));
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl * 2,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginTop: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  content: {
    padding: SPACING.md,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metaLeft: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: SPACING.sm,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  metaActionButton: {
    padding: SPACING.xs,
    borderRadius: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
    gap: 4,
  },
  metaText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    minHeight: height * 0.35,
    maxHeight: height * 0.85,
  },
  videoContainer: {
    width: '100%',
    height: 250,
    marginBottom: SPACING.md,
  },
  youtubeWebView: {
    width: '100%',
    height: '100%',
  },
  section: {
    marginBottom: SPACING.xl,
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: SPACING.xs,
  },
  synopsisContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
  },
  synopsisText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  takeawaysContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
  },
  takeawayItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  takeawayBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    marginTop: 6,
    marginRight: SPACING.sm,
    flexShrink: 0,
  },
  takeawayContent: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0, // Allow flex item to shrink below content size
  },
  takeawayText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  takeawayWebView: {
    width: '100%',
    minHeight: 30,
    maxHeight: 200,
  },
  povContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
    position: 'relative',
    minHeight: 120,
    paddingRight: 140,
  },
  povText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  stampContainer: {
    position: 'absolute',
    bottom: SPACING.md,
    right: SPACING.md,
  },
  stampCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-15deg' }],
  },
  stampText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stampDate: {
    fontSize: 10,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  faqsContainer: {
    gap: SPACING.md,
  },
  faqItem: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 8,
  },
  faqQuestion: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  faqAnswer: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  contentAdContainer: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    marginVertical: SPACING.md,
    borderRadius: 8,
  },
  inlineAdContainer: {
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginVertical: SPACING.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tagsLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginRight: SPACING.xs,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  tag: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  categoryBadgeText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  date: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  contentContainer: {
    marginTop: SPACING.md,
  },
  webView: {
    width: width - SPACING.md * 2,
    minHeight: 100,
  },
  textContent: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  relatedSection: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  relatedTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xl * 4, // Extra padding for floating button + sticky ad
    width: '100%',
  },
  stickyAdContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  floatingTTSButton: {
    position: 'absolute',
    bottom: 80, // Position above sticky ad (50px ad height + 30px padding) - will be adjusted by insets
    right: SPACING.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default ArticleDetailScreen;

