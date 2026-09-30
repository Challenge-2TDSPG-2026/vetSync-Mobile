import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import {
  Stack,
  ThemeProvider as NavigationThemeProvider,
  useRouter,
  useSegments,
  usePathname,
} from 'expo-router';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PetProvider, usePet } from '../context/PetContext';
import { VetProvider } from '../context/VetContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { mostrarToast, ToastHost } from '../components/ui/Toast';
import { AtivarBiometriaModal } from '../components/auth/AtivarBiometriaModal';
import { OfflineBanner } from '../components/ui/OfflineBanner';
import { createNavigationTheme } from '../constants/theme';
import { lockFontScaling } from '../utils/lockFontScaling';
import { configurarNotificacoesPush } from '../services/pushNotificationService';

lockFontScaling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
  },
});

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false && state.isInternetReachable !== false);
  }),
);

const ROTAS_FORA_DO_GRUPO = [
  'evento',
  'paciente',
  'cadastro',
  'esqueci-senha',
  'verificar-codigo',
  'redefinir-senha',
  'modo-simples',
  'pets-cadastrados',
  'gerenciar-conta',
  'notificacoes',
  'vinculo-clinica',
];
const ROTAS_EXCLUSIVAS_TUTOR = [
  'add-evento',
  'add-pet',
  'assistente',
  'responsaveis',
  'configuracoes',
  'pets-cadastrados',
  'gerenciar-conta',
];
const TRANSICAO_PAGINA = { animation: 'fade', animationDuration: 320 } as const;

