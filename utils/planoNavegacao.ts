import type { useRouter } from 'expo-router';
import type { PlanoItem } from './planoPreventivo';

/**
 * Atalho para agendar a partir do plano: abre o agendamento já com o pet e o
 * serviço sugerido (casado pelo nome com o catálogo de serviços da clínica).
 */
export function abrirAgendamentoDoPlano(router: Pick<ReturnType<typeof useRouter>, 'push'>, item: PlanoItem, petId: string): void {
  router.push({
    pathname: '/(tutor)/agendar-servico',
    params: { petId, servico: item.servicoSugerido },
  });
}

/** Casa o nome sugerido pelo plano com um serviço do catálogo da clínica. */
export function encontrarServicoPorNome<T extends { nome: string }>(servicos: T[], nomeSugerido?: string | null): T | null {
  if (!nomeSugerido) return null;
  const norm = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const alvo = norm(nomeSugerido);
  if (!alvo) return null;
  const exato = servicos.find(s => norm(s.nome) === alvo);
  if (exato) return exato;
  return servicos.find(s => {
    const n = norm(s.nome);
    return n && (alvo.includes(n) || n.includes(alvo));
  }) ?? null;
}