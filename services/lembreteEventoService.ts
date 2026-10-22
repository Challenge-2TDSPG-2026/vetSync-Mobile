import type { Evento, Pet } from '../types';
import { obterERemoverLembretesEvento, salvarLembretesEvento } from '../storage/petStorage';
import { LEMBRETES_PADRAO, minutosDoIdLembrete } from '../utils/lembretesEvento';
import { agendarLembretes, cancelarLembretes } from './calendarService';

/**
 * Depois de reagendar um evento, troca os lembretes locais pelos do novo horário.
 * Só age se o tutor já tinha lembretes nesse evento e mantém as mesmas antecedências escolhidas;
 * lembretes antigos (sem a antecedência no id) são substituídos pelos padrão (24h e 30min).
 */
export async function reagendarLembretesEvento(evento: Evento, pet: Pet | null): Promise<string[]> {
  const idsAntigos = await obterERemoverLembretesEvento(evento.id);
  if (idsAntigos.length === 0) return [];

  await cancelarLembretes(idsAntigos);

  const antecedencias = idsAntigos
    .map(minutosDoIdLembrete)
    .filter((minutos): minutos is number => minutos !== null);

  const novosIds = await agendarLembretes(
    evento,
    pet,
    antecedencias.length > 0 ? antecedencias : LEMBRETES_PADRAO,
  );
  await salvarLembretesEvento(evento.id, novosIds);
  return novosIds;
}
