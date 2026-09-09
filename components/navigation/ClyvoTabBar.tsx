import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CORES } from '../../constants';

const C = {
  bar: '#ffffff',
  border: '#e8e2da',
  active: '#0e3326',
  inactive: '#7a6a5e',
};

function TabItem({ label, icon, active, onPress, onLongPress }: { label: string; icon: React.ReactNode; active: boolean; onPress: () => void; onLongPress: () => void }) {
  const progress = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, { toValue: active ? 1 : 0, useNativeDriver: true, friction: 7, tension: 120 }).start();
  }, [active, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -13] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={onPress} onLongPress={onLongPress} style={s.item}>
    <Animated.View style={[s.iconWrap, active && s.iconWrapActive, { transform: [{ translateY }, { scale }] }]}>{icon}</Animated.View>
    <Text numberOfLines={1} style={[s.label, active && s.labelActive]}>{label}</Text>
  </Pressable>;
}

function AssistantItem() {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir a SIA" onPress={() => router.push('/assistente')} style={s.item}>
    <View style={s.iconWrap}><Ionicons name="sparkles-outline" size={21} color={C.inactive} /></View>
    <Text style={s.label}>IA</Text>
  </Pressable>;
}

/** Tab bar única para tutor e veterinário, com a IA como ação modal central. */
export function ClyvoTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routesVisiveis = state.routes.filter(route => route.name !== 'perfil');
  // A IA ocupa o centro da barra; Histórico segue imediatamente à direita.
  const indiceDaIa = Math.min(2, routesVisiveis.length);
  return <View style={[s.shell, { paddingBottom: Math.max(insets.bottom, 6), height: 70 + Math.max(insets.bottom, 6) }]}>
    <View style={s.bar}>
      {routesVisiveis.map((route, index) => {
        const { options } = descriptors[route.key];
        const active = state.routes[state.index]?.key === route.key;
        const color = active ? C.bar : C.inactive;
        const icon = options.tabBarIcon?.({ focused: active, color, size: 21 });
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const handleLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
        return <React.Fragment key={route.key}>
          {index === indiceDaIa && <AssistantItem />}
          <TabItem label={label} icon={icon} active={active} onPress={handlePress} onLongPress={handleLongPress} />
        </React.Fragment>;
      })}
      {indiceDaIa === routesVisiveis.length && <AssistantItem />}
    </View>
  </View>;
}

const s = StyleSheet.create({
  shell: { backgroundColor: C.bar, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 7 },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-evenly', paddingHorizontal: 4 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-start' },
  iconWrap: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  iconWrapActive: { backgroundColor: C.active, shadowColor: C.active, shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  label: { color: C.inactive, fontSize: 9, fontWeight: '700', marginTop: 1 },
  labelActive: { color: C.active },
});
