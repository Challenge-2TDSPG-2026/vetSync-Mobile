import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useVet } from '../../context/VetContext';
import { AppIcon } from '../../components/AppIcon';
import { confirmar } from '../../utils/alert';
import { mostrarToast } from '../../components/ui/Toast';

const C = {
  g800: '#0e3326', g600: '#1a7a52', g100: '#d4f2e4',
  cream: '#fafaf8', w50: '#f9f7f4', text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545',
};

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
  const {
    disponibilidade, adicionarFaixaDisponibilidade, removerFaixaDisponibilidade,
    bloqueios, adicionarBloqueio, removerBloqueio, carregando,
  } = useVet();

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
            placeholderTextColor={C.muted}
            keyboardType="numeric"
            maxLength={5}
          />
          <Text style={s.horaSep}>até</Text>
          <TextInput
            style={s.horaInput}
            value={horaFim}
            onChangeText={v => setHoraFim(formatarHora(v))}
            placeholder="18:00"
            placeholderTextColor={C.muted}
            keyboardType="numeric"
            maxLength={5}
          />
          <Pressable style={[s.btnAdicionar, salvandoFaixa && { opacity: 0.6 }]} onPress={handleAdicionarFaixa} disabled={salvandoFaixa}>
            {salvandoFaixa ? <ActivityIndicator size="small" color={C.white} /> : <AppIcon name="add" set="Ionicons" size={18} color={C.white} />}
          </Pressable>
        </View>

        {carregando ? (
          <ActivityIndicator color={C.g600} style={{ marginVertical: 12 }} />
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
                  <AppIcon name="trash-outline" set="Ionicons" size={16} color={C.danger} />
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
            placeholderTextColor={C.muted}
            keyboardType="numeric"
            maxLength={10}
          />
          <TextInput
            style={[s.horaInput, { flex: 1 }]}
            value={dataFimBloqueio}
            onChangeText={v => setDataFimBloqueio(formatarDataBR(v))}
            placeholder="Fim DD/MM/AAAA"
            placeholderTextColor={C.muted}
            keyboardType="numeric"
            maxLength={10}
          />
        </View>
        <TextInput
          style={s.motivoInput}
          value={motivoBloqueio}
          onChangeText={setMotivoBloqueio}
          placeholder="Motivo (opcional)"
          placeholderTextColor={C.muted}
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
                <AppIcon name="trash-outline" set="Ionicons" size={16} color={C.danger} />
              </Pressable>
            </View>
          ))
        )}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 40 },

  secLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
    color: C.muted, marginBottom: 10, marginTop: 4, paddingLeft: 2,
  },
  card: { backgroundColor: C.white, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 20 },

  diasRow: { flexDirection: 'row', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  diaBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: C.w50, borderWidth: 1, borderColor: C.border },
  diaBtnAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  diaBtnText: { fontSize: 11, fontWeight: '700', color: C.text },
  diaBtnTextAtivo: { color: C.white },

  horaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  horaInput: {
    backgroundColor: C.w50, borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text, textAlign: 'center', minWidth: 70,
  },
  horaSep: { fontSize: 12, color: C.muted },
  btnAdicionar: { backgroundColor: C.g600, width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },

  vazioTexto: { fontSize: 12, color: C.muted, fontStyle: 'italic', paddingVertical: 6 },

  faixaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border,
  },
  faixaTexto: { fontSize: 13, color: C.text, fontWeight: '600' },
  motivoTexto: { fontSize: 11, color: C.muted, marginTop: 2 },

  dataRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  motivoInput: {
    backgroundColor: C.w50, borderWidth: 1.5, borderColor: C.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, color: C.text, marginBottom: 10,
  },
  btnAdicionarBloqueio: { backgroundColor: C.g600, paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginBottom: 4 },
  btnAdicionarBloqueioText: { color: C.white, fontSize: 13, fontWeight: '700' },
});