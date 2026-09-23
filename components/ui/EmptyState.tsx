import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '../AppIcon';
import { CORES } from '../../constants/theme';

interface EmptyStateProps {
  icon: string;
  iconSet?: 'Ionicons' | 'MaterialCommunityIcons';
  title: string;
  subtitle?: string;
  /** 'dashed' = card com borda tracejada (padrão usado nas listas). 'plain' = só o conteúdo, sem card. */
  variant?: 'dashed' | 'plain';
  /** Cor de destaque do ícone/orb — por padrão usa o verde do app, mas cada tela pode passar a sua. */
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Estado vazio padronizado: círculo com ícone + título + (opcional) subtítulo.
 * Usado em qualquer lista sem itens (pets, eventos, recompensas, pacientes, resgates...).
 */
export function EmptyState({
  icon,
  iconSet = 'Ionicons',
  title,
  subtitle,
  variant = 'dashed',
  accentColor = CORES.secundaria,
  style,
}: EmptyStateProps) {
  return (
    <View style={[s.container, variant === 'dashed' && s.dashed, style]}>
      <View style={[s.orb, { backgroundColor: `${accentColor}1f` }]}>
        <AppIcon name={icon} set={iconSet} size={27} color={accentColor} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  dashed: {
    backgroundColor: CORES.fundoCard,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: CORES.borda,
    borderStyle: 'dashed',
  },
  orb: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '700', color: CORES.texto, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 12, color: CORES.textoSecundario, textAlign: 'center', lineHeight: 17 },
});