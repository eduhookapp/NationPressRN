import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ArticleDetailScreen from '../../../src/screens/ArticleDetailScreen';

export default function ArticleDetailRoute() {
  const { slug, category, language, post } = useLocalSearchParams<{
    slug: string;
    category?: string;
    language?: string;
    post?: string;
  }>();

  // Parse post if it's a string
  let parsedPost = null;
  if (post && typeof post === 'string') {
    try {
      parsedPost = JSON.parse(post);
    } catch (e) {
      console.error('Error parsing post:', e);
    }
  }

  return (
    <ArticleDetailScreen
      route={{
        params: {
          slug,
          category,
          language,
          post: parsedPost,
        },
      }}
    />
  );
}

