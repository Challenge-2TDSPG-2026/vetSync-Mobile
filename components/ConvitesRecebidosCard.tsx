import React, { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import {
  useAceitarConviteRecebido,
  useConvitesRecebidos,
  useRecusarConviteRecebido,
} from '../hooks/usePetAcessos';
import { mensagemDeErro } from '../services/api/errorMessages';
import { formatarDataPtBr } from '../utils/formatarDataPtBr';
import { mostrarToast } from './ui/Toast';
import type { AppTheme } from '../constants/theme';

const ROTULO_PERMISSAO: Record<string, string> = {
  LEITURA: 'acompanhar',
  EDICAO: 'acompanhar e editar',
  VISUALIZAR_PRONTUARIO: 'acompanhar e ver o prontuário',
};

/** Convites de acesso a pets enviados ao e-mail da conta logada. Some quando não há nenhum pendente. */
export function ConvitesRecebidosCard() {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const convites = useConvitesRecebidos();
  const aceitar = useAceitarConviteRecebido();
  const recusar = useRecusarConviteRecebido();
  const ocupado = aceitar.isPending || recusar.isPending;

  const lista = convites.data ?? [];
  if (lista.length === 0) return null;

  async function responder(idConvite: string, aceitando: boolean) {
    try {
      if (aceitando) {
        await aceitar.mutateAsync(idConvite);
        mostrarToast('sucesso', 'Convite aceito', 'O pet já aparece na sua conta.');
      } else {
        await recusar.mutateAsync(idConvite);
        mostrarToast('sucesso', 'Convite recusado');
      }
    } catch (erro) {
      mostrarToast(
        'erro',
        aceitando ? 'Não foi possível aceitar' : 'Não foi possível recusar',
        mensagemDeErro(erro, 'Tente novamente em instantes.', {
          410: 'Este convite expirou ou não está mais disponível.',
        }),
      );
    }
  }

  return (
    <View style={s.wrapper} accessibilityRole="summary">
      {lista.map((c) => {
        const expira = formatarDataPtBr(c.expiraEm);
        return (
          <View key={c.idConvite} style={s.card}>
            <View style={s.header}>
              <Ionicons name="mail-open-outline" size={22} color={theme.colors.primary} />
              <Text style={s.title}>
                {c.nomeTutorOrigem} convidou você
              </Text>
            </View>
            <Text style={s.text}>
              {c.todosPets ? 'Acesso a todos os pets' : `Acesso a ${c.nomePet}`} para{' '}
              {ROTULO_PERMISSAO[c.permissao] ?? 'acompanhar'}.
              {expira ? ` Expira em ${expira}.` : ''}
            </Text>
            <View style={s.actions}>
              <Pressable
                style={[s.secondary, ocupado && s.disabled]}
                disabled={ocupado}
                onPress={() => void responder(c.idConvite, false)}
                accessibilityRole="button"
                accessibilityLabel={`Recusar convite de ${c.nomeTutorOrigem}`}
              >
                <Text style={s.secondaryText}>Recusar</Text>
              </Pressable>
              <Pressable
                style={[s.primary, ocupado && s.disabled]}
                disabled={ocupado}
                onPress={() => void responder(c.idConvite, true)}
                accessibilityRole="button"
                accessibilityLabel={`Aceitar convite de ${c.nomeTutorOrigem}`}
              >
                {aceitar.isPending && aceitar.variables === c.idConvite ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={s.primaryText}>Aceitar</Text>
                )}
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    wrapper: { gap: 12, marginBottom: 12 },
    card: {
      backgroundColor: theme.pages.home.eventCard.background,
      borderColor: theme.colors.primary,
      borderWidth: 1,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { flex: 1, fontSize: 16, fontWeight: '700', color: theme.colors.text },
    text: { fontSize: 14, lineHeight: 20, color: theme.colors.textSecondary },
    actions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    primary: {
      minWidth: 100, minHeight: 44, borderRadius: 12, paddingHorizontal: 18,
      alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary,
    },
    primaryText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: 15 },
    secondary: {
      minWidth: 100, minHeight: 44, borderRadius: 12, paddingHorizontal: 18,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary,
    },
    secondaryText: { color: theme.colors.primary, fontWeight: '600', fontSize: 15 },
    disabled: { opacity: 0.6 },
  });
