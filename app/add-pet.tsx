import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { ESPECIES } from '../constants';
import { usePet } from '../context/PetContext';
import { ApiError } from '../services/api/httpClient';
import { alertar } from '../utils/alert';
import { AppIcon } from '../components/AppIcon';
import type { Pet } from '../types';

const C = {
  g800: '#0e3326', g600: '#1a7a52',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff', w50: '#f9f7f4',
  danger: '#dc3545',
};

const SEXOS = [
  { valor: 'macho', label: 'Macho', icon: 'gender-male' },
  { valor: 'femea', label: 'Fêmea', icon: 'gender-female' },
] as const;

function formatarData(text: string): string {
  const n = text.replace(/\D/g, '');
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4, 8)}`;
}

function mensagemDeErro(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export default function AddPetScreen() {
  const router = useRouter();
  const { adicionarPet, salvandoPet } = usePet();
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState<Pet['especie']>('cachorro');
  const [sexo, setSexo] = useState<Pet['sexo']>('macho');
  const [raca, setRaca] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [peso, setPeso] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!nome.trim()) e.nome = 'Nome é obrigatório';
    if (!raca.trim()) e.raca = 'Raça é obrigatória';
    if (!sexo) e.sexo = 'Sexo é obrigatório';
    if (dataNascimento.length < 10) e.dataNascimento = 'Data inválida (DD/MM/AAAA)';
    if (!peso.trim() || isNaN(Number(peso.replace(',', '.')))) e.peso = 'Peso inválido';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function parsarData(s: string): string {
    const [dd, mm, aaaa] = s.split('/');
    return new Date(`${aaaa}-${mm}-${dd}T12:00:00`).toISOString();
  }

  async function handleSalvar() {
    if (!validar()) return;
    try {
      const pet: Pet = {
        id: '', // gerado pela API — ignorado no payload de criação
        nome: nome.trim(), especie, sexo, raca: raca.trim(),
        dataNascimento: parsarData(dataNascimento), peso: peso.trim(),
      };
      await adicionarPet(pet);
      router.replace('/(tutor)');
    } catch (e) {
      alertar('Não foi possível cadastrar o pet', mensagemDeErro(e, 'Tente novamente em instantes.'));
    }
  }

  const especieInfo = ESPECIES.find(e => e.valor === especie);

  return (
    <>
      <Stack.Screen options={{
        title: 'Cadastrar Novo Pet',
        headerStyle: { backgroundColor: C.g800 },
        headerTintColor: C.white,
        headerTitleStyle: { fontWeight: '700' },
      }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <View style={s.previewCard}>
            <AppIcon
              name={especieInfo?.icon ?? 'paw'}
              set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
              size={38}
              color={C.g600}
              style={{ marginRight: 14 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.previewNome}>{nome || 'Nome do pet'}</Text>
              <Text style={s.previewSub}>{raca || 'Raça'} • {peso ? `${peso} kg` : 'Peso'}</Text>
            </View>
          </View>

          <View style={s.fg}>
            <Text style={s.fl}>Espécie *</Text>
            <View style={s.especieRow}>
              {ESPECIES.map(esp => (
                <Pressable
                  key={esp.valor}
                  style={[s.especieBtn, especie === esp.valor && s.especieBtnAtivo]}
                  onPress={() => setEspecie(esp.valor as Pet['especie'])}
                >
                  <AppIcon
                    name={esp.icon}
                    set={esp.iconSet}
                    size={20}
                    color={especie === esp.valor ? C.white : C.muted}
                  />
                  <Text style={[s.especieLabel, especie === esp.valor && s.especieLabelAtivo]}>
                    {esp.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={s.fg}>
            <Text style={s.fl}>Sexo *</Text>
            <View style={s.especieRow}>
              {SEXOS.map(sx => (
                <Pressable
                  key={sx.valor}
                  style={[s.especieBtn, sexo === sx.valor && s.especieBtnAtivo]}
                  onPress={() => setSexo(sx.valor as Pet['sexo'])}
                >
                  <AppIcon
                    name={sx.icon}
                    set="MaterialCommunityIcons"
                    size={20}
                    color={sexo === sx.valor ? C.white : C.muted}
                  />
                  <Text style={[s.especieLabel, sexo === sx.valor && s.especieLabelAtivo]}>
                    {sx.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            {erros.sexo ? <Text style={s.textoErro}>{erros.sexo}</Text> : null}
          </View>

          <View style={s.fr}>
            <Campo label="Nome *" value={nome} onChangeText={setNome} placeholder="Buddy" erro={erros.nome} />
            <Campo label="Raça *" value={raca} onChangeText={setRaca} placeholder="Golden Retriever" erro={erros.raca} />
          </View>

          <View style={s.fr}>
            <Campo
              label="Nascimento *"
              value={dataNascimento}
              onChangeText={(v: string) => setDataNascimento(formatarData(v))}
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              erro={erros.dataNascimento}
            />
            <Campo
              label="Peso (kg) *"
              value={peso}
              onChangeText={setPeso}
              placeholder="5.0"
              keyboardType="decimal-pad"
              erro={erros.peso}
            />
          </View>

          <Pressable
            style={[s.btnSalvar, salvandoPet && { opacity: 0.6 }]}
            onPress={handleSalvar}
            disabled={salvandoPet}
          >
            <Text style={s.btnSalvarText}>
              {salvandoPet ? 'Salvando...' : 'Cadastrar pet →'}
            </Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Campo({ label, value, onChangeText, placeholder, keyboardType, maxLength, erro }: any) {
  return (
    <View style={s.campo}>
      <Text style={s.fl}>{label}</Text>
      <TextInput
        style={[s.fi, erro && s.fiErro]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      {erro ? <Text style={s.textoErro}>{erro}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fafaf8' },
  content: { padding: 20, paddingBottom: 40 },

  previewCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  previewNome: { fontSize: 16, fontWeight: '700', color: C.text },
  previewSub: { fontSize: 12, color: C.muted, marginTop: 3 },

  fg: { marginBottom: 18 },
  fl: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase', color: C.muted, marginBottom: 7,
  },
  fr: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  campo: { flex: 1, marginBottom: 18 },
  fi: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 14,
    color: C.text,
  },
  fiErro: { borderColor: C.danger },
  textoErro: { color: C.danger, fontSize: 12, marginTop: 4 },

  especieRow: { flexDirection: 'row', gap: 8 },
  especieBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  especieBtnAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  especieLabel: { fontSize: 11, color: C.muted, marginTop: 3, fontWeight: '600' },
  especieLabelAtivo: { color: C.white },

  btnSalvar: {
    backgroundColor: C.g600,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  btnSalvarText: { color: C.white, fontSize: 14, fontWeight: '700' },
});