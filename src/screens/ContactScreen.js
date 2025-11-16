import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Header from '../components/Header';
import { COLORS, SPACING, FONT_SIZES, LANGUAGES } from '../config/constants';
import { storage } from '../utils/storage';
import { Linking } from 'react-native';

const ContactScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

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
      title: 'Contact Us',
      heading: 'Get in Touch',
      description: 'We would love to hear from you. Send us a message and we will respond as soon as possible.',
      nameLabel: 'Name',
      emailLabel: 'Email',
      subjectLabel: 'Subject',
      messageLabel: 'Message',
      sendButton: 'Send Message',
      contactInfo: 'Contact Information',
      email: 'contact@nationpress.com',
      phone: '+91-7588866643',
    },
    hindi: {
      title: 'संपर्क करें',
      heading: 'हमसे संपर्क करें',
      description: 'हम आपसे सुनना पसंद करेंगे। हमें एक संदेश भेजें और हम जल्द से जल्द जवाब देंगे।',
      nameLabel: 'नाम',
      emailLabel: 'ईमेल',
      subjectLabel: 'विषय',
      messageLabel: 'संदेश',
      sendButton: 'संदेश भेजें',
      contactInfo: 'संपर्क जानकारी',
      email: 'contact@nationpress.com',
      phone: '+91-7588866643',
    },
  };

  const text = content[currentLanguage] || content.english;

  const handleSend = () => {
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill in all fields'
      );
      return;
    }

    // Create mailto link
    const mailtoLink = `mailto:${text.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
    
    Linking.openURL(mailtoLink).catch((err) => {
      console.error('Error opening email client:', err);
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'ईमेल क्लाइंट खोलने में त्रुटि' : 'Error opening email client'
      );
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

          <View style={styles.form}>
            <Text style={styles.label}>{text.nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={text.nameLabel}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>{text.emailLabel}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder={text.emailLabel}
              placeholderTextColor={COLORS.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>{text.subjectLabel}</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder={text.subjectLabel}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>{text.messageLabel}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder={text.messageLabel}
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSend}
              activeOpacity={0.8}
            >
              <Text style={styles.sendButtonText}>{text.sendButton}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactInfo}>
            <Text style={styles.sectionTitle}>{text.contactInfo}</Text>
            <Text style={styles.infoText}>{text.email}</Text>
            <Text style={styles.infoText}>{text.phone}</Text>
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
  form: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    paddingTop: SPACING.md,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  sendButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  contactInfo: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
});

export default ContactScreen;

