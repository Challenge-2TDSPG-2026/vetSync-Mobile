import { validarSessao } from '../AuthContext';

const sessaoValida = {
  token: 'token',
  idUsuario: 1,
  email: 'tutor@vetsync.test',
  nome: 'Tutor',
  perfil: 'TUTOR' as const,
};

describe('AuthContext', () => {
  it('aceita somente sessões com todos os campos válidos', () => {
    expect(validarSessao(sessaoValida)).toBe(true);
    expect(validarSessao({ ...sessaoValida, token: ' ' })).toBe(false);
    expect(validarSessao({ ...sessaoValida, idUsuario: 0 })).toBe(false);
    expect(validarSessao({ ...sessaoValida, perfil: 'DESCONHECIDO' })).toBe(false);
    expect(validarSessao(null)).toBe(false);
  });
});
