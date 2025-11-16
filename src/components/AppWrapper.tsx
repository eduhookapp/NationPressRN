import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import OfflineScreen from '../screens/OfflineScreen';
import { COLORS, LANGUAGES, DEFAULT_LANGUAGE, setApiBaseUrl } from '../config/constants';
import { storage } from '../utils/storage';
import { useAppContext } from '../providers/AppProvider';
import { OneSignal } from 'react-native-onesignal';
import { getOneSignalPlayerId, registerDeviceToken } from '../services/notificationService';
import { getApiBaseUrl } from '../config/constants';

interface AppWrapperProps {
  children: React.ReactNode;
}

export const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  const [showLanguageSelection, setShowLanguageSelection] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { isOnline } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const hasSelected = await storage.hasSelectedLanguage();
        
        if (!hasSelected) {
          setShowLanguageSelection(true);
        } else {
          const savedLanguage = await storage.getLanguage();
          const language = LANGUAGES[savedLanguage] || LANGUAGES[DEFAULT_LANGUAGE];
          console.log('[AppWrapper] Setting API based on saved language:', savedLanguage);
          setApiBaseUrl(language.apiBaseUrl);
          setShowLanguageSelection(false);
        }
        setIsReady(true);
      } catch (error) {
        console.error('[AppWrapper] Error initializing app:', error);
        const language = LANGUAGES[DEFAULT_LANGUAGE];
        setApiBaseUrl(language.apiBaseUrl);
        setShowLanguageSelection(true);
        setIsReady(true);
      }
    };

    initializeApp();
  }, []);

  const handleLanguageSelected = async (languageId: string) => {
    console.log('[AppWrapper] Language selected:', languageId);
    setShowLanguageSelection(false);
    
    setTimeout(async () => {
      try {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[AppWrapper] 🆕 Setting up OneSignal after language selection...');
        console.log('[AppWrapper] 📝 Selected language:', languageId);
        console.log('═══════════════════════════════════════════════════════════');
        
        const segmentTag = languageId === 'english' ? 'English' : 'Hindi';
        console.log(`[AppWrapper] 🏷️  Setting single segment tag: "${segmentTag}"`);
        
        OneSignal.User.addTag('segment', segmentTag);
        console.log('[AppWrapper] ✅ OneSignal.User.addTag() called with segment:', segmentTag);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        const tagsAfter = await OneSignal.User.getTags();
        console.log('[AppWrapper] 📋 Tags AFTER first selection:', JSON.stringify(tagsAfter, null, 2));
        
        const playerId = await getOneSignalPlayerId();
        const apiBaseUrl = getApiBaseUrl();
        console.log('[AppWrapper] 🔑 Player ID:', playerId);
        console.log('[AppWrapper] 🌐 API Base URL:', apiBaseUrl);
        
        if (playerId && apiBaseUrl) {
          console.log('[AppWrapper] 📡 Registering Player ID with backend...');
          await registerDeviceToken(playerId, apiBaseUrl);
          console.log('[AppWrapper] ✅ Device token registered successfully');
        } else {
          console.warn('[AppWrapper] ⚠️  Could not obtain Player ID or API URL');
        }
        console.log('═══════════════════════════════════════════════════════════');
      } catch (error) {
        console.error('[AppWrapper] ❌ Error during setup:', error);
      }
    }, 2000);
  };

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.background} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaProvider>
    );
  }

  if (showLanguageSelection) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.background} />
        <LanguageSelectionScreen onLanguageSelected={handleLanguageSelected} />
      </SafeAreaProvider>
    );
  }

  if (!isOnline && isReady && !showLanguageSelection) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor={COLORS.background} />
        <OfflineScreen 
          onConnectionRestored={() => {
            console.log('[AppWrapper] ✅ Connection restored, resuming app...');
          }}
        />
      </SafeAreaProvider>
    );
  }

  return <>{children}</>;
};

