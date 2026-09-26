import { ApiError } from './httpClient';

/**
 * Resolve a mensagem de erro mais adequada pra mostrar num toast/alerta.
 *
 * - Quando o erro vem da API (`ApiError`), a mensagem já foi diferenciada em `httpClient.ts`
 *   por tipo (sem internet, servidor indisponível, timeout, status HTTP específico).
 * - `overridesPorStatus` permite que uma tela troque o texto de um status específico por algo
 *   mais contextual (ex: 403 -> "Você não tem permissão para alterar a foto deste pet.").
 * - `fallback` só é usado se o erro não for um `ApiError` nem um `Error` com mensagem própria
 *   (bug inesperado, valor lançado que não é um Error, etc).
 */
export function mensagemDeErro(
  erro: unknown,
  fallback: string,
  overridesPorStatus?: Record<number, string>
): string {
  if (erro instanceof ApiError) {
    const override = overridesPorStatus?.[erro.status];
    if (override) return override;
    return erro.message;
  }
  if (erro instanceof Error && erro.message) return erro.message;
  return fallback;
}