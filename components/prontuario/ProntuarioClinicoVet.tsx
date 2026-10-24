import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../ui/Toast';
import { useProntuario, useRemoverExame, useRemoverOrientacao } from '../../hooks/useProntuario';
import { compartilhamentoNativoService } from '../../services/compartilhamentoNativoService';
import type { ExameProntuario } from '../../services/prontuarioService';
import { ehProntuarioAnterior, montarItensProntuario, type ItemProntuario } from '../../utils/prontuario';
import { NovaOrientacaoModal } from './NovaOrientacaoModal';
import { ProntuarioLinhaDoTempo } from './ProntuarioLinhaDoTempo';
import { RegistrarExameModal } from './RegistrarExameModal';
import type { EventoOpcao } from './tiposVet';

interface ProntuarioClinicoVetProps {
  idPet: string;
  nomePet: string;
  /** Atendimentos não cancelados, do mais recente para o mais antigo. */
  eventos: EventoOpcao[];
  habilitado: boolean;
}

const SECOES_VET = ['ORIENTACOES', 'EXAMES'] as const;
const LIMITE_RECENTES = 4;
const FILTROS_VET = { secoes: [...SECOES_VET] };

/** Registro de orientações e exames no prontuário clínico do paciente (a visão completa fica com o tutor). */
export function ProntuarioClinicoVet({ idPet, nomePet, eventos, habilitado }: ProntuarioClinicoVetProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const prontuario = useProntuario(idPet, FILTROS_VET, habilitado);
  const removerOrientacao = useRemoverOrientacao(idPet);
  const removerExame = useRemoverExame(idPet);

  const [orientacaoAberta, setOrientacaoAberta] = useState(false);
  const [exameAberto, setExameAberto] = useState(false);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);

  const itens = useMemo(
    () => (prontuario.data ? montarItensProntuario(prontuario.data) : []),
    [prontuario.data]
  );
  // O que o tutor enviou de consultas antigas fica em destaque e completo; o restante mostra só os mais recentes.
  const anteriores = useMemo(() => itens.filter(item => item.tipo === 'EXAME' && ehProntuarioAnterior(item.exame)), [itens]);
  const registrosClinica = useMemo(() => itens.filter(item => !anteriores.includes(item)), [itens, anteriores]);
  const recentes = registrosClinica.slice(0, LIMITE_RECENTES);

  async function baixarLaudo(exame: ExameProntuario) {
    setBaixandoId(exame.id);
    try {
      await compartilhamentoNativoService.baixarArquivoAutenticado(
        `/pets/${idPet}/exames/${exame.id}/arquivo`,
        exame.arquivoNome ?? `laudo-${exame.id}`
      );
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível baixar o laudo', erro instanceof Error ? erro.message : undefined);
    } finally {
      setBaixandoId(null);
    }
  }

  function pedirRemocao(item: ItemProntuario) {
    const orientacao = item.tipo === 'ORIENTACAO';
    confirmar(
      orientacao ? 'Remover orientação?' : 'Remover exame?',
      'A remoção fica registrada na auditoria e o tutor deixa de ver este item.',
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        { texto: 'Remover', estilo: 'destructive', aoConfirmar: () => void remover(item) },
      ]
    );
  }

  async function remover(item: ItemProntuario) {
    try {
      if (item.tipo === 'ORIENTACAO') {
        await removerOrientacao.mutateAsync({ idEvento: item.orientacao.eventoId, idOrientacao: item.orientacao.id });
      } else if (item.tipo === 'EXAME') {
        await removerExame.mutateAsync(item.exame.id);
      }
      mostrarToast('sucesso', 'Item removido');
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível remover', erro instanceof Error ? erro.message : undefined);
    }
  }

  // O prontuário anterior pertence a quem enviou (o tutor): o veterinário só consulta.
  const renderRemover = (item: ItemProntuario) => item.tipo === 'EXAME' && ehProntuarioAnterior(item.exame) ? null : (
    <Pressable style={s.remover} onPress={() => pedirRemocao(item)} accessibilityRole="button" accessibilityLabel="Remover item">
      <Ionicons name="trash-outline" size={16} color={theme.colors.danger} />
      <Text style={s.removerTexto}>Remover</Text>
    </Pressable>
  );

  return (
    <View style={s.card}>
      <View style={s.topo}>
        <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
        <Text style={s.titulo}>Prontuário clínico</Text>
      </View>
      <Text style={s.descricao}>Registre orientações e resultados de exames. O tutor passa a ver no prontuário clínico do app.</Text>

      <View style={s.acoes}>
        <Pressable style={s.acao} onPress={() => setOrientacaoAberta(true)} accessibilityRole="button" accessibilityLabel="Nova orientação">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.onPrimary} />
          <Text style={s.acaoTexto}>Orientação</Text>
        </Pressable>
        <Pressable style={s.acao} onPress={() => setExameAberto(true)} accessibilityRole="button" accessibilityLabel="Registrar exame">
          <Ionicons name="flask-outline" size={18} color={theme.colors.onPrimary} />
          <Text style={s.acaoTexto}>Exame</Text>
        </Pressable>
      </View>

      {prontuario.isLoading ? (
        <ActivityIndicator color={theme.colors.primary} style={s.carregando} />
      ) : prontuario.isError ? (
        <Text style={s.vazio}>Não foi possível carregar os registros agora.</Text>
      ) : itens.length === 0 ? (
        <Text style={s.vazio}>Nenhuma orientação, exame ou prontuário anterior registrado ainda.</Text>
      ) : (
        <>
          {anteriores.length > 0 ? (
            <View style={s.lista}>
              <Text style={s.subtitulo}>Prontuário anterior enviado pelo tutor</Text>
              <ProntuarioLinhaDoTempo itens={anteriores} onBaixarLaudo={baixarLaudo} baixandoExameId={baixandoId} renderAcoes={renderRemover} />
            </View>
          ) : null}
          {recentes.length > 0 ? (
            <View style={s.lista}>
              <Text style={s.subtitulo}>Registros recentes</Text>
              <ProntuarioLinhaDoTempo itens={recentes} onBaixarLaudo={baixarLaudo} baixandoExameId={baixandoId} renderAcoes={renderRemover} />
              {registrosClinica.length > LIMITE_RECENTES ? (
                <Text style={s.mais}>+ {registrosClinica.length - LIMITE_RECENTES} registros mais antigos no prontuário clínico do tutor.</Text>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <NovaOrientacaoModal visivel={orientacaoAberta} idPet={idPet} nomePet={nomePet} eventos={eventos} onFechar={() => setOrientacaoAberta(false)} />
      <RegistrarExameModal visivel={exameAberto} idPet={idPet} nomePet={nomePet} eventos={eventos} onFechar={() => setExameAberto(false)} />
    </View>
  );
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    card: { marginBottom: 22, padding: 18, borderRadius: 24, backgroundColor: page.card, borderWidth: 1, borderColor: page.border, shadowColor: '#10271c', shadowOpacity: theme.mode === 'dark' ? 0 : 0.07, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
    topo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    titulo: { color: page.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 },
    descricao: { color: page.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 10 },
    acoes: { flexDirection: 'row', gap: 10, marginTop: 17 },
    acao: { flex: 1, minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, backgroundColor: theme.colors.primary },
    acaoTexto: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
    carregando: { marginVertical: 22 },
    vazio: { color: page.textSecondary, fontSize: 13, textAlign: 'center', marginTop: 16 },
    lista: { marginTop: 22, paddingTop: 16, borderTopWidth: 1, borderTopColor: page.border },
    subtitulo: { color: page.text, fontSize: 12, fontWeight: '900', letterSpacing: 0.55, textTransform: 'uppercase', marginBottom: 12 },
    remover: { alignSelf: 'flex-start', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    removerTexto: { color: theme.colors.danger, fontSize: 13, fontWeight: '700' },
    mais: { color: page.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 2 },
  });
}
