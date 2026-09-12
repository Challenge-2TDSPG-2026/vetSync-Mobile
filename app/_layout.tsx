import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PetProvider, usePet } from '../context/PetContext';
import { VetProvider } from '../context/VetContext';

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
  const ehTutor = sessao?.perfil === 'TUTOR';
  const ehVeterinario = sessao?.perfil === 'VETERINARIO';
  const carregando = carregandoAuth || (ehTutor && carregandoPet);
  const ROTAS_FORA_DO_GRUPO = ['add-evento', 'add-pet', 'paciente', 'assistente'];

  useEffect(() => {
    if (carregando) return;

    const inLogin = segments[0] === 'login';
    const inTutor = segments[0] === '(tutor)';
    const inVet = segments[0] === '(vet)';
    const inAddPet = segments[0] === 'add-pet';
    const inRotaLivre = ROTAS_FORA_DO_GRUPO.includes(segments[0] as string);

    if (!autenticado) {
      if (!inLogin) router.replace('/login');
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

    if (!inLogin) router.replace('/login');
  }, [autenticado, ehTutor, ehVeterinario, onboardingConcluido, carregando, segments]);

  return (
    <>
      {ehTutor && !carregando && erroPets && (
        <View style={s.erroOverlay}>
          <Text style={s.erroTitulo}>Não foi possível carregar seus pets</Text>
          <Text style={s.erroSub}>Verifique sua conexão e tente novamente.</Text>
          <Pressable style={s.erroBtn} onPress={() => recarregarPets()}>
            <Text style={s.erroBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      )}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="(tutor)" />
        <Stack.Screen name="(vet)" />
        <Stack.Screen name="add-evento" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="add-pet" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="paciente/[id]" options={{ headerShown: true }} />
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

const s = StyleSheet.create({
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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PetProvider>
          <VetProvider>
            <RootNavigator />
          </VetProvider>
        </PetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}