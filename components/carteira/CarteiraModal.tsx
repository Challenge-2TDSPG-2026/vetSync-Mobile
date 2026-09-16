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
  const { modoIdoso } = useAccessibility();
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
        <View style={s.header}><View><Text style={s.kicker}>Carteira de vacinação</Text><Text style={[s.title, modoIdoso && sIdoso.title]} numberOfLines={1}>{pet.nome}</Text></View><Pressable style={[s.close, modoIdoso && sIdoso.close]} onPress={onFechar} hitSlop={10} accessibilityLabel="Fechar"><Ionicons name="close" size={modoIdoso ? 26 : 22} color={C.text} /></Pressable></View>
        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <View style={[s.identity, modoIdoso && sIdoso.identity]}><View style={[s.identityIcon, modoIdoso && sIdoso.identityIcon]}><Ionicons name="shield-checkmark" size={modoIdoso ? 32 : 27} color={C.green700} /></View><View style={s.identityInfo}><Text style={[s.identityName, modoIdoso && sIdoso.identityName]}>{pet.nome}</Text><Text style={[s.identityMeta, modoIdoso && sIdoso.identityMeta]}>{especie?.label ?? 'Espécie não informada'}{pet.raca ? ` · ${pet.raca}` : ''}</Text></View></View>
          <View style={s.stats}><Resumo label="Registros" valor={vacinas.length} idoso={modoIdoso} /><Resumo label="Realizadas" valor={realizadas} idoso={modoIdoso} /><Resumo label="Agendadas" valor={proximas} idoso={modoIdoso} /></View>
          <View style={s.sectionHead}><View><Text style={[s.sectionTitle, modoIdoso && sIdoso.sectionTitle]}>Histórico de vacinas</Text>{!modoIdoso && <Text style={s.sectionSub}>Registros enviados pela clínica</Text>}</View><Ionicons name="medical-outline" size={20} color={C.green700} /></View>
          {vacinas.length === 0 ? <View style={s.empty}><Ionicons name="document-text-outline" size={25} color={C.green600} /><Text style={s.emptyTitle}>Nenhuma vacina registrada</Text><Text style={s.emptyText}>Quando a clínica registrar uma vacinação, ela aparecerá aqui.</Text></View> : <View style={s.list}>{vacinas.map((evento, index) => <Registro key={evento.id} evento={evento} ultimo={index === vacinas.length - 1} idoso={modoIdoso} />)}</View>}
          {!modoIdoso && <Text style={s.disclaimer}>Esta carteira exibe somente registros disponíveis na sua conta. Para incluir ou corrigir uma vacina, fale com a clínica responsável.</Text>}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function Resumo({ label, valor, idoso }: { label: string; valor: number; idoso?: boolean }) { return <View style={[s.summary, idoso && sIdoso.summary]}><Text style={[s.summaryValue, idoso && sIdoso.summaryValue]}>{valor}</Text><Text style={[s.summaryLabel, idoso && sIdoso.summaryLabel]}>{label}</Text></View>; }
function Registro({ evento, ultimo, idoso }: { evento: Evento; ultimo: boolean; idoso?: boolean }) {
  const visual = statusDoEvento(evento);
  return <View style={[s.record, idoso && sIdoso.record, ultimo && s.recordLast]}><View style={[s.recordIcon, idoso && sIdoso.recordIcon]}><Ionicons name="medical" size={idoso ? 20 : 16} color={C.green700} /></View><View style={s.recordInfo}><Text style={[s.recordName, idoso && sIdoso.recordName]}>{evento.nomeTipoEvento}</Text><Text style={[s.recordMeta, idoso && sIdoso.recordMeta]}>{formatarDataEvento(evento.data)}{evento.nomeVeterinario && evento.nomeVeterinario !== '—' ? ` · ${evento.nomeVeterinario}` : ''}</Text>{evento.observacao ? <Text style={s.recordNote}>{evento.observacao}</Text> : null}</View><View style={[s.status, idoso && sIdoso.status, { backgroundColor: visual.fundo }]}><Text style={[s.statusText, idoso && sIdoso.statusText, { color: visual.cor }]}>{visual.texto}</Text></View></View>;
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(10, 34, 24, 0.55)', justifyContent: 'flex-end' }, sheet: { width: '100%', maxHeight: '90%', minHeight: '56%', backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }, handle: { width: 38, height: 4, borderRadius: 4, backgroundColor: '#d2d0cb', alignSelf: 'center', marginTop: 10, marginBottom: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderColor: C.border, backgroundColor: C.white }, kicker: { color: C.green600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.9, fontWeight: '800' }, title: { color: C.text, fontSize: 21, fontWeight: '800', marginTop: 2, maxWidth: 250 }, close: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0ece5' },
  body: { padding: 20, paddingBottom: 34 }, identity: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: C.green100, borderRadius: 14 }, identityIcon: { height: 45, width: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, marginRight: 12 }, identityInfo: { flex: 1 }, identityName: { color: C.green900, fontSize: 17, fontWeight: '800' }, identityMeta: { color: C.green700, fontSize: 12, marginTop: 3 },
  stats: { flexDirection: 'row', backgroundColor: C.white, borderColor: C.border, borderWidth: 1, borderRadius: 12, overflow: 'hidden', marginTop: 14, marginBottom: 25 }, summary: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRightWidth: 1, borderRightColor: C.border }, summaryValue: { color: C.green800, fontSize: 20, fontWeight: '800' }, summaryLabel: { color: C.muted, fontSize: 10, marginTop: 2 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 }, sectionTitle: { color: C.text, fontSize: 16, fontWeight: '800' }, sectionSub: { color: C.muted, fontSize: 11, marginTop: 2 }, list: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 13, overflow: 'hidden' },
  record: { flexDirection: 'row', gap: 10, padding: 13, borderBottomWidth: 1, borderColor: C.border }, recordLast: { borderBottomWidth: 0 }, recordIcon: { height: 34, width: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: C.green100 }, recordInfo: { flex: 1, minWidth: 0 }, recordName: { color: C.text, fontSize: 13, fontWeight: '800' }, recordMeta: { color: C.muted, fontSize: 10, marginTop: 3 }, recordNote: { color: C.muted, fontSize: 11, marginTop: 6, lineHeight: 16 }, status: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 4 }, statusText: { fontSize: 9, fontWeight: '800' },
  empty: { alignItems: 'center', backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderStyle: 'dashed', borderRadius: 13, paddingHorizontal: 20, paddingVertical: 25 }, emptyTitle: { color: C.text, fontSize: 14, fontWeight: '800', marginTop: 9 }, emptyText: { color: C.muted, textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 4 }, disclaimer: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: 'center' },
});

/** Overrides do modo idoso: textos e alvos de toque maiores; legendas decorativas ficam ocultas (ver JSX). */
const sIdoso = StyleSheet.create({
  title: { fontSize: 25 },
  close: { width: 44, height: 44, borderRadius: 22 },
  identity: { padding: 18 },
  identityIcon: { height: 54, width: 54, borderRadius: 27 },
  identityName: { fontSize: 20 },
  identityMeta: { fontSize: 14 },
  summary: { paddingVertical: 16 },
  summaryValue: { fontSize: 24 },
  summaryLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 19 },
  record: { padding: 16 },
  recordIcon: { height: 42, width: 42, borderRadius: 21 },
  recordName: { fontSize: 16 },
  recordMeta: { fontSize: 13 },
  status: { paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontSize: 12 },
});