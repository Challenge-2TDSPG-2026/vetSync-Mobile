import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/** Anima uma opacidade pulsando entre 0.35 e 0.85, em loop — o "pulso" clássico de skeleton. */
function usePulso() {
  const valor = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 0.85, duration: 650, useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0.35, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [valor]);

  return valor;
}

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bloco básico de skeleton — um retângulo cinza pulsando. Use pra montar qualquer formato. */
export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBlockProps) {
  const opacidade = usePulso();
  const { theme } = useTheme();
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius, backgroundColor: theme.colors.surfaceSubtle, opacity: opacidade },
        style,
      ]}
    />
  );
}

/** Uma "linha" de lista (ícone redondo + duas linhas de texto) — imita o padrão eventoRow usado no app todo. */
export function SkeletonRow({ comIcone = true, style }: { comIcone?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[s.row, style]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando conteúdo"
    >
      {comIcone && <SkeletonBlock width={46} height={46} borderRadius={16} />}
      <View style={s.rowTextos}>
        <SkeletonBlock width="55%" height={14} />
        <SkeletonBlock width="35%" height={12} />
      </View>
    </View>
  );
}

/** Várias linhas seguidas — pra substituir o ActivityIndicator solto em listas de eventos/itens. */
export function SkeletonList({ linhas = 3, comIcone = true }: { linhas?: number; comIcone?: boolean }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Carregando itens">
      {Array.from({ length: linhas }).map((_, i) => (
        <SkeletonRow key={i} comIcone={comIcone} />
      ))}
    </View>
  );
}

/** Um bloco maior, tipo card/banner/gráfico de progresso ainda carregando. */
export function SkeletonCard({ height = 90, borderRadius = 22, style }: { height?: number; borderRadius?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Carregando conteúdo">
      <SkeletonBlock height={height} borderRadius={borderRadius} style={style} />
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, paddingVertical: 12 },
  rowTextos: { flex: 1, gap: 8 },
});