import type { Pet } from '../types';

/** Mantém o pet salvo quando ele ainda pertence à lista; caso contrário, usa o primeiro disponível. */
export function resolverPetAtivoId(pets: Pet[], petAtivoId: string | null): string | null {
  if (petAtivoId !== null && pets.some(pet => pet.id === petAtivoId)) return petAtivoId;
  return pets[0]?.id ?? null;
}
