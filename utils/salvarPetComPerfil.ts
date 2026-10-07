import type { PerfilSaudePetAtualizacao, Pet } from '../types';

type Opcoes = {
  pet: Pet;
  perfilSaude: PerfilSaudePetAtualizacao;
  petPersistido: Pet | null;
  persistirPet: (pet: Pet) => Promise<Pet>;
  persistirPerfil: (idPet: string, perfil: PerfilSaudePetAtualizacao) => Promise<unknown>;
  aoPersistirPet: (pet: Pet) => void;
};

export class PerfilSaudePendenteError extends Error {
  constructor(public readonly pet: Pet, public readonly causa?: unknown) {
    super('O pet foi salvo, mas o perfil de saúde ficou pendente.');
    this.name = 'PerfilSaudePendenteError';
  }
}

/**
 * Salva primeiro o cadastro básico e informa o ID ao chamador antes de persistir
 * a ficha de saúde. Se a segunda chamada falhar, esse ID pode ser reutilizado na
 * próxima tentativa para não criar outro pet.
 */
export async function salvarPetComPerfil({
  pet,
  perfilSaude,
  petPersistido,
  persistirPet,
  persistirPerfil,
  aoPersistirPet,
}: Opcoes): Promise<Pet> {
  const petSalvo = petPersistido ?? await persistirPet(pet);
  if (!petPersistido) aoPersistirPet(petSalvo);
  try {
    await persistirPerfil(petSalvo.id, perfilSaude);
  } catch (erro) {
    throw new PerfilSaudePendenteError(petSalvo, erro);
  }
  return petSalvo;
}
