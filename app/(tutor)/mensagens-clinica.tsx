import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { clinicaService, type ConversaClinica, type MensagemClinica } from '../../services/clinicaService';
import { mostrarToast } from '../../components/ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';

export default function MensagensClinicaScreen() {
  const { theme } = useTheme(); const router = useRouter();
  const [conversas, setConversas] = useState<ConversaClinica[]>([]);
  const [ativa, setAtiva] = useState<ConversaClinica | null>(null);
  const [mensagens, setMensagens] = useState<MensagemClinica[]>([]);
  const [texto, setTexto] = useState(''); const [loading, setLoading] = useState(true); const [enviando, setEnviando] = useState(false);
  async function carregar() { try { const lista = await clinicaService.conversas(); setConversas(lista); }
    catch (e) { mostrarToast('erro', 'Não foi possível carregar as conversas', mensagemDeErro(e, 'Tente novamente.')); }
    finally { setLoading(false); } }
  async function carregarMensagens(id: number) { try { setMensagens(await clinicaService.mensagens(id)); }
    catch (e) { mostrarToast('erro', 'Não foi possível carregar as mensagens', mensagemDeErro(e, 'Tente novamente.')); } }
  useEffect(() => { void carregar(); }, []);
  useEffect(() => { if (!ativa) return; void carregarMensagens(ativa.idConversa);
    const timer = setInterval(() => void carregarMensagens(ativa.idConversa), 15000);
    return () => clearInterval(timer); }, [ativa?.idConversa]);
  async function iniciar() { try { const c = await clinicaService.iniciarConversa(); setAtiva(c); await carregar(); }
    catch (e) { mostrarToast('erro', 'Não foi possível iniciar a conversa', mensagemDeErro(e, 'Tente novamente.')); } }
  async function enviar() { if (!ativa || !texto.trim()) return; setEnviando(true);
    try { await clinicaService.enviarMensagem(ativa.idConversa, texto.trim()); setTexto('');
      await carregarMensagens(ativa.idConversa); }
    catch (e) { mostrarToast('erro', 'Não foi possível enviar', mensagemDeErro(e, 'Tente novamente.')); }
    finally { setEnviando(false); } }
  const card = { backgroundColor: theme.colors.input, borderColor: theme.colors.textMuted };
  return <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[s.header, { borderBottomColor: theme.colors.textMuted }]}><Pressable onPress={() => ativa ? setAtiva(null) : router.back()}>
      <Text style={{ color: theme.colors.primary, fontSize: 17 }}>‹ Voltar</Text></Pressable>
      <Text style={[s.title, { color: theme.colors.text }]}>{ativa ? ativa.nomeClinica : 'Mensagens da clínica'}</Text></View>
    {loading ? <ActivityIndicator style={{ marginTop: 35 }} color={theme.colors.primary} /> : ativa ? <>
      <ScrollView style={s.feed} contentContainerStyle={s.feedContent} keyboardShouldPersistTaps="handled">
        {mensagens.length ? mensagens.map(m => <View key={m.idMensagem} style={[s.message, card,
          m.remetente === 'TUTOR' && { alignSelf: 'flex-end', backgroundColor: theme.colors.successBackground }]}>
          <Text style={[s.meta, { color: theme.colors.textSecondary }]}>{m.remetente === 'TUTOR' ? 'Você' : 'Clínica'} · {new Date(m.enviadaEm).toLocaleString('pt-BR')}</Text>
          <Text style={{ color: theme.colors.text, lineHeight: 21 }}>{m.texto}</Text></View>) :
          <Text style={{ color: theme.colors.textSecondary }}>Conversa iniciada. Envie sua primeira mensagem.</Text>}
      </ScrollView><View style={[s.composer, { borderTopColor: theme.colors.textMuted }]}>
        <TextInput multiline maxLength={2000} value={texto} onChangeText={setTexto} placeholder="Escreva sua mensagem"
          placeholderTextColor={theme.colors.placeholder} style={[s.input, card, { color: theme.colors.text }]} />
        <Pressable onPress={enviar} disabled={enviando || !texto.trim()} style={[s.send, { backgroundColor: theme.colors.primary, opacity: enviando || !texto.trim() ? .5 : 1 }]}>
          {enviando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>Enviar</Text>}</Pressable>
      </View></> : <ScrollView contentContainerStyle={s.list}>
      <Text style={{ color: theme.colors.textSecondary, marginBottom: 20 }}>Fale diretamente com a equipe da sua clínica.</Text>
      <Pressable onPress={iniciar} style={[s.newButton, { backgroundColor: theme.colors.primary }]}><Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>Nova conversa com a clínica</Text></Pressable>
      {conversas.map(c => <Pressable key={c.idConversa} onPress={() => setAtiva(c)} style={[s.conversation, card]}>
        <Text style={{ color: theme.colors.text, fontWeight: '800' }}>{c.nomeClinica}</Text>
        <Text style={{ color: theme.colors.textSecondary }}>{new Date(c.criadaEm).toLocaleDateString('pt-BR')}</Text>
      </Pressable>)}</ScrollView>}
  </KeyboardAvoidingView>;
}
const s = StyleSheet.create({ root: { flex: 1 }, header: { paddingTop: 48, paddingHorizontal: 18, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 23, fontWeight: '800', marginTop: 10 }, list: { padding: 20, paddingBottom: 40 }, newButton: { padding: 15, borderRadius: 13,
    alignItems: 'center', marginBottom: 22 }, conversation: { padding: 17, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 4 },
  feed: { flex: 1 }, feedContent: { padding: 18, gap: 11, paddingBottom: 30 }, message: { borderWidth: 1, borderRadius: 13,
    padding: 12, maxWidth: '88%', alignSelf: 'flex-start', gap: 5 }, meta: { fontSize: 11 }, composer: { flexDirection: 'row',
    alignItems: 'flex-end', gap: 8, borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, maxHeight: 100, padding: 11 }, send: { borderRadius: 12, paddingHorizontal: 17,
    minHeight: 45, justifyContent: 'center' } });
