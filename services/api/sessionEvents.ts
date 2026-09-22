type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

/** Permite que a infraestrutura HTTP avise o estado global sem depender do React. */
export function assinarExpiracaoSessao(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notificarExpiracaoSessao(): void {
  listeners.forEach(listener => listener());
}
