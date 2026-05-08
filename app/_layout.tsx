import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { theme } from '../theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text
      style={{
        fontSize: theme.typography.size.lg,
        opacity: focused ? 1 : 0.55,
      }}
    >
      {emoji}
    </Text>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }} />
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.textTertiary,
            tabBarLabelStyle: {
              fontFamily: theme.typography.fontFamily.semibold,
              fontSize: theme.typography.size.xs,
            },
            tabBarStyle: {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
            },
          }}
        >
          <Tabs.Screen
            name="(home)"
            options={{
              title: 'Home',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🏠" focused={focused} />
              ),
              tabBarAccessibilityLabel: 'Home tab',
            }}
          />
          <Tabs.Screen
            name="cheatsheet"
            options={{
              title: 'Patterns',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="📖" focused={focused} />
              ),
              tabBarAccessibilityLabel: 'Patterns cheat sheet tab',
            }}
          />
        </Tabs>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
