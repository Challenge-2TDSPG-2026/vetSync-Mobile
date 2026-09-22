import type { Pet } from '../../types';
import { resolverPetAtivoId } from '../petAtivo';

const pets: Pet[] = [
  { id: '1', nome: 'Luna', especie: 'gato', sexo: 'femea', raca: '', dataNascimento: '2020-01-01', peso: '' },
  { id: '2', nome: 'Thor', especie: 'cachorro', sexo: 'macho', raca: '', dataNascimento: '2021-01-01', peso: '' },
];

describe('resolverPetAtivoId', () => {
  it('mantém o pet ativo persistido quando ele ainda existe', () => {
    expect(resolverPetAtivoId(pets, '2')).toBe('2');
  });

  it('seleciona o primeiro pet quando o ativo foi removido', () => {
    expect(resolverPetAtivoId(pets, 'inexistente')).toBe('1');
  });

  it('não seleciona pet quando a lista está vazia', () => {
    expect(resolverPetAtivoId([], '1')).toBeNull();
  });
});
