import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { useTheme } from '../../../context/ThemeContext';
import { authService } from '../../../services/authService';
import { mensagemDeErro } from '../../../services/api/errorMessages';
import { mostrarToast } from '../../../components/ui/Toast';
import type { AppTheme } from '../../../constants/theme';

export default function SegurancaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { modoSimples } = useAccessibility();
  const {
    sessao,
    biometria,
    ativarLoginBiometrico,
    desativarLoginBiometrico,
    atualizarBiometria,
  } = useAuth();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [ocupado, setOcupado] = useState(false);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);

  const podeAlternar = biometria.ativada || biometria.disponivel;
  const descricaoBiometria = biometria.ativada
    ? `Login com ${biometria.nome} ativado neste aparelho.`
    : biometria.disponivel
      ? `Use ${biometria.nome} para desbloquear sua sessão neste aparelho.`
      : biometria.motivoIndisponibilidade ?? 'Biometria indisponível neste aparelho.';

  async function alterarBiometria(ativar: boolean) {
    setOcupado(true);
    try {
      if (ativar) {
        await ativarLoginBiometrico();
        mostrarToast('sucesso', 'Login biométrico ativado');
      } else {
        await desativarLoginBiometrico();
        mostrarToast('sucesso', 'Login biométrico desativado');
      }
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível atualizar a biometria',
        erro instanceof Error ? erro.message : 'Tente novamente.',
      );
      await atualizarBiometria();
    } finally {
      setOcupado(false);
    }
  }

  async function iniciarTrocaDeSenha() {
    if (!sessao?.email) return;
    setEnviandoCodigo(true);
    try {
      await authService.esqueciSenha(sessao.email);
      mostrarToast('sucesso', 'Código enviado', 'Confira seu e-mail e a pasta de spam.');
      router.push({ pathname: '/verificar-codigo', params: { email: sessao.email } });
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível enviar o código',
        mensagemDeErro(erro, 'Tente novamente em alguns instantes.'),
      );
    } finally {
      setEnviandoCodigo(false);
    }
  }

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable
          style={s.backButton}
          onPress={() => router.replace('/(tutor)/(tabs)/perfil')}
          accessibilityRole="button"
          accessibilityLabel="Voltar para conta"
        >
          <Ionicons name="arrow-back" size={23} color={theme.components.header.icon} />
        </Pressable>
        <Text style={[s.title, modoSimples && sSimples.title]}>Segurança</Text>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: Math.max(insets.bottom, 18) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.intro}>
          <View style={s.introIcon}>
            <Ionicons name="shield-checkmark-outline" size={28} color={theme.colors.primary} />
          </View>
          <View style={s.introCopy}>
            <Text style={[s.introTitle, modoSimples && sSimples.introTitle]}>Proteja seu acesso</Text>
            <Text style={[s.introText, modoSimples && sSimples.introText]}>
              Ajuste como você entra no VetSync neste aparelho.
            </Text>
          </View>
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Login no aparelho</Text>
        <View style={s.card}>
          <View style={[s.row, modoSimples && sSimples.row]}>
            <View style={[s.rowIcon, modoSimples && sSimples.rowIcon]}>
              <Ionicons name="finger-print-outline" size={modoSimples ? 29 : 22} color={theme.colors.primary} />
            </View>
            <View style={s.rowCopy}>
              <Text style={[s.rowTitle, modoSimples && sSimples.rowTitle]}>
                Login com {biometria.nome}
              </Text>
              <Text style={[s.rowDescription, modoSimples && sSimples.rowDescription]}>
                {descricaoBiometria}
              </Text>
            </View>
            {ocupado ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Switch
                value={biometria.ativada}
                onValueChange={alterarBiometria}
                disabled={!podeAlternar}
                trackColor={{ false: theme.pages.tutorProfile.border, true: theme.colors.primary }}
                thumbColor={theme.colors.onPrimary}
                accessibilityLabel={`Login com ${biometria.nome}`}
                accessibilityHint={podeAlternar ? 'Ativa ou desativa o login biométrico' : descricaoBiometria}
              />
            )}
          </View>
          {!biometria.ativada && !biometria.disponivel ? (
            <View style={s.notice}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} />
              <Text style={[s.noticeText, modoSimples && sSimples.noticeText]}>{descricaoBiometria}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Senha</Text>
        <View style={s.card}>
          <Pressable
            style={({ pressed }) => [s.row, modoSimples && sSimples.row, pressed && s.pressed]}
            onPress={iniciarTrocaDeSenha}
            disabled={enviandoCodigo}
            accessibilityRole="button"
            accessibilityLabel="Trocar senha"
            accessibilityHint="Envia um código para seu e-mail cadastrado"
            accessibilityState={{ disabled: enviandoCodigo, busy: enviandoCodigo }}
          >
            <View style={[s.rowIcon, modoSimples && sSimples.rowIcon]}>
              <Ionicons name="key-outline" size={modoSimples ? 29 : 22} color={theme.colors.primary} />
            </View>
            <View style={s.rowCopy}>
              <Text style={[s.rowTitle, modoSimples && sSimples.rowTitle]}>Trocar senha</Text>
              <Text style={[s.rowDescription, modoSimples && sSimples.rowDescription]}>
                Enviaremos um código para {sessao?.email ?? 'seu e-mail cadastrado'}.
              </Text>
            </View>
            {enviandoCodigo ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={modoSimples ? 27 : 20} color={theme.colors.textMuted} />
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      paddingHorizontal: 18,
      paddingBottom: 15,
      backgroundColor: theme.components.header.background,
      borderBottomWidth: 1,
      borderBottomColor: theme.components.header.border,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    title: { color: theme.components.header.title, fontSize: 20, fontWeight: '800' },
    content: { padding: 18 },
    intro: {
      flexDirection: 'row',
      gap: 13,
      padding: 16,
      borderRadius: 18,
      backgroundColor: theme.colors.successBackground,
      marginBottom: 25,
    },
    introIcon: { paddingTop: 2 },
    introCopy: { flex: 1 },
    introTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
    introText: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 },
    sectionTitle: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.85,
      textTransform: 'uppercase',
      marginBottom: 10,
      paddingLeft: 2,
    },
    card: {
      overflow: 'hidden',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      backgroundColor: theme.pages.tutorProfile.card,
      marginBottom: 24,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    rowIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
    },
    rowCopy: { flex: 1, minWidth: 0 },
    rowTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '800' },
    rowDescription: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
    notice: {
      flexDirection: 'row',
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: theme.pages.tutorProfile.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    noticeText: { flex: 1, color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17 },
    pressed: { opacity: 0.78 },
  });
}

const sSimples = StyleSheet.create({
  title: { fontSize: 27 },
  introTitle: { fontSize: 22 },
  introText: { fontSize: 17, lineHeight: 23 },
  sectionTitle: { fontSize: 18 },
  row: { paddingVertical: 20, gap: 16 },
  rowIcon: { width: 58, height: 58, borderRadius: 18 },
  rowTitle: { fontSize: 22 },
  rowDescription: { fontSize: 17, lineHeight: 23 },
  noticeText: { fontSize: 17, lineHeight: 23 },
});
