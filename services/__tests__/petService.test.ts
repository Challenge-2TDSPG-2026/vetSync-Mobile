import { api } from '../api/httpClient';
import { petService } from '../petService';
import type { Pet } from '../../types';

jest.mock('../api/httpClient', () => ({
  api: {
    get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn(), delete: jest.fn(),
    uploadMultipart: jest.fn(),
  },
}));

const dtoLuna = {
  idPet: 12, numero: '0012', nmPet: 'Luna', especie: 'CÃO', sexo: 'F', raca: 'Vira-lata',
  dtNascimento: '2020-12-25T00:00:00', idadeAnos: 5, peso: 12.5, idTutor: 7,
  nmTutor: 'Ana Souza', emailTutor: 'ana@example.com', telefoneTutor: '11999990000', fotoUrl: null,
};

const petLuna: Pet = {
  id: '12', nome: 'Luna', especie: 'cachorro', sexo: 'femea', raca: 'Vira-lata',
  dataNascimento: '2020-12-25T00:00:00', peso: '12.5',
};

describe('petService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista pets convertendo cada DTO para o modelo do app', async () => {
    (api.get as jest.Mock).mockResolvedValue([dtoLuna]);

    const pets = await petService.listarPets();

    expect(api.get).toHaveBeenCalledWith('/pets');
    expect(pets[0].id).toBe('12');
    expect(pets[0].nome).toBe('Luna');
    expect(pets[0].especie).toBe('cachorro');
    expect(pets[0].tutor).toEqual({ id: '7', nome: 'Ana Souza', email: 'ana@example.com', telefone: '11999990000' });
  });

  it('busca um pet pelo id', async () => {
    (api.get as jest.Mock).mockResolvedValue(dtoLuna);

    const pet = await petService.buscarPorId('12');

    expect(api.get).toHaveBeenCalledWith('/pets/12');
    expect(pet.nome).toBe('Luna');
  });

  it('cria um pet convertendo o modelo do app para o payload esperado pela API', async () => {
    (api.post as jest.Mock).mockResolvedValue(dtoLuna);

    const pet = await petService.criarPet(petLuna);

    expect(api.post).toHaveBeenCalledWith('/pets', {
      nmPet: 'Luna', especie: 'CAO', sexo: 'F', raca: 'Vira-lata',
      dtNascimento: '2020-12-25', peso: 12.5,
    });
    expect(pet.id).toBe('12');
  });

  it('atualiza um pet existente usando PUT no id correto', async () => {
    (api.put as jest.Mock).mockResolvedValue({ ...dtoLuna, nmPet: 'Luna Atualizada' });

    const pet = await petService.atualizarPet(petLuna);

    expect(api.put).toHaveBeenCalledWith('/pets/12', expect.objectContaining({ nmPet: 'Luna' }));
    expect(pet.nome).toBe('Luna Atualizada');
  });

  it('remove um pet pelo id', async () => {
    (api.delete as jest.Mock).mockResolvedValue(undefined);

    await petService.removerPet('12');

    expect(api.delete).toHaveBeenCalledWith('/pets/12');
  });

  it('envia a foto do pet via upload multipart e devolve o pet atualizado', async () => {
    (api.uploadMultipart as jest.Mock).mockResolvedValue({ ...dtoLuna, fotoUrl: '/pets/12/foto.jpg' });
    const arquivo = { uri: 'file:///foto.jpg', nome: 'foto.jpg', tipoMime: 'image/jpeg' };

    const pet = await petService.enviarFoto('12', arquivo);

    expect(api.uploadMultipart).toHaveBeenCalledWith('/pets/12/foto', arquivo);
    expect(pet.fotoUrl).toBe('https://vetsync-java.onrender.com/pets/12/foto.jpg');
  });

  it('remove a foto do pet via DELETE e devolve o pet sem foto', async () => {
    (api.delete as jest.Mock).mockResolvedValue({ ...dtoLuna, fotoUrl: null });

    const pet = await petService.removerFoto('12');

    expect(api.delete).toHaveBeenCalledWith('/pets/12/foto');
    expect(pet.fotoUrl).toBeNull();
  });
});
