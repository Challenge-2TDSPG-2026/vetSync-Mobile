import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DicaTela } from '../../components/ui/DicaTela';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { LogoutConfirmationModal } from '../../components/LogoutConfirmationModal';
import { AppearancePreferences } from '../../components/AppearancePreferences';
import type { AppTheme } from '../../constants/theme';

export default function VetPerfilScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { veterinarioAtivo, pacientes, eventosAgendados, eventos, eventosDeHoje } = useVet();
  const { sessao, logout } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-perfil');

  function handleSair() {
    setModalSairVisivel(true);
  }

  async function confirmarLogout() {
    setModalSairVisivel(false);
    await logout();
    router.replace('/login');
  }

  const iniciais = (veterinarioAtivo?.nome ?? sessao?.nome ?? '?')[0]?.toUpperCase() ?? '?';
  const atendimentosConcluidos = eventos.filter(evento => evento.status === 'CONCLUIDO').length;

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        <View style={s.banner}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{iniciais}</Text>
          </View>
          <View style={s.bannerInfo}>
            <Text style={s.bannerNome}>{veterinarioAtivo?.nome ?? sessao?.nome}</Text>
            <Text style={s.bannerRole}>Médico-veterinário{veterinarioAtivo?.especialidade ? ` · ${veterinarioAtivo.especialidade}` : ''}</Text>
            <Text style={s.bannerEmail}>{sessao?.email}</Text>
          </View>
        </View>

        {dicaVisivel && (
          <DicaTela
            titulo="Seu perfil"
            texto="Aqui você vê seus dados profissionais e um resumo dos seus pacientes e agendamentos."
            accentColor={theme.colors.primary}
            onFechar={fecharDica}
          />
        )}

        <View style={s.statsRow}>
          <StatCard styles={s} valor={pacientes.length} label="Pacientes" />
          <StatCard styles={s} valor={eventosDeHoje.length} label="Hoje" />
          <StatCard styles={s} valor={atendimentosConcluidos} label="Concluídos" />
        </View>

        <Text style={s.secLabel}>Suporte ao tutor</Text>
        <View style={s.actionGroup}>
          <ActionRow styles={s} icon="sparkles" title="Assistente veterinário SIA" description="Estruture orientações, retornos e comunicação clínica." onPress={() => router.push('/(tutor)/assistente')} />
          <ActionRow styles={s} icon="paw-outline" title="Localizar um paciente" description="Acesse o histórico para orientar o tutor com contexto." onPress={() => router.push('/(vet)/pacientes')} />
          <ActionRow styles={s} icon="calendar-outline" title="Acompanhar consultas" description="Revise solicitações e próximos atendimentos." onPress={() => router.push('/(vet)/consultas')} last />
        </View>

        <Text style={s.secLabel}>Gestão da clínica</Text>
        <View style={s.actionGroup}>
          <ActionRow styles={s} icon="time-outline" title="Disponibilidade" description="Edite horários de atendimento e bloqueios." onPress={() => router.push('/(vet)/disponibilidade')} />
          <ActionRow styles={s} icon="gift-outline" title="Resgates de tutores" description="Valide benefícios pendentes do programa de fidelidade." onPress={() => router.push('/(vet)/resgates')} />
          <ActionRow styles={s} icon="analytics-outline" title="Relatórios da clínica" description="Acompanhe consultas, faturamento e retornos." onPress={() => router.push('/(vet)/relatorios')} last />
        </View>

        <AppearancePreferences />

        <Pressable style={s.reportButton} onPress={() => router.push('/sobre-app')} accessibilityRole="button">
          <Ionicons name="information-circle-outline" size={19} color={theme.colors.primary} />
          <View style={s.reportCopy}>
            <Text style={s.reportTitle}>Sobre o App</Text>
            <Text style={s.reportDescription}>Versão e commit de referência.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>

        <Text style={s.secLabel}>Dados profissionais</Text>
        <View style={s.card}>
          {[
            ['CRMV', veterinarioAtivo?.crmv ?? '–'],
            ['Clínica', veterinarioAtivo?.nomeClinica ?? '–'],
            ['Especialidade', veterinarioAtivo?.especialidade ?? 'Não informada'],
            ['E-mail de acesso', sessao?.email ?? '–'],
            ['Perfil', 'Veterinário'],
          ].map(([label, valor], i, arr) => (
            <View key={label}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValor}>{valor}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.divisor} />}
            </View>
          ))}
        </View>

        <Pressable style={s.btnSair} onPress={handleSair}>
          <Ionicons name="log-out-outline" size={16} color={theme.colors.onPrimary} />
          <Text style={s.btnSairText}>Sair da conta</Text>
        </Pressable>

      </ScrollView>
      <LogoutConfirmationModal
        visivel={modalSairVisivel}
        onFechar={() => setModalSairVisivel(false)}
        onConfirmarSair={confirmarLogout}
      />
    </>
  );
}

