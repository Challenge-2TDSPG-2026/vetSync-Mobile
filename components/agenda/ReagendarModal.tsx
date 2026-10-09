import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useReagendarEvento } from '../../hooks/useEventos';
import { useServicosClinica, useSlotsServico } from '../../hooks/useSlotsServico';
import { mostrarToast } from '../ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { encontrarServicoPorNome } from '../../utils/planoNavegacao';
import { filtrarSlotsDoEvento, proximosDias, rotuloDia } from '../../utils/reagendamento';
import { formatarDataEHora } from '../../utils/solicitacao';
import { dataValida } from '../../utils/listaEspera';
import type { Evento } from '../../types';
import type { AppTheme } from '../../constants/theme';

interface Props {
  evento: Evento | null;
  onFechar: () => void;
  /** Chamado quando não há horário que sirva: o tutor pode pedir aviso de vaga para o mesmo serviço. */
  onAvisarVaga?: (evento: Evento, idServico: number, nomeServico: string) => void;
}

/** Casca do modal: o conteúdo só existe com um evento, então o estado nasce limpo a cada abertura. */
export function ReagendarModal({ evento, onFechar, onAvisarVaga }: Props) {
  return (
    <Modal visible={evento !== null} transparent animationType="fade" onRequestClose={onFechar}>
      {evento ? <ConteudoReagendar evento={evento} onFechar={onFechar} onAvisarVaga={onAvisarVaga} /> : null}
    </Modal>
  );
}

