import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AdEventType, BannerAd, BannerAdSize, InterstitialAd } from 'react-native-google-mobile-ads';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import CategoryTab from '../components/CategoryTab';
import Header from '../components/Header';
import NewsCard from '../components/NewsCard';
import TagChips from '../components/TagChips';
import { AD_CONFIG, getAdUnitId } from '../config/adsConfig';
import { CATEGORIES, CATEGORY_SUBMENU_ITEMS, COLORS, FONT_SIZES, SPACING } from '../config/constants';
import { apiService } from '../services/api';
import { formatRelativeTime, getImageUrl } from '../utils/dateUtils';
import { storage } from '../utils/storage';

const logo = require('../../assets/images/logo.png');
const logoHindi = require('../../assets/images/logo-hindi.png');
const FALLBACK_IMAGE = require('../../assets/images/nation-press.webp');

const { width: initialWidth } = Dimensions.get('window');

const HomeScreen = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [screenWidth, setScreenWidth] = useState(initialWidth);
  // Breaking news state
  const [breakingNews, setBreakingNews] = useState([]);
  const [loadingBreakingNews, setLoadingBreakingNews] = useState(false);
  // Web stories state (for all supported categories)
  const [webStories, setWebStories] = useState({});
  const [loadingWebStories, setLoadingWebStories] = useState({});
  const [webStoryImageErrors, setWebStoryImageErrors] = useState(new Set());
  // Track which ads have loaded successfully
  const [adsLoaded, setAdsLoaded] = useState({});
  // TTS state for breaking news
  const [isBreakingNewsTTSPlaying, setIsBreakingNewsTTSPlaying] = useState(false);
  const [currentBreakingNewsIndex, setCurrentBreakingNewsIndex] = useState(0);
  // TTS state for category stories
  const [isCategoryTTSPlaying, setIsCategoryTTSPlaying] = useState(false);
  const [currentCategoryStoryIndex, setCurrentCategoryStoryIndex] = useState(0);
  const breakingNewsTTSQueueRef = useRef([]);
  const breakingNewsRef = useRef(breakingNews);
  const isTTSPlayingRef = useRef(false);
  const currentLanguageRef = useRef(currentLanguage);
  const postsRef = useRef(posts);
  const isCategoryTTSPlayingRef = useRef(false);
  const insets = useSafeAreaInsets();
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const logoTranslateY = React.useRef(new Animated.Value(0)).current;
  const logoHeight = React.useRef(new Animated.Value(70)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  
  // Interstitial ad ref
  const interstitialAdRef = useRef(null);
  
  // Calculate number of columns based on screen width
  const getNumColumns = () => {
    // For tablets/iPads (width >= 600), show 2-3 columns
    if (screenWidth >= 600) {
      // For very wide screens (> 900), show 3 columns
      if (screenWidth > 900) {
        return 3;
      }
      // For medium tablets, show 2 columns
      return 2;
    }
    
    // For phones, always show 1 column
    return 1;
  };

  const resetBreakingNewsTTSState = () => {
    isTTSPlayingRef.current = false;
    setIsBreakingNewsTTSPlaying(false);
    setCurrentBreakingNewsIndex(0);
  };

  const stopBreakingNewsTTS = React.useCallback(async () => {
    try {
      resetBreakingNewsTTSState();
      // Expo Speech stop() returns a Promise and works reliably on iOS
      await Speech.stop();
    } catch (error) {
      console.error('[HomeScreen] Error stopping breaking news TTS:', error);
    }
  }, []);

  // Helper function to strip HTML tags
  const stripHtml = (html) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  };

  // Helper to read next breaking news item (used in queue)
  const readNextBreakingNewsItem = React.useCallback((nextIndex) => {
    const currentBreakingNews = breakingNewsRef.current;
    if (nextIndex >= currentBreakingNews.length || !isTTSPlayingRef.current || isCategoryTTSPlayingRef.current) {
      resetBreakingNewsTTSState();
      return;
    }

    const item = currentBreakingNews[nextIndex];
    const title = item.title || item.headline || '';
    const synopsis = item.synopsis || item.short_description || '';
    
    let textToSpeak = '';
    
    if (title) {
      textToSpeak += `${title}. `;
    }
    
    if (synopsis) {
      const cleanSynopsis = stripHtml(synopsis);
      if (cleanSynopsis) {
        textToSpeak += `${cleanSynopsis}. `;
      }
    }
    
    if (textToSpeak.trim()) {
      try {
        // Use en-US for better voice quality, fallback to en-IN for Indian English
        const ttsLanguage = currentLanguageRef.current === 'hindi' ? 'hi' : 'en-US';
        isTTSPlayingRef.current = true;
        setIsBreakingNewsTTSPlaying(true);
        setCurrentBreakingNewsIndex(nextIndex);
        
        Speech.speak(textToSpeak.trim(), {
          language: ttsLanguage,
          rate: 0.95, // Fast rate optimized for news reading (close to normal speech speed)
          pitch: 1.0, // Normal pitch
          onStart: () => {
            setIsBreakingNewsTTSPlaying(true);
          },
          onDone: () => {
            // Move to next item
            if (isTTSPlayingRef.current && !isCategoryTTSPlayingRef.current) {
              setTimeout(() => {
                readNextBreakingNewsItem(nextIndex + 1);
              }, 500);
            }
          },
          onError: (error) => {
            console.error('[HomeScreen] TTS Error:', error);
            resetBreakingNewsTTSState();
          },
          onStopped: () => {
            resetBreakingNewsTTSState();
          },
        });
      } catch (error) {
        console.error('[HomeScreen] Error starting TTS:', error);
        resetBreakingNewsTTSState();
      }
    } else {
      // No text, move to next
      readNextBreakingNewsItem(nextIndex + 1);
    }
  }, []);

  // Function to read a single breaking news item
  const readBreakingNewsItem = React.useCallback((index) => {
    if (!breakingNews || index >= breakingNews.length) return;
            
    const item = breakingNews[index];
            const title = item.title || item.headline || '';
            const synopsis = item.synopsis || item.short_description || '';
            
            let textToSpeak = '';
            
    // Add headline
            if (title) {
              textToSpeak += `${title}. `;
            }
            
    // Add synopsis
            if (synopsis) {
              const cleanSynopsis = stripHtml(synopsis);
              if (cleanSynopsis) {
                textToSpeak += `${cleanSynopsis}. `;
              }
            }
            
            if (textToSpeak.trim()) {
              try {
        // Use en-US for better voice quality, fallback to en-IN for Indian English
        const ttsLanguage = currentLanguage === 'hindi' ? 'hi' : 'en-US';
        isTTSPlayingRef.current = true;
        setIsBreakingNewsTTSPlaying(true);
        setCurrentBreakingNewsIndex(index);
        
        Speech.speak(textToSpeak.trim(), {
          language: ttsLanguage,
          rate: 0.95, // Fast rate optimized for news reading (close to normal speech speed)
          pitch: 1.0, // Normal pitch
          onStart: () => {
            setIsBreakingNewsTTSPlaying(true);
          },
          onDone: () => {
            // Move to next item if still playing
            if (isTTSPlayingRef.current && !isCategoryTTSPlayingRef.current) {
              const nextIndex = index + 1;
              if (nextIndex < breakingNews.length) {
                setTimeout(() => {
                  readNextBreakingNewsItem(nextIndex);
                }, 500);
              } else {
                // Finished all items
                resetBreakingNewsTTSState();
              }
            }
          },
          onError: (error) => {
            console.error('[HomeScreen] TTS Error:', error);
            resetBreakingNewsTTSState();
          },
          onStopped: () => {
            resetBreakingNewsTTSState();
          },
        });
              } catch (error) {
                console.error('[HomeScreen] Error starting TTS:', error);
        resetBreakingNewsTTSState();
              }
            }
  }, [breakingNews, currentLanguage, readNextBreakingNewsItem]);

  // Update refs when state changes
  useEffect(() => {
    breakingNewsRef.current = breakingNews;
    // Stop TTS if breaking news changes while playing
    if (isBreakingNewsTTSPlaying) {
      stopBreakingNewsTTS();
    }
  }, [breakingNews]);

  useEffect(() => {
    isTTSPlayingRef.current = isBreakingNewsTTSPlaying;
  }, [isBreakingNewsTTSPlaying]);

  useEffect(() => {
    currentLanguageRef.current = currentLanguage;
  }, [currentLanguage]);

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  useEffect(() => {
    isCategoryTTSPlayingRef.current = isCategoryTTSPlaying;
  }, [isCategoryTTSPlaying]);


  // Stop TTS when screen loses focus (navigation away)
  useFocusEffect(
    useCallback(() => {
      // Screen focused - no action needed
    return () => {
        // Screen unfocused - stop all TTS
        console.log('[HomeScreen] Screen unfocused, stopping all TTS...');
        (async () => {
          try {
            await stopBreakingNewsTTS();
            if (isCategoryTTSPlaying) {
              await Speech.stop();
              setIsCategoryTTSPlaying(false);
              setCurrentCategoryStoryIndex(0);
        }
      } catch (error) {
            console.error('[HomeScreen] Error stopping TTS on unfocus:', error);
      }
        })();
      };
    }, [isCategoryTTSPlaying, stopBreakingNewsTTS])
  );

  // Language is now passed in options for each speak() call, no need for default language setting

  // Handle breaking news TTS play/pause
  const handleBreakingNewsTTS = async () => {
    if (isBreakingNewsTTSPlaying) {
      await stopBreakingNewsTTS();
    } else {
      // Stop category TTS if playing
      if (isCategoryTTSPlaying) {
        try {
          await Speech.stop();
          setIsCategoryTTSPlaying(false);
          setCurrentCategoryStoryIndex(0);
        } catch (error) {
          console.error('[HomeScreen] Error stopping category TTS:', error);
        }
      }
      // Start reading from the beginning
      if (breakingNews.length === 0) {
        alert('No breaking news available to read.');
        return;
      }
      readBreakingNewsItem(0);
    }
  };

  // Helper to read next category story (used in queue)
  const readNextCategoryStory = React.useCallback((nextIndex) => {
    const currentPosts = postsRef.current;
    if (!isCategoryTTSPlayingRef.current || isTTSPlayingRef.current) {
      setIsCategoryTTSPlaying(false);
      setCurrentCategoryStoryIndex(0);
      return;
    }
        
        // Get top 5 stories (excluding ads and web stories)
        const topStories = currentPosts.filter(post => !post.isAd && !post.isWebStories).slice(0, 5);
        
    if (nextIndex >= topStories.length) {
      setIsCategoryTTSPlaying(false);
      setCurrentCategoryStoryIndex(0);
      return;
    }
            
            const item = topStories[nextIndex];
            const title = item.title || item.headline || '';
            const synopsis = item.synopsis || item.short_description || '';
            
            let textToSpeak = '';
            
            if (title) {
              textToSpeak += `${title}. `;
            }
            
            if (synopsis) {
              const cleanSynopsis = stripHtml(synopsis);
              if (cleanSynopsis) {
                textToSpeak += `${cleanSynopsis}. `;
              }
            }
            
            if (textToSpeak.trim()) {
              try {
        // Use en-US for better voice quality, fallback to en-IN for Indian English
        const ttsLanguage = currentLanguageRef.current === 'hindi' ? 'hi' : 'en-US';
        isCategoryTTSPlayingRef.current = true;
      setIsCategoryTTSPlaying(true);
        setCurrentCategoryStoryIndex(nextIndex);
        
        Speech.speak(textToSpeak.trim(), {
          language: ttsLanguage,
          rate: 0.95, // Fast rate optimized for news reading (close to normal speech speed)
          pitch: 1.0, // Normal pitch
          onStart: () => {
            setIsCategoryTTSPlaying(true);
          },
          onDone: () => {
            // Move to next item
            if (isCategoryTTSPlayingRef.current && !isTTSPlayingRef.current) {
              setTimeout(() => {
                readNextCategoryStory(nextIndex + 1);
              }, 500);
            }
          },
          onError: (error) => {
            console.error('[HomeScreen] Category TTS Error:', error);
      setIsCategoryTTSPlaying(false);
      setCurrentCategoryStoryIndex(0);
          },
          onStopped: () => {
      setIsCategoryTTSPlaying(false);
      setCurrentCategoryStoryIndex(0);
          },
        });
      } catch (error) {
        console.error('[HomeScreen] Error starting category TTS:', error);
        setIsCategoryTTSPlaying(false);
        setCurrentCategoryStoryIndex(0);
      }
    } else {
      // No text, move to next
      readNextCategoryStory(nextIndex + 1);
      }
  }, []);

  // Function to read a category story
  const readCategoryStory = React.useCallback((index) => {
    if (!posts) return;

    // Get top 5 stories (excluding ads and web stories)
    const topStories = posts.filter(post => !post.isAd && !post.isWebStories).slice(0, 5);
    
    if (index >= topStories.length) return;

    const item = topStories[index];
    const title = item.title || item.headline || '';
    const synopsis = item.synopsis || item.short_description || '';
    
    let textToSpeak = '';
    
    if (title) {
      textToSpeak += `${title}. `;
    }
    
    if (synopsis) {
      const cleanSynopsis = stripHtml(synopsis);
      if (cleanSynopsis) {
        textToSpeak += `${cleanSynopsis}. `;
      }
    }
    
    if (textToSpeak.trim()) {
      try {
        // Use en-US for better voice quality, fallback to en-IN for Indian English
        const ttsLanguage = currentLanguage === 'hindi' ? 'hi' : 'en-US';
        isCategoryTTSPlayingRef.current = true;
        setIsCategoryTTSPlaying(true);
        setCurrentCategoryStoryIndex(index);
        
        Speech.speak(textToSpeak.trim(), {
          language: ttsLanguage,
          rate: 0.95, // Fast rate optimized for news reading (close to normal speech speed)
          pitch: 1.0, // Normal pitch
          onStart: () => {
            setIsCategoryTTSPlaying(true);
          },
          onDone: () => {
            // Move to next item if still playing
            if (isCategoryTTSPlayingRef.current && !isTTSPlayingRef.current) {
              const nextIndex = index + 1;
              if (nextIndex < topStories.length) {
                setTimeout(() => {
                  readNextCategoryStory(nextIndex);
                }, 500);
              } else {
                // Finished all items
                setIsCategoryTTSPlaying(false);
                setCurrentCategoryStoryIndex(0);
              }
            }
          },
          onError: (error) => {
            console.error('[HomeScreen] Category TTS Error:', error);
            setIsCategoryTTSPlaying(false);
            setCurrentCategoryStoryIndex(0);
          },
          onStopped: () => {
            setIsCategoryTTSPlaying(false);
            setCurrentCategoryStoryIndex(0);
          },
        });
      } catch (error) {
        console.error('[HomeScreen] Error starting category TTS:', error);
        setIsCategoryTTSPlaying(false);
        setCurrentCategoryStoryIndex(0);
      }
    }
  }, [posts, currentLanguage, readNextCategoryStory]);

  // Handle category TTS play/pause
  const handleCategoryTTS = async () => {
    if (isCategoryTTSPlaying) {
      // Stop TTS
      try {
        await Speech.stop();
        setIsCategoryTTSPlaying(false);
        setCurrentCategoryStoryIndex(0);
      } catch (error) {
        console.error('[HomeScreen] Error stopping category TTS:', error);
      }
    } else {
      // Stop breaking news TTS if playing
      if (isBreakingNewsTTSPlaying) {
        try {
          await stopBreakingNewsTTS();
        } catch (error) {
          console.error('[HomeScreen] Error stopping breaking news TTS:', error);
        }
      }
      // Start reading from the beginning
      const topStories = posts.filter(post => !post.isAd && !post.isWebStories).slice(0, 5);
      if (topStories.length === 0) {
        alert('No stories available to read.');
        return;
      }
      readCategoryStory(0);
    }
  };

  // Rotate interpolation for border animation
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Animate rotating border for floating button
  useEffect(() => {
    const startRotation = () => {
      rotateAnim.setValue(0);
      const animation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );
      animation.start();
      return animation;
    };
    
    // Start immediately
    const animation = startRotation();
    
    return () => {
      if (animation) {
        animation.stop();
      }
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    };
  }, []);

  // Load and setup interstitial ad
  useEffect(() => {
    const adUnitId = getAdUnitId('interstitial', 'homeNavigation');
    if (!adUnitId) {
      console.log('[HomeScreen] No interstitial ad unit ID configured');
      return;
    }

    // Create interstitial ad
    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    // Set up event listeners
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('[HomeScreen] Interstitial ad loaded');
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('[HomeScreen] Interstitial ad closed');
      // Reload ad for next time
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('[HomeScreen] Interstitial ad error:', error);
    });

    // Load the ad
    interstitial.load();
    interstitialAdRef.current = interstitial;

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  // Handle screen dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    
    return () => subscription?.remove();
  }, []);
  
  // Load current language on mount and listen for changes
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const language = await storage.getLanguage();
        console.log('[HomeScreen] Language loaded:', language);
        setCurrentLanguage(language || 'english');
      } catch (error) {
        console.error('[HomeScreen] Error loading language:', error);
      }
    };
    loadLanguage();

    // Poll for language changes every 500ms
    const interval = setInterval(async () => {
      try {
        const language = await storage.getLanguage();
        setCurrentLanguage(prev => {
          if (prev !== language) {
            console.log('[HomeScreen] Language changed from', prev, 'to', language);
            return language || 'english';
          }
          return prev;
        });
      } catch (error) {
        console.error('[HomeScreen] Error checking language:', error);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Get submenu items for selected category based on current language
  const getSubmenuItems = () => {
    const categoryItems = CATEGORY_SUBMENU_ITEMS[selectedCategory];
    if (!categoryItems) return [];
    
    // Handle old format (array) for backward compatibility
    if (Array.isArray(categoryItems)) {
      return categoryItems;
    }
    
    // Handle new format (object with english/hindi)
    if (typeof categoryItems === 'object' && categoryItems[currentLanguage]) {
      return categoryItems[currentLanguage] || categoryItems.english || [];
    }
    
    return [];
  };

  // Map Hindi tag to English tag for search
  const getEnglishTagForSearch = (hindiTag) => {
    const categoryItems = CATEGORY_SUBMENU_ITEMS[selectedCategory];
    if (!categoryItems || Array.isArray(categoryItems)) {
      return hindiTag; // Return as-is if old format or not found
    }
    
    const hindiTags = categoryItems.hindi || [];
    const englishTags = categoryItems.english || [];
    const index = hindiTags.indexOf(hindiTag);
    
    if (index >= 0 && index < englishTags.length) {
      return englishTags[index];
    }
    
    return hindiTag; // Fallback to original if not found
  };

  // Insert ads and web stories sections in the list
  const getDataWithAds = (postsArray) => {
    const result = [];
    let webStoriesInserted = false;
    let adCount = 0;
    const AD_INTERVAL = 5; // Insert ad after every 5 posts
    
    postsArray.forEach((post, index) => {
      result.push(post);
      
      // Add web stories section after 3rd item for national category
      if (selectedCategory === 'national' && !webStoriesInserted && (index + 1) === 3) {
        const nationalWebStories = webStories['national'] || [];
        if (nationalWebStories.length > 0) {
          result.push({ isWebStories: true, id: 'webstories-national', category: 'national' });
          webStoriesInserted = true;
        }
      }
      
      // Insert ads periodically after every AD_INTERVAL posts
      // Start inserting ads after the 3rd post (or 4th if web stories were inserted)
      if (AD_CONFIG.storiesBanner) {
        const firstAdPosition = webStoriesInserted ? 4 : 3;
        const currentPosition = index + 1;
        
        // Insert first ad after 3rd (or 4th if web stories) post
        if (currentPosition === firstAdPosition) {
          result.push({ isAd: true, id: `ad-${adCount}-${index}` });
          adCount++;
        }
        // Then insert ads every AD_INTERVAL posts after the first ad
        else if (currentPosition > firstAdPosition) {
          const positionFromFirstAd = currentPosition - firstAdPosition;
          // Insert ad after every AD_INTERVAL posts
          if (positionFromFirstAd % AD_INTERVAL === 0) {
            result.push({ isAd: true, id: `ad-${adCount}-${index}` });
            adCount++;
          }
        }
      }
    });
    return result;
  };

  const loadPosts = async (category, pageNum = 0, append = false) => {
    try {
      if (pageNum === 0 && !append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const limit = 12;
      const start = pageNum * limit;
      const result = await apiService.fetchPostsByCategory(category, limit, start);

      if (result.success) {
        // Filter out breaking news items (top 2-3) from regular posts
        // Only apply this filter when breaking news is shown (all or national category)
        let filteredData = result.data;
        if ((category === 'all' || category === 'national') && breakingNews.length > 0) {
          // Get IDs of top 2-3 breaking news items
          const breakingNewsIds = breakingNews.slice(0, 3).map(item => 
            item.id || item.shortSlug || item.slugUnique || item.slug
          );
          
          // Filter out posts that match breaking news IDs
          filteredData = result.data.filter(post => {
            const postId = post.id || post.shortSlug || post.slugUnique || post.slug;
            return !breakingNewsIds.includes(postId);
          });
        }

        if (append) {
          setPosts(prev => [...prev, ...filteredData]);
        } else {
          setPosts(filteredData);
        }
        setHasMore(result.data.length === limit && result.total > start + limit);
      } else {
        console.error('Error loading posts:', result.error);
      }
    } catch (error) {
      console.error('Error in loadPosts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Load breaking news
  const loadBreakingNews = async (category = selectedCategory) => {
    try {
      setLoadingBreakingNews(true);
      const result = await apiService.fetchBreakingNews(10, category);
      if (result.success) {
        setBreakingNews(result.data);
      } else {
        console.error('Error loading breaking news:', result.error);
        setBreakingNews([]);
      }
    } catch (error) {
      console.error('Error in loadBreakingNews:', error);
      setBreakingNews([]);
    } finally {
      setLoadingBreakingNews(false);
    }
  };

  // Load breaking news on mount and when language or category changes
  // Only load for 'all' (Home) and 'national' (India) categories
  useEffect(() => {
    // Clear breaking news when language changes to ensure fresh data
    setBreakingNews([]);
    
    if (selectedCategory === 'all' || selectedCategory === 'national') {
      // Small delay to ensure API base URL is updated
      const timer = setTimeout(async () => {
        await loadBreakingNews(selectedCategory);
        // Reload posts after breaking news loads to filter out duplicates
        if (selectedCategory === 'all' || selectedCategory === 'national') {
          await loadPosts(selectedCategory, 0, false);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage, selectedCategory]);

  // Load web stories for all supported categories
  const loadWebStories = async (category) => {
    try {
      setLoadingWebStories(prev => ({ ...prev, [category]: true }));
      const result = await apiService.fetchWebStories(10, category);
      if (result.success) {
        setWebStories(prev => ({ ...prev, [category]: result.data }));
      } else {
        console.error(`Error loading web stories for ${category}:`, result.error);
        setWebStories(prev => ({ ...prev, [category]: [] }));
      }
    } catch (error) {
      console.error(`Error in loadWebStories for ${category}:`, error);
      setWebStories(prev => ({ ...prev, [category]: [] }));
    } finally {
      setLoadingWebStories(prev => ({ ...prev, [category]: false }));
    }
  };

  // Load web stories when a supported category is selected
  // Supported categories: entertainment, sports, international, national
  useEffect(() => {
    // Clear web stories when language changes to ensure fresh data
    setWebStories({});
    setWebStoryImageErrors(new Set()); // Reset image errors on language change
    
    // Categories that have web stories available
    const webStoryCategories = ['entertainment', 'sports', 'international', 'national'];
    
    if (webStoryCategories.includes(selectedCategory)) {
      // Small delay to ensure API base URL is updated
      const timer = setTimeout(() => {
        loadWebStories(selectedCategory);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage, selectedCategory]);
  
  // Also load national web stories when in national or all category (for inline display)
  useEffect(() => {
    if (selectedCategory === 'national' || selectedCategory === 'all') {
      const timer = setTimeout(() => {
        loadWebStories('national');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentLanguage, selectedCategory]);

  // Reload posts when category OR language changes
  useEffect(() => {
    console.log('[HomeScreen] Category or language changed, reloading posts...');
    console.log('[HomeScreen] Category:', selectedCategory, 'Language:', currentLanguage);
    
    // Clear posts immediately when category/language changes for smooth transition
    setPosts([]);
    setLoading(true);
    setPage(0);
    setHasMore(true);
    
    // Reset ad loaded states for new category/language
    setAdsLoaded({});
    
    // Reset fade animation to show loader immediately
    fadeAnim.setValue(1);
    
    // Clear cache when language changes
    apiService.clearCache();
    
    // Load new posts
    // Note: loadPosts will use breakingNews from state, so we need to ensure breaking news is loaded first
    const loadData = async () => {
      // If breaking news should be shown, wait a bit for it to load
      if (selectedCategory === 'all' || selectedCategory === 'national') {
        // Small delay to ensure breaking news is loaded
        setTimeout(async () => {
          await loadPosts(selectedCategory, 0, false);
          // Fade in new content when loaded
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 200);
      } else {
        await loadPosts(selectedCategory, 0, false);
        // Fade in new content when loaded
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    };
    
    loadData();
  }, [selectedCategory, currentLanguage]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    loadPosts(selectedCategory, 0, false);
    if (selectedCategory === 'all' || selectedCategory === 'national') {
      loadBreakingNews(selectedCategory);
    }
    // Reload web stories if applicable
    const webStoryCategories = ['entertainment', 'sports', 'international', 'national'];
    if (webStoryCategories.includes(selectedCategory)) {
      loadWebStories(selectedCategory);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(selectedCategory, nextPage, true);
    }
  };

  const handlePostPress = async (post) => {
    const slug = post.shortSlug || post.slugUnique || post.slug;
    if (slug) {
      // Check if we can show interstitial ad (limit 2 per day)
      const canShowAd = await storage.canShowInterstitialAd();
      
      // Show interstitial ad before navigation (only if we haven't exceeded daily limit)
      if (interstitialAdRef.current && canShowAd) {
        const interstitial = interstitialAdRef.current;
        let hasNavigated = false;
        let adShown = false;
        
        const navigateToArticle = () => {
          if (!hasNavigated) {
            hasNavigated = true;
            const category = (post.category || 'news').toLowerCase();
            try {
              router.push({
                pathname: '/article/[category]/[slug]',
                params: { category, slug, post: JSON.stringify(post) },
              });
            } catch (error) {
              console.error('[HomeScreen] Error navigating to article:', error);
              // Fallback: try again with the same format
              try {
                router.push({
                  pathname: '/article/[category]/[slug]',
                  params: { category, slug },
                });
              } catch (fallbackError) {
                console.error('[HomeScreen] Fallback navigation also failed:', fallbackError);
              }
            }
          }
        };

        // Navigate after ad is closed
        const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
          unsubscribeClosed();
          navigateToArticle();
          // Reload ad for next time
          interstitial.load();
        });

        // Navigate even if ad fails to load
        const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, () => {
          unsubscribeError();
          navigateToArticle();
        });

        // Track when ad is shown
        const unsubscribeOpened = interstitial.addAdEventListener(AdEventType.OPENED, async () => {
          unsubscribeOpened();
          if (!adShown) {
            adShown = true;
            // Increment the daily count
            const newCount = await storage.incrementInterstitialAdCount();
            console.log('[HomeScreen] Interstitial ad shown. Daily count:', newCount);
          }
        });

        // Try to show ad (if already loaded, it will show immediately)
        if (interstitial.loaded) {
          interstitial.show();
        } else {
          // If not loaded, wait a bit for it to load, then navigate if it doesn't
          setTimeout(() => {
            if (interstitial.loaded) {
              interstitial.show();
            } else {
              // Ad not loaded, navigate anyway
              unsubscribeClosed();
              unsubscribeError();
              unsubscribeOpened();
              navigateToArticle();
            }
          }, 500);
        }
      } else {
        // No ad available or daily limit reached, navigate directly
        if (!canShowAd) {
          console.log('[HomeScreen] Daily interstitial ad limit reached (2 ads), navigating directly');
        }
        const category = (post.category || 'news').toLowerCase();
        try {
          router.push({
            pathname: '/article/[category]/[slug]',
            params: { category, slug, post: JSON.stringify(post) },
          });
        } catch (error) {
          console.error('[HomeScreen] Error navigating to article:', error);
          // Fallback: try again with the same format (without post data)
          try {
            router.push({
              pathname: '/article/[category]/[slug]',
              params: { category, slug },
            });
          } catch (fallbackError) {
            console.error('[HomeScreen] Fallback navigation also failed:', fallbackError);
          }
        }
      }
    }
  };

  const handleTagPress = (tag) => {
    // If current language is Hindi, convert to English for search
    const searchQuery = currentLanguage === 'hindi' ? getEnglishTagForSearch(tag) : tag;
    router.push({
      pathname: '/search',
      params: { query: searchQuery },
    });
  };

  const handleWebStoryPress = (story) => {
    const slug = story.slug || story.slugUnique || story.shortSlug;
    if (slug) {
      try {
        router.push({
          pathname: '/web-story/[slug]',
          params: { slug, story: JSON.stringify(story) },
        });
      } catch (error) {
        console.error('[HomeScreen] Error navigating to web story:', error);
        // Fallback: try again without story data
        try {
          router.push({
            pathname: '/web-story/[slug]',
            params: { slug },
          });
        } catch (fallbackError) {
          console.error('[HomeScreen] Fallback navigation also failed:', fallbackError);
        }
      }
    }
  };

  const renderItem = ({ item, index }) => {
    // Render web stories section
    if (item.isWebStories) {
      const categoryStories = webStories[item.category] || [];
      if (categoryStories.length === 0) return null;
      
      return (
        <View style={styles.webStoriesContainer}>
          <View style={styles.webStoriesHeader}>
            <View style={styles.webStoriesLabelContainer}>
              <View style={styles.webStoriesPulse} />
              <Text style={styles.webStoriesLabel}>WEB STORIES</Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.webStoriesScrollContent}
            nestedScrollEnabled={true}
          >
            {categoryStories.map((story, storyIndex) => {
              const imageUrl = getImageUrl(story.featuredImage || story.featured_image);
              const title = story.title || story.headline || '';
              const storyId = story.id || story.slug || story.slug_unique || `webstory-${item.category}-${storyIndex}`;
              const hasImageError = webStoryImageErrors.has(storyId);
              
              return (
                <TouchableOpacity
                  key={`webstory-${item.category}-${story.id || storyIndex}`}
                  style={styles.webStoryItem}
                  onPress={() => handleWebStoryPress(story)}
                  activeOpacity={0.8}
                >
                  <View style={styles.webStoryImageContainer}>
                    {imageUrl && !hasImageError ? (
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.webStoryImage}
                        contentFit="cover"
                        transition={200}
                        onError={() => {
                          setWebStoryImageErrors(prev => new Set(prev).add(storyId));
                        }}
                      />
                    ) : (
                      <Image
                        source={FALLBACK_IMAGE}
                        style={styles.webStoryImage}
                        contentFit="cover"
                        transition={200}
                      />
                    )}
                    <View style={styles.webStoryPlayButton}>
                      <View style={styles.webStoryPlayIcon}>
                        <Text style={styles.webStoryPlayText}>▶</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.webStoryContent}>
                    <Text style={styles.webStoryTitle} numberOfLines={2}>
                      {title}
                    </Text>
                    <Text style={styles.webStoryTime}>
                      {formatRelativeTime(story.storyAt || story.story_at || story.publishedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      );
    }
    
    // Render ad
    if (item.isAd) {
      const adId = item.id;
      const isAdLoaded = adsLoaded[adId] || false;
      
      return (
        <View style={isAdLoaded ? styles.adContainer : { height: 0, overflow: 'hidden' }}>
          <BannerAd
            unitId={getAdUnitId('banner', index % 2 === 0 ? 'home' : 'stories')}
            size={BannerAdSize.LARGE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: false,
            }}
            onAdLoaded={() => {
              console.log(`[Home] Ad ${index} loaded`);
              setAdsLoaded(prev => ({ ...prev, [adId]: true }));
            }}
            onAdFailedToLoad={(error) => {
              console.log(`[Home] Ad ${index} failed:`, error);
              setAdsLoaded(prev => ({ ...prev, [adId]: false }));
            }}
          />
        </View>
      );
    }
    
    // Render post
    return (
      <NewsCard
        post={item}
        onPress={() => handlePostPress(item)}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  // Handle scroll to animate logo
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        // Hide logo when scrolling down, show when at top or scrolling up
        if (offsetY > 50) {
          // Scrolling down - hide logo and collapse wrapper
          Animated.parallel([
            Animated.timing(logoTranslateY, {
              toValue: -100,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(logoHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        } else {
          // At top or scrolling up - show logo and expand wrapper
          Animated.parallel([
            Animated.timing(logoTranslateY, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(logoHeight, {
              toValue: 70,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start();
        }
      },
    }
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Logo above header - only on HomeScreen */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            height: logoHeight,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ translateY: logoTranslateY }],
            },
          ]}
        >
          <Image
            source={currentLanguage === 'hindi' ? logoHindi : logo}
            style={styles.logo}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>
      </Animated.View>
      <View style={styles.headerSection}>
        <Header
          onSearch={() => router.push('/search')}
          showLanguageSelector={true}
          onLanguageChange={async (languageId) => {
            // Update current language state
            if (languageId) {
              setCurrentLanguage(languageId);
            } else {
              // Fallback: reload language from storage
              const language = await storage.getLanguage();
              setCurrentLanguage(language || 'english');
            }
            // Clear cache when language changes
            apiService.clearCache();
            // Clear breaking news to ensure fresh data
            setBreakingNews([]);
            // Clear web stories to ensure fresh data
            setWebStories({});
            // Reset state and reload data
            setPage(0);
            setHasMore(true);
            setPosts([]);
            setLoading(true);
            await loadPosts(selectedCategory, 0, false);
            // Reload breaking news if applicable
            if (selectedCategory === 'all' || selectedCategory === 'national') {
              await loadBreakingNews(selectedCategory);
            }
            // Reload web stories if applicable
            const webStoryCategories = ['entertainment', 'sports', 'international', 'national'];
            if (webStoryCategories.includes(selectedCategory)) {
              loadWebStories(selectedCategory);
            }
          }}
        />
        <CategoryTab
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
        <TagChips tags={getSubmenuItems()} onTagPress={handleTagPress} />
      </View>
      {loading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={getDataWithAds(posts)}
            renderItem={renderItem}
            keyExtractor={(item, index) => {
              if (item.isAd) return item.id;
              if (item.isWebStories) return item.id;
              return `post-${item.id || item.shortSlug || index}`;
            }}
            numColumns={getNumColumns()}
            key={getNumColumns()} // Force re-render when columns change
            columnWrapperStyle={getNumColumns() > 1 ? styles.columnWrapper : undefined}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
              />
            }
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={
              <>
                {/* Breaking News Section - only show in Home (all) and India (national) */}
                {(selectedCategory === 'all' || selectedCategory === 'national') && breakingNews.length > 0 ? (
                  <View style={styles.breakingNewsContainer}>
                    <View style={styles.breakingNewsHeader}>
                      <View style={styles.breakingNewsLabelContainer}>
                        <View style={styles.breakingNewsPulse} />
                        <Text style={styles.breakingNewsLabel}>BREAKING NEWS</Text>
                      </View>
                      <TouchableOpacity
                        onPress={handleBreakingNewsTTS}
                        style={styles.breakingNewsTTSButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.breakingNewsTTSButtonIcon}>
                          {isBreakingNewsTTSPlaying ? '⏸' : '▶'}
                        </Text>
                        <Text style={styles.breakingNewsTTSButtonText}>
                          {isBreakingNewsTTSPlaying 
                            ? (currentLanguage === 'hindi' ? 'रोकें' : 'Stop')
                            : (currentLanguage === 'hindi' ? 'मुझे पढ़ें' : 'Read to me')
                          }
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.breakingNewsScrollContent}
                      nestedScrollEnabled={true}
                    >
                      {breakingNews.map((item, index) => {
                        const imageUrl = getImageUrl(item.banner || item.featuredImage || item.featured_image);
                        const title = item.title || item.headline || '';
                        
                        return (
                          <TouchableOpacity
                            key={`breaking-${item.id || index}`}
                            style={styles.breakingNewsItem}
                            onPress={() => handlePostPress(item)}
                            activeOpacity={0.8}
                          >
                            {imageUrl ? (
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.breakingNewsImage}
                                contentFit="cover"
                                transition={200}
                              />
                            ) : (
                              <View style={[styles.breakingNewsImage, styles.breakingNewsPlaceholder]} />
                            )}
                            <View style={styles.breakingNewsOverlay} />
                            <View style={styles.breakingNewsContent}>
                              <Text style={styles.breakingNewsTitle} numberOfLines={3}>
                                {title}
                              </Text>
                              <Text style={styles.breakingNewsTime}>
                                {formatRelativeTime(item.storyAt || item.story_at || item.publishedAt)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
                {/* Web Stories Section - show in respective category tabs (except national which shows inline) */}
                {['entertainment', 'sports', 'international'].includes(selectedCategory) && 
                 webStories[selectedCategory] && webStories[selectedCategory].length > 0 ? (
                  <View style={styles.webStoriesContainer}>
                    <View style={styles.webStoriesHeader}>
                      <View style={styles.webStoriesLabelContainer}>
                        <View style={styles.webStoriesPulse} />
                        <Text style={styles.webStoriesLabel}>WEB STORIES</Text>
                      </View>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.webStoriesScrollContent}
                      nestedScrollEnabled={true}
                    >
                      {webStories[selectedCategory].map((item, index) => {
                        const imageUrl = getImageUrl(item.featuredImage || item.featured_image);
                        const title = item.title || item.headline || '';
                        
                        return (
                          <TouchableOpacity
                            key={`webstory-${selectedCategory}-${item.id || index}`}
                            style={styles.webStoryItem}
                            onPress={() => handleWebStoryPress(item)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.webStoryImageContainer}>
                              {imageUrl ? (
                                <Image
                                  source={{ uri: imageUrl }}
                                  style={styles.webStoryImage}
                                  contentFit="cover"
                                  transition={200}
                                />
                              ) : (
                                <View style={[styles.webStoryImage, styles.webStoryPlaceholder]} />
                              )}
                              <View style={styles.webStoryPlayButton}>
                                <View style={styles.webStoryPlayIcon}>
                                  <Text style={styles.webStoryPlayText}>▶</Text>
                                </View>
                              </View>
                            </View>
                            <View style={styles.webStoryContent}>
                              <Text style={styles.webStoryTitle} numberOfLines={2}>
                                {title}
                              </Text>
                              <Text style={styles.webStoryTime}>
                                {formatRelativeTime(item.storyAt || item.story_at || item.publishedAt)}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}
              </>
            }
            ListFooterComponent={renderFooter}
            ListEmptyComponent={
              !loading ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No posts found</Text>
                </View>
              ) : null
            }
          />
        </Animated.View>
      )}
      {/* Floating "Read to me" button for category tabs (not for Home/India) */}
      {selectedCategory !== 'all' && selectedCategory !== 'national' && posts.length > 0 && (
        <Animated.View
          style={[
            styles.floatingCategoryTTSButtonContainer,
            { bottom: 200 + insets.bottom },
          ]}
        >
          <Animated.View
            style={[
              styles.floatingCategoryTTSButtonBorder,
              {
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          />
          <TouchableOpacity
            style={styles.floatingCategoryTTSButton}
            onPress={handleCategoryTTS}
            activeOpacity={0.8}
          >
            <View style={styles.floatingCategoryTTSButtonContent}>
              <Text style={styles.floatingCategoryTTSButtonIcon}>
                {isCategoryTTSPlaying ? '⏸' : '▶'}
              </Text>
              <Text style={styles.floatingCategoryTTSButtonText} numberOfLines={2}>
                {isCategoryTTSPlaying 
                  ? (currentLanguage === 'hindi' ? 'रोकें' : 'Stop')
                  : (currentLanguage === 'hindi' ? 'मुझे\nपढ़ें' : 'Read\nto me')
                }
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    overflow: 'visible',
  },
  logoWrapper: {
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  headerSection: {
    // No margin needed as logo is in normal flow
  },
  logo: {
    height: 50,
    width: 200,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
  },
  columnWrapper: {
    gap: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  adContainer: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginVertical: SPACING.sm,
    borderRadius: 8,
  },
  breakingNewsContainer: {
    backgroundColor: '#1a0000',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#dc3545',
    borderBottomColor: '#dc3545',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    marginLeft: -SPACING.md,
    marginRight: -SPACING.md,
  },
  breakingNewsHeader: {
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.xl,
    paddingBottom: SPACING.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakingNewsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakingNewsTTSButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  breakingNewsTTSButtonIcon: {
    fontSize: 14,
    color: '#ffffff',
    marginRight: SPACING.xs,
  },
  breakingNewsTTSButtonText: {
    fontSize: FONT_SIZES.xs,
    color: '#ffffff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  breakingNewsPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
    marginRight: SPACING.xs,
  },
  breakingNewsLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  breakingNewsScrollContent: {
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  breakingNewsItem: {
    width: 280,
    height: 180,
    marginRight: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    position: 'relative',
  },
  breakingNewsItemFirst: {
    marginLeft: 0,
  },
  breakingNewsItemLast: {
    marginRight: SPACING.md,
  },
  breakingNewsImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  breakingNewsPlaceholder: {
    backgroundColor: COLORS.surface,
  },
  breakingNewsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  breakingNewsContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  breakingNewsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: SPACING.xs,
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  breakingNewsTime: {
    fontSize: FONT_SIZES.xs,
    color: '#ffcccc',
    fontWeight: '600',
  },
  webStoriesContainer: {
    backgroundColor: '#1a0000',
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderTopColor: '#dc3545',
    borderBottomColor: '#dc3545',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.md,
    marginLeft: -SPACING.md,
    marginRight: -SPACING.md,
    marginTop: SPACING.md,
  },
  webStoriesHeader: {
    paddingLeft: SPACING.xl,
    paddingBottom: SPACING.xs,
  },
  webStoriesLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  webStoriesPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc3545',
    marginRight: SPACING.xs,
  },
  webStoriesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  webStoriesScrollContent: {
    paddingLeft: SPACING.xl,
    paddingRight: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  webStoryItem: {
    width: 160,
    marginRight: SPACING.md,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webStoryImageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  webStoryImage: {
    width: '100%',
    height: '100%',
  },
  webStoryPlaceholder: {
    backgroundColor: COLORS.surface,
  },
  webStoryPlayButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webStoryPlayIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webStoryPlayText: {
    color: '#ffffff',
    fontSize: 20,
    marginLeft: 3,
  },
  webStoryContent: {
    padding: SPACING.sm,
  },
  webStoryTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 18,
  },
  webStoryTime: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
  },
  floatingCategoryTTSButtonContainer: {
    position: 'absolute',
    right: SPACING.md,
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingCategoryTTSButtonBorder: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  floatingCategoryTTSButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingCategoryTTSButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCategoryTTSButtonIcon: {
    fontSize: 16,
    color: COLORS.background,
    marginBottom: 2,
  },
  floatingCategoryTTSButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 12,
  },
});

export default HomeScreen;

