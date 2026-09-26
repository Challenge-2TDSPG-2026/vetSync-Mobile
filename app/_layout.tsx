import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, StatusBar } from 'react-native';
import { Stack, ThemeProvider as NavigationThemeProvider, useRouter, useSegments, usePathname } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PetProvider, usePet } from '../context/PetContext';
import { VetProvider } from '../context/VetContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { ToastHost } from '../components/ui/Toast';
import { createNavigationTheme } from '../constants/theme';
import { lockFontScaling } from '../utils/lockFontScaling';
import { configurarNotificacoesPush } from '../services/pushNotificationService';

lockFontScaling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function RootNavigator() {
  const { sessao, autenticado, carregando: carregandoAuth } = useAuth();
  const { onboardingConcluido, carregando: carregandoPet, erroPets, recarregarPets } = usePet();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const ehTutor = sessao?.perfil === 'TUTOR';
  const ehVeterinario = sessao?.perfil === 'VETERINARIO';
  const carregando = carregandoAuth || (ehTutor && carregandoPet);
  const ROTAS_FORA_DO_GRUPO = ['add-evento', 'add-pet', 'paciente', 'assistente', 'cadastro', 'esqueci-senha', 'modo-simples', 'gerenciar-acessos'];

  useEffect(() => {
    if (carregando) return;

    const inLogin = segments.includes('login') || pathname === '/login' || pathname.startsWith('/login');
    const inCadastro = segments.includes('cadastro') || pathname === '/cadastro' || pathname.startsWith('/cadastro');
    const inTutor = segments.includes('(tutor)') || pathname.startsWith('/(tutor)');
    const inVet = segments.includes('(vet)') || pathname.startsWith('/(vet)');
    const inAddPet = segments.includes('add-pet') || pathname === '/add-pet';
    const inRotaLivre = ROTAS_FORA_DO_GRUPO.some(r => segments.includes(r) || pathname.includes(r));

    if (!autenticado) {
      if (!inLogin && !inCadastro) router.replace('/login');
      return;
    }

    if (ehVeterinario) {
      if (inRotaLivre) return;
      if (!inVet) router.replace('/(vet)');
      return;
    }

    if (ehTutor) {
      if (!onboardingConcluido) {
        if (!inAddPet) router.replace('/add-pet');
        return;
      }
      if (inRotaLivre) return;
      if (!inTutor) router.replace('/(tutor)');
      return;
    }

    if (!inLogin && !inCadastro) router.replace('/login');
  }, [autenticado, ehTutor, ehVeterinario, onboardingConcluido, carregando, segments, pathname]);

  return (
    <>
      {ehTutor && !carregando && erroPets && (
        <View style={s.erroOverlay} accessibilityRole="alert" accessibilityLiveRegion="polite">
          <Text style={s.erroTitulo}>Não foi possível carregar seus pets</Text>
          <Text style={s.erroSub}>Verifique sua conexão e tente novamente.</Text>
          <Pressable
            style={s.erroBtn}
            onPress={() => recarregarPets()}
            accessibilityRole="button"
            accessibilityLabel="Tentar novamente"
            accessibilityHint="Recarrega a lista de pets"
          >
            <Text style={s.erroBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          animationDuration: 320,
          gestureEnabled: true,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="cadastro" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="esqueci-senha" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="(tutor)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(vet)" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="add-evento"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="add-pet"
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="modo-simples" options={{ animation: 'fade_from_bottom' }} />
        <Stack.Screen name="gerenciar-acessos" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen
          name="paciente/[id]"
          options={{ headerShown: true, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="assistente"
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack>
    </>
  );
}

function PushNotificationRegistration() {
  const { sessao } = useAuth();

  useEffect(() => {
    if (!sessao) return;

    let ativo = true;
    configurarNotificacoesPush().catch((erro) => {
      if (ativo) {
        console.warn('Não foi possível registrar as notificações push.', erro);
      }
    });

    return () => {
      ativo = false;
    };
  }, [sessao?.token]);

  return null;
}

const s = StyleSheet.create({
  themeBootstrap: { flex: 1 },
  erroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 50,
    backgroundColor: '#fff2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#f3c2c2',
    padding: 16,
    alignItems: 'center',
  },
  erroTitulo: { fontSize: 13, fontWeight: '700', color: '#7a1f1f', textAlign: 'center' },
  erroSub: { fontSize: 12, color: '#9a4a4a', marginTop: 2, textAlign: 'center' },
  erroBtn: {
    marginTop: 10,
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  erroBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

function ThemedRootLayout() {
  const { theme, isDark, carregando } = useTheme();

  // A árvore de rotas só é liberada após restaurar a preferência persistida.
  // Assim evitamos renderizar telas no tema errado antes do AsyncStorage responder.
  if (carregando) {
    return (
      <View style={[s.themeBootstrap, { backgroundColor: theme.colors.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      </View>
    );
  }

  return (
    <NavigationThemeProvider value={createNavigationTheme(theme)}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.colors.background} />
      <QueryClientProvider client={queryClient}>
        <AccessibilityProvider>
          <AuthProvider>
            <PetProvider>
              <VetProvider>
                <RootNavigator />
                <PushNotificationRegistration />
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