function ConteudoReagendar({ evento, onFechar, onAvisarVaga }: Props & { evento: Evento }) {
  const { theme } = useTheme();
  const { autenticado } = useAuth();
  const s = useMemo(() => createStyles(theme), [theme]);
  const reagendar = useReagendarEvento();
  const dias = useMemo(() => proximosDias(14), []);
  const [data, setData] = useState(dias[0]);
  const [hora, setHora] = useState<string | null>(null);

  const visivel = true;
  const servicos = useServicosClinica(visivel && autenticado);
  const servico = useMemo(() => {
    if (!evento) return null;
    const lista = servicos.data ?? [];
    if (evento.idServicoClinica != null) {
      return lista.find(item => item.id === evento.idServicoClinica) ?? null;
    }
    return encontrarServicoPorNome(lista, evento.nomeTipoEvento);
  }, [evento, servicos.data]);

  const slotsQuery = useSlotsServico(servico?.id ?? null, data, visivel && autenticado);
  const slots = useMemo(
    () => filtrarSlotsDoEvento(slotsQuery.data ?? [], evento, data),
    [slotsQuery.data, evento, data],
  );

  function escolherData(nova: string) {
    setData(nova);
    setHora(null);
  }

  async function confirmar() {
    if (!evento || !hora) return;
    try {
      await reagendar.mutateAsync({ id: evento.id, data, hora });
      mostrarToast('sucesso', 'Horário alterado', `Novo horário: ${formatarDataEHora(data, hora)}.`);
      onFechar();
    } catch (erro) {
      mostrarToast('erro', 'Não foi possível reagendar', mensagemDeErro(erro, 'Esse horário pode ter sido ocupado. Escolha outro.'));
      void slotsQuery.refetch();
      setHora(null);
    }
  }

  const semServico = !servicos.isLoading && !servico;
  const semHorarios = !slotsQuery.isLoading && !slotsQuery.isFetching && !!servico && dataValida(data) && slots.length === 0;

  return (
    <>
      <View style={s.overlay}>
        <View style={s.card} accessibilityViewIsModal>
          <Text style={s.titulo} accessibilityRole="header">Escolher outro horário</Text>
          {evento && (
            <Text style={s.sub}>
              {evento.nomeTipoEvento} · hoje em {formatarDataEHora(evento.data, evento.hora)}
            </Text>
          )}

          <ScrollView style={s.corpo} keyboardShouldPersistTaps="handled">
            <Text style={s.rotulo}>Dia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {dias.map(dia => (
                <Pressable
                  key={dia}
                  onPress={() => escolherData(dia)}
                  style={[s.chip, data === dia && s.chipAtivo]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: data === dia }}
                  accessibilityLabel={`Dia ${rotuloDia(dia)}`}
                >
                  <Text style={[s.chipTexto, data === dia && s.chipTextoAtivo]}>{rotuloDia(dia)}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <TextInput
              value={data}
              onChangeText={escolherData}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={theme.colors.placeholder}
              keyboardType="numbers-and-punctuation"
              style={s.input}
              accessibilityLabel="Outra data"
              accessibilityHint="Use o formato ano, mês e dia"
            />

            <Text style={s.rotulo}>Horário</Text>
            {servicos.isLoading || slotsQuery.isLoading || slotsQuery.isFetching ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : semServico ? (
              <Text style={s.aviso}>Não encontramos esse serviço na agenda online da clínica. Fale com a clínica para trocar o horário.</Text>
            ) : slotsQuery.isError ? (
              <Text style={s.aviso}>Não foi possível consultar os horários. Tente novamente.</Text>
            ) : semHorarios ? (
              <Text style={s.aviso}>Sem horários livres nesse dia com o mesmo profissional.</Text>
            ) : (
              <View style={s.chips}>
                {slots.map(slot => (
                  <Pressable
                    key={`${slot.tipoProfissional}:${slot.idProfissional}:${slot.hora}`}
                    onPress={() => setHora(slot.hora)}
                    style={[s.chip, hora === slot.hora && s.chipAtivo]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: hora === slot.hora }}
                    accessibilityLabel={`Horário ${slot.hora} com ${slot.nomeProfissional}`}
                  >
                    <Text style={[s.chipTexto, hora === slot.hora && s.chipTextoAtivo]}>{slot.hora}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {evento && servico && onAvisarVaga && !slotsQuery.isLoading && (
              <Pressable
                onPress={() => onAvisarVaga(evento, servico.id, servico.nome)}
                accessibilityRole="button"
                accessibilityLabel="Avisar quando surgir uma vaga"
                style={s.linkVaga}
              >
                <Text style={s.linkVagaTexto}>Não achou? Avise-me quando surgir uma vaga</Text>
              </Pressable>
            )}
          </ScrollView>

          <View style={s.acoes}>
            <Pressable style={s.btnVoltar} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Voltar">
              <Text style={s.btnVoltarTexto}>Voltar</Text>
            </Pressable>
            <Pressable
              style={[s.btnConfirmar, (!hora || reagendar.isPending) && { opacity: 0.5 }]}
              onPress={() => void confirmar()}
              disabled={!hora || reagendar.isPending}
              accessibilityRole="button"
              accessibilityLabel="Confirmar novo horário"
              accessibilityState={{ disabled: !hora || reagendar.isPending, busy: reagendar.isPending }}
            >
              {reagendar.isPending
                ? <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                : <Text style={s.btnConfirmarTexto}>Confirmar novo horário</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: theme.pages.agenda.cardElevated, borderRadius: 16, padding: 22, maxHeight: '88%' },
  titulo: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 5 },
  sub: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 12 },
  corpo: { flexGrow: 0 },
  rotulo: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
    borderColor: theme.pages.agenda.border, backgroundColor: theme.colors.input, minWidth: 64, alignItems: 'center',
  },
  chipAtivo: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipTexto: { color: theme.colors.text, fontWeight: '700', fontSize: 14 },
  chipTextoAtivo: { color: theme.colors.onPrimary },
  input: {
    marginTop: 10, backgroundColor: theme.colors.input, borderWidth: 1.5, borderColor: theme.pages.agenda.border,
    borderRadius: 10, padding: 11, fontSize: 15, color: theme.colors.text,
  },
  aviso: { color: theme.colors.textSecondary, lineHeight: 20 },
  linkVaga: { marginTop: 16, paddingVertical: 8 },
  linkVagaTexto: { color: theme.colors.primary, fontWeight: '700', textDecorationLine: 'underline' },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 },
  btnVoltar: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  btnVoltarTexto: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  btnConfirmar: { backgroundColor: theme.colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  btnConfirmarTexto: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '700' },
});