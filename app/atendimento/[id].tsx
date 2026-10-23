import { EmojiFilteredTextInput } from '../../components/ui/EmojiFilteredTextInput';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useVet } from '../../context/VetContext';
import { useAtendimentoVet } from '../../hooks/useAtendimentoVet';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { EmptyState } from '../../components/ui/EmptyState';
import { mostrarToast } from '../../components/ui/Toast';
import { useVetDesktop } from '../../components/vet/desktop/useVetDesktop';
import { confirmar } from '../../utils/alert';
import {
  bytesDisponiveisParaNotas,
  bytesUtf8,
  cortarEmBytes,
  formatarDuracao,
  formatarHora,
  montarObservacao,
} from '../../utils/atendimentoVet';
import type { AppTheme } from '../../constants/theme';

export default function AtendimentoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const desktop = useVetDesktop();
  const s = useMemo(() => createStyles(theme, desktop), [theme, desktop]);
  const { sessao } = useAuth();
  const { veterinarioAtivo, eventosAgendados, pacientes, concluirEvento, carregando } = useVet();
  const { atendimento, carregado, salvarNotas, encerrar } = useAtendimentoVet();
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [agora, setAgora] = useState(() => new Date().getTime());

  useEffect(() => {
    const intervalo = setInterval(() => setAgora(new Date().getTime()), 1000);
    return () => clearInterval(intervalo);
  }, []);

  const eventoId = String(id ?? '');
  const evento = eventosAgendados.find(e => String(e.id) === eventoId);
  const pacienteInfo = pacientes.find(p => String(p.pet.id) === String(evento?.petId));
  const pet = pacienteInfo?.pet;
  const tutorNome = pet?.tutor?.nome;
  const nomeVet = veterinarioAtivo?.nome ?? sessao?.nome ?? 'Veterinário';
  const emAndamento = atendimento && atendimento.eventoId === eventoId ? atendimento : null;
  const inicio = emAndamento ? new Date(emAndamento.inicioISO) : null;

  const limiteNotas = inicio
    ? bytesDisponiveisParaNotas({ clinica: veterinarioAtivo?.nomeClinica, veterinario: nomeVet, inicio })
    : 0;
  const usados = emAndamento ? bytesUtf8(emAndamento.notas) : 0;
  const restantes = Math.max(0, limiteNotas - usados);

  function aoEditar(texto: string) {
    salvarNotas(cortarEmBytes(texto, limiteNotas));
  }

  function pedirConclusao() {
    confirmar(
      'Concluir atendimento?',
      `Suas anotações serão adicionadas ao prontuário clínico de ${pet?.nome ?? 'o paciente'} e o tutor poderá vê-las. Depois de concluído, não dá para editar.`,
      [
        { texto: 'Continuar escrevendo', estilo: 'cancel' },
        { texto: 'Concluir', aoConfirmar: () => void concluir() },
      ],
    );
  }

  async function concluir() {
    if (!evento || !emAndamento || !inicio) return;
    setConcluindo(true);
    setErro(null);
    try {
      const observacao = montarObservacao(
        { clinica: veterinarioAtivo?.nomeClinica, veterinario: nomeVet, inicio, fim: new Date() },
        emAndamento.notas,
      );
      await concluirEvento(String(evento.id), observacao);
      await encerrar();
      mostrarToast('sucesso', 'Atendimento concluído', `O prontuário clínico de ${pet?.nome ?? 'o paciente'} foi atualizado.`);
      router.replace('/(vet)');
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não foi possível concluir o atendimento. Suas anotações continuam salvas.'));
      setConcluindo(false);
    }
  }

  function pedirDescarte() {
    confirmar('Descartar atendimento?', 'As anotações serão apagadas e nada será adicionado ao prontuário clínico do pet.', [
      { texto: 'Voltar', estilo: 'cancel' },
      {
        texto: 'Descartar',
        estilo: 'destructive',
        aoConfirmar: () => {
          void encerrar().then(() => router.replace('/(vet)'));
        },
      },
    ]);
  }

  const opcoesTela = <Stack.Screen options={{ headerShown: true, title: 'Atendimento' }} />;

  if (carregando || !carregado) {
    return (
      <View style={s.centro}>
        {opcoesTela}
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!evento || !emAndamento || !inicio) {
    return (
      <View style={s.centro}>
        {opcoesTela}
        <EmptyState
          icon="document-text-outline"
          title="Atendimento não encontrado"
          subtitle="Este atendimento não está em andamento. Volte para o painel e inicie pelo próximo atendimento."
          accentColor={theme.colors.primary}
          variant="plain"
        />
        <Pressable style={s.btnPrimario} onPress={() => router.replace('/(vet)')} accessibilityRole="button">
          <Text style={s.btnPrimarioTexto}>Voltar ao painel</Text>
        </Pressable>
      </View>
    );
  }

  const resumo = (
    <View style={s.resumo}>
      <Text style={s.resumoEyebrow}>EM ATENDIMENTO • DESDE {formatarHora(inicio)}</Text>
      <View style={s.resumoLinha}>
        <View style={s.resumoInfo}>
          <Text style={s.resumoPet} numberOfLines={1}>{pet?.nome ?? 'Paciente'}</Text>
          <Text style={s.resumoDetalhe} numberOfLines={2}>
            {evento.nomeTipoEvento}{tutorNome ? ` • ${tutorNome}` : ''}
          </Text>
        </View>
        <View style={s.timer}>
          <Ionicons name="time-outline" size={15} color={theme.colors.brandAccent} />
          <Text style={s.timerTexto}>{formatarDuracao(agora - inicio.getTime())}</Text>
        </View>
      </View>
    </View>
  );

  const aviso = (
    <View style={s.aviso}>
      <Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
      <Text style={s.avisoTexto}>
        Tudo o que você escrever será adicionado ao prontuário clínico de {pet?.nome ?? 'o paciente'} ao concluir. O tutor poderá ver.
      </Text>
    </View>
  );

  const notas = (
    <View style={s.notas}>
      <Text style={s.label}>Bloco de notas</Text>
      <EmojiFilteredTextInput
        style={s.input}
        value={emAndamento.notas}
        onChangeText={aoEditar}
        multiline
        textAlignVertical="top"
        placeholder="Queixa, exame físico, procedimentos, orientações…"
        placeholderTextColor={theme.colors.textMuted}
        editable={!concluindo}
        accessibilityLabel="Bloco de notas do atendimento"
      />
      <Text style={[s.contador, restantes < 60 && s.contadorAlerta]} accessibilityLiveRegion="polite">
        {restantes} caracteres restantes
      </Text>
    </View>
  );

  const acoes = (
    <View>
      {erro ? <Text style={s.erro} accessibilityRole="alert">{erro}</Text> : null}
      <Pressable
        style={({ pressed }) => [s.btnPrimario, (concluindo || pressed) && s.pressed]}
        onPress={pedirConclusao}
        disabled={concluindo}
        accessibilityRole="button"
        accessibilityLabel="Concluir atendimento"
      >
        {concluindo ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.onPrimary} />
            <Text style={s.btnPrimarioTexto}>Concluir atendimento</Text>
          </>
        )}
      </Pressable>
      <Pressable style={s.btnDescartar} onPress={pedirDescarte} disabled={concluindo} accessibilityRole="button">
        <Text style={s.btnDescartarTexto}>Descartar atendimento</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {opcoesTela}
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {desktop ? (
          <View style={s.colunas}>
            <View style={s.colNotas}>{notas}</View>
            <View style={s.colLateral}>
              {resumo}
              {aviso}
              {acoes}
            </View>
          </View>
        ) : (
          <>
            {resumo}
            {aviso}
            {notas}
            {acoes}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: AppTheme, desktop: boolean) => {
  const page = theme.pages.vetDashboard;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centro: { flex: 1, backgroundColor: theme.colors.background, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
    content: desktop
      ? { padding: 32, paddingBottom: 48, width: '100%', maxWidth: 1120, alignSelf: 'center' }
      : { padding: 20, paddingBottom: 40 },
    colunas: { flexDirection: 'row', gap: 28, alignItems: 'flex-start' },
    colNotas: { flex: 1 },
    colLateral: { width: 340 },
    notas: {},

    resumo: { backgroundColor: page.heroBackground, borderRadius: 20, padding: 18 },
    resumoEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: theme.colors.brandAccent },
    resumoLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    resumoInfo: { flex: 1 },
    resumoPet: { fontSize: 20, fontWeight: '800', color: page.heroText },
    resumoDetalhe: { fontSize: 12, color: page.heroText, opacity: 0.82, marginTop: 3, lineHeight: 17 },
    timer: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
    timerTexto: { fontSize: 14, fontWeight: '800', color: page.heroText },

    aviso: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: theme.colors.infoBackground, borderRadius: 14, padding: 12, marginTop: 14 },
    avisoTexto: { flex: 1, fontSize: 12, lineHeight: 17, color: theme.colors.text },

    label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginTop: desktop ? 0 : 20, marginBottom: 8, paddingLeft: 2 },
    input: { minHeight: desktop ? 440 : 240, backgroundColor: page.card, borderWidth: 1, borderColor: page.border, borderRadius: 16, padding: 14, fontSize: 15, lineHeight: 22, color: theme.colors.text },
    contador: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'right', marginTop: 6, paddingRight: 2 },
    contadorAlerta: { color: theme.colors.danger, fontWeight: '700' },
    erro: { fontSize: 13, color: theme.colors.danger, marginTop: 12 },

    btnPrimario: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.primary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 24, marginTop: 18, minHeight: 50 },
    btnPrimarioTexto: { fontSize: 15, fontWeight: '800', color: theme.colors.onPrimary },
    btnDescartar: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
    btnDescartarTexto: { fontSize: 14, fontWeight: '700', color: theme.colors.danger },
    pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  });
};
