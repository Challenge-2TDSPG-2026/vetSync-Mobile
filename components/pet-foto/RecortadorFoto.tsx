import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { ArquivoUpload } from '../../services/api/httpClient';
import { useTheme } from '../../context/ThemeContext';

type Props = {
  uriOriginal: string;
  onConcluir: (arquivo: ArquivoUpload) => void;
  onCancelar: () => void;
};

const TAMANHO_FINAL = 720;

function obterDimensoes(uri: string): Promise<{ largura: number; altura: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (largura, altura) => resolve({ largura, altura }), reject);
  });
}

/** Faz um enquadramento central quadrado antes de enviar a foto ao backend. */
export function RecortadorFoto({ uriOriginal, onConcluir, onCancelar }: Props) {
  const { theme } = useTheme();
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setErro(null);
    setProcessando(false);
  }, [uriOriginal]);

  async function concluir() {
    setProcessando(true);
    setErro(null);
    try {
      const { largura, altura } = await obterDimensoes(uriOriginal);
      const lado = Math.min(largura, altura);
      const resultado = await manipulateAsync(
        uriOriginal,
        [
          {
            crop: {
              originX: Math.max(0, Math.floor((largura - lado) / 2)),
              originY: Math.max(0, Math.floor((altura - lado) / 2)),
              width: lado,
              height: lado,
            },
          },
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
      <Image source={{ uri: uriOriginal }} style={[s.preview, { borderColor: theme.colors.border }]} resizeMode="cover" />
      <Text style={[s.descricao, { color: theme.colors.textSecondary }]}>A foto será centralizada e ajustada em formato quadrado.</Text>
      {erro ? <Text style={[s.erro, { color: theme.colors.danger }]} accessibilityRole="alert">{erro}</Text> : null}
      <View style={s.acoes}>
        <Pressable style={[s.secundario, { borderColor: theme.colors.border }]} onPress={onCancelar} disabled={processando} accessibilityRole="button">
          <Text style={{ color: theme.colors.text }}>Cancelar</Text>
        </Pressable>
        <Pressable style={[s.primario, { backgroundColor: theme.colors.primary }, processando && s.desativado]} onPress={() => void concluir()} disabled={processando} accessibilityRole="button">
          {processando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={[s.primarioTexto, { color: theme.colors.onPrimary }]}>Usar esta foto</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { alignItems: 'center', gap: 14 },
  preview: { width: 220, height: 220, borderRadius: 110, borderWidth: 1 },
  descricao: { textAlign: 'center', fontSize: 13, lineHeight: 19 },
  erro: { textAlign: 'center', fontSize: 13, fontWeight: '600' },
  acoes: { flexDirection: 'row', width: '100%', gap: 10 },
  secundario: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primario: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primarioTexto: { fontWeight: '800' },
  desativado: { opacity: 0.65 },
});
