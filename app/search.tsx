import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import SearchScreen from '../src/screens/SearchScreen';

export default function SearchRoute() {
  const { query } = useLocalSearchParams<{ query?: string }>();

  return (
    <SearchScreen
      route={{
        params: {
          query: query || '',
        },
      }}
    />
  );
}

