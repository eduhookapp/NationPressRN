import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { OneSignal } from 'react-native-onesignal';
import { LANGUAGES, DEFAULT_LANGUAGE, setApiBaseUrl } from '../config/constants';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';

const LanguageSelector = ({ onLanguageChange }) => {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE);

  React.useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await storage.getLanguage();
      if (savedLanguage) {
        setSelectedLanguage(savedLanguage);
        applyLanguage(savedLanguage);
      } else {
        // First time - use default and save it
        setSelectedLanguage(DEFAULT_LANGUAGE);
        await storage.setLanguage(DEFAULT_LANGUAGE);
        applyLanguage(DEFAULT_LANGUAGE);
      }
    } catch (error) {
      console.error('Error loading language:', error);
      // Use default language on error
      setSelectedLanguage(DEFAULT_LANGUAGE);
      applyLanguage(DEFAULT_LANGUAGE);
    }
  };

  const applyLanguage = (languageId) => {
    const language = LANGUAGES[languageId];
    if (language) {
      setApiBaseUrl(language.apiBaseUrl);
    }
  };

  const handleLanguageSelect = async (languageId) => {
    try {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('[LanguageSelector] 🌍 Language changed to:', languageId);
      console.log('═══════════════════════════════════════════════════════════');
      
      setSelectedLanguage(languageId);
      await storage.setLanguage(languageId);
      console.log('[LanguageSelector] ✅ Language saved to storage');
      
      applyLanguage(languageId);
      console.log('[LanguageSelector] ✅ API base URL updated');
      
      // Set OneSignal segment tag
      const segmentTag = languageId === 'english' ? 'English' : 'Hindi';
      console.log(`[LanguageSelector] 🏷️  Setting OneSignal segment tag: "${segmentTag}"`);
      
      try {
        // Initialize OneSignal (safe to call multiple times)
        OneSignal.initialize('4a5d4548-9579-4d5d-958c-5819a5ea1598');
        console.log('[LanguageSelector] ✅ OneSignal initialized');
        
        // Set tag
        OneSignal.User.addTag('segment', segmentTag);
        console.log('[LanguageSelector] ✅ OneSignal tag set successfully');
        
        // Wait a moment for tag to sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify tags were set
        const tags = await OneSignal.User.getTags();
        console.log('[LanguageSelector] 📋 Current OneSignal tags:', JSON.stringify(tags, null, 2));
      } catch (tagError) {
        console.error('[LanguageSelector] ❌ Error setting OneSignal tag:', tagError);
      }
      
      console.log('[LanguageSelector] ✅ Language change complete');
      console.log('═══════════════════════════════════════════════════════════');
      
      setModalVisible(false);
      
      // Trigger callback to refresh parent component
      if (onLanguageChange) {
        console.log('[LanguageSelector] 🔄 Triggering onLanguageChange callback with:', languageId);
        onLanguageChange(languageId);
      } else {
        console.warn('[LanguageSelector] ⚠️ No onLanguageChange callback provided');
      }
    } catch (error) {
      console.error('[LanguageSelector] ❌ Error setting language:', error);
      // Still apply language even if storage fails
      applyLanguage(languageId);
      setModalVisible(false);
      if (onLanguageChange) {
        onLanguageChange(languageId);
      }
    }
  };

  const currentLanguage = LANGUAGES[selectedLanguage] || LANGUAGES[DEFAULT_LANGUAGE];

  // Get icon for selected language
  const getSelectedLanguageIcon = () => {
    if (selectedLanguage === 'english') {
      return 'globe-outline';
    } else if (selectedLanguage === 'hindi') {
      return 'book-outline';
    }
    return 'language-outline';
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name={getSelectedLanguageIcon()} size={20} color={COLORS.text} />
        <Text style={styles.selectorText}>{currentLanguage.label}</Text>
        <Ionicons name="chevron-down-outline" size={16} color={COLORS.textLight} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={[styles.modalContent, { paddingBottom: insets.bottom }]} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={Object.values(LANGUAGES)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                // Get appropriate icon for each language
                const getLanguageIcon = (languageId) => {
                  if (languageId === 'english') {
                    return 'globe-outline'; // English - globe icon
                  } else if (languageId === 'hindi') {
                    return 'book-outline'; // Hindi - book icon
                  }
                  return 'language-outline';
                };

                return (
                  <TouchableOpacity
                    style={[
                      styles.languageItem,
                      selectedLanguage === item.id && styles.languageItemSelected
                    ]}
                    onPress={() => handleLanguageSelect(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={getLanguageIcon(item.id)} 
                      size={24} 
                      color={selectedLanguage === item.id ? COLORS.primary : COLORS.text} 
                      style={styles.languageIcon}
                    />
                    <View style={styles.languageItemContent}>
                      <Text style={styles.languageName}>{item.name}</Text>
                      <Text style={styles.languageLabel}>{item.label}</Text>
                    </View>
                    {selectedLanguage === item.id && (
                      <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    gap: 6,
  },
  selectorText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: SPACING.md,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  languageIcon: {
    marginRight: SPACING.md,
  },
  languageItemSelected: {
    backgroundColor: COLORS.surface,
  },
  languageItemContent: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  languageLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
});

export default LanguageSelector;

