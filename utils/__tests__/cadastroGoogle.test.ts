import {
  formatarCpf,
  formatarTelefone,
  validarCadastroGoogle,
  type CamposCadastroGoogle,
} from '../cadastroGoogle';

const valido: CamposCadastroGoogle = {
  nome: '',
  exigirNome: false,
  cpf: '123.456.789-01',
  telefone: '(11) 99999-9999',
  cep: '01310-100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'sp',
};

describe('formatadores', () => {
  it('formata CPF e telefone enquanto digita', () => {
    expect(formatarCpf('12345678901')).toBe('123.456.789-01');
    expect(formatarCpf('123')).toBe('123');
    expect(formatarCpf('12345678901999')).toBe('123.456.789-01');
    expect(formatarTelefone('11999999999')).toBe('(11) 99999-9999');
    expect(formatarTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(formatarTelefone('1')).toBe('1');
  });
});

describe('validarCadastroGoogle', () => {
  it('aceita os dados completos sem pedir nome, e-mail nem senha', () => {
    expect(validarCadastroGoogle(valido)).toEqual({});
  });

  it('não exige telefone', () => {
    expect(validarCadastroGoogle({ ...valido, telefone: '' })).toEqual({});
  });

  it('exige o nome só quando o Google não o informou', () => {
    expect(validarCadastroGoogle({ ...valido, exigirNome: true, nome: ' ' })).toHaveProperty('nome');
    expect(validarCadastroGoogle({ ...valido, exigirNome: true, nome: 'Maria' })).toEqual({});
  });

  it('aponta cada campo inválido', () => {
    const erros = validarCadastroGoogle({
      ...valido,
      cpf: '123',
      telefone: '119',
      cep: '123',
      logradouro: ' ',
      numero: '',
      bairro: '',
      cidade: '',
      uf: 'S',
    });
    expect(Object.keys(erros).sort()).toEqual(
      ['bairro', 'cep', 'cidade', 'cpf', 'logradouro', 'numero', 'telefone', 'uf'].sort(),
    );
  });
});
