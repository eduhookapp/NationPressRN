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

const DisclaimerScreen = () => {
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
      title: 'Disclaimer',
      lastUpdated: 'Last Updated: January 2024',
      contentAccuracy: '1. Content Accuracy',
      contentAccuracyText: 'The information provided on NationPress is for general informational purposes only. While we strive to keep the information up-to-date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the app or the information, products, services, or related graphics contained in the app.',
      professionalAdvice: '2. Professional Advice',
      professionalAdviceText: 'The content on this app is not intended to be a substitute for professional advice. Always seek the advice of qualified professionals regarding any questions you may have about a particular subject. Never disregard professional advice or delay in seeking it because of something you have read on this app.',
      externalLinks: '3. External Links',
      externalLinksText: 'Our app may contain links to external websites that are not provided or maintained by or in any way affiliated with NationPress. Please note that we do not guarantee the accuracy, relevance, timeliness, or completeness of any information on these external websites.',
      limitation: '4. Limitation of Liability',
      limitationText: 'In no event will NationPress be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this app.',
      contentChanges: '5. Content Changes',
      contentChangesText: 'We reserve the right to make additions, deletions, or modifications to the contents of the app at any time without prior notice. We do not warrant that the app is free of viruses or other harmful components.',
      contact: '6. Contact Us',
      contactText: 'If you have any questions about this disclaimer, please contact us at:',
      email: 'contact@nationpress.com',
    },
    hindi: {
      title: 'अस्वीकरण',
      lastUpdated: 'अंतिम अपडेट: जनवरी 2024',
      contentAccuracy: '1. सामग्री की सटीकता',
      contentAccuracyText: 'राष्ट्र प्रेस पर प्रदान की गई जानकारी केवल सामान्य सूचनात्मक उद्देश्यों के लिए है। जबकि हम जानकारी को अद्यतन और सही रखने का प्रयास करते हैं, हम ऐप या ऐप में निहित जानकारी, उत्पादों, सेवाओं या संबंधित ग्राफिक्स की पूर्णता, सटीकता, विश्वसनीयता, उपयुक्तता या उपलब्धता के बारे में किसी भी प्रकार की कोई प्रतिनिधित्व या वारंटी नहीं देते हैं, व्यक्त या निहित।',
      professionalAdvice: '2. पेशेवर सलाह',
      professionalAdviceText: 'इस ऐप पर सामग्री पेशेवर सलाह के विकल्प के रूप में नहीं है। किसी विशेष विषय के बारे में आपके कोई प्रश्न होने पर हमेशा योग्य पेशेवरों की सलाह लें। इस ऐप पर पढ़ी गई किसी चीज़ के कारण पेशेवर सलाह को नज़रअंदाज़ न करें या उसे लेने में देरी न करें।',
      externalLinks: '3. बाहरी लिंक',
      externalLinksText: 'हमारे ऐप में बाहरी वेबसाइटों के लिंक हो सकते हैं जो राष्ट्र प्रेस द्वारा प्रदान या बनाए नहीं गए हैं या किसी भी तरह से संबद्ध नहीं हैं। कृपया ध्यान दें कि हम इन बाहरी वेबसाइटों पर किसी भी जानकारी की सटीकता, प्रासंगिकता, समयबद्धता या पूर्णता की गारंटी नहीं देते हैं।',
      limitation: '4. देयता की सीमा',
      limitationText: 'किसी भी स्थिति में राष्ट्र प्रेस किसी भी नुकसान या क्षति के लिए उत्तरदायी नहीं होगा, जिसमें बिना सीमा के, अप्रत्यक्ष या परिणामी नुकसान या क्षति, या इस ऐप के उपयोग से उत्पन्न या उससे जुड़े डेटा या लाभ के नुकसान से उत्पन्न होने वाला कोई भी नुकसान या क्षति शामिल है।',
      contentChanges: '5. सामग्री में परिवर्तन',
      contentChangesText: 'हम बिना पूर्व सूचना के किसी भी समय ऐप की सामग्री में जोड़, हटाने या संशोधन करने का अधिकार सुरक्षित रखते हैं। हम यह वारंटी नहीं देते कि ऐप वायरस या अन्य हानिकारक घटकों से मुक्त है।',
      contact: '6. संपर्क करें',
      contactText: 'यदि इस अस्वीकरण के बारे में आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें:',
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

          <Text style={styles.sectionTitle}>{text.contentAccuracy}</Text>
          <Text style={styles.paragraph}>{text.contentAccuracyText}</Text>

          <Text style={styles.sectionTitle}>{text.professionalAdvice}</Text>
          <Text style={styles.paragraph}>{text.professionalAdviceText}</Text>

          <Text style={styles.sectionTitle}>{text.externalLinks}</Text>
          <Text style={styles.paragraph}>{text.externalLinksText}</Text>

          <Text style={styles.sectionTitle}>{text.limitation}</Text>
          <Text style={styles.paragraph}>{text.limitationText}</Text>

          <Text style={styles.sectionTitle}>{text.contentChanges}</Text>
          <Text style={styles.paragraph}>{text.contentChangesText}</Text>

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

export default DisclaimerScreen;

