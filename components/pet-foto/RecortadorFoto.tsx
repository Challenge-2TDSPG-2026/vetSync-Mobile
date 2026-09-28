import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, PanResponder, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { GestureResponderEvent, PanResponderGestureState, ViewStyle } from 'react-native';
import Svg, { ClipPath, Defs, G, Line, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ArquivoUpload } from '../../services/api/httpClient';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  uriOriginal: string;
  onConcluir: (arquivo: ArquivoUpload) => void;
  onCancelar: () => void;
  /** Formato da moldura de recorte. O arquivo enviado é sempre um quadrado. */
  formato?: 'circulo' | 'quadrado';
};

const TAMANHO_FINAL = 720;
const STAGE_MAX = 360;
const MARGEM_MOLDURA = 28;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_PASSO = 0.4;
const ESCURECIMENTO = 0.6;

function obterDimensoes(uri: string): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (largura, altura) => resolve({ largura, altura }), reject);
  });
}

function distanciaEntreToques(toques: readonly { pageX: number; pageY: number }[]): number {
  const [a, b] = toques;
  return Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
}

function limitar(valor: number, max: number): number {
  return Math.min(Math.max(valor, -max), max);
}

// Na web, evita que o navegador use o arrasto/pinch para rolar a página ou dar zoom na tela.
const webGesto = Platform.OS === 'web' ? ({ touchAction: 'none', cursor: 'grab', userSelect: 'none' } as unknown as ViewStyle) : undefined;

type Handlers = {
  grant: (evt: GestureResponderEvent) => void;
  move: (evt: GestureResponderEvent, g: PanResponderGestureState) => void;
  fim: () => void;
};

/**
 * Recorte no estilo Instagram: a foto ocupa toda a área, a moldura fica fixa no centro, o que está fora dela
 * aparece escurecido e o usuário arrasta / dá zoom na foto por baixo. A moldura sempre fica 100% coberta pela foto.
 */
