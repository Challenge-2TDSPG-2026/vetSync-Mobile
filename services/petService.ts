import { api, type ArquivoUpload } from './api/httpClient';
import { paraPetApp, paraRequestApi, type PetResponseApi } from './petMapper';
import type { Pet } from '../types';

export { ESPECIE_APP_PARA_API } from './petMapper';

/** Gateway REST dos pets. Estado local do pet ativo pertence ao PetContext/petStorage. */
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

  async enviarFoto(idPet: string, arquivo: ArquivoUpload): Promise<Pet> {
    const dto = await api.uploadMultipart<PetResponseApi>(`/pets/${idPet}/foto`, arquivo);
    return paraPetApp(dto);
  },

  async removerFoto(idPet: string): Promise<void> {
    await api.delete(`/pets/${idPet}/foto`);
  },
};
