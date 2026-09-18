import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

export async function salvarPetAtivoId(id: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.PET_ATIVO, id);
}

export async function carregarPetAtivoId(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.PET_ATIVO);
}

export async function marcarOnboardingConcluido(): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_CONCLUIDO, 'true');
}

export async function verificarOnboardingConcluido(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_CONCLUIDO);
  return val === 'true';
}

export async function resetarPreferenciasLocais(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.PET_ATIVO,
    STORAGE_KEYS.ONBOARDING_CONCLUIDO,
    STORAGE_KEYS.LEMBRETES_EVENTO,
  ]);
}

async function carregarMapaLembretes(): Promise<Record<string, string[]>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.LEMBRETES_EVENTO);
  return raw ? JSON.parse(raw) : {};
}

async function salvarMapaLembretes(mapa: Record<string, string[]>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.LEMBRETES_EVENTO, JSON.stringify(mapa));
}

export async function salvarLembretesEvento(eventoId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const mapa = await carregarMapaLembretes();
  mapa[eventoId] = ids;
  await salvarMapaLembretes(mapa);
}

export async function obterERemoverLembretesEvento(eventoId: string): Promise<string[]> {
  const mapa = await carregarMapaLembretes();
  const ids = mapa[eventoId] ?? [];
  delete mapa[eventoId];
  await salvarMapaLembretes(mapa);
  return ids;
}

export async function salvarModoSimples(ativo: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MODO_SIMPLES, ativo ? 'true' : 'false');
}

export async function carregarModoSimples(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.MODO_SIMPLES);
  return val === 'true';
}
