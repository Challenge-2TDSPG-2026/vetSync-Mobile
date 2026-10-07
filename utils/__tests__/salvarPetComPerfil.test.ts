import type { PerfilSaudePetAtualizacao, Pet } from '../../types';
import { PerfilSaudePendenteError, salvarPetComPerfil } from '../salvarPetComPerfil';

const petFormulario: Pet = {
  id: '', nome: 'Luna', especie: 'gato', sexo: 'femea', raca: 'Siamês',
  dataNascimento: '2020-03-15', peso: '4.2',
};
const petCriado = { ...petFormulario, id: '12' };
const perfil: PerfilSaudePetAtualizacao = {
  pesoAtual: 4.2, alergias: null, medicamentosContinuos: null,
  restricoesAlimentares: null, condicoesPreExistentes: null,
  observacoesImportantes: null, contatoEmergencia: null,
  veterinarioPreferencialId: null,
};

describe('salvarPetComPerfil', () => {
  it('expõe o pet criado antes de informar que o perfil ficou pendente', async () => {
    const persistirPet = jest.fn().mockResolvedValue(petCriado);
    const persistirPerfil = jest.fn().mockRejectedValue(new Error('offline'));
    const aoPersistirPet = jest.fn();

    await expect(salvarPetComPerfil({
      pet: petFormulario, perfilSaude: perfil, petPersistido: null,
      persistirPet, persistirPerfil, aoPersistirPet,
    })).rejects.toMatchObject({ name: 'PerfilSaudePendenteError', pet: petCriado });

    expect(aoPersistirPet).toHaveBeenCalledWith(petCriado);
    expect(persistirPerfil).toHaveBeenCalledWith('12', perfil);
  });

  it('reutiliza o pet persistido na nova tentativa e não cria uma duplicata', async () => {
    const persistirPet = jest.fn();
    const persistirPerfil = jest.fn().mockResolvedValue(perfil);

    const resultado = await salvarPetComPerfil({
      pet: petFormulario, perfilSaude: perfil, petPersistido: petCriado,
      persistirPet, persistirPerfil, aoPersistirPet: jest.fn(),
    });

    expect(resultado).toEqual(petCriado);
    expect(persistirPet).not.toHaveBeenCalled();
    expect(persistirPerfil).toHaveBeenCalledWith('12', perfil);
  });

  it('distingue a falha do perfil de uma falha no cadastro básico', async () => {
    const falhaCadastro = new Error('cadastro indisponível');
    const promessa = salvarPetComPerfil({
      pet: petFormulario, perfilSaude: perfil, petPersistido: null,
      persistirPet: jest.fn().mockRejectedValue(falhaCadastro),
      persistirPerfil: jest.fn(), aoPersistirPet: jest.fn(),
    });

    await expect(promessa).rejects.toBe(falhaCadastro);
    await promessa.catch(erro => expect(erro).not.toBeInstanceOf(PerfilSaudePendenteError));
  });
});
