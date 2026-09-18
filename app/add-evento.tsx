import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, Pressable,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { usePet } from '../context/PetContext';
import { useTiposEvento, useVeterinarios, useAgendarEvento } from '../hooks/useEventos';
import { obterVisualTipoEvento } from '../constants';
import { AppIcon } from '../components/AppIcon';
import { ApiError } from '../services/api/httpClient';
import { alertar } from '../utils/alert';
import { agendarLembretes } from '../services/calendarService';
import { salvarLembretesEvento } from '../storage/petStorage';
import type { TipoEvento, Veterinario } from '../types';

const C = {
  night: '#0a2218', forest: '#123d29',
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  glow: '#f2c879',
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
  const [lembretesSelecionados, setLembretesSelecionados] = useState<number[]>([7, 1]);
  const [erros, setErros] = useState<Record<string, string>>({});

  function alternarLembrete(diasAntes: number) {
    setLembretesSelecionados(atual => (
      atual.includes(diasAntes)
        ? atual.filter(dias => dias !== diasAntes)
        : [...atual, diasAntes].sort((a, b) => a - b)
    ));
  }

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
      const evento = await agendarMutation.mutateAsync({
        idPet: petAtivo.id,
        idTipoEvento: tipoSelecionado.id,
        idVeterinario: vetSelecionado.id,
        data: paraIsoData(data),
        hora,
        observacao: observacao.trim() || undefined,
      });

      if (lembretesSelecionados.length > 0) {
        try {
          const idsLembretes = await agendarLembretes(evento, petAtivo, lembretesSelecionados);
          await salvarLembretesEvento(evento.id, idsLembretes);
        } catch {
          // Falha ao agendar lembretes não deve bloquear a criação do evento.
        }
      }

      router.replace('/(tutor)');
    } catch (e) {
      alertar('Não foi possível agendar o evento', mensagemDeErro(e, 'Tente novamente em instantes.'));
    }
  }

  const visualTipo = tipoSelecionado ? obterVisualTipoEvento(tipoSelecionado.nome) : null;
  const carregandoCatalogo = carregandoTipos || carregandoVets;
  const corTema = visualTipo?.cor ?? C.g600;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.night }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <LinearGradient colors={[C.night, corTema]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
          <AppIcon name="paw" set="MaterialCommunityIcons" size={190} color="rgba(255,255,255,0.05)" style={s.pawMarca} />

          <Pressable
            onPress={() => router.replace('/(tutor)')}
            style={s.btnFechar}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Fechar"
          >
            <AppIcon name="close" set="Ionicons" size={20} color="#fff" />
          </Pressable>

          <View style={s.seloWrap}>
            <View style={s.seloGlowOut} />
            <View style={s.seloGlowIn} />
            <View style={[s.selo, { backgroundColor: corTema }]}>
              <AppIcon
                name={visualTipo?.icon ?? 'document-text-outline'}
                set={visualTipo?.iconSet ?? 'Ionicons'}
                size={26}
                color="#fff"
              />
            </View>
          </View>

          <Text style={s.heroTitulo} numberOfLines={2}>{tipoSelecionado?.nome ?? 'Novo evento de saúde'}</Text>
          <Text style={s.heroSub} numberOfLines={1}>
            {vetSelecionado ? vetSelecionado.nome : 'Escolha o veterinário'} • {data || 'Data'}{hora ? ` às ${hora}` : ''}
          </Text>
          {petAtivo ? (
            <View style={s.petPill}>
              <AppIcon name="paw" set="MaterialCommunityIcons" size={12} color="#fff" />
              <Text style={s.petPillTexto}>Para {petAtivo.nome}</Text>
            </View>
          ) : null}
        </LinearGradient>

        <View style={s.sheet}>

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
                          style={[s.tipoBtn, ativo && { backgroundColor: v.cor }]}
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
                <View style={[s.inputWrap, erros.data && s.inputWrapErro]}>
                  <AppIcon name="calendar-outline" set="Ionicons" size={16} color={C.muted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={s.fiInput}
                    value={data}
                    onChangeText={v => setData(formatarData(v))}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                {erros.data ? <Text style={s.textoErro}>{erros.data}</Text> : null}
              </View>
              <View style={{ width: 118 }}>
                <View style={[s.inputWrap, erros.hora && s.inputWrapErro]}>
                  <AppIcon name="time-outline" set="Ionicons" size={16} color={C.muted} style={{ marginRight: 8 }} />
                  <TextInput
                    style={s.fiInput}
                    value={hora}
                    onChangeText={v => setHora(formatarHora(v))}
                    placeholder="HH:MM"
                    placeholderTextColor={C.muted}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                {erros.hora ? <Text style={s.textoErro}>{erros.hora}</Text> : null}
              </View>
            </View>
          </View>

          <View style={s.secao}>
            <View style={s.secaoHeadRow}>
              <AppIcon name="create-outline" set="Ionicons" size={16} color={C.g700} />
              <Text style={s.secaoTitulo}>Observação</Text>
            </View>
            <View style={[s.inputWrap, s.inputWrapTextarea]}>
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
          </View>

          <View style={s.secao}>
            <View style={s.secaoHeadRow}>
              <AppIcon name="notifications-outline" set="Ionicons" size={16} color={C.g700} />
              <Text style={s.secaoTitulo}>Lembretes</Text>
            </View>
            <Text style={s.lembreteAjuda}>Escolha quando deseja ser avisado sobre este evento.</Text>
            <View style={s.lembreteOpcoes}>
              {[
                { dias: 0, label: 'No dia' },
                { dias: 1, label: '1 dia antes' },
                { dias: 7, label: '7 dias antes' },
              ].map(opcao => {
                const selecionado = lembretesSelecionados.includes(opcao.dias);
                return (
                  <Pressable
                    key={opcao.dias}
                    style={[s.lembreteOpcao, selecionado && s.lembreteOpcaoSelecionada]}
                    onPress={() => alternarLembrete(opcao.dias)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selecionado }}
                    accessibilityLabel={`${opcao.label}${selecionado ? ', selecionado' : ''}`}
                  >
                    {selecionado && <AppIcon name="checkmark" set="Ionicons" size={13} color={C.white} />}
                    <Text style={[s.lembreteOpcaoTexto, selecionado && s.lembreteOpcaoTextoSelecionado]}>{opcao.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {lembretesSelecionados.length === 0 && (
              <Text style={s.lembreteSemAviso}>Este evento será criado sem lembretes.</Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [s.btnSalvar, { backgroundColor: corTema }, pressed && { opacity: 0.9 }, agendarMutation.isPending && { opacity: 0.6 }]}
            onPress={handleSalvar}
            disabled={agendarMutation.isPending}
          >
            {agendarMutation.isPending ? (
              <Text style={s.btnSalvarText}>Agendando...</Text>
            ) : (
              <>
                <Text style={s.btnSalvarText}>Agendar evento</Text>
                <AppIcon name="arrow-forward" set="Ionicons" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <Pressable style={s.btnCancelar} onPress={() => router.replace('/(tutor)')}>
            <Text style={s.btnCancelarText}>Cancelar</Text>
          </Pressable>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1 },

  hero: {
    paddingTop: 56,
    paddingHorizontal: 28,
    paddingBottom: 46,
    overflow: 'hidden',
  },
  pawMarca: { position: 'absolute', top: -18, right: -26, transform: [{ rotate: '-16deg' }] },
  btnFechar: {
    position: 'absolute',
    top: 16,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  seloWrap: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  seloGlowOut: { position: 'absolute', width: 86, height: 86, borderRadius: 43, backgroundColor: 'rgba(242,200,121,0.12)' },
  seloGlowIn: { position: 'absolute', width: 66, height: 66, borderRadius: 33, backgroundColor: 'rgba(242,200,121,0.16)' },
  selo: {
    width: 48, height: 48, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },

  heroTitulo: { fontSize: 24, fontWeight: '800', color: C.white, letterSpacing: -0.5, lineHeight: 29, marginBottom: 8, maxWidth: 300 },
  heroSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  petPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 999,
    marginTop: 12,
  },
  petPillTexto: { fontSize: 11, fontWeight: '700', color: '#fff' },

  sheet: {
    flexGrow: 1,
    backgroundColor: C.cream,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -24,
    paddingTop: 30,
    paddingHorizontal: 22,
    paddingBottom: 40,
  },

  loadingBox: { paddingVertical: 32, alignItems: 'center' },

  secao: { marginBottom: 24 },
  secaoHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 12 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', color: C.text },

  fr: { flexDirection: 'row', gap: 10 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: C.w50,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputWrapErro: { borderColor: C.danger, backgroundColor: C.dangerLight },
  inputWrapTextarea: { alignItems: 'flex-start', paddingVertical: 4 },
  fiInput: { flex: 1, paddingVertical: 13, fontSize: 14, color: C.text },
  fiTextarea: { minHeight: 80, textAlignVertical: 'top', paddingVertical: 12 },
  textoErro: { color: C.danger, fontSize: 12, marginTop: 6, fontWeight: '600' },

  lembreteAjuda: { color: C.muted, fontSize: 12, lineHeight: 17, marginTop: -4, marginBottom: 11 },
  lembreteOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lembreteOpcao: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: C.w50, borderWidth: 1, borderColor: C.border, paddingHorizontal: 12, paddingVertical: 9 },
  lembreteOpcaoSelecionada: { backgroundColor: C.g600, borderColor: C.g600 },
  lembreteOpcaoTexto: { color: C.text, fontSize: 12, fontWeight: '700' },
  lembreteOpcaoTextoSelecionado: { color: C.white },
  lembreteSemAviso: { color: C.muted, fontSize: 11, marginTop: 10 },

  tipoBtn: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.w50,
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
    minWidth: 180,
  },
  vetBtnAtivo: { backgroundColor: C.g600 },
  vetAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.g50,
    justifyContent: 'center', alignItems: 'center',
  },
  vetNome: { fontSize: 12, fontWeight: '700', color: C.text },
  vetClinica: { fontSize: 10, color: C.muted, marginTop: 1 },

  btnSalvar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  btnSalvarText: { color: C.white, fontSize: 15, fontWeight: '700' },

  btnCancelar: { marginTop: 12, paddingVertical: 10, alignItems: 'center' },
  btnCancelarText: { fontSize: 13, fontWeight: '600', color: C.muted },
});
