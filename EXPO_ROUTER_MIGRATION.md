# Expo Router Migration Summary

This document describes how the app was adapted from the old Expo project structure to work with Expo Router.

## Architecture Changes

### 1. **AppProvider** (`src/providers/AppProvider.tsx`)
   - Centralized app initialization logic
   - Handles OneSignal setup and notification handling
   - Manages Google AdMob initialization
   - Monitors network connectivity
   - Provides global error handling
   - Exposes app state through React Context

### 2. **AppWrapper** (`src/components/AppWrapper.tsx`)
   - Handles language selection screen display
   - Manages offline screen display
   - Wraps the app content with necessary guards
   - Integrates with AppProvider for state management

### 3. **Root Layout** (`app/_layout.tsx`)
   - Updated to use AppProvider and AppWrapper
   - Maintains Expo Router structure
   - Provides SafeAreaProvider and ThemeProvider
   - Sets up the navigation stack

### 4. **Index Route** (`app/index.tsx`)
   - Main entry point that loads AppNavigator
   - Integrates React Navigation with Expo Router
   - Syncs navigation ref with AppProvider context

## Key Features Preserved

✅ **OneSignal Integration**
   - Notification click handling
   - Foreground notification display
   - Device token registration
   - Language-based tagging

✅ **Network Monitoring**
   - Real-time connectivity tracking
   - Offline screen display
   - Connection restoration handling

✅ **Language Selection**
   - First-launch language selection
   - API URL configuration based on language
   - OneSignal tag management

✅ **Google AdMob**
   - Ad initialization
   - Configuration preserved

✅ **In-App Updates**
   - Update checking logic maintained

✅ **Deep Linking**
   - React Navigation deep linking configuration
   - Notification URL handling
   - URL parsing and navigation

## File Structure

```
NationPressRN/
├── app/
│   ├── _layout.tsx          # Root layout with providers
│   ├── index.tsx            # Main entry point (AppNavigator)
│   └── (tabs)/              # Expo Router tabs (optional)
├── src/
│   ├── providers/
│   │   └── AppProvider.tsx  # App initialization & state
│   ├── components/
│   │   └── AppWrapper.tsx   # Language/offline wrapper
│   ├── navigation/
│   │   └── AppNavigator.js  # React Navigation setup
│   ├── screens/             # All screens preserved
│   ├── components/          # All components preserved
│   ├── services/           # All services preserved
│   └── utils/              # All utilities preserved
└── App.js                   # Original App.js (kept for reference)
```

## Usage

The app now works with Expo Router while maintaining all the original functionality:

1. **AppProvider** initializes OneSignal, AdMob, and network monitoring
2. **AppWrapper** handles language selection and offline states
3. **AppNavigator** (React Navigation) is loaded through the index route
4. All screens and components work as before

## Migration Notes

- The original `App.js` is preserved for reference
- React Navigation is still used for the main app navigation
- Expo Router provides the root structure and routing foundation
- All initialization logic moved to AppProvider for better organization
- TypeScript types added for better type safety

## Next Steps

1. Test all navigation flows
2. Verify OneSignal notifications work correctly
3. Test deep linking functionality
4. Verify offline/online state handling
5. Test language selection and switching

