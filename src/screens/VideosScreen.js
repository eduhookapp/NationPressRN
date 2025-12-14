import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES, TAB_LABELS } from '../config/constants';
import Header from '../components/Header';
import { formatRelativeTime } from '../utils/dateUtils';

const { width } = Dimensions.get('window');

const VideosScreen = () => {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  
  // Check if we're in a tab (don't show back button in tabs)
  const isInTab = segments.includes('(tabs)') && segments[segments.length - 1] === 'videos';
  
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const webViewRef = useRef(null);

  useEffect(() => {
    loadLanguage();
    loadVideos();
    
    // Listen for language changes
    const interval = setInterval(async () => {
      const language = await storage.getLanguage();
      if (language !== currentLanguage) {
        setCurrentLanguage(language || 'english');
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const loadLanguage = async () => {
    try {
      const language = await storage.getLanguage();
      setCurrentLanguage(language || 'english');
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const loadVideos = async (pageToken = null, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await apiService.fetchYouTubeVideos(null, 20, pageToken);

      if (result.success) {
        if (append) {
          setVideos(prev => [...prev, ...result.data]);
        } else {
          setVideos(result.data);
        }
        setNextPageToken(result.nextPageToken);
        setHasMore(!!result.nextPageToken);
      } else {
        console.error('Error loading videos:', result.error);
        // If API key is not configured, show a helpful message
        if (result.error && result.error.includes('API key')) {
          setVideos([]);
        }
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setNextPageToken(null);
    setHasMore(true);
    loadVideos(null, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && nextPageToken) {
      loadVideos(nextPageToken, true);
    }
  };

  const handleVideoPress = (video) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
  };

  const closeVideoModal = () => {
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };

  const getTabLabel = (key) => {
    return TAB_LABELS[currentLanguage]?.[key] || TAB_LABELS.english[key];
  };

  const renderVideoItem = ({ item, index }) => {
    const thumbnailUrl = item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
    const publishedDate = item.publishedAt ? new Date(item.publishedAt) : null;
    const timeAgo = publishedDate ? formatRelativeTime(publishedDate) : '';

    return (
      <TouchableOpacity
        style={styles.videoCard}
        onPress={() => handleVideoPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.playButton}>
            <Ionicons name="play-circle" size={48} color="rgba(255, 255, 255, 0.9)" />
          </View>
          {timeAgo ? (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{timeAgo}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.videoInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>
            {item.title}
          </Text>
          {item.channelTitle ? (
            <Text style={styles.channelName} numberOfLines={1}>
              {item.channelTitle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
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

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyText}>
          {videos.length === 0 && !loading
            ? 'No videos available. Please configure YouTube API key and Channel ID in api.js'
            : 'No videos found'}
        </Text>
        {videos.length === 0 && !loading && (
          <Text style={styles.emptySubtext}>
            To configure: Edit src/services/api.js and set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={getTabLabel('videos')}
        onBack={!isInTab ? () => router.back() : null}
        showLanguageSelector={false}
      />
      
      {loading && videos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading videos...</Text>
        </View>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item, index) => item.id || `video-${index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + SPACING.md }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          numColumns={1}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Video Player Modal */}
      <Modal
        visible={videoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeVideoModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={closeVideoModal}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            {selectedVideo && (
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedVideo.title}
              </Text>
            )}
          </View>
          
          {selectedVideo && (
            <View style={styles.videoPlayerContainer}>
              <WebView
                ref={webViewRef}
                source={{
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                          body {
                            margin: 0;
                            padding: 0;
                            background: #000;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                          }
                          iframe {
                            width: 100%;
                            height: 100%;
                          }
                        </style>
                      </head>
                      <body>
                        <iframe
                          src="https://www.youtube.com/embed/${selectedVideo.videoId}?rel=0&modestbranding=1&playsinline=1"
                          frameborder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowfullscreen
                        ></iframe>
                      </body>
                    </html>
                  `
                }}
                style={styles.videoWebView}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                javaScriptEnabled={true}
                domStorageEnabled={false}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('YouTube WebView error:', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('YouTube WebView HTTP error:', nativeEvent);
                }}
              />
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
  },
  listContent: {
    padding: SPACING.md,
  },
  videoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
    backgroundColor: COLORS.border,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  videoInfo: {
    padding: SPACING.md,
  },
  videoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  channelName: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  footerLoader: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 400,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  closeButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  modalTitle: {
    flex: 1,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoWebView: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default VideosScreen;

