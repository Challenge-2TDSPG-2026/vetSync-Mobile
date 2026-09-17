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
  const { modoSimples } = useAccessibility();
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

  const historicoCompleto = useMemo(
    () => [...resgates].sort((a, b) => new Date(b.dataResgate).getTime() - new Date(a.dataResgate).getTime()),
    [resgates]
  );
  const historico = modoSimples ? historicoCompleto.slice(0, 3) : historicoCompleto;

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

      {/* Banner — some no modo simples */}
      {!modoSimples && (
        <View style={s.banner}>
          <View style={s.bannerIconWrap}>
            <AppIcon name="gift-outline" set="Ionicons" size={30} color={C.white} />
          </View>
          <Text style={s.bannerTitulo}>Programa de Fidelidade</Text>
          <Text style={s.bannerSub}>
            Acumule pontos em cada atendimento e resgate benefícios exclusivos para {petAtivo?.nome ?? 'seu pet'}.
          </Text>
        </View>
      )}

      <View style={[s.nivelCard, modoSimples && sSimples.nivelCard]}>
        <View style={s.nivelHead}>
          <View style={[s.nivelBadge, modoSimples && sSimples.nivelBadge]}>
            <Text style={[s.nivelBadgeNumero, modoSimples && sSimples.nivelBadgeNumero]}>{nivelInfo.nivel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.nivelTitulo, modoSimples && sSimples.nivelTitulo]}>{nivelInfo.titulo}</Text>
            <Text style={[s.nivelSub, modoSimples && sSimples.nivelSub]}>Nível {nivelInfo.nivel} • {nivelInfo.xpAtual} XP</Text>
          </View>
        </View>

        <View style={[s.barraTrackRoxo, modoSimples && sSimples.barraTrackRoxo]}>
          <View style={[s.barraFillRoxo, { width: `${nivelInfo.progressoPct}%` as any }]} />
        </View>
        <Text style={[s.nivelHint, modoSimples && sSimples.nivelHint]}>
          {nivelInfo.xpFaltaProximoNivel !== null
            ? `Faltam ${nivelInfo.xpFaltaProximoNivel} XP para o próximo nível`
            : 'Nível máximo alcançado! 🏆'}
        </Text>
        {!modoSimples && <Text style={s.nivelDica}>Cada evento de saúde concluído vale 10 XP</Text>}
      </View>

      {/* Ciclo de atendimentos — some no modo simples */}
      {!modoSimples && (
        <View style={s.progressoCard}>
          <View style={s.progressoHead}>
            <Text style={s.progressoLbl}>Ciclo de atendimentos</Text>
            <Text style={s.progressoContagem}>{consultasNoCicloAtual}/{metaConsultas}</Text>
          </View>
          <View style={s.barraTrack}>
            <View style={[s.barraFill, { width: `${pct}%` as any }]} />
          </View>
          <Text style={s.progressoHint}>
            {faltam === 0
              ? 'Meta do ciclo atingida! Parabéns pelo cuidado contínuo 🎉'
              : `Faltam ${faltam} evento${faltam !== 1 ? 's' : ''} concluído${faltam !== 1 ? 's' : ''} para completar o ciclo`}
          </Text>

          <View style={s.dotsRow}>
            {Array.from({ length: metaConsultas }).map((_, i) => (
              <View
                key={i}
                style={[s.dotConsulta, i < consultasNoCicloAtual && s.dotConsultaPreenchida]}
              >
                {i < consultasNoCicloAtual && (
                  <AppIcon name="checkmark" set="Ionicons" size={12} color={C.white} />
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.secLabelRow}>
        <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>Benefícios do Catálogo</Text>
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
            <View key={r.id} style={[s.cupomCard, modoSimples && sSimples.cupomCard]}>
              <View style={[s.cupomIconWrap, modoSimples && sSimples.cupomIconWrap]}>
                <AppIcon name="gift" set="Ionicons" size={modoSimples ? 30 : 24} color={C.ouro} />
              </View>
              <View style={s.cupomInfo}>
                <Text style={[s.cupomTitulo, modoSimples && sSimples.cupomTitulo]}>{r.nome}</Text>
                <Text style={[s.cupomSub, modoSimples && sSimples.cupomSub]}>
                  {r.descricao ? `${r.descricao} • ` : ''}{r.custoPontos} pontos
                </Text>
              </View>
              <Pressable
                style={[s.btnResgatar, modoSimples && sSimples.btnResgatar, (!podeResgatar || isPending) && { opacity: 0.5 }]}
                onPress={() => handleResgatar(r)}
                disabled={!podeResgatar || isPending}
              >
                {isPending ? (
                  <ActivityIndicator size="small" color={C.white} />
                ) : (
                  <Text style={[s.btnResgatarText, modoSimples && sSimples.btnResgatarText]}>Resgatar</Text>
                )}
              </Pressable>
            </View>
          );
        })
      )}

      {/* Conquistas — somem no modo simples */}
      {!modoSimples && (
        <>
          <View style={s.secLabelRow}>
            <Text style={s.secLabel}>Conquistas</Text>
            <Text style={s.secLabelContagem}>{conquistasDesbloqueadas.length}/{conquistas.length}</Text>
          </View>
          <View style={s.conquistasGrid}>
            {conquistas.map(c => (
              <View
                key={c.id}
                style={[s.conquistaCard, !c.desbloqueada && s.conquistaCardBloqueada]}
              >
                <View style={[s.conquistaIconWrap, c.desbloqueada && s.conquistaIconWrapAtiva]}>
                  <AppIcon
                    name={c.desbloqueada ? c.icon : 'lock-closed-outline'}
                    set={c.desbloqueada ? c.iconSet : 'Ionicons'}
                    size={20}
                    color={c.desbloqueada ? C.white : C.muted}
                  />
                </View>
                <Text style={[s.conquistaTitulo, !c.desbloqueada && s.conquistaTituloBloqueada]} numberOfLines={2}>
                  {c.titulo}
                </Text>
                <Text style={s.conquistaDescricao} numberOfLines={2}>{c.descricao}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Estatísticas — some no modo simples */}
      {!modoSimples && (
        <>
          <Text style={s.secLabel}>Estatísticas</Text>
          <View style={s.statsCard}>
            <View style={s.statItem}>
              <Text style={s.statValor}>{consultasConcluidasTotal}</Text>
              <Text style={s.statLabel}>Eventos concluídos</Text>
            </View>
            <View style={s.statDivisor} />
            <View style={s.statItem}>
              <Text style={s.statValor}>{saldoPontos}</Text>
              <Text style={s.statLabel}>Pontos disponíveis</Text>
            </View>
            <View style={s.statDivisor} />
            <View style={s.statItem}>
              <Text style={s.statValor}>{historicoCompleto.length}</Text>
              <Text style={s.statLabel}>Resgates realizados</Text>
            </View>
          </View>
        </>
      )}

      {carregandoResgates ? (
        <View style={s.emptyCard}>
          <ActivityIndicator color={C.g600} />
        </View>
      ) : historico.length > 0 && (
        <>
          <Text style={[s.secLabel, modoSimples && sSimples.secLabel]}>
            {modoSimples ? 'Últimos resgates' : 'Histórico de resgates'}
          </Text>
          <View style={s.historicoCard}>
            {historico.map((r, idx) => (
              <View key={r.id} style={[s.historicoRow, modoSimples && sSimples.historicoRow, idx < historico.length - 1 && s.historicoRowBorder]}>
                <AppIcon
                  name={r.status === 'VALIDADO' ? 'checkmark-circle' : r.status === 'PENDENTE' ? 'time-outline' : 'close-circle'}
                  set="Ionicons"
                  size={modoSimples ? 28 : 20}
                  color={r.status === 'VALIDADO' ? C.g500 : r.status === 'PENDENTE' ? C.ouro : C.danger}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[s.historicoTitulo, modoSimples && sSimples.historicoTitulo]}>{r.nomeRecompensa}</Text>
                  <Text style={[s.historicoData, modoSimples && sSimples.historicoData]}>
                    {formatarData(r.dataResgate)} • {r.status}
                  </Text>
                </View>
                <Text style={{ fontSize: modoSimples ? 16 : 13, fontWeight: '700', color: C.muted }}>-{r.custoPontos} pts</Text>
              </View>
            ))}
          </View>
        </>
      )}

    </ScrollView>
  );
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 16, paddingBottom: 42 },

  banner: {
    backgroundColor: C.g800,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    marginBottom: 18,
  },
  bannerIconWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 11,
  },
  bannerTitulo: { fontSize: 19, fontWeight: '700', color: C.white, marginBottom: 5 },
  bannerSub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 12 },

  nivelCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 18,
  },
  nivelHead: { flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 15 },
  nivelBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.roxo,
    justifyContent: 'center', alignItems: 'center',
  },
  nivelBadgeNumero: { fontSize: 20, fontWeight: '700', color: C.white },
  nivelTitulo: { fontSize: 17, fontWeight: '700', color: C.text },
  nivelSub: { fontSize: 14, color: C.muted, marginTop: 3 },
  barraTrackRoxo: { height: 10, backgroundColor: C.roxoClaro, borderRadius: 5, overflow: 'hidden', marginBottom: 9 },
  barraFillRoxo: { height: '100%', backgroundColor: C.roxo, borderRadius: 5 },
  nivelHint: { fontSize: 14, color: C.text, fontWeight: '600', marginBottom: 2 },
  nivelDica: { fontSize: 12, color: C.muted },

  progressoCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    marginBottom: 22,
  },
  progressoHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  progressoLbl: { fontSize: 13, fontWeight: '700', color: C.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  progressoContagem: { fontSize: 20, fontWeight: '700', color: C.g700 },
  barraTrack: { height: 11, backgroundColor: C.w100, borderRadius: 6, overflow: 'hidden', marginBottom: 11 },
  barraFill: { height: '100%', backgroundColor: C.g500, borderRadius: 6 },
  progressoHint: { fontSize: 13, color: C.muted, marginBottom: 15 },

  dotsRow: { flexDirection: 'row', gap: 9, justifyContent: 'center' },
  dotConsulta: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.w50,
    justifyContent: 'center', alignItems: 'center',
  },
  dotConsultaPreenchida: { backgroundColor: C.g500, borderColor: C.g500 },

  secLabel: {
    fontSize: 14, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase',
    color: C.muted, marginBottom: 11, marginTop: 5, paddingLeft: 2,
  },
  secLabelRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 2,
  },
  secLabelContagem: { fontSize: 12, fontWeight: '700', color: C.g600, marginBottom: 11 },

  emptyCard: {
    backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border,
    padding: 26, alignItems: 'center', marginBottom: 22,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: C.muted, textAlign: 'center' },

  cupomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: C.ouroClaro, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.ouro,
    padding: 16, marginBottom: 11,
  },
  cupomIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: C.ouro,
  },
  cupomInfo: { flex: 1 },
  cupomTitulo: { fontSize: 16, fontWeight: '700', color: C.text },
  cupomSub: { fontSize: 13, color: C.muted, marginTop: 3 },
  btnResgatar: {
    backgroundColor: C.ouro, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 8,
  },
  btnResgatarText: { color: C.white, fontSize: 14, fontWeight: '700' },

  conquistasGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 11, marginBottom: 22,
  },
  conquistaCard: {
    width: '31%',
    backgroundColor: C.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.g200,
    padding: 11,
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
    borderWidth: 1, borderColor: C.border, marginBottom: 22, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 17 },
  statValor: { fontSize: 23, fontWeight: '700', color: C.g700 },
  statLabel: { fontSize: 11, color: C.muted, textAlign: 'center', marginTop: 4, paddingHorizontal: 4 },
  statDivisor: { width: 1, backgroundColor: C.border },

  historicoCard: {
    backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.border, overflow: 'hidden',
  },
  historicoRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 16 },
  historicoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  historicoTitulo: { fontSize: 14, fontWeight: '600', color: C.text },
  historicoData: { fontSize: 12, color: C.muted, marginTop: 2 },
});

/** Modo simples: ~35% maior que o padrão. Sem banner, sem ciclo de atendimentos, sem conquistas e sem estatísticas. */
const sSimples = StyleSheet.create({
  nivelCard: { padding: 27 },
  nivelBadge: { width: 70, height: 70, borderRadius: 35 },
  nivelBadgeNumero: { fontSize: 27 },
  nivelTitulo: { fontSize: 23 },
  nivelSub: { fontSize: 19 },
  barraTrackRoxo: { height: 14, borderRadius: 7 },
  nivelHint: { fontSize: 19 },

  secLabel: { fontSize: 19 },

  cupomCard: { padding: 22 },
  cupomIconWrap: { width: 65, height: 65, borderRadius: 33 },
  cupomTitulo: { fontSize: 22 },
  cupomSub: { fontSize: 18 },
  btnResgatar: { paddingHorizontal: 22, paddingVertical: 15 },
  btnResgatarText: { fontSize: 19 },

  historicoRow: { padding: 22 },
  historicoTitulo: { fontSize: 20 },
  historicoData: { fontSize: 17 },
});