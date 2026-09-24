import { useCallback, useEffect, useState } from 'react';
import { marcarDicaVista, verificarDicaVista } from '../storage/petStorage';

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