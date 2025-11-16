import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import WebStoryDetailScreen from '../../src/screens/WebStoryDetailScreen';

export default function WebStoryDetailRoute() {
  const { slug, story } = useLocalSearchParams<{
    slug: string;
    story?: string;
  }>();

  // Parse story if it's a string
  let parsedStory = null;
  if (story && typeof story === 'string') {
    try {
      parsedStory = JSON.parse(story);
    } catch (e) {
      console.error('Error parsing story:', e);
    }
  }

  return (
    <WebStoryDetailScreen
      route={{
        params: {
          slug,
          story: parsedStory,
        },
      }}
    />
  );
}

