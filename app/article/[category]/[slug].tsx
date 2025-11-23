import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ArticleDetailScreen from '../../../src/screens/ArticleDetailScreen';

export default function ArticleDetailRoute() {
  const params = useLocalSearchParams<{
    slug: string | string[];
    category?: string | string[];
    language?: string | string[];
    post?: string | string[];
  }>();

  // Safely extract params - handle arrays (iOS sometimes returns arrays)
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const category = Array.isArray(params.category) ? params.category[0] : params.category;
  const language = Array.isArray(params.language) ? params.language[0] : params.language;
  const postParam = Array.isArray(params.post) ? params.post[0] : params.post;

  // Parse post if it's a string
  let parsedPost = null;
  if (postParam && typeof postParam === 'string') {
    try {
      parsedPost = JSON.parse(postParam);
    } catch (e) {
      console.error('Error parsing post:', e);
    }
  }

  return (
    <ArticleDetailScreen
      route={{
        params: {
          slug: slug || '',
          category: category || '',
          language: language || undefined,
          post: parsedPost,
        },
      }}
    />
  );
}

