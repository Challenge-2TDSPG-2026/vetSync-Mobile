import React, { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StatusBar, StyleSheet, useWindowDimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SplashBackground } from './SplashBackground';
import { SplashElements } from './SplashElements';
import { SplashLogo } from './SplashLogo';
import { SplashText } from './SplashText';
import { LOGO_ASPECTO, SPLASH_COLORS, SPLASH_CONFIG } from './splashConstants';

type Props = {
  /** true quando o app terminou de carregar (tema, auth, dados essenciais). */
  pronto: boolean;
  /** Chamado uma única vez quando a abertura terminou (ou falhou) e pode sair da tela. */
  onFinish: () => void;
};

/** Se qualquer parte da animação lançar erro, cai direto para a interface. */
class SplashErrorBoundary extends Component<{ onError: () => void; children: ReactNode }> {
  state = { erro: false };
  static getDerivedStateFromError() {
    return { erro: true };
  }
  componentDidCatch(erro: unknown) {
    console.warn('Falha na abertura animada; seguindo para o app.', erro);
    this.props.onError();
  }
  render() {
    return this.state.erro ? null : this.props.children;
  }
}

function esconderSplashNativa() {
  SplashScreen.hideAsync().catch(() => {});
}

function AnimatedSplashConteudo({ pronto, onFinish }: Props) {
  const reduzido = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0); // relógio da animação, em ms
  const saida = useSharedValue(0);

  const [introConcluida, setIntroConcluida] = useState(false);
  const [esgotou, setEsgotou] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const iniciou = useRef(false);
  const finalizou = useRef(false);
  const saidaAgendada = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const agendar = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const finalizar = useCallback(() => {
    if (finalizou.current) return;
    finalizou.current = true;
    esconderSplashNativa();
    onFinish();
  }, [onFinish]);

  // Inicia a linha do tempo no primeiro frame desenhado e só então libera a splash nativa.
  const iniciar = useCallback(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    t.set(
      withTiming(SPLASH_CONFIG.duracaoIntroMs, {
        duration: SPLASH_CONFIG.duracaoIntroMs,
        easing: Easing.linear,
      }),
    );
    agendar(() => setIntroConcluida(true), SPLASH_CONFIG.duracaoIntroMs);
    agendar(() => setEsgotou(true), SPLASH_CONFIG.tempoMaximoEsperaMs);
    requestAnimationFrame(esconderSplashNativa);
  }, [agendar, t]);

  // Rede de segurança: se o onLayout não disparar, não deixa nada preso.
  useEffect(() => {
    agendar(iniciar, 1000);
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
  }, [agendar, iniciar]);

  // Saída: intro terminou E app pronto (ou tempo máximo esgotado).
  useEffect(() => {
    if (saidaAgendada.current || !introConcluida || !(pronto || esgotou)) return;
    saidaAgendada.current = true;
    // pequeno intervalo para o redirecionamento de rota assentar antes do fade
    agendar(() => {
      setSaindo(true);
      saida.set(
        withTiming(1, {
          duration: SPLASH_CONFIG.duracaoSaidaMs,
          easing: Easing.inOut(Easing.cubic),
        }),
      );
      agendar(finalizar, SPLASH_CONFIG.duracaoSaidaMs);
    }, 120);
  }, [agendar, esgotou, finalizar, introConcluida, pronto, saida]);

  const estiloSaida = useAnimatedStyle(() => ({
    opacity: 1 - saida.value,
    transform: [{ scale: reduzido ? 1 : 1 + 0.04 * saida.value }],
  }));

  const base = Math.min(width, height);
  const cx = width / 2;
  const cy = height / 2 - base * 0.03;
  const logoLargura = Math.round(Math.min(base * 0.38, 230));
  const logoAltura = Math.round(logoLargura * LOGO_ASPECTO);
  const tamanhoTexto = Math.round(Math.min(Math.max(base * 0.085, 26), 44));
  const topoTexto = cy + logoAltura / 2 + 20;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.raiz, estiloSaida]}
      pointerEvents={saindo ? 'none' : 'auto'}
      onLayout={iniciar}
      accessibilityLabel="VetSync carregando"
    >
      <StatusBar barStyle="light-content" backgroundColor={SPLASH_COLORS.fundo} />
      <SplashBackground t={t} cx={cx} cy={cy} base={base} />
      {!reduzido && (
        <SplashElements t={t} cx={cx} cy={cy} largura={logoLargura} altura={logoAltura} telaL={width} telaA={height} />
      )}
      <SplashLogo t={t} cx={cx} cy={cy} largura={logoLargura} altura={logoAltura} reduzido={reduzido} />
      <SplashText
        t={t}
        cx={cx}
        topo={topoTexto}
        tamanho={tamanhoTexto}
        larguraLinha={Math.round(logoLargura * 0.8)}
        reduzido={reduzido}
      />
    </Animated.View>
  );
}

export function AnimatedSplash(props: Props) {
  return (
    <SplashErrorBoundary
      onError={() => {
        esconderSplashNativa();
        props.onFinish();
      }}
    >
      <AnimatedSplashConteudo {...props} />
    </SplashErrorBoundary>
  );
}

const styles = StyleSheet.create({
  raiz: { zIndex: 1000, elevation: 1000, backgroundColor: SPLASH_COLORS.fundo },
});