function StatCard({ styles, valor, label }: { styles: ReturnType<typeof createStyles>; valor: number; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statVal}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ styles, icon, title, description, onPress, last }: { styles: ReturnType<typeof createStyles>; icon: React.ComponentProps<typeof Ionicons>['name']; title: string; description: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[styles.actionRow, last && styles.actionRowLast]} onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      <View style={styles.actionIcon}><Ionicons name={icon} size={19} color={styles.actionIconColor.color} /></View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={styles.chevronColor.color} />
    </Pressable>
  );
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 44 },

  banner: { backgroundColor: theme.pages.vetProfile.heroBackground, borderRadius: 22, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 18, minHeight: 112, elevation: 3 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: theme.pages.vetProfile.heroAccent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: theme.colors.onPrimary },
  bannerInfo: { flex: 1 },
  bannerNome: { fontSize: 16, fontWeight: '700', color: theme.pages.vetProfile.heroText },
  bannerRole: { fontSize: 12, color: theme.pages.vetProfile.heroText, opacity: 0.9, marginTop: 4, fontWeight: '700' },
  bannerEmail: { fontSize: 11, color: theme.pages.vetProfile.heroText, opacity: 0.68, marginTop: 3 },

  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: theme.pages.vetProfile.card, borderWidth: 1, borderColor: theme.pages.vetProfile.border, borderRadius: 17, paddingVertical: 15, paddingHorizontal: 7, alignItems: 'center', elevation: 2 },
  statVal: { fontSize: 22, fontWeight: '700', color: theme.colors.primary },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },

  secLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginBottom: 10, marginTop: 4, paddingLeft: 2 },
  actionGroup: { backgroundColor: theme.pages.vetProfile.card, borderRadius: 18, borderWidth: 1, borderColor: theme.pages.vetProfile.border, paddingHorizontal: 14, marginBottom: 22, elevation: 1 },
  actionRow: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.pages.vetProfile.border },
  actionRowLast: { borderBottomWidth: 0 },
  actionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: theme.colors.successBackground, alignItems: 'center', justifyContent: 'center' },
  actionIconColor: { color: theme.colors.primary },
  actionCopy: { flex: 1 },
  actionTitle: { fontSize: 13, fontWeight: '800', color: theme.colors.text },
  actionDescription: { fontSize: 10, lineHeight: 14, color: theme.colors.textSecondary, marginTop: 3 },
  chevronColor: { color: theme.colors.textMuted },
  card: { backgroundColor: theme.pages.vetProfile.card, borderRadius: 16, borderWidth: 1, borderColor: theme.pages.vetProfile.border, paddingHorizontal: 16, marginBottom: 22 },
  divisor: { height: 1, backgroundColor: theme.pages.vetProfile.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  infoLabel: { fontSize: 13, color: theme.colors.textSecondary },
  infoValor: { fontSize: 13, fontWeight: '600', color: theme.colors.text },

  btnSair: { backgroundColor: theme.colors.danger, paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSairText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '700' },
  reportButton: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: theme.pages.vetProfile.card, borderWidth: 1, borderColor: theme.pages.vetProfile.border, borderRadius: 14, padding: 14, marginBottom: 22 },
  reportCopy: { flex: 1 },
  reportTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  reportDescription: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 3 },
});
