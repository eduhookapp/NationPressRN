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
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { storage } from '../utils/storage';
import { Linking } from 'react-native';

const AdvertiseScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [adType, setAdType] = useState('');
  const [budget, setBudget] = useState('');
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
      nameLabel: 'Full Name',
      companyLabel: 'Company Name',
      emailLabel: 'Email Address',
      phoneLabel: 'Phone Number',
      adTypeLabel: 'Advertising Type',
      budgetLabel: 'Advertising Budget',
      messageLabel: 'Additional Information',
      submitButton: 'Submit Request',
      contactEmail: 'contact@nationpress.com',
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
      nameLabel: 'पूरा नाम',
      companyLabel: 'कंपनी का नाम',
      emailLabel: 'ईमेल पता',
      phoneLabel: 'फोन नंबर',
      adTypeLabel: 'विज्ञापन प्रकार',
      budgetLabel: 'विज्ञापन बजट',
      messageLabel: 'अतिरिक्त जानकारी',
      submitButton: 'अनुरोध सबमिट करें',
      contactEmail: 'contact@nationpress.com',
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

  const handleSubmit = () => {
    if (!name.trim() || !company.trim() || !email.trim() || !phone.trim() || !adType || !budget || !message.trim()) {
      Alert.alert(
        isHindi ? 'त्रुटि' : 'Error',
        isHindi ? 'कृपया सभी फ़ील्ड भरें' : 'Please fill in all fields'
      );
      return;
    }

    // Create mailto link
    const subject = encodeURIComponent(`Advertising Inquiry - ${text.adTypeOptions.find(opt => opt.value === adType)?.label || adType}`);
    const body = encodeURIComponent(
      `Name: ${name}\n` +
      `Company: ${company}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n` +
      `Advertising Type: ${text.adTypeOptions.find(opt => opt.value === adType)?.label || adType}\n` +
      `Budget: ${text.budgetOptions.find(opt => opt.value === budget)?.label || budget}\n\n` +
      `Additional Information:\n${message}`
    );
    
    const mailtoLink = `mailto:${text.contactEmail}?subject=${subject}&body=${body}`;
    
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
          <View style={styles.form}>
            <Text style={styles.label}>{text.nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={text.nameLabel}
              placeholderTextColor={COLORS.textLight}
            />

            <Text style={styles.label}>{text.companyLabel}</Text>
            <TextInput
              style={styles.input}
              value={company}
              onChangeText={setCompany}
              placeholder={text.companyLabel}
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

            <Text style={styles.label}>{text.phoneLabel}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={text.phoneLabel}
              placeholderTextColor={COLORS.textLight}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>{text.adTypeLabel}</Text>
            <View style={styles.selectContainer}>
              {text.adTypeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    adType === option.value && styles.selectOptionSelected,
                  ]}
                  onPress={() => setAdType(option.value)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      adType === option.value && styles.selectOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{text.budgetLabel}</Text>
            <View style={styles.selectContainer}>
              {text.budgetOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.selectOption,
                    budget === option.value && styles.selectOptionSelected,
                  ]}
                  onPress={() => setBudget(option.value)}
                >
                  <Text
                    style={[
                      styles.selectOptionText,
                      budget === option.value && styles.selectOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{text.messageLabel}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder={text.messageLabel}
              placeholderTextColor={COLORS.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>{text.submitButton}</Text>
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
  form: {
    marginTop: SPACING.md,
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
    minHeight: 100,
    paddingTop: SPACING.md,
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  selectOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.xs,
  },
  selectOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectOptionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  selectOptionTextSelected: {
    color: COLORS.background,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  submitButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default AdvertiseScreen;

