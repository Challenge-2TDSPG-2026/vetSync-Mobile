import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { Pet } from '../../types';
import { ApiError, type ArquivoUpload } from '../../services/api/httpClient';
import { useEnviarFotoPet, useRemoverFotoPet } from '../../hooks/usePets';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../ui/Toast';
import { PetFoto } from './PetFoto';
import { RecortadorFoto } from './RecortadorFoto';

type Props = { pet: Pet | null; onFechar: () => void };

function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof ApiError && erro.status === 403) return 'Você não tem permissão para alterar a foto deste pet.';
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

export function EditarFotoModal({ pet, onFechar }: Props) {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const enviar = useEnviarFotoPet();
  const remover = useRemoverFotoPet();
  const [uriOriginal, setUriOriginal] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const ocupado = enviar.isPending || remover.isPending;

  useEffect(() => {
    setUriOriginal(null);
    setErro(null);
  }, [pet?.id]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !pet) return;
    const fecharComEscape = (event: KeyboardEvent) => event.key === 'Escape' && !ocupado && onFechar();
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [ocupado, onFechar, pet]);

  if (!pet) return null;
  const petAtual = pet;

  async function escolherDaGaleria() {
    setErro(null);
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
      if (!resultado.canceled && resultado.assets[0]) setUriOriginal(resultado.assets[0].uri);
    } catch {
      setErro('Não foi possível abrir a galeria. Verifique a permissão de fotos do aparelho.');
    }
  }

  async function enviarFoto(arquivo: ArquivoUpload) {
    setErro(null);
    try {
      await enviar.mutateAsync({ idPet: petAtual.id, arquivo });
      onFechar();
      mostrarToast('sucesso', 'Foto atualizada', `A foto de ${petAtual.nome} foi atualizada.`);
    } catch (erroEnvio) {
      setErro(mensagemDeErro(erroEnvio, 'Não foi possível enviar a foto. Tente novamente.'));
    }
  }

  function pedirRemocao() {
    confirmar('Remover foto?', `A foto de ${petAtual.nome} será removida do perfil e das carteiras.`, [
      { texto: 'Cancelar', estilo: 'cancel' },
      {
        texto: 'Remover',
        estilo: 'destructive',
        aoConfirmar: () => {
          void remover.mutateAsync(petAtual.id).then(
            () => {
              onFechar();
              mostrarToast('sucesso', 'Foto removida');
            },
            erroRemocao => setErro(mensagemDeErro(erroRemocao, 'Não foi possível remover a foto.'))
          );
        },
      },
    ]);
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={ocupado ? undefined : onFechar} statusBarTranslucent>
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={ocupado ? undefined : onFechar} accessibilityLabel="Fechar" />
        <View style={[s.sheet, { backgroundColor: theme.colors.surface }]} accessibilityViewIsModal>
          <View style={[s.handle, { backgroundColor: theme.colors.border }]} />
          <View style={s.header}>
            <View><Text style={[s.kicker, { color: theme.colors.textSecondary }]}>FOTO DO PET</Text><Text style={[s.titulo, { color: theme.colors.text }, modoSimples && s.tituloSimples]}>{petAtual.nome}</Text></View>
            <Pressable onPress={onFechar} disabled={ocupado} hitSlop={10} accessibilityLabel="Fechar"><Ionicons name="close" size={modoSimples ? 32 : 24} color={theme.colors.text} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={s.corpo} showsVerticalScrollIndicator={false}>
            {uriOriginal ? (
              <RecortadorFoto uriOriginal={uriOriginal} onCancelar={() => setUriOriginal(null)} onConcluir={arquivo => void enviarFoto(arquivo)} />
            ) : (
              <>
                <PetFoto pet={petAtual} size={modoSimples ? 156 : 128} backgroundColor={theme.colors.surfaceSubtle} accessibilityLabel={`Foto de ${petAtual.nome}`} />
                <Text style={[s.descricao, { color: theme.colors.textSecondary }, modoSimples && s.descricaoSimples]}>Escolha uma foto da galeria para usar no perfil e nas carteiras digitais de {petAtual.nome}.</Text>
                {erro ? <Text style={[s.erro, { color: theme.colors.danger }]} accessibilityRole="alert">{erro}</Text> : null}
                <Pressable style={[s.primario, { backgroundColor: theme.colors.primary }, ocupado && s.desativado]} onPress={() => void escolherDaGaleria()} disabled={ocupado} accessibilityRole="button">
                  <Ionicons name="images-outline" size={modoSimples ? 26 : 20} color={theme.colors.onPrimary} />
                  <Text style={[s.primarioTexto, { color: theme.colors.onPrimary }, modoSimples && s.primarioTextoSimples]}>{petAtual.fotoUrl ? 'Escolher outra foto' : 'Escolher da galeria'}</Text>
                </Pressable>
                {petAtual.fotoUrl ? <Pressable style={[s.remover, ocupado && s.desativado]} onPress={pedirRemocao} disabled={ocupado} accessibilityRole="button">{remover.isPending ? <ActivityIndicator color={theme.colors.danger} /> : <><Ionicons name="trash-outline" size={modoSimples ? 24 : 18} color={theme.colors.danger} /><Text style={[s.removerTexto, { color: theme.colors.danger }, modoSimples && s.removerTextoSimples]}>Remover foto</Text></>}</Pressable> : null}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.48)' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 28 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, marginTop: 10, marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  titulo: { fontSize: 23, fontWeight: '800', marginTop: 3 },
  tituloSimples: { fontSize: 28 },
  corpo: { alignItems: 'center', gap: 16, paddingTop: 22 },
  descricao: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  descricaoSimples: { fontSize: 18, lineHeight: 25 },
  erro: { textAlign: 'center', fontSize: 13, fontWeight: '600' },
  primario: { width: '100%', minHeight: 50, borderRadius: 13, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  primarioTexto: { fontSize: 15, fontWeight: '800' },
  primarioTextoSimples: { fontSize: 19 },
  remover: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  removerTexto: { fontSize: 14, fontWeight: '800' },
  removerTextoSimples: { fontSize: 18 },
  desativado: { opacity: 0.6 },
});
