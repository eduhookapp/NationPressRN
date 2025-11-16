import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { storage } from '../utils/storage';
import { Linking } from 'react-native';

const AdvertiseScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentLanguage, setCurrentLanguage] = useState('english');

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

    const interval = setInterval(async () => {
      const language = await storage.getLanguage();
      if (language !== currentLanguage) {
        setCurrentLanguage(language || 'english');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentLanguage]);

  const content = {
    english: {
      title: 'Advertise With Us',
      heading: 'Reach millions of engaged readers through NationPress advertising solutions.',
      whyTitle: 'Why Advertise With NationPress?',
      whyPoints: [
        'Reach a large and engaged audience',
        'Targeted advertising solutions',
        'Multiple ad formats available',
        'Detailed analytics and reporting',
        'Dedicated account management',
      ],
      optionsTitle: 'Advertising Options',
      displayTitle: 'Display Advertising',
      displayOptions: ['Banner ads', 'Native advertising', 'Sponsored content', 'Video ads'],
      newsletterTitle: 'Newsletter Advertising',
      newsletterOptions: ['Sponsored emails', 'Newsletter banners', 'Dedicated campaigns', 'Custom solutions'],
      contactTitle: 'Contact Our Advertising Team',
      contactEmail: 'corpcom@nationpress.com',
      emailLabel: 'Email us at:',
      adTypeOptions: [
        { value: 'display', label: 'Display Advertising' },
        { value: 'newsletter', label: 'Newsletter Advertising' },
        { value: 'sponsored', label: 'Sponsored Content' },
        { value: 'other', label: 'Other' },
      ],
      budgetOptions: [
        { value: '1000-5000', label: '$1,000 - $5,000' },
        { value: '5000-10000', label: '$5,000 - $10,000' },
        { value: '10000-25000', label: '$10,000 - $25,000' },
        { value: '25000+', label: '$25,000+' },
      ],
    },
    hindi: {
      title: 'हमारे साथ विज्ञापन करें',
      heading: 'NationPress के विज्ञापन समाधानों के माध्यम से लाखों जुड़े हुए पाठकों तक पहुंचें।',
      whyTitle: 'NationPress के साथ विज्ञापन क्यों करें?',
      whyPoints: [
        'बड़े और जुड़े हुए दर्शकों तक पहुंच',
        'लक्षित विज्ञापन समाधान',
        'कई विज्ञापन प्रारूप उपलब्ध',
        'विस्तृत विश्लेषण और रिपोर्टिंग',
        'समर्पित खाता प्रबंधन',
      ],
      optionsTitle: 'विज्ञापन विकल्प',
      displayTitle: 'डिस्प्ले विज्ञापन',
      displayOptions: ['बैनर विज्ञापन', 'नेटिव विज्ञापन', 'प्रायोजित सामग्री', 'वीडियो विज्ञापन'],
      newsletterTitle: 'न्यूज़लेटर विज्ञापन',
      newsletterOptions: ['प्रायोजित ईमेल', 'न्यूज़लेटर बैनर', 'समर्पित अभियान', 'कस्टम समाधान'],
      contactTitle: 'हमारी विज्ञापन टीम से संपर्क करें',
      contactEmail: 'corpcom@nationpress.com',
      emailLabel: 'हमें ईमेल करें:',
      adTypeOptions: [
        { value: 'display', label: 'डिस्प्ले विज्ञापन' },
        { value: 'newsletter', label: 'न्यूज़लेटर विज्ञापन' },
        { value: 'sponsored', label: 'प्रायोजित सामग्री' },
        { value: 'other', label: 'अन्य' },
      ],
      budgetOptions: [
        { value: '1000-5000', label: '$1,000 - $5,000' },
        { value: '5000-10000', label: '$5,000 - $10,000' },
        { value: '10000-25000', label: '$10,000 - $25,000' },
        { value: '25000+', label: '$25,000+' },
      ],
    },
  };

  const text = content[currentLanguage] || content.english;

  const handleEmailPress = () => {
    const mailtoLink = `mailto:${text.contactEmail}`;
    Linking.openURL(mailtoLink).catch((err) => {
      console.error('Error opening email client:', err);
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={text.title}
        onBack={() => {
          if (router && typeof router.back === 'function') {
            router.back();
          } else if (router && typeof router.replace === 'function') {
            router.replace('/(tabs)');
          }
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: SPACING.lg + insets.bottom }]}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.content}>
          <Text style={styles.heading}>{text.heading}</Text>

          <Text style={styles.sectionTitle}>{text.whyTitle}</Text>
          <View style={styles.pointsContainer}>
            {text.whyPoints.map((point, index) => (
              <View key={index} style={styles.pointItem}>
                <Text style={styles.pointBullet}>•</Text>
                <Text style={styles.pointText}>{point}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>{text.optionsTitle}</Text>
          <View style={styles.optionsContainer}>
            <View style={styles.optionCard}>
              <Text style={styles.optionTitle}>{text.displayTitle}</Text>
              {text.displayOptions.map((option, index) => (
                <Text key={index} style={styles.optionItem}>• {option}</Text>
              ))}
            </View>
            <View style={styles.optionCard}>
              <Text style={styles.optionTitle}>{text.newsletterTitle}</Text>
              {text.newsletterOptions.map((option, index) => (
                <Text key={index} style={styles.optionItem}>• {option}</Text>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>{text.contactTitle}</Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailLabel}>{text.emailLabel}</Text>
            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailPress}
              activeOpacity={0.7}
            >
              <Text style={styles.emailText}>{text.contactEmail}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    padding: SPACING.lg,
  },
  content: {
    flex: 1,
  },
  heading: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  pointsContainer: {
    marginBottom: SPACING.lg,
  },
  pointItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  pointBullet: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    fontWeight: '700',
  },
  pointText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  optionsContainer: {
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  optionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  optionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  optionItem: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 20,
  },
  emailContainer: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emailLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  emailButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  emailText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default AdvertiseScreen;

