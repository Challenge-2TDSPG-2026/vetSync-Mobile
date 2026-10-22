import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useVet } from '../../../context/VetContext';
import type { AppTheme } from '../../../constants/theme';
import { VetAparenciaSegmentada } from '../VetAparenciaSegmentada';
import { VetAvatar } from '../VetAvatar';

type Props = { visivel: boolean; onFechar: () => void; onSair: () => void; onAlterarFoto: () => void };

/** Painel de perfil do veterinário (desktop): abre ao clicar no avatar da barra superior. Mesmos elementos da Conta mobile. */
export function VetDesktopProfilePanel({ visivel, onFechar, onSair, onAlterarFoto }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const s = useMemo(() => createStyles(theme, height), [theme, height]);
  const { veterinarioAtivo } = useVet();
  const { sessao } = useAuth();

  const nome = veterinarioAtivo?.nome ?? sessao?.nome ?? 'Veterinário';
  const crmv = veterinarioAtivo?.crmv;
  const especialidade = veterinarioAtivo?.especialidade;
  const subtitulo = [crmv ? `CRMV ${crmv}` : null, especialidade].filter(Boolean).join(' · ') || 'Médico-veterinário';

  const dados: [string, string][] = [
    ['E-mail', sessao?.email ?? '–'],
    ['CRMV', crmv ?? '–'],
    ['Especialidade', especialidade ?? 'Não informada'],
  ];

  return (
    <Modal transparent visible={visivel} animationType="fade" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar perfil" />
      <View style={s.panel} accessibilityViewIsModal>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <View style={s.profile}>
            <VetAvatar nome={nome} size={80} mostrarCamera onPress={onAlterarFoto} accessibilityLabel="Alterar minha foto" />
            <Pressable onPress={onAlterarFoto} hitSlop={8} accessibilityRole="button" accessibilityLabel="Alterar foto">
              <Text style={s.alterarFoto}>Alterar foto</Text>
            </Pressable>
            <Text style={s.nome} numberOfLines={1}>{nome}</Text>
            <Text style={s.subtitulo}>{subtitulo}</Text>
            {veterinarioAtivo?.nomeClinica ? (
              <View style={s.clinicChip}>
                <Ionicons name="business-outline" size={13} color={theme.colors.success} />
                <Text style={s.clinicChipText}>{veterinarioAtivo.nomeClinica}</Text>
              </View>
            ) : null}
          </View>

          <Text style={s.secLabel}>Dados profissionais</Text>
          <View style={s.group}>
            {dados.map(([label, valor], i) => (
              <View key={label} style={[s.infoRow, i < dados.length - 1 && s.infoRowBorda]}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValor} numberOfLines={2}>{valor}</Text>
              </View>
            ))}
          </View>

          <Text style={s.secLabel}>Aparência</Text>
          <VetAparenciaSegmentada />

          <Text style={[s.secLabel, s.secSpaced]}>Geral</Text>
          <Pressable
            style={s.sobre}
            onPress={() => {
              onFechar();
              router.push('/sobre-app');
            }}
            accessibilityRole="button"
            accessibilityLabel="Sobre o aplicativo"
          >
            <Ionicons name="information-circle-outline" size={19} color={theme.colors.primary} />
            <View style={s.acaoCopy}>
              <Text style={s.acaoTitulo}>Sobre o app</Text>
              <Text style={s.acaoTexto}>Versão e commit de referência.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>

          <Pressable style={s.btnSair} onPress={onSair} accessibilityRole="button" accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={17} color={theme.colors.danger} />
            <Text style={s.btnSairText}>Sair da conta</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(theme: AppTheme, alturaJanela: number) {
  const p = theme.pages.vetProfile;
  return StyleSheet.create({
    panel: { position: 'absolute', top: 76, right: 32, width: 400, maxHeight: Math.max(320, alturaJanela - 96), borderRadius: 18, borderWidth: 1, borderColor: p.border, backgroundColor: p.background, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.22)' },
    content: { padding: 20 },

    profile: { alignItems: 'center', paddingBottom: 6 },
    alterarFoto: { fontSize: 12, fontWeight: '700', color: theme.colors.primary, marginTop: 8 },
    nome: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginTop: 10, textAlign: 'center' },
    subtitulo: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
    clinicChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.successBackground, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10 },
    clinicChipText: { fontSize: 12, fontWeight: '700', color: theme.colors.success },

    secLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginBottom: 10, marginTop: 18, paddingLeft: 2 },
    secSpaced: { marginTop: 22 },
    group: { paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
    infoRowBorda: { borderBottomWidth: 1, borderBottomColor: p.border },
    infoLabel: { fontSize: 13, color: theme.colors.textSecondary },
    infoValor: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right', color: theme.colors.text },

    acaoCopy: { flex: 1 },
    acaoTitulo: { fontSize: 13, fontWeight: '800', color: theme.colors.text },
    acaoTexto: { fontSize: 11, lineHeight: 15, color: theme.colors.textSecondary, marginTop: 2 },
    sobre: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },

    btnSair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: theme.colors.danger, marginTop: 22 },
    btnSairText: { fontSize: 14, fontWeight: '800', color: theme.colors.danger },
  });
}