function RootNavigator() {
  const { theme } = useTheme();
  const { sessao, autenticado, carregando: carregandoAuth } = useAuth();
  const { onboardingConcluido, carregando: carregandoPet, erroPets, recarregarPets } = usePet();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const ehTutor = sessao?.perfil === 'TUTOR';
  const ehVeterinario = sessao?.perfil === 'VETERINARIO';
  const carregando = carregandoAuth || (ehTutor && carregandoPet);

  useEffect(() => {
    if (carregando) return;

    const inLogin =
      segments.includes('login') || pathname === '/login' || pathname.startsWith('/login');
    const inCadastro =
      segments.includes('cadastro') || pathname === '/cadastro' || pathname.startsWith('/cadastro');
    const inEsqueciSenha =
      segments.includes('esqueci-senha') ||
      pathname === '/esqueci-senha' ||
      pathname.startsWith('/esqueci-senha');
    const inVerificarCodigo =
      segments.includes('verificar-codigo') || pathname.startsWith('/verificar-codigo');
    const inRedefinirSenha =
      segments.includes('redefinir-senha') || pathname.startsWith('/redefinir-senha');
    const inRecuperacaoSenha = inEsqueciSenha || inVerificarCodigo || inRedefinirSenha;
    const inVinculoClinica = segments.includes('vinculo-clinica') || pathname.startsWith('/vinculo-clinica');
    const inTutor = segments.includes('(tutor)') || pathname.startsWith('/(tutor)');
    const inVet = segments.includes('(vet)') || pathname.startsWith('/(vet)');
    const inAddPet = segments.includes('add-pet') || pathname === '/add-pet';
    const inRotaLivre = ROTAS_FORA_DO_GRUPO.some(
      (r) => segments.includes(r) || pathname.includes(r),
    );
    const inRotaExclusivaTutor = ROTAS_EXCLUSIVAS_TUTOR.some(
      (r) => segments.includes(r) || pathname.includes(r),
    );

    if (!autenticado) {
      if (!inLogin && !inCadastro && !inRecuperacaoSenha && !inVinculoClinica) router.replace('/login');
      return;
    }

    if (ehVeterinario) {
      if (inRotaExclusivaTutor) {
        router.replace('/(vet)');
        return;
      }
      if (inRotaLivre) return;
      if (!inVet) router.replace('/(vet)');
      return;
    }

    if (ehTutor) {
      if (!sessao?.temVinculoAtivo) {
        if (!inVinculoClinica) router.replace('/vinculo-clinica');
        return;
      }
      if (!onboardingConcluido) {
        if (!inAddPet) router.replace('/(tutor)/add-pet');
        return;
      }
      if (inRotaLivre) return;
      if (!inTutor) router.replace('/(tutor)/(tabs)');
      return;
    }

    if (!inLogin && !inCadastro) router.replace('/login');
  }, [
    autenticado,
    ehTutor,
    ehVeterinario,
    onboardingConcluido,
    carregando,
    segments,
    pathname,
    router,
  ]);

  return (
    <>
      {ehTutor && !carregando && erroPets && (
        <View
          style={[
            s.erroOverlay,
            {
              backgroundColor: theme.colors.dangerBackground,
              borderBottomColor: theme.colors.danger,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text style={[s.erroTitulo, { color: theme.colors.danger }]}>
            Não foi possível carregar seus pets
          </Text>
          <Text style={[s.erroSub, { color: theme.colors.textSecondary }]}>
            Verifique sua conexão e tente novamente.
          </Text>
          <Pressable
            style={[s.erroBtn, { backgroundColor: theme.colors.danger }]}
            onPress={() => recarregarPets()}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
            accessibilityHint="Recarrega a lista de pets"
          >
            <Text style={[s.erroBtnText, { color: theme.colors.onPrimary }]}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          ...TRANSICAO_PAGINA,
          gestureEnabled: true,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="login" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="cadastro" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="vinculo-clinica" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="esqueci-senha" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="verificar-codigo" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="redefinir-senha" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="(tutor)" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="(vet)" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="modo-simples" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="pets-cadastrados" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="gerenciar-conta" options={TRANSICAO_PAGINA} />
        <Stack.Screen name="paciente/[id]" options={{ headerShown: true, ...TRANSICAO_PAGINA }} />
        <Stack.Screen name="evento/[id]" options={{ headerShown: false, ...TRANSICAO_PAGINA }} />
      </Stack>
    </>
  );
}

function BiometricEnrollmentPrompt() {
  const {
    sessao,
    biometria,
    ativarLoginBiometrico,
    dispensarConviteBiometria,
  } = useAuth();
  const [ativando, setAtivando] = React.useState(false);
  const visivel = sessao?.perfil === 'TUTOR' && biometria.convitePendente;

  async function ativar() {
    setAtivando(true);
    try {
      await ativarLoginBiometrico();
      mostrarToast('sucesso', `Login com ${biometria.nome} ativado`);
    } catch (erro) {
      mostrarToast(
        'erro',
        'Não foi possível ativar a biometria',
        erro instanceof Error ? erro.message : 'Tente novamente.',
      );
    } finally {
      setAtivando(false);
    }
  }

  async function adiar() {
    try {
      await dispensarConviteBiometria();
    } catch {
      mostrarToast('erro', 'Não foi possível salvar sua escolha', 'Tente novamente.');
    }
  }

  return (
    <AtivarBiometriaModal
      visivel={visivel}
      nomeBiometria={biometria.nome}
      carregando={ativando}
      onAtivar={() => void ativar()}
      onAgoraNao={() => void adiar()}
    />
  );
}

function PushNotificationRegistration() {
  const { sessao } = useAuth();

  useEffect(() => {
    if (!sessao || sessao.perfil !== 'TUTOR') {
      return;
    }

    let ativo = true;
    configurarNotificacoesPush().catch((erro) => {
      if (ativo) {
        console.warn('Não foi possível registrar as notificações push.', erro);
      }
    });

    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- efeito deve rodar só quando o token ou o perfil mudarem, não a cada atualização de `sessao`
  }, [sessao?.token, sessao?.perfil]);

  return null;
}

const s = StyleSheet.create({
  themeBootstrap: { flex: 1 },
  erroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    padding: 16,
    alignItems: 'center',
  },
  erroTitulo: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  erroSub: { fontSize: 12, marginTop: 2, textAlign: 'center' },
  erroBtn: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  erroBtnText: { fontSize: 12, fontWeight: '700' },
});

function ThemedRootLayout() {
  const { theme, isDark, carregando } = useTheme();

  // A árvore de rotas só é liberada após restaurar a preferência persistida.
  // Assim evitamos renderizar telas no tema errado antes do AsyncStorage responder.
  if (carregando) {
    return (
      <View style={[s.themeBootstrap, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={createNavigationTheme(theme)}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <AuthProvider>
            <PetProvider>
              <VetProvider>
                <OfflineBanner />
                <RootNavigator />
                <PushNotificationRegistration />
                <BiometricEnrollmentPrompt />
                <ToastHost />
              </VetProvider>
            </PetProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </QueryClientProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ThemedRootLayout />
    </ThemeProvider>
  );
}
