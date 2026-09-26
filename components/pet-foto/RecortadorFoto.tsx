import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import type { GestureResponderEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ArquivoUpload } from '../../services/api/httpClient';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  uriOriginal: string;
  onConcluir: (arquivo: ArquivoUpload) => void;
  onCancelar: () => void;
};

const TAMANHO_FINAL = 720;
const VIEWPORT = 280;
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_PASSO = 0.35;

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

/** Enquadramento manual: o usuário arrasta e ajusta o zoom pra escolher a área quadrada antes de enviar ao backend. */
export function RecortadorFoto({ uriOriginal, onConcluir, onCancelar }: Props) {
  const { theme } = useTheme();
  const [processando, setProcessando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dimensoesImagem, setDimensoesImagem] = useState<{ largura: number; altura: number } | null>(null);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [userScale, setUserScale] = useState(1);

  const gesto = useRef({ startTx: 0, startTy: 0, startScale: 1, startDist: 0, startX: 0, startY: 0 });

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

  const baseScale = dimensoesImagem ? Math.max(VIEWPORT / dimensoesImagem.largura, VIEWPORT / dimensoesImagem.altura) : 1;
  const baseLargura = dimensoesImagem ? dimensoesImagem.largura * baseScale : VIEWPORT;
  const baseAltura = dimensoesImagem ? dimensoesImagem.altura * baseScale : VIEWPORT;

  function limites(escala: number) {
    const maxTx = Math.max(0, (baseLargura * escala - VIEWPORT) / 2);
    const maxTy = Math.max(0, (baseAltura * escala - VIEWPORT) / 2);
    return { maxTx, maxTy };
  }

  function aplicarZoom(novaEscalaBruta: number) {
    const novaEscala = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, novaEscalaBruta));
    const { maxTx, maxTy } = limites(novaEscala);
    setUserScale(novaEscala);
    setTx(v => limitar(v, maxTx));
    setTy(v => limitar(v, maxTy));
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (evt: GestureResponderEvent) => {
        const toques = evt.nativeEvent.touches;
        gesto.current.startTx = tx;
        gesto.current.startTy = ty;
        gesto.current.startScale = userScale;
        if (toques && toques.length >= 2) {
          gesto.current.startDist = distanciaEntreToques(toques);
        }
      },
      // No navegador (mouse), nem sempre o array "touches" vem preenchido — por isso o arrasto
      // usa gestureState.dx/dy, que o PanResponder calcula de forma confiável tanto pra touch quanto mouse.
      onPanResponderMove: (evt: GestureResponderEvent, gestureState) => {
        const toques = evt.nativeEvent.touches;
        if (toques && toques.length >= 2) {
          const dist = distanciaEntreToques(toques);
          if (gesto.current.startDist > 0) {
            aplicarZoom(gesto.current.startScale * (dist / gesto.current.startDist));
          }
          return;
        }
        const { maxTx, maxTy } = limites(userScale);
        setTx(limitar(gesto.current.startTx + gestureState.dx, maxTx));
        setTy(limitar(gesto.current.startTy + gestureState.dy, maxTy));
      },
    })
  ).current;

  async function concluir() {
    if (!dimensoesImagem) return;
    setProcessando(true);
    setErro(null);
    try {
      const totalScale = baseScale * userScale;
      const cropSize = VIEWPORT / totalScale;
      let originX = dimensoesImagem.largura / 2 - (VIEWPORT / 2 + tx) / totalScale;
      let originY = dimensoesImagem.altura / 2 - (VIEWPORT / 2 + ty) / totalScale;
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

  return (
    <View style={s.container}>
      <View style={[s.viewport, { borderColor: theme.colors.border }]} {...panResponder.panHandlers}>
        {carregando ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : dimensoesImagem ? (
          <Image
            source={{ uri: uriOriginal }}
            style={[
              s.imagem,
              {
                width: baseLargura,
                height: baseAltura,
                left: (VIEWPORT - baseLargura) / 2,
                top: (VIEWPORT - baseAltura) / 2,
                transform: [{ translateX: tx }, { translateY: ty }, { scale: userScale }],
              },
            ]}
            resizeMode="cover"
          />
        ) : null}
        <View pointerEvents="none" style={s.moldura} />
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

      <Text style={[s.descricao, { color: theme.colors.textSecondary }]}>Arraste a foto para posicionar. A área dentro do círculo será usada.</Text>
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
  container: { alignItems: 'center', gap: 14 },
  viewport: { width: VIEWPORT, height: VIEWPORT, borderRadius: VIEWPORT / 2, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.05)' },
  imagem: { position: 'absolute' },
  moldura: { position: 'absolute', width: VIEWPORT, height: VIEWPORT, borderRadius: VIEWPORT / 2, borderWidth: 2, borderColor: 'rgba(255,255,255,0.55)' },
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