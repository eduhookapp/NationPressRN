#!/bin/bash

# Ensure Android native project is generated
if [ ! -f "android/gradlew" ]; then
  echo "Android native project not found. Running prebuild..."
  npx expo prebuild --platform android
  
  # Ensure google-services.json is in place
  if [ -f "android/app/google-services.json" ]; then
    echo "✓ google-services.json already in place"
  else
    echo "⚠️  Warning: google-services.json not found in android/app/"
  fi
else
  echo "✓ Android native project already exists"
fi

# Ensure local.properties exists with Android SDK path
if [ ! -f "android/local.properties" ]; then
  echo "Creating android/local.properties..."
  ANDROID_SDK_PATH="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
  
  # Try common SDK locations
  if [ ! -d "$ANDROID_SDK_PATH" ]; then
    ANDROID_SDK_PATH="/Users/fuel/Library/Android/sdk"
  fi
  
  if [ -d "$ANDROID_SDK_PATH" ]; then
    echo "sdk.dir=$ANDROID_SDK_PATH" > android/local.properties
    echo "✓ Created android/local.properties with SDK path: $ANDROID_SDK_PATH"
  else
    echo "⚠️  Warning: Android SDK not found. Please set ANDROID_HOME or create android/local.properties manually"
    echo "   Expected path: $ANDROID_SDK_PATH"
  fi
else
  echo "✓ android/local.properties already exists"
fi

