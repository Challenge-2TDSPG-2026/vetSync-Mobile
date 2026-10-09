import { Stack } from 'expo-router';

const TRANSICAO_TUTOR = { animation: 'fade', animationDuration: 320 } as const;

export default function TutorLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...TRANSICAO_TUTOR,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="(tabs)" options={TRANSICAO_TUTOR} />
      <Stack.Screen name="configuracoes" options={TRANSICAO_TUTOR} />
      <Stack.Screen name="responsaveis" options={TRANSICAO_TUTOR} />
      <Stack.Screen name="resumo-emergencia" options={TRANSICAO_TUTOR} />
      <Stack.Screen name="plano-preventivo" options={TRANSICAO_TUTOR} />
      <Stack.Screen name="lista-espera" options={TRANSICAO_TUTOR} />
      <Stack.Screen
        name="add-pet"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="add-evento"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="agendar-servico" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="mensagens-clinica" options={TRANSICAO_TUTOR} />
      <Stack.Screen name="minha-clinica" options={TRANSICAO_TUTOR} />
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
  );
}