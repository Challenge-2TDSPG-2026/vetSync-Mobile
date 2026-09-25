import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

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
  accentColor,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const accent = accentColor ?? theme.colors.primary;
  return (
    <View style={[s.container, variant === 'dashed' && s.dashed, style]}>
      <View style={[s.orb, { backgroundColor: `${accent}1f` }]}>
        <AppIcon name={icon} set={iconSet} size={27} color={accent} />
      </View>
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 36 },
  dashed: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  orb: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 17 },
  });
}
