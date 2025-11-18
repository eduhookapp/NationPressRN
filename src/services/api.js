import { getApiBaseUrl } from '../config/constants';

const CACHE_TTL = 300000; // 5 minutes in milliseconds
const cache = new Map();

// Cache helper functions
function getCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// Clear all cache (useful when language changes)
function clearCache() {
  cache.clear();
}

// Sanitize slug to match backend validation
function sanitizeSlug(text) {
  if (!text) return text;
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove any character that's not A-Z, 0-9, hyphen, underscore, period, or tilde
    .replace(/[^a-z0-9-_.~]/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

// Helper function to build Strapi API URL
function buildApiUrl(endpoint, params = {}) {
  const url = new URL(`${getApiBaseUrl()}/api/${endpoint}`);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      if (Array.isArray(params[key])) {
        params[key].forEach((value, index) => {
          url.searchParams.append(`${key}[${index}]`, value);
        });
      } else {
        url.searchParams.append(key, params[key]);
      }
    }
  });
  
  return url.toString();
}

export const apiService = {
  // Clear all cached data
  clearCache() {
    clearCache();
  },
  // Fetch all web stories without category filter
  async fetchAllWebStories(limit = 50, start = 0) {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const cacheKey = `webstories:all:${limit}:${start}:${apiBaseUrl}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      const url = buildApiUrl('web-stories', {
        'populate[0]': 'featured_image',
        'sort[0]': 'story_at:desc',
        'pagination[limit]': limit,
        'pagination[start]': start
      });

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[API] 🌐 Fetching ALL web stories (no category filter)...');
      console.log('[API] 🔗 Full URL:', url);
      console.log('[API] 🌐 API Base URL:', apiBaseUrl);
      console.log('═══════════════════════════════════════════════════════════');

      const response = await fetch(url);
      console.log('[API] 📡 Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('[API] 📊 Response data:', {
        hasData: !!data?.data,
        dataLength: data?.data?.length || 0,
        total: data?.meta?.pagination?.total || 0
      });

      // Normalize Strapi v4 data structure
      const normalizedData = (data?.data || []).map(item => {
        const attrs = item.attributes || item;
        return {
          ...attrs,
          id: item.id || attrs.id
        };
      });

      const result = {
        success: true,
        data: normalizedData,
        total: data?.meta?.pagination?.total || 0
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching all web stories:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  },

  // Fetch web stories by category
  // Supported categories: POLITICS, CINEMA, INTERNATIONAL, SPORTS, ENTERTAINMENT, NATIONAL
  async fetchWebStories(limit = 10, category = 'ENTERTAINMENT', start = 0) {
    try {
      // Include API base URL in cache key to differentiate between languages
      const apiBaseUrl = getApiBaseUrl();
      const cacheKey = `webstories:${category}:${limit}:${start}:${apiBaseUrl}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      // Map app category names to Strapi category format
      const categoryMap = {
        'entertainment': 'ENTERTAINMENT',
        'politics': 'POLITICS',
        'cinema': 'CINEMA',
        'international': 'INTERNATIONAL',
        'sports': 'SPORTS',
        'national': 'NATIONAL',
      };

      const strapiCategory = categoryMap[category.toLowerCase()] || category.toUpperCase();

      const url = buildApiUrl('web-stories', {
        'filters[category][$eq]': strapiCategory,
        'populate[0]': 'featured_image',
        'sort[0]': 'story_at:desc',
        'pagination[limit]': limit,
        'pagination[start]': start
      });

      console.log('═══════════════════════════════════════════════════════════');
      console.log('[API] 🌐 Fetching web stories...');
      console.log('[API] 📍 Category:', category, '→ Strapi:', strapiCategory);
      console.log('[API] 🔗 Full URL:', url);
      console.log('[API] 🌐 API Base URL:', apiBaseUrl);
      console.log('═══════════════════════════════════════════════════════════');

      const response = await fetch(url);
      console.log('[API] 📡 Response status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('[API] 📊 Response data:', {
        hasData: !!data?.data,
        dataLength: data?.data?.length || 0,
        total: data?.meta?.pagination?.total || 0
      });

      // Normalize Strapi v4 data structure
      const normalizedData = (data?.data || []).map(item => {
        const attrs = item.attributes || item;
        return {
          ...attrs,
          id: item.id || attrs.id
        };
      });

      const result = {
        success: true,
        data: normalizedData,
        total: data?.meta?.pagination?.total || 0
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error(`Error fetching web stories for ${category}:`, error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  },

  // Fetch breaking news (where criticality = breaking)
  async fetchBreakingNews(limit = 10, category = 'all') {
    try {
      // Include API base URL in cache key to differentiate between languages
      const apiBaseUrl = getApiBaseUrl();
      const cacheKey = `breaking:${category}:${limit}:${apiBaseUrl}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      const params = {
        'filters[criticality][$eq]': 'breaking',
        'populate[0]': 'banner',
        'populate[1]': 'featured_image',
        'sort[0]': 'story_at:desc',
        'pagination[limit]': limit,
        'pagination[start]': 0
      };

      // Add category filter only if category is not 'all'
      if (category && category !== 'all' && category !== 'home') {
        params['filters[category][$eq]'] = category.toUpperCase();
      }

      const url = buildApiUrl('posts', params);

      const response = await fetch(url);
      const data = await response.json();

      // Normalize Strapi v4 data structure
      const normalizedData = (data?.data || []).map(item => {
        const attrs = item.attributes || item;
        return {
          ...attrs,
          id: item.id || attrs.id
        };
      });

      const result = {
        success: true,
        data: normalizedData,
        total: data?.meta?.pagination?.total || 0
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching breaking news:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  },

  // Fetch posts by category
  async fetchPostsByCategory(category, limit = 12, start = 0) {
    try {
      const cacheKey = `posts:${category}:${limit}:${start}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      if (category === 'web-stories') {
        const url = buildApiUrl('web-stories', {
          'populate[0]': 'featured_image',
          'sort[0]': 'story_at:desc',
          'pagination[limit]': limit,
          'pagination[start]': start
        });

        const response = await fetch(url);
        const data = await response.json();

        // Normalize Strapi v4 data structure
        const normalizedData = (data?.data || []).map(item => {
          const attrs = item.attributes || item;
          return {
            ...attrs,
            id: item.id || attrs.id
          };
        });

        const result = {
          success: true,
          data: normalizedData,
          total: data?.meta?.pagination?.total || 0
        };

        setCache(cacheKey, result);
        return result;
      } else if (category === 'all') {
        const url = buildApiUrl('posts', {
          'populate[0]': 'banner',
          'populate[1]': 'featured_image',
          'sort[0]': 'story_at:desc',
          'pagination[limit]': limit,
          'pagination[start]': start
        });

        const response = await fetch(url);
        const data = await response.json();

        // Normalize Strapi v4 data structure
        const normalizedData = (data?.data || []).map(item => {
          const attrs = item.attributes || item;
          return {
            ...attrs,
            id: item.id || attrs.id
          };
        });

        const result = {
          success: true,
          data: normalizedData,
          total: data?.meta?.pagination?.total || 0
        };

        setCache(cacheKey, result);
        return result;
      } else {
        const url = buildApiUrl('posts', {
          'filters[category][$eq]': category.toUpperCase(),
          'populate[0]': 'banner',
          'populate[1]': 'featured_image',
          'sort[0]': 'story_at:desc',
          'pagination[limit]': limit,
          'pagination[start]': start
        });

        const response = await fetch(url);
        const data = await response.json();

        // Normalize Strapi v4 data structure
        const normalizedData = (data?.data || []).map(item => {
          const attrs = item.attributes || item;
          return {
            ...attrs,
            id: item.id || attrs.id
          };
        });

        const result = {
          success: true,
          data: normalizedData,
          total: data?.meta?.pagination?.total || 0
        };

        setCache(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.error(`Error fetching posts for ${category}:`, error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  },

  // Fetch single post by slug
  async fetchPostBySlug(slug, language = null) {
    try {
      const cacheKey = `post:${slug}:${language || 'default'}`;
      const cached = getCache(cacheKey);
      if (cached) {
        console.log('[API] 📦 Using cached data for slug:', slug);
        return cached;
      }

      // Determine API base URL - override if language is provided
      let apiBaseUrl;
      if (language === 'hindi') {
        apiBaseUrl = 'https://admin.rashtrapress.com';
        console.log('[API] 🇮🇳 Using Hindi API override:', apiBaseUrl);
      } else if (language === 'english') {
        apiBaseUrl = 'https://admin.nationpress.com';
        console.log('[API] 🇬🇧 Using English API override:', apiBaseUrl);
      } else {
        apiBaseUrl = getApiBaseUrl();
        console.log('[API] Using default API:', apiBaseUrl);
      }

      // Sanitize the slug to match backend
      const sanitizedSlug = sanitizeSlug(slug);
      const originalSlug = slug;

      // Build filters to check both sanitized and original versions
      const filters = {
        'filters[$or][0][short_slug][$eq]': sanitizedSlug,
        'filters[$or][1][slug_unique][$eq]': sanitizedSlug,
        'filters[$or][2][slug][$eq]': sanitizedSlug,
        'populate[0]': 'banner',
        'populate[1]': 'featured_image'
      };

      // If original is different, add it to the filters
      if (originalSlug !== sanitizedSlug) {
        filters['filters[$or][3][short_slug][$eq]'] = originalSlug;
        filters['filters[$or][4][slug_unique][$eq]'] = originalSlug;
        filters['filters[$or][5][slug][$eq]'] = originalSlug;
      }

      // Build URL with overridden API base
      const urlObj = new URL(`${apiBaseUrl}/api/posts`);
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          urlObj.searchParams.append(key, filters[key]);
        }
      });
      const url = urlObj.toString();

      // 🐛 CURL DEBUG - Log the request
      console.log('\n🔍 [API DEBUG] fetchPostBySlug');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📍 Original Slug:', originalSlug);
      console.log('🧹 Sanitized Slug:', sanitizedSlug);
      console.log('🌍 Language Override:', language || 'none');
      console.log('🌐 API Base URL:', apiBaseUrl);
      console.log('🔗 Full URL:', url);
      console.log('\n📋 CURL Command:');
      console.log(`curl -X GET "${url}" -H "Accept: application/json"`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const response = await fetch(url);
      
      // 🐛 CURL DEBUG - Log response status
      console.log('📥 Response Status:', response.status, response.statusText);
      
      const data = await response.json();
      
      // 🐛 CURL DEBUG - Log response data
      console.log('📦 Response Data:', JSON.stringify(data, null, 2));
      console.log('📊 Found posts:', data?.data?.length || 0);
      if (data?.data?.length > 0) {
        console.log('✅ Post found:', {
          id: data.data[0].id,
          title: data.data[0].attributes?.title || data.data[0].title,
          slug: data.data[0].attributes?.slug || data.data[0].slug,
          slug_unique: data.data[0].attributes?.slug_unique || data.data[0].slug_unique,
          short_slug: data.data[0].attributes?.short_slug || data.data[0].short_slug
        });
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      if (!data.data || data.data.length === 0) {
        return { success: false, post: null, relatedPosts: [] };
      }

      // Normalize Strapi v4 data structure
      const postItem = data.data[0];
      const post = {
        ...(postItem.attributes || postItem),
        id: postItem.id || (postItem.attributes?.id || postItem.id)
      };
      const category = post.category;

      // Fetch related posts
      const relatedUrl = buildApiUrl('posts', {
        'filters[category][$eq]': category,
        'filters[short_slug][$ne]': slug,
        'populate[0]': 'banner',
        'populate[1]': 'featured_image',
        'sort[0]': 'story_at:desc',
        'pagination[limit]': 4
      });

      const relatedResponse = await fetch(relatedUrl);
      const relatedData = await relatedResponse.json();

      // Normalize related posts
      const normalizedRelated = (relatedData?.data || []).map(item => {
        const attrs = item.attributes || item;
        return {
          ...attrs,
          id: item.id || attrs.id
        };
      });

      const result = {
        success: true,
        post,
        category,
        relatedPosts: normalizedRelated
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching post:', error);
      return {
        success: false,
        error: error.message,
        post: null,
        relatedPosts: []
      };
    }
  },

  // Fetch web story by slug
  async fetchWebStoryBySlug(slug) {
    try {
      const cacheKey = `webstory:${slug}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      const url = buildApiUrl('web-stories', {
        'filters[slug][$eq]': slug,
        'populate[0]': 'featured_image'
      });

      const response = await fetch(url);
      const data = await response.json();

      if (!data.data || data.data.length === 0) {
        return { success: false, story: null };
      }

      // Normalize Strapi v4 data structure
      const storyItem = data.data[0];
      const story = {
        ...(storyItem.attributes || storyItem),
        id: storyItem.id || (storyItem.attributes?.id || storyItem.id)
      };
      
      const result = {
        success: true,
        story
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching web story:', error);
      return {
        success: false,
        error: error.message,
        story: null
      };
    }
  },

  // Fetch author data
  async fetchAuthor(slug = 'nation-press') {
    try {
      const cacheKey = `author:${slug}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      const url = buildApiUrl('author', {
        'populate': '*'
      });

      const response = await fetch(url);
      const data = await response.json();

      const result = {
        success: true,
        author: data?.data?.attributes || data?.data || {}
      };

      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error fetching author:', error);
      return {
        success: false,
        error: error.message,
        author: null
      };
    }
  },

  // Search posts by query
  async searchPosts(query, limit = 10, start = 0) {
    try {
      const cacheKey = `search:${query}:${limit}:${start}`;
      const cached = getCache(cacheKey);
      if (cached) return cached;

      if (!query || !query.trim()) {
        return {
          success: true,
          data: [],
          total: 0
        };
      }

      // Build URL manually to match Strapi format exactly (like induspress)
      // Calculate page number from start and limit
      const page = Math.floor(start / limit) + 1;
      const pageSize = limit;
      const encodedQuery = encodeURIComponent(query.trim());
      
      // Build URL string directly to preserve bracket notation for Strapi filters
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/posts?filters[$or][0][title_unique][$containsi]=${encodedQuery}&filters[$or][1][title][$containsi]=${encodedQuery}&filters[$or][2][meta_keywords][$containsi]=${encodedQuery}&populate[0]=featured_image&populate[1]=banner&sort[0]=story_at:desc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      // Normalize Strapi v4 data structure
      const normalizedData = (data?.data || []).map(item => {
        const attrs = item.attributes || item;
        return {
          ...attrs,
          id: item.id || attrs.id
        };
      });

      const result = {
        success: true,
        data: normalizedData,
        total: data?.meta?.pagination?.total || 0
      };

      // Cache search results with shorter TTL (2 minutes)
      setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error searching posts:', error);
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      };
    }
  }
};

