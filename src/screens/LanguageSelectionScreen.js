import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { OneSignal } from 'react-native-onesignal';
import { LANGUAGES, DEFAULT_LANGUAGE, setApiBaseUrl } from '../config/constants';
import { storage } from '../utils/storage';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';

const LanguageSelectionScreen = ({ onLanguageSelected }) => {
  const [selectedLanguage, setSelectedLanguage] = useState(null);

  const handleLanguageSelect = async (languageId) => {
    try {
      const language = LANGUAGES[languageId];
      if (language) {
        setSelectedLanguage(languageId);
        
        console.log('═══════════════════════════════════════════════════════════');
        console.log('[LanguageSelection] 🌍 Language selected:', languageId);
        console.log('═══════════════════════════════════════════════════════════');
        
        // Save language preference
        await storage.setLanguage(languageId);
        console.log('[LanguageSelection] ✅ Language saved to storage');
        
        // Update API base URL
        setApiBaseUrl(language.apiBaseUrl);
        console.log('[LanguageSelection] ✅ API base URL set to:', language.apiBaseUrl);
        
        // Set OneSignal segment tag
        const segmentTag = languageId === 'english' ? 'English' : 'Hindi';
        console.log(`[LanguageSelection] 🏷️  Setting OneSignal segment tag: "${segmentTag}"`);
        
        try {
          // initialize OneSignal
          OneSignal.initialize('4a5d4548-9579-4d5d-958c-5819a5ea1598');
          console.log('[LanguageSelection] ✅ OneSignal initialized successfully');
          
          // add tag
          OneSignal.User.addTag('segment', segmentTag);
          console.log('[LanguageSelection] ✅ OneSignal tag set successfully');
          
          // Wait a moment for tag to sync
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify tags were set
          const tags = await OneSignal.User.getTags();
          console.log('[LanguageSelection] 📋 Current OneSignal tags:', JSON.stringify(tags, null, 2));
        } catch (tagError) {
          console.error('[LanguageSelection] ❌ Error setting OneSignal tag:', tagError);
        }
        
        // Mark that language has been selected (first launch complete)
        await storage.setHasSelectedLanguage(true);
        console.log('[LanguageSelection] ✅ First launch marked as complete');
        console.log('═══════════════════════════════════════════════════════════');
        
        // Callback to navigate to home
        if (onLanguageSelected) {
          onLanguageSelected(languageId);
        }
      }
    } catch (error) {
      console.error('[LanguageSelection] ❌ Error selecting language:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Logo/Icon Area */}
        <View style={styles.logoContainer}>
          <Ionicons name="globe-outline" size={80} color={COLORS.primary} />
          <Text style={styles.title}>Welcome to NationPress</Text>
          <Text style={styles.subtitle}>Please select your preferred language</Text>
        </View>

        {/* Language Options */}
        <View style={styles.languagesContainer}>
          {Object.values(LANGUAGES).map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageCard,
                selectedLanguage === language.id && styles.languageCardSelected
              ]}
              onPress={() => handleLanguageSelect(language.id)}
              activeOpacity={0.7}
            >
              <View style={styles.languageContent}>
                <Text style={[
                  styles.languageName,
                  selectedLanguage === language.id && styles.languageNameSelected
                ]}>
                  {language.name}
                </Text>
                <Text style={[
                  styles.languageLabel,
                  selectedLanguage === language.id && styles.languageLabelSelected
                ]}>
                  {language.label}
                </Text>
              </View>
              {selectedLanguage === language.id && (
                <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
              )}
              {selectedLanguage !== language.id && (
                <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Text */}
        <Text style={styles.infoText}>
          You can change your language preference anytime from the app settings
        </Text>
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  title: {
    fontSize: FONT_SIZES.title + 4,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: SPACING.lg,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  languagesContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: SPACING.xl,
  },
  languageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  languageCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  languageNameSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  languageLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
  },
  languageLabelSelected: {
    color: COLORS.primary,
  },
  infoText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
});

export default LanguageSelectionScreen;

