import type { Evento } from '../types';
import type { SlotClinica } from '../services/clinicaService';

/**
 * O backend reagenda mantendo o mesmo profissional e serviço, então só os horários desse
 * profissional servem. Sem identificação do profissional no evento (backend antigo), mostra todos.
 */
export function filtrarSlotsDoEvento(
  slots: SlotClinica[],
  evento: Pick<Evento, 'idVeterinario' | 'idProfissionalEstetica' | 'data' | 'hora'>,
  dataConsultada: string,
): SlotClinica[] {
  const idVet = evento.idVeterinario ? Number(evento.idVeterinario) : null;
  const idEstetica = evento.idProfissionalEstetica ?? null;

  return slots.filter(slot => {
    if (idEstetica != null) {
      if (slot.tipoProfissional !== 'ESTETICA' || slot.idProfissional !== idEstetica) return false;
    } else if (idVet != null && !Number.isNaN(idVet)) {
      if (slot.tipoProfissional !== 'VETERINARIO' || slot.idProfissional !== idVet) return false;
    }
    // O horário que o tutor já tem não é uma opção "nova".
    return !(dataConsultada === evento.data && slot.hora === evento.hora);
  });
}

/** Próximos `quantidade` dias a partir de `base`, no formato AAAA-MM-DD. */
export function proximosDias(quantidade: number, base: Date = new Date()): string[] {
  return Array.from({ length: quantidade }, (_, i) => {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    return d.toLocaleDateString('sv-SE');
  });
}

export function rotuloDia(data: string): string {
  const [a, m, d] = data.split('-').map(Number);
  const dia = new Date(a, m - 1, d);
  const semana = dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return `${semana} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}