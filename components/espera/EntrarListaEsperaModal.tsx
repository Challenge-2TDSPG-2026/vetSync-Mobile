import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useEntrarListaEspera } from '../../hooks/useListaEspera';
import { mostrarToast } from '../ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { adicionarDias, validarJanelaEspera } from '../../utils/listaEspera';
import type { AppTheme } from '../../constants/theme';

export interface AlvoListaEspera {
  idPet: string;
  nomePet?: string;
  idServico: number;
  nomeServico: string;
  idVeterinario?: number | null;
  idProfissionalEstetica?: number | null;
}

interface Props {
  alvo: AlvoListaEspera | null;
  onFechar: () => void;
  onEntrou?: () => void;
}

/** Casca do modal: o conteúdo só existe com um alvo, então o formulário nasce limpo a cada abertura. */
export function EntrarListaEsperaModal({ alvo, onFechar, onEntrou }: Props) {
  return (
    <Modal visible={alvo !== null} transparent animationType="fade" onRequestClose={onFechar}>
      {alvo ? <ConteudoListaEspera alvo={alvo} onFechar={onFechar} onEntrou={onEntrou} /> : null}
    </Modal>
  );
}

function ConteudoListaEspera({ alvo, onFechar, onEntrou }: Props & { alvo: AlvoListaEspera }) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const entrar = useEntrarListaEspera();
  const [inicio, setInicio] = useState(() => new Date().toLocaleDateString('sv-SE'));
  const [fim, setFim] = useState(() => adicionarDias(new Date().toLocaleDateString('sv-SE'), 14));
  const [horaMin, setHoraMin] = useState('');
  const [horaMax, setHoraMax] = useState('');
  const [mesmoProfissional, setMesmoProfissional] = useState(true);

  const temProfissional = (alvo.idVeterinario != null || alvo.idProfissionalEstetica != null);
  const erro = validarJanelaEspera({ dataInicio: inicio, dataFim: fim, horaMin, horaMax });

  async function confirmar() {
    if (erro) return;
    try {
      await entrar.mutateAsync({
        idPet: alvo.idPet,
        idServico: alvo.idServico,
        dataInicio: inicio,
        dataFim: fim,
        horaMin: horaMin.trim() || undefined,
        horaMax: horaMax.trim() || undefined,
        idVeterinario: mesmoProfissional ? alvo.idVeterinario ?? null : null,
        idProfissionalEstetica: mesmoProfissional ? alvo.idProfissionalEstetica ?? null : null,
      });
      mostrarToast('sucesso', 'Você está na lista de espera', 'Avisaremos assim que surgir uma vaga.');
      onEntrou?.();
      onFechar();
    } catch (e) {
      mostrarToast('erro', 'Não foi possível entrar na lista', mensagemDeErro(e, 'Tente novamente.'));
    }
  }

  return (
    <>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.card} accessibilityViewIsModal>
          <Text style={s.titulo} accessibilityRole="header">Avise-me quando surgir uma vaga</Text>
          <Text style={s.sub}>{alvo.nomeServico}{alvo.nomePet ? ` · ${alvo.nomePet}` : ''}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.rotulo}>Período desejado</Text>
            <View style={s.linha}>
              <TextInput style={[s.input, s.metade]} value={inicio} onChangeText={setInicio} placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.colors.placeholder} keyboardType="numbers-and-punctuation" accessibilityLabel="Data inicial" />
              <TextInput style={[s.input, s.metade]} value={fim} onChangeText={setFim} placeholder="AAAA-MM-DD"
                placeholderTextColor={theme.colors.placeholder} keyboardType="numbers-and-punctuation" accessibilityLabel="Data final" />
            </View>

            <Text style={s.rotulo}>Faixa de horário (opcional)</Text>
            <View style={s.linha}>
              <TextInput style={[s.input, s.metade]} value={horaMin} onChangeText={setHoraMin} placeholder="De 08:00"
                placeholderTextColor={theme.colors.placeholder} keyboardType="numbers-and-punctuation" maxLength={5} accessibilityLabel="Horário mínimo" />
              <TextInput style={[s.input, s.metade]} value={horaMax} onChangeText={setHoraMax} placeholder="Até 18:00"
                placeholderTextColor={theme.colors.placeholder} keyboardType="numbers-and-punctuation" maxLength={5} accessibilityLabel="Horário máximo" />
            </View>

            {temProfissional && (
              <Pressable
                onPress={() => setMesmoProfissional(v => !v)}
                style={s.opcao}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: mesmoProfissional }}
                accessibilityLabel="Só com o mesmo profissional"
              >
                <View style={[s.caixa, mesmoProfissional && s.caixaAtiva]} />
                <Text style={s.opcaoTexto}>Só com o mesmo profissional</Text>
              </Pressable>
            )}

            {erro ? <Text style={s.erro} accessibilityRole="alert">{erro}</Text> : null}
          </ScrollView>

          <View style={s.acoes}>
            <Pressable style={s.btnVoltar} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Voltar">
              <Text style={s.btnVoltarTexto}>Voltar</Text>
            </Pressable>
            <Pressable
              style={[s.btnConfirmar, (!!erro || entrar.isPending) && { opacity: 0.5 }]}
              onPress={() => void confirmar()}
              disabled={!!erro || entrar.isPending}
              accessibilityRole="button"
              accessibilityLabel="Entrar na lista de espera"
              accessibilityState={{ disabled: !!erro || entrar.isPending, busy: entrar.isPending }}
            >
              {entrar.isPending
                ? <ActivityIndicator size="small" color={theme.colors.onPrimary} />
                : <Text style={s.btnConfirmarTexto}>Entrar na lista</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: theme.pages.agenda.cardElevated, borderRadius: 16, padding: 22, maxHeight: '88%' },
  titulo: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: 5 },
  sub: { fontSize: 14, color: theme.colors.textSecondary, marginBottom: 6 },
  rotulo: { fontSize: 13, fontWeight: '800', color: theme.colors.text, marginTop: 14, marginBottom: 8 },
  linha: { flexDirection: 'row', gap: 10 },
  metade: { flex: 1 },
  input: {
    backgroundColor: theme.colors.input, borderWidth: 1.5, borderColor: theme.pages.agenda.border,
    borderRadius: 10, padding: 11, fontSize: 15, color: theme.colors.text,
  },
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  caixa: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: theme.colors.primary },
  caixaAtiva: { backgroundColor: theme.colors.primary },
  opcaoTexto: { color: theme.colors.text, fontSize: 14, flex: 1 },
  erro: { color: theme.colors.danger, marginTop: 12, fontSize: 13 },
  acoes: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 },
  btnVoltar: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  btnVoltarTexto: { fontSize: 15, fontWeight: '600', color: theme.colors.textSecondary },
  btnConfirmar: { backgroundColor: theme.colors.primary, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  btnConfirmarTexto: { color: theme.colors.onPrimary, fontSize: 15, fontWeight: '700' },
});