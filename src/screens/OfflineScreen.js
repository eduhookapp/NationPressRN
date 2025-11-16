import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONT_SIZES, SPACING } from '../config/constants';
import { getNetworkState, isConnected } from '../services/networkService';

/**
 * Screen shown when internet connection is lost
 * Automatically resumes when connection is restored
 */
const OfflineScreen = ({ onRetry, onConnectionRestored }) => {
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Check connection status periodically
    const checkInterval = setInterval(async () => {
      const connected = await isConnected();
      if (connected) {
        console.log('[OfflineScreen] ✅ Connection restored!');
        if (onConnectionRestored) {
          onConnectionRestored();
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [onConnectionRestored]);

  const handleRetry = async () => {
    setIsChecking(true);
    setRetryCount(prev => prev + 1);

    try {
      const connected = await isConnected();
      
      if (connected) {
        console.log('[OfflineScreen] ✅ Connection restored on retry!');
        if (onConnectionRestored) {
          onConnectionRestored();
        }
      } else {
        console.log('[OfflineScreen] ❌ Still offline');
        // Show feedback that it's still offline
        setTimeout(() => {
          setIsChecking(false);
        }, 1000);
      }
    } catch (error) {
      console.error('[OfflineScreen] Error checking connection:', error);
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📡</Text>
        </View>
        
        <Text style={styles.title}>No Internet Connection</Text>
        
        <Text style={styles.message}>
          Please check your internet connection and try again.
        </Text>
        
        <Text style={styles.subMessage}>
          The app will automatically resume when your connection is restored.
        </Text>
        
        <TouchableOpacity 
          style={[styles.retryButton, isChecking && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isChecking}
          activeOpacity={0.8}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.retryButtonText}>Retry</Text>
          )}
        </TouchableOpacity>
        
        {retryCount > 0 && (
          <Text style={styles.retryCountText}>
            Retry attempts: {retryCount}
          </Text>
        )}
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips:</Text>
          <Text style={styles.tipText}>• Check your Wi-Fi or mobile data</Text>
          <Text style={styles.tipText}>• Move to an area with better signal</Text>
          <Text style={styles.tipText}>• Restart your router if using Wi-Fi</Text>
          <Text style={styles.tipText}>• The app will auto-resume when online</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    marginBottom: SPACING.xl,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: FONT_SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  message: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  subMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontStyle: 'italic',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  retryButtonDisabled: {
    opacity: 0.6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  retryCountText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  tipsContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    width: '100%',
    maxWidth: 400,
  },
  tipsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tipText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
});

export default OfflineScreen;

