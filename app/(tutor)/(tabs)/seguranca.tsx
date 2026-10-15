import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import { useAccessibility } from '../../../context/AccessibilityContext';
import { useTheme } from '../../../context/ThemeContext';
import { authService } from '../../../services/authService';
import { ApiError } from '../../../services/api/httpClient';
import { BotaoGoogle } from '../../../components/auth/BotaoGoogle';
import { AuthField } from '../../../components/ui/AuthField';
import { erroDeTokenGoogle } from '../../../utils/loginSocial';
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
    vincularGoogle,
    ativarLoginBiometrico,
    desativarLoginBiometrico,
    atualizarBiometria,
  } = useAuth();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [ocupado, setOcupado] = useState(false);
  const [enviandoCodigo, setEnviandoCodigo] = useState(false);
  const [googleVinculado, setGoogleVinculado] = useState<boolean | null>(null);
  const [carregandoEstadoGoogle, setCarregandoEstadoGoogle] = useState(true);
  const [idTokenGoogle, setIdTokenGoogle] = useState<string | null>(null);
  const [modalSenhaGoogle, setModalSenhaGoogle] = useState(false);
  const [senhaGoogle, setSenhaGoogle] = useState('');
  const [erroSenhaGoogle, setErroSenhaGoogle] = useState('');
  const [vinculandoGoogle, setVinculandoGoogle] = useState(false);

  const carregarEstadoGoogle = useCallback(async () => {
    if (!sessao?.email) return;
    setCarregandoEstadoGoogle(true);
    try {
      const estado = await authService.obterEstadoContaSocial();
      setGoogleVinculado(estado.googleVinculado);
    } catch (erro) {
      setGoogleVinculado(null);
      mostrarToast('erro', 'Não foi possível consultar sua conta Google', mensagemDeErro(erro, 'Tente novamente.'));
    } finally {
      setCarregandoEstadoGoogle(false);
    }
  }, [sessao?.email]);

  useFocusEffect(
    useCallback(() => {
      void carregarEstadoGoogle();
    }, [carregarEstadoGoogle]),
  );

  const receberTokenGoogle = useCallback((idToken: string) => {
    setIdTokenGoogle(idToken);
    setSenhaGoogle('');
    setErroSenhaGoogle('');
    setModalSenhaGoogle(true);
  }, []);

  const erroAutenticacaoGoogle = useCallback((mensagem: string) => {
    mostrarToast('erro', 'Não foi possível conectar ao Google', mensagem);
  }, []);

  function fecharModalSenhaGoogle() {
    setModalSenhaGoogle(false);
    setIdTokenGoogle(null);
    setSenhaGoogle('');
    setErroSenhaGoogle('');
  }

  async function confirmarVinculoGoogle() {
    if (!sessao?.email || !idTokenGoogle) return;
    if (!senhaGoogle.trim()) {
      setErroSenhaGoogle('Informe a senha da sua conta VetSync.');
      return;
    }
    setVinculandoGoogle(true);
    setErroSenhaGoogle('');
    try {
      await vincularGoogle(idTokenGoogle, sessao.email, senhaGoogle);
      setGoogleVinculado(true);
      fecharModalSenhaGoogle();
      mostrarToast('sucesso', 'Google vinculado', 'Da próxima vez você também poderá entrar com o Google.');
    } catch (erro) {
      if (erroDeTokenGoogle(erro)) {
        fecharModalSenhaGoogle();
        mostrarToast('erro', 'A confirmação do Google expirou', 'Selecione sua conta Google novamente.');
      } else if (erro instanceof ApiError && erro.status === 401) {
        setErroSenhaGoogle('Senha incorreta. Confira a senha da sua conta VetSync.');
      } else if (erro instanceof ApiError && erro.status === 409 && /já possui uma conta/i.test(erro.message)) {
        setGoogleVinculado(true);
        fecharModalSenhaGoogle();
        mostrarToast('info', 'Google já vinculado', 'Esta conta VetSync já tem um Google associado.');
      } else {
        mostrarToast('erro', 'Não foi possível vincular o Google', mensagemDeErro(erro, 'Tente novamente.'));
      }
    } finally {
      setVinculandoGoogle(false);
    }
  }

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

        <Text style={[s.sectionTitle, modoSimples && sSimples.sectionTitle]}>Conta Google</Text>
        <View style={s.card}>
          <View style={[s.row, modoSimples && sSimples.row]}>
            <View style={[s.rowIcon, modoSimples && sSimples.rowIcon]}>
              <Ionicons name="logo-google" size={modoSimples ? 27 : 21} color={theme.colors.primary} />
            </View>
            <View style={s.rowCopy}>
              <Text style={[s.rowTitle, modoSimples && sSimples.rowTitle]}>
                {googleVinculado === true
                  ? 'Google vinculado'
                  : carregandoEstadoGoogle
                    ? 'Verificando conta Google'
                    : 'Vincule sua conta Google'}
              </Text>
              <Text style={[s.rowDescription, modoSimples && sSimples.rowDescription]}>
                {googleVinculado === true
                  ? 'Você pode usar o Google para entrar no VetSync.'
                  : carregandoEstadoGoogle
                    ? 'Consultando as opções de acesso da sua conta.'
                    : 'Entre com Google sem deixar de usar seu e-mail e senha.'}
              </Text>
            </View>
            {carregandoEstadoGoogle ? <ActivityIndicator color={theme.colors.primary} /> : null}
          </View>
          {googleVinculado === false ? (
            <View style={s.socialAction}>
              <BotaoGoogle
                label="Vincular conta Google"
                mostrarDivisor={false}
                desabilitado={vinculandoGoogle}
                onIdToken={receberTokenGoogle}
                onErro={erroAutenticacaoGoogle}
              />
            </View>
          ) : null}
          {googleVinculado === null && !carregandoEstadoGoogle ? (
            <Pressable
              style={s.retryGoogle}
              onPress={() => void carregarEstadoGoogle()}
              accessibilityRole="button"
              accessibilityLabel="Tentar consultar vínculo Google novamente"
            >
              <Text style={[s.rowDescription, { color: theme.colors.primary }]}>Tentar consultar novamente</Text>
            </Pressable>
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

      <Modal
        visible={modalSenhaGoogle}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!vinculandoGoogle) fecharModalSenhaGoogle();
        }}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalCard}>
            <Text style={[s.modalTitle, modoSimples && sSimples.rowTitle]}>Confirme sua conta</Text>
            <Text style={[s.modalDescription, modoSimples && sSimples.rowDescription]}>
              Digite a senha da conta VetSync ({sessao?.email}) para concluir o vínculo.
            </Text>
            <AuthField
              label="Senha da conta VetSync"
              icon="lock-closed-outline"
              value={senhaGoogle}
              onChangeText={valor => {
                setSenhaGoogle(valor);
                if (erroSenhaGoogle) setErroSenhaGoogle('');
              }}
              placeholder="Sua senha"
              isPassword
              textContentType="password"
              autoComplete="password"
              error={erroSenhaGoogle}
            />
            <View style={s.modalActions}>
              <Pressable
                style={[s.modalButton, s.modalCancel]}
                onPress={fecharModalSenhaGoogle}
                disabled={vinculandoGoogle}
                accessibilityRole="button"
              >
                <Text style={[s.modalCancelText, { color: theme.colors.primary }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[s.modalButton, { backgroundColor: theme.colors.primary }, vinculandoGoogle && s.pressed]}
                onPress={() => void confirmarVinculoGoogle()}
                disabled={vinculandoGoogle}
                accessibilityRole="button"
                accessibilityState={{ disabled: vinculandoGoogle, busy: vinculandoGoogle }}
              >
                {vinculandoGoogle ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[s.modalConfirmText, { color: theme.colors.onPrimary }]}>Confirmar vínculo</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    content: { paddingHorizontal: 18, paddingTop: 24 },
    intro: {
      flexDirection: 'row',
      gap: 13,
      padding: 16,
      borderRadius: 21,
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
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.pages.tutorProfile.border,
      backgroundColor: theme.pages.tutorProfile.card,
      marginBottom: 28,
      shadowColor: theme.colors.text,
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 18 },
    rowIcon: {
      width: 43,
      height: 43,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.pages.tutorProfile.cardSecondary,
    },
    rowCopy: { flex: 1, minWidth: 0 },
    socialAction: { paddingHorizontal: 16, paddingBottom: 14 },
    retryGoogle: { paddingHorizontal: 18, paddingBottom: 16, paddingTop: 2 },
    modalOverlay: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.48)' },
    modalCard: { width: '100%', maxWidth: 460, alignSelf: 'center', padding: 20, borderRadius: 22, backgroundColor: theme.pages.tutorProfile.card },
    modalTitle: { color: theme.colors.text, fontSize: 19, fontWeight: '800' },
    modalDescription: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 18 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    modalButton: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
    modalCancel: { borderWidth: 1, borderColor: theme.pages.tutorProfile.border },
    modalCancelText: { fontSize: 14, fontWeight: '800' },
    modalConfirmText: { fontSize: 14, fontWeight: '800' },
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
