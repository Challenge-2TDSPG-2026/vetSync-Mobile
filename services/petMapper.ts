import type { Pet } from '../types';

export const ESPECIE_APP_PARA_API: Record<Pet['especie'], string> = {
  cachorro: 'CAO', gato: 'GATO', equino: 'EQUINO', bovino: 'BOVINO', suino: 'SUINO',
  ovino: 'OVINO', caprino: 'CAPRINO', ave: 'AVE', reptil: 'REPTIL', anfibio: 'ANFIBIO',
  peixe: 'PEIXE', roedor: 'ROEDOR', coelho: 'COELHO', furao: 'FURAO',
};

const SEXO_APP_PARA_API: Record<Pet['sexo'], string> = { macho: 'M', femea: 'F' };

export interface PetResponseApi {
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

function semAcento(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function especieApiParaApp(nmEspecie: string | null | undefined): Pet['especie'] {
  const chave = semAcento((nmEspecie ?? '').trim().toLowerCase());
  const mapa: Record<string, Pet['especie']> = {
    cao: 'cachorro', gato: 'gato', equino: 'equino', bovino: 'bovino', suino: 'suino',
    ovino: 'ovino', caprino: 'caprino', ave: 'ave', reptil: 'reptil', anfibio: 'anfibio',
    peixe: 'peixe', roedor: 'roedor', coelho: 'coelho', furao: 'furao',
  };
  return mapa[chave] ?? 'cachorro';
}

function sexoApiParaApp(sexo: string | null | undefined): Pet['sexo'] {
  const chave = (sexo ?? '').trim().toLowerCase();
  return chave === 'femea' || chave === 'fêmea' || chave === 'f' ? 'femea' : 'macho';
}

export function paraPetApp(dto: PetResponseApi): Pet {
  return {
    id: String(dto.idPet), nome: dto.nmPet, especie: especieApiParaApp(dto.especie),
    sexo: sexoApiParaApp(dto.sexo), raca: dto.raca ?? '', dataNascimento: dto.dtNascimento,
    peso: dto.peso != null ? String(dto.peso) : '',
  };
}

export function paraRequestApi(pet: Pet) {
  return {
    nmPet: pet.nome, especie: ESPECIE_APP_PARA_API[pet.especie], sexo: SEXO_APP_PARA_API[pet.sexo],
    raca: pet.raca, dtNascimento: pet.dataNascimento.slice(0, 10),
    peso: pet.peso ? parseFloat(pet.peso.replace(',', '.')) : null,
  };
}
