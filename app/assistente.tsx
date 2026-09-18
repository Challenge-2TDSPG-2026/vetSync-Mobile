import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePet } from '../context/PetContext';
import { AppIcon } from '../components/AppIcon';
import { ApiError } from '../services/api/httpClient';
import { iaService } from '../services/iaService';
import type { CategoriaSia } from '../services/iaService';
import { alertar } from '../utils/alert';

const C = { green900: '#0a2218', green800: '#0e3326', green700: '#155c3f', green600: '#1a7a52', green100: '#d4f2e4', cream: '#fafaf8', white: '#ffffff', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', danger: '#991b1b', dangerBg: '#fee2e2' };
const DURACAO_TRANSICAO_TECLADO = 250;

type Mensagem = { id: number; autoria: 'usuario' | 'sia'; texto: string; categoria?: CategoriaSia; destaque?: string; erro?: boolean };

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

  async function enviar(textoDireto?: string) {
    const texto = (textoDireto ?? entrada).trim();
    if (!texto || carregando) return;
    setEntrada('');
    setMensagens(atuais => [...atuais, { id: ++idRef.current, autoria: 'usuario', texto }]);
    setCarregando(true);
    try {
      const resposta = await iaService.perguntar(texto, petAtivo);
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
        <AppIcon name="paw" set="MaterialCommunityIcons" size={188} color="rgba(26,122,82,0.045)" style={s.pawWatermarkLarge} />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={52} color="rgba(26,122,82,0.055)" style={s.pawWatermarkSmall} />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={82} color="rgba(26,122,82,0.04)" style={s.pawWatermarkBottom} />
      </View>
      <View {...gestoAlca.panHandlers} style={s.handleArea} accessibilityLabel="Arraste para baixo para fechar a SIA">
        <View style={s.handle} />
      </View>
      <View style={s.header}>
        <Pressable onPress={fechar} hitSlop={10} style={s.headerButton} accessibilityLabel="Voltar"><Ionicons name="chevron-down" size={22} color={C.green700} /></Pressable>
        <View style={s.headerCopy}><Text style={s.headerTitle}>SIA</Text><Text style={s.headerSubtitle}>Sync Inteligência Artificial</Text></View>
        <Pressable onPress={() => setMensagens([])} disabled={mensagens.length === 0 || carregando} hitSlop={10} style={[s.headerButton, (mensagens.length === 0 || carregando) && s.disabled]} accessibilityLabel="Nova conversa"><Ionicons name="refresh" size={20} color={C.green700} /></Pressable>
      </View>

      <ScrollView ref={scrollRef} style={s.chat} contentContainerStyle={s.chatContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {mensagens.length === 0 ? <>
          <View style={s.welcome}><View style={s.siaMark}><Ionicons name="sparkles" size={25} color={C.green700} /></View><Text style={s.welcomeTitle}>Olá, {nome}! Sou a SIA.</Text><Text style={s.welcomeText}>Como posso ajudar com a rotina e os cuidados veterinários?</Text></View>
          <Animated.View style={[s.suggestionsAnimated, {
            opacity: animacaoSugestoes,
            marginTop: animacaoSugestoes.interpolate({ inputRange: [0, 1], outputRange: [0, 28] }),
            maxHeight: animacaoSugestoes.interpolate({ inputRange: [0, 1], outputRange: [0, sugestoes.length * 62] }),
          }]}>
            <View style={s.suggestions}>{sugestoes.map(item => <Pressable key={item.texto} onPress={() => enviar(item.texto)} style={({ pressed }) => [s.suggestion, pressed && s.pressed]}><View style={s.suggestionIcon}><Ionicons name={item.icon} size={19} color={C.green700} /></View><Text style={s.suggestionText}>{item.texto}</Text><Ionicons name="chevron-forward" size={17} color={C.muted} /></Pressable>)}</View>
          </Animated.View>
        </> : mensagens.map(item => <View key={item.id} style={[s.messageRow, item.autoria === 'usuario' && s.messageRowUser]}>
          {item.autoria === 'sia' && <View style={[s.avatar, item.erro && s.avatarError]}><Ionicons name={item.erro ? 'alert-circle-outline' : 'sparkles'} size={15} color={item.erro ? C.danger : C.green700} /></View>}
          <View style={[s.bubble, item.autoria === 'usuario' ? s.bubbleUser : s.bubbleSia, item.erro && s.bubbleError]}>
            {item.categoria && <Text style={s.category}>{item.categoria.replace(/_/g, ' ')}</Text>}
            {item.destaque && <Text style={s.highlight}>{item.destaque.replace(/_/g, ' ')}</Text>}
            <Text style={[s.messageText, item.autoria === 'usuario' && s.messageTextUser, item.erro && s.messageTextError]}>{item.texto}</Text>
          </View>
        </View>)}
        {carregando && <View style={s.messageRow}><View style={s.avatar}><Ionicons name="sparkles" size={15} color={C.green700} /></View><View style={[s.bubble, s.bubbleSia]}><Text style={s.thinking}>SIA está pensando…</Text></View></View>}
      </ScrollView>

      <Text style={s.safety}>A SIA não substitui uma avaliação veterinária.</Text>
      <View style={s.composer}>
        <View style={s.composerField}>
          <Pressable onPress={() => alertar('Anexos', 'O envio de arquivos será habilitado após a definição de privacidade da integração com a IA.')} hitSlop={7} style={s.attach} accessibilityLabel="Anexar arquivo"><Ionicons name="add" size={25} color={C.green700} /></Pressable>
          <TextInput value={entrada} onChangeText={setEntrada} onFocus={() => setTecladoVisivel(true)} onBlur={() => setTecladoVisivel(false)} placeholder="Pergunte algo à SIA" placeholderTextColor={C.muted} style={s.input} multiline maxLength={1000} editable={!carregando} onSubmitEditing={() => enviar()} blurOnSubmit={false} />
        </View>
        <Pressable onPress={() => enviar()} disabled={!entrada.trim() || carregando} style={[s.send, (!entrada.trim() || carregando) && s.sendDisabled]} accessibilityLabel="Enviar pergunta"><Ionicons name="arrow-up" size={20} color={C.white} /></Pressable>
      </View>
    </Animated.View>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'transparent' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10,34,24,0.35)' },
  sheet: { width: '100%', maxWidth: 680, height: '86%', backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 16 },
  pawWatermarks: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  pawWatermarkLarge: { position: 'absolute', top: 112, right: -50, transform: [{ rotate: '-18deg' }] },
  pawWatermarkSmall: { position: 'absolute', top: '43%', left: 17, transform: [{ rotate: '20deg' }] },
  pawWatermarkBottom: { position: 'absolute', bottom: 56, right: 10, transform: [{ rotate: '14deg' }] },
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' }, handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#b7b3c2' },
  header: { minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.border },
  headerButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f5f2' }, disabled: { opacity: 0.38 },
  headerCopy: { flex: 1, alignItems: 'center', paddingHorizontal: 8 }, headerTitle: { color: C.text, fontSize: 19, fontWeight: '800' }, headerSubtitle: { color: C.muted, fontSize: 9, fontWeight: '700', marginTop: 2 },
  chat: { flex: 1 }, chatContent: { flexGrow: 1, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  welcome: { alignItems: 'center', paddingTop: 22, paddingHorizontal: 12, marginBottom: 'auto' }, siaMark: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green100, marginBottom: 15 }, welcomeTitle: { color: C.text, fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' }, welcomeText: { color: C.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, maxWidth: 360 },
  suggestionsAnimated: { overflow: 'hidden' }, suggestions: { borderRadius: 18, backgroundColor: '#f3f6f4', overflow: 'hidden' }, suggestion: { minHeight: 62, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.white }, pressed: { opacity: 0.7 }, suggestionIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, marginRight: 11 }, suggestionText: { flex: 1, color: C.text, fontSize: 13, lineHeight: 18, fontWeight: '600', marginRight: 7 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, maxWidth: '88%' }, messageRowUser: { alignSelf: 'flex-end', justifyContent: 'flex-end' }, avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green100, marginRight: 7 }, avatarError: { backgroundColor: C.dangerBg }, bubble: { borderRadius: 17, paddingHorizontal: 13, paddingVertical: 10 }, bubbleSia: { backgroundColor: '#f0f5f2', borderBottomLeftRadius: 5 }, bubbleUser: { backgroundColor: C.green800, borderBottomRightRadius: 5 }, bubbleError: { backgroundColor: C.dangerBg }, category: { color: C.green600, fontSize: 9, fontWeight: '800', letterSpacing: 0.65, marginBottom: 4 }, highlight: { alignSelf: 'flex-start', color: C.danger, backgroundColor: C.white, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '800', marginBottom: 6 }, messageText: { color: C.text, fontSize: 14, lineHeight: 20 }, messageTextUser: { color: C.white }, messageTextError: { color: C.danger }, thinking: { color: C.muted, fontSize: 13, fontStyle: 'italic' },
  safety: { color: C.muted, fontSize: 9, textAlign: 'center', paddingHorizontal: 14, paddingBottom: 5 }, composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 8, backgroundColor: C.white }, composerField: { flex: 1, minHeight: 48, maxHeight: 108, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border, borderRadius: 24, overflow: 'hidden' }, attach: { width: 44, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' }, input: { flex: 1, minHeight: 46, maxHeight: 106, paddingLeft: 0, paddingRight: 14, paddingVertical: 12, color: C.text, fontSize: 16, textAlignVertical: 'top' }, send: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green700 }, sendDisabled: { backgroundColor: '#b6c5bc' },
});
