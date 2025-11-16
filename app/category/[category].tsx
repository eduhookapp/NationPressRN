import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CategoryScreen from '../../src/screens/CategoryScreen';

export default function CategoryRoute() {
  const { category } = useLocalSearchParams<{ category: string }>();

  return (
    <CategoryScreen
      route={{
        params: {
          category: category || 'all',
        },
      }}
    />
  );
}

