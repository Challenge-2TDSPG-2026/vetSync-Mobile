import { useCallback } from 'react';
import { criarStoreLocalVet } from './storeLocalVet';

export interface AtendimentoEmAndamento {
  eventoId: string;
  petId: string;
  inicioISO: string;
  notas: string;
}

function ehAtendimento(valor: unknown): valor is AtendimentoEmAndamento {
  if (typeof valor !== 'object' || valor === null) return false;
  const campos = valor as Record<string, unknown>;
  return ['eventoId', 'petId', 'inicioISO', 'notas'].every(campo => typeof campos[campo] === 'string');
}

const useStoreAtendimento = criarStoreLocalVet<AtendimentoEmAndamento>('@vetsync:atendimento_vet:', ehAtendimento);

/** Atendimento em andamento do veterinário (um por vez), com o rascunho do bloco de notas. Fica só no aparelho. */
export function useAtendimentoVet() {
  const { valor, carregado, definir } = useStoreAtendimento();

  const iniciar = useCallback(
    (dados: { eventoId: string; petId: string }) =>
      definir({ ...dados, inicioISO: new Date().toISOString(), notas: '' }),
    [definir],
  );

  const salvarNotas = useCallback(
    (notas: string) => {
      if (valor) void definir({ ...valor, notas }, { adiar: true });
    },
    [valor, definir],
  );

  const encerrar = useCallback(() => definir(null), [definir]);

  return { atendimento: valor, carregado, iniciar, salvarNotas, encerrar };
}
