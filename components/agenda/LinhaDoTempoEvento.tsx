import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import type { EventoHistoricoItem } from '../../services/eventoService';
import { formatarDataEHora, rotuloAcaoHistorico } from '../../utils/solicitacao';
import type { AppTheme } from '../../constants/theme';

interface Props {
  itens: EventoHistoricoItem[] | undefined;
  carregando?: boolean;
}

function detalhe(item: EventoHistoricoItem): string | null {
  if (item.acao === 'REAGENDAMENTO' && item.dataAnterior && item.dataNova) {
    return `De ${formatarDataEHora(item.dataAnterior, item.horaAnterior)} para ${formatarDataEHora(item.dataNova, item.horaNova)}`;
  }
  if (item.acao === 'CANCELAMENTO' && item.observacaoNova) return `Motivo: ${item.observacaoNova}`;
  return null;
}

/** Linha do tempo da solicitação: enviada → confirmada → horário alterado → cancelada/realizada. */
export function LinhaDoTempoEvento({ itens, carregando }: Props) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  if (carregando) return <ActivityIndicator color={theme.colors.primary} />;
  if (!itens?.length) return null;

  const ordenados = [...itens].sort((a, b) => new Date(a.ocorridoEm).getTime() - new Date(b.ocorridoEm).getTime());

  return (
    <View accessibilityRole="list">
      {ordenados.map((item, indice) => {
        const extra = detalhe(item);
        const ultimo = indice === ordenados.length - 1;
        return (
          <View key={item.id} style={s.linha} accessible accessibilityLabel={`${rotuloAcaoHistorico(item.acao)}. ${extra ?? ''}`}>
            <View style={s.trilho}>
              <View style={[s.ponto, ultimo && s.pontoAtual]}>
                <Ionicons name={ultimo ? 'radio-button-on' : 'ellipse'} size={ultimo ? 14 : 8} color={theme.colors.primary} />
              </View>
              {!ultimo && <View style={s.fio} />}
            </View>
            <View style={s.texto}>
              <Text style={s.titulo}>{rotuloAcaoHistorico(item.acao)}</Text>
              {extra ? <Text style={s.detalhe}>{extra}</Text> : null}
              <Text style={s.meta}>
                {new Date(item.ocorridoEm).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {item.ator ? ` · ${item.ator}` : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  linha: { flexDirection: 'row', gap: 12 },
  trilho: { width: 16, alignItems: 'center' },
  ponto: { height: 16, justifyContent: 'center' },
  pontoAtual: {},
  fio: { flex: 1, width: 2, backgroundColor: theme.pages.eventDetails.border, marginVertical: 2 },
  texto: { flex: 1, paddingBottom: 14 },
  titulo: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  detalhe: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 },
  meta: { color: theme.colors.textMuted, fontSize: 11, marginTop: 3 },
});