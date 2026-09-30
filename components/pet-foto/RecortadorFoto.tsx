import React, { useEffect, useState } from 'react';
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

/**
 * Recorte no estilo Instagram: a foto ocupa toda a área, a moldura fica fixa no centro, o que está fora dela
 * aparece escurecido e o usuário arrasta / dá zoom na foto por baixo. A moldura sempre fica 100% coberta pela foto.
 */
export function RecortadorFoto({ uriOriginal, onConcluir, onCancelar, formato = 'circulo' }: Props) {
  return <RecortadorFotoConteudo key={uriOriginal} uriOriginal={uriOriginal} onConcluir={onConcluir} onCancelar={onCancelar} formato={formato} />;
}

function RecortadorFotoConteudo({ uriOriginal, onConcluir, onCancelar, formato = 'circulo' }: Props) {
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
  const [gesto, setGesto] = useState({ startTx: 0, startTy: 0, startScale: 1, startDist: 0 });

  useEffect(() => {
    let ativo = true;
    obterDimensoes(uriOriginal)
      .then(dimensoes => { if (ativo) setDimensoesImagem(dimensoes); })
      .catch(() => { if (ativo) setErro('Não foi possível carregar esta foto. Escolha outra e tente novamente.'); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
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

  function iniciarGesto(evt: GestureResponderEvent) {
    const toques = evt.nativeEvent.touches;
    setGesto({
      startTx: tx,
      startTy: ty,
      startScale: userScale,
      startDist: toques && toques.length >= 2 ? distanciaEntreToques(toques) : 0,
    });
    setArrastando(true);
  }

  // No navegador (mouse), "touches" nem sempre vem preenchido — o arrasto usa gestureState.dx/dy.
  function moverGesto(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
    const toques = evt.nativeEvent.touches;
    if (toques && toques.length >= 2) {
      const dist = distanciaEntreToques(toques);
      const startDist = gesto.startDist || dist;
      const startScale = gesto.startDist === 0 ? userScale : gesto.startScale;
      if (gesto.startDist === 0) setGesto(atual => ({ ...atual, startDist: dist, startScale: userScale }));
      aplicarZoom(startScale * (dist / startDist));
      return;
    }

    let startTx = gesto.startTx;
    let startTy = gesto.startTy;
    if (gesto.startDist !== 0) {
      // voltou a 1 dedo depois do pinch: re-ancora o arrasto na posição atual
      startTx = tx - gestureState.dx;
      startTy = ty - gestureState.dy;
      setGesto(atual => ({ ...atual, startDist: 0, startTx, startTy }));
    }
    const { maxTx, maxTy } = limites(userScale);
    setTx(limitar(startTx + gestureState.dx, maxTx));
    setTy(limitar(startTy + gestureState.dy, maxTy));
  }

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onStartShouldSetPanResponderCapture: () => true,
    onMoveShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponderCapture: () => true,
    onPanResponderTerminationRequest: () => false, // o ScrollView do modal não rouba o gesto
    onPanResponderGrant: iniciarGesto,
    onPanResponderMove: moverGesto,
    onPanResponderRelease: () => setArrastando(false),
    onPanResponderTerminate: () => setArrastando(false),
  });

  async function concluir() {
    if (!dimensoesImagem) return;
    setProcessando(true);
    setErro(null);
    try {
      // Área escolhida, em frações (0..1) da foto exibida na tela.
      const totalScale = baseScale * userScale;
      const fracLado = FRAME / totalScale; // lado do recorte em px da foto exibida
      const fracX = (dimensoesImagem.largura / 2 - (FRAME / 2 + tx) / totalScale) / dimensoesImagem.largura;
      const fracY = (dimensoesImagem.altura / 2 - (FRAME / 2 + ty) / totalScale) / dimensoesImagem.altura;

      // Lê as dimensões REAIS do arquivo (podem diferir das de Image.getSize por causa de EXIF/orientação).
      // Se o crop usar medidas fora da imagem real, o módulo nativo lança "crop rectangle is outside source image".
      const real = await manipulateAsync(uriOriginal, [], { compress: 1, format: SaveFormat.JPEG });
      const largReal = real.width;
      const altReal = real.height;

      const lado = Math.max(1, Math.floor(Math.min(fracLado * (largReal / dimensoesImagem.largura), fracLado * (altReal / dimensoesImagem.altura), largReal, altReal)));
      const originX = Math.floor(Math.min(Math.max(fracX * largReal, 0), Math.max(0, largReal - lado)));
      const originY = Math.floor(Math.min(Math.max(fracY * altReal, 0), Math.max(0, altReal - lado)));

      const resultado = await manipulateAsync(
        real.uri,
        [
          { crop: { originX, originY, width: lado, height: lado } },
          { resize: { width: TAMANHO_FINAL, height: TAMANHO_FINAL } },
        ],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      onConcluir({ uri: resultado.uri, nome: 'foto-pet.jpg', tipoMime: 'image/jpeg' });
    } catch (e) {
      console.warn('[RecortadorFoto] falha ao recortar', e);
      const detalhe = e instanceof Error ? e.message : String(e);
      setErro(`Não foi possível preparar esta foto. Escolha outra imagem e tente novamente.\n(${detalhe.slice(0, 140)})`);
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
          style={[s.zoomBtn, { borderColor: theme.pages.shared.border }, userScale <= ZOOM_MIN && s.desativado]}
          onPress={() => aplicarZoom(userScale - ZOOM_PASSO)}
          disabled={userScale <= ZOOM_MIN || carregando}
          accessibilityRole="button"
          accessibilityLabel="Diminuir zoom"
        >
          <Ionicons name="remove" size={18} color={theme.colors.text} />
        </Pressable>
        <Text style={[s.zoomLabel, { color: theme.colors.textSecondary }]}>{Math.round(userScale * 100)}%</Text>
        <Pressable
          style={[s.zoomBtn, { borderColor: theme.pages.shared.border }, userScale >= ZOOM_MAX && s.desativado]}
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
        <Pressable style={[s.secundario, { borderColor: theme.pages.shared.border }]} onPress={onCancelar} disabled={processando} accessibilityRole="button">
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
