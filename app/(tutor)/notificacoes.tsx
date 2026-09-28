import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useAtualizarPreferenciasNotificacao, useMarcarNotificacaoLida, useMarcarTodasNotificacoesLidas, useNotificacoes, usePreferenciasNotificacao } from '../../hooks/useNotificacoes';
import type { PreferenciasNotificacao } from '../../services/notificacaoService';
import type { AppTheme } from '../../constants/theme';

const labels: Record<keyof PreferenciasNotificacao, string> = {
  pushAtivo: 'Notificações push',
  lembreteSeteDias: 'Lembrete com 7 dias de antecedência',
  lembreteUmDia: 'Lembrete no dia anterior',
  lembreteDuasHoras: 'Lembrete 2 horas antes',
  vacinasVencendo: 'Vacinas vencendo',
  retornosPendentes: 'Retornos pendentes',
  convitesDeAcesso: 'Convites de acesso',
  resgates: 'Resgates de recompensas',
};

export default function NotificacoesScreen() {
  const router = useRouter();
  const { autenticado } = useAuth();
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const notificacoes = useNotificacoes(autenticado);
  const preferencias = usePreferenciasNotificacao(autenticado);
  const marcarLida = useMarcarNotificacaoLida();
  const marcarTodas = useMarcarTodasNotificacoesLidas();
  const atualizar = useAtualizarPreferenciasNotificacao();
  const rascunho = preferencias.data ?? null;

  function alternar(chave: keyof PreferenciasNotificacao) {
    if (!rascunho) return;
    const proximo = { ...rascunho, [chave]: !rascunho[chave] };
    atualizar.mutate(proximo);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Voltar"><Ionicons name="chevron-back" size={25} color={theme.colors.onNavigation} /></Pressable>
        <Text style={s.headerTitle}>Notificações</Text>
        <View style={{ width: 25 }} />
      </View>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Avisos recentes</Text>
        {!!notificacoes.data?.some(item => !item.lida) && (
          <Pressable onPress={() => marcarTodas.mutate()}><Text style={s.action}>Marcar todas como lidas</Text></Pressable>
        )}
      </View>
      {notificacoes.isLoading ? <ActivityIndicator color={theme.colors.primary} /> : notificacoes.data?.length ? (
        <View style={s.card}>
          {notificacoes.data.map((item, index) => (
            <Pressable key={item.id} style={[s.notification, index > 0 && s.divider]} onPress={() => !item.lida && marcarLida.mutate(item.id)}>
              <View style={[s.dot, item.lida && s.dotRead]} />
              <View style={s.copy}><Text style={s.title}>{item.titulo}</Text><Text style={s.message}>{item.mensagem}</Text><Text style={s.date}>{new Date(item.criadaEm).toLocaleDateString('pt-BR')}</Text></View>
            </Pressable>
          ))}
        </View>
      ) : <Text style={s.muted}>Você não tem notificações novas.</Text>}
      <Text style={s.sectionTitle}>Preferências</Text>
      <View style={s.card}>
        {rascunho ? (Object.keys(labels) as (keyof PreferenciasNotificacao)[]).map((chave, index) => (
          <Pressable key={chave} style={[s.preference, index > 0 && s.divider]} onPress={() => alternar(chave)}>
            <Text style={s.preferenceText}>{labels[chave]}</Text>
            <Ionicons name={rascunho[chave] ? 'toggle' : 'toggle-outline'} size={31} color={rascunho[chave] ? theme.colors.primary : theme.colors.textMuted} />
          </Pressable>
        )) : <ActivityIndicator color={theme.colors.primary} />}
      </View>
    </ScrollView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background }, content: { paddingBottom: 32 },
    header: { height: 104, paddingTop: 44, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.navigation },
    headerTitle: { color: theme.colors.onNavigation, fontSize: 20, fontWeight: '800' }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', margin: 18, marginBottom: 10 },
    sectionTitle: { margin: 18, marginBottom: 10, color: theme.colors.text, fontSize: 17, fontWeight: '800' }, action: { color: theme.colors.primary, fontSize: 12, fontWeight: '700' },
    card: { marginHorizontal: 18, marginBottom: 20, paddingHorizontal: 16, borderRadius: 16, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
    notification: { flexDirection: 'row', paddingVertical: 15 }, divider: { borderTopWidth: 1, borderTopColor: theme.colors.border }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: theme.colors.primary, marginTop: 5, marginRight: 12 }, dotRead: { backgroundColor: theme.colors.border },
    copy: { flex: 1 }, title: { color: theme.colors.text, fontWeight: '800', fontSize: 14 }, message: { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 19 }, date: { color: theme.colors.textMuted, marginTop: 5, fontSize: 11 }, muted: { color: theme.colors.textMuted, marginHorizontal: 18, marginBottom: 20 },
    preference: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, preferenceText: { color: theme.colors.text, flex: 1, paddingRight: 12 },
  });
}
