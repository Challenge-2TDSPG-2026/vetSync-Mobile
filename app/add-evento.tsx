import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { usePet } from '../context/PetContext';
import { useTiposEvento, useVeterinarios, useAgendarEvento } from '../hooks/useEventos';
import { obterVisualTipoEvento } from '../constants';
import { AppIcon } from '../components/AppIcon';
import { ApiError } from '../services/api/httpClient';
import { alertar } from '../utils/alert';
import type { TipoEvento, Veterinario } from '../types';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', warn: '#e67e22',
};

function formatarData(text: string): string {
  const n = text.replace(/\D/g, '');
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4, 8)}`;
}

function paraIsoData(s: string): string {
  const [dd, mm, aaaa] = s.split('/');
  return `${aaaa}-${mm}-${dd}`;
}

function mensagemDeErro(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback;
}

export default function AddEventoScreen() {
  const router = useRouter();
  const { petAtivo } = usePet();

  const { data: tiposEvento = [], isLoading: carregandoTipos } = useTiposEvento(true);
  const { data: veterinarios = [], isLoading: carregandoVets } = useVeterinarios(true);
  const agendarMutation = useAgendarEvento();

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoEvento | null>(null);
  const [vetSelecionado, setVetSelecionado] = useState<Veterinario | null>(null);
  const [data, setData] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!tipoSelecionado) e.tipo = 'Selecione o tipo de evento';
    if (!vetSelecionado) e.veterinario = 'Selecione um veterinário';
    if (data.length < 10) e.data = 'Data inválida (DD/MM/AAAA)';
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSalvar() {
    if (!validar() || !petAtivo || !tipoSelecionado || !vetSelecionado) return;
    try {
      await agendarMutation.mutateAsync({
        idPet: petAtivo.id,
        idTipoEvento: tipoSelecionado.id,
        idVeterinario: vetSelecionado.id,
        data: paraIsoData(data),
        observacao: observacao.trim() || undefined,
      });
      router.back();
    } catch (e) {
      alertar('Não foi possível agendar o evento', mensagemDeErro(e, 'Tente novamente em instantes.'));
    }
  }

  const visualTipo = tipoSelecionado ? obterVisualTipoEvento(tipoSelecionado.nome) : null;
  const carregandoCatalogo = carregandoTipos || carregandoVets;

  return (
    <>
      <Stack.Screen options={{
        title: 'Agendar Evento de Saúde',
        headerStyle: { backgroundColor: C.g800 },
        headerTintColor: C.white,
        headerTitleStyle: { fontWeight: '700' },
      }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <View style={s.preview}>
            <View style={[s.previewIcone, { backgroundColor: visualTipo?.cor ?? C.g500 }]}>
              <AppIcon
                name={visualTipo?.icon ?? 'document-text-outline'}
                set={visualTipo?.iconSet ?? 'Ionicons'}
                size={26}
                color={C.white}
              />
            </View>
            <View style={s.previewInfo}>
              <Text style={s.previewTitulo}>{tipoSelecionado?.nome ?? 'Tipo do evento'}</Text>
              <Text style={s.previewSub}>
                {vetSelecionado ? vetSelecionado.nome : 'Veterinário'} • {data || 'Data'}
              </Text>
              {petAtivo ? <Text style={s.previewSub}>Para: {petAtivo.nome}</Text> : null}
            </View>
          </View>

          {carregandoCatalogo ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={C.g600} />
            </View>
          ) : (
            <>
              <View style={s.fg}>
                <Text style={s.fl}>Tipo de evento *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                    {tiposEvento.map(t => {
                      const v = obterVisualTipoEvento(t.nome);
                      const ativo = tipoSelecionado?.id === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          style={[s.tipoBtn, ativo && { backgroundColor: v.cor, borderColor: v.cor }]}
                          onPress={() => setTipoSelecionado(t)}
                        >
                          <AppIcon name={v.icon} set={v.iconSet} size={20} color={ativo ? C.white : v.cor} />
                          <Text style={[s.tipoLabel, ativo && { color: C.white }]}>{t.nome}</Text>
                          <Text style={[s.tipoPontos, ativo && { color: 'rgba(255,255,255,0.85)' }]}>{t.pontos} pts</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                {erros.tipo ? <Text style={s.textoErro}>{erros.tipo}</Text> : null}
              </View>

              <View style={s.fg}>
                <Text style={s.fl}>Veterinário *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                    {veterinarios.map(v => {
                      const ativo = vetSelecionado?.id === v.id;
                      return (
                        <Pressable
                          key={v.id}
                          style={[s.vetBtn, ativo && s.vetBtnAtivo]}
                          onPress={() => setVetSelecionado(v)}
                        >
                          <AppIcon name="medical-bag" set="MaterialCommunityIcons" size={18} color={ativo ? C.white : C.g600} />
                          <View>
                            <Text style={[s.vetNome, ativo && { color: C.white }]}>{v.nome}</Text>
                            {v.nomeClinica ? (
                              <Text style={[s.vetClinica, ativo && { color: 'rgba(255,255,255,0.8)' }]}>{v.nomeClinica}</Text>
                            ) : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                {erros.veterinario ? <Text style={s.textoErro}>{erros.veterinario}</Text> : null}
              </View>
            </>
          )}

          <View style={s.fg}>
            <Text style={s.fl}>Data *</Text>
            <TextInput
              style={[s.fiInput, erros.data && s.fiInputErro]}
              value={data}
              onChangeText={v => setData(formatarData(v))}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              maxLength={10}
            />
            {erros.data ? <Text style={s.textoErro}>{erros.data}</Text> : null}
          </View>

          <View style={s.fg}>
            <Text style={s.fl}>Observação</Text>
            <TextInput
              style={[s.fiInput, s.fiTextarea]}
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Sintomas, contexto, pedidos específicos..."
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={s.modalFoot}>
            <Pressable style={s.btnCancelar} onPress={() => router.back()}>
              <Text style={s.btnCancelarText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[s.btnSalvar, { backgroundColor: visualTipo?.cor ?? C.g600 }, agendarMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={agendarMutation.isPending}
            >
              {agendarMutation.isPending ? (
                <Text style={s.btnSalvarText}>Agendando...</Text>
              ) : (
                <>
                  <AppIcon name={visualTipo?.icon ?? 'document-text-outline'} set={visualTipo?.iconSet ?? 'Ionicons'} size={16} color={C.white} style={{ marginRight: 6 }} />
                  <Text style={s.btnSalvarText}>Agendar Evento</Text>
                </>
              )}
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingBottom: 40 },

  preview: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: C.border,
  },
  previewIcone: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  previewInfo: { flex: 1 },
  previewTitulo: { fontSize: 16, fontWeight: '700', color: C.text },
  previewSub: { fontSize: 12, color: C.muted, marginTop: 3 },

  loadingBox: { paddingVertical: 32, alignItems: 'center' },

  fg: { marginBottom: 18 },
  fl: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.6,
    textTransform: 'uppercase', color: C.muted, marginBottom: 7,
  },

  fiInput: {
    width: '100%',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: C.text,
  },
  fiInputErro: { borderColor: C.danger },
  fiTextarea: { minHeight: 80, textAlignVertical: 'top' },
  textoErro: { color: C.danger, fontSize: 12, marginTop: 4 },

  tipoBtn: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    minWidth: 110,
  },
  tipoLabel: { fontSize: 11, fontWeight: '600', color: C.muted, marginTop: 4, textAlign: 'center' },
  tipoPontos: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 2 },

  vetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    minWidth: 160,
  },
  vetBtnAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  vetNome: { fontSize: 12, fontWeight: '700', color: C.text },
  vetClinica: { fontSize: 10, color: C.muted, marginTop: 1 },

  modalFoot: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 8,
  },
  btnCancelar: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.white,
  },
  btnCancelarText: { fontSize: 14, fontWeight: '600', color: C.text },
  btnSalvar: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSalvarText: { color: C.white, fontSize: 14, fontWeight: '700' },
});