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

const ContactScreen = () => {
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
      title: 'Contact Us',
      heading: 'Get in Touch',
      description: 'We would love to hear from you. Send us an email and we will respond as soon as possible.',
      contactInfo: 'Contact Information',
      email: 'contact@nationpress.com',
      phone: '+91-7588866643',
      emailLabel: 'Email us at:',
      phoneLabel: 'Call or WhatsApp us:',
    },
    hindi: {
      title: 'संपर्क करें',
      heading: 'हमसे संपर्क करें',
      description: 'हम आपसे सुनना पसंद करेंगे। हमें एक ईमेल भेजें और हम जल्द से जल्द जवाब देंगे।',
      contactInfo: 'संपर्क जानकारी',
      email: 'contact@nationpress.com',
      phone: '+91-7588866643',
      emailLabel: 'हमें ईमेल करें:',
      phoneLabel: 'हमें कॉल करें या WhatsApp करें:',
    },
  };

  const text = content[currentLanguage] || content.english;

  const handleEmailPress = () => {
    const mailtoLink = `mailto:${text.email}`;
    Linking.openURL(mailtoLink).catch((err) => {
      console.error('Error opening email client:', err);
    });
  };

  const handlePhonePress = () => {
    // Remove dashes and spaces from phone number for WhatsApp
    const phoneNumber = text.phone.replace(/[\s-]/g, '');
    // WhatsApp deep link format: https://wa.me/PHONENUMBER (without +)
    const whatsappNumber = phoneNumber.replace('+', '');
    const whatsappLink = `https://wa.me/${whatsappNumber}`;
    
    Linking.openURL(whatsappLink).catch((err) => {
      console.error('Error opening WhatsApp:', err);
      // Fallback to tel: link if WhatsApp is not available
      const telLink = `tel:${phoneNumber}`;
      Linking.openURL(telLink).catch((telErr) => {
        console.error('Error opening phone dialer:', telErr);
      });
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
          <Text style={styles.description}>{text.description}</Text>

          <View style={styles.contactInfo}>
            <Text style={styles.sectionTitle}>{text.contactInfo}</Text>
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>{text.emailLabel}</Text>
              <TouchableOpacity
                style={styles.emailButton}
                onPress={handleEmailPress}
                activeOpacity={0.7}
              >
                <Text style={styles.emailText}>{text.email}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.phoneContainer}>
              <Text style={styles.phoneLabel}>{text.phoneLabel}</Text>
              <TouchableOpacity
                style={styles.phoneButton}
                onPress={handlePhonePress}
                activeOpacity={0.7}
              >
                <Text style={styles.phoneText}>{text.phone}</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  contactInfo: {
    marginTop: SPACING.xl,
  },
  emailContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
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
  phoneContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  phoneLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  phoneButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  phoneText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
});

export default ContactScreen;

