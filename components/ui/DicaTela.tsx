import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { marcarDicaVista, verificarDicaVista } from '../../storage/petStorage';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

interface DicaTelaProps {
  titulo: string;
  texto: string;
  accentColor?: string;
  onFechar: () => void;
  simples?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function DicaTela({
  titulo,
  texto,
  accentColor,
  onFechar,
  simples = false,
  style,
}: DicaTelaProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const accent = accentColor ?? theme.colors.primary;
  return (
    <View style={[styles.container, { borderLeftColor: accent }, style]}>
      <View style={styles.iconWrap}>
        <AppIcon name="bulb-outline" set="Ionicons" size={22} color={accent} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, simples && styles.simpleTitle]}>{titulo}</Text>
        <Text style={[styles.text, simples && styles.simpleText]}>{texto}</Text>
      </View>
      <Pressable
        onPress={onFechar}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Fechar dica"
        style={styles.closeButton}
      >
        <AppIcon name="close" set="Ionicons" size={18} color={theme.colors.textSecondary} />
      </Pressable>
    </View>
  );
}

/**
 * Controla se a dica explicativa de uma tela deve aparecer.
 * Aparece só uma vez por tela (por aparelho) — depois que o usuário fecha,
 * fica guardado e não volta a aparecer.
 *
 * Uso:
 *   const { visivel, fechar } = useDicaPrimeiraVisita('tutor-agenda');
 *   {visivel && <DicaTela titulo="..." texto="..." onFechar={fechar} />}
 */
export function useDicaPrimeiraVisita(idTela: string) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    verificarDicaVista(idTela).then(jaVista => {
      if (ativo && !jaVista) setVisivel(true);
    });
    return () => {
      ativo = false;
    };
  }, [idTela]);

  const fechar = useCallback(() => {
    setVisivel(false);
    void marcarDicaVista(idTela);
  }, [idTela]);

  return { visivel, fechar };
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceSubtle,
  },
  iconWrap: {
    paddingTop: 1,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  simpleTitle: {
    fontSize: 18,
  },
  text: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  simpleText: {
    fontSize: 16,
    lineHeight: 23,
  },
  closeButton: {
    padding: 2,
  },
  });
}
