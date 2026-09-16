import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../../constants';
import { ClyvoTabBar } from '../../components/navigation/ClyvoTabBar';
import { AccountHeaderAction } from '../../components/navigation/AccountHeaderAction';
import { useAccessibility } from '../../context/AccessibilityContext';

export default function TabsLayout() {
  const { modoIdoso } = useAccessibility();
  return (
    <Tabs
      tabBar={(props) => <ClyvoTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: CORES.primaria,
        tabBarInactiveTintColor: CORES.textoSecundario,
        headerStyle: { backgroundColor: CORES.primaria },
        headerTintColor: '#fff',
        headerTitleAlign: 'left',
        headerTitleStyle: { fontWeight: '700', fontSize: modoIdoso ? 20 : 17 },
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
        name="historico"
        options={{
          title: 'Histórico',
          headerTitle: 'Histórico Clínico',
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