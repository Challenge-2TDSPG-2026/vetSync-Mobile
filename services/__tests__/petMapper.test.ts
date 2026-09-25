import { paraPetApp, paraRequestApi, type PetResponseApi } from '../petMapper';

describe('petMapper', () => {
  it('converte o contrato da API para o modelo do app, inclusive acentos', () => {
    const dto: PetResponseApi = {
      idPet: 12,
      nmPet: 'Luna',
      especie: ' CÃO ',
      sexo: 'F',
      raca: null,
      dtNascimento: '2020-12-25T00:00:00',
      idadeAnos: 5,
      peso: 12.5,
      idTutor: 7,
      fotoUrl: 'https://cdn.vetsync.com/pets/12/foto.jpg',
    };

    expect(paraPetApp(dto)).toEqual({
      id: '12',
      nome: 'Luna',
      especie: 'cachorro',
      sexo: 'femea',
      raca: '',
      dataNascimento: '2020-12-25T00:00:00',
      peso: '12.5',
      fotoUrl: 'https://cdn.vetsync.com/pets/12/foto.jpg',
    });
  });

  it('converte peso decimal e data para o payload do backend', () => {
    expect(paraRequestApi({
      id: '12',
      nome: 'Luna',
      especie: 'gato',
      sexo: 'femea',
      raca: 'Siamês',
      dataNascimento: '2020-12-25T00:00:00',
      peso: '4,2',
    })).toEqual({
      nmPet: 'Luna',
      especie: 'GATO',
      sexo: 'F',
      raca: 'Siamês',
      dtNascimento: '2020-12-25',
      peso: 4.2,
    });
  });
});
