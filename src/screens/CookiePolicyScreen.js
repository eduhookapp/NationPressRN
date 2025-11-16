import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { storage } from '../utils/storage';

const CookiePolicyScreen = () => {
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
      title: 'Cookie Policy',
      lastUpdated: 'Last Updated: January 2024',
      whatAre: '1. What Are Cookies',
      whatAreText: 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide a better user experience.',
      howWeUse: '2. How We Use Cookies',
      howWeUseText: 'We use cookies for the following purposes:\n\n• Essential Cookies: Required for the app to function properly\n• Analytics Cookies: Help us understand how visitors interact with our app\n• Functionality Cookies: Remember your preferences and settings\n• Advertising Cookies: Used to deliver relevant advertisements',
      types: '3. Types of Cookies We Use',
      typesText: 'We use the following types of cookies:\n\n• Session Cookies: Temporary cookies that expire when you close your browser\n• Persistent Cookies: Remain on your device for a set period of time\n• First-party Cookies: Set by our app\n• Third-party Cookies: Set by other websites or services',
      managing: '4. Managing Cookies',
      managingText: 'You can control and/or delete cookies as you wish. You can delete all cookies that are already on your device and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit our app and some services and functionalities may not work.',
      thirdParty: '5. Third-Party Cookies',
      thirdPartyText: 'We use third-party services that may set cookies on your device. These include:\n\n• Google Analytics\n• Social media plugins\n• Advertising networks',
      contact: '6. Contact Us',
      contactText: 'If you have any questions about our use of cookies, please contact us at:',
      email: 'contact@nationpress.com',
    },
    hindi: {
      title: 'कुकी नीति',
      lastUpdated: 'अंतिम अपडेट: जनवरी 2024',
      whatAre: '1. कुकीज़ क्या हैं',
      whatAreText: 'कुकीज़ छोटी टेक्स्ट फ़ाइलें हैं जो आपके कंप्यूटर या मोबाइल डिवाइस पर रखी जाती हैं जब आप किसी वेबसाइट पर जाते हैं। वे वेबसाइटों को अधिक कुशलता से काम करने और बेहतर उपयोगकर्ता अनुभव प्रदान करने के लिए व्यापक रूप से उपयोग की जाती हैं।',
      howWeUse: '2. हम कुकीज़ का उपयोग कैसे करते हैं',
      howWeUseText: 'हम निम्नलिखित उद्देश्यों के लिए कुकीज़ का उपयोग करते हैं:\n\n• आवश्यक कुकीज़: ऐप के सही ढंग से काम करने के लिए आवश्यक\n• विश्लेषण कुकीज़: हमें यह समझने में मदद करती हैं कि आगंतुक हमारे ऐप के साथ कैसे बातचीत करते हैं\n• कार्यक्षमता कुकीज़: आपकी प्राथमिकताओं और सेटिंग्स को याद रखती हैं\n• विज्ञापन कुकीज़: प्रासंगिक विज्ञापन देने के लिए उपयोग की जाती हैं',
      types: '3. हम जिन प्रकार की कुकीज़ का उपयोग करते हैं',
      typesText: 'हम निम्नलिखित प्रकार की कुकीज़ का उपयोग करते हैं:\n\n• सत्र कुकीज़: अस्थायी कुकीज़ जो आपके ब्राउज़र को बंद करने पर समाप्त हो जाती हैं\n• लगातार कुकीज़: एक निर्धारित अवधि के लिए आपके डिवाइस पर रहती हैं\n• प्रथम-पक्ष कुकीज़: हमारे ऐप द्वारा सेट की गई\n• तृतीय-पक्ष कुकीज़: अन्य वेबसाइटों या सेवाओं द्वारा सेट की गई',
      managing: '4. कुकीज़ प्रबंधन',
      managingText: 'आप अपनी इच्छानुसार कुकीज़ को नियंत्रित और/या हटा सकते हैं। आप अपने डिवाइस पर पहले से मौजूद सभी कुकीज़ को हटा सकते हैं और आप अधिकांश ब्राउज़रों को उन्हें रखने से रोकने के लिए सेट कर सकते हैं। हालाँकि, यदि आप ऐसा करते हैं, तो आपको हर बार हमारे ऐप पर जाने पर कुछ प्राथमिकताओं को मैन्युअल रूप से समायोजित करना पड़ सकता है और कुछ सेवाएँ और कार्यक्षमताएँ काम नहीं कर सकती हैं।',
      thirdParty: '5. तृतीय-पक्ष कुकीज़',
      thirdPartyText: 'हम तृतीय-पक्ष सेवाओं का उपयोग करते हैं जो आपके डिवाइस पर कुकीज़ सेट कर सकती हैं। इनमें शामिल हैं:\n\n• Google Analytics\n• सोशल मीडिया प्लगइन्स\n• विज्ञापन नेटवर्क',
      contact: '6. संपर्क करें',
      contactText: 'यदि कुकीज़ के उपयोग के बारे में आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें:',
      email: 'contact@nationpress.com',
    },
  };

  const text = content[currentLanguage] || content.english;

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
          <Text style={styles.lastUpdated}>{text.lastUpdated}</Text>

          <Text style={styles.sectionTitle}>{text.whatAre}</Text>
          <Text style={styles.paragraph}>{text.whatAreText}</Text>

          <Text style={styles.sectionTitle}>{text.howWeUse}</Text>
          <Text style={styles.paragraph}>{text.howWeUseText}</Text>

          <Text style={styles.sectionTitle}>{text.types}</Text>
          <Text style={styles.paragraph}>{text.typesText}</Text>

          <Text style={styles.sectionTitle}>{text.managing}</Text>
          <Text style={styles.paragraph}>{text.managingText}</Text>

          <Text style={styles.sectionTitle}>{text.thirdParty}</Text>
          <Text style={styles.paragraph}>{text.thirdPartyText}</Text>

          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>{text.contact}</Text>
            <Text style={styles.paragraph}>{text.contactText}</Text>
            <Text style={styles.email}>{text.email}</Text>
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
  lastUpdated: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  paragraph: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  contactSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  email: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: SPACING.sm,
  },
});

export default CookiePolicyScreen;

