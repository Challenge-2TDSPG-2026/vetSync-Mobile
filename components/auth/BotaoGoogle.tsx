import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../AppIcon';
import { mostrarToast } from '../ui/Toast';
import { useTheme } from '../../context/ThemeContext';
import { loginGoogleDisponivel } from '../../constants/googleAuth';
import { useGoogleAuthSession } from './GoogleAuthSessionProvider';
import type { AppTheme } from '../../constants/theme';

type BotaoGoogleProps = {
  /** Recebe o id_token do Google. A validação de verdade é feita pela API; o app não decodifica nada. */
  onIdToken: (idToken: string) => void | Promise<void>;
  onErro: (mensagem: string) => void;
  desabilitado?: boolean;
  label?: string;
  mostrarDivisor?: boolean;
};

/**
* O botão aparece SEMPRE. Sem client ID para a plataforma, o hook do Google não pode ser montado
* (ele lança erro), então usamos uma versão que só avisa o motivo ao ser tocada.
*/
export function BotaoGoogle(props: BotaoGoogleProps) {
  if (!loginGoogleDisponivel()) return <BotaoGoogleIndisponivel {...props} />;
  return <BotaoGoogleAtivo {...props} />;
}

function BotaoGoogleIndisponivel({ desabilitado = false, label, mostrarDivisor }: BotaoGoogleProps) {
  useEffect(() => {
    if (__DEV__) {
      console.warn(
        '[BotaoGoogle] Client ID do Google ausente para esta plataforma. ' +
          'Defina EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (web), EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ou ' +
          'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID no .env e reinicie com "npx expo start -c".',
      );
    }
  }, []);

  function avisar() {
    mostrarToast(
      'erro',
      'Login com Google indisponível',
      __DEV__
        ? 'Falta o client ID no .env (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID). Reinicie com "npx expo start -c".'
        : 'Entre com e-mail e senha por enquanto.',
    );
  }

  return <BotaoGoogleVisual onPress={avisar} desabilitado={desabilitado} esmaecido label={label} mostrarDivisor={mostrarDivisor} />;
}

function BotaoGoogleAtivo({ onIdToken, onErro, desabilitado = false, label, mostrarDivisor }: BotaoGoogleProps) {
  const googleAuth = useGoogleAuthSession();

  return (
    <BotaoGoogleVisual
      onPress={() => googleAuth.iniciar({ onIdToken, onErro })}
      desabilitado={desabilitado || !googleAuth.pronta}
      label={label}
      mostrarDivisor={mostrarDivisor}
    />
  );
}

type BotaoGoogleVisualProps = {
  onPress: () => void;
  desabilitado?: boolean;
  /** Visual de "não configurado": continua tocável para explicar o motivo. */
  esmaecido?: boolean;
  label?: string;
  mostrarDivisor?: boolean;
};

function BotaoGoogleVisual({ onPress, desabilitado = false, esmaecido = false, label = 'Continuar com o Google', mostrarDivisor = true }: BotaoGoogleVisualProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);

  return (
    <View>
      {mostrarDivisor ? (
        <View style={s.divisor}>
          <View style={s.linha} />
          <Text style={s.divisorTexto}>ou</Text>
          <View style={s.linha} />
        </View>
      ) : null}
      <Pressable
        style={({ pressed }) => [
          s.botao,
          pressed && s.botaoPressionado,
          (desabilitado || esmaecido) && { opacity: 0.65 },
        ]}
        onPress={onPress}
        disabled={desabilitado}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: desabilitado }}
      >
        <AppIcon name="logo-google" set="Ionicons" size={19} color={theme.colors.text} />
        <Text style={s.botaoTexto}>{label}</Text>
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
