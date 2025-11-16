import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, LANGUAGES } from '../config/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MenuModal = ({ visible, onClose, currentLanguage }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const domain = LANGUAGES[currentLanguage]?.domain || LANGUAGES.english.domain;

  useEffect(() => {
    if (visible) {
      // Slide in from left
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out to left
      Animated.timing(slideAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const menuItems = [
    {
      id: 'advertise',
      label: 'Advertise With Us',
      labelHindi: 'हमारे साथ विज्ञापन करें',
      icon: 'megaphone-outline',
      screen: 'Advertise',
    },
    {
      id: 'about',
      label: 'About Us',
      labelHindi: 'हमारे बारे में',
      icon: 'information-circle-outline',
      screen: 'About',
    },
    {
      id: 'contact',
      label: 'Contact Us',
      labelHindi: 'संपर्क करें',
      icon: 'mail-outline',
      screen: 'Contact',
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      labelHindi: 'गोपनीयता नीति',
      icon: 'lock-closed-outline',
      screen: 'Privacy',
    },
    {
      id: 'terms',
      label: 'Terms & Conditions',
      labelHindi: 'नियम और शर्तें',
      icon: 'document-text-outline',
      screen: 'Terms',
    },
    {
      id: 'disclaimer',
      label: 'Disclaimer',
      labelHindi: 'अस्वीकरण',
      icon: 'alert-circle-outline',
      screen: 'Disclaimer',
    },
    {
      id: 'cookie',
      label: 'Cookie Policy',
      labelHindi: 'कुकी नीति',
      icon: 'shield-outline',
      screen: 'CookiePolicy',
    },
  ];

  // Social links based on language
  const socialLinks = currentLanguage === 'hindi' ? [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://www.facebook.com/rashtrapress.hindi',
      color: '#1877F2',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://x.com/rashtra_press',
      color: '#1DA1F2',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      url: 'https://www.instagram.com/rashtra.press/',
      color: '#E4405F',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      url: 'https://www.linkedin.com/company/nation-press/',
      color: '#0077B5',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'logo-youtube',
      url: 'https://www.youtube.com/@NationPress_NP',
      color: '#FF0000',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: 'logo-pinterest',
      url: 'https://in.pinterest.com/nationpress/',
      color: '#BD081C',
    },
  ] : [
    {
      id: 'facebook',
      name: 'Facebook',
      icon: 'logo-facebook',
      url: 'https://www.facebook.com/np.nationpress',
      color: '#1877F2',
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: 'logo-twitter',
      url: 'https://x.com/np_nationpress',
      color: '#1DA1F2',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: 'logo-instagram',
      url: 'https://www.instagram.com/nationpress_np/',
      color: '#E4405F',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: 'logo-linkedin',
      url: 'https://www.linkedin.com/company/nation-press/',
      color: '#0077B5',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: 'logo-youtube',
      url: 'https://www.youtube.com/@NationPress_NP',
      color: '#FF0000',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      icon: 'logo-pinterest',
      url: 'https://in.pinterest.com/nationpress/',
      color: '#BD081C',
    },
  ];

  const handleMenuPress = (item) => {
    // Close menu first
    onClose();
    
    // Small delay to ensure menu closes smoothly
    setTimeout(() => {
      if (item.screen && router) {
        // Navigate to in-app screen using Expo Router
        try {
          // Map screen names to Expo Router paths
          const screenToPath = {
            'Advertise': '/advertise',
            'About': '/about',
            'Contact': '/contact',
            'Privacy': '/privacy',
            'Terms': '/terms',
            'Disclaimer': '/disclaimer',
            'CookiePolicy': '/cookie-policy',
          };
          
          const path = screenToPath[item.screen] || `/${item.screen.toLowerCase()}`;
          if (router && typeof router.push === 'function') {
            router.push(path);
          }
        } catch (error) {
          console.error('MenuModal: Error navigating:', error);
        }
      } else if (item.url) {
        // Fallback: open URL in browser (for social links)
        handleSocialLink(item.url);
      }
    }, 150);
  };

  const handleSocialLink = async (url) => {
    if (!url || typeof url !== 'string') {
      console.error('MenuModal: Invalid URL provided:', url);
      return;
    }

    try {
      // Validate URL format
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.error('MenuModal: Invalid URL format:', url);
        return;
      }

      // Open URL in browser
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Still try to open
        await Linking.openURL(url).catch((err) => {
          console.error('MenuModal: Failed to open URL:', err);
        });
      }
    } catch (error) {
      console.error('MenuModal: Error opening URL:', error);
    }
  };

  const getLabel = (item) => {
    return currentLanguage === 'hindi' ? item.labelHindi : item.label;
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View 
          style={[
            styles.modalContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <View style={[styles.header, { paddingTop: SPACING.md + insets.top }]}>
            <Text style={styles.headerTitle}>
              {currentLanguage === 'hindi' ? 'मेनू' : 'Menu'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Menu Items */}
            <View style={styles.section}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuPress(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name={item.icon} size={24} color={COLORS.primary} />
                  <Text style={styles.menuItemText}>{getLabel(item)}</Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={COLORS.textLight}
                    style={styles.chevron}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Social Links */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {currentLanguage === 'hindi' ? 'सोशल मीडिया' : 'Follow Us'}
              </Text>
              <View style={styles.socialContainer}>
                {socialLinks.map((social) => (
                  <TouchableOpacity
                    key={social.id}
                    style={styles.socialButton}
                    onPress={() => handleSocialLink(social.url)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={social.icon} size={28} color={social.color} />
                    <Text style={styles.socialLabel}>{social.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  modalContainer: {
    backgroundColor: COLORS.background,
    width: '80%',
    maxWidth: 320,
    height: '100%',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.textLight,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuItemText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginLeft: SPACING.md,
  },
  chevron: {
    marginLeft: SPACING.sm,
  },
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  socialButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});

export default MenuModal;

