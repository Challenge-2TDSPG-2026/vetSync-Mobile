import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePet } from '../../context/PetContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { ESPECIES, obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { PetSwitcher } from '../../components/PetSwitcher';
import { statusExibicao, STATUS_EXIBICAO_BADGE, formatarDataEvento } from '../../utils/eventoStatus';

const C = {
  g900: '#0a2218', g800: '#0e3326', g700: '#155c3f', g600: '#1a7a52',
  g500: '#22a06b', g400: '#3db87e', g200: '#a8e6c7', g100: '#d4f2e4', g50: '#edfaf3',
  cream: '#fafaf8', w50: '#f9f7f4', w100: '#f0ece5', w200: '#e0d8ce',
  w400: '#b8a99a', w800: '#3d3028',
  text: '#1a1512', muted: '#7a6a5e', border: '#e8e2da', white: '#fff',
  danger: '#dc3545', dangerLight: '#fff5f5', warn: '#e67e22', info: '#2563eb',
};

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
  const { modoIdoso } = useAccessibility();
  const { pets, petAtivo, eventos, carregandoEventos, carregando } = usePet();

  const eventosComStatus = useMemo(
    () => eventos.map(e => ({ ...e, statusExibicao: statusExibicao(e) })),
    [eventos]
  );
  const pendentes = eventosComStatus.filter(e => e.statusExibicao === 'AGENDADO');
  const concluidos = eventosComStatus.filter(e => e.statusExibicao === 'CONCLUIDO');
  const atrasados = eventosComStatus.filter(e => e.statusExibicao === 'ATRASADO');
  const proximos = [...pendentes, ...atrasados]
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5);
  const especieInfo = ESPECIES.find(e => e.valor === petAtivo?.especie);

  if (carregando) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator color={C.g600} size="large" />
      </View>
    );
  }

  if (pets.length === 0) {
    return (
      <View style={s.semPetContainer}>
        <AppIcon name="paw" set="MaterialCommunityIcons" size={48} color={C.muted} style={{ marginBottom: 16 }} />
        <Text style={s.semPetTitulo}>Nenhum pet cadastrado ainda</Text>
        <Text style={s.semPetSub}>
          O cadastro do seu pet é feito pela nossa administração. Assim que
          estiver pronto, ele vai aparecer aqui automaticamente.
        </Text>
      </View>
    );
  }

  if (!petAtivo) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>

      <PetSwitcher />

      {/* Welcome banner */}
      <View style={[s.welcome, modoIdoso && sIdoso.welcome]}>
        <AppIcon
          name={especieInfo?.icon ?? 'paw'}
          set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
          size={modoIdoso ? 44 : 36}
          color={C.white}
        />
        <View style={s.welcomeInfo}>
          <Text style={[s.welcomeNome, modoIdoso && sIdoso.welcomeNome]}>Olá, {petAtivo.nome}!</Text>
          <Text style={[s.welcomeSub, modoIdoso && sIdoso.welcomeSub]}>Gerencie a saúde do seu pet em um só lugar.</Text>
        </View>
        <Pressable style={[s.welcomeBtn, modoIdoso && sIdoso.welcomeBtn]} onPress={() => router.push('/add-evento')}>
          <Text style={[s.welcomeBtnText, modoIdoso && sIdoso.welcomeBtnText]}>+ Evento</Text>
        </Pressable>
      </View>

      {/* Stats */}
      <View style={[s.statsRow, modoIdoso && sIdoso.statsRow]}>
        <StatCard valor={pendentes.length} label="Pendentes" accentColor={C.warn} idoso={modoIdoso} />
        <StatCard valor={concluidos.length} label="Realizados" accentColor={C.g500} idoso={modoIdoso} />
        <StatCard valor={atrasados.length} label="Atrasados" accentColor={C.danger} idoso={modoIdoso} />
      </View>

      {/* Pet card */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={[s.cardTitle, modoIdoso && sIdoso.cardTitle]}>Visão Geral do {petAtivo.nome}</Text>
        </View>
        <View style={[s.petRow, modoIdoso && sIdoso.petRow]}>
          <View style={[s.petAvatar, modoIdoso && sIdoso.petAvatar]}>
            <AppIcon
              name={especieInfo?.icon ?? 'paw'}
              set={especieInfo?.iconSet ?? 'MaterialCommunityIcons'}
              size={modoIdoso ? 28 : 22}
              color={C.g600}
            />
          </View>
          <View style={s.petInfo}>
            <Text style={[s.petNome, modoIdoso && sIdoso.petNome]}>{petAtivo.nome}</Text>
            <Text style={[s.petDetalhe, modoIdoso && sIdoso.petDetalhe]}>{petAtivo.especie}{petAtivo.raca ? ` • ${petAtivo.raca}` : ''}</Text>
            <Text style={[s.petDetalhe, modoIdoso && sIdoso.petDetalhe]}>Idade: {calcularIdade(petAtivo.dataNascimento)}</Text>
            <Text style={[s.petDetalhe, modoIdoso && sIdoso.petDetalhe]}>Peso: {petAtivo.peso ? `${petAtivo.peso} kg` : '—'}</Text>
          </View>
          <Pressable style={s.btnProntuario} onPress={() => router.push('/(tutor)/agenda')}>
            <AppIcon name="pulse-outline" set="Ionicons" size={14} color={C.text} style={{ marginRight: 4 }} />
            <Text style={s.btnProntuarioText}>Agenda</Text>
          </Pressable>
        </View>
      </View>

      {/* Próximos eventos */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={[s.cardTitle, modoIdoso && sIdoso.cardTitle]}>Próximos Eventos</Text>
          <Pressable onPress={() => router.push('/(tutor)/agenda')}>
            <Text style={[s.linkVer, modoIdoso && sIdoso.linkVer]}>Ver todos</Text>
          </Pressable>
        </View>

        {carregandoEventos ? (
          <View style={s.empty}>
            <ActivityIndicator color={C.g600} />
          </View>
        ) : proximos.length === 0 ? (
          <View style={s.empty}>
            <AppIcon name="calendar-outline" set="Ionicons" size={36} color={C.muted} style={s.emptyIcon} />
            <Text style={s.emptyTitle}>Nenhum evento pendente</Text>
            <Text style={s.emptySub}>Adicione eventos de saúde para o seu pet</Text>
          </View>
        ) : (
          proximos.map((e, idx) => {
            const visual = obterVisualTipoEvento(e.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[e.statusExibicao];
            const isLast = idx === proximos.length - 1;
            return (
              <View key={e.id} style={[s.eventoRow, modoIdoso && sIdoso.eventoRow, !isLast && s.eventoRowBorder]}>
                <View style={[s.eventoIcone, modoIdoso && sIdoso.eventoIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={modoIdoso ? 20 : 16} color={C.white} />
                </View>
                <View style={s.eventoInfo}>
                  <Text style={[s.eventoTitulo, modoIdoso && sIdoso.eventoTitulo]}>{e.nomeTipoEvento}</Text>
                  <Text style={[s.eventoData, modoIdoso && sIdoso.eventoData]}>{formatarDataEvento(e.data)}</Text>
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
      <Pressable style={[s.btnAdd, modoIdoso && sIdoso.btnAdd]} onPress={() => router.push('/add-evento')}>
        <Ionicons name="add-circle-outline" size={modoIdoso ? 22 : 18} color="#fff" />
        <Text style={[s.btnAddText, modoIdoso && sIdoso.btnAddText]}>Adicionar evento de saúde</Text>
      </Pressable>

    </ScrollView>
  );
}

function StatCard({ valor, label, accentColor, idoso }: { valor: number; label: string; accentColor: string; idoso?: boolean }) {
  return (
    <View style={[s.statCard, idoso && sIdoso.statCard, { borderBottomColor: accentColor }]}>
      <Text style={[s.statLabel, idoso && sIdoso.statLabel]}>{label}</Text>
      <Text style={[s.statVal, idoso && sIdoso.statVal, { color: accentColor }]}>{valor}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.cream },
  content: { padding: 20, paddingBottom: 32 },

  loadingContainer: { flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center' },

  semPetContainer: { flex: 1, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', padding: 32 },
  semPetTitulo: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
  semPetSub: { fontSize: 13, color: C.muted, textAlign: 'center', lineHeight: 19 },

  welcome: {
    backgroundColor: C.g800,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  welcomeInfo: { flex: 1 },
  welcomeNome: { fontSize: 18, fontWeight: '700', color: C.white, letterSpacing: -0.3 },
  welcomeSub: { fontSize: 12, color: 'rgba(168,230,199,0.85)', marginTop: 3 },
  welcomeBtn: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  welcomeBtnText: { color: C.white, fontSize: 12, fontWeight: '700' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 14,
    borderBottomWidth: 3,
  },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase', color: C.muted, marginBottom: 6 },
  statVal: { fontSize: 28, fontWeight: '700', lineHeight: 30 },

  card: { backgroundColor: C.white, borderWidth: 1, borderColor: C.border, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  cardHead: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.w50,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: C.text },
  linkVer: { fontSize: 13, color: C.g600, fontWeight: '600' },

  petRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.g100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: { flex: 1 },
  petNome: { fontSize: 15, fontWeight: '700', color: C.text },
  petDetalhe: { fontSize: 12, color: C.muted, marginTop: 2 },
  btnProntuario: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  btnProntuarioText: { fontSize: 12, fontWeight: '600', color: C.text },

  eventoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  eventoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  eventoIcone: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 13, fontWeight: '600', color: C.text },
  eventoData: { fontSize: 12, color: C.muted, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyIcon: { marginBottom: 10 },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
  emptySub: { fontSize: 12, color: C.muted },

  btnAdd: {
    backgroundColor: C.g600,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnAddText: { color: C.white, fontSize: 14, fontWeight: '700' },
});

/** Overrides aplicados por cima de `s` quando o modo idoso está ativo. */
const sIdoso = StyleSheet.create({
  welcome: { padding: 22 },
  welcomeNome: { fontSize: 22 },
  welcomeSub: { fontSize: 14 },
  welcomeBtn: { paddingHorizontal: 14, paddingVertical: 10 },
  welcomeBtnText: { fontSize: 14 },

  statsRow: { flexWrap: 'wrap' },
  statCard: { minWidth: '47%', flexBasis: '47%' },
  statLabel: { fontSize: 11 },
  statVal: { fontSize: 32, lineHeight: 34 },

  cardTitle: { fontSize: 17 },
  linkVer: { fontSize: 15 },

  petRow: { padding: 20 },
  petAvatar: { width: 56, height: 56, borderRadius: 28 },
  petNome: { fontSize: 18 },
  petDetalhe: { fontSize: 14 },

  eventoRow: { paddingVertical: 16 },
  eventoIcone: { width: 46, height: 46, borderRadius: 23 },
  eventoTitulo: { fontSize: 16 },
  eventoData: { fontSize: 14 },

  btnAdd: { paddingVertical: 18 },
  btnAddText: { fontSize: 16 },
});