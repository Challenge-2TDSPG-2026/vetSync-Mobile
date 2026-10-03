import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { fase } from './splashAnimations';
import { SPLASH_COLORS, TIMELINE } from './splashConstants';

type Props = {
  t: SharedValue<number>;
  cx: number;
  topo: number;
  tamanho: number;
  larguraLinha: number;
  reduzido: boolean;
};

const LETRAS = 'VetSync'.split('');

/** "VetSync" letra por letra (escalonado) e uma linha de luz dourada abaixo. */
export function SplashText({ t, cx, topo, tamanho, larguraLinha, reduzido }: Props) {
  return (
    <View
      style={[styles.caixa, { top: topo, left: 0, width: cx * 2 }]}
      pointerEvents="none"
      accessible
      accessibilityRole="header"
      accessibilityLabel="VetSync"
    >
      <View style={styles.linhaLetras}>
        {LETRAS.map((letra, i) => (
          <Letra key={i} t={t} indice={i} letra={letra} tamanho={tamanho} reduzido={reduzido} />
        ))}
      </View>
      <Linha t={t} largura={larguraLinha} reduzido={reduzido} margem={Math.round(tamanho * 0.4)} />
    </View>
  );
}

function Letra({ t, indice, letra, tamanho, reduzido }: { t: SharedValue<number>; indice: number; letra: string; tamanho: number; reduzido: boolean }) {
  const estilo = useAnimatedStyle(() => {
    const ini = TIMELINE.nome[0] + indice * 65;
    const p = fase(t.value, [ini, ini + 420], 'saida');
    if (reduzido) return { opacity: p };
    return { opacity: p, transform: [{ translateY: 16 * (1 - p) }, { scale: 0.88 + 0.12 * p }] };
  });
  const dourada = indice >= 3;
  return (
    <Animated.Text
      allowFontScaling={false}
      style={[styles.letra, { fontSize: tamanho, color: dourada ? SPLASH_COLORS.destaque : SPLASH_COLORS.texto }, estilo]}
    >
      {letra}
    </Animated.Text>
  );
}

function Linha({ t, largura, reduzido, margem }: { t: SharedValue<number>; largura: number; reduzido: boolean; margem: number }) {
  const estilo = useAnimatedStyle(() => {
    const p = fase(t.value, [2250, 2650], 'suave');
    const sai = fase(t.value, [2600, 2800], 'linear');
    return {
      opacity: reduzido ? 0 : 0.8 * (1 - 0.6 * sai) * (p > 0 ? 1 : 0),
      transform: [{ scaleX: p }],
    };
  });
  return <Animated.View style={[{ width: largura, height: 2, borderRadius: 1, marginTop: margem, backgroundColor: SPLASH_COLORS.destaque }, estilo]} />;
}

const styles = StyleSheet.create({
  caixa: { position: 'absolute', alignItems: 'center' },
  linhaLetras: { flexDirection: 'row', alignItems: 'center' },
  letra: { fontWeight: '700', letterSpacing: 2 },
});
