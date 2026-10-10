import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthField } from '../ui/AuthField';
import { AppIcon } from '../AppIcon';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../constants/theme';

type VincularGoogleCardProps = {
  emailInicial: string;
  enviando: boolean;
  onConfirmar: (email: string, senha: string) => void;
  onCancelar: () => void;
};

/**
 * Já existe uma conta VetSync para este e-mail. O Google sozinho não basta para entrar nela:
 * a senha prova que a conta é de quem está vinculando (nada é vinculado só por o e-mail coincidir).
 */
export function VincularGoogleCard({ emailInicial, enviando, onConfirmar, onCancelar }: VincularGoogleCardProps) {
  const { theme } = useTheme();
  const s = useMemo(() => createStyles(theme), [theme]);
  const [email, setEmail] = useState(emailInicial);
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});

  function confirmar() {
    const novosErros: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) novosErros.email = 'E-mail inválido';
    if (!senha.trim()) novosErros.senha = 'Informe sua senha';
    setErros(novosErros);
    if (Object.keys(novosErros).length === 0) onConfirmar(email, senha);
  }

  return (
    <View>
      <View style={s.aviso}>
        <AppIcon name="link-outline" set="Ionicons" size={22} color={theme.colors.primary} />
        <Text style={s.avisoTexto}>
          Encontramos uma conta VetSync com este e-mail. Digite a senha dela para vincular o Google;
          nas próximas vezes você entra com um toque.
        </Text>
      </View>

      <AuthField
        label="E-mail da sua conta VetSync"
        icon="mail-outline"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={erros.email}
      />
      <AuthField
        label="Senha"
        icon="lock-closed-outline"
        value={senha}
        onChangeText={setSenha}
        placeholder="••••••••"
        isPassword
        showPassword={mostrarSenha}
        onTogglePassword={() => setMostrarSenha((v) => !v)}
        textContentType="password"
        autoComplete="password"
        error={erros.senha}
      />

      <Pressable
        style={({ pressed }) => [s.botao, pressed && { opacity: 0.86 }, enviando && { opacity: 0.65 }]}
        onPress={confirmar}
        disabled={enviando}
        accessibilityRole="button"
        accessibilityLabel={enviando ? 'Vinculando' : 'Vincular Google e entrar'}
        accessibilityState={{ disabled: enviando, busy: enviando }}
      >
        {enviando ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Text style={s.botaoTexto}>Vincular Google e entrar</Text>
        )}
      </Pressable>

      <Pressable
        style={s.cancelar}
        onPress={onCancelar}
        disabled={enviando}
        accessibilityRole="button"
        accessibilityLabel="Cancelar e voltar ao login"
      >
        <Text style={s.cancelarTexto}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    aviso: {
      flexDirection: 'row',
      gap: 12,
      padding: 14,
      marginBottom: 18,
      borderRadius: 16,
      backgroundColor: theme.colors.infoBackground,
      alignItems: 'flex-start',
    },
    avisoTexto: { flex: 1, color: theme.colors.text, fontSize: 13, lineHeight: 19 },
    botao: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 19,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    botaoTexto: { color: theme.colors.onPrimary, fontSize: 16, fontWeight: '700' },
    cancelar: { marginTop: 16, alignItems: 'center', paddingVertical: 8 },
    cancelarTexto: { color: theme.colors.primary, fontSize: 14, fontWeight: '700' },
  });
}
