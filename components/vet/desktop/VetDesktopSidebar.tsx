import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useVet } from '../../../context/VetContext';
import { useMeusResgates } from '../../../hooks/useRecompensas';
import { statusExibicao } from '../../../utils/eventoStatus';
import type { AppTheme } from '../../../constants/theme';

type TabBarRenderer = NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>;
type SidebarProps = Parameters<TabBarRenderer>[0];

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type ItemMenu = {
  label: string;
  icon: IconName;
  /** Nome da rota dentro de (vet). */
  rota: string;
};

type GrupoMenu = { titulo?: string; itens: ItemMenu[] };

/** Mesma organização da tela Opções do mobile: SIA em destaque e grupos Atendimento e Clínica. */
const GRUPOS: GrupoMenu[] = [
  { itens: [{ label: 'SIA · Assistente veterinário', icon: 'sparkles-outline', rota: 'sia' }] },
  {
    titulo: 'Atendimento',
    itens: [
      { label: 'Consultas', icon: 'medkit-outline', rota: 'consultas' },
      { label: 'Pacientes', icon: 'paw-outline', rota: 'pacientes' },
      { label: 'Disponibilidade', icon: 'calendar-outline', rota: 'disponibilidade' },
    ],
  },
  {
    titulo: 'Clínica',
    itens: [
      { label: 'Resgates', icon: 'gift-outline', rota: 'resgates' },
      { label: 'Relatórios', icon: 'bar-chart-outline', rota: 'relatorios' },
    ],
  },
];

/** Barra lateral fixa do painel do veterinário (somente desktop). */
export function VetDesktopSidebar({ state, navigation }: SidebarProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { eventos } = useVet();
  const { data: resgates = [] } = useMeusResgates(true);
  const rotaAtiva = state.routes[state.index]?.name;

  // Selos de pendência, iguais aos da tela Opções do mobile.
  const selos: Record<string, number> = {
    consultas: eventos.filter(e => statusExibicao(e) === 'ATRASADO').length,
    resgates: resgates.filter(r => r.status === 'PENDENTE').length,
  };

  const irPara = (item: ItemMenu) => {
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
          <Image source={LOGO} style={s.brandLogo} resizeMode="contain" accessibilityLabel="VetSync" />
        </View>
        <Text style={s.brandText}>Painel Vet</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.nav}>
        {GRUPOS.map((grupo, indice) => (
          <View key={grupo.titulo ?? `grupo-${indice}`} style={s.grupo}>
            {grupo.titulo ? <Text style={s.grupoTitulo}>{grupo.titulo}</Text> : null}
            {grupo.itens.map(item => {
              const ativo = item.rota === rotaAtiva;
              const selo = selos[item.rota] ?? 0;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => irPara(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: ativo }}
                  accessibilityLabel={selo > 0 ? `${item.label}, ${selo} pendente${selo === 1 ? '' : 's'}` : item.label}
                  style={({ pressed, hovered }: { pressed: boolean; hovered?: boolean }) => [
                    s.item,
                    ativo && s.itemAtivo,
                    !ativo && (hovered || pressed) && s.itemHover,
                  ]}
                >
                  <Ionicons name={item.icon} size={18} color={ativo ? theme.colors.onPrimary : SIDEBAR_TEXTO} />
                  <Text style={[s.itemText, ativo && s.itemTextAtivo]}>{item.label}</Text>
                  {selo > 0 ? (
                    <View style={s.selo}>
                      <Text style={s.seloTexto}>{selo > 99 ? '99+' : selo}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const LOGO = require('../../../assets/logo.png');

const SIDEBAR_BG = '#0C2418';
const SIDEBAR_TEXTO = '#CFE3D8';
const SIDEBAR_HOVER = '#15382A';

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    sidebar: { width: 248, backgroundColor: SIDEBAR_BG, paddingVertical: 24, paddingHorizontal: 16 },
    brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingBottom: 24 },
    brandIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: SIDEBAR_HOVER },
    brandLogo: { width: 26, height: 32 },
    brandText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    nav: { gap: 18 },
    grupo: { gap: 4 },
    grupoTitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: '#7FA793', paddingHorizontal: 12, paddingBottom: 4 },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10 },
    itemAtivo: { backgroundColor: theme.colors.primary },
    itemHover: { backgroundColor: SIDEBAR_HOVER },
    itemText: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '500', color: SIDEBAR_TEXTO },
    itemTextAtivo: { color: theme.colors.onPrimary, fontWeight: '700' },
    selo: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: theme.colors.danger, alignItems: 'center', justifyContent: 'center' },
    seloTexto: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  });
}
