// Powered by OnSpace.AI
import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AppProvider } from '@/contexts/AppContext';

export default function RootLayout() {
  return (
    <AlertProvider>
      <SafeAreaProvider>
        <AppProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </AppProvider>
      </SafeAreaProvider>
    </AlertProvider>
  );
}
