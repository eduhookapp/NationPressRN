import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import LanguageSelector from './LanguageSelector';
import MenuModal from './MenuModal';
import { storage } from '../utils/storage';

const Header = ({ title, onBack, rightAction, rightIcon, onSearch, showLanguageSelector = false, onLanguageChange, rightActions = [] }) => {
  const [menuVisible, setMenuVisible] = useState(false);
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

    // Listen for language changes
    const interval = setInterval(async () => {
      const language = await storage.getLanguage();
      if (language !== currentLanguage) {
        setCurrentLanguage(language || 'english');
      }
    }, 500);

    return () => clearInterval(interval);
  }, [currentLanguage]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Left side: Back button or Hamburger menu */}
        <View style={styles.leftSection}>
          {onBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setMenuVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* Center: Title or Language Selector */}
        <View style={styles.centerSection}>
          {showLanguageSelector ? (
            <LanguageSelector onLanguageChange={onLanguageChange} />
          ) : (
            title && (
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            )
          )}
        </View>

        {/* Right side: Actions */}
        <View style={styles.rightActions}>
          {onSearch && (
            <TouchableOpacity
              style={styles.rightButton}
              onPress={onSearch}
              activeOpacity={0.7}
            >
              <Ionicons name="search-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          )}
          {rightActions.length > 0 ? (
            rightActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.rightButton}
                onPress={action.onPress}
                activeOpacity={0.7}
              >
                <Ionicons name={action.icon} size={24} color={COLORS.text} />
              </TouchableOpacity>
            ))
          ) : (
            rightAction && (
              <TouchableOpacity
                style={styles.rightButton}
                onPress={rightAction}
                activeOpacity={0.7}
              >
                {rightIcon ? (
                  <Ionicons name={rightIcon} size={24} color={COLORS.text} />
                ) : null}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>

      {/* Menu Modal */}
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        currentLanguage={currentLanguage}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 56,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
    zIndex: 1,
  },
  backButton: {
    padding: SPACING.xs,
  },
  menuButton: {
    padding: SPACING.xs,
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  rightButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
});

export default Header;

