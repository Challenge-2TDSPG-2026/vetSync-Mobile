import React, { useEffect, useMemo } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Evento, Pet } from '../../types';
import { ESPECIES } from '../../constants';
import { formatarDataEvento, statusExibicao } from '../../utils/eventoStatus';
import { useAccessibility } from '../../context/AccessibilityContext';

const C = { green900: '#0a2218', green800: '#0e3326', green700: '#155c3f', green600: '#1a7a52', green100: '#d4f2e4', cream: '#fafaf8', white: '#ffffff', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', blue: '#1e40af', blueBg: '#dbeafe', red: '#991b1b', redBg: '#fee2e2', ok: '#166534', okBg: '#dcfce7' };
type Props = { pet: Pet | null; eventos: Evento[]; onFechar: () => void };

function ehVacina(evento: Evento) { return evento.nomeTipoEvento.toLocaleLowerCase('pt-BR').includes('vacin'); }
function statusDoEvento(evento: Evento) {
  switch (statusExibicao(evento)) {
    case 'CONCLUIDO': return { texto: 'Realizada', cor: C.ok, fundo: C.okBg };
    case 'ATRASADO': return { texto: 'Atrasada', cor: C.red, fundo: C.redBg };
    case 'CANCELADO': return { texto: 'Cancelada', cor: C.muted, fundo: '#f0ece5' };
    default: return { texto: 'Agendada', cor: C.blue, fundo: C.blueBg };
  }
}

export function CarteiraModal({ pet, eventos, onFechar }: Props) {
  const { modoSimples } = useAccessibility();
  const vacinas = useMemo(() => eventos.filter(ehVacina), [eventos]);
  const especie = ESPECIES.find(item => item.valor === pet?.especie);
  const realizadas = vacinas.filter(item => statusExibicao(item) === 'CONCLUIDO').length;
  const proximas = vacinas.filter(item => statusExibicao(item) === 'AGENDADO').length;
  useEffect(() => {
    if (Platform.OS !== 'web' || !pet) return;
    const fecharComEscape = (event: KeyboardEvent) => event.key === 'Escape' && onFechar();
    window.addEventListener('keydown', fecharComEscape);
    return () => window.removeEventListener('keydown', fecharComEscape);
  }, [pet, onFechar]);
  if (!pet) return null;
  return <Modal visible transparent animationType="slide" onRequestClose={onFechar} statusBarTranslucent>
    <View style={s.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityLabel="Fechar carteira" />
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.handle} />
        <View style={s.header}><View><Text style={s.kicker}>Carteira de vacinação</Text><Text style={[s.title, modoSimples && sSimples.title]} numberOfLines={1}>{pet.nome}</Text></View><Pressable style={[s.close, modoSimples && sSimples.close]} onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar"><Ionicons name="close" size={modoSimples ? 35 : 26} color={C.text} /></Pressable></View>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <View style={[s.identity, modoSimples && sSimples.identity]}><View style={[s.identityIcon, modoSimples && sSimples.identityIcon]}><Ionicons name="shield-checkmark" size={modoSimples ? 43 : 32} color={C.green700} /></View><View style={s.identityInfo}><Text style={[s.identityName, modoSimples && sSimples.identityName]}>{pet.nome}</Text><Text style={[s.identityMeta, modoSimples && sSimples.identityMeta]}>{especie?.label ?? 'Espécie não informada'}{pet.raca ? ` · ${pet.raca}` : ''}</Text></View></View>
          <View style={s.stats}><Resumo label="Registros" valor={vacinas.length} simples={modoSimples} /><Resumo label="Realizadas" valor={realizadas} simples={modoSimples} /><Resumo label="Agendadas" valor={proximas} simples={modoSimples} /></View>
          <View style={s.sectionHead}><View><Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Histórico de vacinas</Text>{!modoSimples && <Text style={s.sectionSub}>Registros enviados pela clínica</Text>}</View><Ionicons name="medical-outline" size={24} color={C.green700} /></View>
          {vacinas.length === 0 ? <View style={s.empty}><Ionicons name="document-text-outline" size={30} color={C.green600} /><Text style={s.emptyTitle}>Nenhuma vacina registrada</Text><Text style={s.emptyText}>Quando a clínica registrar uma vacinação, ela aparecerá aqui.</Text></View> : <View style={s.list}>{vacinas.map((evento, index) => <Registro key={evento.id} evento={evento} ultimo={index === vacinas.length - 1} simples={modoSimples} />)}</View>}
          {!modoSimples && <Text style={s.disclaimer}>Esta carteira exibe somente registros disponíveis na sua conta. Para incluir ou corrigir uma vacina, fale com a clínica responsável.</Text>}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function Resumo({ label, valor, simples }: { label: string; valor: number; simples?: boolean }) { return <View style={[s.summary, simples && sSimples.summary]}><Text style={[s.summaryValue, simples && sSimples.summaryValue]}>{valor}</Text><Text style={[s.summaryLabel, simples && sSimples.summaryLabel]}>{label}</Text></View>; }
function Registro({ evento, ultimo, simples }: { evento: Evento; ultimo: boolean; simples?: boolean }) {
  const visual = statusDoEvento(evento);
  return <View style={[s.record, simples && sSimples.record, ultimo && s.recordLast]}><View style={[s.recordIcon, simples && sSimples.recordIcon]}><Ionicons name="medical" size={simples ? 27 : 20} color={C.green700} /></View><View style={s.recordInfo}><Text style={[s.recordName, simples && sSimples.recordName]}>{evento.nomeTipoEvento}</Text><Text style={[s.recordMeta, simples && sSimples.recordMeta]}>{formatarDataEvento(evento.data)}{evento.nomeVeterinario && evento.nomeVeterinario !== '—' ? ` · ${evento.nomeVeterinario}` : ''}</Text>{evento.observacao ? <Text style={s.recordNote}>{evento.observacao}</Text> : null}</View><View style={[s.status, simples && sSimples.status, { backgroundColor: visual.fundo }]}><Text style={[s.statusText, simples && sSimples.statusText, { color: visual.cor }]}>{visual.texto}</Text></View></View>;
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 34, 24, 0.55)', justifyContent: 'flex-end' }, sheet: { width: '100%', maxHeight: '90%', minHeight: '56%', backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }, handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: '#d2d0cb', alignSelf: 'center', marginTop: 10, marginBottom: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.white }, kicker: { color: C.green600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.9, fontWeight: '800' }, title: { color: C.text, fontSize: 25, fontWeight: '800', marginTop: 2, maxWidth: 260 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0ece5' },
  body: { padding: 20, paddingBottom: 36 }, identity: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: C.green100, borderRadius: 14 }, identityIcon: { height: 54, width: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, marginRight: 13 }, identityInfo: { flex: 1 }, identityName: { color: C.green900, fontSize: 20, fontWeight: '800' }, identityMeta: { color: C.green700, fontSize: 14, marginTop: 3 },
  stats: { flexDirection: 'row', backgroundColor: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 16, marginBottom: 27 }, summary: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRightWidth: 1, borderRightColor: C.border }, summaryValue: { color: C.green800, fontSize: 24, fontWeight: '800' }, summaryLabel: { color: C.muted, fontSize: 12, marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, sectionTitle: { color: C.text, fontSize: 19, fontWeight: '800' }, sectionSub: { color: C.muted, fontSize: 11, marginTop: 2 }, list: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 13, overflow: 'hidden' },
  record: { flexDirection: 'row', gap: 11, padding: 16, borderBottomWidth: 1, borderColor: C.border }, recordLast: { borderBottomWidth: 0 }, recordIcon: { height: 42, width: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green100 }, recordInfo: { flex: 1, minWidth: 0 }, recordName: { color: C.text, fontSize: 16, fontWeight: '800' }, recordMeta: { color: C.muted, fontSize: 13, marginTop: 3 }, recordNote: { color: C.muted, fontSize: 12, marginTop: 6, lineHeight: 17 }, status: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }, statusText: { fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 13, paddingHorizontal: 20, paddingVertical: 28 }, emptyTitle: { color: C.text, fontSize: 15, fontWeight: '800', marginTop: 10 }, emptyText: { color: C.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginTop: 4 }, disclaimer: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: 19, textAlign: 'center' },
});

/** Modo simples: ~35% maior que o padrão. */
const sSimples = StyleSheet.create({
  title: { fontSize: 34 },
  close: { width: 60, height: 60, borderRadius: 30 },
  identity: { padding: 24 },
  identityIcon: { height: 73, width: 73, borderRadius: 37 },
  identityName: { fontSize: 27 },
  identityMeta: { fontSize: 19 },
  summary: { paddingVertical: 22 },
  summaryValue: { fontSize: 32 },
  summaryLabel: { fontSize: 16 },
  sectionTitle: { fontSize: 26 },
  record: { padding: 22 },
  recordIcon: { height: 57, width: 57, borderRadius: 29 },
  recordName: { fontSize: 22 },
  recordMeta: { fontSize: 18 },
  status: { paddingHorizontal: 14, paddingVertical: 8 },
  statusText: { fontSize: 16 },
});