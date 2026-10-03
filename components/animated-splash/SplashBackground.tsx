import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { fase } from './splashAnimations';
import { SPLASH_COLORS, SPLASH_CONFIG, TIMELINE } from './splashConstants';

type Props = { t: SharedValue<number>; cx: number; cy: number; base: number };

const ANEIS = [0.95, 0.72, 0.5, 0.3];

/** Cor sólida desde o primeiro frame + gradiente sutil + brilho dourado que "respira". */
export function SplashBackground({ t, cx, cy, base }: Props) {
  const gradiente = useAnimatedStyle(() => ({ opacity: fase(t.value, TIMELINE.fundo) }));
  const brilho = useAnimatedStyle(() => {
    const p = fase(t.value, [0, SPLASH_CONFIG.duracaoIntroMs], 'linear');
    return { opacity: fase(t.value, TIMELINE.fundo), transform: [{ scale: 0.9 + 0.18 * p }] };
  });

  return (
    <>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: SPLASH_COLORS.fundo }]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gradiente]}>
        <LinearGradient
          colors={[SPLASH_COLORS.fundo, SPLASH_COLORS.fundoGradiente, SPLASH_COLORS.fundo]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, brilho]}>
        {ANEIS.map((f, i) => {
          const d = base * 1.9 * f;
          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: d,
                height: d,
                borderRadius: d / 2,
                left: cx - d / 2,
                top: cy - d / 2,
                backgroundColor: SPLASH_COLORS.destaque,
                opacity: 0.035,
              }}
            />
          );
        })}
      </Animated.View>
    </>
  );
}
