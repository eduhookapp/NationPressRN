import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useSegments } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubePlayer from 'react-native-youtube-iframe';
import Header from '../components/Header';
import { COLORS, FONT_SIZES, SPACING, TAB_LABELS, YOUTUBE_PLAYLISTS } from '../config/constants';
import { apiService } from '../services/api';
import { formatRelativeTime } from '../utils/dateUtils';
import { storage } from '../utils/storage';

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
  const [activePlaylistTab, setActivePlaylistTab] = useState('english'); // 'english' or 'hindi'
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    loadLanguage();
    
    // Listen for language changes
    const interval = setInterval(async () => {
      const language = await storage.getLanguage();
      if (language !== currentLanguage) {
        setCurrentLanguage(language || 'english');
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Update playlist tab when language changes
  useEffect(() => {
    const newPlaylistTab = currentLanguage === 'hindi' ? 'hindi' : 'english';
    if (newPlaylistTab !== activePlaylistTab) {
      setActivePlaylistTab(newPlaylistTab);
      setVideos([]);
      setNextPageToken(null);
      setHasMore(true);
      // Directly load videos with the new tab value
      loadVideos(null, false, newPlaylistTab);
    }
  }, [currentLanguage]);

  const loadLanguage = async () => {
    try {
      const language = await storage.getLanguage();
      const lang = language || 'english';
      setCurrentLanguage(lang);
      // Set initial playlist tab based on language and load videos
      const initialPlaylistTab = lang === 'hindi' ? 'hindi' : 'english';
      setActivePlaylistTab(initialPlaylistTab);
      loadVideos(null, false, initialPlaylistTab);
    } catch (error) {
      console.error('Error loading language:', error);
      // On error, still load videos with default tab
      loadVideos(null, false, 'english');
    }
  };

  const loadVideos = async (pageToken = null, append = false, playlistTab = null) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Use provided playlistTab or current activePlaylistTab
      // We need to use a function to get the latest state value
      const currentPlaylistTab = playlistTab || activePlaylistTab;
      
      // Get playlist ID for active tab
      const playlistId = YOUTUBE_PLAYLISTS[currentPlaylistTab];
      
      console.log('[VideosScreen] Loading videos for playlist tab:', currentPlaylistTab, 'Playlist ID:', playlistId);
      
      let result;
      if (playlistId) {
        // Fetch from specific playlist
        result = await apiService.fetchYouTubePlaylistVideos(playlistId, 20, pageToken);
      } else {
        // Fallback to channel uploads if playlist not configured
        result = await apiService.fetchYouTubeVideos(null, 20, pageToken);
      }

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
    // Pass the current activePlaylistTab to ensure we use the latest value
    loadVideos(null, false, activePlaylistTab);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && nextPageToken) {
      // Pass the current activePlaylistTab to ensure we use the latest value
      loadVideos(nextPageToken, true, activePlaylistTab);
    }
  };

  const handleVideoPress = (video) => {
    setSelectedVideo(video);
    setVideoModalVisible(true);
    setPlaying(true);
  };

  const closeVideoModal = () => {
    setPlaying(false);
    setVideoModalVisible(false);
    setSelectedVideo(null);
  };

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const getTabLabel = (key) => {
    return TAB_LABELS[currentLanguage]?.[key] || TAB_LABELS.english[key];
  };

  const handlePlaylistTabChange = (tab) => {
    if (tab !== activePlaylistTab) {
      setActivePlaylistTab(tab);
      setVideos([]);
      setNextPageToken(null);
      setHasMore(true);
      // Directly load videos with the new tab value
      loadVideos(null, false, tab);
    }
  };

  const renderPlaylistTabs = () => {
    return (
      <View style={styles.playlistTabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playlistTabsScroll}
        >
          <TouchableOpacity
            style={[
              styles.playlistTab,
              activePlaylistTab === 'english' && styles.playlistTabActive
            ]}
            onPress={() => handlePlaylistTabChange('english')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.playlistTabText,
                activePlaylistTab === 'english' && styles.playlistTabTextActive
              ]}
            >
              English News
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.playlistTab,
              activePlaylistTab === 'hindi' && styles.playlistTabActive
            ]}
            onPress={() => handlePlaylistTabChange('hindi')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.playlistTabText,
                activePlaylistTab === 'hindi' && styles.playlistTabTextActive
              ]}
            >
              Hindi News
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
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
      
      {renderPlaylistTabs()}
      
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
              <YoutubePlayer
                height={width * 9 / 16}
                width={width}
                play={playing}
                videoId={selectedVideo.videoId}
                onChangeState={onStateChange}
                initialPlayerParams={{
                  preventFullScreen: false,
                  modestbranding: true,
                  rel: false,
                  showClosedCaptions: false,
                }}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  androidHardwareAccelerationDisabled: false,
                  androidLayerType: 'hardware',
                  bounces: false,
                  overScrollMode: 'never',
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
    justifyContent: 'center',
  },
  playlistTabsContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  playlistTabsScroll: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  playlistTab: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playlistTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  playlistTabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
  },
  playlistTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default VideosScreen;

