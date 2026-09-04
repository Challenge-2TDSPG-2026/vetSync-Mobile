import React, { createContext, useContext, useMemo } from 'react';
import type { Evento, FaixaDisponibilidade, BloqueioAgenda } from '../types';
import { useAuth } from './AuthContext';
import { useEventos, useConcluirEvento } from '../hooks/useEventos';
import { usePetsPorIds } from '../hooks/usePets';
import {
  useVeterinarioAtual,
  useDisponibilidade,
  useAdicionarFaixaDisponibilidade,
  useRemoverFaixaDisponibilidade,
  useBloqueios,
  useAdicionarBloqueio,
  useRemoverBloqueio,
} from '../hooks/useVeterinario';
import { parseDataEvento } from '../utils/eventoStatus';

export interface PacienteComHistorico {
  pet: { id: string; nome: string; especie: string; raca: string; dataNascimento: string; peso: string };
  eventos: Evento[];
}

type VetContextValue = {
  veterinarioAtivoId: string | null;
  veterinarioAtivo: { id: string; nome: string; crmv: string; idClinica: string | null; nomeClinica: string | null } | null;
  carregando: boolean;

  eventos: Evento[];
  eventosAgendados: Evento[];
  eventosDeHoje: Evento[];
  concluirEvento: (id: string, observacao?: string, custo?: number) => Promise<void>;

  pacientes: PacienteComHistorico[];

  disponibilidade: FaixaDisponibilidade[];
  adicionarFaixaDisponibilidade: (faixa: { diaSemana: number; horaInicio: string; horaFim: string }) => Promise<void>;
  removerFaixaDisponibilidade: (id: string) => Promise<void>;
  bloqueios: BloqueioAgenda[];
  adicionarBloqueio: (bloqueio: { dataInicio: string; dataFim: string; motivo?: string }) => Promise<void>;
  removerBloqueio: (id: string) => Promise<void>;
};

const VetContext = createContext<VetContextValue | undefined>(undefined);

export function VetProvider({ children }: { children: React.ReactNode }) {
  const { sessao, autenticado, carregando: carregandoAuth } = useAuth();

  const ehVeterinario = sessao?.perfil === 'VETERINARIO';
  const veterinarioAtivoId = ehVeterinario ? String(sessao!.idUsuario) : null;
  const habilitado = autenticado && !carregandoAuth && ehVeterinario;

  const { data: veterinarioAtivo = null, isLoading: carregandoVet } = useVeterinarioAtual(veterinarioAtivoId, habilitado);
  const { data: eventos = [], isLoading: carregandoEventos } = useEventos(habilitado);

  const concluirMutation = useConcluirEvento();

  // Desde que o backend passou a agendar direto (sem etapa de confirmação),
  // todo evento que ainda não foi concluído nem cancelado está 'AGENDADO'.
  const eventosAgendados = useMemo(() => eventos.filter(e => e.status === 'AGENDADO'), [eventos]);

  const eventosDeHoje = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    return eventos
      .filter(e => {
        const d = parseDataEvento(e.data);
        return d >= hoje && d < amanha && e.status !== 'CANCELADO';
      })
      .sort((a, b) => parseDataEvento(a.data).getTime() - parseDataEvento(b.data).getTime());
  }, [eventos]);

  const concluirEvento = async (id: string, observacao?: string, custo?: number) => {
    await concluirMutation.mutateAsync({ id, observacao, custo });
  };

  const idsPetsUnicos = useMemo(() => [...new Set(eventos.map(e => e.petId).filter(Boolean))], [eventos]);
  const { data: petsDosPacientes = [], isLoading: carregandoPacientes } = usePetsPorIds(idsPetsUnicos, habilitado);

  const pacientes: PacienteComHistorico[] = useMemo(() => {
    return petsDosPacientes.map(pet => ({
      pet,
      eventos: eventos
        .filter(e => e.petId === pet.id)
        .sort((a, b) => parseDataEvento(b.data).getTime() - parseDataEvento(a.data).getTime()),
    }));
  }, [petsDosPacientes, eventos]);

  const { data: disponibilidade = [], isLoading: carregandoDisponibilidade } = useDisponibilidade(veterinarioAtivoId, habilitado);
  const { data: bloqueios = [], isLoading: carregandoBloqueios } = useBloqueios(veterinarioAtivoId, habilitado);

  const adicionarFaixaMutation = useAdicionarFaixaDisponibilidade(veterinarioAtivoId);
  const removerFaixaMutation = useRemoverFaixaDisponibilidade(veterinarioAtivoId);
  const adicionarBloqueioMutation = useAdicionarBloqueio(veterinarioAtivoId);
  const removerBloqueioMutation = useRemoverBloqueio(veterinarioAtivoId);

  const carregando = carregandoAuth || (habilitado && (carregandoVet || carregandoEventos || carregandoPacientes || carregandoDisponibilidade || carregandoBloqueios));

  return (
    <VetContext.Provider
      value={{
        veterinarioAtivoId,
        veterinarioAtivo,
        carregando,
        eventos,
        eventosAgendados,
        eventosDeHoje,
        concluirEvento,
        pacientes,
        disponibilidade,
        adicionarFaixaDisponibilidade: async faixa => { await adicionarFaixaMutation.mutateAsync(faixa); },
        removerFaixaDisponibilidade: async id => { await removerFaixaMutation.mutateAsync(id); },
        bloqueios,
        adicionarBloqueio: async bloqueio => { await adicionarBloqueioMutation.mutateAsync(bloqueio); },
        removerBloqueio: async id => { await removerBloqueioMutation.mutateAsync(id); },
      }}
    >
      {children}
    </VetContext.Provider>
  );
}

export function useVet(): VetContextValue {
  const ctx = useContext(VetContext);
  if (!ctx) throw new Error('useVet() deve ser usado dentro de <VetProvider>');
  return ctx;
}