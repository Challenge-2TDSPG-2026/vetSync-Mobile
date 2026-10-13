import { useSyncExternalStore } from 'react';
import { onlineManager } from '@tanstack/react-query';

/** true quando há conexão. Usa o mesmo estado do React Query, que o app alimenta com o NetInfo. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (aoMudar) => onlineManager.subscribe(aoMudar),
    () => onlineManager.isOnline(),
    () => true,
  );
}
