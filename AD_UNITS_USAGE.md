# Ad Units Usage Summary

## ✅ Currently Used Ad Units

### Banner Ads
- **`banner.home`** - Used in:
  - `HomeScreen.js` (in feed ads)
  - `ArticleDetailScreen.js` (multiple placements: after image, after point of view, inline, sticky bottom)
  - `CategoryScreen.js` (alternating with stories)
  
- **`banner.stories`** - Used in:
  - `WebStoriesScreen.js` (bottom banner)
  - `ArticleDetailScreen.js` (after synopsis, after content, after FAQs)
  - `CategoryScreen.js` (alternating with home)

### Interstitial Ads
- **`interstitial.homeNavigation`** - Used in:
  - `HomeScreen.js` (shown when navigating to article, limited to 2 per day)

## ❌ Not Currently Used Ad Units

### Interstitial Ads
- **`interstitial.betweenStories`** - Defined but NOT used anywhere
  - Could be used in `WebStoriesScreen.js` after viewing N stories

### Native Ads
- **`native.inFeed`** - Defined but NOT used anywhere
  - Could be used to replace some banner ads for better user experience

## 📊 Summary

**Total Ad Units Defined:** 6
- Banner: 2 (home, stories) ✅ Both used
- Interstitial: 2 (betweenStories ❌, homeNavigation ✅)
- Native: 1 (inFeed ❌)

**Currently Used:** 3 out of 6 (50%)
**Unused:** 3 out of 6 (50%)

## 🔧 Recommendations

1. **For Testing:** Use Google's official test IDs (already updated for Android)
2. **For Production:** Replace with your real AdMob unit IDs from https://apps.admob.com/
3. **Consider Using:**
   - `interstitial.betweenStories` in WebStoriesScreen after every N stories
   - `native.inFeed` for better ad integration in article feeds

