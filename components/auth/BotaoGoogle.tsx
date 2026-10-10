import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import { GOOGLE_CLIENT_IDS, loginGoogleDisponivel } from '../../constants/googleAuth';
import type { AppTheme } from '../../constants/theme';

// Necessário na web: fecha a janela de login do Google e devolve o resultado para o app.
WebBrowser.maybeCompleteAuthSession();

type BotaoGoogleProps = {
  /** Recebe o id_token do Google. A validação de verdade é feita pela API; o app não decodifica nada. */
  onIdToken: (idToken: string) => void | Promise<void>;
  onErro: (mensagem: string) => void;
  desabilitado?: boolean;
};

/** Só monta o botão (e o hook do Google) quando existe client ID para a plataforma atual. */
export function BotaoGoogle(props: BotaoGoogleProps) {
  if (!loginGoogleDisponivel()) return null;
  return <BotaoGoogleAtivo {...props} />;
}

function BotaoGoogleAtivo({ onIdToken, onErro, desabilitado = false }: BotaoGoogleProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const ultimaRespostaTratada = useRef<unknown>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_CLIENT_IDS.web,
    androidClientId: GOOGLE_CLIENT_IDS.android,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
    selectAccount: true,
  });

  useEffect(() => {
    if (!response || ultimaRespostaTratada.current === response) return;
    ultimaRespostaTratada.current = response;

    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (typeof idToken === 'string' && idToken) {
        void onIdToken(idToken);
      } else {
        onErro('Não recebemos a confirmação do Google. Tente novamente.');
      }
    } else if (response.type === 'error') {
      onErro('O Google não conseguiu concluir o login. Tente novamente.');
    }
    // 'cancel' e 'dismiss': a pessoa fechou a janela, não é erro.
  }, [response, onIdToken, onErro]);

  const bloqueado = desabilitado || !request;

  return (
    <View>
      <View style={s.divisor}>
        <View style={s.linha} />
        <Text style={s.divisorTexto}>ou</Text>
        <View style={s.linha} />
      </View>
      <Pressable
        style={({ pressed }) => [s.botao, pressed && s.botaoPressionado, bloqueado && { opacity: 0.65 }]}
        onPress={() => void promptAsync()}
        disabled={bloqueado}
        accessibilityRole="button"
        accessibilityLabel="Continuar com o Google"
        accessibilityState={{ disabled: bloqueado }}
      >
        <AppIcon name="logo-google" set="Ionicons" size={19} color={theme.colors.text} />
        <Text style={s.botaoTexto}>Continuar com o Google</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    divisor: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
    linha: { flex: 1, height: 1, backgroundColor: theme.pages.authentication.border },
    divisorTexto: { color: theme.colors.textSecondary, fontSize: 12, fontWeight: '600' },
    botao: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
      paddingVertical: 15,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.pages.authentication.borderStrong,
      backgroundColor: theme.pages.authentication.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    botaoPressionado: { opacity: 0.86 },
    botaoTexto: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  });
}
