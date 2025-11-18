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
  national: {
    english: [
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
    hindi: [
      'ताजा भारत समाचार',
      'राजनीति',
      'अर्थव्यवस्था',
      'राज्य',
      'मोदी समाचार',
      'राहुल गांधी',
      'भाजपा',
      'कांग्रेस',
      'चुनाव',
      'दिल्ली',
      'मुंबई',
      'केरल',
    ],
  },
  business: {
    english: [
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
    hindi: [
      'सेंसेक्स',
      'निफ्टी',
      'शेयर बाजार',
      'अर्थव्यवस्था',
      'जीडीपी',
      'मुद्रास्फीति',
      'आरबीआई',
      'बैंकिंग',
      'स्टार्टअप',
      'आईपीओ',
      'क्रिप्टोकरेंसी',
      'रियल एस्टेट',
    ],
  },
  sports: {
    english: [
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
    hindi: [
      'क्रिकेट',
      'आईपीएल 2025',
      'फुटबॉल',
      'हॉकी',
      'टेनिस',
      'ओलंपिक',
      'विश्व कप',
      'बीसीसीआई',
      'विराट कोहली',
      'एमएस धोनी',
      'रोहित शर्मा',
    ],
  },
  entertainment: {
    english: [
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
    hindi: [
      'बॉलीवुड',
      'हॉलीवुड',
      'फिल्में',
      'टीवी शो',
      'सेलिब्रिटी',
      'संगीत',
      'पुरस्कार',
      'ओटीटी',
      'नेटफ्लिक्स',
      'अमेजन प्राइम',
    ],
  },
  international: {
    english: [
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
    hindi: [
      'विश्व समाचार',
      'यूएसए',
      'चीन',
      'रूस',
      'यूके',
      'यूरोप',
      'मध्य पूर्व',
      'एशिया',
      'संयुक्त राष्ट्र',
      'जी20',
    ],
  },
  sciencetech: {
    english: [
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
    hindi: [
      'प्रौद्योगिकी',
      'एआई',
      'कृत्रिम बुद्धिमत्ता',
      'अंतरिक्ष',
      'इसरो',
      'नासा',
      'नवाचार',
      'गैजेट्स',
      'मोबाइल',
      'इंटरनेट',
      'साइबर सुरक्षा',
    ],
  },
  healthmedicine: {
    english: [
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
    hindi: [
      'स्वास्थ्य',
      'दवा',
      'फिटनेस',
      'योग',
      'पोषण',
      'मानसिक स्वास्थ्य',
      'अस्पताल',
      'डॉक्टर',
      'कल्याण',
    ],
  },
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
    pointOfView: 'Point of View',
  },
  hindi: {
    synopsis: 'सारांश',
    keyTakeaways: 'मुख्य बातें',
    relatedArticles: 'संबंधित लेख',
    frequentlyAskedQuestions: 'अक्सर पूछे जाने वाले प्रश्न',
    tags: 'टैग',
    pointOfView: 'दृष्टिकोण',
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

