import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePet } from '../context/PetContext';
import { useTheme } from '../context/ThemeContext';
import { AppIcon } from '../components/AppIcon';
import { ApiError } from '../services/api/httpClient';
import { iaService, type SiaBlock, type SiaBlockOption } from '../services/iaService';
import { mostrarToast } from '../components/ui/Toast';
import type { AppTheme } from '../constants/theme';
const DURACAO_TRANSICAO_TECLADO = 250;

type Mensagem = {
  id: number;
  autoria: 'usuario' | 'sia';
  texto: string;
  erro?: boolean;
  bloco?: SiaBlock;
  acao?: { id: string; resumo: string; requerConfirmacao: boolean };
};

const SUGESTOES_TUTOR = [
  { icon: 'calendar-outline' as const, texto: 'Quero agendar uma consulta para meu pet' },
  { icon: 'heart-outline' as const, texto: 'Quero informar como está a recuperação do meu pet' },
];

const SUGESTOES_VET = [
  { icon: 'document-text-outline' as const, texto: 'Estruture as orientações de pós-atendimento' },
  { icon: 'calendar-outline' as const, texto: 'Organize um retorno para este paciente' },
  { icon: 'pulse-outline' as const, texto: 'Analise um relato de recuperação pós-cirúrgica' },
];