export function RecortadorFoto({ uriOriginal, onConcluir, onCancelar, formato = 'circulo' }: Props) {
  const { theme } = useTheme();
  const { width: larguraTela } = useWindowDimensions();
  const STAGE = Math.min(STAGE_MAX, Math.max(240, larguraTela - 40));
  const FRAME = STAGE - MARGEM_MOLDURA * 2;

  const [processando, setProcessando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [arrastando, setArrastando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dimensoesImagem, setDimensoesImagem] = useState<{ largura: number; altura: number } | null>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [userScale, setUserScale] = useState(1);

  const gesto = useRef({ startTx: 0, startTy: 0, startScale: 1, startDist: 0 });

  useEffect(() => {
    setErro(null);
    setProcessando(false);
    setCarregando(true);
    setTx(0);
    setTy(0);
    setUserScale(1);
    setDimensoesImagem(null);
    obterDimensoes(uriOriginal)
      .then(setDimensoesImagem)
      .catch(() => setErro('Não foi possível carregar esta foto. Escolha outra e tente novamente.'))
      .finally(() => setCarregando(false));
  }, [uriOriginal]);

  // Escala mínima: a foto cobre exatamente a moldura (como no Instagram). O zoom do usuário multiplica isso.
  const baseScale = dimensoesImagem ? Math.max(FRAME / dimensoesImagem.largura, FRAME / dimensoesImagem.altura) : 1;
  const baseLargura = dimensoesImagem ? dimensoesImagem.largura * baseScale : FRAME;
  const baseAltura = dimensoesImagem ? dimensoesImagem.altura * baseScale : FRAME;

  function limites(escala: number) {
    return {
      maxTx: Math.max(0, (baseLargura * escala - FRAME) / 2),
      maxTy: Math.max(0, (baseAltura * escala - FRAME) / 2),
    };
  }

  function aplicarZoom(novaEscalaBruta: number) {
    const novaEscala = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, novaEscalaBruta));
    const { maxTx, maxTy } = limites(novaEscala);
    setUserScale(novaEscala);
    setTx(v => limitar(v, maxTx));
    setTy(v => limitar(v, maxTy));
  }

  // O PanResponder é criado uma única vez, então seus callbacks enxergariam o estado da 1ª renderização.
  // Guardamos os handlers mais recentes num ref e o PanResponder sempre chama a versão atual.
  const handlers = useRef<Handlers>({ grant: () => {}, move: () => {}, fim: () => {} });

  handlers.current = {
    grant: evt => {
      const toques = evt.nativeEvent.touches;
      gesto.current.startTx = tx;
      gesto.current.startTy = ty;
      gesto.current.startScale = userScale;
      gesto.current.startDist = toques && toques.length >= 2 ? distanciaEntreToques(toques) : 0;
      setArrastando(true);
    },
    // No navegador (mouse), "touches" nem sempre vem preenchido — o arrasto usa gestureState.dx/dy.
    move: (evt, gestureState) => {
      const toques = evt.nativeEvent.touches;
      if (toques && toques.length >= 2) {
        const dist = distanciaEntreToques(toques);
        if (gesto.current.startDist === 0) {
          gesto.current.startDist = dist;
          gesto.current.startScale = userScale;
        }
        aplicarZoom(gesto.current.startScale * (dist / gesto.current.startDist));
        return;
      }
      if (gesto.current.startDist !== 0) {
        // voltou a 1 dedo depois do pinch: re-ancora o arrasto na posição atual
        gesto.current.startDist = 0;
        gesto.current.startTx = tx - gestureState.dx;
        gesto.current.startTy = ty - gestureState.dy;
      }
      const { maxTx, maxTy } = limites(userScale);
      setTx(limitar(gesto.current.startTx + gestureState.dx, maxTx));
      setTy(limitar(gesto.current.startTy + gestureState.dy, maxTy));
    },
    fim: () => setArrastando(false),
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderTerminationRequest: () => false, // o ScrollView do modal não rouba o gesto
      onPanResponderGrant: evt => handlers.current.grant(evt),
      onPanResponderMove: (evt, g) => handlers.current.move(evt, g),
      onPanResponderRelease: () => handlers.current.fim(),
      onPanResponderTerminate: () => handlers.current.fim(),
    })
  ).current;

  async function concluir() {
    if (!dimensoesImagem) return;
    setProcessando(true);
    setErro(null);
    try {
      const totalScale = baseScale * userScale;
      const cropSize = FRAME / totalScale;
      let originX = dimensoesImagem.largura / 2 - (FRAME / 2 + tx) / totalScale;
      let originY = dimensoesImagem.altura / 2 - (FRAME / 2 + ty) / totalScale;
      originX = Math.min(Math.max(originX, 0), Math.max(0, dimensoesImagem.largura - cropSize));
      originY = Math.min(Math.max(originY, 0), Math.max(0, dimensoesImagem.altura - cropSize));
      const resultado = await manipulateAsync(
        uriOriginal,
        [
          { crop: { originX, originY, width: cropSize, height: cropSize } },
          { resize: { width: TAMANHO_FINAL, height: TAMANHO_FINAL } },
        ],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      onConcluir({ uri: resultado.uri, nome: 'foto-pet.jpg', tipoMime: 'image/jpeg' });
    } catch {
      setErro('Não foi possível preparar esta foto. Escolha outra imagem e tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  // Overlay escuro com "buraco" no formato da moldura (regra evenodd).
  const centro = STAGE / 2;
  const raio = FRAME / 2;
  const off = MARGEM_MOLDURA;
  const caminhoTudo = `M0 0H${STAGE}V${STAGE}H0Z`;
  const caminhoMoldura =
    formato === 'circulo'
      ? `M${centro - raio} ${centro}a${raio} ${raio} 0 1 0 ${FRAME} 0a${raio} ${raio} 0 1 0 ${-FRAME} 0Z`
      : `M${off} ${off}h${FRAME}v${FRAME}h${-FRAME}Z`;
  const terco = FRAME / 3;

  return (
    <View style={s.container}>
      <View style={[s.stage, { width: STAGE, height: STAGE }, webGesto]} {...panResponder.panHandlers}>
        {carregando ? (
          <ActivityIndicator color="#fff" />
        ) : dimensoesImagem ? (
          <Image
            source={{ uri: uriOriginal }}
            style={{
              position: 'absolute',
              width: baseLargura,
              height: baseAltura,
              left: (STAGE - baseLargura) / 2,
              top: (STAGE - baseAltura) / 2,
              transform: [{ translateX: tx }, { translateY: ty }, { scale: userScale }],
            }}
            resizeMode="cover"
          />
        ) : null}

        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={STAGE} height={STAGE}>
            <Defs>
              <ClipPath id="moldura">
                <Path d={caminhoMoldura} />
              </ClipPath>
            </Defs>
            <Path d={`${caminhoTudo}${caminhoMoldura}`} fill="#000" fillOpacity={ESCURECIMENTO} fillRule="evenodd" />
            <Path d={caminhoMoldura} fill="none" stroke="#fff" strokeWidth={1.5} strokeOpacity={0.9} />
            {arrastando ? (
              <G clipPath="url(#moldura)" stroke="#fff" strokeOpacity={0.55} strokeWidth={1}>
                <Line x1={off + terco} y1={off} x2={off + terco} y2={off + FRAME} />
                <Line x1={off + terco * 2} y1={off} x2={off + terco * 2} y2={off + FRAME} />
                <Line x1={off} y1={off + terco} x2={off + FRAME} y2={off + terco} />
                <Line x1={off} y1={off + terco * 2} x2={off + FRAME} y2={off + terco * 2} />
              </G>
            ) : null}
          </Svg>
        </View>
      </View>

      <View style={s.zoomRow}>
        <Pressable
          style={[s.zoomBtn, { borderColor: theme.colors.border }, userScale <= ZOOM_MIN && s.desativado]}
          onPress={() => aplicarZoom(userScale - ZOOM_PASSO)}
          disabled={userScale <= ZOOM_MIN || carregando}
          accessibilityRole="button"
          accessibilityLabel="Diminuir zoom"
        >
          <Ionicons name="remove" size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[s.zoomLabel, { color: theme.colors.textSecondary }]}>{Math.round(userScale * 100)}%</Text>
        <Pressable
          style={[s.zoomBtn, { borderColor: theme.colors.border }, userScale >= ZOOM_MAX && s.desativado]}
          onPress={() => aplicarZoom(userScale + ZOOM_PASSO)}
          disabled={userScale >= ZOOM_MAX || carregando}
          accessibilityRole="button"
          accessibilityLabel="Aumentar zoom"
        >
          <Ionicons name="add" size={18} color={theme.colors.text} />
        </Pressable>
      </View>

      <Text style={[s.descricao, { color: theme.colors.textSecondary }]}>Arraste a foto e use a pinça (ou os botões) para ajustar o zoom. A área dentro da moldura será usada.</Text>
      {erro ? <Text style={[s.erro, { color: theme.colors.danger }]} accessibilityRole="alert">{erro}</Text> : null}
      <View style={s.acoes}>
        <Pressable style={[s.secundario, { borderColor: theme.colors.border }]} onPress={onCancelar} disabled={processando} accessibilityRole="button">
          <Text style={{ color: theme.colors.text }}>Cancelar</Text>
        </Pressable>
        <Pressable style={[s.primario, { backgroundColor: theme.colors.primary }, processando && s.desativado]} onPress={() => void concluir()} disabled={processando || carregando} accessibilityRole="button">
          {processando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={[s.primarioTexto, { color: theme.colors.onPrimary }]}>Usar esta foto</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 14, width: '100%' },
  stage: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', borderRadius: 12 },
  zoomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  zoomBtn: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  zoomLabel: { fontSize: 12, fontWeight: '700', minWidth: 40, textAlign: 'center' },
  descricao: { textAlign: 'center', fontSize: 13, lineHeight: 19, paddingHorizontal: 8 },
  erro: { textAlign: 'center', fontSize: 13, fontWeight: '600' },
  acoes: { flexDirection: 'row', width: '100%', gap: 10 },
  secundario: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primario: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primarioTexto: { fontWeight: '800' },
  desativado: { opacity: 0.4 },
});