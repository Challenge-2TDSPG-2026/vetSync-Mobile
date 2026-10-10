import { googleClientIdDaPlataforma, loginGoogleDisponivel } from '../googleAuth';

const ids = { web: 'web-id', android: 'android-id', ios: 'ios-id' };

describe('googleAuth', () => {
  it('escolhe o client ID da plataforma em execução', () => {
    expect(googleClientIdDaPlataforma(ids, 'web')).toBe('web-id');
    expect(googleClientIdDaPlataforma(ids, 'android')).toBe('android-id');
    expect(googleClientIdDaPlataforma(ids, 'ios')).toBe('ios-id');
  });

  it('esconde o login com Google quando falta o client ID da plataforma', () => {
    expect(loginGoogleDisponivel({ web: 'web-id' }, 'android')).toBe(false);
    expect(loginGoogleDisponivel({ web: 'web-id' }, 'ios')).toBe(false);
    expect(loginGoogleDisponivel({ web: 'web-id' }, 'web')).toBe(true);
    expect(loginGoogleDisponivel({}, 'web')).toBe(false);
  });

  it('não usa o client ID web como substituto do nativo', () => {
    expect(googleClientIdDaPlataforma({ web: 'web-id' }, 'android')).toBeUndefined();
  });
});