export default function AssistenteScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const { sessao } = useAuth();
  const { petAtivo } = usePet();
  const scrollRef = useRef<ScrollView>(null);
  const idRef = useRef(0);
  const fechandoRef = useRef(false);
  const deslocamento = useRef(new Animated.Value(720)).current;
  const opacidadeFundo = useRef(new Animated.Value(0)).current;
  const animacaoSugestoes = useRef(new Animated.Value(1)).current;
  const [entrada, setEntrada] = useState('');
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const nome = sessao?.nome?.trim().split(/\s+/)[0] ?? 'tudo bem';
  const sugestoes = sessao?.perfil === 'VETERINARIO' ? SUGESTOES_VET : SUGESTOES_TUTOR;
  const gestoAlca = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesto) => gesto.dy > 6 && Math.abs(gesto.dy) > Math.abs(gesto.dx),
    onPanResponderGrant: () => deslocamento.stopAnimation(),
    onPanResponderMove: (_, gesto) => deslocamento.setValue(Math.max(0, gesto.dy)),
    onPanResponderRelease: (_, gesto) => {
      if (gesto.dy > 110 || gesto.vy > 0.8) fechar();
      else restaurarPosicao();
    },
    onPanResponderTerminate: restaurarPosicao,
  })).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(deslocamento, { toValue: 0, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacidadeFundo, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [deslocamento, opacidadeFundo]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(timer);
  }, [mensagens, carregando]);

  useEffect(() => {
    const aoAbrir = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => setTecladoVisivel(true));
    const aoFechar = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setTecladoVisivel(false));
    return () => {
      aoAbrir.remove();
      aoFechar.remove();
    };
  }, []);

  useEffect(() => {
    if (mensagens.length > 0) return;
    Animated.timing(animacaoSugestoes, {
      toValue: tecladoVisivel ? 0 : 1,
      duration: DURACAO_TRANSICAO_TECLADO,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [animacaoSugestoes, mensagens.length, tecladoVisivel]);

  function fechar() {
    if (fechandoRef.current) return;
    fechandoRef.current = true;
    Animated.parallel([
      Animated.timing(deslocamento, { toValue: 720, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacidadeFundo, { toValue: 0, duration: 190, useNativeDriver: true }),
    ]).start(() => router.back());
  }

  function restaurarPosicao() {
    Animated.spring(deslocamento, { toValue: 0, useNativeDriver: true }).start();
  }

  async function confirmarAcao(mensagem: Mensagem) {
    if (!mensagem.acao || carregando) return;
    setCarregando(true);
    try {
      const resposta = await iaService.confirmarAcao(mensagem.acao.id);
      setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'sia', texto: resposta.texto }]);
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : 'Não foi possível confirmar a ação.';
      setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'sia', texto: detalhe, erro: true }]);
    } finally {
      setCarregando(false);
    }
  }

  async function selecionarBloco(mensagem: Mensagem, opcao: SiaBlockOption) {
    if (!mensagem.bloco || !opcao.habilitado || carregando) return;
    setCarregando(true);
    setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'usuario', texto: opcao.rotulo }]);
    try {
      const resposta = await iaService.selecionarBloco(mensagem.bloco.sessaoId, opcao.id);
      setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'sia', ...resposta }]);
    } catch (erro) {
      const detalhe = erro instanceof ApiError || erro instanceof Error ? erro.message : 'Não foi possível registrar esta escolha.';
      setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'sia', texto: detalhe, erro: true }]);
    } finally {
      setCarregando(false);
    }
  }

  async function enviar(textoDireto?: string) {
    const texto = (textoDireto ?? entrada).trim();
    if (!texto || carregando) return;
    setEntrada('');
    const mensagemUsuario: Mensagem = { id: ++idRef.current, autoria: 'usuario', texto };
    const historico = [...mensagens, mensagemUsuario].map(mensagem => ({
      role: mensagem.autoria === 'usuario' ? 'user' as const : 'assistant' as const,
      text: mensagem.texto,
    }));
    setMensagens(atuais => [...atuais, mensagemUsuario]);
    setCarregando(true);
    try {
      const resposta = await iaService.perguntar(texto, petAtivo, historico);
      setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'sia', ...resposta }]);
    } catch (erro) {
      const detalhe = erro instanceof ApiError || erro instanceof Error ? erro.message : 'Não foi possível obter uma resposta agora.';
      setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'sia', texto: detalhe, erro: true }]);
    } finally {
      setCarregando(false);
    }
  }

  return <KeyboardAvoidingView
    style={s.overlay}
    behavior={Platform.select({ ios: 'padding', android: 'height' })}
  >
    <Animated.View pointerEvents="none" style={[s.backdrop, { opacity: opacidadeFundo }]} />
    <Pressable style={StyleSheet.absoluteFill} onPress={fechar} accessibilityLabel="Fechar SIA" />
    <Animated.View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 8), transform: [{ translateY: deslocamento }] }]}>
      <View pointerEvents="none" style={s.pawWatermarks}>
        <AppIcon name="paw" set="MaterialCommunityIcons" size={188} color={theme.pages.assistant.watermark} style={s.pawWatermarkLarge} />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={52} color={theme.pages.assistant.watermark} style={s.pawWatermarkSmall} />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={82} color={theme.pages.assistant.watermark} style={s.pawWatermarkBottom} />
      </View>
      <View {...gestoAlca.panHandlers} style={s.handleArea} accessibilityLabel="Arraste para baixo para fechar a SIA">
        <View style={s.handle} />
      </View>
      <View style={s.header}>
        <Pressable onPress={fechar} hitSlop={10} style={s.headerButton} accessibilityLabel="Voltar"><Ionicons name="chevron-down" size={22} color={theme.colors.primary} /></Pressable>
        <View style={s.headerCopy}><Text style={s.headerTitle}>SIA</Text><Text style={s.headerSubtitle}>Sync Inteligência Artificial</Text></View>
        <Pressable onPress={() => setMensagens([])} disabled={mensagens.length === 0 || carregando} hitSlop={10} style={[s.headerButton, (mensagens.length === 0 || carregando) && s.disabled]} accessibilityLabel="Nova conversa"><Ionicons name="refresh" size={20} color={theme.colors.primary} /></Pressable>
      </View>

      <ScrollView ref={scrollRef} style={s.chat} contentContainerStyle={s.chatContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {mensagens.length === 0 ? <>
          <View style={s.welcome}><View style={s.siaMark}><Ionicons name="sparkles" size={25} color={theme.colors.primary} /></View><Text style={s.welcomeTitle}>Olá, {nome}! Sou a SIA.</Text><Text style={s.welcomeText}>Como posso ajudar com a rotina e os cuidados veterinários?</Text></View>
          <Animated.View style={[s.suggestionsAnimated, {
            opacity: animacaoSugestoes,
            marginTop: animacaoSugestoes.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }),
            maxHeight: animacaoSugestoes.interpolate({ inputRange: [0, 1], outputRange: [0, sugestoes.length * 62] }),
          }]}>
            <View style={s.suggestions}>{sugestoes.map(item => <Pressable key={item.texto} onPress={() => enviar(item.texto)} style={({ pressed }) => [s.suggestion, pressed && s.pressed]}><View style={s.suggestionIcon}><Ionicons name={item.icon} size={19} color={theme.colors.primary} /></View><Text style={s.suggestionText}>{item.texto}</Text><Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} /></Pressable>)}</View>
          </Animated.View>
        </> : mensagens.map(item => <View key={item.id} style={[s.messageRow, item.autoria === 'usuario' && s.messageRowUser]}>
          {item.autoria === 'sia' && <View style={[s.avatar, item.erro && s.avatarError]}><Ionicons name={item.erro ? 'alert-circle-outline' : 'sparkles'} size={15} color={item.erro ? theme.colors.danger : theme.colors.primary} /></View>}
          <View style={[s.bubble, item.autoria === 'usuario' ? s.bubbleUser : s.bubbleSia, item.erro && s.bubbleError]}>
            <Text style={[s.messageText, item.autoria === 'usuario' && s.messageTextUser, item.erro && s.messageTextError]}>{item.texto}</Text>
            {item.acao?.requerConfirmacao && (
              <Pressable style={s.confirmAction} onPress={() => confirmarAcao(item)} disabled={carregando}>
                <Text style={s.confirmActionText}>Confirmar ação</Text>
              </Pressable>
            )}
            {item.bloco && (
              <View style={s.selectionBlock} accessibilityLabel={item.bloco.titulo}>
                <Text style={s.selectionTitle}>{item.bloco.titulo}</Text>
                {item.bloco.opcoes.map(opcao => (
                  <Pressable
                    key={opcao.id}
                    style={({ pressed }) => [s.selectionOption, pressed && s.pressed, (!opcao.habilitado || carregando) && s.selectionOptionDisabled]}
                    onPress={() => selecionarBloco(item, opcao)}
                    disabled={!opcao.habilitado || carregando}
                    accessibilityRole="button"
                    accessibilityLabel={opcao.descricao ? `${opcao.rotulo}, ${opcao.descricao}` : opcao.rotulo}
                  >
                    <View style={s.selectionOptionCopy}>
                      <Text style={s.selectionOptionText}>{opcao.rotulo}</Text>
                      {opcao.descricao && <Text style={s.selectionOptionDescription}>{opcao.descricao}</Text>}
                    </View>
                    <Ionicons name="chevron-forward" size={17} color={theme.colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>)}
        {carregando && <View style={s.messageRow}><View style={s.avatar}><Ionicons name="sparkles" size={15} color={theme.colors.primary} /></View><View style={[s.bubble, s.bubbleSia]}><Text style={s.thinking}>SIA está pensando…</Text></View></View>}
      </ScrollView>

      <Text style={s.safety}>A SIA não substitui uma avaliação veterinária.</Text>
      <View style={s.composer}>
        <View style={s.composerField}>
          <Pressable onPress={() => mostrarToast('info', 'Anexos', 'O envio de arquivos será habilitado após a definição de privacidade da integração com a IA.')} hitSlop={7} style={s.attach} accessibilityLabel="Anexar arquivo"><Ionicons name="add" size={25} color={theme.colors.primary} /></Pressable>
          <TextInput value={entrada} onChangeText={setEntrada} onFocus={() => setTecladoVisivel(true)} onBlur={() => setTecladoVisivel(false)} placeholder="Pergunte algo à SIA" placeholderTextColor={theme.colors.placeholder} style={s.input} multiline maxLength={1000} editable={!carregando} onSubmitEditing={() => enviar()} blurOnSubmit={false} />
        </View>
        <Pressable onPress={() => enviar()} disabled={!entrada.trim() || carregando} style={[s.send, (!entrada.trim() || carregando) && s.sendDisabled]} accessibilityLabel="Enviar pergunta"><Ionicons name="arrow-up" size={20} color={theme.colors.onPrimary} /></Pressable>
      </View>
    </Animated.View>
  </KeyboardAvoidingView>;
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'transparent' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.colors.overlay },
  sheet: { width: '100%', maxWidth: 680, height: '86%', backgroundColor: theme.pages.assistant.sheet.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', shadowColor: theme.colors.text, shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 16 },
  pawWatermarks: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  pawWatermarkLarge: { position: 'absolute', top: 112, right: -50, transform: [{ rotate: '-18deg' }] },
  pawWatermarkSmall: { position: 'absolute', top: '43%', left: 17, transform: [{ rotate: '20deg' }] },
  pawWatermarkBottom: { position: 'absolute', bottom: 56, right: 10, transform: [{ rotate: '14deg' }] },
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' }, handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: theme.pages.assistant.sheet.borderStrong },
  header: { minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.pages.assistant.sheet.border },
  headerButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pages.assistant.cardSecondary }, disabled: { opacity: 0.38 },
  headerCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 8 }, headerTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800' }, headerSubtitle: { color: theme.colors.textSecondary, fontSize: 9, fontWeight: '700', marginTop: 2 },
  chat: { flex: 1 }, chatContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  welcome: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 12, marginBottom: 'auto' }, siaMark: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pages.assistant.cardSecondary, marginBottom: 15 }, welcomeTitle: { color: theme.colors.text, fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' }, welcomeText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, maxWidth: 360 },
  suggestionsAnimated: { overflow: 'hidden' }, suggestions: { borderRadius: 18, backgroundColor: theme.pages.assistant.suggestions.background, borderWidth: 1, borderColor: theme.pages.assistant.suggestions.border, overflow: 'hidden' }, suggestion: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.pages.assistant.suggestions.border }, pressed: { opacity: 0.7 }, suggestionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pages.assistant.suggestions.rowBackground, marginRight: 11 }, suggestionText: { flex: 1, color: theme.colors.text, fontSize: 13, lineHeight: 18, fontWeight: '600', marginRight: 7 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, maxWidth: '88%' }, messageRowUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' }, avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.pages.assistant.messages.avatarBackground, marginRight: 7 }, avatarError: { backgroundColor: theme.colors.dangerBackground }, bubble: { borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10 }, bubbleSia: { backgroundColor: theme.pages.assistant.messages.assistantBackground, borderBottomLeftRadius: 5 }, bubbleUser: { backgroundColor: theme.colors.primary, borderBottomRightRadius: 5 }, bubbleError: { backgroundColor: theme.colors.dangerBackground, borderWidth: 1, borderColor: theme.colors.danger }, messageText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 }, messageTextUser: { color: theme.colors.onPrimary }, messageTextError: { color: theme.colors.danger }, thinking: { color: theme.colors.textSecondary, fontSize: 13, fontStyle: 'italic' },
  confirmAction: { marginTop: 10, borderRadius: 9, backgroundColor: theme.colors.primary, paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start' }, confirmActionText: { color: theme.colors.onPrimary, fontSize: 12, fontWeight: '800' },
  selectionBlock: { marginTop: 11, gap: 7 }, selectionTitle: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '800', marginBottom: 1 }, selectionOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 11, backgroundColor: theme.pages.assistant.cardSecondary, borderWidth: 1, borderColor: theme.pages.assistant.sheet.border }, selectionOptionDisabled: { opacity: 0.5 }, selectionOptionCopy: { flex: 1, minWidth: 0 }, selectionOptionText: { color: theme.colors.text, fontSize: 13, fontWeight: '800' }, selectionOptionDescription: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 },
  safety: { color: theme.colors.textMuted, fontSize: 9, textAlign: 'center', paddingHorizontal: 14, paddingBottom: 5 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 8, backgroundColor: theme.pages.assistant.composer.background }, composerField: { flex: 1, minHeight: 48, maxHeight: 108, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.pages.assistant.composer.fieldBackground, borderWidth: 1, borderColor: theme.pages.assistant.composer.border, borderRadius: 24, overflow: 'hidden' }, attach: { width: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }, input: { flex: 1, minHeight: 46, maxHeight: 106, paddingLeft: 0, paddingRight: 14, paddingVertical: 12, color: theme.colors.text, fontSize: 16, textAlignVertical: 'top' }, send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary }, sendDisabled: { backgroundColor: theme.pages.assistant.composer.fieldBackground },
});
