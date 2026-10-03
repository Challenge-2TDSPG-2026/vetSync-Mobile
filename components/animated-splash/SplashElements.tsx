import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { batida, curva, fase } from './splashAnimations';
import { QTD_PONTOS_ORBITA, QTD_RASTRO, SPLASH_COLORS, TIMELINE } from './splashConstants';

type Base = { t: SharedValue<number>; cx: number; cy: number };

type Props = Base & {
  largura: number; // largura do logo
  altura: number; // altura do logo
  telaL: number;
  telaA: number;
};

/**
 * "Sincronia": duas orbes (tutor e veterinário) cruzam a tela em curvas e se
 * encontram no centro; o encontro dispara uma onda, o logo bate como um coração
 * emitindo novas ondas, e pontos orbitam o símbolo. Só Views com transform/opacidade.
 */
export function SplashElements({ t, cx, cy, largura, altura, telaL, telaA }: Props) {
  const raioOrbita = (altura / 2) * 1.12;
  const d0 = largura * 0.9;
  const marcas = useMemo(() => Array.from({ length: QTD_RASTRO }, (_, k) => k), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Brilho t={t} cx={cx} cy={cy} tamanho={largura * 1.7} />
      <Onda t={t} cx={cx} cy={cy} tamanho={d0} inicio={1050} duracao={1000} escala={4.2} cor={SPLASH_COLORS.destaque} />
      <Onda t={t} cx={cx} cy={cy} tamanho={d0} inicio={TIMELINE.batidas[0]} duracao={850} escala={3} cor={SPLASH_COLORS.texto} />
      <Onda t={t} cx={cx} cy={cy} tamanho={d0} inicio={TIMELINE.batidas[1]} duracao={850} escala={3.4} cor={SPLASH_COLORS.destaque} />
      <Orbita t={t} cx={cx} cy={cy} raio={raioOrbita} />
      {marcas.map((k) => (
        <Orbe key={`a${k}`} t={t} cx={cx} cy={cy} sx={-telaL * 0.55} sy={-telaA * 0.22} k={k} cor={SPLASH_COLORS.destaque} />
      ))}
      {marcas.map((k) => (
        <Orbe key={`b${k}`} t={t} cx={cx} cy={cy} sx={telaL * 0.55} sy={telaA * 0.24} k={k} cor={SPLASH_COLORS.texto} />
      ))}
    </View>
  );
}

/** Cabeça (k = 0) ou ponto do rastro de uma orbe, em trajetória curva até o centro. */
function Orbe({ t, cx, cy, sx, sy, k, cor }: Base & { sx: number; sy: number; k: number; cor: string }) {
  const tamanho = k === 0 ? 34 : Math.max(8, 22 - k * 2.6);
  const nucleo = tamanho * (k === 0 ? 0.42 : 0.55);

  const estilo = useAnimatedStyle(() => {
    const total = TIMELINE.orbes[1] - TIMELINE.orbes[0];
    const bruto = (t.value - TIMELINE.orbes[0]) / total - k * 0.045;
    const pk = Math.min(Math.max(bruto, 0), 1);
    const e = curva(pk, 'suave');

    const len = Math.sqrt(sx * sx + sy * sy);
    const nx = sy / len; // perpendicular à direção de viagem (-dy, dx), com dx = -sx, dy = -sy
    const ny = -sx / len;
    const arco = 0.28 * len * Math.sin(Math.PI * e);

    const entrada = Math.min(Math.max(bruto * 6, 0), 1);
    const saida = 1 - fase(t.value, [1020, 1200], 'linear');
    const peso = k === 0 ? 1 : 0.7 * (1 - k / QTD_RASTRO);

    return {
      opacity: entrada * saida * peso,
      transform: [
        { translateX: sx * (1 - e) + nx * arco },
        { translateY: sy * (1 - e) + ny * arco },
        { scale: 1 - 0.35 * e },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: tamanho,
          height: tamanho,
          left: cx - tamanho / 2,
          top: cy - tamanho / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        estilo,
      ]}
    >
      <View style={{ position: 'absolute', width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: cor, opacity: 0.2 }} />
      <View style={{ width: nucleo, height: nucleo, borderRadius: nucleo / 2, backgroundColor: cor }} />
    </Animated.View>
  );
}

/** Brilho suave no instante do encontro (opacidade baixa, sem flash intenso). */
function Brilho({ t, cx, cy, tamanho }: Base & { tamanho: number }) {
  const estilo = useAnimatedStyle(() => {
    const b = batida(t.value, 1000, 600);
    return { opacity: 0.22 * b, transform: [{ scale: 0.5 + 0.9 * b }] };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          left: cx - tamanho / 2,
          top: cy - tamanho / 2,
          backgroundColor: SPLASH_COLORS.destaque,
        },
        estilo,
      ]}
    />
  );
}

/** Anel que se expande e some (ondas do encontro e das batidas). */
function Onda({ t, cx, cy, tamanho, inicio, duracao, escala, cor }: Base & { tamanho: number; inicio: number; duracao: number; escala: number; cor: string }) {
  const estilo = useAnimatedStyle(() => {
    const p = fase(t.value, [inicio, inicio + duracao], 'saida');
    const ativo = t.value > inicio ? 1 : 0;
    return { opacity: ativo * 0.5 * (1 - p), transform: [{ scale: 0.3 + (escala - 0.3) * p }] };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: tamanho,
          height: tamanho,
          borderRadius: tamanho / 2,
          left: cx - tamanho / 2,
          top: cy - tamanho / 2,
          borderWidth: 2,
          borderColor: cor,
        },
        estilo,
      ]}
    />
  );
}

/** Anel de pontos que gira em desaceleração ao redor do logo. */
function Orbita({ t, cx, cy, raio }: Base & { raio: number }) {
  const pontos = useMemo(
    () =>
      Array.from({ length: QTD_PONTOS_ORBITA }, (_, i) => {
        const ang = (Math.PI * 2 * i) / QTD_PONTOS_ORBITA;
        const grande = i % 3 === 0;
        return { x: Math.cos(ang) * raio, y: Math.sin(ang) * raio, s: grande ? 6 : 3, grande };
      }),
    [raio],
  );

  const estilo = useAnimatedStyle(() => {
    const giro = fase(t.value, TIMELINE.orbita, 'saida');
    const entra = fase(t.value, [TIMELINE.orbita[0], TIMELINE.orbita[0] + 350], 'linear');
    const sai = fase(t.value, [TIMELINE.final[0] + 100, TIMELINE.final[1]], 'linear');
    return {
      opacity: entra * (1 - 0.9 * sai),
      transform: [{ rotate: `${-120 + 120 * giro}deg` }, { scale: 1.18 - 0.18 * giro }],
    };
  });

  return (
    <Animated.View
      style={[{ position: 'absolute', width: raio * 2, height: raio * 2, left: cx - raio, top: cy - raio }, estilo]}
    >
      {pontos.map((p, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            width: p.s,
            height: p.s,
            borderRadius: p.s / 2,
            left: raio + p.x - p.s / 2,
            top: raio + p.y - p.s / 2,
            backgroundColor: p.grande ? SPLASH_COLORS.destaque : SPLASH_COLORS.texto,
            opacity: p.grande ? 1 : 0.6,
          }}
        />
      ))}
    </Animated.View>
  );
}
