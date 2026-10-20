import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { mostrarToast } from '../ui/Toast';

const STORAGE_KEY = '@vetsync:retornos_locais_vet';

export function VetReturnReminder({ petId }: { petId: string }) {
  const { theme } = useTheme();
  const s = StyleSheet.create({ card: { backgroundColor: theme.pages.petDetails.card, borderWidth: 1, borderColor: theme.pages.petDetails.border, borderRadius: 16, padding: 16, marginBottom: 18 }, eyebrow: { color: theme.colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }, title: { color: theme.pages.petDetails.text, fontSize: 16, fontWeight: '800', marginTop: 4 }, value: { color: theme.pages.petDetails.text, fontSize: 13, fontWeight: '700', marginTop: 9 }, hint: { color: theme.pages.petDetails.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 5 }, row: { flexDirection: 'row', gap: 8, marginTop: 12 }, input: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: theme.pages.petDetails.border, borderRadius: 10, paddingHorizontal: 12, color: theme.pages.petDetails.text, fontSize: 14 }, button: { minWidth: 80, minHeight: 48, borderRadius: 10, backgroundColor: theme.pages.petDetails.primary, justifyContent: 'center', alignItems: 'center' }, buttonText: { color: theme.pages.petDetails.white, fontSize: 13, fontWeight: '800' } });
  const [data, setData] = useState('');
  const [salvo, setSalvo] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      const mapa: Record<string, string> = raw ? JSON.parse(raw) : {};
      setSalvo(mapa[petId] ?? null);
    }).catch(() => setSalvo(null));
  }, [petId]);

  async function salvar() {
    const digitos = data.replace(/\D/g, '');
    if (digitos.length !== 8) { mostrarToast('erro', 'Data inválida', 'Informe a data no formato DD/MM/AAAA.'); return; }
    const iso = `${digitos.slice(4, 8)}-${digitos.slice(2, 4)}-${digitos.slice(0, 2)}`;
    const parsed = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) { mostrarToast('erro', 'Data inválida', 'Confira o dia, mês e ano.'); return; }
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const mapa: Record<string, string> = raw ? JSON.parse(raw) : {};
      mapa[petId] = iso;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mapa));
      setSalvo(iso); setData('');
      mostrarToast('sucesso', 'Lembrete salvo neste dispositivo');
    } catch { mostrarToast('erro', 'Não foi possível salvar o lembrete'); }
  }

  return <View style={s.card}>
    <Text style={s.eyebrow}>ACOMPANHAMENTO</Text>
    <Text style={s.title}>Lembrete de retorno</Text>
    {salvo ? <Text style={s.value}>Próximo retorno sugerido: {new Date(`${salvo}T12:00:00`).toLocaleDateString('pt-BR')}</Text> : <Text style={s.hint}>Nenhum retorno pessoal registrado.</Text>}
    <Text style={s.hint}>Este lembrete fica salvo apenas neste dispositivo e não é enviado ao tutor.</Text>
    <View style={s.row}>
      <TextInput value={data} onChangeText={v => setData(v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{2})(\d)/, '$1/$2').replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2'))} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} style={s.input} placeholderTextColor={theme.pages.petDetails.textSecondary} accessibilityLabel="Data sugerida para retorno" />
      <Pressable style={s.button} onPress={() => void salvar()} accessibilityRole="button" accessibilityLabel="Salvar lembrete de retorno"><Text style={s.buttonText}>Salvar</Text></Pressable>
    </View>
  </View>;
}
