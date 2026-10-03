import React from 'react';
import { Image } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { batida, fase } from './splashAnimations';
import { SPLASH_LOGO, TIMELINE } from './splashConstants';

type Props = {
  t: SharedValue<number>;
  cx: number;
  cy: number;
  largura: number;
  altura: number;
  reduzido: boolean;
};

/**
 * Logo oficial: floresce no encontro das orbes (opacidade + escala 0.6 → 1),
 * bate duas vezes como um coração (lub-dub) e dá um pulso discreto no final.
 */
export function SplashLogo({ t, cx, cy, largura, altura, reduzido }: Props) {
  const estilo = useAnimatedStyle(() => {
    const p = fase(t.value, TIMELINE.logo, 'saida');
    if (reduzido) return { opacity: p };
    const bate =
      0.07 * batida(t.value, TIMELINE.batidas[0], 300) +
      0.045 * batida(t.value, TIMELINE.batidas[1], 300) +
      0.025 * batida(t.value, TIMELINE.final[0], 500);
    return {
      opacity: p,
      transform: [{ translateY: (1 - p) * 10 }, { scale: (0.6 + 0.4 * p) * (1 + bate) }],
    };
  });

  return (
    <Animated.View
      style={[{ position: 'absolute', width: largura, height: altura, left: cx - largura / 2, top: cy - altura / 2 }, estilo]}
    >
      <Image
        source={SPLASH_LOGO}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={{ width: largura, height: altura }}
      />
    </Animated.View>
  );
}
