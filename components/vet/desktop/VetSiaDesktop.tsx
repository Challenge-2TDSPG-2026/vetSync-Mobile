import { EmojiFilteredTextInput } from '../../ui/EmojiFilteredTextInput';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useVet } from '../../../context/VetContext';
import type { AppTheme } from '../../../constants/theme';
import { useSiaConversas, type Conversa, type Mensagem } from './useSiaConversas';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const SUGESTOES: { icon: IconName; texto: string }[] = [
  { icon: 'document-text-outline', texto: 'Estruture as orientações de pós-atendimento' },
  { icon: 'calendar-outline', texto: 'Organize um retorno para este paciente' },
  { icon: 'pulse-outline', texto: 'Analise um relato de recuperação pós-cirúrgica' },
];

const LOGO = require('../../../assets/logo.png');

const mesmoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function rotuloDia(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(d, hoje)) return 'Hoje';
  if (mesmoDia(d, ontem)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function rotuloLista(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);
  if (mesmoDia(d, hoje)) return hhmm(iso);
  if (mesmoDia(d, ontem)) return 'Ontem';
  return d.toLocaleDateString('pt-BR');
}

/** SIA em tela cheia para o veterinário no desktop, no estilo de um mensageiro. */
export function VetSiaDesktop() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao } = useAuth();
  const { veterinarioAtivoId } = useVet();
  const { conversas, ativa, ativaId, carregando, ocupado, selecionar, nova, enviar, selecionarBloco, confirmarAcao } = useSiaConversas(veterinarioAtivoId);
  const [entrada, setEntrada] = useState('');
  const [busca, setBusca] = useState('');
  const [alturaInput, setAlturaInput] = useState(44);
  const scrollRef = useRef<ScrollView>(null);

  const nome = sessao?.nome?.trim().split(/\s+/)[0] ?? 'tudo bem';
  const mensagens = ativa?.mensagens ?? [];

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(t);
  }, [mensagens.length, carregando, ativaId]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return conversas;
    return conversas.filter(c => c.titulo.toLowerCase().includes(termo) || (c.mensagens[c.mensagens.length - 1]?.texto ?? '').toLowerCase().includes(termo));
  }, [conversas, busca]);

  function enviarEntrada() {
    const texto = entrada.trim();
    if (!texto || ocupado) return;
    setEntrada('');
    setAlturaInput(44);
    void enviar(texto);
  }

  function aoTeclar(e: NativeSyntheticEvent<TextInputKeyPressEventData>) {
    const nativo = e.nativeEvent as TextInputKeyPressEventData & { shiftKey?: boolean };
    if (nativo.key === 'Enter' && !nativo.shiftKey) {
      e.preventDefault();
      enviarEntrada();
    }
  }

  return (
    <View style={s.page}>
      {/* Lista de conversas */}
      <View style={s.lista}>
        <View style={s.listaHead}>
          <Text style={s.listaTitulo} accessibilityRole="header">Conversas</Text>
          <Pressable style={s.iconBtn} onPress={nova} accessibilityRole="button" accessibilityLabel="Nova conversa">
            <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
          </Pressable>
        </View>
        <View style={s.busca}>
          <Ionicons name="search-outline" size={16} color={theme.colors.textSecondary} />
          <EmojiFilteredTextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Pesquisar conversas"
            placeholderTextColor={theme.colors.placeholder}
            accessibilityLabel="Pesquisar conversas"
            style={s.buscaInput}
          />
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          {filtradas.length === 0 ? (
            <Text style={s.listaVazia}>{conversas.length === 0 ? 'Suas conversas com a SIA aparecem aqui.' : 'Nenhuma conversa encontrada.'}</Text>
          ) : (
            filtradas.map(c => <ItemConversa key={c.id} s={s} theme={theme} conversa={c} ativo={c.id === ativaId} onPress={() => selecionar(c.id)} />)
          )}
        </ScrollView>
      </View>

      {/* Conversa */}
      <View style={s.chat}>
        <View style={s.chatHead}>
          <View style={s.logoWrap}>
            <Image source={LOGO} style={s.logo} resizeMode="contain" accessibilityLabel="VetSync" />
          </View>
          <View>
            <Text style={s.chatTitulo}>SIA</Text>
            <Text style={s.chatSub}>{carregando ? 'digitando…' : 'Sync Inteligência Artificial'}</Text>
          </View>
        </View>

        <ScrollView ref={scrollRef} style={s.mensagens} contentContainerStyle={s.mensagensContent} keyboardShouldPersistTaps="handled">
          {mensagens.length === 0 ? (
            <View style={s.boasVindas}>
              <View style={s.marca}><Ionicons name="sparkles" size={26} color={theme.colors.primary} /></View>
              <Text style={s.boasTitulo}>Olá, {nome}! Sou a SIA.</Text>
              <Text style={s.boasTexto}>Como posso ajudar com a rotina e os cuidados veterinários?</Text>
              <View style={s.sugestoes}>
                {SUGESTOES.map(item => (
                  <Pressable key={item.texto} style={s.sugestao} onPress={() => void enviar(item.texto)} accessibilityRole="button" accessibilityLabel={item.texto}>
                    <Ionicons name={item.icon} size={18} color={theme.colors.primary} />
                    <Text style={s.sugestaoTexto}>{item.texto}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            mensagens.map((m, i) => {
              const novoDia = i === 0 || !mesmoDia(new Date(m.hora), new Date(mensagens[i - 1].hora));
              return (
                <React.Fragment key={m.id}>
                  {novoDia && <View style={s.diaWrap}><Text style={s.dia}>{rotuloDia(m.hora)}</Text></View>}
                  <Balao s={s} theme={theme} mensagem={m} ocupado={ocupado} onOpcao={o => void selecionarBloco(m, o)} onConfirmar={() => void confirmarAcao(m)} />
                </React.Fragment>
              );
            })
          )}
          {carregando && (
            <View style={[s.linha]}>
              <View style={[s.balao, s.balaoSia]}><Text style={s.digitando}>SIA está pensando…</Text></View>
            </View>
          )}
        </ScrollView>

        <Text style={s.aviso}>A SIA não substitui uma avaliação veterinária.</Text>
        <View style={s.composer}>
          <EmojiFilteredTextInput
            value={entrada}
            onChangeText={setEntrada}
            onKeyPress={aoTeclar}
            onContentSizeChange={e => setAlturaInput(Math.min(140, Math.max(44, e.nativeEvent.contentSize.height + 4)))}
            placeholder="Digite uma mensagem"
            placeholderTextColor={theme.colors.placeholder}
            multiline
            accessibilityLabel="Mensagem para a SIA"
            style={[s.input, { height: alturaInput }]}
          />
          <Pressable
            style={[s.enviar, (!entrada.trim() || ocupado) && s.enviarOff]}
            onPress={enviarEntrada}
            disabled={!entrada.trim() || ocupado}
            accessibilityRole="button"
            accessibilityLabel="Enviar mensagem"
          >
            <Ionicons name="send" size={18} color={theme.colors.onPrimary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function ItemConversa({ s, theme, conversa, ativo, onPress }: { s: Styles; theme: AppTheme; conversa: Conversa; ativo: boolean; onPress: () => void }) {
  const ultima = conversa.mensagens[conversa.mensagens.length - 1];
  return (
    <Pressable style={[s.item, ativo && s.itemAtivo]} onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: ativo }} accessibilityLabel={`Conversa: ${conversa.titulo}`}>
      <View style={s.itemAvatar}><Ionicons name="sparkles" size={18} color={theme.colors.primary} /></View>
      <View style={s.itemCopy}>
        <View style={s.itemTopo}>
          <Text style={s.itemTitulo} numberOfLines={1}>{conversa.titulo}</Text>
          <Text style={s.itemHora}>{rotuloLista(conversa.atualizadaEm)}</Text>
        </View>
        <Text style={s.itemPrevia} numberOfLines={1}>{ultima ? `${ultima.autoria === 'usuario' ? 'Você: ' : ''}${ultima.texto}` : ''}</Text>
      </View>
    </Pressable>
  );
}

function Balao({ s, theme, mensagem, ocupado, onOpcao, onConfirmar }: { s: Styles; theme: AppTheme; mensagem: Mensagem; ocupado: boolean; onOpcao: (o: NonNullable<Mensagem['bloco']>['opcoes'][number]) => void; onConfirmar: () => void }) {
  const meu = mensagem.autoria === 'usuario';
  return (
    <View style={[s.linha, meu && s.linhaMeu]}>
      <View style={[s.balao, meu ? s.balaoMeu : s.balaoSia, mensagem.erro && s.balaoErro]}>
        <Text style={[s.texto, mensagem.erro && s.textoErro]}>{mensagem.texto}</Text>
        {mensagem.acao?.requerConfirmacao && (
          <Pressable style={s.acaoBtn} onPress={onConfirmar} disabled={ocupado} accessibilityRole="button">
            <Text style={s.acaoBtnTexto}>Confirmar ação</Text>
          </Pressable>
        )}
        {mensagem.bloco && (
          <View style={s.bloco} accessibilityLabel={mensagem.bloco.titulo}>
            <Text style={s.blocoTitulo}>{mensagem.bloco.titulo}</Text>
            {mensagem.bloco.opcoes.map(o => (
              <Pressable
                key={o.id}
                style={[s.opcao, (!o.habilitado || ocupado) && s.opcaoOff]}
                onPress={() => onOpcao(o)}
                disabled={!o.habilitado || ocupado}
                accessibilityRole="button"
                accessibilityLabel={o.descricao ? `${o.rotulo}, ${o.descricao}` : o.rotulo}
              >
                <View style={s.opcaoCopy}>
                  <Text style={s.opcaoTexto}>{o.rotulo}</Text>
                  {o.descricao ? <Text style={s.opcaoDesc}>{o.descricao}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
              </Pressable>
            ))}
          </View>
        )}
        <Text style={s.hora}>{hhmm(mensagem.hora)}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const p = theme.pages.assistant;
  return StyleSheet.create({
    page: { flex: 1, flexDirection: 'row', backgroundColor: p.card },

    lista: { width: 360, borderRightWidth: 1, borderRightColor: p.border, backgroundColor: p.card },
    listaHead: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    listaTitulo: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    busca: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: p.cardSecondary },
    buscaInput: { flex: 1, fontSize: 14, color: theme.colors.text, paddingVertical: 0, outlineStyle: 'none' } as object,
    listaVazia: { padding: 24, textAlign: 'center', fontSize: 13, color: theme.colors.textSecondary },
    item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
    itemAtivo: { backgroundColor: p.cardSecondary },
    itemAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.successBackground },
    itemCopy: { flex: 1, minWidth: 0 },
    itemTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    itemTitulo: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text },
    itemHora: { fontSize: 12, color: theme.colors.textSecondary },
    itemPrevia: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 3 },

    chat: { flex: 1, backgroundColor: p.cardSecondary },
    chatHead: { height: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, backgroundColor: p.card, borderBottomWidth: 1, borderBottomColor: p.border },
    logoWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0C2418' },
    logo: { width: 26, height: 30 },
    chatTitulo: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    chatSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 1 },

    mensagens: { flex: 1 },
    mensagensContent: { flexGrow: 1, paddingVertical: 20, paddingHorizontal: 48, gap: 6 },
    diaWrap: { alignItems: 'center', marginVertical: 10 },
    dia: { fontSize: 12, fontWeight: '600', color: theme.colors.textSecondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, overflow: 'hidden', backgroundColor: p.card },
    linha: { flexDirection: 'row', justifyContent: 'flex-start' },
    linhaMeu: { justifyContent: 'flex-end' },
    balao: { maxWidth: '68%', paddingTop: 8, paddingBottom: 6, paddingHorizontal: 12, borderRadius: 12 },
    balaoSia: { backgroundColor: p.card, borderTopLeftRadius: 2 },
    balaoMeu: { backgroundColor: theme.colors.successBackground, borderTopRightRadius: 2 },
    balaoErro: { backgroundColor: theme.colors.dangerBackground },
    texto: { fontSize: 14, lineHeight: 20, color: theme.colors.text },
    textoErro: { color: theme.colors.danger },
    hora: { alignSelf: 'flex-end', fontSize: 11, color: theme.colors.textSecondary, marginTop: 4 },
    digitando: { fontSize: 13, fontStyle: 'italic', color: theme.colors.textSecondary, paddingBottom: 4 },

    acaoBtn: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, backgroundColor: theme.colors.primary },
    acaoBtnTexto: { fontSize: 13, fontWeight: '700', color: theme.colors.onPrimary },
    bloco: { marginTop: 10, gap: 6 },
    blocoTitulo: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: p.border, backgroundColor: p.cardSecondary },
    opcaoOff: { opacity: 0.5 },
    opcaoCopy: { flex: 1 },
    opcaoTexto: { fontSize: 13, fontWeight: '600', color: theme.colors.text },
    opcaoDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },

    boasVindas: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
    marca: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: p.card },
    boasTitulo: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginTop: 8 },
    boasTexto: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' },
    sugestoes: { gap: 10, marginTop: 24, width: '100%', maxWidth: 460 },
    sugestao: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    sugestaoTexto: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text },

    aviso: { textAlign: 'center', fontSize: 11, color: theme.colors.textSecondary, paddingVertical: 6 },
    composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 24, paddingTop: 4, paddingBottom: 16 },
    input: { flex: 1, minHeight: 44, maxHeight: 140, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, fontSize: 14, color: theme.colors.text, backgroundColor: p.card, outlineStyle: 'none' } as object,
    enviar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary },
    enviarOff: { opacity: 0.4 },
  });
}
