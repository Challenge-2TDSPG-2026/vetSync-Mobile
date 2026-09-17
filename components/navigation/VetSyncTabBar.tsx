import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CORES } from '../../constants';
import { useAccessibility } from '../../context/AccessibilityContext';

// Tipo derivado diretamente do que o <Tabs tabBar={...}> do expo-router realmente entrega,
// evitando o desalinhamento estrutural com @react-navigation/bottom-tabs.
type TabBarRenderer = NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>;
type VetSyncTabBarProps = Parameters<TabBarRenderer>[0];

const C = {
  bar: '#ffffff',
  border: '#e8e2da',
  active: '#0e3326',
  inactive: '#7a6a5e',
};

function TabItem({ label, icon, active, onPress, onLongPress, simples }: { label: string; icon: React.ReactNode; active: boolean; onPress: () => void; onLongPress: () => void; simples?: boolean }) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, { toValue: active ? 1 : 0, useNativeDriver: true, friction: 7, tension: 120 }).start();
  }, [active, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -13] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={onPress} onLongPress={onLongPress} style={s.item}>
    <Animated.View style={[s.iconWrap, simples && sSimples.iconWrap, active && s.iconWrapActive, { transform: [{ translateY }, { scale }] }]}>{icon}</Animated.View>
    <Text numberOfLines={1} style={[s.label, simples && sSimples.label, active && s.labelActive]}>{label}</Text>
  </Pressable>;
}

function AssistantItem({ simples }: { simples?: boolean }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir a SIA" onPress={() => router.push('/assistente')} style={s.item}>
    <View style={[s.iconWrap, simples && sSimples.iconWrap]}><Ionicons name="sparkles-outline" size={simples ? 34 : 26} color={C.inactive} /></View>
    <Text style={[s.label, simples && sSimples.label]}>IA</Text>
  </Pressable>;
}

/** Tab bar única para tutor e veterinário, com a IA como ação modal central. */
export function VetSyncTabBar({ state, descriptors, navigation }: VetSyncTabBarProps) {
  const insets = useSafeAreaInsets();
  const { modoSimples } = useAccessibility();
  const routesVisiveis = state.routes.filter(route => route.name !== 'perfil');
  // A IA ocupa o centro da barra; Histórico segue imediatamente à direita.
  const indiceDaIa = Math.min(2, routesVisiveis.length);
  const altura = (modoSimples ? 96 : 82) + Math.max(insets.bottom, 6);
  return <View style={[s.shell, { paddingBottom: Math.max(insets.bottom, 6), height: altura }]}>
    <View style={s.bar}>
      {routesVisiveis.map((route, index) => {
        const { options } = descriptors[route.key];
        const active = state.routes[state.index]?.key === route.key;
        const color = active ? C.bar : C.inactive;
        const icon = options.tabBarIcon?.({ focused: active, color, size: modoSimples ? 34 : 26 });
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const handleLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
        return <React.Fragment key={route.key}>
          {index === indiceDaIa && <AssistantItem simples={modoSimples} />}
          <TabItem label={label} icon={icon} active={active} onPress={handlePress} onLongPress={handleLongPress} simples={modoSimples} />
        </React.Fragment>;
      })}
      {indiceDaIa === routesVisiveis.length && <AssistantItem simples={modoSimples} />}
    </View>
  </View>;
}

const s = StyleSheet.create({
  shell: { backgroundColor: C.bar, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-evenly', paddingHorizontal: 4 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-start' },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  iconWrapActive: { backgroundColor: C.active, shadowColor: C.active, shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  label: { color: C.inactive, fontSize: 12, fontWeight: '700', marginTop: 2 },
  labelActive: { color: C.active },
});

/** Overrides do modo simples (~35% maior que o padrão): ícones, rótulos e área de toque bem maiores. */
const sSimples = StyleSheet.create({
  iconWrap: { width: 64, height: 64, borderRadius: 32 },
  label: { fontSize: 16, marginTop: 3 },
});