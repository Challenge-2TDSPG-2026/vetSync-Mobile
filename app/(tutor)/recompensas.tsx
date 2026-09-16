import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import {
  useCatalogoRecompensas,
  useSaldoRecompensas,
  useMeusResgates,
  useResgatar,
} from '../../hooks/useRecompensas';
import { useConquistas } from '../../hooks/useConquistas';
import { AppIcon } from '../../components/AppIcon';
import { PetSwitcher } from '../../components/PetSwitcher';
import { alertar, confirmar } from '../../utils/alert';
import { META_CONSULTAS_RECOMPENSA } from '../../constants/gamification';
import type { Recompensa } from '../../types';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  ouro: '#c99a2e', ouroClaro: '#fdf6e3',
  roxo: '#6d4aa8', roxoClaro: '#f1ecfb',
  danger: '#dc3545',
};

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function RecompensasScreen() {
  const { petAtivo, eventos, nivelInfo } = usePet();
  const { modoIdoso } = useAccessibility();
  const { autenticado } = useAuth();

  const { data: catalogo = [], isLoading: carregandoCatalogo } = useCatalogoRecompensas(autenticado);
  const { data: saldoPontos = 0 } = useSaldoRecompensas(autenticado);
  const { data: resgates = [], isLoading: carregandoResgates } = useMeusResgates(autenticado);
  const resgatarMutation = useResgatar();

  const { conquistas, conquistasDesbloqueadas } = useConquistas(!!petAtivo, eventos, resgates);

  const metaConsultas = META_CONSULTAS_RECOMPENSA;
  const consultasConcluidasTotal = useMemo(
    () => eventos.filter(e => e.status === 'CONCLUIDO').length,
    [eventos]
  );
  const consultasNoCicloAtual = consultasConcluidasTotal % metaConsultas;
  const faltam = Math.max(0, metaConsultas - consultasNoCicloAtual);
  const pct = Math.min(100, Math.round((consultasNoCicloAtual / metaConsultas) * 100));

  const historico = useMemo(
    () => [...resgates].sort((a, b) => new Date(b.dataResgate).getTime() - new Date(a.dataResgate).getTime()),
    [resgates]
  );

  function handleResgatar(r: Recompensa) {
    if (saldoPontos < r.custoPontos) {
      alertar('Pontos insuficientes', `Essa recompensa custa ${r.custoPontos} pontos. Seu saldo é de ${saldoPontos} pontos.`);
      return;
    }
    confirmar(
      'Resgatar benefício?',
      `Deseja resgatar "${r.nome}" por ${r.custoPontos} pontos para ${petAtivo?.nome ?? 'seu pet'}? Apresente esse resgate na clínica veterinária.`,
      [
        { texto: 'Cancelar', estilo: 'cancel' },
        {
          texto: 'Resgatar',
          aoConfirmar: async () => {
            try {
              await resgatarMutation.mutateAsync(r.id);
              alertar('Resgate efetuado!', 'Apresente o comprovante de resgate na clínica veterinária.');
            } catch {
              alertar('Erro ao resgatar', 'Não foi possível concluir o resgate. Tente novamente.');
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <PetSwitcher />

      <View style={[s.banner, modoIdoso && sIdoso.banner]}>
        <View style={[s.bannerIconWrap, modoIdoso && sIdoso.bannerIconWrap]}>
          <AppIcon name="gift-outline" set="Ionicons" size={modoIdoso ? 38 : 30} color={C.white} />
        </View>
        <Text style={[s.bannerTitulo, modoIdoso && sIdoso.bannerTitulo]}>Programa de Fidelidade</Text>
        <Text style={[s.bannerSub, modoIdoso && sIdoso.bannerSub]}>
          Acumule pontos em cada atendimento e resgate benefícios exclusivos para {petAtivo?.nome ?? 'seu pet'}.
        </Text>
      </View>

      <View style={[s.nivelCard, modoIdoso && sIdoso.nivelCard]}>
        <View style={s.nivelHead}>
          <View style={[s.nivelBadge, modoIdoso && sIdoso.nivelBadge]}>
            <Text style={[s.nivelBadgeNumero, modoIdoso && sIdoso.nivelBadgeNumero]}>{nivelInfo.nivel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.nivelTitulo, modoIdoso && sIdoso.nivelTitulo]}>{nivelInfo.titulo}</Text>
            <Text style={[s.nivelSub, modoIdoso && sIdoso.nivelSub]}>Nível {nivelInfo.nivel} • {nivelInfo.xpAtual} XP</Text>
          </View>
        </View>

        <View style={[s.barraTrackRoxo, modoIdoso && sIdoso.barraTrackRoxo]}>
          <View style={[s.barraFillRoxo, { width: `${nivelInfo.progressoPct}%` as any }]} />
        </View>
        <Text style={[s.nivelHint, modoIdoso && sIdoso.nivelHint]}>
          {nivelInfo.xpFaltaProximoNivel !== null
            ? `Faltam ${nivelInfo.xpFaltaProximoNivel} XP para o próximo nível`
            : 'Nível máximo alcançado! 🏆'}
        </Text>
        {!modoIdoso && <Text style={s.nivelDica}>Cada evento de saúde concluído vale 10 XP</Text>}
      </View>

      <View style={[s.progressoCard, modoIdoso && sIdoso.nivelCard]}>
        <View style={s.progressoHead}>
          <Text style={[s.progressoLbl, modoIdoso && sIdoso.progressoLbl]}>Ciclo de atendimentos</Text>
          <Text style={[s.progressoContagem, modoIdoso && sIdoso.progressoContagem]}>{consultasNoCicloAtual}/{metaConsultas}</Text>
        </View>
        <View style={[s.barraTrack, modoIdoso && sIdoso.barraTrackRoxo]}>
          <View style={[s.barraFill, { width: `${pct}%` as any }]} />
        </View>
        <Text style={[s.progressoHint, modoIdoso && sIdoso.nivelHint]}>
          {faltam === 0
            ? 'Meta do ciclo atingida! Parabéns pelo cuidado contínuo 🎉'
            : `Faltam ${faltam} evento${faltam !== 1 ? 's' : ''} concluído${faltam !== 1 ? 's' : ''} para completar o ciclo`}
        </Text>

        <View style={s.dotsRow}>
          {Array.from({ length: metaConsultas }).map((_, i) => (
            <View
              key={i}
              style={[s.dotConsulta, modoIdoso && sIdoso.dotConsulta, i < consultasNoCicloAtual && s.dotConsultaPreenchida]}
            >
              {i < consultasNoCicloAtual && (
                <AppIcon name="checkmark" set="Ionicons" size={modoIdoso ? 16 : 12} color={C.white} />
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={s.secLabelRow}>
        <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Benefícios do Catálogo</Text>
        <Text style={s.secLabelContagem}>Saldo: {saldoPontos} pts</Text>
      </View>

      {carregandoCatalogo ? (
        <View style={s.emptyCard}>
          <ActivityIndicator color={C.g600} />
        </View>
      ) : catalogo.length === 0 ? (
        <View style={s.emptyCard}>
          <AppIcon name="ribbon-outline" set="Ionicons" size={32} color={C.muted} style={{ marginBottom: 8 }} />
          <Text style={s.emptyTitle}>Nenhum benefício disponível no momento</Text>
          <Text style={s.emptySub}>Novas recompensas aparecerão aqui em breve.</Text>
        </View>
      ) : (
        catalogo.map(r => {
          const podeResgatar = saldoPontos >= r.custoPontos;
          const isPending = resgatarMutation.isPending && resgatarMutation.variables === r.id;

          return (
            <View key={r.id} style={[s.cupomCard, modoIdoso && sIdoso.cupomCard]}>
              <View style={[s.cupomIconWrap, modoIdoso && sIdoso.cupomIconWrap]}>
                <AppIcon name="gift" set="Ionicons" size={modoIdoso ? 28 : 22} color={C.ouro} />
              </View>
              <View style={s.cupomInfo}>
                <Text style={[s.cupomTitulo, modoIdoso && sIdoso.cupomTitulo]}>{r.nome}</Text>
                <Text style={[s.cupomSub, modoIdoso && sIdoso.cupomSub]}>
                  {r.descricao ? `${r.descricao} • ` : ''}{r.custoPontos} pontos
                </Text>
              </View>
              <Pressable
                style={[s.btnResgatar, modoIdoso && sIdoso.btnResgatar, (!podeResgatar || isPending) && { opacity: 0.5 }]}
                onPress={() => handleResgatar(r)}
                disabled={!podeResgatar || isPending}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <Text style={[s.btnResgatarText, modoIdoso && sIdoso.btnResgatarText]}>Resgatar</Text>
                )}
              </Pressable>
            </View>
          );
        })
      )}

      <View style={s.secLabelRow}>
        <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Conquistas</Text>
        <Text style={s.secLabelContagem}>{conquistasDesbloqueadas.length}/{conquistas.length}</Text>
      </View>
      <View style={[s.conquistasGrid, modoIdoso && sIdoso.conquistasGrid]}>
        {conquistas.map(c => (
          <View
            key={c.id}
            style={[s.conquistaCard, modoIdoso && sIdoso.conquistaCard, !c.desbloqueada && s.conquistaCardBloqueada]}
          >
            <View style={[s.conquistaIconWrap, modoIdoso && sIdoso.conquistaIconWrap, c.desbloqueada && s.conquistaIconWrapAtiva]}>
              <AppIcon
                name={c.desbloqueada ? c.icon : 'lock-closed-outline'}
                set={c.desbloqueada ? c.iconSet : 'Ionicons'}
                size={modoIdoso ? 26 : 20}
                color={c.desbloqueada ? C.white : C.muted}
              />
            </View>
            <Text style={[s.conquistaTitulo, modoIdoso && sIdoso.conquistaTitulo, !c.desbloqueada && s.conquistaTituloBloqueada]} numberOfLines={2}>
              {c.titulo}
            </Text>
            {!modoIdoso && <Text style={s.conquistaDescricao} numberOfLines={2}>{c.descricao}</Text>}
          </View>
        ))}
      </View>

      <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Estatísticas</Text>
      <View style={s.statsCard}>
        <View style={s.statItem}>
          <Text style={[s.statValor, modoIdoso && sIdoso.statValor]}>{consultasConcluidasTotal}</Text>
          <Text style={[s.statLabel, modoIdoso && sIdoso.statLabelBig]}>Eventos concluídos</Text>
        </View>
        <View style={s.statDivisor} />
        <View style={s.statItem}>
          <Text style={[s.statValor, modoIdoso && sIdoso.statValor]}>{saldoPontos}</Text>
          <Text style={[s.statLabel, modoIdoso && sIdoso.statLabelBig]}>Pontos disponíveis</Text>
        </View>
        <View style={s.statDivisor} />
        <View style={s.statItem}>
          <Text style={[s.statValor, modoIdoso && sIdoso.statValor]}>{historico.length}</Text>
          <Text style={[s.statLabel, modoIdoso && sIdoso.statLabelBig]}>Resgates realizados</Text>
        </View>
      </View>

      {carregandoResgates ? (
        <View style={s.emptyCard}>
          <ActivityIndicator color={C.g600} />
        </View>
      ) : historico.length > 0 && (
        <>
          <Text style={[s.secLabel, modoIdoso && sIdoso.secLabel]}>Histórico de resgates</Text>
          <View style={s.historicoCard}>
            {historico.map((r, idx) => (
              <View key={r.id} style={[s.historicoRow, modoIdoso && sIdoso.historicoRow, idx < historico.length - 1 && s.historicoRowBorder]}>
                <AppIcon
                  name={r.status === 'VALIDADO' ? 'checkmark-circle' : r.status === 'PENDENTE' ? 'time-outline' : 'close-circle'}
                  set="Ionicons"
                  size={modoIdoso ? 24 : 18}
                  color={r.status === 'VALIDADO' ? C.g500 : r.status === 'PENDENTE' ? C.ouro : C.danger}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.historicoTitulo, modoIdoso && sIdoso.historicoTitulo]}>{r.nomeRecompensa}</Text>
                  <Text style={[s.historicoData, modoIdoso && sIdoso.historicoData]}>
                    {formatarData(r.dataResgate)} • {r.status}
                  </Text>
                </View>
                <Text style={{ fontSize: modoIdoso ? 14 : 12, fontWeight: '700', color: C.muted }}>-{r.custoPontos} pts</Text>
              </View>
            ))}
          </View>
        </>
      )}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 40 },

  banner: {
    backgroundColor: C.g800,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  bannerTitulo: { fontSize: 17, fontWeight: '700', color: C.white, marginBottom: 4 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 12 },

  nivelCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 16,
  },
  nivelHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  nivelBadge: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: C.roxo,
    justifyContent: 'center', alignItems: 'center',
  },
  nivelBadgeNumero: { fontSize: 18, fontWeight: '700', color: C.white },
  nivelTitulo: { fontSize: 15, fontWeight: '700', color: C.text },
  nivelSub: { fontSize: 12, color: C.muted, marginTop: 2 },
  barraTrackRoxo: { height: 8, backgroundColor: C.roxoClaro, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  barraFillRoxo: { height: '100%', backgroundColor: C.roxo, borderRadius: 4 },
  nivelHint: { fontSize: 12, color: C.text, fontWeight: '600', marginBottom: 2 },
  nivelDica: { fontSize: 11, color: C.muted },

  progressoCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 18,
    marginBottom: 20,
  },
  progressoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressoLbl: { fontSize: 12, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  progressoContagem: { fontSize: 18, fontWeight: '700', color: C.g700 },
  barraTrack: { height: 10, backgroundColor: C.w100, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  barraFill: { height: '100%', backgroundColor: C.g500, borderRadius: 5 },
  progressoHint: { fontSize: 12, color: C.muted, marginBottom: 14 },

  dotsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  dotConsulta: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.w50,
    justifyContent: 'center', alignItems: 'center',
  },
  dotConsultaPreenchida: { backgroundColor: C.g500, borderColor: C.g500 },

  secLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase',
    color: C.muted, marginBottom: 10, marginTop: 4, paddingLeft: 2,
  },
  secLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 2,
  },
  secLabelContagem: { fontSize: 11, fontWeight: '700', color: C.g600, marginBottom: 10 },

  emptyCard: {
    backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 24, alignItems: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: C.muted, textAlign: 'center' },

  cupomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.ouroClaro, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.ouro,
    padding: 14, marginBottom: 10,
  },
  cupomIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: C.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.ouro,
  },
  cupomInfo: { flex: 1 },
  cupomTitulo: { fontSize: 14, fontWeight: '700', color: C.text },
  cupomSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  btnResgatar: {
    backgroundColor: C.ouro, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8,
  },
  btnResgatarText: { color: C.white, fontSize: 12, fontWeight: '700' },

  conquistasGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20,
  },
  conquistaCard: {
    width: '31%',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.g200,
    padding: 10,
    alignItems: 'center',
  },
  conquistaCardBloqueada: { borderColor: C.border, opacity: 0.55 },
  conquistaIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.w100,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  conquistaIconWrapAtiva: { backgroundColor: C.g500 },
  conquistaTitulo: { fontSize: 10.5, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 2 },
  conquistaTituloBloqueada: { color: C.muted },
  conquistaDescricao: { fontSize: 9, color: C.muted, textAlign: 'center', lineHeight: 12 },

  statsCard: {
    flexDirection: 'row', backgroundColor: C.white, borderRadius: 12,
    borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statValor: { fontSize: 22, fontWeight: '700', color: C.g700 },
  statLabel: { fontSize: 10, color: C.muted, textAlign: 'center', marginTop: 4, paddingHorizontal: 4 },
  statDivisor: { width: 1, backgroundColor: C.border },

  historicoCard: {
    backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  historicoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  historicoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  historicoTitulo: { fontSize: 13, fontWeight: '600', color: C.text },
  historicoData: { fontSize: 11, color: C.muted, marginTop: 2 },
});

/** Overrides do modo idoso: textos e alvos de toque maiores; conquistas em grade 2x em vez de 3x. */
const sIdoso = StyleSheet.create({
  banner: { padding: 26 },
  bannerIconWrap: { width: 68, height: 68, borderRadius: 34 },
  bannerTitulo: { fontSize: 20 },
  bannerSub: { fontSize: 14 },

  nivelCard: { padding: 22 },
  nivelBadge: { width: 54, height: 54, borderRadius: 27 },
  nivelBadgeNumero: { fontSize: 21 },
  nivelTitulo: { fontSize: 18 },
  nivelSub: { fontSize: 14 },
  barraTrackRoxo: { height: 12, borderRadius: 6 },
  nivelHint: { fontSize: 14 },

  progressoLbl: { fontSize: 13 },
  progressoContagem: { fontSize: 21 },
  dotConsulta: { width: 34, height: 34, borderRadius: 17 },

  secLabel: { fontSize: 14 },

  cupomCard: { padding: 16 },
  cupomIconWrap: { width: 52, height: 52, borderRadius: 26 },
  cupomTitulo: { fontSize: 16 },
  cupomSub: { fontSize: 13 },
  btnResgatar: { paddingHorizontal: 18, paddingVertical: 12 },
  btnResgatarText: { fontSize: 14 },

  conquistasGrid: { gap: 12 },
  conquistaCard: { width: '47%', padding: 14 },
  conquistaIconWrap: { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
  conquistaTitulo: { fontSize: 13 },

  statValor: { fontSize: 26 },
  statLabelBig: { fontSize: 12 },

  historicoRow: { padding: 16 },
  historicoTitulo: { fontSize: 15 },
  historicoData: { fontSize: 13 },
});