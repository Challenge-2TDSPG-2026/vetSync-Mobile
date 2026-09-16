import { api } from './api/httpClient';
import { salvarPetAtivoId, carregarPetAtivoId } from '../storage/petStorage';
import type { Pet } from '../types';

export const ESPECIE_APP_PARA_API: Record<Pet['especie'], string> = {
  cachorro: 'CAO',
  gato: 'GATO',
  equino: 'EQUINO',
  bovino: 'BOVINO',
  suino: 'SUINO',
  ovino: 'OVINO',
  caprino: 'CAPRINO',
  ave: 'AVE',
  reptil: 'REPTIL',
  anfibio: 'ANFIBIO',
  peixe: 'PEIXE',
  roedor: 'ROEDOR',
  coelho: 'COELHO',
  furao: 'FURAO',
};

const SEXO_APP_PARA_API: Record<Pet['sexo'], string> = {
  macho: 'M',
  femea: 'F',
};

function semAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function especieApiParaApp(nmEspecie: string | null | undefined): Pet['especie'] {
  const chave = semAcento((nmEspecie ?? '').trim().toLowerCase());
  const mapa: Record<string, Pet['especie']> = {
    cao: 'cachorro',
    gato: 'gato',
    equino: 'equino',
    bovino: 'bovino',
    suino: 'suino',
    ovino: 'ovino',
    caprino: 'caprino',
    ave: 'ave',
    reptil: 'reptil',
    anfibio: 'anfibio',
    peixe: 'peixe',
    roedor: 'roedor',
    coelho: 'coelho',
    furao: 'furao',
  };
  return mapa[chave] ?? 'cachorro';
}

function sexoApiParaApp(sexo: string | null | undefined): Pet['sexo'] {
  const chave = (sexo ?? '').trim().toLowerCase();
  if (chave === 'femea' || chave === 'fêmea' || chave === 'f') return 'femea';
  return 'macho';
}

interface PetResponseApi {
  idPet: number;
  nmPet: string;
  especie: string | null;
  sexo: string | null;
  raca: string | null;
  dtNascimento: string;
  idadeAnos: number;
  peso: number | null;
  idTutor: number | null;
}

function paraPetApp(dto: PetResponseApi): Pet {
  return {
    id: String(dto.idPet),
    nome: dto.nmPet,
    especie: especieApiParaApp(dto.especie),
    sexo: sexoApiParaApp(dto.sexo),
    raca: dto.raca ?? '',
    dataNascimento: dto.dtNascimento,
    peso: dto.peso != null ? String(dto.peso) : '',
  };
}

function paraRequestApi(pet: Pet) {
  return {
    nmPet: pet.nome,
    especie: ESPECIE_APP_PARA_API[pet.especie],
    sexo: SEXO_APP_PARA_API[pet.sexo],
    raca: pet.raca,
    dtNascimento: pet.dataNascimento.slice(0, 10),
    peso: pet.peso ? parseFloat(pet.peso.replace(',', '.')) : null,
  };
}

export const petService = {
  async listarPets(): Promise<Pet[]> {
    const dtos = await api.get<PetResponseApi[]>('/pets');
    return dtos.map(paraPetApp);
  },

  async buscarPorId(id: string): Promise<Pet> {
    const dto = await api.get<PetResponseApi>(`/pets/${id}`);
    return paraPetApp(dto);
  },

  async criarPet(pet: Pet): Promise<Pet> {
    const dto = await api.post<PetResponseApi>('/pets', paraRequestApi(pet));
    return paraPetApp(dto);
  },

  async atualizarPet(pet: Pet): Promise<Pet> {
    const dto = await api.put<PetResponseApi>(`/pets/${pet.id}`, paraRequestApi(pet));
    return paraPetApp(dto);
  },

  async removerPet(id: string): Promise<void> {
    await api.delete(`/pets/${id}`);
  },

  async getPetAtivoId(): Promise<string | null> {
    return carregarPetAtivoId();
  },
  async setPetAtivoId(id: string): Promise<void> {
    await salvarPetAtivoId(id);
  },
};
