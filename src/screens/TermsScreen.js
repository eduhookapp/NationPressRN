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

const TermsScreen = () => {
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
      title: 'Terms & Conditions',
      lastUpdated: 'Last Updated: January 2024',
      acceptance: '1. Acceptance of Terms',
      acceptanceText: 'By accessing and using NationPress, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this app.',
      useLicense: '2. Use License',
      useLicenseText: 'Permission is granted to temporarily download one copy of the materials on NationPress for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:\n\n• Modify or copy the materials\n• Use the materials for any commercial purpose\n• Attempt to decompile or reverse engineer any software\n• Remove any copyright or other proprietary notations',
      disclaimer: '3. Disclaimer',
      disclaimerText: 'The materials on NationPress are provided on an "as is" basis. NationPress makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
      limitations: '4. Limitations',
      limitationsText: 'In no event shall NationPress or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on NationPress.',
      revisions: '5. Revisions',
      revisionsText: 'NationPress may revise these terms of service for its app at any time without notice. By using this app you are agreeing to be bound by the then current version of these terms of service.',
      contact: '6. Contact Us',
      contactText: 'If you have any questions about these Terms and Conditions, please contact us at:',
      email: 'contact@nationpress.com',
    },
    hindi: {
      title: 'नियम और शर्तें',
      lastUpdated: 'अंतिम अपडेट: जनवरी 2024',
      acceptance: '1. नियमों की स्वीकृति',
      acceptanceText: 'राष्ट्र प्रेस तक पहुंचने और उपयोग करने से, आप इस समझौते की शर्तों और प्रावधानों से बाध्य होने को स्वीकार करते हैं और सहमत होते हैं। यदि आप उपरोक्त का पालन करने के लिए सहमत नहीं हैं, तो कृपया इस ऐप का उपयोग न करें।',
      useLicense: '2. उपयोग लाइसेंस',
      useLicenseText: 'राष्ट्र प्रेस पर सामग्री की एक प्रति को अस्थायी रूप से केवल व्यक्तिगत, गैर-व्यावसायिक अस्थायी देखने के लिए डाउनलोड करने की अनुमति दी गई है। यह शीर्षक का हस्तांतरण नहीं है, बल्कि लाइसेंस का अनुदान है, और इस लाइसेंस के तहत आप नहीं कर सकते:\n\n• सामग्री को संशोधित या कॉपी करना\n• किसी भी व्यावसायिक उद्देश्य के लिए सामग्री का उपयोग करना\n• किसी भी सॉफ़्टवेयर को डीकंपाइल या रिवर्स इंजीनियर करने का प्रयास करना\n• किसी भी कॉपीराइट या अन्य मालिकाना नोटेशन को हटाना',
      disclaimer: '3. अस्वीकरण',
      disclaimerText: 'राष्ट्र प्रेस पर सामग्री "जैसी है" के आधार पर प्रदान की जाती है। राष्ट्र प्रेस कोई वारंटी नहीं देता है, व्यक्त या निहित, और यहां सभी अन्य वारंटी को अस्वीकार करता है और नकारता है, जिसमें बिना सीमा के, निहित वारंटी या व्यापारिकता की शर्तें, किसी विशेष उद्देश्य के लिए फिटनेस, या बौद्धिक संपदा का उल्लंघन या अधिकारों का अन्य उल्लंघन शामिल है।',
      limitations: '4. सीमाएं',
      limitationsText: 'किसी भी स्थिति में राष्ट्र प्रेस या उसके आपूर्तिकर्ता राष्ट्र प्रेस पर सामग्री के उपयोग या असमर्थता के कारण उत्पन्न होने वाले किसी भी नुकसान (बिना सीमा के, डेटा या लाभ के नुकसान के लिए नुकसान, या व्यावसायिक व्यवधान के कारण) के लिए उत्तरदायी नहीं होंगे।',
      revisions: '5. संशोधन',
      revisionsText: 'राष्ट्र प्रेस बिना किसी सूचना के अपने ऐप के लिए इन सेवा की शर्तों को किसी भी समय संशोधित कर सकता है। इस ऐप का उपयोग करके, आप इन सेवा की शर्तों के तत्कालीन वर्तमान संस्करण से बाध्य होने के लिए सहमत हो रहे हैं।',
      contact: '6. संपर्क करें',
      contactText: 'यदि इन नियमों और शर्तों के बारे में आपके कोई प्रश्न हैं, तो कृपया हमसे संपर्क करें:',
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

          <Text style={styles.sectionTitle}>{text.acceptance}</Text>
          <Text style={styles.paragraph}>{text.acceptanceText}</Text>

          <Text style={styles.sectionTitle}>{text.useLicense}</Text>
          <Text style={styles.paragraph}>{text.useLicenseText}</Text>

          <Text style={styles.sectionTitle}>{text.disclaimer}</Text>
          <Text style={styles.paragraph}>{text.disclaimerText}</Text>

          <Text style={styles.sectionTitle}>{text.limitations}</Text>
          <Text style={styles.paragraph}>{text.limitationsText}</Text>

          <Text style={styles.sectionTitle}>{text.revisions}</Text>
          <Text style={styles.paragraph}>{text.revisionsText}</Text>

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

export default TermsScreen;

