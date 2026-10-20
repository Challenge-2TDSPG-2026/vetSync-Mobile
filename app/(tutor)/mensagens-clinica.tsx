import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import {
  clinicaService,
  type ConversaClinica,
  type MensagemClinica,
} from '../../services/clinicaService';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { formatarDataPtBr } from '../../utils/formatarDataPtBr';
import { mostrarToast } from '../../components/ui/Toast';
import { EmptyState } from '../../components/ui/EmptyState';
import type { AppTheme } from '../../constants/theme';

const INTERVALO_ATUALIZACAO_MS = 15_000;

function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toLocaleUpperCase('pt-BR') || 'C';
}

export default function MensagensClinicaScreen() {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const feedRef = useRef<ScrollView>(null);
  const [conversas, setConversas] = useState<ConversaClinica[]>([]);
  const [ativa, setAtiva] = useState<ConversaClinica | null>(null);
  const [mensagens, setMensagens] = useState<MensagemClinica[]>([]);
  const [texto, setTexto] = useState('');
  const [carregandoConversas, setCarregandoConversas] = useState(true);
  const [atualizandoConversas, setAtualizandoConversas] = useState(false);
  const [erroConversas, setErroConversas] = useState<string | null>(null);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [erroMensagens, setErroMensagens] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const carregarConversas = useCallback(async () => {
    try {
      const lista = await clinicaService.conversas();
      setConversas(lista);
      setErroConversas(null);
    } catch (erro) {
      setErroConversas(mensagemDeErro(erro, 'Confira sua conexão e tente novamente.'));
    } finally {
      setCarregandoConversas(false);
      setAtualizandoConversas(false);
    }
  }, []);

  useEffect(() => {
    let ativaTela = true;

    async function buscarConversas() {
      try {
        const lista = await clinicaService.conversas();
        if (ativaTela) {
          setConversas(lista);
          setErroConversas(null);
        }
      } catch (erro) {
        if (ativaTela) {
          setErroConversas(mensagemDeErro(erro, 'Confira sua conexão e tente novamente.'));
        }
      } finally {
        if (ativaTela) setCarregandoConversas(false);
      }
    }

    void buscarConversas();
    return () => {
      ativaTela = false;
    };
  }, []);

  const idConversaAtiva = ativa?.idConversa;

  useEffect(() => {
    if (idConversaAtiva == null) return;
    let ativaBusca = true;
    const idConversa = idConversaAtiva;

    async function buscarMensagens() {
      try {
        const lista = await clinicaService.mensagens(idConversa);
        if (ativaBusca) {
          setMensagens(lista);
          setErroMensagens(null);
          setCarregandoMensagens(false);
        }
      } catch (erro) {
        if (ativaBusca) {
          setErroMensagens(mensagemDeErro(erro, 'Não foi possível atualizar as mensagens.'));
          setCarregandoMensagens(false);
        }
      }
    }

    void buscarMensagens();
    const timer = setInterval(() => void buscarMensagens(), INTERVALO_ATUALIZACAO_MS);
    return () => {
      ativaBusca = false;
      clearInterval(timer);
    };
  }, [idConversaAtiva]);

  async function iniciarConversa() {
    if (iniciando) return;
    setIniciando(true);
    try {
      const conversa = await clinicaService.iniciarConversa();
      setConversas(lista => [conversa, ...lista.filter(item => item.idConversa !== conversa.idConversa)]);
      abrirConversa(conversa);
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível iniciar a conversa',
        mensagemDeErro(erro, 'Tente novamente em instantes.'),
      );
    } finally {
      setIniciando(false);
    }
  }

  function abrirConversa(conversa: ConversaClinica) {
    setMensagens([]);
    setErroMensagens(null);
    setCarregandoMensagens(true);
    setTexto('');
    setAtiva(conversa);
  }

  function voltarParaConversas() {
    setAtiva(null);
    setMensagens([]);
    setErroMensagens(null);
    setTexto('');
  }

  async function enviarMensagem() {
    const conteudo = texto.trim();
    if (!ativa || !conteudo || enviando) return;

    setEnviando(true);
    try {
      const mensagem = await clinicaService.enviarMensagem(ativa.idConversa, conteudo);
      setMensagens(lista =>
        lista.some(item => item.idMensagem === mensagem.idMensagem) ? lista : [...lista, mensagem],
      );
      setTexto('');
      setErroMensagens(null);
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível enviar a mensagem',
        mensagemDeErro(erro, 'Confira sua conexão e tente novamente.'),
      );
    } finally {
      setEnviando(false);
    }
  }

  function atualizarConversas() {
    setAtualizandoConversas(true);
    void carregarConversas();
  }

  function tentarNovamenteConversas() {
    setCarregandoConversas(true);
    void carregarConversas();
  }

  function tentarNovamenteMensagens() {
    if (!ativa) return;
    setErroMensagens(null);
    setCarregandoMensagens(true);
    void clinicaService.mensagens(ativa.idConversa)
      .then(setMensagens)
      .catch(erro => setErroMensagens(mensagemDeErro(erro, 'Não foi possível atualizar as mensagens.')))
      .finally(() => setCarregandoMensagens(false));
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ImageBackground
        source={require('../../assets/images/chatClinic.png')}
        style={[styles.hero, ativa && styles.heroCompact]}
        imageStyle={styles.heroImage}
        resizeMode="cover"
        accessibilityLabel="Tutor e equipe veterinária cuidando de um pet"
      >
        <LinearGradient
          colors={['rgba(5, 25, 18, 0.18)', 'rgba(5, 25, 18, 0.34)', 'rgba(5, 25, 18, 0.92)']}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Pressable
          style={[styles.backButton, { top: Math.max(insets.top, 14) }]}
          onPress={() => (ativa ? voltarParaConversas() : router.back())}
          accessibilityRole="button"
          accessibilityLabel={ativa ? 'Voltar para a lista de conversas' : 'Voltar'}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <Ionicons
              name={ativa ? 'chatbubble-ellipses' : 'chatbubbles'}
              size={modoSimples ? 31 : 25}
              color={theme.colors.primary}
            />
          </View>
          <Text style={[styles.heroEyebrow, modoSimples && stylesSimple.heroEyebrow]}>
            CANAL DIRETO COM A CLÍNICA
          </Text>
          <Text style={[styles.heroTitle, modoSimples && stylesSimple.heroTitle]} numberOfLines={2}>
            {ativa ? ativa.nomeClinica : 'Conversar com a clínica'}
          </Text>
          <Text style={[styles.heroSubtitle, modoSimples && stylesSimple.heroSubtitle]}>
            {ativa
              ? 'Suas mensagens ficam nesta conversa.'
              : 'Tire dúvidas e acompanhe suas conversas em um só lugar.'}
          </Text>
        </View>
      </ImageBackground>

      {ativa ? (
        <View style={styles.chatArea}>
          <View style={styles.privacyNote}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.colors.primary} />
            <Text style={[styles.privacyText, modoSimples && stylesSimple.privacyText]}>
              Converse diretamente com a equipe da clínica.
            </Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>AUTO 15S</Text>
            </View>
          </View>

          <ScrollView
            ref={feedRef}
            style={styles.feed}
            contentContainerStyle={[
              styles.feedContent,
              mensagens.length === 0 && !carregandoMensagens && styles.feedEmptyContent,
            ]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => feedRef.current?.scrollToEnd({ animated: true })}
          >
            {carregandoMensagens ? (
              <View style={styles.feedState}>
                <ActivityIndicator color={theme.colors.primary} />
                <Text style={styles.feedStateText}>Carregando mensagens...</Text>
              </View>
            ) : erroMensagens ? (
              <View style={styles.feedState}>
                <View style={styles.messageStateIcon}>
                  <Ionicons name="cloud-offline-outline" size={22} color={theme.colors.danger} />
                </View>
                <Text style={[styles.feedStateTitle, modoSimples && stylesSimple.feedStateTitle]}>
                  Não foi possível carregar as mensagens
                </Text>
                <Text style={[styles.feedStateText, modoSimples && stylesSimple.feedStateText]}>
                  {erroMensagens}
                </Text>
                <Pressable onPress={tentarNovamenteMensagens} accessibilityRole="button">
                  <Text style={styles.retryText}>Tentar novamente</Text>
                </Pressable>
              </View>
            ) : mensagens.length ? (
              mensagens.map(mensagem => (
                <MessageBubble
                  key={mensagem.idMensagem}
                  mensagem={mensagem}
                  simples={modoSimples}
                  styles={styles}
                />
              ))
            ) : (
              <View style={styles.firstMessage}>
                <View style={styles.firstMessageIcon}>
                  <Ionicons name="hand-left-outline" size={25} color={theme.colors.primary} />
                </View>
                <Text style={[styles.feedStateTitle, modoSimples && stylesSimple.feedStateTitle]}>
                  Comece a conversa
                </Text>
                <Text style={[styles.feedStateText, modoSimples && stylesSimple.feedStateText]}>
                  Envie sua dúvida ou mensagem para a equipe da clínica.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Escreva sua mensagem..."
              placeholderTextColor={theme.colors.placeholder}
              style={[styles.input, modoSimples && stylesSimple.input]}
              multiline
              maxLength={2000}
              editable={!enviando}
              accessibilityLabel="Mensagem para a clínica"
              onSubmitEditing={() => void enviarMensagem()}
              blurOnSubmit={false}
            />
            <Pressable
              style={[
                styles.sendButton,
                (!texto.trim() || enviando) && styles.sendButtonDisabled,
              ]}
              onPress={() => void enviarMensagem()}
              disabled={!texto.trim() || enviando}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem"
              accessibilityState={{ disabled: !texto.trim() || enviando, busy: enviando }}
            >
              {enviando ? (
                <ActivityIndicator color={theme.colors.onPrimary} />
              ) : (
                <Ionicons name="send" size={19} color={theme.colors.onPrimary} />
              )}
            </Pressable>
          </View>
          <Text style={[styles.characterCount, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {texto.length}/2000
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.listScroll}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={atualizandoConversas}
              onRefresh={atualizarConversas}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          <View style={styles.listIntro}>
            <View style={styles.listIntroIcon}>
              <Ionicons name="heart-outline" size={23} color={theme.colors.primary} />
            </View>
            <View style={styles.listIntroCopy}>
              <Text style={[styles.listTitle, modoSimples && stylesSimple.listTitle]}>
                Estamos aqui para ajudar
              </Text>
              <Text style={[styles.listDescription, modoSimples && stylesSimple.listDescription]}>
                Envie uma mensagem para sua clínica e acompanhe as respostas por aqui.
              </Text>
            </View>
          </View>

          <Pressable
            style={[styles.newConversationButton, iniciando && styles.buttonLoading]}
            onPress={() => void iniciarConversa()}
            disabled={iniciando}
            accessibilityRole="button"
            accessibilityLabel="Iniciar nova conversa com a clínica"
            accessibilityState={{ disabled: iniciando, busy: iniciando }}
          >
            {iniciando ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <Ionicons name="create-outline" size={21} color={theme.colors.onPrimary} />
            )}
            <Text style={[styles.newConversationText, modoSimples && stylesSimple.newConversationText]}>
              {iniciando ? 'Iniciando conversa...' : 'Nova conversa'}
            </Text>
            {!iniciando ? <Ionicons name="arrow-forward" size={18} color={theme.colors.onPrimary} /> : null}
          </Pressable>

          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, modoSimples && stylesSimple.sectionTitle]}>
              Suas conversas
            </Text>
            {conversas.length > 0 ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{conversas.length}</Text>
              </View>
            ) : null}
          </View>

          {carregandoConversas ? (
            <View style={styles.listState}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.listStateText}>Carregando conversas...</Text>
            </View>
          ) : erroConversas ? (
            <View style={styles.errorCard}>
              <View style={styles.messageStateIcon}>
                <Ionicons name="cloud-offline-outline" size={22} color={theme.colors.danger} />
              </View>
              <Text style={[styles.feedStateTitle, modoSimples && stylesSimple.feedStateTitle]}>
                Não foi possível carregar suas conversas
              </Text>
              <Text style={[styles.feedStateText, modoSimples && stylesSimple.feedStateText]}>
                {erroConversas}
              </Text>
              <Pressable onPress={tentarNovamenteConversas} accessibilityRole="button">
                <Text style={styles.retryText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : conversas.length ? (
            <View style={styles.conversationList}>
              {conversas.map(conversa => (
                <ConversationCard
                  key={conversa.idConversa}
                  conversa={conversa}
                  onPress={() => abrirConversa(conversa)}
                  simples={modoSimples}
                  styles={styles}
                />
              ))}
            </View>
          ) : (
            <EmptyState
              icon="chatbubbles-outline"
              title="Nenhuma conversa ainda"
              subtitle="Inicie uma conversa quando quiser falar com a equipe da sua clínica."
              variant="plain"
              accentColor={theme.colors.primary}
              actionLabel="Começar uma conversa"
              onAction={() => void iniciarConversa()}
            />
          )}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function ConversationCard({
  conversa,
  onPress,
  simples,
  styles,
}: {
  conversa: ConversaClinica;
  onPress: () => void;
  simples: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const { theme } = useTheme();
  const data = formatarDataPtBr(conversa.criadaEm);
  return (
    <Pressable
      style={({ pressed }) => [styles.conversationCard, pressed && styles.conversationCardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Abrir conversa com ${conversa.nomeClinica}`}
      accessibilityHint={data ? `Conversa iniciada em ${data}` : undefined}
    >
      <View style={styles.conversationAvatar}>
        <Text style={[styles.avatarText, simples && stylesSimple.avatarText]}>
          {iniciais(conversa.nomeClinica)}
        </Text>
      </View>
      <View style={styles.conversationCopy}>
        <Text style={[styles.conversationName, simples && stylesSimple.conversationName]} numberOfLines={1}>
          {conversa.nomeClinica}
        </Text>
        <Text style={[styles.conversationMeta, simples && stylesSimple.conversationMeta]}>
          {data ? `Iniciada em ${data}` : 'Conversa disponível'}
        </Text>
        <Text style={[styles.conversationPreview, simples && stylesSimple.conversationPreview]} numberOfLines={1}>
          Toque para ver as mensagens
        </Text>
      </View>
      <View style={styles.conversationArrow}>
        <Ionicons name="chevron-forward" size={19} color={theme.colors.textMuted} />
      </View>
    </Pressable>
  );
}

function MessageBubble({
  mensagem,
  simples,
  styles,
}: {
  mensagem: MensagemClinica;
  simples: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const { theme } = useTheme();
  const minha = mensagem.remetente === 'TUTOR';
  const data = formatarDataPtBr(mensagem.enviadaEm, true);
  return (
    <View style={[styles.messageRow, minha && styles.messageRowMine]}>
      {!minha ? (
        <View style={styles.clinicMessageAvatar}>
          <Ionicons name="medical-outline" size={16} color={theme.colors.primary} />
        </View>
      ) : null}
      <View style={[styles.messageBubble, minha ? styles.messageMine : styles.messageClinic]}>
        <Text style={[styles.messageSender, minha && styles.messageSenderMine]}>
          {minha ? 'Você' : 'Clínica'}
        </Text>
        <Text style={[styles.messageText, minha && styles.messageTextMine, simples && stylesSimple.messageText]}>
          {mensagem.texto}
        </Text>
        {data ? (
          <Text style={[styles.messageTime, minha && styles.messageTimeMine]}>{data}</Text>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    hero: { height: 280, justifyContent: 'flex-end', backgroundColor: theme.pages.shared.heroBackground },
    heroCompact: { height: 218 },
    heroImage: { width: '100%', height: '100%' },
    backButton: {
      position: 'absolute',
      left: 18,
      zIndex: 2,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    heroContent: { paddingHorizontal: 22, paddingBottom: 21, paddingTop: 70 },
    heroIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.pages.shared.cardElevated,
      marginBottom: 12,
    },
    heroEyebrow: { color: '#d8f1df', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
    heroTitle: { color: '#ffffff', fontSize: 27, fontWeight: '900', letterSpacing: -0.7, lineHeight: 32, marginTop: 4 },
    heroSubtitle: { color: '#f0f6f1', fontSize: 13, lineHeight: 19, marginTop: 5 },
    listScroll: { flex: 1 },
    listContent: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 30 },
    listIntro: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 17 },
    listIntroIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 15,
      backgroundColor: theme.colors.successBackground,
    },
    listIntroCopy: { flex: 1 },
    listTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '900' },
    listDescription: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
    newConversationButton: {
      minHeight: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      paddingHorizontal: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      marginBottom: 25,
    },
    buttonLoading: { opacity: 0.7 },
    newConversationText: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '900', flex: 1 },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 11 },
    sectionTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '900', flex: 1 },
    countBadge: {
      minWidth: 27,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.successBackground,
      alignItems: 'center',
    },
    countText: { color: theme.colors.primary, fontSize: 12, fontWeight: '900' },
    listState: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 28 },
    listStateText: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
    conversationList: { gap: 10 },
    conversationCard: {
      minHeight: 86,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 13,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
    },
    conversationCardPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
    conversationAvatar: {
      width: 49,
      height: 49,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 17,
      backgroundColor: theme.colors.successBackground,
    },
    avatarText: { color: theme.colors.primary, fontSize: 16, fontWeight: '900' },
    conversationCopy: { flex: 1, minWidth: 0 },
    conversationName: { color: theme.colors.text, fontSize: 15, fontWeight: '900' },
    conversationMeta: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 3 },
    conversationPreview: { color: theme.colors.textMuted, fontSize: 11, marginTop: 4 },
    conversationArrow: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 11,
      backgroundColor: theme.pages.shared.cardSecondary,
    },
    errorCard: {
      alignItems: 'center',
      padding: 22,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
    },
    messageStateIcon: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.dangerBackground,
      marginBottom: 9,
    },
    feedStateTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
    feedStateText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 },
    retryText: { color: theme.colors.primary, fontSize: 13, fontWeight: '900', padding: 10, marginTop: 3 },
    chatArea: { flex: 1, minHeight: 0 },
    privacyNote: {
      minHeight: 42,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
    },
    privacyText: { flex: 1, color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
    liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
    liveText: { color: theme.colors.success, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
    feed: { flex: 1 },
    feedContent: { paddingHorizontal: 15, paddingTop: 17, paddingBottom: 20, gap: 12 },
    feedEmptyContent: { flexGrow: 1, justifyContent: 'center' },
    feedState: { alignItems: 'center', justifyContent: 'center', padding: 23 },
    firstMessage: { alignItems: 'center', alignSelf: 'center', maxWidth: 280, padding: 22 },
    firstMessageIcon: {
      width: 56,
      height: 56,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: theme.colors.successBackground,
      marginBottom: 12,
    },
    messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 7, alignSelf: 'flex-start', maxWidth: '92%' },
    messageRowMine: { alignSelf: 'flex-end' },
    clinicMessageAvatar: {
      width: 27,
      height: 27,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: theme.colors.successBackground,
    },
    messageBubble: { maxWidth: '100%', paddingHorizontal: 13, paddingTop: 10, paddingBottom: 8, borderRadius: 17, borderWidth: 1 },
    messageMine: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 5,
    },
    messageClinic: {
      borderColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
      borderBottomLeftRadius: 5,
    },
    messageSender: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', marginBottom: 3 },
    messageSenderMine: { color: theme.colors.onPrimary, opacity: 0.8 },
    messageText: { color: theme.colors.text, fontSize: 14, lineHeight: 20 },
    messageTextMine: { color: theme.colors.onPrimary },
    messageTime: { color: theme.colors.textMuted, fontSize: 9, textAlign: 'right', marginTop: 5 },
    messageTimeMine: { color: theme.colors.onPrimary, opacity: 0.7 },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 9,
      paddingHorizontal: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
    },
    input: {
      flex: 1,
      minHeight: 45,
      maxHeight: 112,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      paddingHorizontal: 14,
      paddingTop: 11,
      paddingBottom: 10,
      fontSize: 14,
      lineHeight: 20,
    },
    sendButton: {
      width: 46,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      backgroundColor: theme.colors.primary,
      marginBottom: 1,
    },
    sendButtonDisabled: { opacity: 0.45 },
    characterCount: {
      color: theme.colors.textMuted,
      fontSize: 10,
      textAlign: 'right',
      paddingRight: 69,
      paddingTop: 4,
      backgroundColor: theme.pages.shared.card,
    },
  });
}

const stylesSimple = StyleSheet.create({
  heroEyebrow: { fontSize: 13 },
  heroTitle: { fontSize: 31, lineHeight: 37 },
  heroSubtitle: { fontSize: 17, lineHeight: 24 },
  listTitle: { fontSize: 21 },
  listDescription: { fontSize: 17, lineHeight: 25 },
  newConversationText: { fontSize: 18 },
  sectionTitle: { fontSize: 22 },
  conversationName: { fontSize: 18 },
  conversationMeta: { fontSize: 14 },
  conversationPreview: { fontSize: 14 },
  privacyText: { fontSize: 14 },
  feedStateTitle: { fontSize: 19 },
  feedStateText: { fontSize: 16, lineHeight: 24 },
  input: { fontSize: 17, minHeight: 54 },
  messageText: { fontSize: 17, lineHeight: 25 },
  avatarText: { fontSize: 19 },
});
