import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';
import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useVet } from '../../context/VetContext';
import { AppIcon } from '../../components/AppIcon';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../../components/ui/Toast';
import { DicaTela } from '../../components/ui/DicaTela';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';

// Convenção do Java: 1=segunda ... 7=domingo (não é a mesma do Date.getDay() do JS)
const DIAS_SEMANA = [
  { valor: 1, label: 'Segunda' }, { valor: 2, label: 'Terça' }, { valor: 3, label: 'Quarta' },
  { valor: 4, label: 'Quinta' }, { valor: 5, label: 'Sexta' }, { valor: 6, label: 'Sábado' }, { valor: 7, label: 'Domingo' },
];

function formatarDataBR(text: string): string {
  const n = text.replace(/\D/g, '');
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4, 8)}`;
}

function formatarHora(text: string): string {
  const n = text.replace(/\D/g, '');
  if (n.length <= 2) return n;
  return `${n.slice(0, 2)}:${n.slice(2, 4)}`;
}

function paraIso(dataBr: string): string {
  const [dd, mm, aaaa] = dataBr.split('/');
  return `${aaaa}-${mm}-${dd}`;
}

export default function DisponibilidadeScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const {
    disponibilidade, adicionarFaixaDisponibilidade, removerFaixaDisponibilidade,
    bloqueios, adicionarBloqueio, removerBloqueio, carregando,
  } = useVet();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-disponibilidade');

  const [diaSelecionado, setDiaSelecionado] = useState(1);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [salvandoFaixa, setSalvandoFaixa] = useState(false);

  const [dataInicioBloqueio, setDataInicioBloqueio] = useState('');
  const [dataFimBloqueio, setDataFimBloqueio] = useState('');
  const [motivoBloqueio, setMotivoBloqueio] = useState('');
  const [salvandoBloqueio, setSalvandoBloqueio] = useState(false);

  async function handleAdicionarFaixa() {
    if (horaInicio.length !== 5 || horaFim.length !== 5) {
      mostrarToast('erro', 'Horário inválido', 'Informe início e fim no formato HH:mm.');
      return;
    }
    if (horaInicio >= horaFim) {
      mostrarToast('erro', 'Horário inválido', 'O horário de início deve ser antes do horário de fim.');
      return;
    }
    setSalvandoFaixa(true);
    try {
      await adicionarFaixaDisponibilidade({ diaSemana: diaSelecionado, horaInicio, horaFim });
      setHoraInicio('');
      setHoraFim('');
      mostrarToast('sucesso', 'Horário adicionado');
    } catch {
      mostrarToast('erro', 'Não foi possível adicionar', 'Tente novamente em instantes.');
    } finally {
      setSalvandoFaixa(false);
    }
  }

  function handleRemoverFaixa(id: string) {
    confirmar('Remover horário?', 'Esse horário fixo de atendimento será removido.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      { texto: 'Remover', estilo: 'destructive', aoConfirmar: () => removerFaixaDisponibilidade(id) },
    ]);
  }

  async function handleAdicionarBloqueio() {
    if (dataInicioBloqueio.length < 10 || dataFimBloqueio.length < 10) {
      mostrarToast('erro', 'Data inválida', 'Informe início e fim no formato DD/MM/AAAA.');
      return;
    }
    setSalvandoBloqueio(true);
    try {
      await adicionarBloqueio({
        dataInicio: paraIso(dataInicioBloqueio),
        dataFim: paraIso(dataFimBloqueio),
        motivo: motivoBloqueio.trim() || undefined,
      });
      setDataInicioBloqueio('');
      setDataFimBloqueio('');
      setMotivoBloqueio('');
      mostrarToast('sucesso', 'Bloqueio adicionado');
    } catch {
      mostrarToast('erro', 'Não foi possível adicionar', 'Verifique se a data de fim é igual ou posterior à de início.');
    } finally {
      setSalvandoBloqueio(false);
    }
  }

  function handleRemoverBloqueio(id: string) {
    confirmar('Remover bloqueio?', 'Esse período voltará a ficar disponível na sua agenda.', [
      { texto: 'Cancelar', estilo: 'cancel' },
      { texto: 'Remover', estilo: 'destructive', aoConfirmar: () => removerBloqueio(id) },
    ]);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      {dicaVisivel && (
        <DicaTela
          titulo="Sua disponibilidade"
          texto="Defina abaixo os horários fixos que você atende em cada dia da semana, e use a seção de bloqueios pra marcar férias ou folgas."
          accentColor={theme.pages.vetAvailability.primary}
          onFechar={fecharDica}
        />
      )}

      <Text style={s.secLabel}>Horários fixos de atendimento</Text>
      <View style={s.card}>
        <View style={s.diasRow}>
          {DIAS_SEMANA.map(d => (
            <Pressable
              key={d.valor}
              style={[s.diaBtn, diaSelecionado === d.valor && s.diaBtnAtivo]}
              onPress={() => setDiaSelecionado(d.valor)}
            >
              <Text style={[s.diaBtnText, diaSelecionado === d.valor && s.diaBtnTextAtivo]}>{d.label.slice(0, 3)}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.horaRow}>
          <TextInput
            style={s.horaInput}
            value={horaInicio}
            onChangeText={v => setHoraInicio(formatarHora(v))}
            placeholder="08:00"
            placeholderTextColor={theme.pages.vetAvailability.textSecondary}
            keyboardType="numeric"
            maxLength={5}
          />
          <Text style={s.horaSep}>até</Text>
          <TextInput
            style={s.horaInput}
            value={horaFim}
            onChangeText={v => setHoraFim(formatarHora(v))}
            placeholder="18:00"
            placeholderTextColor={theme.pages.vetAvailability.textSecondary}
            keyboardType="numeric"
            maxLength={5}
          />
          <Pressable style={[s.btnAdicionar, salvandoFaixa && { opacity: 0.6 }]} onPress={handleAdicionarFaixa} disabled={salvandoFaixa}>
            {salvandoFaixa ? <ActivityIndicator size="small" color={theme.pages.vetAvailability.white} /> : <AppIcon name="add" set="Ionicons" size={18} color={theme.pages.vetAvailability.white} />}
          </Pressable>
        </View>

        {carregando ? (
          <ActivityIndicator color={theme.pages.vetAvailability.primary} style={{ marginVertical: 12 }} />
        ) : disponibilidade.length === 0 ? (
          <Text style={s.vazioTexto}>Nenhum horário fixo cadastrado ainda.</Text>
        ) : (
          disponibilidade
            .sort((a, b) => a.diaSemana - b.diaSemana || a.horaInicio.localeCompare(b.horaInicio))
            .map(f => (
              <View key={f.id} style={s.faixaRow}>
                <Text style={s.faixaTexto}>
                  {DIAS_SEMANA.find(d => d.valor === f.diaSemana)?.label ?? f.diaSemana} · {f.horaInicio} – {f.horaFim}
                </Text>
                <Pressable onPress={() => handleRemoverFaixa(f.id)} hitSlop={8}>
                  <AppIcon name="trash-outline" set="Ionicons" size={16} color={theme.pages.vetAvailability.danger} />
                </Pressable>
              </View>
            ))
        )}
      </View>

      <Text style={s.secLabel}>Bloqueios de agenda</Text>
      <View style={s.card}>
        <View style={s.dataRow}>
          <TextInput
            style={[s.horaInput, { flex: 1 }]}
            value={dataInicioBloqueio}
            onChangeText={v => setDataInicioBloqueio(formatarDataBR(v))}
            placeholder="Início DD/MM/AAAA"
            placeholderTextColor={theme.pages.vetAvailability.textSecondary}
            keyboardType="numeric"
            maxLength={10}
          />
          <TextInput
            style={[s.horaInput, { flex: 1 }]}
            value={dataFimBloqueio}
            onChangeText={v => setDataFimBloqueio(formatarDataBR(v))}
            placeholder="Fim DD/MM/AAAA"
            placeholderTextColor={theme.pages.vetAvailability.textSecondary}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        <TextInput
          style={s.motivoInput}
          value={motivoBloqueio}
          onChangeText={setMotivoBloqueio}
          placeholder="Motivo (opcional)"
          placeholderTextColor={theme.pages.vetAvailability.textSecondary}
        />
        <Pressable style={[s.btnAdicionarBloqueio, salvandoBloqueio && { opacity: 0.6 }]} onPress={handleAdicionarBloqueio} disabled={salvandoBloqueio}>
          <Text style={s.btnAdicionarBloqueioText}>{salvandoBloqueio ? 'Adicionando...' : 'Adicionar bloqueio'}</Text>
        </Pressable>

        {bloqueios.length === 0 ? (
          <Text style={s.vazioTexto}>Nenhum bloqueio cadastrado.</Text>
        ) : (
          bloqueios.map(b => (
            <View key={b.id} style={s.faixaRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.faixaTexto}>{b.dataInicio} até {b.dataFim}</Text>
                {b.motivo ? <Text style={s.motivoTexto}>{b.motivo}</Text> : null}
              </View>
              <Pressable onPress={() => handleRemoverBloqueio(b.id)} hitSlop={8}>
                <AppIcon name="trash-outline" set="Ionicons" size={16} color={theme.pages.vetAvailability.danger} />
              </Pressable>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.pages.vetAvailability.background },
  content: { padding: 16, paddingBottom: 40 },

  secLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
    color: theme.pages.vetAvailability.textSecondary, marginBottom: 10, marginTop: 4, paddingLeft: 2,
  },
  card: { backgroundColor: theme.pages.vetAvailability.card, borderRadius: 14, borderWidth: 1, borderColor: theme.pages.vetAvailability.border, padding: 16, marginBottom: 20 },

  diasRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  diaBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: theme.pages.vetAvailability.cardSecondary, borderWidth: 1, borderColor: theme.pages.vetAvailability.border },
  diaBtnAtivo: { backgroundColor: theme.pages.vetAvailability.primary, borderColor: theme.pages.vetAvailability.primary },
  diaBtnText: { fontSize: 11, fontWeight: '700', color: theme.pages.vetAvailability.text },
  diaBtnTextAtivo: { color: theme.pages.vetAvailability.white },

  horaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  horaInput: {
    backgroundColor: theme.pages.vetAvailability.cardSecondary, borderWidth: 1.5, borderColor: theme.pages.vetAvailability.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: theme.pages.vetAvailability.text, textAlign: 'center', minWidth: 70,
  },
  horaSep: { fontSize: 12, color: theme.pages.vetAvailability.textSecondary },
  btnAdicionar: { backgroundColor: theme.pages.vetAvailability.primary, width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  vazioTexto: { fontSize: 12, color: theme.pages.vetAvailability.textSecondary, fontStyle: 'italic', paddingVertical: 6 },

  faixaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.pages.vetAvailability.border,
  },
  faixaTexto: { fontSize: 13, color: theme.pages.vetAvailability.text, fontWeight: '600' },
  motivoTexto: { fontSize: 11, color: theme.pages.vetAvailability.textSecondary, marginTop: 2 },

  dataRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  motivoInput: {
    backgroundColor: theme.pages.vetAvailability.cardSecondary, borderWidth: 1.5, borderColor: theme.pages.vetAvailability.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: theme.pages.vetAvailability.text, marginBottom: 10,
  },
  btnAdicionarBloqueio: { backgroundColor: theme.pages.vetAvailability.primary, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 4 },
  btnAdicionarBloqueioText: { color: theme.pages.vetAvailability.white, fontSize: 13, fontWeight: '700' },
});
