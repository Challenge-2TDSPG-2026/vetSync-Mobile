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

export async function salvarPreferencias(prefs: Record<string, boolean>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICACOES, JSON.stringify(prefs));
}

export async function carregarPreferencias(): Promise<Record<string, boolean>> {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICACOES);
  if (!raw) return { ativas: true, lembrete7: true, lembreteAntes: true };
  return JSON.parse(raw);
}

export async function resetarPreferenciasLocais(): Promise<void> {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.PET_ATIVO,
    STORAGE_KEYS.ONBOARDING_CONCLUIDO,
    STORAGE_KEYS.NOTIFICACOES,
  ]);
}

export async function salvarModoSimples(ativo: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.MODO_SIMPLES, ativo ? 'true' : 'false');
}

export async function carregarModoSimples(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEYS.MODO_SIMPLES);
  return val === 'true';
}