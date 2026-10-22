import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SaveFormat, manipulateAsync } from 'expo-image-manipulator';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { useVetFoto } from '../../hooks/useVetFoto';
import { useVetDesktop } from './desktop/useVetDesktop';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../ui/Toast';
import { RecortadorFoto } from '../pet-foto/RecortadorFoto';
import { VetAvatar } from './VetAvatar';

type Props = { visivel: boolean; nome: string; onFechar: () => void };

export function EditarFotoVetModal({ visivel, nome, onFechar }: Props) {
  if (!visivel) return null;
  return <EditarFotoVetModalAberto nome={nome} onFechar={onFechar} />;
}

function EditarFotoVetModalAberto({ nome, onFechar }: { nome: string; onFechar: () => void }) {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const desktop = useVetDesktop();
  const { fotoUri, salvarFoto, removerFoto } = useVetFoto();
  const [uriOriginal, setUriOriginal] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function selecionarFoto(origem: 'camera' | 'galeria') {
    setErro(null);
    try {
      if (origem === 'camera') {
        const permissao = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissao.granted) {
          setErro('Permita o uso da câmera para tirar sua foto.');
          return;
        }
      }
      const opcoes = { mediaTypes: ['images' as const], allowsEditing: false, quality: 1 };
      const resultado =
        origem === 'camera' ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
      if (!resultado.canceled && resultado.assets[0]) setUriOriginal(resultado.assets[0].uri);
    } catch {
      setErro(
        origem === 'camera'
          ? 'Não foi possível abrir a câmera. Verifique a permissão do aparelho.'
          : 'Não foi possível abrir a galeria. Verifique a permissão de fotos do aparelho.',
      );
    }
  }

  async function guardarFoto(uriRecortada: string) {
    setSalvando(true);
    setErro(null);
    try {
      const imagem = await manipulateAsync(uriRecortada, [], { compress: 0.8, format: SaveFormat.JPEG, base64: true });
      if (!imagem.base64) throw new Error('imagem sem dados');
      await salvarFoto(`data:image/jpeg;base64,${imagem.base64}`);
      onFechar();
      mostrarToast('sucesso', 'Foto atualizada', 'Sua foto foi salva neste aparelho.');
    } catch {
      setErro('Não foi possível salvar a foto. Tente novamente.');
      setUriOriginal(null);
    } finally {
      setSalvando(false);
    }
  }

  function pedirRemocao() {
    confirmar('Remover foto?', 'Sua foto será removida deste aparelho e voltará a mostrar sua inicial.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      {
        texto: 'Remover',
        estilo: 'destructive',
        aoConfirmar: () => {
          void removerFoto().then(() => {
            onFechar();
            mostrarToast('sucesso', 'Foto removida');
          });
        },
      },
    ]);
  }

  const desativado = salvando;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={desativado ? undefined : onFechar} statusBarTranslucent>
      <View style={[s.backdrop, desktop && s.backdropDesktop, { backgroundColor: theme.colors.overlay }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={desativado ? undefined : onFechar} accessibilityLabel="Fechar" />
        <View style={[s.sheet, desktop && s.sheetDesktop, { backgroundColor: theme.pages.shared.card }]} accessibilityViewIsModal>
          <View style={[s.handle, { backgroundColor: theme.pages.shared.border }]} />
          <View style={s.header}>
            <View>
              <Text style={[s.kicker, { color: theme.colors.textSecondary }]}>MINHA FOTO</Text>
              <Text style={[s.titulo, { color: theme.colors.text }, modoSimples && s.tituloSimples]}>{nome}</Text>
            </View>
            <Pressable onPress={onFechar} disabled={desativado} hitSlop={10} accessibilityLabel="Fechar">
              <Ionicons name="close" size={modoSimples ? 32 : 24} color={theme.colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.corpo} showsVerticalScrollIndicator={false}>
            {uriOriginal ? (
              <RecortadorFoto
                uriOriginal={uriOriginal}
                onCancelar={() => setUriOriginal(null)}
                onConcluir={arquivo => void guardarFoto(arquivo.uri)}
              />
            ) : (
              <>
                <VetAvatar nome={nome} size={modoSimples ? 156 : 128} />
                <Text style={[s.descricao, { color: theme.colors.textSecondary }, modoSimples && s.descricaoSimples]}>
                  Tire uma foto agora ou escolha uma da galeria. Por enquanto, ela fica salva apenas neste aparelho.
                </Text>
                {erro ? (
                  <Text style={[s.erro, { color: theme.colors.danger }]} accessibilityRole="alert">
                    {erro}
                  </Text>
                ) : null}
                <Pressable
                  style={[s.primario, { backgroundColor: theme.colors.primary }, desativado && s.desativado]}
                  onPress={() => void selecionarFoto('camera')}
                  disabled={desativado}
                  accessibilityRole="button"
                  accessibilityLabel="Usar câmera para tirar uma foto"
                >
                  <Ionicons name="camera-outline" size={modoSimples ? 26 : 20} color={theme.colors.onPrimary} />
                  <Text style={[s.primarioTexto, { color: theme.colors.onPrimary }, modoSimples && s.textoSimples]}>Usar câmera</Text>
                </Pressable>
                <Pressable
                  style={[s.secundario, { borderColor: theme.colors.primary }, desativado && s.desativado]}
                  onPress={() => void selecionarFoto('galeria')}
                  disabled={desativado}
                  accessibilityRole="button"
                  accessibilityLabel="Escolher foto da galeria"
                >
                  <Ionicons name="images-outline" size={modoSimples ? 26 : 20} color={theme.colors.primary} />
                  <Text style={[s.secundarioTexto, { color: theme.colors.primary }, modoSimples && s.textoSimples]}>
                    {fotoUri ? 'Escolher outra foto' : 'Escolher da galeria'}
                  </Text>
                </Pressable>
                {fotoUri ? (
                  <Pressable style={[s.remover, desativado && s.desativado]} onPress={pedirRemocao} disabled={desativado} accessibilityRole="button">
                    {salvando ? (
                      <ActivityIndicator color={theme.colors.danger} />
                    ) : (
                      <Text style={[s.removerTexto, { color: theme.colors.danger }]}>Remover foto</Text>
                    )}
                  </Pressable>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  backdropDesktop: { justifyContent: 'center', alignItems: 'center' },
  sheetDesktop: { width: 480, borderRadius: 24, paddingBottom: 12 },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 24, maxHeight: '92%' },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 14, paddingBottom: 6 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  titulo: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  tituloSimples: { fontSize: 26 },
  corpo: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 8, gap: 12 },
  descricao: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  descricaoSimples: { fontSize: 17, lineHeight: 25 },
  erro: { fontSize: 13, textAlign: 'center' },
  primario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', borderRadius: 14, paddingVertical: 14 },
  primarioTexto: { fontSize: 15, fontWeight: '800' },
  secundario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', borderRadius: 14, borderWidth: 1.5, paddingVertical: 13 },
  secundarioTexto: { fontSize: 15, fontWeight: '800' },
  textoSimples: { fontSize: 18 },
  remover: { paddingVertical: 10, alignItems: 'center' },
  removerTexto: { fontSize: 14, fontWeight: '700' },
  desativado: { opacity: 0.55 },
});
