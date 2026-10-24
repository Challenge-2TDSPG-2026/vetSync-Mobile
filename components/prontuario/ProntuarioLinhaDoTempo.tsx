import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { withAlpha, type AppTheme } from '../../constants/theme';
import type { ExameProntuario } from '../../services/prontuarioService';
import { ehProntuarioAnterior, formatarDataProntuario, tituloProntuarioAnterior, type ItemProntuario } from '../../utils/prontuario';

interface ProntuarioLinhaDoTempoProps {
  itens: ItemProntuario[];
  /** Quando informado, exames com arquivo mostram o botão para baixar o laudo. */
  onBaixarLaudo?: (exame: ExameProntuario) => void;
  baixandoExameId?: string | null;
  /** Ações extras por item (ex.: remover), usadas na visão do veterinário. */
  renderAcoes?: (item: ItemProntuario) => React.ReactNode;
}

type IconeNome = React.ComponentProps<typeof Ionicons>['name'];

function visualDoTipo(item: ItemProntuario, theme: AppTheme): { icone: IconeNome; cor: string; rotulo: string } {
  if (item.tipo === 'EXAME' && ehProntuarioAnterior(item.exame)) {
    return { icone: 'folder-open-outline', cor: theme.colors.brandAccent, rotulo: 'Prontuário anterior' };
  }
  switch (item.tipo) {
    case 'ATENDIMENTO': return { icone: 'medkit-outline', cor: theme.colors.primary, rotulo: 'Atendimento' };
    case 'ORIENTACAO': return { icone: 'chatbubble-ellipses-outline', cor: theme.colors.info, rotulo: 'Orientação' };
    case 'RECEITA': return { icone: 'document-text-outline', cor: theme.colors.warning, rotulo: 'Receita' };
    default: return { icone: 'flask-outline', cor: theme.colors.success, rotulo: 'Exame' };
  }
}

export function ProntuarioLinhaDoTempo({ itens, onBaixarLaudo, baixandoExameId, renderAcoes }: ProntuarioLinhaDoTempoProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      {itens.map(item => {
        const visual = visualDoTipo(item, theme);
        const anterior = item.tipo === 'EXAME' && ehProntuarioAnterior(item.exame);
        const acoes = renderAcoes?.(item);
        return (
          <View key={`${item.tipo}-${item.id}`} style={s.card} accessibilityRole="summary">
            <View style={s.topo}>
              <View style={[s.icone, { backgroundColor: withAlpha(visual.cor, theme.mode === 'dark' ? 0.25 : 0.12) }]}>
                <Ionicons name={visual.icone} size={20} color={visual.cor} />
              </View>
              <View style={s.topoTexto}>
                <Text style={[s.tipo, { color: visual.cor }]}>{visual.rotulo.toUpperCase()}</Text>
                <Text style={s.titulo}>{tituloDoItem(item)}</Text>
                <Text style={s.meta}>{metaDoItem(item)}</Text>
              </View>
            </View>
            {corpoDoItem(item, s)}
            {item.tipo === 'EXAME' && item.exame.temArquivo && onBaixarLaudo ? (
              <Pressable
                style={[s.botaoLaudo, baixandoExameId === item.exame.id && s.desabilitado]}
                onPress={() => onBaixarLaudo(item.exame)}
                disabled={baixandoExameId === item.exame.id}
                accessibilityRole="button"
                accessibilityLabel={anterior ? 'Abrir arquivo do prontuário anterior' : `Baixar laudo de ${item.exame.nome}`}
              >
                {baixandoExameId === item.exame.id
                  ? <ActivityIndicator size="small" color={theme.colors.primary} />
                  : <Ionicons name="download-outline" size={18} color={theme.colors.primary} />}
                <Text style={s.botaoLaudoTexto} numberOfLines={1}>
                  {baixandoExameId === item.exame.id ? 'Baixando...' : anterior ? 'Baixar arquivo do prontuário' : 'Baixar laudo'}
                </Text>
              </Pressable>
            ) : null}
            {acoes}
          </View>
        );
      })}
    </View>
  );
}

function tituloDoItem(item: ItemProntuario): string {
  switch (item.tipo) {
    case 'ATENDIMENTO': return item.atendimento.tipo ?? 'Atendimento';
    case 'ORIENTACAO': return item.orientacao.titulo;
    case 'RECEITA': return item.receita.medicamento;
    default: return tituloProntuarioAnterior(item.exame);
  }
}

