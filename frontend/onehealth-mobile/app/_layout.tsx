import { Stack, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { 
  useFonts,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold 
} from '@expo-google-fonts/manrope';
import { AuthProvider } from '@/context/AuthContext';

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="report-modal" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="alert-detail" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="post-detail" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="compose" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="auth-modal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </AuthProvider>
  );
}

