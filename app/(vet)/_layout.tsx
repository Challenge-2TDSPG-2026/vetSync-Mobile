import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../../constants';
import { VetSyncTabBar } from '../../components/navigation/VetSyncTabBar';
import { AccountHeaderAction } from '../../components/navigation/AccountHeaderAction';

export default function VetTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <VetSyncTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: CORES.primaria,
        tabBarInactiveTintColor: CORES.textoSecundario,
        headerStyle: { backgroundColor: CORES.primaria },
        headerTintColor: '#fff',
        headerTitleAlign: 'left',
        headerTitleStyle: { fontWeight: '700' },
        headerRight: () => <AccountHeaderAction href="/(vet)/perfil" />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Painel',
          headerTitle: 'Painel do Veterinário',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="consultas"
        options={{
          title: 'Consultas',
          headerTitle: 'Fila de Consultas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: 'Pacientes',
          headerTitle: 'Meus Pacientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="disponibilidade"
        options={{
          title: 'Agenda',
          headerTitle: 'Minha Disponibilidade',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="resgates"
        options={{
          title: 'Resgates',
          headerTitle: 'Resgates Pendentes',
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