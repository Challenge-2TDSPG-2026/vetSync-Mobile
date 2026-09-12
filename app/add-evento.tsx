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
  cream: '#f6f4ef', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', dangerLight: '#fff2f2', warn: '#e67e22',
};

function formatarData(text: string): string {
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
  const [hora, setHora] = useState('');
  const [observacao, setObservacao] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!tipoSelecionado) e.tipo = 'Selecione o tipo de evento';
    if (!vetSelecionado) e.veterinario = 'Selecione um veterinário';
    if (data.length < 10) e.data = 'Data inválida (DD/MM/AAAA)';
    if (hora.length < 5) e.hora = 'Hora inválida (HH:MM)';
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
        hora,
        observacao: observacao.trim() || undefined,
      });
      router.replace('/(tutor)');
    } catch (e) {
      alertar('Não foi possível agendar o evento', mensagemDeErro(e, 'Tente novamente em instantes.'));
    }
  }

  const visualTipo = tipoSelecionado ? obterVisualTipoEvento(tipoSelecionado.nome) : null;
  const carregandoCatalogo = carregandoTipos || carregandoVets;
  const corTema = visualTipo?.cor ?? C.g600;

  return (
    <>
      <Stack.Screen options={{
        title: 'Agendar Evento de Saúde',
        headerStyle: { backgroundColor: C.g900 },
        headerTintColor: C.white,
        headerTitleStyle: { fontWeight: '700' },
      }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.container} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          <View style={[s.hero, { backgroundColor: corTema }]}>
            <View style={s.heroIconWrap}>
              <AppIcon
                name={visualTipo?.icon ?? 'document-text-outline'}
                set={visualTipo?.iconSet ?? 'Ionicons'}
                size={30}
                color={C.white}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.heroTitulo} numberOfLines={1}>{tipoSelecionado?.nome ?? 'Novo evento de saúde'}</Text>
              <Text style={s.heroSub} numberOfLines={1}>
                {vetSelecionado ? vetSelecionado.nome : 'Escolha o veterinário'} • {data || 'Data'}{hora ? ` às ${hora}` : ''}
              </Text>
              {petAtivo ? <Text style={s.heroPet}>Para {petAtivo.nome}</Text> : null}
            </View>
          </View>

          {carregandoCatalogo ? (
            <View style={s.loadingBox}>
              <ActivityIndicator color={C.g600} />
            </View>
          ) : (
            <>
              <View style={s.secao}>
                <View style={s.secaoHeadRow}>
                  <AppIcon name="clipboard-pulse-outline" set="MaterialCommunityIcons" size={16} color={C.g700} />
                  <Text style={s.secaoTitulo}>Tipo de evento</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 6, paddingRight: 4 }}>
                    {tiposEvento.map(t => {
                      const v = obterVisualTipoEvento(t.nome);
                      const ativo = tipoSelecionado?.id === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          style={[s.tipoBtn, ativo && { backgroundColor: v.cor, borderColor: v.cor }]}
                          onPress={() => setTipoSelecionado(t)}
                        >
                          {ativo && (
                            <View style={s.checkBadge}>
                              <AppIcon name="checkmark" set="Ionicons" size={11} color={v.cor} />
                            </View>
                          )}
                          <View style={[s.tipoIconCirculo, { backgroundColor: ativo ? 'rgba(255,255,255,0.2)' : v.cor + '18' }]}>
                            <AppIcon name={v.icon} set={v.iconSet} size={20} color={ativo ? C.white : v.cor} />
                          </View>
                          <Text style={[s.tipoLabel, ativo && { color: C.white }]}>{t.nome}</Text>
                          <Text style={[s.tipoPontos, ativo && { color: 'rgba(255,255,255,0.85)' }]}>{t.pontos} pts</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                {erros.tipo ? <Text style={s.textoErro}>{erros.tipo}</Text> : null}
              </View>

              <View style={s.secao}>
                <View style={s.secaoHeadRow}>
                  <AppIcon name="medical-bag" set="MaterialCommunityIcons" size={16} color={C.g700} />
                  <Text style={s.secaoTitulo}>Veterinário</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 10, paddingBottom: 6, paddingRight: 4 }}>
                    {veterinarios.map(v => {
                      const ativo = vetSelecionado?.id === v.id;
                      return (
                        <Pressable
                          key={v.id}
                          style={[s.vetBtn, ativo && s.vetBtnAtivo]}
                          onPress={() => setVetSelecionado(v)}
                        >
                          <View style={[s.vetAvatar, ativo && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <AppIcon name="medical-bag" set="MaterialCommunityIcons" size={16} color={ativo ? C.white : C.g600} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[s.vetNome, ativo && { color: C.white }]} numberOfLines={1}>{v.nome}</Text>
                            {v.nomeClinica ? (
                              <Text style={[s.vetClinica, ativo && { color: 'rgba(255,255,255,0.8)' }]} numberOfLines={1}>{v.nomeClinica}</Text>
                            ) : null}
                          </View>
                          {ativo && <AppIcon name="checkmark-circle" set="Ionicons" size={16} color={C.white} />}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
                {erros.veterinario ? <Text style={s.textoErro}>{erros.veterinario}</Text> : null}
              </View>
            </>
          )}

          <View style={s.secao}>
            <View style={s.secaoHeadRow}>
              <AppIcon name="calendar-outline" set="Ionicons" size={16} color={C.g700} />
              <Text style={s.secaoTitulo}>Data e horário</Text>
            </View>
            <View style={s.fr}>
              <View style={{ flex: 1 }}>
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
              <View style={{ width: 100 }}>
                <TextInput
                  style={[s.fiInput, erros.hora && s.fiInputErro]}
                  value={hora}
                  onChangeText={v => setHora(formatarHora(v))}
                  placeholder="HH:MM"
                  placeholderTextColor={C.muted}
                  keyboardType="numeric"
                  maxLength={5}
                />
                {erros.hora ? <Text style={s.textoErro}>{erros.hora}</Text> : null}
              </View>
            </View>
          </View>

          <View style={s.secao}>
            <View style={s.secaoHeadRow}>
              <AppIcon name="create-outline" set="Ionicons" size={16} color={C.g700} />
              <Text style={s.secaoTitulo}>Observação</Text>
            </View>
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
            <Pressable style={s.btnCancelar} onPress={() => router.replace('/(tutor)')}>
              <Text style={s.btnCancelarText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[s.btnSalvar, { backgroundColor: corTema }, agendarMutation.isPending && { opacity: 0.6 }]}
              onPress={handleSalvar}
              disabled={agendarMutation.isPending}
            >
              {agendarMutation.isPending ? (
                <Text style={s.btnSalvarText}>Agendando...</Text>
              ) : (
                <>
                  <AppIcon name={visualTipo?.icon ?? 'document-text-outline'} set={visualTipo?.iconSet ?? 'Ionicons'} size={16} color={C.white} style={{ marginRight: 6 }} />
                  <Text style={s.btnSalvarText}>Agendar evento</Text>
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
  content: { padding: 18, paddingBottom: 40 },

  hero: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 5,
  },
  heroIconWrap: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  heroTitulo: { fontSize: 17, fontWeight: '700', color: C.white, letterSpacing: -0.2 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  heroPet: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: '600' },

  loadingBox: { paddingVertical: 32, alignItems: 'center' },

  secao: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  secaoHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  secaoTitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.text },

  fr: { flexDirection: 'row', gap: 10 },

  fiInput: {
    width: '100%',
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: C.text,
  },
  fiInputErro: { borderColor: C.danger, backgroundColor: C.dangerLight },
  fiTextarea: { minHeight: 84, textAlignVertical: 'top' },
  textoErro: { color: C.danger, fontSize: 12, marginTop: 6, fontWeight: '600' },

  tipoBtn: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
    minWidth: 118,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute', top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.white,
    justifyContent: 'center', alignItems: 'center',
  },
  tipoIconCirculo: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8,
  },
  tipoLabel: { fontSize: 11, fontWeight: '700', color: C.text, textAlign: 'center' },
  tipoPontos: { fontSize: 9, fontWeight: '700', color: C.muted, marginTop: 3 },

  vetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: C.border,
    minWidth: 180,
  },
  vetBtnAtivo: { backgroundColor: C.g600, borderColor: C.g600 },
  vetAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  vetNome: { fontSize: 12, fontWeight: '700', color: C.text },
  vetClinica: { fontSize: 10, color: C.muted, marginTop: 1 },

  modalFoot: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    paddingTop: 4,
    marginTop: 4,
  },
  btnCancelar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: 'center',
  },
  btnCancelarText: { fontSize: 14, fontWeight: '700', color: C.muted },
  btnSalvar: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnSalvarText: { color: C.white, fontSize: 14, fontWeight: '700' },
});