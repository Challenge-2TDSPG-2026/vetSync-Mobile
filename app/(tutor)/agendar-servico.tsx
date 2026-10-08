import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { usePet } from '../../context/PetContext';
import { useTheme } from '../../context/ThemeContext';
import { clinicaService, type ServicoClinica, type SlotClinica } from '../../services/clinicaService';
import { mostrarToast } from '../../components/ui/Toast';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { encontrarServicoPorNome } from '../../utils/planoNavegacao';

export default function AgendarServicoScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string; servico?: string }>();
  const queryClient = useQueryClient();
  const { pets, petAtivo } = usePet();
  const [servicos, setServicos] = useState<ServicoClinica[]>([]);
  const [servico, setServico] = useState<ServicoClinica | null>(null);
  const [idPet, setIdPet] = useState<string | null>(params.petId ?? petAtivo?.id ?? null);
  const [data, setData] = useState(new Date().toLocaleDateString('sv-SE'));
  const [slots, setSlots] = useState<SlotClinica[]>([]);
  const [slot, setSlot] = useState<SlotClinica | null>(null);
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [carregandoSlots, setCarregandoSlots] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    clinicaService.listarServicos().then(lista => { setServicos(lista); setServico(encontrarServicoPorNome(lista, params.servico) ?? lista[0] ?? null); })
      .catch(e => mostrarToast('erro', 'Serviços indisponíveis', mensagemDeErro(e, 'Tente novamente.')))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => { if (!idPet && pets.length) setIdPet(pets[0].id); }, [pets, idPet]);

  useEffect(() => {
    setSlot(null); setSlots([]);
    if (!servico || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return;
    let valido = true; setCarregandoSlots(true);
    clinicaService.listarSlots(servico.id, data).then(lista => { if (valido) setSlots(lista); })
      .catch(e => { if (valido) mostrarToast('erro', 'Não foi possível consultar os horários', mensagemDeErro(e, 'Tente novamente.')); })
      .finally(() => { if (valido) setCarregandoSlots(false); });
    return () => { valido = false; };
  }, [servico?.id, data]);

  async function confirmar() {
    if (!servico || !slot || !idPet) return;
    setSalvando(true);
    try {
      await clinicaService.agendar(servico.id, Number(idPet), slot, data, observacao.trim());
      await queryClient.invalidateQueries({ queryKey: ['eventos'] });
      mostrarToast('sucesso', 'Agendamento criado', `${servico.nome} em ${data} às ${slot.hora}.`);
      router.replace('/(tutor)/(tabs)/agenda');
    } catch (e) { mostrarToast('erro', 'Não foi possível agendar', mensagemDeErro(e, 'Tente novamente.')); }
    finally { setSalvando(false); }
  }

  const card = { backgroundColor: theme.colors.input, borderColor: theme.colors.textMuted };
  return <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()} style={s.voltar}><Text style={{ color: theme.colors.primary }}>‹ Voltar</Text></Pressable>
      <Text style={[s.title, { color: theme.colors.text }]}>Agendar na clínica</Text>
      <Text style={[s.subtitle, { color: theme.colors.textSecondary }]}>Escolha um serviço, seu pet e um horário disponível.</Text>
      {carregando ? <ActivityIndicator color={theme.colors.primary} /> : <>
        <Text style={[s.heading, { color: theme.colors.text }]}>Serviço</Text>
        {servicos.length ? <View style={s.wrap}>{servicos.map(item => <Pressable key={item.id}
          onPress={() => setServico(item)} style={[s.chip, card, servico?.id === item.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
          <Text style={{ color: servico?.id === item.id ? theme.colors.onPrimary : theme.colors.text }}>{item.nome}</Text>
          <Text style={{ color: servico?.id === item.id ? theme.colors.onPrimary : theme.colors.textSecondary, fontSize: 12 }}>{item.duracaoMinutos} min</Text>
        </Pressable>)}</View> : <Text style={{ color: theme.colors.textSecondary }}>Esta clínica ainda não disponibilizou serviços para agendamento.</Text>}

        <Text style={[s.heading, { color: theme.colors.text }]}>Pet</Text>
        <View style={s.wrap}>{pets.map(pet => <Pressable key={pet.id} onPress={() => setIdPet(pet.id)}
          style={[s.chip, card, idPet === pet.id && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
          <Text style={{ color: idPet === pet.id ? theme.colors.onPrimary : theme.colors.text }}>{pet.nome}</Text>
        </Pressable>)}</View>

        <Text style={[s.heading, { color: theme.colors.text }]}>Data</Text>
        <TextInput value={data} onChangeText={setData} placeholder="AAAA-MM-DD" placeholderTextColor={theme.colors.placeholder}
          keyboardType="numbers-and-punctuation" style={[s.input, card, { color: theme.colors.text }]} />
        <Text style={[s.help, { color: theme.colors.textSecondary }]}>Use o formato AAAA-MM-DD.</Text>

        <Text style={[s.heading, { color: theme.colors.text }]}>Horário e profissional</Text>
        {carregandoSlots ? <ActivityIndicator color={theme.colors.primary} /> : slots.length ?
          <View style={s.wrap}>{slots.map(item => <Pressable key={`${item.tipoProfissional}:${item.idProfissional}:${item.hora}`}
            onPress={() => setSlot(item)} style={[s.chip, card, slot === item && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
            <Text style={{ color: slot === item ? theme.colors.onPrimary : theme.colors.text }}>{item.hora}</Text>
            <Text style={{ color: slot === item ? theme.colors.onPrimary : theme.colors.textSecondary, fontSize: 12 }}>{item.nomeProfissional}</Text>
          </Pressable>)}</View> : <Text style={{ color: theme.colors.textSecondary }}>Sem horários disponíveis nesta data.</Text>}

        <Text style={[s.heading, { color: theme.colors.text }]}>Observação (opcional)</Text>
        <TextInput multiline value={observacao} onChangeText={setObservacao} maxLength={500}
          placeholder="Conte o que a clínica precisa saber" placeholderTextColor={theme.colors.placeholder}
          style={[s.input, s.observacao, card, { color: theme.colors.text }]} />
        <Pressable disabled={!slot || !idPet || salvando} onPress={confirmar}
          style={[s.confirmar, { backgroundColor: theme.colors.primary, opacity: !slot || salvando ? .5 : 1 }]}>
          {salvando ? <ActivityIndicator color={theme.colors.onPrimary} /> : <Text style={{ color: theme.colors.onPrimary, fontWeight: '800' }}>Confirmar agendamento</Text>}
        </Pressable>
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({ root: { flex: 1 }, scroll: { padding: 20, paddingBottom: 45 }, voltar: { paddingVertical: 10 },
  title: { fontSize: 27, fontWeight: '800', marginTop: 12 }, subtitle: { fontSize: 14, lineHeight: 21, marginTop: 6 },
  heading: { fontSize: 16, fontWeight: '800', marginTop: 28, marginBottom: 12 }, wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, minWidth: 95 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16 }, help: { fontSize: 12, marginTop: 6 },
  observacao: { minHeight: 85, textAlignVertical: 'top' }, confirmar: { marginTop: 32, minHeight: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center' } });