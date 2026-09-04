import { useMemo } from 'react';
import { CONQUISTAS } from '../constants';
import type { Evento, Resgate } from '../types';

export interface ConquistaComStatus {
  id: string;
  titulo: string;
  descricao: string;
  icon: string;
  iconSet: 'Ionicons' | 'MaterialCommunityIcons';
  desbloqueada: boolean;
}

function eventoEstaAtrasado(evento: Evento): boolean {
  if (evento.status !== 'AGENDADO') return false;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const data = new Date(evento.data); data.setHours(0, 0, 0, 0);
  return data < hoje;
}

export function useConquistas(temPet: boolean, eventos: Evento[], resgates: Resgate[]): {
  conquistas: ConquistaComStatus[];
  conquistasDesbloqueadas: ConquistaComStatus[];
} {
  return useMemo(() => {
    const concluidos = eventos.filter(e => e.status === 'CONCLUIDO');
    const vacinas = eventos.filter(e => e.nomeTipoEvento.toLowerCase().includes('vacin'));
    const temVacinaAtrasada = vacinas.some(eventoEstaAtrasado);
    const temCancelado = eventos.some(e => e.status === 'CANCELADO');

    const regras: Record<string, boolean> = {
      'primeiro-cadastro': temPet,
      'primeira-consulta': concluidos.some(e => e.nomeTipoEvento.toLowerCase().includes('consult')),
      'cinco-eventos': concluidos.length >= 5,
      'vinte-eventos': concluidos.length >= 20,
      'vacinacao-em-dia': vacinas.length > 0 && !temVacinaAtrasada,
      'sem-cancelamentos': eventos.length > 0 && !temCancelado,
      'dez-registros': eventos.length >= 10,
      'primeiro-resgate': resgates.some(r => r.status === 'VALIDADO'),
    };

    const conquistas = CONQUISTAS.map(c => ({ ...c, desbloqueada: regras[c.id] ?? false }));
    return { conquistas, conquistasDesbloqueadas: conquistas.filter(c => c.desbloqueada) };
  }, [temPet, eventos, resgates]);
}