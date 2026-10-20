import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useTheme } from '../../context/ThemeContext';
import {
  clinicaService,
  type LogoClinica,
  type PerfilClinica,
  type ServicoClinica,
} from '../../services/clinicaService';
import { mensagemDeErro } from '../../services/api/errorMessages';
import { mostrarToast } from '../../components/ui/Toast';
import { EmptyState } from '../../components/ui/EmptyState';
import type { AppTheme } from '../../constants/theme';

const DIAS = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

function obterDiaSemanaHoje(): number {
  const dia = new Date().getDay();
  return dia === 0 ? 7 : dia;
}

function formatarEndereco(perfil: PerfilClinica): string | null {
  const cidadeUf = [perfil.cidade, perfil.uf].filter(Boolean).join(', ');
  return [perfil.endereco, cidadeUf].filter(Boolean).join(' · ') || null;
}

export default function MinhaClinicaScreen() {
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [perfil, setPerfil] = useState<PerfilClinica | null>(null);
  const [servicos, setServicos] = useState<ServicoClinica[]>([]);
  const [logo, setLogo] = useState<LogoClinica | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const ativoRef = useRef(true);
  const logoRef = useRef<LogoClinica | null>(null);

  const carregar = useCallback(async () => {
    try {
      const [perfilCarregado, servicosCarregados] = await Promise.all([
        clinicaService.perfil(),
        clinicaService.listarServicos(),
      ]);

      let logoCarregada: LogoClinica | null = null;
      if (perfilCarregado.possuiLogo) {
        try {
          logoCarregada = await clinicaService.carregarLogo();
        } catch {
          // A identidade e as informações da clínica continuam úteis sem a logo.
        }
      }

      if (!ativoRef.current) {
        logoCarregada?.liberar();
        return;
      }

      logoRef.current?.liberar();
      logoRef.current = logoCarregada;
      setLogo(logoCarregada);
      setPerfil(perfilCarregado);
      setServicos(servicosCarregados);
    } catch (falha) {
      if (ativoRef.current) {
        setErro(mensagemDeErro(falha, 'Confira sua conexão e tente novamente.'));
      }
    } finally {
      if (ativoRef.current) {
        setCarregando(false);
        setAtualizando(false);
      }
    }
  }, []);

  useEffect(() => {
    ativoRef.current = true;
    const timer = setTimeout(() => void carregar(), 0);
    return () => {
      clearTimeout(timer);
      ativoRef.current = false;
      logoRef.current?.liberar();
      logoRef.current = null;
    };
  }, [carregar]);

  async function ligarParaClinica() {
    if (!perfil?.telefone) return;
    try {
      await Linking.openURL(`tel:${perfil.telefone.replace(/[^\d+]/g, '')}`);
    } catch {
      mostrarToast('erro', 'Não foi possível iniciar a ligação', 'Tente novamente pelo aplicativo de telefone.');
    }
  }

  function atualizar() {
    setErro(null);
    setAtualizando(true);
    void carregar();
  }

  function tentarNovamente() {
    setErro(null);
    setCarregando(true);
    void carregar();
  }

  const endereco = perfil ? formatarEndereco(perfil) : null;
  const diaHoje = obterDiaSemanaHoje();
  const horariosHoje = perfil?.horarios.filter(horario => horario.diaSemana === diaHoje) ?? [];
  const abertaHoje = horariosHoje.length > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizar}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <ImageBackground
          source={require('../../assets/images/clinic.png')}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel="Veterinária recebendo um pet em uma clínica"
        >
          <LinearGradient
            colors={['rgba(5, 25, 18, 0.18)', 'rgba(5, 25, 18, 0.28)', 'rgba(5, 25, 18, 0.91)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={[styles.backButton, { top: Math.max(insets.top, 14) }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>

          <View style={styles.heroContent}>
            <View style={styles.brandRow}>
              <View style={styles.logoFrame}>
                {logo ? (
                  <Image
                    source={{ uri: logo.uri, headers: logo.headers }}
                    style={styles.logo}
                    resizeMode="contain"
                    accessibilityLabel={`Logo da clínica ${perfil?.nome ?? ''}`}
                  />
                ) : (
                  <Ionicons name="medical" size={modoSimples ? 32 : 26} color={theme.colors.primary} />
                )}
              </View>
              <View style={styles.heroCopy}>
                <Text style={[styles.eyebrow, modoSimples && stylesSimple.eyebrow]}>SUA CLÍNICA</Text>
                <Text style={[styles.heroTitle, modoSimples && stylesSimple.heroTitle]} numberOfLines={2}>
                  {carregando ? 'Conheça sua clínica' : perfil?.nome ?? 'Clínica não encontrada'}
                </Text>
                {perfil?.cidade ? (
                  <View style={styles.locationLine}>
                    <Ionicons name="location-outline" size={15} color={theme.colors.onPrimary} />
                    <Text style={[styles.locationText, modoSimples && stylesSimple.locationText]}>
                      {[perfil.cidade, perfil.uf].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {perfil ? (
              <View style={[styles.openBadge, { backgroundColor: abertaHoje ? theme.colors.successBackground : theme.pages.shared.cardSecondary }]}>
                <View style={[styles.openDot, { backgroundColor: abertaHoje ? theme.colors.success : theme.colors.textMuted }]} />
                <Text style={[styles.openBadgeText, { color: abertaHoje ? theme.colors.success : theme.colors.textSecondary }]}>
                  {abertaHoje ? 'Atende hoje' : 'Sem horário hoje'}
                </Text>
                {horariosHoje.length ? (
                  <Text style={styles.openHours}>
                    {horariosHoje.map(horario => `${horario.inicio}–${horario.fim}`).join(' · ')}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {carregando ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.loadingText}>Carregando informações da clínica...</Text>
            </View>
          ) : erro ? (
            <View style={styles.errorCard}>
              <View style={styles.stateIcon}>
                <Ionicons name="cloud-offline-outline" size={25} color={theme.colors.danger} />
              </View>
              <Text style={[styles.stateTitle, modoSimples && stylesSimple.stateTitle]}>
                Não foi possível carregar a clínica
              </Text>
              <Text style={[styles.stateDescription, modoSimples && stylesSimple.stateDescription]}>
                {erro}
              </Text>
              <Pressable
                style={styles.retryButton}
                onPress={tentarNovamente}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar as informações novamente"
              >
                <Ionicons name="refresh" size={18} color={theme.colors.onPrimary} />
                <Text style={styles.primaryButtonText}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : perfil ? (
            <>
              <View style={styles.introBlock}>
                <Text style={[styles.pageTitle, modoSimples && stylesSimple.pageTitle]}>
                  Conheça a clínica
                </Text>
                <Text style={[styles.pageIntro, modoSimples && stylesSimple.pageIntro]}>
                  Consulte os contatos, os horários e os serviços disponíveis para o seu pet.
                </Text>
              </View>

              <View style={styles.quickActions}>
                <Pressable
                  style={[styles.quickAction, styles.quickActionPrimary]}
                  onPress={() => router.push('/(tutor)/agendar-servico')}
                  accessibilityRole="button"
                  accessibilityLabel="Agendar um serviço"
                >
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.onPrimary} />
                  <Text style={styles.quickActionPrimaryText}>Agendar</Text>
                </Pressable>
                <Pressable
                  style={styles.quickAction}
                  onPress={() => router.push('/(tutor)/mensagens-clinica')}
                  accessibilityRole="button"
                  accessibilityLabel="Conversar com a clínica"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.quickActionText}>Conversar</Text>
                </Pressable>
              </View>

              <SectionTitle icon="location-outline" title="Endereço e contato" styles={styles} simples={modoSimples} />
              <View style={styles.card}>
                <InfoRow
                  icon="navigate-outline"
                  title="Endereço"
                  value={endereco ?? 'Endereço ainda não informado'}
                  styles={styles}
                  simples={modoSimples}
                />
                <View style={styles.divider} />
                <View style={styles.contactRow}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={[styles.infoLabel, modoSimples && stylesSimple.infoLabel]}>Telefone</Text>
                    <Text style={[styles.infoValue, modoSimples && stylesSimple.infoValue]}>
                      {perfil.telefone || 'Telefone ainda não informado'}
                    </Text>
                  </View>
                  {perfil.telefone ? (
                    <Pressable
                      style={styles.callButton}
                      onPress={() => void ligarParaClinica()}
                      accessibilityRole="button"
                      accessibilityLabel={`Ligar para a clínica no número ${perfil.telefone}`}
                    >
                      <Ionicons name="call" size={18} color={theme.colors.primary} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <SectionTitle icon="time-outline" title="Horários de funcionamento" styles={styles} simples={modoSimples} />
              <View style={styles.card}>
                {DIAS.map((dia, indice) => {
                  const diaSemana = indice + 1;
                  const horarios = perfil.horarios.filter(horario => horario.diaSemana === diaSemana);
                  const hoje = diaSemana === diaHoje;
                  return (
                    <View style={[styles.scheduleRow, indice === DIAS.length - 1 && styles.scheduleLast]} key={dia}>
                      <View style={styles.scheduleDay}>
                        {hoje ? <View style={styles.todayMark} /> : null}
                        <Text style={[styles.scheduleDayText, hoje && styles.scheduleTodayText, modoSimples && stylesSimple.scheduleDayText]}>
                          {hoje ? 'Hoje' : dia}
                        </Text>
                      </View>
                      <Text style={[
                        styles.scheduleHours,
                        !horarios.length && styles.scheduleClosed,
                        hoje && horarios.length > 0 && styles.scheduleTodayText,
                        modoSimples && stylesSimple.scheduleHours,
                      ]}>
                        {horarios.length
                          ? horarios.map(horario => `${horario.inicio}–${horario.fim}`).join(', ')
                          : 'Fechado'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.servicesHeading}>
                <SectionTitle icon="medkit-outline" title="Serviços da clínica" styles={styles} simples={modoSimples} compact />
                <Text style={styles.serviceCount}>{servicos.length}</Text>
              </View>
              {servicos.length ? (
                <View style={styles.card}>
                  {servicos.map((servico, indice) => (
                    <View key={servico.id}>
                      {indice > 0 ? <View style={styles.divider} /> : null}
                      <View style={styles.serviceRow}>
                        <View style={styles.infoIcon}>
                          <Ionicons name="paw-outline" size={20} color={theme.colors.primary} />
                        </View>
                        <View style={styles.infoCopy}>
                          <Text style={[styles.infoValue, modoSimples && stylesSimple.infoValue]}>
                            {servico.nome}
                          </Text>
                          {servico.categoria ? (
                            <Text style={[styles.infoLabel, modoSimples && stylesSimple.infoLabel]}>
                              {servico.categoria}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.durationPill}>
                          <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                          <Text style={styles.durationText}>{servico.duracaoMinutos} min</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyState
                  icon="medkit-outline"
                  title="Nenhum serviço publicado"
                  subtitle="A clínica ainda não disponibilizou serviços para agendamento. Você pode conversar com a equipe para tirar dúvidas."
                  variant="plain"
                  accentColor={theme.colors.primary}
                  actionLabel="Conversar com a clínica"
                  onAction={() => router.push('/(tutor)/mensagens-clinica')}
                />
              )}

              <Pressable
                style={styles.bottomMessageButton}
                onPress={() => router.push('/(tutor)/mensagens-clinica')}
                accessibilityRole="button"
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.bottomMessageText}>Precisa de ajuda? Fale com a clínica</Text>
                <Ionicons name="chevron-forward" size={19} color={theme.colors.textMuted} />
              </Pressable>
            </>
          ) : (
            <EmptyState
              icon="business-outline"
              title="Nenhuma clínica vinculada"
              subtitle="Vincule-se a uma clínica para consultar endereço, horários e serviços."
              accentColor={theme.colors.primary}
              actionLabel="Vincular clínica"
              onAction={() => router.push('/vinculo-clinica?troca=1')}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({
  icon,
  title,
  styles,
  simples,
  compact = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.sectionHeading, compact && styles.sectionHeadingCompact]}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={simples ? 23 : 19} color={styles.sectionIconColor.color} />
      </View>
      <Text style={[styles.sectionTitle, simples && stylesSimple.sectionTitle]}>{title}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  value,
  styles,
  simples,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
  simples: boolean;
}) {
  return (
    <View style={styles.contactRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={20} color={styles.sectionIconColor.color} />
      </View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, simples && stylesSimple.infoLabel]}>{title}</Text>
        <Text style={[styles.infoValue, simples && stylesSimple.infoValue]}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: theme.colors.background },
    scroll: { flex: 1 },
    content: { paddingBottom: 36 },
    hero: { minHeight: 335, justifyContent: 'flex-end', backgroundColor: theme.pages.shared.heroBackground },
    heroImage: { width: '100%', height: '100%' },
    backButton: {
      position: 'absolute',
      left: 18,
      zIndex: 2,
      width: 44,
      height: 44,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    heroContent: { paddingHorizontal: 22, paddingTop: 92, paddingBottom: 22 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    logoFrame: {
      width: 66,
      height: 66,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.pages.shared.cardElevated,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      overflow: 'hidden',
    },
    logo: { width: '100%', height: '100%' },
    heroCopy: { flex: 1, minWidth: 0 },
    eyebrow: { color: '#d8f1df', fontSize: 10, fontWeight: '900', letterSpacing: 1.6, marginBottom: 5 },
    heroTitle: { color: '#ffffff', fontSize: 27, fontWeight: '900', letterSpacing: -0.7, lineHeight: 32 },
    locationLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
    locationText: { color: '#f0f6f1', fontSize: 13, fontWeight: '600' },
    openBadge: {
      alignSelf: 'flex-start',
      minHeight: 34,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingHorizontal: 11,
      borderRadius: 999,
      marginTop: 18,
    },
    openDot: { width: 7, height: 7, borderRadius: 4 },
    openBadgeText: { fontSize: 12, fontWeight: '800' },
    openHours: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '700', marginLeft: 2 },
    body: { paddingHorizontal: 20, paddingTop: 24 },
    loadingCard: {
      minHeight: 110,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 11,
      borderRadius: 20,
      backgroundColor: theme.pages.shared.card,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    loadingText: { color: theme.colors.textSecondary, fontSize: 14, fontWeight: '600' },
    errorCard: {
      alignItems: 'center',
      padding: 22,
      borderRadius: 22,
      backgroundColor: theme.pages.shared.card,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
    },
    stateIcon: {
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.dangerBackground,
      marginBottom: 13,
    },
    stateTitle: { color: theme.colors.text, textAlign: 'center', fontSize: 17, fontWeight: '800' },
    stateDescription: { color: theme.colors.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 7 },
    retryButton: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      marginTop: 18,
    },
    primaryButtonText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
    introBlock: { marginBottom: 20 },
    pageTitle: { color: theme.colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.65 },
    pageIntro: { color: theme.colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 7 },
    quickActions: { flexDirection: 'row', gap: 10, marginBottom: 8 },
    quickAction: {
      flex: 1,
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      borderRadius: 16,
      backgroundColor: theme.pages.shared.card,
    },
    quickActionPrimary: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary },
    quickActionText: { color: theme.colors.primary, fontSize: 14, fontWeight: '800' },
    quickActionPrimaryText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '800' },
    sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 26, marginBottom: 11 },
    sectionHeadingCompact: { marginTop: 0, marginBottom: 0 },
    sectionIcon: {
      width: 34,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: theme.colors.successBackground,
    },
    sectionIconColor: { color: theme.colors.primary },
    sectionTitle: { flex: 1, color: theme.colors.text, fontSize: 17, fontWeight: '800' },
    card: {
      paddingHorizontal: 15,
      paddingVertical: 5,
      borderRadius: 20,
      backgroundColor: theme.pages.shared.card,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      shadowColor: theme.colors.text,
      shadowOpacity: theme.mode === 'dark' ? 0 : 0.04,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 1,
    },
    contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
    infoIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.successBackground,
    },
    infoCopy: { flex: 1, minWidth: 0 },
    infoLabel: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '700' },
    infoValue: { color: theme.colors.text, fontSize: 14, fontWeight: '700', lineHeight: 20, marginTop: 3 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.pages.shared.border, marginLeft: 54 },
    callButton: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.colors.successBackground,
    },
    scheduleRow: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.pages.shared.border,
    },
    scheduleLast: { borderBottomWidth: 0 },
    scheduleDay: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
    todayMark: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.primary },
    scheduleDayText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
    scheduleTodayText: { color: theme.colors.primary, fontWeight: '900' },
    scheduleHours: { color: theme.colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
    scheduleClosed: { color: theme.colors.textMuted, fontWeight: '500' },
    servicesHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 26, marginBottom: 11 },
    serviceCount: {
      minWidth: 28,
      overflow: 'hidden',
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.colors.successBackground,
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '900',
      textAlign: 'center',
    },
    serviceRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11 },
    durationPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.pages.shared.cardSecondary,
    },
    durationText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '800' },
    bottomMessageButton: {
      minHeight: 58,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 15,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: theme.pages.shared.border,
      backgroundColor: theme.pages.shared.card,
      marginTop: 24,
    },
    bottomMessageText: { flex: 1, color: theme.colors.text, fontSize: 13, fontWeight: '800' },
  });
}

const stylesSimple = StyleSheet.create({
  eyebrow: { fontSize: 13 },
  heroTitle: { fontSize: 31, lineHeight: 37 },
  locationText: { fontSize: 17 },
  pageTitle: { fontSize: 32 },
  pageIntro: { fontSize: 19, lineHeight: 28 },
  sectionTitle: { fontSize: 21 },
  stateTitle: { fontSize: 21 },
  stateDescription: { fontSize: 18, lineHeight: 26 },
  infoLabel: { fontSize: 16 },
  infoValue: { fontSize: 18, lineHeight: 25 },
  scheduleDayText: { fontSize: 17 },
  scheduleHours: { fontSize: 17 },
});
