/**
 * Google AdMob Configuration
 * 
 * IMPORTANT: Replace test IDs with your real AdMob IDs from:
 * https://apps.admob.com/
 * 
 * Current IDs are TEST IDs - they won't earn revenue!
 */

// Test IDs (for development)
// Replace these with your real AdMob unit IDs for production
// **IMPORTANT**: Currently using Google's TEST ad unit IDs
// These always work and should show test ads with colored backgrounds
// Replace with your REAL ad unit IDs from AdMob dashboard before publishing

export const AD_UNIT_IDS = {
  android: {
    // Banner ads - USING GOOGLE TEST IDs (MUST REPLACE BEFORE PRODUCTION)
    banner: {
      stories: 'ca-app-pub-3552884226286157/9895095524', // Google Test Banner ID
      home: 'ca-app-pub-3552884226286157/7238401772',    // Google Test Banner ID
    },
    // Interstitial ads (full-screen)
    interstitial: {
      betweenStories: 'ca-app-pub-3552884226286157/3477026831', // Google Test Interstitial ID
      homeNavigation: 'ca-app-pub-3552884226286157/3477026831', // Google Test Interstitial ID (same as betweenStories for now)
    },
    // Native ads
    native: {
      inFeed: 'ca-app-pub-3552884226286157/4191891445', // Google Test Native ID
    },
  },
  ios: {
    // Banner ads - USING GOOGLE TEST IDs (MUST REPLACE BEFORE PRODUCTION)
    banner: {
      stories: 'ca-app-pub-3552884226286157/1874394456', // Google Test Banner ID
      home: 'ca-app-pub-3552884226286157/5430496081',    // Google Test Banner ID
    },
    // Interstitial ads (full-screen)
    interstitial: {
      betweenStories: 'ca-app-pub-3552884226286157/5047352708', // Google Test Interstitial ID
      homeNavigation: 'ca-app-pub-3552884226286157/5047352708', // Google Test Interstitial ID (same as betweenStories for now)
    },
    // Native ads
    native: {
      inFeed: 'ca-app-pub-3552884226286157/2201697515', // Google Test Native ID
    },
  },
};

// YOUR PRODUCTION AD UNIT IDs (use these when ready to publish):
// Android:
//   Banner Stories: ca-app-pub-3552884226286157/9895095524
//   Banner Home: ca-app-pub-3552884226286157/7238401772
//   Interstitial: ca-app-pub-3552884226286157/3477026831
//   Native: ca-app-pub-3552884226286157/4191891445
// iOS:
//   Banner Stories: ca-app-pub-3552884226286157/1874394456
//   Banner Home: ca-app-pub-3552884226286157/5430496081
//   Interstitial: ca-app-pub-3552884226286157/5047352708
//   Native: ca-app-pub-3552884226286157/2201697515

// Ad configuration
export const AD_CONFIG = {
  // Show banner ad on stories page
  storiesBanner: true,
  
  // Show interstitial ad after every N stories
  interstitialFrequency: 3, // Show after every 3 stories
  
  // Banner size
  bannerSize: 'BANNER', // Options: 'BANNER', 'LARGE_BANNER', 'MEDIUM_RECTANGLE', 'FULL_BANNER'
};

/**
 * Get ad unit ID for current platform
 */
export const getAdUnitId = (type, placement) => {
  const platform = require('react-native').Platform.OS;
  return AD_UNIT_IDS[platform]?.[type]?.[placement] || '';
};

/**
 * TODO: Replace test IDs with your real AdMob IDs
 * 
 * Steps to get your AdMob IDs:
 * 1. Go to https://apps.admob.com/
 * 2. Create an app (or select existing)
 * 3. Create ad units for each placement:
 *    - Banner ad for Stories page
 *    - Interstitial ad between stories
 * 4. Copy the ad unit IDs and replace the test IDs above
 * 5. Also update the App IDs in app.json
 */

