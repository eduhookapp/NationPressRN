// Language/API Configuration
export const LANGUAGES = {
  english: {
    id: 'english',
    name: 'English',
    label: 'English',
    apiBaseUrl: 'https://admin.nationpress.com',
    domain: 'https://www.nationpress.com',
  },
  hindi: {
    id: 'hindi',
    name: 'हिंदी',
    label: 'Hindi',
    apiBaseUrl: 'https://admin.rashtrapress.com',
    domain: 'https://www.rashtrapress.com',
  },
};

export const DEFAULT_LANGUAGE = 'english';

// Get current API base URL (will be set by language selector)
let currentApiBaseUrl = LANGUAGES[DEFAULT_LANGUAGE].apiBaseUrl;

export const setApiBaseUrl = (url) => {
  currentApiBaseUrl = url;
};

export const getApiBaseUrl = () => {
  return currentApiBaseUrl;
};

export const CATEGORIES = [
  { id: 'all', name: 'Home', label: 'Home', labelHindi: 'होम' },
  { id: 'national', name: 'National', label: 'National', labelHindi: 'राष्ट्रीय' },
  { id: 'business', name: 'Business', label: 'Business', labelHindi: 'व्यापार' },
  { id: 'sports', name: 'Sports', label: 'Sports', labelHindi: 'खेल' },
  { id: 'entertainment', name: 'Entertainment', label: 'Entertainment', labelHindi: 'मनोरंजन' },
  { id: 'international', name: 'International', label: 'International', labelHindi: 'अंतर्राष्ट्रीय' },
  { id: 'sciencetech', name: 'Science & Tech', label: 'Science & Tech', labelHindi: 'विज्ञान और प्रौद्योगिकी' },
  { id: 'healthmedicine', name: 'Health & Medicine', label: 'Health', labelHindi: 'स्वास्थ्य' }
];

// Category submenu items (chips) for each category
export const CATEGORY_SUBMENU_ITEMS = {
  all: [],
  national: [
    'Latest India News',
    'Politics',
    'Economy',
    'States',
    'Modi News',
    'Rahul Gandhi',
    'BJP',
    'Congress',
    'Election',
    'Delhi',
    'Mumbai',
    'Kerala',
  ],
  business: [
    'Sensex',
    'Nifty',
    'Stock Market',
    'Economy',
    'GDP',
    'Inflation',
    'RBI',
    'Banking',
    'Startup',
    'IPO',
    'Cryptocurrency',
    'Real Estate',
  ],
  sports: [
    'Cricket',
    'IPL 2025',
    'Football',
    'Hockey',
    'Tennis',
    'Olympics',
    'World Cup',
    'BCCI',
    'Virat Kohli',
    'MS Dhoni',
    'Rohit Sharma',
  ],
  entertainment: [
    'Bollywood',
    'Hollywood',
    'Movies',
    'TV Shows',
    'Celebrities',
    'Music',
    'Awards',
    'OTT',
    'Netflix',
    'Amazon Prime',
  ],
  international: [
    'World News',
    'USA',
    'China',
    'Russia',
    'UK',
    'Europe',
    'Middle East',
    'Asia',
    'UN',
    'G20',
  ],
  sciencetech: [
    'Technology',
    'AI',
    'Artificial Intelligence',
    'Space',
    'ISRO',
    'NASA',
    'Innovation',
    'Gadgets',
    'Mobile',
    'Internet',
    'Cybersecurity',
  ],
  healthmedicine: [
    'Health',
    'Medicine',
    'Fitness',
    'Yoga',
    'Nutrition',
    'Mental Health',
    'Hospitals',
    'Doctors',
    'Wellness',
  ],
};

// Tab labels translations
export const TAB_LABELS = {
  english: {
    home: 'Home',
    stories: 'Stories',
    bookmarks: 'Bookmarks',
    notifications: 'Notifications',
  },
  hindi: {
    home: 'होम',
    stories: 'कहानियां',
    bookmarks: 'बुकमार्क',
    notifications: 'सूचनाएं',
  },
};

// Article section titles translations
export const ARTICLE_SECTIONS = {
  english: {
    synopsis: 'Synopsis',
    keyTakeaways: 'Key Takeaways',
    relatedArticles: 'Related Articles',
    frequentlyAskedQuestions: 'Frequently Asked Questions',
    tags: 'Tags',
  },
  hindi: {
    synopsis: 'सारांश',
    keyTakeaways: 'मुख्य बातें',
    relatedArticles: 'संबंधित लेख',
    frequentlyAskedQuestions: 'अक्सर पूछे जाने वाले प्रश्न',
    tags: 'टैग',
  },
};

export const COLORS = {
  primary: '#dc3545',
  secondary: '#2c3e50',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#333333',
  textLight: '#6c757d',
  border: '#e9ecef',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8'
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24
};

