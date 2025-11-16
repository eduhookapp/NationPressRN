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

const PrivacyScreen = () => {
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
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: January 2024',
      intro: 'Welcome to NationPress. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our app and tell you about your privacy rights and how the law protects you.',
      dataCollection: 'Data We Collect',
      dataCollectionText: 'We may collect, use, store and transfer different kinds of personal data about you, including:\n\n• Identity Data (name, username)\n• Contact Data (email address)\n• Technical Data (device information, IP address)\n• Usage Data (how you use our app)',
      howWeUse: 'How We Use Your Data',
      howWeUseText: 'We use your personal data for the following purposes:\n\n• To provide and maintain our service\n• To notify you about changes to our service\n• To provide customer support\n• To gather analysis or valuable information to improve our service\n• To monitor the usage of our service',
      dataSecurity: 'Data Security',
      dataSecurityText: 'We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.',
      yourRights: 'Your Rights',
      yourRightsText: 'You have the right to:\n\n• Access your personal data\n• Correct inaccurate data\n• Request deletion of your data\n• Object to processing of your data\n• Request data portability',
      contact: 'Contact Us',
      contactText: 'If you have any questions about this privacy policy or our privacy practices, please contact us at:',
      email: 'contact@nationpress.com',
    },
    hindi: {
      title: 'गोपनीयता नीति',
      lastUpdated: 'अंतिम अपडेट: जनवरी 2024',
      intro: 'राष्ट्र प्रेस में आपका स्वागत है। हम आपकी गोपनीयता का सम्मान करते हैं और आपके व्यक्तिगत डेटा की सुरक्षा के लिए प्रतिबद्ध हैं। यह गोपनीयता नीति आपको सूचित करेगी कि जब आप हमारे ऐप पर जाते हैं तो हम आपके व्यक्तिगत डेटा की देखभाल कैसे करते हैं और आपको आपके गोपनीयता अधिकारों और कानून आपकी सुरक्षा कैसे करता है, इसके बारे में बताएगी।',
      dataCollection: 'हम कौन सा डेटा एकत्र करते हैं',
      dataCollectionText: 'हम आपके बारे में विभिन्न प्रकार के व्यक्तिगत डेटा एकत्र, उपयोग, संग्रहीत और स्थानांतरित कर सकते हैं, जिसमें शामिल हैं:\n\n• पहचान डेटा (नाम, उपयोगकर्ता नाम)\n• संपर्क डेटा (ईमेल पता)\n• तकनीकी डेटा (डिवाइस जानकारी, आईपी पता)\n• उपयोग डेटा (आप हमारे ऐप का उपयोग कैसे करते हैं)',
      howWeUse: 'हम आपके डेटा का उपयोग कैसे करते हैं',
      howWeUseText: 'हम आपके व्यक्तिगत डेटा का उपयोग निम्नलिखित उद्देश्यों के लिए करते हैं:\n\n• हमारी सेवा प्रदान करने और बनाए रखने के लिए\n• हमारी सेवा में परिवर्तन के बारे में आपको सूचित करने के लिए\n• ग्राहक सहायता प्रदान करने के लिए\n• हमारी सेवा में सुधार के लिए विश्लेषण या मूल्यवान जानकारी एकत्र करने के लिए\n• हमारी सेवा के उपयोग की निगरानी करने के लिए',
      dataSecurity: 'डेटा सुरक्षा',
      dataSecurityText: 'हम आपके व्यक्तिगत डेटा को अनधिकृत पहुंच, परिवर्तन, प्रकटीकरण या विनाश से बचाने के लिए उपयुक्त तकनीकी और संगठनात्मक उपाय लागू करते हैं।',
      yourRights: 'आपके अधिकार',
      yourRightsText: 'आपको निम्नलिखित अधिकार हैं:\n\n• अपने व्यक्तिगत डेटा तक पहुंच\n• गलत डेटा को सही करना\n• अपने डेटा को हटाने का अनुरोध\n• अपने डेटा के प्रसंस्करण पर आपत्ति\n• डेटा पोर्टेबिलिटी का अनुरोध',
      contact: 'संपर्क करें',
      contactText: 'यदि इस गोपनीयता नीति या हमारी गोपनीयता प्रथाओं के बारे में आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें:',
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
          <Text style={styles.paragraph}>{text.intro}</Text>

          <Text style={styles.sectionTitle}>{text.dataCollection}</Text>
          <Text style={styles.paragraph}>{text.dataCollectionText}</Text>

          <Text style={styles.sectionTitle}>{text.howWeUse}</Text>
          <Text style={styles.paragraph}>{text.howWeUseText}</Text>

          <Text style={styles.sectionTitle}>{text.dataSecurity}</Text>
          <Text style={styles.paragraph}>{text.dataSecurityText}</Text>

          <Text style={styles.sectionTitle}>{text.yourRights}</Text>
          <Text style={styles.paragraph}>{text.yourRightsText}</Text>

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

export default PrivacyScreen;

