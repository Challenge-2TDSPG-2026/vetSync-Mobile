import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query, QueryKey } from '@tanstack/react-query';
import { STORAGE_KEYS } from '../constants';

/** Por quanto tempo os dados salvos no aparelho continuam sendo mostrados sem conexão. */
export const CACHE_OFFLINE_VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

/** Troque ao mudar o formato dos dados salvos: descarta o cache antigo em vez de exibir dados incompatíveis. */
export const CACHE_OFFLINE_VERSAO = 'v1';

const SEGMENTOS_ESSENCIAIS = new Set(['carteira-vacinacao', 'perfil-saude', 'proximas-acoes']);

/**
 * Só o essencial vai para o aparelho: lista de pets, dados básicos de cada pet, carteira de vacinação,
 * perfil de saúde e próximas ações. Prontuário, acessos, atividades, tutor, mensagens etc. NÃO são salvos
 * (o AsyncStorage não é criptografado).
 */
export function deveSalvarOffline(queryKey: QueryKey): boolean {
  if (queryKey[0] !== 'pets') return false;
  if (queryKey.length === 1) return true; // ['pets']: lista
  const idPet = queryKey[1];
  if (typeof idPet !== 'string' || idPet === 'por-ids' || idPet === '') return false;
  if (queryKey.length === 2) return true; // ['pets', id]: dados básicos
  return queryKey.length === 3 && SEGMENTOS_ESSENCIAIS.has(String(queryKey[2]));
}

export function deveSalvarQuery(query: Pick<Query, 'queryKey' | 'state'>): boolean {
  return query.state.status === 'success' && deveSalvarOffline(query.queryKey);
}

export const persisterCacheOffline = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: STORAGE_KEYS.CACHE_OFFLINE,
  throttleTime: 1_000,
});

/** Chamado ao sair da conta ou quando a sessão expira, para não deixar dados do pet no aparelho. */
export async function limparCacheOffline(): Promise<void> {
  try {
    await persisterCacheOffline.removeClient();
  } catch {
    await AsyncStorage.removeItem(STORAGE_KEYS.CACHE_OFFLINE);
  }
}
