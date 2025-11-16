# How to Check Crash Logs

## Method 1: Using the Script (Recommended)

Run the script to automatically retrieve crash logs from your device:

```bash
./get-crash-logs.sh
```

This will:
- Check if a device is connected
- Look for crash logs in external storage
- Look for crash logs in internal storage
- Copy all crash log files to `./crash_logs/` directory

## Method 2: Using ADB Logcat

If you have ADB installed, you can check recent errors:

```bash
# Check recent React Native errors
adb logcat -d | grep -i "ReactNativeJS\|FATAL\|AndroidRuntime\|crash\|error" | tail -100

# Check for specific errors
adb logcat -d | grep -i "TypeError\|Error\|Exception" | tail -50

# Monitor in real-time
adb logcat | grep -i "ReactNativeJS\|error\|crash"
```

## Method 3: Check Device Storage Directly

Crash logs are stored in:
- **External Storage**: `/sdcard/Android/data/com.nationpress.app/files/NationPressCrashLogs/`
- **Internal Storage**: `/data/data/com.nationpress.app/files/NationPressCrashLogs/`

To access via ADB:

```bash
# External storage (easier to access)
adb shell ls -la /sdcard/Android/data/com.nationpress.app/files/NationPressCrashLogs/

# Internal storage (requires app debugging)
adb shell run-as com.nationpress.app ls -la /data/data/com.nationpress.app/files/NationPressCrashLogs/
```

## Method 4: Firebase Crashlytics

If Firebase Crashlytics is configured:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Crashlytics** in the left menu
4. View crash reports, stack traces, and device information

## Common Crash Patterns to Look For

Based on recent issues:

1. **Hooks Order Error**: "Rendered more hooks than during the previous render"
   - **Status**: ✅ Fixed (hooks reordered in ArticleDetailScreen)

2. **Router Back Error**: "TypeError: undefined is not a function" when calling router.back()
   - **Status**: ✅ Fixed (changed to router.replace('/(tabs)'))

3. **Navigation Errors**: Issues with Expo Router navigation
   - **Status**: ✅ Fixed (updated all navigation to use correct pathname format)

## Recent Fixes Applied

1. ✅ Fixed hooks order in `ArticleDetailScreen.js` - all useState hooks grouped together
2. ✅ Fixed back button navigation - now uses `router.replace('/(tabs)')` instead of `router.back()`
3. ✅ Fixed navigation paths in `HomeScreen.js` - removed string interpolation fallbacks
4. ✅ Fixed web stories navigation - updated to use correct Expo Router format

## Next Steps

If you're still experiencing crashes:

1. Run `./get-crash-logs.sh` to retrieve logs from device
2. Check the latest crash log file in `./crash_logs/` directory
3. Look for the error message and stack trace
4. Share the relevant error details for further debugging