function metaDoItem(item: ItemProntuario): string {
  const partes: (string | null | undefined)[] = [formatarDataProntuario(item.data)];
  if (item.tipo === 'ATENDIMENTO') {
    partes.push(item.atendimento.hora ? `às ${item.atendimento.hora}` : null, item.atendimento.veterinario);
  } else if (item.tipo === 'ORIENTACAO') {
    partes.push(item.orientacao.autor);
  } else if (item.tipo === 'RECEITA') {
    partes.push(item.receita.dosesPorDia != null ? `${item.receita.dosesPorDia}x ao dia` : null);
  } else {
    partes.push(item.exame.laboratorio, item.exame.veterinario);
  }
  return partes.filter(Boolean).join(' · ');
}

type Estilos = ReturnType<typeof createStyles>;

function Campo({ rotulo, valor, estilos }: { rotulo: string; valor?: string | null; estilos: Estilos }) {
  if (!valor?.trim()) return null;
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoRotulo}>{rotulo}</Text>
      <Text style={estilos.campoValor}>{valor}</Text>
    </View>
  );
}

function corpoDoItem(item: ItemProntuario, s: Estilos): React.ReactNode {
  switch (item.tipo) {
    case 'ATENDIMENTO':
      return (
        <>
          <Campo estilos={s} rotulo="Diagnóstico" valor={item.atendimento.diagnostico} />
          <Campo estilos={s} rotulo="Conduta" valor={item.atendimento.conduta} />
          <Campo estilos={s} rotulo="Observações clínicas" valor={item.atendimento.observacaoClinica} />
        </>
      );
    case 'ORIENTACAO':
      return <Campo estilos={s} rotulo="Orientação" valor={item.orientacao.texto} />;
    case 'RECEITA':
      return (
        <>
          <Campo estilos={s} rotulo="Posologia" valor={item.receita.posologia} />
          <Campo
            estilos={s}
            rotulo="Período"
            valor={`${formatarDataProntuario(item.receita.inicio)}${item.receita.fim ? ` a ${formatarDataProntuario(item.receita.fim)}` : ''}`}
          />
          {item.receita.status !== 'LIBERADO' ? (
            <Campo estilos={s} rotulo="Situação" valor={item.receita.status === 'SOLICITADO' ? 'Aguardando liberação da clínica' : 'Não liberada'} />
          ) : null}
        </>
      );
    default: {
      if (ehProntuarioAnterior(item.exame)) {
        return (
          <>
            <Campo estilos={s} rotulo="Registro da consulta" valor={item.exame.resultado} />
            <Campo estilos={s} rotulo="Observações" valor={item.exame.interpretacao} />
            {!item.exame.resultado && !item.exame.interpretacao && !item.exame.temArquivo ? (
              <Text style={s.campoValor}>Sem detalhes registrados.</Text>
            ) : null}
          </>
        );
      }
      return (
        <>
          <Campo estilos={s} rotulo="Resultado" valor={item.exame.resultado} />
          <Campo estilos={s} rotulo="Interpretação" valor={item.exame.interpretacao} />
          {!item.exame.resultado && !item.exame.interpretacao && !item.exame.temArquivo ? (
            <Text style={s.campoValor}>Sem detalhes registrados.</Text>
          ) : null}
        </>
      );
    }
  }
}

function createStyles(theme: AppTheme) {
  const page = theme.pages.shared;
  return StyleSheet.create({
    card: { marginBottom: 13, padding: 17, borderRadius: 21, backgroundColor: page.card, borderWidth: 1, borderColor: page.border, shadowColor: '#10271c', shadowOpacity: theme.mode === 'dark' ? 0 : 0.055, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 1 },
    topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    icone: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    topoTexto: { flex: 1, minWidth: 0 },
    tipo: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    titulo: { color: page.text, fontSize: 16, fontWeight: '900', marginTop: 2, letterSpacing: -0.2 },
    meta: { color: page.textSecondary, fontSize: 12, marginTop: 4 },
    campo: { marginTop: 14, paddingTop: 11, borderTopWidth: 1, borderTopColor: page.border },
    campoRotulo: { color: page.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 3 },
    campoValor: { color: page.text, fontSize: 14, lineHeight: 20 },
    botaoLaudo: { marginTop: 14, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, borderColor: withAlpha(theme.colors.primary, 0.35), backgroundColor: withAlpha(theme.colors.primary, theme.mode === 'dark' ? 0.12 : 0.045) },
    botaoLaudoTexto: { color: theme.colors.primary, fontSize: 13, fontWeight: '800' },
    desabilitado: { opacity: 0.6 },
  });
}
