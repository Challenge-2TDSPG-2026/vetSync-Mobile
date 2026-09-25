import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { Pet } from '../../types';
import { ApiError, type ArquivoUpload } from '../../services/api/httpClient';
import { useEnviarFotoPet, useRemoverFotoPet } from '../../hooks/usePets';
import { useAccessibility } from '../../context/AccessibilityContext';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../ui/Toast';
import { PetFoto } from './PetFoto';
import { RecortadorFoto } from './RecortadorFoto';

const C = {
    g900: '#0a2218', g700: '#155c3f', g600: '#1a7a52', g100: '#d4f2e4', cream: '#fafaf8',
    text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
    danger: '#991b1b', dangerBg: '#fee2e2',
};

type Props = { pet: Pet | null; onFechar: () => void };
type Origem = { uri: string; largura: number; altura: number };

function mensagemDeErro(erro: unknown, padrao: string): string {
    if (erro instanceof ApiError && erro.status === 403) {
        return 'Você não tem permissão para alterar a foto deste pet.';
    }
    if (erro instanceof Error && erro.message) {
        return erro.message;
    }
    return padrao;
}

/** Escolher foto na galeria, recortar (com prévia), confirmar o uso e salvar; ou remover a foto atual. */
export function EditarFotoPetModal({ pet, onFechar }: Props) {
    const { modoSimples } = useAccessibility();
    const enviar = useEnviarFotoPet();
    const remover = useRemoverFotoPet();
    const [origem, setOrigem] = useState<Origem | null>(null);
    // NOVO: foto já recortada, aguardando confirmação antes de subir para o perfil e a carteirinha.
    const [recortado, setRecortado] = useState<ArquivoUpload | null>(null);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        setOrigem(null);
        setRecortado(null);
        setErro(null);
    }, [pet?.id]);

    useEffect(() => {
        if (Platform.OS !== 'web' || !pet) return;
        const fecharComEscape = (event: KeyboardEvent) => event.key === 'Escape' && onFechar();
        window.addEventListener('keydown', fecharComEscape);
        return () => window.removeEventListener('keydown', fecharComEscape);
    }, [pet, onFechar]);

    if (!pet) return null;
    const petAtual: Pet = pet;
    const ocupado = enviar.isPending || remover.isPending;

    async function escolherDaGaleria() {
        setErro(null);
        setRecortado(null);
        try {
            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false, // o recorte é feito pela nossa tela, igual em iOS, Android e web
                quality: 1,
            });
            if (resultado.canceled || !resultado.assets?.[0]) return;
            const imagem = resultado.assets[0];
            if (!imagem.width || !imagem.height) {
                setErro('Não foi possível ler as dimensões da imagem. Tente outra foto.');
                return;
            }
            setOrigem({ uri: imagem.uri, largura: imagem.width, altura: imagem.height });
        } catch {
            setErro('Não foi possível abrir a galeria. Verifique a permissão de fotos do aparelho.');
        }
    }

    // NOVO: o recorte não sobe direto; primeiro pede confirmação de uso.
    function pedirConfirmacao(arquivo: ArquivoUpload) {
        setErro(null);
        setRecortado(arquivo);
    }

    // NOVO: "Cancelar" na confirmação descarta o recorte e já reabre a galeria para escolher outra foto.
    function cancelarConfirmacao() {
        setOrigem(null);
        setRecortado(null);
        void escolherDaGaleria();
    }

    async function salvar(arquivo: ArquivoUpload) {
        setErro(null);
        try {
            await enviar.mutateAsync({ petId: petAtual.id, arquivo });
            setOrigem(null);
            setRecortado(null);
            onFechar();
            mostrarToast('sucesso', 'Foto atualizada', `A foto de ${petAtual.nome} já aparece no perfil e na carteirinha.`);
        } catch (e) {
            setErro(mensagemDeErro(e, 'Não foi possível enviar a foto. Tente novamente.'));
        }
    }

    function pedirRemocao() {
        confirmar(
            'Remover foto?',
            `A foto de ${petAtual.nome} será apagada do perfil e da carteirinha.`,
            [
                { texto: 'Cancelar', estilo: 'cancel' },
                {
                    texto: 'Remover',
                    estilo: 'destructive',
                    aoConfirmar: () => {
                        setErro(null);
                        remover.mutateAsync(petAtual.id).then(
                            () => {
                                onFechar();
                                mostrarToast('sucesso', 'Foto removida');
                            },
                            (e) => setErro(mensagemDeErro(e, 'Não foi possível remover a foto.'))
                        );
                    },
                },
            ]
        );
    }

    const kicker = recortado ? 'Confirmar foto' : origem ? 'Ajustar foto' : 'Foto do pet';

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
            <View style={s.backdrop}>
                <Pressable style={StyleSheet.absoluteFill} onPress={ocupado ? undefined : onFechar} accessibilityLabel="Fechar" />
                <View style={s.sheet} accessibilityViewIsModal>
                    <View style={s.handle} />
                    <View style={s.header}>
                        <View style={s.headerTexto}>
                            <Text style={s.kicker}>{kicker}</Text>
                            <Text style={[s.titulo, modoSimples && s.tituloSimples]} numberOfLines={1}>{petAtual.nome}</Text>
                        </View>
                        <Pressable style={s.fechar} onPress={onFechar} disabled={ocupado} hitSlop={10} accessibilityLabel="Fechar">
                            <Ionicons name="close" size={modoSimples ? 32 : 24} color={C.text} />
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={s.corpo} showsVerticalScrollIndicator={false}>
                        {recortado ? (
                            <View style={s.confirmacao}>
                                <Image
                                    source={{ uri: recortado.uri }}
                                    style={[s.confirmacaoFoto, modoSimples && s.confirmacaoFotoSimples]}
                                    accessibilityLabel={`Prévia da nova foto de ${petAtual.nome}`}
                                />
                                <View style={s.confirmacaoAviso} accessibilityRole="alert">
                                    <Ionicons name="information-circle" size={modoSimples ? 26 : 20} color={C.g700} />
                                    <Text style={[s.confirmacaoAvisoTexto, modoSimples && s.confirmacaoAvisoTextoSimples]}>
                                        Essa imagem será usada no perfil de {petAtual.nome} e em todas as carteirinhas compartilhadas dele.
                                    </Text>
                                </View>

                                {erro ? (
                                    <View style={s.erro} accessibilityRole="alert">
                                        <Ionicons name="alert-circle" size={18} color={C.danger} />
                                        <Text style={s.erroTexto}>{erro}</Text>
                                    </View>
                                ) : null}

                                <View style={s.confirmacaoAcoes}>
                                    <Pressable
                                        style={[s.secundario, modoSimples && s.secundarioSimples, enviar.isPending && s.desativado]}
                                        onPress={cancelarConfirmacao}
                                        disabled={enviar.isPending}
                                        accessibilityRole="button"
                                    >
                                        <Text style={[s.secundarioTexto, modoSimples && s.secundarioTextoSimples]}>Cancelar</Text>
                                    </Pressable>
                                    <Pressable
                                        style={[s.primario, modoSimples && s.primarioSimples, enviar.isPending && s.desativado]}
                                        onPress={() => void salvar(recortado)}
                                        disabled={enviar.isPending}
                                        accessibilityRole="button"
                                        accessibilityLabel="Confirmar e salvar foto"
                                    >
                                        {enviar.isPending ? <ActivityIndicator color={C.white} /> : (
                                            <>
                                                <Ionicons name="checkmark" size={modoSimples ? 26 : 20} color={C.white} />
                                                <Text style={[s.primarioTexto, modoSimples && s.primarioTextoSimples]}>Confirmar</Text>
                                            </>
                                        )}
                                    </Pressable>
                                </View>
                            </View>
                        ) : origem ? (
                            <RecortadorFoto
                                uri={origem.uri}
                                largura={origem.largura}
                                altura={origem.altura}
                                nomePet={petAtual.nome}
                                numeroPet={petAtual.numero}
                                salvando={false}
                                erro={erro}
                                onCancelar={() => { setOrigem(null); setErro(null); }}
                                onConfirmar={pedirConfirmacao}
                            />
                        ) : (
                            <View style={s.menu}>
                                <PetFoto pet={petAtual} tamanho={modoSimples ? 168 : 132} fundo={C.g100} />
                                <Text style={[s.descricao, modoSimples && s.descricaoSimples]}>
                                    Escolha uma foto da galeria. Você poderá enquadrar antes de salvar, e ela aparecerá no perfil e na carteirinha de {petAtual.nome}.
                                </Text>

                                {erro ? (
                                    <View style={s.erro} accessibilityRole="alert">
                                        <Ionicons name="alert-circle" size={18} color={C.danger} />
                                        <Text style={s.erroTexto}>{erro}</Text>
                                    </View>
                                ) : null}

                                <Pressable
                                    style={[s.primario, modoSimples && s.primarioSimples, ocupado && s.desativado]}
                                    onPress={() => void escolherDaGaleria()}
                                    disabled={ocupado}
                                    accessibilityRole="button"
                                >
                                    <Ionicons name="images-outline" size={modoSimples ? 26 : 20} color={C.white} />
                                    <Text style={[s.primarioTexto, modoSimples && s.primarioTextoSimples]}>
                                        {petAtual.fotoUrl ? 'Escolher outra foto' : 'Adicionar foto'}
                                    </Text>
                                </Pressable>

                                {petAtual.fotoUrl ? (
                                    <Pressable
                                        style={[s.remover, ocupado && s.desativado]}
                                        onPress={pedirRemocao}
                                        disabled={ocupado}
                                        accessibilityRole="button"
                                    >
                                        {remover.isPending ? <ActivityIndicator color={C.danger} /> : (
                                            <>
                                                <Ionicons name="trash-outline" size={modoSimples ? 24 : 18} color={C.danger} />
                                                <Text style={[s.removerTexto, modoSimples && s.removerTextoSimples]}>Remover foto</Text>
                                            </>
                                        )}
                                    </Pressable>
                                ) : null}
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(10,34,24,0.55)', justifyContent: 'flex-end' },
    sheet: { width: '100%', maxHeight: '92%', backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
    handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: '#d2d0cb', alignSelf: 'center', marginTop: 10, marginBottom: 2 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.white },
    headerTexto: { flex: 1, minWidth: 0, paddingRight: 10 },
    kicker: { color: C.g600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9, fontWeight: '800' },
    titulo: { color: C.text, fontSize: 24, fontWeight: '800', marginTop: 2 },
    tituloSimples: { fontSize: 32 },
    fechar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0ece5' },
    corpo: { paddingTop: 18, paddingBottom: 30 },
    menu: { alignItems: 'center', paddingHorizontal: 20 },
    descricao: { color: C.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 16, marginBottom: 18 },
    descricaoSimples: { fontSize: 19, lineHeight: 26 },
    erro: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch', marginBottom: 14, padding: 11, borderRadius: 10, backgroundColor: C.dangerBg },
    erroTexto: { flex: 1, color: C.danger, fontSize: 13, lineHeight: 18 },
    primario: { alignSelf: 'stretch', minHeight: 50, borderRadius: 12, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: C.g700 },
    primarioSimples: { minHeight: 64 },
    primarioTexto: { color: C.white, fontWeight: '800', fontSize: 15 },
    primarioTextoSimples: { fontSize: 20 },
    remover: { alignSelf: 'stretch', minHeight: 46, marginTop: 10, borderRadius: 12, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
    removerTexto: { color: C.danger, fontWeight: '800', fontSize: 14 },
    removerTextoSimples: { fontSize: 19 },
    desativado: { opacity: 0.5 },

    // NOVO: card de confirmação de uso, exibido depois do recorte e antes do upload.
    confirmacao: { alignItems: 'center', paddingHorizontal: 20 },
    confirmacaoFoto: { width: 132, height: 132, borderRadius: 66, backgroundColor: C.g100, marginBottom: 18 },
    confirmacaoFotoSimples: { width: 168, height: 168, borderRadius: 84 },
    confirmacaoAviso: {
        flexDirection: 'row', gap: 10, alignSelf: 'stretch', alignItems: 'flex-start',
        backgroundColor: C.g100, borderRadius: 14, padding: 14, marginBottom: 16,
    },
    confirmacaoAvisoTexto: { flex: 1, color: C.g900, fontSize: 14, lineHeight: 20, fontWeight: '600' },
    confirmacaoAvisoTextoSimples: { fontSize: 18, lineHeight: 25 },
    confirmacaoAcoes: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
    secundario: { flex: 1, minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.g700 },
    secundarioSimples: { minHeight: 64 },
    secundarioTexto: { color: C.g700, fontWeight: '800', fontSize: 15 },
    secundarioTextoSimples: { fontSize: 20 },
});