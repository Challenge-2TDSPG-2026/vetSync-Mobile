import { voltarOuIrPara } from '../navegacao';

function criarRouter(podeVoltar: boolean) {
  return { canGoBack: jest.fn(() => podeVoltar), back: jest.fn(), replace: jest.fn() };
}

describe('voltarOuIrPara', () => {
  it('volta quando existe tela anterior', () => {
    const router = criarRouter(true);
    voltarOuIrPara(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('vai para o login quando não há histórico', () => {
    const router = criarRouter(false);
    voltarOuIrPara(router);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/login');
  });

  it('aceita outro destino de segurança', () => {
    const router = criarRouter(false);
    voltarOuIrPara(router, '/cadastro');
    expect(router.replace).toHaveBeenCalledWith('/cadastro');
  });
});
