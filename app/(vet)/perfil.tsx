import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AppIcon } from '../../components/AppIcon';
import { DicaTela } from '../../components/ui/DicaTela';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { LogoutConfirmationModal } from '../../components/LogoutConfirmationModal';
import { AppearancePreferences } from '../../components/AppearancePreferences';
import type { AppTheme } from '../../constants/theme';

export default function VetPerfilScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const { veterinarioAtivo, pacientes, eventosAgendados } = useVet();
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

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content}>

        <View style={s.banner}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{iniciais}</Text>
          </View>
          <View style={s.bannerInfo}>
            <Text style={s.bannerNome}>{veterinarioAtivo?.nome ?? sessao?.nome}</Text>
            <Text style={s.bannerRole}>{sessao?.email}</Text>
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
          <StatCard styles={s} valor={eventosAgendados.length} label="Agendados" />
        </View>

        <AppearancePreferences />

        <Text style={s.secLabel}>Dados profissionais</Text>
        <View style={s.card}>
          {[
            ['CRMV', veterinarioAtivo?.crmv ?? '–'],
            ['Clínica', veterinarioAtivo?.nomeClinica ?? '–'],
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },

  banner: { backgroundColor: theme.colors.navigation, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: theme.colors.onPrimary },
  bannerInfo: { flex: 1 },
  bannerNome: { fontSize: 16, fontWeight: '700', color: theme.colors.onNavigation },
  bannerRole: { fontSize: 11, color: theme.colors.onNavigation, opacity: 0.5, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: theme.colors.primary },
  statLabel: { fontSize: 10, color: theme.colors.textSecondary, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' },

  secLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginBottom: 10, paddingLeft: 2 },
  card: { backgroundColor: theme.colors.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border, paddingHorizontal: 16, marginBottom: 24 },
  divisor: { height: 1, backgroundColor: theme.colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13 },
  infoLabel: { fontSize: 13, color: theme.colors.textSecondary },
  infoValor: { fontSize: 13, fontWeight: '600', color: theme.colors.text },

  btnSair: { backgroundColor: theme.colors.danger, paddingVertical: 14, borderRadius: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSairText: { color: theme.colors.onPrimary, fontSize: 14, fontWeight: '700' },
});
