import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useVet } from '../../context/VetContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DicaTela } from '../../components/ui/DicaTela';
import { useDicaPrimeiraVisita } from '../../hooks/useDicaPrimeiraVisita';
import { LogoutConfirmationModal } from '../../components/LogoutConfirmationModal';
import type { AppTheme, ThemePreference } from '../../constants/theme';

const TEMAS: { value: ThemePreference; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { value: 'light', label: 'Claro', icon: 'sunny-outline' },
  { value: 'dark', label: 'Escuro', icon: 'moon-outline' },
];

export default function VetPerfilScreen() {
  const router = useRouter();
  const { theme, preference, resolvedTheme, setPreference } = useTheme();
  const { modoSimples } = useAccessibility();
  const s = useMemo(() => createStyles(theme, modoSimples), [theme, modoSimples]);
  const { veterinarioAtivo } = useVet();
  const { sessao, logout } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);
  const { visivel: dicaVisivel, fechar: fecharDica } = useDicaPrimeiraVisita('vet-perfil');

  async function confirmarLogout() {
    setModalSairVisivel(false);
    await logout();
    router.replace('/login');
  }

  const nome = veterinarioAtivo?.nome ?? sessao?.nome ?? 'Veterinário';
  const iniciais = nome[0]?.toUpperCase() ?? '?';
  const crmv = veterinarioAtivo?.crmv;
  const especialidade = veterinarioAtivo?.especialidade;
  const subtitulo = [crmv ? `CRMV ${crmv}` : null, especialidade].filter(Boolean).join(' · ') || 'Médico-veterinário';

  const dados: [string, string][] = [
    ['E-mail', sessao?.email ?? '–'],
    ['CRMV', crmv ?? '–'],
    ['Especialidade', especialidade ?? 'Não informada'],
  ];

  return (
    <>
      <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.profile}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{iniciais}</Text>
          </View>
          <Text style={s.nome}>{nome}</Text>
          <Text style={s.subtitulo}>{subtitulo}</Text>
          {veterinarioAtivo?.nomeClinica ? (
            <View style={s.clinicChip}>
              <Ionicons name="business-outline" size={13} color={theme.colors.success} />
              <Text style={s.clinicChipText}>{veterinarioAtivo.nomeClinica}</Text>
            </View>
          ) : null}
        </View>

        {dicaVisivel && (
          <DicaTela
            titulo="Sua conta"
            texto="Aqui você vê seus dados profissionais, ajusta a aparência do app e sai da conta."
            accentColor={theme.colors.primary}
            onFechar={fecharDica}
          />
        )}

        <Text style={s.secLabel}>Dados profissionais</Text>
        <View style={s.card}>
          {dados.map(([label, valor], i) => (
            <View key={label} style={[s.infoRow, i < dados.length - 1 && s.infoRowDivider]}>
              <Text style={s.infoLabel}>{label}</Text>
              <Text style={s.infoValor} numberOfLines={1}>{valor}</Text>
            </View>
          ))}
        </View>

        <Text style={s.secLabel}>Aparência</Text>
        <View style={s.segmented} accessibilityRole="radiogroup">
          {TEMAS.map(opcao => {
            const selecionado = preference === opcao.value;
            return (
              <Pressable
                key={opcao.value}
                style={[s.segment, selecionado && s.segmentSelected]}
                onPress={() => void setPreference(opcao.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: selecionado }}
                accessibilityLabel={`Aparência ${opcao.label}`}
              >
                <Ionicons name={opcao.icon} size={modoSimples ? 20 : 15} color={selecionado ? theme.colors.onPrimary : theme.colors.textSecondary} />
                <Text style={[s.segmentText, selecionado && s.segmentTextSelected]}>{opcao.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {preference === 'system' && (
          <Text style={s.hint}>Seguindo o dispositivo. Atualmente: {resolvedTheme === 'dark' ? 'escuro' : 'claro'}.</Text>
        )}

        <Text style={[s.secLabel, s.secSpaced]}>Geral</Text>
        <Pressable style={({ pressed }) => [s.card, s.linkRow, pressed && s.pressed]} onPress={() => router.push('/sobre-app')} accessibilityRole="button" accessibilityLabel="Sobre o App">
          <View style={s.linkIcon}><Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} /></View>
          <View style={s.linkCopy}>
            <Text style={s.linkTitle}>Sobre o app</Text>
            <Text style={s.linkDescription}>Versão e commit de referência.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
        </Pressable>

        <Pressable style={({ pressed }) => [s.btnSair, pressed && s.pressed]} onPress={() => setModalSairVisivel(true)} accessibilityRole="button" accessibilityLabel="Sair da conta">
          <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
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

const createStyles = (theme: AppTheme, simples: boolean) => {
  const page = theme.pages.vetProfile;
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: 20, paddingBottom: 44 },

    profile: { alignItems: 'center', paddingTop: 6, paddingBottom: 8 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: page.heroBackground, alignItems: 'center', justifyContent: 'center', elevation: 3 },
    avatarText: { fontSize: 30, fontWeight: '800', color: theme.colors.brandAccent },
    nome: { fontSize: simples ? 26 : 21, fontWeight: '800', color: theme.colors.text, marginTop: 12, textAlign: 'center', letterSpacing: -0.3 },
    subtitulo: { fontSize: simples ? 17 : 13, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
    clinicChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.successBackground, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
    clinicChipText: { fontSize: simples ? 15 : 12, fontWeight: '700', color: theme.colors.success },

    secLabel: { fontSize: simples ? 15 : 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginBottom: 10, marginTop: 18, paddingLeft: 2 },
    secSpaced: { marginTop: 24 },
    card: { backgroundColor: page.card, borderRadius: 18, borderWidth: 1, borderColor: page.border, paddingHorizontal: 16, elevation: 1 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: simples ? 17 : 14 },
    infoRowDivider: { borderBottomWidth: 1, borderBottomColor: page.border },
    infoLabel: { fontSize: simples ? 17 : 13, color: theme.colors.textSecondary },
    infoValor: { flexShrink: 1, fontSize: simples ? 17 : 13, fontWeight: '700', color: theme.colors.text },

    segmented: { flexDirection: 'row', backgroundColor: page.cardSecondary, borderRadius: 14, padding: 4, gap: 4, borderWidth: 1, borderColor: page.border },
    segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: simples ? 15 : 10, borderRadius: 11 },
    segmentSelected: { backgroundColor: theme.colors.primary },
    segmentText: { fontSize: simples ? 16 : 12, fontWeight: '700', color: theme.colors.textSecondary },
    segmentTextSelected: { color: theme.colors.onPrimary },
    hint: { fontSize: simples ? 15 : 11, color: theme.colors.textSecondary, marginTop: 8, paddingLeft: 2 },

    linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
    linkIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: page.cardSecondary, alignItems: 'center', justifyContent: 'center' },
    linkCopy: { flex: 1 },
    linkTitle: { fontSize: simples ? 18 : 14, fontWeight: '800', color: theme.colors.text },
    linkDescription: { fontSize: simples ? 15 : 11, color: theme.colors.textSecondary, marginTop: 3 },

    btnSair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 26, paddingVertical: simples ? 18 : 14, borderRadius: 14, borderWidth: 1.5, borderColor: theme.colors.danger },
    btnSairText: { fontSize: simples ? 18 : 14, fontWeight: '800', color: theme.colors.danger },
    pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
  });
};
