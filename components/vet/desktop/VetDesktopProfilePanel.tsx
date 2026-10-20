import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppearancePreferences } from '../../AppearancePreferences';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useVet } from '../../../context/VetContext';
import type { AppTheme } from '../../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Rota =
  | '/(tutor)/assistente'
  | '/(vet)/pacientes'
  | '/(vet)/consultas'
  | '/(vet)/disponibilidade'
  | '/(vet)/resgates'
  | '/(vet)/relatorios'
  | '/sobre-app';

type Props = { visivel: boolean; onFechar: () => void; onSair: () => void };

/** Painel de perfil do veterinário (desktop): abre ao clicar no avatar da barra superior. */
export function VetDesktopProfilePanel({ visivel, onFechar, onSair }: Props) {
  const router = useRouter();
  const { theme } = useTheme();
  const { height } = useWindowDimensions();
  const s = useMemo(() => createStyles(theme, height), [theme, height]);
  const { veterinarioAtivo, pacientes, eventos, eventosDeHoje } = useVet();
  const { sessao } = useAuth();

  const nome = veterinarioAtivo?.nome ?? sessao?.nome;
  const inicial = (nome ?? '?')[0]?.toUpperCase() ?? '?';
  const concluidos = eventos.filter(e => e.status === 'CONCLUIDO').length;

  const ir = (rota: Rota) => {
    onFechar();
    router.push(rota);
  };

  const dados: [string, string][] = [
    ['CRMV', veterinarioAtivo?.crmv ?? '–'],
    ['Clínica', veterinarioAtivo?.nomeClinica ?? '–'],
    ['Especialidade', veterinarioAtivo?.especialidade ?? 'Não informada'],
    ['E-mail de acesso', sessao?.email ?? '–'],
    ['Perfil', 'Veterinário'],
  ];

  return (
    <Modal transparent visible={visivel} animationType="fade" onRequestClose={onFechar}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar perfil" />
      <View style={s.panel} accessibilityViewIsModal>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
          <View style={s.banner}>
            <View style={s.avatar}><Text style={s.avatarText}>{inicial}</Text></View>
            <View style={s.bannerInfo}>
              <Text style={s.bannerNome} numberOfLines={1}>{nome}</Text>
              <Text style={s.bannerRole}>Médico-veterinário{veterinarioAtivo?.especialidade ? ` · ${veterinarioAtivo.especialidade}` : ''}</Text>
              <Text style={s.bannerEmail} numberOfLines={1}>{sessao?.email}</Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <Stat s={s} valor={pacientes.length} label="Pacientes" />
            <Stat s={s} valor={eventosDeHoje.length} label="Hoje" />
            <Stat s={s} valor={concluidos} label="Concluídos" />
          </View>

          <Text style={s.secLabel}>Suporte ao tutor</Text>
          <View style={s.group}>
            <Acao s={s} theme={theme} icon="sparkles" titulo="Assistente médico SIA" texto="Estrutura orientações, retornos e comunicação clínica." onPress={() => ir('/(tutor)/assistente')} />
            <Acao s={s} theme={theme} icon="paw-outline" titulo="Localizar um paciente" texto="Acesse o histórico para orientar o tutor com contexto." onPress={() => ir('/(vet)/pacientes')} />
            <Acao s={s} theme={theme} icon="calendar-outline" titulo="Acompanhar consultas" texto="Revise as solicitações e os atendimentos." onPress={() => ir('/(vet)/consultas')} last />
          </View>

          <Text style={s.secLabel}>Gestão da clínica</Text>
          <View style={s.group}>
            <Acao s={s} theme={theme} icon="time-outline" titulo="Disponibilidade" texto="Edite horários de atendimento e bloqueios." onPress={() => ir('/(vet)/disponibilidade')} />
            <Acao s={s} theme={theme} icon="gift-outline" titulo="Resgates de tutores" texto="Valide benefícios pendentes do programa de fidelidade." onPress={() => ir('/(vet)/resgates')} />
            <Acao s={s} theme={theme} icon="analytics-outline" titulo="Relatórios da clínica" texto="Acompanhe consultas, faturamento e retornos." onPress={() => ir('/(vet)/relatorios')} last />
          </View>

          <AppearancePreferences />

          <Pressable style={s.sobre} onPress={() => ir('/sobre-app')} accessibilityRole="button" accessibilityLabel="Sobre o aplicativo">
            <Ionicons name="information-circle-outline" size={19} color={theme.colors.primary} />
            <View style={s.acaoCopy}>
              <Text style={s.acaoTitulo}>Sobre o aplicativo</Text>
              <Text style={s.acaoTexto}>Versão e commit de referência.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </Pressable>

          <Text style={s.secLabel}>Dados</Text>
          <View style={[s.group, s.grupoDados]}>
            {dados.map(([label, valor], i) => (
              <View key={label} style={[s.infoRow, i < dados.length - 1 && s.infoRowBorda]}>
                <Text style={s.infoLabel}>{label}</Text>
                <Text style={s.infoValor} numberOfLines={2}>{valor}</Text>
              </View>
            ))}
          </View>

          <Pressable style={s.btnSair} onPress={onSair} accessibilityRole="button" accessibilityLabel="Sair da conta">
            <Ionicons name="log-out-outline" size={16} color={theme.colors.onPrimary} />
            <Text style={s.btnSairText}>Sair da conta</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

type Styles = ReturnType<typeof createStyles>;

function Stat({ s, valor, label }: { s: Styles; valor: number; label: string }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${label}: ${valor}`}>
      <Text style={s.statVal}>{valor}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Acao({ s, theme, icon, titulo, texto, onPress, last }: { s: Styles; theme: AppTheme; icon: IconName; titulo: string; texto: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[s.acao, last && s.acaoUltima]} onPress={onPress} accessibilityRole="button" accessibilityLabel={titulo}>
      <View style={s.acaoIcone}><Ionicons name={icon} size={19} color={theme.colors.primary} /></View>
      <View style={s.acaoCopy}>
        <Text style={s.acaoTitulo}>{titulo}</Text>
        <Text style={s.acaoTexto}>{texto}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function createStyles(theme: AppTheme, alturaJanela: number) {
  const p = theme.pages.vetProfile;
  return StyleSheet.create({
    panel: { position: 'absolute', top: 76, right: 32, width: 440, maxHeight: Math.max(320, alturaJanela - 96), borderRadius: 18, borderWidth: 1, borderColor: p.border, backgroundColor: p.background, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.22)' },
    content: { padding: 16 },

    banner: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, marginBottom: 14, borderRadius: 16, backgroundColor: p.heroBackground },
    avatar: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: p.heroAccent },
    avatarText: { fontSize: 18, fontWeight: '700', color: theme.colors.onPrimary },
    bannerInfo: { flex: 1 },
    bannerNome: { fontSize: 16, fontWeight: '700', color: p.heroText },
    bannerRole: { fontSize: 12, fontWeight: '700', color: p.heroText, opacity: 0.9, marginTop: 4 },
    bannerEmail: { fontSize: 11, color: p.heroText, opacity: 0.7, marginTop: 3 },

    statsRow: { flexDirection: 'row', gap: 9, marginBottom: 20 },
    stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    statVal: { fontSize: 22, fontWeight: '700', color: theme.colors.primary },
    statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', color: theme.colors.textSecondary, marginTop: 4 },

    secLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.colors.textSecondary, marginBottom: 10, paddingLeft: 2 },
    group: { paddingHorizontal: 14, marginBottom: 20, borderRadius: 16, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },
    grupoDados: { paddingHorizontal: 16 },
    acao: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: p.border },
    acaoUltima: { borderBottomWidth: 0 },
    acaoIcone: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.successBackground },
    acaoCopy: { flex: 1 },
    acaoTitulo: { fontSize: 13, fontWeight: '800', color: theme.colors.text },
    acaoTexto: { fontSize: 11, lineHeight: 15, color: theme.colors.textSecondary, marginTop: 2 },

    sobre: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, marginBottom: 20, borderRadius: 14, borderWidth: 1, borderColor: p.border, backgroundColor: p.card },

    infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 12 },
    infoRowBorda: { borderBottomWidth: 1, borderBottomColor: p.border },
    infoLabel: { fontSize: 13, color: theme.colors.textSecondary },
    infoValor: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right', color: theme.colors.text },

    btnSair: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10, backgroundColor: theme.colors.danger },
    btnSairText: { fontSize: 14, fontWeight: '700', color: theme.colors.onPrimary },
  });
}