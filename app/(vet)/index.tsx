import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useMeusResgates } from '../../hooks/useRecompensas';
import { useRecarregarDados } from '../../hooks/useRecarregarDados';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { obterVisualTipoEvento } from '../../constants';
import { AppIcon } from '../../components/AppIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { SkeletonList, SkeletonCard } from '../../components/ui/Skeleton';
import { DicaTela } from '../../components/ui/DicaTela';
import { STATUS_EXIBICAO_BADGE, parseDataEvento, statusExibicao } from '../../utils/eventoStatus';
import type { AppTheme } from '../../constants/theme';
import { useVetDesktop } from '../../components/vet/desktop/useVetDesktop';
import { VetDashboardDesktop } from '../../components/vet/desktop/VetDashboardDesktop';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

function dataPorExtenso(d: Date) {
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

function horaCurta(iso: string) {
  return parseDataEvento(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Texto de quando o atendimento acontece: "em 25 min", "hoje às 14:00", "amanhã às 09:00" ou "23 de outubro às 09:00". */
function quandoAcontece(iso: string) {
  const data = parseDataEvento(iso);
  const agora = new Date();
  const hora = horaCurta(iso);
  const minutos = Math.round((data.getTime() - agora.getTime()) / 60000);
  if (mesmoDia(data, agora)) {
    if (iso.length > 10 && minutos > 0 && minutos < 60) return `em ${minutos} min`;
    return iso.length > 10 ? `hoje às ${hora}` : 'hoje';
  }
  const amanha = new Date(agora); amanha.setDate(agora.getDate() + 1);
  const complemento = iso.length > 10 ? ` às ${hora}` : '';
  if (mesmoDia(data, amanha)) return `amanhã${complemento}`;
  return `${data.getDate()} de ${MESES[data.getMonth()]}${complemento}`;
}

/** Desktop (web larga) usa o painel novo; mobile usa o layout focado no próximo atendimento. */
export default function VetDashboardScreen() {
  const desktop = useVetDesktop();
  return desktop ? <VetDashboardDesktop /> : <VetDashboardMobile />;
}

function VetDashboardMobile() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { sessao } = useAuth();
  const { veterinarioAtivo, eventos, eventosAgendados, eventosDeHoje, pacientes, carregando } = useVet();
  const { data: resgates = [] } = useMeusResgates(true);
  const resgatesPendentes = resgates.filter(r => r.status === 'PENDENTE');
  const pacientesComPendencia = pacientes.filter(p => p.eventos.some(e => e.status === 'AGENDADO')).length;
  const atrasados = eventos.filter(e => statusExibicao(e) === 'ATRASADO');
  const { atualizando, aoAtualizar } = useRecarregarDados();
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-painel');

  const nome = veterinarioAtivo?.nome ?? sessao?.nome ?? 'Veterinário';
  const iniciais = nome[0]?.toUpperCase() ?? '?';

  const agendadosOrdenados = useMemo(
    () => [...eventosAgendados].sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime()),
    [eventosAgendados],
  );
  const proximo = agendadosOrdenados.find(e => statusExibicao(e) !== 'ATRASADO');
  const petDoEvento = (petId: number | string) => pacientes.find(p => String(p.pet.id) === String(petId))?.pet;
  const petProximo = proximo ? petDoEvento(proximo.petId) : undefined;

  const restoDoDia = useMemo(() => {
    const ids = new Set<string>();
    const lista = [...eventosDeHoje, ...atrasados].filter(e => {
      const chave = String(e.id);
      if (ids.has(chave) || (proximo && chave === String(proximo.id))) return false;
      ids.add(chave);
      return true;
    });
    return lista.sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime()).slice(0, 5);
  }, [eventosDeHoje, atrasados, proximo]);

  if (carregando) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <SkeletonCard height={56} borderRadius={16} style={{ marginBottom: 16 }} />
        <SkeletonCard height={170} borderRadius={22} style={{ marginBottom: 16 }} />
        <SkeletonList linhas={3} />
      </ScrollView>
    );
  }

  const chips = [
    { label: 'Hoje', valor: eventosDeHoje.length, cor: theme.colors.success, rota: '/(vet)/consultas' as const },
    { label: 'Atrasados', valor: atrasados.length, cor: theme.colors.danger, rota: '/(vet)/consultas' as const },
    { label: 'Retornos', valor: pacientesComPendencia, cor: theme.colors.info, rota: '/(vet)/pacientes' as const },
    { label: 'Resgates', valor: resgatesPendentes.length, cor: theme.colors.warning, rota: '/(vet)/resgates' as const },
  ];

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={aoAtualizar} tintColor={theme.colors.primary} colors={[theme.colors.primary]} progressBackgroundColor={theme.pages.vetDashboard.card} />}
    >
      <View style={s.topo}>
        <View style={s.topoTexto}>
          <Text style={s.data}>{dataPorExtenso(new Date())}</Text>
          <Text style={s.saudacao} numberOfLines={1}>Olá, {nome}</Text>
        </View>
        <Pressable style={s.avatar} onPress={() => router.push('/(vet)/perfil')} accessibilityRole="button" accessibilityLabel="Abrir minha conta">
          <Text style={s.avatarText}>{iniciais}</Text>
        </Pressable>
      </View>

      {dicaVisivel && (
        <DicaTela
          titulo="Seu painel"
          texto="Aqui você vê o próximo atendimento, o que está pendente e o resto do dia. Use o menu abaixo para consultas, pacientes e resgates."
          accentColor={theme.colors.primary}
          onFechar={fecharDica}
        />
      )}

      {proximo ? (
        <View style={s.hero}>
          <Text style={s.heroEyebrow}>PRÓXIMO ATENDIMENTO • {quandoAcontece(proximo.data).toUpperCase()}</Text>
          <View style={s.heroBody}>
            <View style={s.heroAvatar}>
              <AppIcon name="paw" set="Ionicons" size={24} color={theme.pages.vetDashboard.heroText} />
            </View>
            <View style={s.heroInfo}>
              <Text style={s.heroPet} numberOfLines={1}>{petProximo?.nome ?? 'Paciente'}</Text>
              <Text style={s.heroDetalhe} numberOfLines={2}>
                {proximo.nomeTipoEvento}{petProximo?.tutor?.nome ? ` • ${petProximo.tutor.nome}` : ''}{proximo.data.length > 10 ? ` • ${horaCurta(proximo.data)}` : ''}
              </Text>
            </View>
          </View>
          <View style={s.heroActions}>
            <Pressable
              style={({ pressed }) => [s.heroPrimary, pressed && s.pressed]}
              onPress={() => router.push(`/paciente/${proximo.petId}`)}
              accessibilityRole="button"
              accessibilityLabel={`Iniciar atendimento de ${petProximo?.nome ?? 'paciente'}`}
              accessibilityHint="Abre a ficha do paciente"
            >
              <Text style={s.heroPrimaryText}>Iniciar atendimento</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [s.heroSecondary, pressed && s.pressed]}
              onPress={() => router.push('/(vet)/consultas')}
              accessibilityRole="button"
              accessibilityLabel="Abrir agenda"
            >
              <Text style={s.heroSecondaryText}>Agenda</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={s.heroVazio}>
          <Text style={s.heroEyebrow}>PRÓXIMO ATENDIMENTO</Text>
          <Text style={s.heroVazioTitulo}>Nenhum atendimento agendado</Text>
          <Text style={s.heroVazioTexto}>Quando houver um novo agendamento, ele aparece aqui em destaque.</Text>
          <Pressable style={({ pressed }) => [s.heroPrimary, s.heroVazioBtn, pressed && s.pressed]} onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Ver consultas">
            <Text style={s.heroPrimaryText}>Ver consultas</Text>
          </Pressable>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsScroll} contentContainerStyle={s.chipsContent}>
        {chips.map(chip => (
          <Pressable
            key={chip.label}
            style={({ pressed }) => [s.chip, pressed && s.pressed]}
            onPress={() => router.push(chip.rota)}
            accessibilityRole="button"
            accessibilityLabel={`${chip.label}: ${chip.valor}`}
          >
            <Text style={s.chipLabel}>{chip.label.toUpperCase()}</Text>
            <Text style={[s.chipValor, { color: chip.valor > 0 || chip.label === 'Hoje' ? chip.cor : theme.colors.textSecondary }]}>{chip.valor}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={s.secaoHead}>
        <Text style={s.secaoTitulo} accessibilityRole="header">Resto do dia</Text>
        <Pressable onPress={() => router.push('/(vet)/consultas')} accessibilityRole="button" accessibilityLabel="Ver agenda">
          <Text style={s.linkVer}>Ver agenda</Text>
        </Pressable>
      </View>
      <View style={s.card}>
        {restoDoDia.length === 0 ? (
          <EmptyState icon="calendar-outline" title="Nada mais para hoje" accentColor={theme.colors.info} variant="plain" />
        ) : (
          restoDoDia.map((e, idx) => {
            const visual = obterVisualTipoEvento(e.nomeTipoEvento);
            const sb = STATUS_EXIBICAO_BADGE[statusExibicao(e)];
            const pet = petDoEvento(e.petId);
            const hora = e.data.length > 10 ? horaCurta(e.data) : '';
            return (
              <Pressable
                key={e.id}
                style={[s.linha, idx < restoDoDia.length - 1 && s.linhaBorda]}
                onPress={() => router.push(`/paciente/${e.petId}`)}
                accessibilityRole="button"
                accessibilityLabel={`${pet?.nome ?? 'Paciente'}, ${e.nomeTipoEvento}, ${sb.label}`}
                accessibilityHint="Abre a ficha do paciente"
              >
                <View style={[s.linhaIcone, { backgroundColor: visual.cor }]}>
                  <AppIcon name={visual.icon} set={visual.iconSet} size={16} color={theme.colors.onPrimary} />
                </View>
                <View style={s.linhaInfo}>
                  <Text style={s.linhaTitulo} numberOfLines={1}>{pet?.nome ? `${pet.nome} • ${e.nomeTipoEvento}` : e.nomeTipoEvento}</Text>
                  <Text style={s.linhaSub} numberOfLines={1}>{[hora, pet?.tutor?.nome].filter(Boolean).join(' • ') || 'Sem horário definido'}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: sb.bg }]}>
                  <Text style={[s.badgeText, { color: sb.color }]}>{sb.label}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </View>

      <View style={s.secaoHead}>
        <Text style={s.secaoTitulo} accessibilityRole="header">Pacientes recentes</Text>
        <Pressable onPress={() => router.push('/(vet)/pacientes')} accessibilityRole="button" accessibilityLabel="Ver todos os pacientes">
          <Text style={s.linkVer}>Ver todos</Text>
        </Pressable>
      </View>
      {pacientes.length === 0 ? (
        <View style={s.card}>
          <EmptyState icon="paw-outline" title="Nenhum paciente ainda" accentColor={theme.colors.primary} variant="plain" />
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pacientesContent}>
          {pacientes.slice(0, 4).map(({ pet }) => (
            <Pressable key={pet.id} style={s.pacienteItem} onPress={() => router.push(`/paciente/${pet.id}`)} accessibilityRole="button" accessibilityLabel={`${pet.nome}, abrir ficha`}>
              <View style={s.pacienteAvatar}>
                <AppIcon name="paw" set="Ionicons" size={22} color={theme.colors.primary} />
              </View>
              <Text style={s.pacienteNome} numberOfLines={1}>{pet.nome}</Text>
            </Pressable>
          ))}
          {pacientes.length > 4 && (
            <Pressable style={s.pacienteItem} onPress={() => router.push('/(vet)/pacientes')} accessibilityRole="button" accessibilityLabel={`Ver mais ${pacientes.length - 4} pacientes`}>
              <View style={[s.pacienteAvatar, s.pacienteMais]}>
                <Text style={s.pacienteMaisText}>+{pacientes.length - 4}</Text>
              </View>
              <Text style={s.pacienteNome}>mais</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: AppTheme) => {
  const page = theme.pages.vetDashboard;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, paddingBottom: 44 },

    topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    topoTexto: { flex: 1, paddingRight: 12 },
    data: { fontSize: 12, color: theme.colors.textSecondary },
    saudacao: { fontSize: 21, fontWeight: '800', color: theme.colors.text, letterSpacing: -0.3, marginTop: 2 },
    avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: page.heroBackground, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 16, fontWeight: '800', color: theme.colors.brandAccent },

    hero: { backgroundColor: page.heroBackground, borderRadius: 22, padding: 18, marginBottom: 14, elevation: 3 },
    heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, color: theme.colors.brandAccent },
    heroBody: { flexDirection: 'row', alignItems: 'center', gap: 13, marginVertical: 14 },
    heroAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
    heroInfo: { flex: 1 },
    heroPet: { fontSize: 20, fontWeight: '800', color: page.heroText },
    heroDetalhe: { fontSize: 12, color: page.heroText, opacity: 0.82, marginTop: 3, lineHeight: 17 },
    heroActions: { flexDirection: 'row', gap: 10 },
    heroPrimary: { flex: 1, backgroundColor: theme.colors.brandAccent, borderRadius: 13, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
    heroPrimaryText: { fontSize: 14, fontWeight: '800', color: '#0a2218' },
    heroSecondary: { width: 92, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    heroSecondaryText: { fontSize: 14, fontWeight: '800', color: page.heroText },
    heroVazio: { backgroundColor: page.heroBackground, borderRadius: 22, padding: 18, marginBottom: 14 },
    heroVazioTitulo: { fontSize: 18, fontWeight: '800', color: page.heroText, marginTop: 10 },
    heroVazioTexto: { fontSize: 12, color: page.heroText, opacity: 0.8, marginTop: 4, lineHeight: 17 },
    heroVazioBtn: { flex: 0, marginTop: 14 },

    chipsScroll: { marginHorizontal: -20, marginBottom: 6 },
    chipsContent: { paddingHorizontal: 20, gap: 8 },
    chip: { backgroundColor: page.card, borderWidth: 1, borderColor: page.border, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 16, elevation: 1 },
    chipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, color: theme.colors.textSecondary },
    chipValor: { fontSize: 20, fontWeight: '800', marginTop: 2 },

    secaoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, marginBottom: 10 },
    secaoTitulo: { fontSize: 15, fontWeight: '800', color: theme.colors.text },
    linkVer: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },

    card: { backgroundColor: page.card, borderRadius: 18, borderWidth: 1, borderColor: page.border, overflow: 'hidden', elevation: 1 },
    linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
    linhaBorda: { borderBottomWidth: 1, borderBottomColor: page.border },
    linhaIcone: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    linhaInfo: { flex: 1, minWidth: 0 },
    linhaTitulo: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    linhaSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 2 },
    badge: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 3 },
    badgeText: { fontSize: 11, fontWeight: '700' },

    pacientesContent: { gap: 14, paddingRight: 4 },
    pacienteItem: { alignItems: 'center', width: 62 },
    pacienteAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: theme.colors.successBackground, alignItems: 'center', justifyContent: 'center' },
    pacienteMais: { backgroundColor: page.cardSecondary },
    pacienteMaisText: { fontSize: 16, fontWeight: '800', color: theme.colors.textSecondary },
    pacienteNome: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 5 },

    pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  });
};
