import { useCallback, useEffect, useState } from 'react';
import { marcarDicaVista, verificarDicaVista } from '../../storage/petStorage';

/**
 * Controla se a dica explicativa de uma tela deve aparecer.
 * Aparece só uma vez por tela (por aparelho) — depois que o usuário fecha,
 * fica guardado e não volta a aparecer.
 *
 * Uso:
 *   const { visivel, fechar } = useDicaPrimeiraVisita('tutor-agenda');
 *   {visivel && <DicaTela titulo="..." texto="..." onFechar={fechar} />}
 */
export function useDicaPrimeiraVisita(idTela: string) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    let ativo = true;
    verificarDicaVista(idTela).then(jaVista => {
      if (ativo && !jaVista) setVisivel(true);
    });
    return () => {
      ativo = false;
    };
  }, [idTela]);

  const fechar = useCallback(() => {
    setVisivel(false);
    void marcarDicaVista(idTela);
  }, [idTela]);

  return { visivel, fechar };
}