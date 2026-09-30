import React, { useEffect, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import type { NavigationThemeColors } from '../../constants/theme';

// Tipo derivado diretamente do que o <Tabs tabBar={...}> do expo-router realmente entrega,
// evitando o desalinhamento estrutural com @react-navigation/bottom-tabs.
type TabBarRenderer = NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>;
type VetSyncTabBarProps = Parameters<TabBarRenderer>[0];

function TabItem({ label, icon, active, onPress, onLongPress, simples, colors }: { label: string; icon: React.ReactNode; active: boolean; onPress: () => void; onLongPress: () => void; simples?: boolean; colors: NavigationThemeColors }) {
  const [progress] = useState(() => new Animated.Value(active ? 1 : 0));
  useEffect(() => {
    Animated.spring(progress, { toValue: active ? 1 : 0, useNativeDriver: Platform.OS !== 'web', friction: 7, tension: 120 }).start();
  }, [active, progress]);
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -13] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} accessibilityLabel={label} onPress={onPress} onLongPress={onLongPress} style={s.item}>
    <Animated.View style={[s.iconWrap, simples && sSimples.iconWrap, active && [s.iconWrapActive, { backgroundColor: colors.activeBackground, shadowColor: colors.activeBackground }], { transform: [{ translateY }, { scale }] }]}>
      {icon}
    </Animated.View>
    <Text numberOfLines={2} style={[s.label, simples && sSimples.label, { color: active ? colors.activeText : colors.inactiveText }]}>{label}</Text>
  </Pressable>;
}

function AssistantItem({ simples, color }: { simples?: boolean; color: string }) {
  const router = useRouter();
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir a SIA" onPress={() => router.push('/(tutor)/assistente')} style={s.item}>
    <View style={[s.iconWrap, simples && sSimples.iconWrap]}><Ionicons name="sparkles-outline" size={simples ? 34 : 26} color={color} /></View>
    <Text style={[s.label, simples && sSimples.label, { color }]}>IA</Text>
  </Pressable>;
}

export function OptionsGridIcon({ color, size }: { color: ColorValue; size: number }) {
  return <MaterialCommunityIcons name="apps" size={size} color={color} />;
}

function OptionsItem({ simples, color }: { simples?: boolean; color: string }) {
  return <Pressable disabled accessibilityRole="button" accessibilityState={{ disabled: true }} accessibilityLabel="Opções, indisponível" style={s.item}>
    <View style={[s.iconWrap, simples && sSimples.iconWrap]}>
      <OptionsGridIcon color={color} size={simples ? 34 : 26} />
    </View>
    <Text style={[s.label, simples && sSimples.label, { color }]}>Opções</Text>
  </Pressable>;
}

/** Tab bar única para tutor e veterinário: Início, IA, Opções e Conta. */
export function VetSyncTabBar({ state, descriptors, navigation }: VetSyncTabBarProps) {
  const insets = useSafeAreaInsets();
  const { modoSimples } = useAccessibility();
  const { theme } = useTheme();
  const possuiRotaOpcoes = state.routes.some(route => route.name === 'opcoes');
  const routesVisiveis = state.routes.filter(
    route => route.name === 'index' || route.name === 'opcoes' || route.name === 'perfil'
  );
  const altura = (modoSimples ? 116 : 94) + Math.max(insets.bottom, 6);
  return <View style={[s.shell, { backgroundColor: theme.components.navigation.background, borderTopColor: theme.components.navigation.border, paddingBottom: Math.max(insets.bottom, 6), height: altura }]}>
    <View style={s.bar}>
      {routesVisiveis.map((route, index) => {
        const { options } = descriptors[route.key];
        const active = state.routes[state.index]?.key === route.key;
        const color = active ? theme.components.navigation.activeIcon : theme.components.navigation.inactiveIcon;
        const icon = options.tabBarIcon?.({ focused: active, color, size: modoSimples ? 34 : 26 });
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const handlePress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!active && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        const handleLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });
        return <React.Fragment key={route.key}>
          <TabItem
            label={label}
            icon={icon}
            active={active}
            onPress={handlePress}
            onLongPress={handleLongPress}
            simples={modoSimples}
            colors={theme.components.navigation}
          />
          {route.name === 'opcoes' && <AssistantItem simples={modoSimples} color={theme.components.navigation.inactiveIcon} />}
          {!possuiRotaOpcoes && index === 0 && <OptionsItem simples={modoSimples} color={theme.components.navigation.inactiveIcon} />}
          {!possuiRotaOpcoes && index === 0 && <AssistantItem simples={modoSimples} color={theme.components.navigation.inactiveIcon} />}
        </React.Fragment>;
      })}
    </View>
  </View>;
}

const s = StyleSheet.create({
  shell: { borderTopWidth: 1, paddingTop: 8 },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-evenly', paddingHorizontal: 4 },
  item: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-start' },
  iconWrap: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  iconWrapActive: { shadowOpacity: 0.22, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  label: { fontSize: 11, lineHeight: 13, fontWeight: '700', marginTop: 2, maxWidth: '100%', paddingHorizontal: 2, textAlign: 'center' },
});

/** Overrides do modo simples (~35% maior que o padrão): ícones, rótulos e área de toque bem maiores. */
const sSimples = StyleSheet.create({
  iconWrap: { width: 64, height: 64, borderRadius: 32 },
  label: { fontSize: 14, lineHeight: 17, marginTop: 3 },
});
