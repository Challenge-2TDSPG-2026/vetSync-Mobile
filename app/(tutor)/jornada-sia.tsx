import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { EmojiFilteredTextInput } from '../../components/ui/EmojiFilteredTextInput';
import { usePet } from '../../context/PetContext';
import { useTheme } from '../../context/ThemeContext';
import { siaJornadaService, type PosConsulta, type ResumoConsulta } from '../../services/siaJornadaService';
import { confirmar } from '../../utils/alert';

export default function JornadaSiaScreen() {
  const router = useRouter();
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();
  const { theme } = useTheme();
  const { pets, eventos, petAtivo } = usePet();
  const [aba, setAba] = useState<'preparar' | 'pos'>(tipo === 'pos' ? 'pos' : 'preparar');
  const [petId, setPetId] = useState(petAtivo?.id ?? pets[0]?.id ?? '');
  const [eventoId, setEventoId] = useState<number | null>(null);
  const [relato, setRelato] = useState('');
  const [resumo, setResumo] = useState('');
  const [perguntas, setPerguntas] = useState('');
  const [salvo, setSalvo] = useState<ResumoConsulta | null>(null);
  const [lista, setLista] = useState<ResumoConsulta[]>([]);
  const [pos, setPos] = useState<PosConsulta | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const eventosPet = eventos.filter(item => item.petId === petId && (aba === 'preparar' ? item.status === 'AGENDADO' : item.status === 'CONCLUIDO'));
  const text = theme.colors.text;
  const muted = theme.colors.textSecondary;
  const primary = theme.colors.primary;

  useEffect(() => {
    if (!petId) return;
    let ativo = true;
    siaJornadaService.listar(Number(petId)).then(items => { if (ativo) setLista(items); })
      .catch(() => { if (ativo) setLista([]); });
    return () => { ativo = false; };
  }, [petId]);

  useEffect(() => {
    if (petId || (!petAtivo?.id && !pets[0]?.id)) return;
    const nextId = petAtivo?.id ?? pets[0].id;
    Promise.resolve().then(() => setPetId(nextId));
  }, [petId, petAtivo?.id, pets]);

  async function executar(task: () => Promise<void>) {
    setOcupado(true); setErro('');
    try { await task(); } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível concluir agora.'); }
    finally { setOcupado(false); }
  }

  async function gerar() {
    if (!petId || relato.trim().length < 10) return;
    await executar(async () => {
      const draft = await siaJornadaService.preparar(Number(petId), relato.trim());
      setResumo([draft.resumo, draft.pontos.length ? `Pontos relatados:\n${draft.pontos.map(ponto => `• ${ponto}`).join('\n')}` : ''].filter(Boolean).join('\n\n'));
      setPerguntas(draft.perguntas.join('\n'));
      setSalvo(null);
    });
  }

  async function salvar() {
    if (!resumo.trim() || !petId) return;
    await executar(async () => {
      const item = salvo
        ? await siaJornadaService.atualizar(salvo, resumo.trim(), perguntas.trim(), eventoId)
        : await siaJornadaService.salvar(Number(petId), resumo.trim(), perguntas.trim(), eventoId);
      setSalvo(item);
      setLista(await siaJornadaService.listar(Number(petId)));
    });
  }

  function pedirCompartilhamento() {
    if (!salvo || !eventoId || salvo.idEvento !== eventoId) return;
    confirmar('Compartilhar resumo?', 'O veterinário responsável pela consulta poderá ler este rascunho gerado com ajuda da SIA.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      { texto: 'Compartilhar', aoConfirmar: () => void executar(async () => {
        const item = await siaJornadaService.compartilhar(salvo);
        setSalvo(item); setLista(await siaJornadaService.listar(Number(petId)));
      }) },
    ]);
  }

  const botao = (label: string, onPress: () => void, disabled = false) => (
    <Pressable onPress={onPress} disabled={disabled || ocupado} style={[s.button, { backgroundColor: primary, opacity: disabled || ocupado ? 0.5 : 1 }]} accessibilityRole="button">
      <Text style={{ color: theme.colors.onPrimary, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );

  return <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={s.root} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={{ color: primary }}>‹ Voltar</Text></Pressable>
    <Text style={[s.title, { color: text }]}>SIA e atendimento</Text>
    <Text style={{ color: muted }}>Organize informações para levar ao veterinário e consulte o que ele registrou depois da consulta.</Text>
    {botao('Procurar atendimento na clínica', () => router.push('/(tutor)/agendar-servico'))}
    <View style={s.row}>
      {botao('Preparar consulta', () => { setAba('preparar'); setEventoId(null); })}
      {botao('Após consulta', () => { setAba('pos'); setEventoId(null); setPos(null); })}
    </View>
    <Text style={[s.label, { color: text }]}>Pet</Text>
    <View style={s.wrap}>{pets.map(pet => <Pressable key={pet.id} onPress={() => { setPetId(pet.id); setEventoId(null); setSalvo(null); setPos(null); setResumo(''); setPerguntas(''); }} style={[s.chip, { borderColor: pet.id === petId ? primary : muted }]}>
      <Text style={{ color: text }}>{pet.nome}</Text>
    </Pressable>)}</View>
    <Text style={[s.label, { color: text }]}>Consulta</Text>
    <View style={s.wrap}>{eventosPet.map(item => <Pressable key={item.id} onPress={() => setEventoId(Number(item.id))} style={[s.chip, { borderColor: eventoId === Number(item.id) ? primary : muted }]}>
      <Text style={{ color: text }}>{item.nomeTipoEvento} · {item.data.slice(0, 10)}</Text>
    </Pressable>)}</View>
    {eventosPet.length === 0 && <Text style={{ color: muted }}>{aba === 'preparar' ? 'Ainda não há consultas agendadas para este pet. Você pode preparar um resumo e vinculá-lo depois de agendar.' : 'Ainda não há consultas concluídas para este pet.'}</Text>}

    {aba === 'preparar' ? <>
      <Text style={[s.label, { color: text }]}>O que você quer contar ao veterinário?</Text>
      <EmojiFilteredTextInput style={[s.input, { color: text, borderColor: muted }]} value={relato} onChangeText={setRelato} multiline maxLength={4000} placeholder="Sintomas, mudanças, dúvidas e quando começaram" placeholderTextColor={muted} />
      {botao('Organizar com a SIA', () => void gerar(), relato.trim().length < 10 || !petId)}
      {!!resumo && <>
        <Text style={[s.label, { color: text }]}>Resumo para revisar · rascunho da IA</Text>
        <EmojiFilteredTextInput style={[s.input, { color: text, borderColor: muted }]} value={resumo} onChangeText={setResumo} multiline maxLength={8000} />
        <Text style={[s.label, { color: text }]}>Perguntas para a consulta</Text>
        <EmojiFilteredTextInput style={[s.input, { color: text, borderColor: muted }]} value={perguntas} onChangeText={setPerguntas} multiline maxLength={4000} />
        {botao(salvo ? 'Salvar revisão' : 'Salvar resumo', () => void salvar())}
        {salvo && eventoId && salvo.idEvento === eventoId && !salvo.compartilhadoEm && botao('Compartilhar com o veterinário', pedirCompartilhamento)}
        {salvo?.compartilhadoEm && !salvo.revogadoEm && botao('Revogar compartilhamento', () => void executar(async () => {
          const item = await siaJornadaService.revogar(salvo); setSalvo(item); setLista(await siaJornadaService.listar(Number(petId)));
        }))}
      </>}
      {lista.length > 0 && <><Text style={[s.label, { color: text }]}>Resumos salvos</Text>{lista.map(item => <Pressable key={item.id} onPress={() => {
        setSalvo(item); setResumo(item.resumo); setPerguntas(item.perguntas ?? ''); setEventoId(item.idEvento);
      }} style={[s.saved, { borderColor: muted }]}><Text style={{ color: text }} numberOfLines={2}>{item.resumo}</Text>
        <Text style={{ color: muted, fontSize: 12 }}>{item.compartilhadoEm && !item.revogadoEm ? 'Compartilhado' : 'Privado'} · rascunho da IA</Text></Pressable>)}</>}
    </> : <>
      <Text style={{ color: muted }}>A SIA apresenta somente orientações registradas e receitas liberadas. Confirme dúvidas diretamente com o veterinário.</Text>
      {botao('Consultar orientações', () => void executar(async () => setPos(await siaJornadaService.posConsulta(Number(petId), eventoId!))), !petId || !eventoId)}
      {pos && <><Text style={{ color: text }}>{pos.mensagem}</Text>
        {pos.orientacoes.map(item => <View key={item.id} style={[s.saved, { borderColor: muted }]}><Text style={{ color: text, fontWeight: '700' }}>{item.titulo}</Text><Text style={{ color: text }}>{item.texto}</Text><Text style={{ color: muted }}>Registro #{item.id} · {item.autor ?? 'Veterinário'}</Text></View>)}
        {pos.medicamentos.map(item => <View key={item.id} style={[s.saved, { borderColor: muted }]}><Text style={{ color: text, fontWeight: '700' }}>{item.medicamento}</Text><Text style={{ color: text }}>{item.posologia}</Text><Text style={{ color: muted }}>Receita liberada #{item.id}</Text></View>)}
        {pos.proximosAgendamentos.length > 0 && <Text style={[s.label, { color: text }]}>Próximos agendamentos do pet</Text>}
        {pos.proximosAgendamentos.map(item => <Text key={item.id} style={{ color: text }}>{item.tipo ?? 'Atendimento'} · {item.data} {item.hora ?? ''}</Text>)}
        {pos.planosAtivos.length > 0 && <Text style={[s.label, { color: text }]}>Planos de acompanhamento registrados para o pet</Text>}
        {pos.planosAtivos.map(item => <View key={item.id} style={[s.saved, { borderColor: muted }]}>
          <Text style={{ color: text, fontWeight: '700' }}>Plano #{item.id} · {item.veterinario ?? 'Veterinário'}</Text>
          {item.itens.map(passo => <Text key={passo.idItem} style={{ color: text }}>• {passo.nmTipoEvento ?? 'Etapa'} · {passo.status}{passo.dtEvento ? ` · ${passo.dtEvento}` : ''}</Text>)}
        </View>)}
      </>}
    </>}
    {ocupado && <ActivityIndicator color={primary} />}
    {!!erro && <Text style={{ color: theme.colors.danger }} accessibilityRole="alert">{erro}</Text>}
  </ScrollView>;
}

const s = StyleSheet.create({
  root: { padding: 20, paddingBottom: 50, gap: 14 }, title: { fontSize: 24, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  label: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  chip: { borderWidth: 1, borderRadius: 12, padding: 10 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 110, padding: 12, textAlignVertical: 'top' },
  button: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, flex: 1 },
  saved: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 6 },
});
