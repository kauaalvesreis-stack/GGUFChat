// Powered by OnSpace.AI
import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.surfaceBorder,
          borderTopWidth: 1,
          height: Platform.select({
            ios: insets.bottom + 56,
            android: insets.bottom + 56,
            default: 64,
          }),
          paddingTop: 8,
          paddingBottom: Platform.select({
            ios: insets.bottom + 6,
            android: insets.bottom + 6,
            default: 8,
          }),
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="benchmark"
        options={{
          title: 'Benchmark',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="speed" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
