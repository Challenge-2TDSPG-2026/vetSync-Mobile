import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { VetSyncTabBar } from '../../components/navigation/VetSyncTabBar';
import { AccountHeaderAction } from '../../components/navigation/AccountHeaderAction';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../constants/theme';

function TutorHeaderBackground({ colors }: { colors: ThemeColors }) {
  return (
    <LinearGradient
      colors={[colors.navigation, colors.navigationAccent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      <View style={[s.headerEdge, { backgroundColor: colors.navigationBorder }]} />
    </LinearGradient>
  );
}

export default function TabsLayout() {
  const { modoSimples } = useAccessibility();
  const { theme } = useTheme();
  return (
    <Tabs
        tabBar={(props) => <VetSyncTabBar {...props} />}
        screenOptions={{
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          animation: 'fade',
          headerStyle: { backgroundColor: theme.colors.navigation },
          headerBackground: () => <TutorHeaderBackground colors={theme.colors} />,
          headerShadowVisible: false,
          headerTintColor: theme.colors.onNavigation,
          headerTitleAlign: 'left',
          headerTitleContainerStyle: { paddingLeft: 2 },
          headerTitleStyle: { fontWeight: '800', fontSize: modoSimples ? 27 : 20, letterSpacing: -0.35 },
          headerRight: () => <AccountHeaderAction href="/(tutor)/perfil" />,
        }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          headerTitle: 'VetSync',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          headerTitle: 'Agenda de Saúde',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="carteirinhas"
        options={{
          title: 'Carteiras',
          headerTitle: 'Carteiras de vacinação',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          headerTitle: 'Histórico Clínico',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recompensas"
        options={{
          title: 'Recompensas',
          headerTitle: 'Programa de Fidelidade',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          headerTitle: 'Perfil',
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const s = StyleSheet.create({
  headerEdge: { position: 'absolute', right: 0, bottom: 0, left: 0, height: 1 },
});
