import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { marcarDicaVista, verificarDicaVista } from '../../storage/petStorage';
import { AppIcon } from '../AppIcon';

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
  accentColor = '#22a06b',
  onFechar,
  simples = false,
  style,
}: DicaTelaProps) {
  return (
    <View style={[styles.container, { borderLeftColor: accentColor }, style]}>
      <View style={styles.iconWrap}>
        <AppIcon name="bulb-outline" set="Ionicons" size={22} color={accentColor} />
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
        <AppIcon name="close" set="Ionicons" size={18} color="#7a6a5e" />
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderRadius: 12,
    backgroundColor: '#f0ece5',
  },
  iconWrap: {
    paddingTop: 1,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#1a1512',
    fontSize: 15,
    fontWeight: '700',
  },
  simpleTitle: {
    fontSize: 18,
  },
  text: {
    color: '#7a6a5e',
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