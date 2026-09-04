import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CORES } from '../../constants';

export default function VetTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: CORES.primaria,
        tabBarInactiveTintColor: CORES.textoSecundario,
        tabBarStyle: {
          backgroundColor: CORES.fundoCard,
          borderTopColor: CORES.borda,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: CORES.primaria },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}