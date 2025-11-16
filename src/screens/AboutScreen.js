import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { COLORS, SPACING, FONT_SIZES, LANGUAGES } from '../config/constants';
import { storage } from '../utils/storage';

const AboutScreen = () => {
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

  const isHindi = currentLanguage === 'hindi';

  const content = {
    english: {
      title: 'About Us',
      heading: 'About NationPress',
      description: 'NationPress is committed to delivering high-quality journalism and keeping our readers informed about the latest developments across various sectors. Our team of experienced journalists and editors work tirelessly to bring you accurate and unbiased news coverage.',
      mission: 'Our Mission',
      missionText: 'To provide reliable, timely, and comprehensive news coverage that empowers our readers to make informed decisions. We strive to maintain the highest standards of journalistic integrity and ethical reporting.',
      vision: 'Our Vision',
      visionText: 'To become the most trusted source of news and information, fostering an informed and engaged community that values truth, transparency, and accountability.',
      team: 'Our Team',
      teamText: 'Our team consists of experienced journalists, editors, and content creators who are passionate about delivering the news that matters. We work around the clock to bring you the most relevant and up-to-date information.',
      contact: 'Contact Us',
      contactText: 'For any queries or feedback, please contact us at:',
      email: 'contact@nationpress.com',
    },
    hindi: {
      title: 'हमारे बारे में',
      heading: 'राष्ट्र प्रेस के बारे में',
      description: 'राष्ट्र प्रेस उच्च गुणवत्ता वाली पत्रकारिता प्रदान करने और विभिन्न क्षेत्रों में नवीनतम घटनाओं के बारे में अपने पाठकों को सूचित रखने के लिए प्रतिबद्ध है। हमारी अनुभवी पत्रकारों और संपादकों की टीम आपके लिए सटीक और निष्पक्ष समाचार कवरेज लाने के लिए अथक प्रयास करती है।',
      mission: 'हमारा मिशन',
      missionText: 'विश्वसनीय, समय पर और व्यापक समाचार कवरेज प्रदान करना जो हमारे पाठकों को सूचित निर्णय लेने में सक्षम बनाता है। हम पत्रकारिता की अखंडता और नैतिक रिपोर्टिंग के उच्चतम मानकों को बनाए रखने का प्रयास करते हैं।',
      vision: 'हमारी दृष्टि',
      visionText: 'समाचार और सूचना का सबसे विश्वसनीय स्रोत बनना, एक सूचित और सक्रिय समुदाय को बढ़ावा देना जो सत्य, पारदर्शिता और जवाबदेही को महत्व देता है।',
      team: 'हमारी टीम',
      teamText: 'हमारी टीम में अनुभवी पत्रकार, संपादक और सामग्री निर्माता शामिल हैं जो महत्वपूर्ण समाचार प्रदान करने के बारे में भावुक हैं। हम आपके लिए सबसे प्रासंगिक और नवीनतम जानकारी लाने के लिए चौबीसों घंटे काम करते हैं।',
      contact: 'संपर्क करें',
      contactText: 'किसी भी प्रश्न या प्रतिक्रिया के लिए, कृपया हमसे संपर्क करें:',
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
          <Text style={styles.heading}>{text.heading}</Text>
          <Text style={styles.description}>{text.description}</Text>

          <Text style={styles.sectionTitle}>{text.mission}</Text>
          <Text style={styles.paragraph}>{text.missionText}</Text>

          <Text style={styles.sectionTitle}>{text.vision}</Text>
          <Text style={styles.paragraph}>{text.visionText}</Text>

          <Text style={styles.sectionTitle}>{text.team}</Text>
          <Text style={styles.paragraph}>{text.teamText}</Text>

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
  heading: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
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
  paragraph: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
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

export default AboutScreen;

