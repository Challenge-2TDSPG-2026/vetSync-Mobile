type RoteadorMinimo = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: any) => void;
};

/**
* Volta uma tela quando existe histórico; senão (ex.: página recarregada na web, link direto)
* vai para o destino de segurança. Evita o erro "GO_BACK was not handled by any navigator".
*/
export function voltarOuIrPara(router: RoteadorMinimo, destino: string = '/login'): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(destino);
  }
}
