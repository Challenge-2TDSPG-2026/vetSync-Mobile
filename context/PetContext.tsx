import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Pet, Evento } from '../types';
import { XP_POR_EVENTO, NIVEIS } from '../constants';
import {
  salvarPetAtivoId,
  carregarPetAtivoId,
  limparPetAtivoId,
  resetarPreferenciasLocais,
} from '../storage/petStorage';
import { useAuth } from './AuthContext';
import { usePets, useCriarPet, useRemoverPet } from '../hooks/usePets';
import { useEventos } from '../hooks/useEventos';
import { resolverPetAtivoId } from '../utils/petAtivo';

export interface NivelInfo {
  nivel: number;
  titulo: string;
  xpAtual: number;
  xpMinAtual: number;
  xpMinProximo: number | null;
  progressoPct: number;
  xpFaltaProximoNivel: number | null;
}

type PetContextValue = {
  pets: Pet[];
  petAtivo: Pet | null;
  petAtivoId: string | null;
  selecionarPet: (id: string) => void;
  adicionarPet: (pet: Pet) => Promise<void>;
  removerPet: (id: string) => Promise<void>;
  salvandoPet: boolean;

  eventos: Evento[];
  carregandoEventos: boolean;

  erroPets: boolean;
  recarregarPets: () => void;

  onboardingConcluido: boolean;
  carregando: boolean;
  resetarPreferencias: () => Promise<void>;

  nivelInfo: NivelInfo;
};

const PetContext = createContext<PetContextValue | undefined>(undefined);

export function PetProvider({ children }: { children: React.ReactNode }) {
  const { autenticado, carregando: carregandoAuth } = useAuth();

  const [petAtivoId, setPetAtivoIdState] = useState<string | null>(null);
  const [carregandoLocal, setCarregandoLocal] = useState(true);

  useEffect(() => {
    async function carregarLocal() {
      const ativoSalvo = await carregarPetAtivoId();
      setPetAtivoIdState(ativoSalvo);
      setCarregandoLocal(false);
    }
    carregarLocal();
  }, []);

  const habilitado = autenticado && !carregandoAuth;

  const { data: pets = [], isLoading: carregandoPets, isError: erroPets, refetch: recarregarPets } = usePets(habilitado);
  const { data: eventosTodos = [], isLoading: carregandoEventos } = useEventos(habilitado);

  const criarPetMutation = useCriarPet();
  const removerPetMutation = useRemoverPet();

  useEffect(() => {
    if (carregandoPets) return;
    const novoAtivo = resolverPetAtivoId(pets, petAtivoId);
    if (novoAtivo === petAtivoId) return;
    setPetAtivoIdState(novoAtivo);
    if (novoAtivo) {
      void salvarPetAtivoId(novoAtivo);
    } else {
      void limparPetAtivoId();
    }
  }, [pets, carregandoPets, petAtivoId]);

  const petAtivo = useMemo(() => pets.find(p => p.id === petAtivoId) ?? null, [pets, petAtivoId]);

  const selecionarPet = useCallback((id: string) => {
    setPetAtivoIdState(id);
    salvarPetAtivoId(id);
  }, []);

  const adicionarPet = useCallback(async (pet: Pet) => {
    const criado = await criarPetMutation.mutateAsync(pet);
    setPetAtivoIdState(criado.id);
    await salvarPetAtivoId(criado.id);
  }, [criarPetMutation]);

  const removerPet = useCallback(async (id: string) => {
    await removerPetMutation.mutateAsync(id);
  }, [removerPetMutation]);

  const eventos = useMemo(
    () => eventosTodos.filter(e => e.petId === petAtivoId),
    [eventosTodos, petAtivoId]
  );

  const resetarPreferencias = useCallback(async () => {
    await resetarPreferenciasLocais();
    setPetAtivoIdState(null);
  }, []);


  const onboardingConcluido = pets.length > 0;

  const carregando = carregandoAuth || carregandoLocal || (habilitado && carregandoPets);

  const eventosConcluidosTotal = useMemo(
    () => eventos.filter(e => e.status === 'CONCLUIDO').length,
    [eventos]
  );

  const nivelInfo: NivelInfo = useMemo(() => {
    const xpAtual = eventosConcluidosTotal * XP_POR_EVENTO;
    let atual: (typeof NIVEIS)[number] = NIVEIS[0];
    let proximo: (typeof NIVEIS)[number] | null = null;
    for (let i = 0; i < NIVEIS.length; i++) {
      if (xpAtual >= NIVEIS[i].xpMin) {
        atual = NIVEIS[i];
        proximo = NIVEIS[i + 1] ?? null;
      }
    }
    const xpMinAtual = atual.xpMin;
    const xpMinProximo = proximo?.xpMin ?? null;
    const progressoPct = xpMinProximo
      ? Math.min(100, Math.round(((xpAtual - xpMinAtual) / (xpMinProximo - xpMinAtual)) * 100))
      : 100;
    return {
      nivel: atual.nivel,
      titulo: atual.titulo,
      xpAtual,
      xpMinAtual,
      xpMinProximo,
      progressoPct,
      xpFaltaProximoNivel: xpMinProximo ? xpMinProximo - xpAtual : null,
    };
  }, [eventosConcluidosTotal]);

  return (
    <PetContext.Provider
      value={{
        pets,
        petAtivo,
        petAtivoId,
        selecionarPet,
        adicionarPet,
        removerPet,
        salvandoPet: criarPetMutation.isPending,
        eventos,
        carregandoEventos,
        erroPets,
        recarregarPets: () => { recarregarPets(); },
        onboardingConcluido,
        carregando,
        resetarPreferencias,
        nivelInfo,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet(): PetContextValue {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error('usePet() deve ser usado dentro de <PetProvider>');
  return ctx;
}
