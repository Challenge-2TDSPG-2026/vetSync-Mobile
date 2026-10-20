import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import type { AppTheme } from '../../../constants/theme';

type TabBarRenderer = NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>;
type SidebarProps = Parameters<TabBarRenderer>[0];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type ItemMenu = {
  label: string;
  icon: IconName;
  /** Nome da rota dentro de (vet); ausente = item de navegação externa (SIA). */
  rota?: string;
  href?: '/(tutor)/assistente';
};

/** Itens da barra lateral do veterinário, na ordem pedida. */
const ITENS: ItemMenu[] = [
  { label: 'SIA · Assistente veterinário', icon: 'sparkles-outline', href: '/(tutor)/assistente' },
  { label: 'Ferramentas', icon: 'construct-outline', rota: 'opcoes' },
  { label: 'Consultas', icon: 'medkit-outline', rota: 'consultas' },
  { label: 'Pacientes', icon: 'paw-outline', rota: 'pacientes' },
  { label: 'Disponibilidade', icon: 'calendar-outline', rota: 'disponibilidade' },
  { label: 'Resgates', icon: 'gift-outline', rota: 'resgates' },
  { label: 'Relatórios', icon: 'bar-chart-outline', rota: 'relatorios' },
];

/** Barra lateral fixa do painel do veterinário (somente desktop). */
export function VetDesktopSidebar({ state, navigation }: SidebarProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const rotaAtiva = state.routes[state.index]?.name;

  const irPara = (item: ItemMenu) => {
    if (item.href) {
      router.push(item.href);
      return;
    }
    if (!item.rota) return;
    const route = state.routes.find(r => r.name === item.rota);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (rotaAtiva !== item.rota && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };

  return (
    <View style={s.sidebar}>
      <Pressable
        style={s.brand}
        onPress={() => router.push('/(vet)')}
        accessibilityRole="link"
        accessibilityLabel="Ir para o painel inicial"
      >
        <View style={s.brandIcon}>
          <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
        </View>
        <Text style={s.brandText}>Painel Vet</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.nav}>
        {ITENS.map(item => {
          const ativo = !!item.rota && item.rota === rotaAtiva;
          return (
            <Pressable
              key={item.label}
              onPress={() => irPara(item)}
              accessibilityRole="button"
              accessibilityState={{ selected: ativo }}
              accessibilityLabel={item.label}
              style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                s.item,
                ativo && s.itemAtivo,
                !ativo && (hovered || pressed) && s.itemHover,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={ativo ? theme.colors.onPrimary : SIDEBAR_TEXTO}
              />
              <Text style={[s.itemText, ativo && s.itemTextAtivo]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const SIDEBAR_BG = '#0C2418';
const SIDEBAR_TEXTO = '#CFE3D8';
const SIDEBAR_HOVER = '#15382A';

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    sidebar: { width: 248, backgroundColor: SIDEBAR_BG, paddingVertical: 24, paddingHorizontal: 16 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 24 },
    brandIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    brandText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    nav: { gap: 4 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10 },
    itemAtivo: { backgroundColor: theme.colors.primary },
    itemHover: { backgroundColor: SIDEBAR_HOVER },
    itemText: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '500', color: SIDEBAR_TEXTO },
    itemTextAtivo: { color: theme.colors.onPrimary, fontWeight: '700' },
  });
}