import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AppProvider } from '../src/providers/AppProvider';
import { AppWrapper } from '../src/components/AppWrapper';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <AppWrapper>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="article/[category]/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="category/[category]" options={{ headerShown: false }} />
            <Stack.Screen name="search" options={{ headerShown: false }} />
            <Stack.Screen name="web-stories" options={{ headerShown: false }} />
            <Stack.Screen name="web-story/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="contact" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
            <Stack.Screen name="cookie-policy" options={{ headerShown: false }} />
            <Stack.Screen name="advertise" options={{ headerShown: false }} />
            <Stack.Screen name="[...path]" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </AppWrapper>
      </AppProvider>
    </SafeAreaProvider>
  );
}
