import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../config/constants';
import { storage } from '../utils/storage';

const CategoryTab = ({ categories, selectedCategory, onSelectCategory }) => {
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

    // Listen for language changes by checking storage periodically
    const interval = setInterval(async () => {
      const language = await storage.getLanguage();
      setCurrentLanguage(prev => {
        if (prev !== language) {
          return language || 'english';
        }
        return prev;
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const getCategoryLabel = (category) => {
    return currentLanguage === 'hindi' && category.labelHindi 
      ? category.labelHindi 
      : category.label;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.tab,
              selectedCategory === category.id && styles.tabActive
            ]}
            onPress={() => onSelectCategory(category.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                selectedCategory === category.id && styles.tabTextActive
              ]}
            >
              {getCategoryLabel(category)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContent: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  tab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabTextActive: {
    color: COLORS.background,
  },
});

export default CategoryTab;

