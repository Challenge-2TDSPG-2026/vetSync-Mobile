import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { obterVisualTipoEvento } from '../../constants';
import { withAlpha, type AppTheme } from '../../constants/theme';
import { formatarDataEvento } from '../../utils/eventoStatus';
import { ROTULO_STATUS, rotuloPrazo, type PlanoItem, type PlanoStatus } from '../../utils/planoPreventivo';

interface Props {
  item: PlanoItem;
  onAgendar?: (item: PlanoItem) => void;
  onAbrir?: (item: PlanoItem) => void;
  /** Esconde o botão de agendar (usado no card compacto do dashboard). */
  compacto?: boolean;
  semBorda?: boolean;
}

export function corDoStatus(theme: AppTheme, status: PlanoStatus): string {
  switch (status) {
    case 'ATRASADO': return theme.colors.danger;
    case 'VENCENDO': return theme.colors.warning;
    case 'EM_DIA': return theme.colors.success;
    default: return theme.colors.info;
  }
}

export function PlanoItemRow({ item, onAgendar, onAbrir, compacto, semBorda }: Props) {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme), [theme]);
  const cor = corDoStatus(theme, item.status);
  const visual = obterVisualTipoEvento(item.titulo);
  const prazo = rotuloPrazo(item);
  const mostrarAgendar = !compacto && item.podeAgendar && !!onAgendar;

  const descricaoA11y = `${item.titulo}. ${ROTULO_STATUS[item.status]}. ${prazo}.`;

  return (
    <View style={[s.row, !semBorda && s.rowBorda]}>
      <Pressable
        style={s.main}
        onPress={onAbrir ? () => onAbrir(item) : undefined}
        disabled={!onAbrir}
        accessibilityRole={onAbrir ? 'button' : 'text'}
        accessibilityLabel={descricaoA11y}
      >
        <View style={[s.icone, modoSimples && s.iconeSimples, { backgroundColor: visual.cor }]}>
          <AppIcon name={visual.icon} set={visual.iconSet} size={modoSimples ? 24 : 18} color={theme.colors.onPrimary} />
        </View>
        <View style={s.info}>
          <Text style={[s.titulo, modoSimples && s.tituloSimples]} numberOfLines={2}>{item.titulo}</Text>
          <Text style={[s.prazo, modoSimples && s.prazoSimples, { color: cor }]}>{prazo}</Text>
          {item.dataVencimento && !modoSimples ? (
            <Text style={s.data}>{formatarDataEvento(item.dataVencimento)}</Text>
          ) : null}
          {item.descricao && !compacto && !modoSimples ? (
            <Text style={s.descricao} numberOfLines={2}>{item.descricao}</Text>
          ) : null}
        </View>
        <View style={[s.badge, { backgroundColor: withAlpha(cor, 0.14) }]}>
          <Text style={[s.badgeTexto, { color: cor }]}>{ROTULO_STATUS[item.status]}</Text>
        </View>
      </Pressable>

      {mostrarAgendar ? (
        <Pressable
          style={[s.agendar, modoSimples && s.agendarSimples]}
          onPress={() => onAgendar?.(item)}
          accessibilityRole="button"
          accessibilityLabel={`Agendar ${item.titulo}`}
          accessibilityHint="Abre o agendamento na clínica com este cuidado selecionado"
        >
          <AppIcon name="calendar-outline" set="Ionicons" size={modoSimples ? 20 : 16} color={theme.colors.onPrimary} />
          <Text style={[s.agendarTexto, modoSimples && s.agendarTextoSimples]}>Agendar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  row: { paddingHorizontal: 18, paddingVertical: 14, gap: 12 },
  rowBorda: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.pages.home.statsCard.border },
  main: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icone: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconeSimples: { width: 58, height: 58, borderRadius: 29 },
  info: { flex: 1, minWidth: 0 },
  titulo: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  tituloSimples: { fontSize: 21 },
  prazo: { fontSize: 13, fontWeight: '700', marginTop: 3 },
  prazoSimples: { fontSize: 18 },
  data: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  descricao: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4, lineHeight: 17 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  badgeTexto: { fontSize: 11, fontWeight: '800' },
  agendar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 11, minHeight: 44,
  },
  agendarSimples: { paddingVertical: 16, minHeight: 56 },
  agendarTexto: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
  agendarTextoSimples: { fontSize: 19 },
});