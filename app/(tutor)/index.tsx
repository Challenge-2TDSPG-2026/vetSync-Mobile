import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { ESPECIES, obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { PetFoto } from '../../components/pet-foto/PetFoto';
import { PetSwitcher } from '../../components/PetSwitcher';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { DicaTela } from '../../components/ui/DicaTela';
import { statusExibicao, STATUS_EXIBICAO_BADGE, formatarDataEvento } from '../../utils/eventoStatus';
import type { AppTheme } from '../../constants/theme';

function calcularIdade(d: string): string {
  const nasc = new Date(d), hoje = new Date();
  const meses = (hoje.getFullYear() - nasc.getFullYear()) * 12 + (hoje.getMonth() - nasc.getMonth());
  if (meses < 1) return 'Menos de 1 mês';
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const a = Math.floor(meses / 12), m = meses % 12;
  return m > 0 ? `${a} ano${a > 1 ? 's' : ''} e ${m} mês${m > 1 ? 'es' : ''}` : `${a} ano${a > 1 ? 's' : ''}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { modoSimples } = useAccessibility();
  const { pets, petAtivo, eventos, carregandoEventos, carregando } = usePet();
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('tutor-dashboard');

  const eventosComStatus = useMemo(
    () => eventos.map(e => ({ ...e, statusExibicao: statusExibicao(e) })),
    [eventos]
  );
  const pendentes = eventosComStatus.filter(e => e.statusExibicao === 'AGENDADO');
  const concluidos = eventosComStatus.filter(e => e.statusExibicao === 'CONCLUIDO');
  const atrasados = eventosComStatus.filter(e => e.statusExibicao === 'ATRASADO');
  const limiteProximos = modoSimples ? 3 : 5;
  const proximos = [...pendentes, ...atrasados]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, limiteProximos);
  const especieInfo = ESPECIES.find(e => e.valor === petAtivo?.especie);

  if (carregando) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={s.semPetContainer}>
        <AppIcon name="paw" set="MaterialCommunityIcons" size={48} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
        <Text style={s.semPetTitulo}>Nenhum pet cadastrado ainda</Text>
        <Text style={s.semPetSub}>
          O cadastro do seu pet é feito pela nossa administração. Assim que
          estiver pronto, ele vai aparecer aqui automaticamente.
        </Text>
      </View>
    );
  }

  if (!petAtivo) return null;

  const artigoPet = petAtivo.sexo === 'femea' ? 'a' : 'o';

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.colors.surface} />}
    >

      <PetSwitcher />

      {dicaVisivel && (
        <DicaTela
          titulo="Sua central de cuidados"
          texto="Aqui você acompanha os próximos eventos de saúde do seu pet. Troque de pet no seletor acima e toque em qualquer evento pra ver os detalhes."
          accentColor={theme.colors.primary}
          onFechar={fecharDica}
          simples={modoSimples}
        />
      )}

      {/* Hero inspirado nos fluxos de cadastro: gradiente, selo e patinhas decorativas. */}
      <LinearGradient
        colors={[theme.colors.navigation, theme.colors.navigationAccent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.welcome, modoSimples && sSimples.welcome]}
      >
        <AppIcon
          name="paw"
          set="MaterialCommunityIcons"
          size={220}
          color="rgba(255,255,255,0.07)"
          style={s.welcomePawLarge}
        />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={15} color="rgba(191,233,213,0.36)" style={s.welcomePaw1} />
        <AppIcon name="paw" set="MaterialCommunityIcons" size={21} color="rgba(191,233,213,0.5)" style={s.welcomePaw2} />

        <View style={s.welcomeTop}>
          <View style={s.heroSealWrap}>
            <View style={s.heroSealGlowOuter} />
            <View style={s.heroSealGlowInner} />
            <View style={s.heroSeal}>
              <PetFoto
                pet={petAtivo}
                size={modoSimples ? 48 : 48}
                color={theme.colors.onNavigation}
                backgroundColor="transparent"
                accessibilityLabel={`Foto de ${petAtivo.nome}`}
              />
            </View>
          </View>
          <Pressable
            style={[s.welcomeBtn, modoSimples && sSimples.welcomeBtn]}
            onPress={() => router.push('/add-evento')}
            accessibilityRole="button"
            accessibilityLabel="Adicionar evento de saúde"
          >
            <Ionicons name="add" size={modoSimples ? 24 : 18} color={theme.colors.onNavigation} />
            <Text style={[s.welcomeBtnText, modoSimples && sSimples.welcomeBtnText]}>Evento</Text>
          </Pressable>
        </View>

        <View style={s.welcomeInfo}>
          <Text style={s.welcomeEyebrow}>CUIDADO DIÁRIO</Text>
          <Text style={[s.welcomeNome, modoSimples && sSimples.welcomeNome]}>Como está {artigoPet} {petAtivo.nome}?</Text>
          {!modoSimples && <Text style={s.welcomeSub}>Acompanhe cada cuidado e mantenha a saúde em dia.</Text>}
        </View>
      </LinearGradient>

      {/* Stats — no modo simples, só Pendentes e Atrasados (o que exige ação) */}
      <View style={[s.statsRow, modoSimples && sSimples.statsRow]}>
        {!modoSimples && (
          <>
            <StatCard styles={s} valor={concluidos.length} label="Realizados" accentColor={theme.colors.success} />
            <View style={s.statDivider} />
          </>
        )}
        <StatCard styles={s} valor={pendentes.length} label="Pendentes" accentColor={theme.colors.warning} simples={modoSimples} />
        <View style={s.statDivider} />
        <StatCard styles={s} valor={atrasados.length} label="Atrasados" accentColor={theme.colors.danger} simples={modoSimples} />
      </View>

      {/* Pet card — no modo simples, só nome e espécie */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardTitleWrap}>
            <View style={s.cardTitleIcon}>
              <AppIcon name="heart-outline" set="Ionicons" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[s.cardTitle, modoSimples && sSimples.cardTitle]}>Meu pet</Text>
          </View>
        </View>
        <View style={[s.petFeature, modoSimples && sSimples.petFeature]}>
          <AppIcon
            name="paw"
            set="MaterialCommunityIcons"
            size={126}
            color="rgba(26,122,82,0.08)"
            style={s.petPawMarca}
          />
          <View style={s.petTop}>
            <View style={[s.petAvatar, modoSimples && sSimples.petAvatar]}>
              <PetFoto
                pet={petAtivo}
                size={modoSimples ? 76 : 58}
                color={theme.colors.primary}
                backgroundColor="transparent"
                accessibilityLabel={`Foto de ${petAtivo.nome}`}
              />
            </View>
            <View style={s.petInfo}>
              <Text style={[s.petNome, modoSimples && sSimples.petNome]}>{petAtivo.nome}</Text>
              <View style={s.petTipoPill}>
                <AppIcon name="paw" set="MaterialCommunityIcons" size={12} color={theme.colors.primary} />
                <Text style={[s.petDetalhe, modoSimples && sSimples.petDetalhe]} numberOfLines={1}>
                  {especieInfo?.label ?? petAtivo.especie}{petAtivo.raca ? ` · ${petAtivo.raca}` : ''}
                </Text>
              </View>
            </View>
            {!modoSimples && (
              <Pressable
                style={s.btnProntuario}
                onPress={() => router.push('/(tutor)/agenda')}
                accessibilityRole="button"
                accessibilityLabel="Abrir agenda de saúde"
              >
                <AppIcon name="pulse-outline" set="Ionicons" size={15} color={theme.colors.primary} />
                <Text style={s.btnProntuarioText}>Agenda</Text>
              </Pressable>
            )}
          </View>
          {!modoSimples && (
            <View style={s.petMetas}>
              <View style={s.petMetaItem}>
                <Text style={s.petMetaLabel}>IDADE</Text>
                <Text style={s.petMetaValue}>{calcularIdade(petAtivo.dataNascimento)}</Text>
              </View>
              <View style={s.petMetaDivider} />
              <View style={s.petMetaItem}>
                <Text style={s.petMetaLabel}>PESO</Text>
                <Text style={s.petMetaValue}>{petAtivo.peso ? `${petAtivo.peso} kg` : 'Não informado'}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Próximos eventos */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <View style={s.cardTitleWrap}>
            <View style={s.cardTitleIcon}>
              <AppIcon name="calendar-outline" set="Ionicons" size={16} color={theme.colors.primary} />
            </View>
            <Text style={[s.cardTitle, modoSimples && sSimples.cardTitle]}>Próximos eventos</Text>
          </View>
          <Pressable onPress={() => router.push('/(tutor)/agenda')}>
            <Text style={[s.linkVer, modoSimples && sSimples.linkVer]}>Ver todos</Text>
          </Pressable>
        </View>

        {carregandoEventos ? (
          <View style={{ paddingHorizontal: 4 }}>
            <SkeletonList linhas={3} />
          </View>
        ) : proximos.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nenhum evento pendente"
            subtitle="Adicione eventos de saúde para o seu pet"
            accentColor={theme.colors.primary}
            style={[s.emptyEventos, modoSimples && sSimples.emptyEventos]}
          />
        ) : (
          proximos.map((e, idx) => {
            const visual = obterVisualTipoEvento(e.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[e.statusExibicao];
            const isLast = idx === proximos.length - 1;
            return (
              <View key={e.id} style={[s.eventoRow, modoSimples && sSimples.eventoRow, !isLast && s.eventoRowBorder]}>
                <View style={[s.eventoIcone, modoSimples && sSimples.eventoIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={modoSimples ? 24 : 18} color={theme.colors.onPrimary} />
                </View>
                <View style={s.eventoInfo}>
                  <Text style={[s.eventoTitulo, modoSimples && sSimples.eventoTitulo]}>{e.nomeTipoEvento}</Text>
                  <Text style={[s.eventoData, modoSimples && sSimples.eventoData]}>{formatarDataEvento(e.data)}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: sb.bg }]}>
                  <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* CTA button */}
      <Pressable style={[s.btnAdd, modoSimples && sSimples.btnAdd]} onPress={() => router.push('/add-evento')}>
        <Ionicons name="add-circle-outline" size={modoSimples ? 26 : 20} color={theme.colors.onPrimary} />
        <Text style={[s.btnAddText, modoSimples && sSimples.btnAddText]}>Adicionar evento de saúde</Text>
      </Pressable>

    </ScrollView>
  );
}

function StatCard({ styles, valor, label, accentColor, simples }: { styles: ReturnType<typeof createStyles>; valor: number; label: string; accentColor: string; simples?: boolean }) {
  return (
    <View style={[styles.statCard, simples && sSimples.statCard]}>
      <View style={styles.statLabelRow}>
        <View style={[styles.statAccent, { backgroundColor: accentColor }]} />
        <Text style={[styles.statLabel, simples && sSimples.statLabel]} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={[styles.statVal, simples && sSimples.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

/** Tamanhos "padrão" do app (antes chamados de modo idoso — agora são a base de todo mundo). */
const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 36 },

  loadingContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },

  semPetContainer: { flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 },
  semPetTitulo: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 8, textAlign: 'center' },
  semPetSub: { fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 19 },

  welcome: {
    minHeight: 218,
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    overflow: 'hidden',
  },
  welcomePawLarge: { position: 'absolute', right: -35, top: -22, transform: [{ rotate: '-18deg' }] },
  welcomePaw1: { position: 'absolute', right: 57, top: 22, transform: [{ rotate: '16deg' }] },
  welcomePaw2: { position: 'absolute', right: 28, top: 51, transform: [{ rotate: '-18deg' }] },
  welcomeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSealWrap: { width: 58, height: 58, justifyContent: 'center', alignItems: 'center' },
  heroSealGlowOuter: { position: 'absolute', width: 78, height: 78, borderRadius: 39, backgroundColor: 'rgba(242,200,121,0.12)' },
  heroSealGlowInner: { position: 'absolute', width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(242,200,121,0.16)' },
  heroSeal: { width: 48, height: 48, borderRadius: 15, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  welcomeInfo: { marginTop: 34, maxWidth: '86%' },
  welcomeEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: theme.colors.onNavigation, marginBottom: 7 },
  welcomeNome: { fontSize: 27, lineHeight: 33, fontWeight: '800', color: theme.colors.onNavigation, letterSpacing: -0.6 },
  welcomeSub: { fontSize: 14, lineHeight: 20, color: theme.colors.onNavigation, opacity: 0.88, marginTop: 8, maxWidth: 260 },
  welcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  welcomeBtnText: { color: theme.colors.onNavigation, fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    marginBottom: 18,
    paddingVertical: 14,
    shadowColor: theme.colors.text,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  statCard: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border, marginVertical: 3 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statAccent: { width: 6, height: 6, borderRadius: 3 },
  statLabel: { flexShrink: 1, fontSize: 10, fontWeight: '700', letterSpacing: 0.15, color: theme.colors.textSecondary },
  statVal: { fontSize: 28, fontWeight: '800', lineHeight: 33, marginTop: 5, letterSpacing: -0.5 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: theme.colors.text,
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardHead: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  cardTitleIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: theme.colors.surfaceSubtle, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
  linkVer: { fontSize: 13, color: theme.colors.primary, fontWeight: '700' },

  petFeature: { marginHorizontal: 14, marginBottom: 14, padding: 14, borderRadius: 18, backgroundColor: theme.colors.surfaceSubtle, overflow: 'hidden' },
  petPawMarca: { position: 'absolute', right: -19, bottom: -34, transform: [{ rotate: '-17deg' }] },
  petTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petAvatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  petInfo: { flex: 1, minWidth: 0 },
  petNome: { fontSize: 18, fontWeight: '800', color: theme.colors.text },
  petTipoPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: 5, maxWidth: '100%' },
  petDetalhe: { flexShrink: 1, fontSize: 12, color: theme.colors.primary, fontWeight: '600' },
  btnProntuario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  btnProntuarioText: { fontSize: 11, fontWeight: '800', color: theme.colors.primary },
  petMetas: { flexDirection: 'row', backgroundColor: theme.colors.surfaceElevated, borderRadius: 13, marginTop: 13, paddingVertical: 10 },
  petMetaItem: { flex: 1, minWidth: 0, paddingHorizontal: 11 },
  petMetaDivider: { width: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  petMetaLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.7, color: theme.colors.primary },
  petMetaValue: { fontSize: 12, fontWeight: '700', color: theme.colors.text, marginTop: 3 },

  eventoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 15, gap: 12 },
  eventoRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  eventoIcone: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  eventoData: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 3 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 34 },
  emptyEventos: { marginHorizontal: 14, marginBottom: 14, borderRadius: 18, backgroundColor: theme.colors.surfaceSubtle, borderWidth: 1, borderColor: theme.colors.border, borderStyle: 'dashed' },
  emptyOrb: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.colors.successBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 11 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'center' },

  btnAdd: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  btnAddText: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700' },
});

/** Modo simples: ~35% maior que o padrão, com bem menos conteúdo por tela. */
const sSimples = StyleSheet.create({
  welcome: { padding: 30 },
  welcomeNome: { fontSize: 30 },
  welcomeBtn: { paddingHorizontal: 19, paddingVertical: 14 },
  welcomeBtnText: { fontSize: 19 },

  statsRow: { paddingVertical: 18 },
  statCard: { paddingVertical: 0 },
  statLabel: { fontSize: 15 },
  statVal: { fontSize: 43, lineHeight: 46 },

  cardTitle: { fontSize: 23 },
  linkVer: { fontSize: 20 },

  petFeature: { marginHorizontal: 18, marginBottom: 18, padding: 21 },
  petAvatar: { width: 76, height: 76, borderRadius: 38 },
  petNome: { fontSize: 24 },
  petDetalhe: { fontSize: 19 },

  eventoRow: { paddingVertical: 22 },
  eventoIcone: { width: 62, height: 62, borderRadius: 31 },
  eventoTitulo: { fontSize: 22 },
  eventoData: { fontSize: 19 },
  emptyEventos: { marginHorizontal: 18, marginBottom: 18, paddingVertical: 42 },

  btnAdd: { paddingVertical: 24 },
  btnAddText: { fontSize: 22 },
});